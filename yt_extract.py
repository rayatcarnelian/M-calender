import sys
import json
from youtube_transcript_api import YouTubeTranscriptApi

def get_transcript(video_id):
    try:
        ytt_api = YouTubeTranscriptApi()
        # Try multiple English variants, then fall back to any available language
        for lang in [("en",), ("en-US",), ("en-GB",)]:
            try:
                transcript = ytt_api.fetch(video_id, languages=lang)
                text = " ".join([entry.text for entry in transcript])
                print(json.dumps({"success": True, "text": text}))
                return
            except Exception:
                continue
        
        # Last resort: try listing all available transcripts and grab the first one
        transcript_list = ytt_api.list(video_id)
        for t in transcript_list:
            transcript = t.fetch()
            text = " ".join([entry.text for entry in transcript])
            print(json.dumps({"success": True, "text": text}))
            return

        print(json.dumps({"success": False, "error": "No transcripts found in any language."}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No video ID provided"}))
        sys.exit(1)
    
    get_transcript(sys.argv[1])
