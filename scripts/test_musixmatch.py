
import sys
import os
import json

# Add cloned repo to path
current_dir = os.path.dirname(os.path.abspath(__file__))
musicxmatch_path = os.path.join(current_dir, 'musicxmatch_api', 'src')
sys.path.append(musicxmatch_path)

from musicxmatch_api import MusixMatchAPI

try:
    api = MusixMatchAPI()
    search_results = api.search_tracks("Hey Jude Beatles")
    print(json.dumps(search_results, indent=2))
except Exception as e:
    print(f"Error: {e}")
