"""
Downloads real Indian Sign Language landmark files from leading GitHub repositories
(e.g., aju22/Real-Time-ISL-Translation based on the AI4Bharat INCLUDE dataset).
"""

import os
import json
import urllib.request
import urllib.parse

def download_github_include_dataset(save_dir="ml/dataset/raw/github_include"):
    os.makedirs(save_dir, exist_ok=True)
    classes = [
        "alright",
        "good afternoon",
        "good evening",
        "good morning",
        "good night",
        "hello",
        "how are you",
        "pleased",
        "thank you"
    ]
    base_api = "https://api.github.com/repos/aju22/Real-Time-ISL-Translation/contents/keypoint_data"

    downloaded = 0
    total_existing = 0

    print("=" * 60)
    print("DOWNLOADING REAL ISL LANDMARKS FROM GITHUB (AI4Bharat INCLUDE)")
    print("=" * 60)

    for cls in classes:
        cls_dir = os.path.join(save_dir, cls)
        os.makedirs(cls_dir, exist_ok=True)
        encoded_cls = urllib.parse.quote(cls)
        req = urllib.request.Request(f"{base_api}/{encoded_cls}", headers={"User-Agent": "Mozilla/5.0"})
        try:
            with urllib.request.urlopen(req) as resp:
                files = json.loads(resp.read().decode("utf-8"))
                for f in files:
                    fname = f["name"]
                    furl = f["download_url"]
                    target_path = os.path.join(cls_dir, fname)
                    if os.path.exists(target_path):
                        total_existing += 1
                        continue
                    try:
                        f_req = urllib.request.Request(furl, headers={"User-Agent": "Mozilla/5.0"})
                        with urllib.request.urlopen(f_req) as fresp:
                            with open(target_path, "wb") as out_f:
                                out_f.write(fresp.read())
                        downloaded += 1
                    except Exception as err:
                        print(f"  [Warning] Failed to fetch {fname}: {err}")
            print(f"  [OK] Class '{cls}': Synced ({len(os.listdir(cls_dir))} files).")
        except Exception as e:
            print(f"  [Error] Failed to fetch class '{cls}': {e}")

    print(f"\n[Complete] Downloaded: {downloaded} new files | Total present: {total_existing + downloaded}")
    return os.path.abspath(save_dir)

if __name__ == "__main__":
    download_github_include_dataset()
