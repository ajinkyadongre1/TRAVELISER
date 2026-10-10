import subprocess
import os
import sys

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

browser = edge_path if os.path.exists(edge_path) else (chrome_path if os.path.exists(chrome_path) else None)
print("Browser:", browser)

if browser:
    out_img = os.path.abspath("proto_screenshot_full.png")
    temp_dir = os.path.join(os.environ.get("TEMP", "C:\\Temp"), "edge_shot")
    cmd = [
        browser,
        "--headless=new",
        f"--user-data-dir={temp_dir}",
        "--disable-gpu",
        "--hide-scrollbars",
        f"--screenshot={out_img}",
        "--window-size=1280,6800",
        "http://localhost:8080/index.html"
    ]
    print("Running:", cmd)
    res = subprocess.run(cmd, capture_output=True, text=True)
    print("Exists:", os.path.exists(out_img))
    if os.path.exists(out_img):
        print("Size:", os.path.getsize(out_img))
