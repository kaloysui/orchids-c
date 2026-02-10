import sys
import os
import json
import re
import urllib.parse
import requests

# Add cloned repo to path
current_dir = os.path.dirname(os.path.abspath(__file__))
musicxmatch_path = os.path.join(current_dir, 'musicxmatch_api', 'src')
sys.path.append(musicxmatch_path)

try:
    from musicxmatch_api import MusixMatchAPI
except ImportError:
    MusixMatchAPI = None

def clean_name(name):
    if not name: return ""
    # Remove common suffixes in music titles
    name = re.sub(r'\(.*?\)', '', name)
    name = re.sub(r'\[.*?\]', '', name)
    name = re.sub(r'ft\..*', '', name, flags=re.IGNORECASE)
    name = re.sub(r'feat\..*', '', name, flags=re.IGNORECASE)
    name = re.sub(r'official video.*', '', name, flags=re.IGNORECASE)
    name = re.sub(r'lyrics.*', '', name, flags=re.IGNORECASE)
    name = re.sub(r'audio.*', '', name, flags=re.IGNORECASE)
    name = re.sub(r'video.*', '', name, flags=re.IGNORECASE)
    name = re.sub(r'full version.*', '', name, flags=re.IGNORECASE)
    name = re.sub(r'remix.*', '', name, flags=re.IGNORECASE)
    # Remove special characters but keep spaces
    name = re.sub(r'[^\w\s]', '', name)
    return name.strip()

def parse_lrc(lrc_content):
    """
    Simple LRC parser for fallback subtitles
    """
    if not lrc_content:
        return []
    lines = lrc_content.split('\n')
    parsed = []
    for line in lines:
        match = re.match(r'\[(\d+):(\d+\.\d+)\](.*)', line)
        if match:
            mins, secs, text = match.groups()
            ts = int(mins) * 60 + float(secs)
            parsed.append({
                "ts": ts,
                "x": text.strip()
            })
    return parsed

def get_lyrics_lrclib(artist, title):
    """
    Try fetching from LrcLib (Reliable and Free)
    """
    try:
        # 1. Try exact match with get endpoint
        params = {
            "artist_name": artist,
            "track_name": title
        }
        response = requests.get("https://lrclib.net/api/get", params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            # Prefer synced lyrics (LRC)
            if data.get("syncedLyrics"):
                parsed = parse_lrc(data["syncedLyrics"])
                if parsed:
                    return {"lyrics": parsed, "type": "synced"}
            
            # Fallback to plain lyrics
            if data.get("plainLyrics"):
                return {"lyrics": data["plainLyrics"], "type": "plain"}

        # 2. Try search if exact match failed
        query = f"{title} {artist}"
        search_response = requests.get(f"https://lrclib.net/api/search?q={urllib.parse.quote(query)}", timeout=10)
        if search_response.status_code == 200:
            results = search_response.json()
            if results and isinstance(results, list):
                # Try to find a good match in search results
                for res in results:
                    # Simple check: if title is in trackName and artist is in artistName
                    if title.lower() in res.get("trackName", "").lower() and artist.lower() in res.get("artistName", "").lower():
                        if res.get("syncedLyrics"):
                            parsed = parse_lrc(res["syncedLyrics"])
                            if parsed:
                                return {"lyrics": parsed, "type": "synced"}
                        if res.get("plainLyrics"):
                            return {"lyrics": res["plainLyrics"], "type": "plain"}
                
                # If no perfect match, just take the first one if it has lyrics
                for res in results:
                    if res.get("syncedLyrics"):
                        parsed = parse_lrc(res["syncedLyrics"])
                        if parsed:
                            return {"lyrics": parsed, "type": "synced"}
                    if res.get("plainLyrics"):
                        return {"lyrics": res["plainLyrics"], "type": "plain"}
        
        return None
    except Exception as e:
        print(f"LrcLib error: {e}", file=sys.stderr)
        return None

def get_lyrics_musixmatch(artist, title):
    """
    Fallback to Musixmatch
    """
    if not MusixMatchAPI:
        return None
        
    try:
        api = MusixMatchAPI()
        
        cleaned_title = clean_name(title)
        cleaned_artist = clean_name(artist)
        
        # Try multiple search strategies
        search_queries = [
            f"{cleaned_title} {cleaned_artist}",
            f"{title} {artist}",
            f"{cleaned_title}",
            title
        ]
        
        # Keep track of unique queries
        seen_queries = set()
        unique_queries = []
        for q in search_queries:
            if q.lower() not in seen_queries:
                seen_queries.add(q.lower())
                unique_queries.append(q)

        for query in unique_queries:
            try:
                search_results = api.search_tracks(query)
                if search_results.get('message', {}).get('header', {}).get('status_code') == 401:
                    # Captcha or blocked
                    continue
                    
                track_list = search_results.get('message', {}).get('body', {}).get('track_list', [])
            except:
                continue
            
            if track_list:
                for item in track_list:
                    track = item.get('track', {})
                    t_name = track.get('track_name', '').lower()
                    a_name = track.get('artist_name', '').lower()
                    
                    title_match = (cleaned_title.lower() in t_name or t_name in cleaned_title.lower())
                    artist_match = (cleaned_artist.lower() in a_name or a_name in cleaned_artist.lower() or 
                                   cleaned_artist.lower() in t_name)
                    
                    if title_match and (artist_match or not cleaned_artist):
                        track_id = track.get('track_id')
                        
                        # 1. Try richsync
                        try:
                            richsync_data = api.get_track_richsync(track_id=track_id)
                            richsync_body = richsync_data.get('message', {}).get('body', {}).get('richsync', {}).get('richsync_body')
                            if richsync_body:
                                synced_lyrics = json.loads(richsync_body)
                                return {"lyrics": synced_lyrics, "type": "synced"}
                        except:
                            pass

                        # 2. Try subtitle
                        try:
                            subtitle_data = api.get_track_subtitle(track_id=track_id)
                            subtitle_body = subtitle_data.get('message', {}).get('body', {}).get('subtitle', {}).get('subtitle_body')
                            if subtitle_body:
                                try:
                                    synced_lyrics = json.loads(subtitle_body)
                                    formatted = [{"ts": line.get("time", {}).get("total", 0), "x": line.get("text", "")} for line in synced_lyrics]
                                    return {"lyrics": formatted, "type": "synced"}
                                except:
                                    parsed_lrc = parse_lrc(subtitle_body)
                                    if parsed_lrc:
                                        return {"lyrics": parsed_lrc, "type": "synced"}
                        except:
                            pass

                        # 3. Fallback to plain lyrics
                        if track.get('has_lyrics') == 1:
                            try:
                                lyrics_data = api.get_track_lyrics(track_id)
                                lyrics_body = lyrics_data.get('message', {}).get('body', {}).get('lyrics', {}).get('lyrics_body')
                                if lyrics_body:
                                    clean_lyrics = lyrics_body.split('*******')[0].strip()
                                    return {"lyrics": clean_lyrics, "type": "plain"}
                            except:
                                pass
        return None
    except Exception as e:
        print(f"Musixmatch error: {e}", file=sys.stderr)
        return None

def get_lyrics(artist, title):
    # 1. Try LrcLib first (Primary)
    result = get_lyrics_lrclib(artist, title)
    if result:
        return result
        
    # 2. Try Musixmatch as fallback
    result = get_lyrics_musixmatch(artist, title)
    if result:
        return result
        
    return {"error": "Lyrics not found"}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing artist or title"}))
        sys.exit(1)
    
    artist = sys.argv[1]
    title = sys.argv[2]
    
    result = get_lyrics(artist, title)
    print(json.dumps(result))
