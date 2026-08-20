from pathlib import Path

DATASET_DIR = Path(r"C:\ASL_Project\datasets\American-Sign-Language-Dataset")

WORDS = [
    "HELLO",
    "YES",
    "NO",
    "THANK YOU",
    "PLEASE",
    "SORRY",
    "GOOD",
    "BAD",
    "HELP",
    "STOP",
    "START",
    "MORE",
    "LESS",
    "I",
    "YOU",
    "WE",
    "THEY",
    "WHAT",
    "WHERE",
    "WHEN",
    "WHY",
    "HOW",
    "NAME",
    "UNDERSTAND",
    "LIKE",
    "LOVE",
]

print("========== VIDEO COUNT ==========")

total = 0

for word in WORDS:
    videos = list(DATASET_DIR.rglob(f"*-{word}.mp4"))
    count = len(videos)

    print(f"{word:12} {count}")

    total += count

print("=================================")
print(f"Total videos: {total}")