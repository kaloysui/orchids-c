import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(req: Request) {
  try {
    const { mediaItem, mediaType, season, episode } = await req.json();
    
    const tmdbTitle = mediaItem?.title || mediaItem?.name;
    const releaseYear = mediaItem?.release_date?.slice(0, 4) || mediaItem?.first_air_date?.slice(0, 4) || '';
    
    const isTV = mediaType === 'tv' || mediaType === 'show' || mediaType === 'tvshow';
    const listingUrl = isTV
      ? 'https://a.111477.xyz/tvs/'
      : 'https://a.111477.xyz/movies/';

    // Clean search name: remove punctuation, replace with space
    const cleanTitle = (tmdbTitle || '').replace(/[^\w\s]/gi, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    
    const headers = { 
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
    };

    const response = await fetch(listingUrl, { headers });
    if (!response.ok) throw new Error("Failed to fetch listing");
    const listingHtml = await response.text();
    
    const $ = cheerio.load(listingHtml);
    const rows = $('tr[data-name][data-url]').toArray();
    
    // Find the best matching folder
    let targetRow = rows.find((el) => {
      const dataName = ($(el).attr('data-name') || '').toLowerCase().replace(/[\.\-_]/g, ' ');
      const hasYear = !releaseYear || dataName.includes(releaseYear);
      return dataName.includes(cleanTitle) && hasYear;
    });

    if (!targetRow) {
      targetRow = rows.find((el) => {
        const dataName = ($(el).attr('data-name') || '').toLowerCase().replace(/[\.\-_]/g, ' ');
        return dataName.includes(cleanTitle);
      });
    }

    if (!targetRow) {
      const words = cleanTitle.split(' ');
      targetRow = rows.find((el) => {
        const dataName = ($(el).attr('data-name') || '').toLowerCase().replace(/[\.\-_]/g, ' ');
        return words.every(word => dataName.includes(word));
      });
    }

    if (!targetRow) return NextResponse.json([]);

    const detailHref = $(targetRow).attr('data-url');
    let folderUrl = detailHref;
    if (!folderUrl) return NextResponse.json([]);
    
    if (folderUrl.startsWith('/')) folderUrl = `https://a.111477.xyz${folderUrl}`;
    else if (!folderUrl.startsWith('http')) folderUrl = `https://a.111477.xyz/${folderUrl}`;

    // For TV shows, we might need to go into a Season folder
    if (isTV && season !== undefined) {
      const seasonResponse = await fetch(folderUrl, { headers });
      if (seasonResponse.ok) {
        const seasonHtml = await seasonResponse.text();
        const $season = cheerio.load(seasonHtml);
        const seasonRows = $season('tr[data-name][data-url]').toArray();
        
        const seasonNum = season.toString();
        const paddedSeason = season.toString().padStart(2, '0');
        
        const seasonFolder = seasonRows.find(el => {
          const name = ($(el).attr('data-name') || '').toLowerCase();
          return name.includes(`season ${seasonNum}`) || name.includes(`s${paddedSeason}`) || name.includes(`s${seasonNum}`);
        });

        if (seasonFolder) {
          const seasonHref = $(seasonFolder).attr('data-url');
          if (seasonHref) {
            if (seasonHref.startsWith('/')) folderUrl = `https://a.111477.xyz${seasonHref}`;
            else folderUrl = `${folderUrl}${seasonHref}`;
          }
        }
      }
    }

    // Now fetch the actual folder with files
    const finalResponse = await fetch(folderUrl, { headers });
    if (!finalResponse.ok) throw new Error("Failed to fetch folder content");
    const finalHtml = await finalResponse.text();
    
    const $final = cheerio.load(finalHtml);
    const fileRows = $final('tr[data-name][data-url]').toArray();

    const videoExtensions = ['.mkv', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'];
    
    let links = fileRows
      .map(el => {
        const name = $(el).attr('data-name') || '';
        const url = $(el).attr('data-url') || '';
        const isFile = videoExtensions.some(ext => name.toLowerCase().endsWith(ext));
        
        if (!isFile) return null;

        // Detect quality
        let quality = "";
        const lowName = name.toLowerCase();
        
        if (lowName.includes('2160p') || lowName.includes('4k') || lowName.includes('uhd')) {
          quality = "4K";
        } else if (lowName.includes('1080p') || lowName.includes('fhd')) {
          quality = "1080p";
        } else if (lowName.includes('720p') || lowName.includes('hd')) {
          quality = "720p";
        } else if (lowName.includes('480p') || lowName.includes('sd')) {
          quality = "480p";
        } else if (lowName.includes('bdrip') || lowName.includes('bluray') || lowName.includes('brrip')) {
          quality = "BluRay";
        } else if (lowName.includes('web-dl') || lowName.includes('webrip') || lowName.includes('web')) {
          quality = "WEB";
        }
        
        // Additional info
        const info = [];
        if (lowName.includes('hdr') && !lowName.includes('hdr10+')) info.push('HDR');
        if (lowName.includes('hdr10+')) info.push('HDR10+');
        if (lowName.includes('10bit') || lowName.includes('10-bit')) info.push('10-bit');
        if (lowName.includes('dv') || lowName.includes('dolby vision')) info.push('DV');
        if (lowName.includes('imax')) info.push('IMAX');
        if (lowName.includes('x265') || lowName.includes('hevc')) info.push('HEVC');
        if (lowName.includes('x264') || lowName.includes('h264')) info.push('AVC');
        if (lowName.includes('dual audio') || lowName.includes('hindi') || lowName.includes('multi')) info.push('MULTI');
        if (lowName.includes('remux')) info.push('REMUX');

        let absoluteUrl = url;
        if (url.startsWith('/')) absoluteUrl = `https://a.111477.xyz${url}`;
        else if (!url.startsWith('http')) {
          // Join folderUrl and url, ensuring proper slashes
          const base = folderUrl.endsWith('/') ? folderUrl : `${folderUrl}/`;
          absoluteUrl = `${base}${url}`;
        }

        return {
          url: absoluteUrl,
          type: 'download',
          label: name,
          quality,
          info: info.join(' ')
        };
      })
      .filter((link): link is { url: string; type: string; label: string } => link !== null);

    // If TV show and episode specified, filter files
    if (isTV && episode !== undefined) {
      const e = episode.toString().padStart(2, '0');
      const e_short = episode.toString();
      
      const patterns = [
        `e${e}`,
        `e${e_short}`,
        `episode ${e_short}`,
        `episode ${e}`,
        `.${e}.`,
        `_${e}_`,
        ` ${e} `
      ];

      const filteredLinks = links.filter(link => {
        const lowLabel = link.label.toLowerCase();
        // Look for SxxExx or just Exx patterns
        const epPattern = new RegExp(`e${e}(?![0-9])|episode\\s*${e_short}(?![0-9])`, 'i');
        return epPattern.test(lowLabel) || patterns.some(p => lowLabel.includes(p.toLowerCase()));
      });

      if (filteredLinks.length > 0) {
        links = filteredLinks;
      }
    }

    return NextResponse.json(links);
  } catch (error: any) {
    console.error("Scrape error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
