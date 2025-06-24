import yt_dlp
import time
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor, as_completed

# ─── Configuration ────────────────────────────────────────────
ARTISTS           = [
    "999999999","FANTASM","FUNK ASSAULT","HOLY PRIEST",
    "KLANGKUENSTLER","MAU P","ONLYNUMBERS","PAWSA","PROSPA"
]
SEARCH_KEYWORDS   = ["tech house","official"]
TRACKS_PER_ARTIST = 34
OUTPUT_FILE       = "decibel_open_air_playlist.txt"
MAX_WORKERS       = 4   # adjust to your CPU/IO capabilities
# ───────────────────────────────────────────────────────────────

def fetch_artist_videos(artist):
    """Return list of video IDs for a single artist."""
    ids = []
    opts = {'quiet': True, 'no_warnings': True, 'skip_download': True}
    ydl = yt_dlp.YoutubeDL(opts)
    for kw in SEARCH_KEYWORDS:
        if len(ids) >= TRACKS_PER_ARTIST:
            break
        query = f"ytsearch20:{artist} {kw}"
        try:
            info = ydl.extract_info(query, download=False)
        except Exception:
            continue
        for entry in info.get('entries', []):
            if len(ids) >= TRACKS_PER_ARTIST:
                break
            title = (entry.get('title') or "").lower()
            dur   = entry.get('duration') or 0
            if any(x in title for x in ("mix","set","live")) or dur < 60:
                continue
            vid = entry.get('id')
            if vid and vid not in ids:
                ids.append(vid)
    return artist, ids

def search_and_write():
    start = time.perf_counter()
    all_ids = []

    # Parallelize artists across a ThreadPool
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = { pool.submit(fetch_artist_videos, a): a for a in ARTISTS }
        for fut in tqdm(as_completed(futures), total=len(futures),
                        desc="Artists", unit="artist"):
            artist = futures[fut]
            t0 = time.perf_counter()
            _, vids = fut.result()
            elapsed = time.perf_counter() - t0
            print(f"✅ {artist!r}: {len(vids)} videos in {elapsed:.1f}s")
            all_ids.extend(vids)

    total = time.perf_counter() - start
    print(f"\n🏁 All searches done in {total:.1f}s — writing to {OUTPUT_FILE}")

    with open(OUTPUT_FILE, "w") as f:
        for vid in all_ids:
            f.write(f"https://www.youtube.com/watch?v={vid}\n")
    print(f"✅ {len(all_ids)} URLs written")

if __name__ == "__main__":
    search_and_write()