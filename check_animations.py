import os
import struct
import json

import re

fbx_path = "c:/ASL_Project/frontend/public/models/Remy.fbx"
if not os.path.exists(fbx_path):
    print(f"File not found: {fbx_path}")
    exit()

print("Searching Remy.fbx for bone-like names...")
with open(fbx_path, "rb") as f:
    content = f.read(100000) # Read first 100k bytes
    # Find all ASCII strings matching bone-like patterns
    bones = re.findall(b"mixamo[a-zA-Z0-9_:]+|[a-zA-Z0-9_:]+Bone[a-zA-Z0-9_:]*", content, re.IGNORECASE)
    print(f"Found {len(bones)} bone-like strings in header:")
    for bone in list(set(bones))[:20]:
        print(f" - {bone.decode('utf-8', errors='ignore')}")


