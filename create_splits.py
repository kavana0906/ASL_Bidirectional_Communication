from pathlib import Path
import pandas as pd
from sklearn.model_selection import train_test_split

FEATURE_DIR = Path(r"C:\ASL_Project\asl_training\features")
OUTPUT_DIR = Path(r"C:\ASL_Project\asl_training")

rows = []

for word_dir in FEATURE_DIR.iterdir():

    if not word_dir.is_dir():
        continue

    label = word_dir.name

    for feature_file in word_dir.glob("*.npy"):

        rows.append({
            "feature": str(feature_file),
            "label": label
        })

df = pd.DataFrame(rows)

print("Total feature files:", len(df))
print("Total classes:", df["label"].nunique())

print("\nSamples per class:")
print(df["label"].value_counts().sort_index())

# First split: 70% train, 30% temporary
train_df, temp_df = train_test_split(
    df,
    test_size=0.30,
    random_state=42,
    stratify=df["label"]
)

# Split temporary 50/50 -> 15% validation, 15% test
val_df, test_df = train_test_split(
    temp_df,
    test_size=0.50,
    random_state=42,
    stratify=temp_df["label"]
)

train_df.to_csv(OUTPUT_DIR / "train.csv", index=False)
val_df.to_csv(OUTPUT_DIR / "val.csv", index=False)
test_df.to_csv(OUTPUT_DIR / "test.csv", index=False)

print("\n========== SPLIT COMPLETE ==========")
print("Train:", len(train_df))
print("Validation:", len(val_df))
print("Test:", len(test_df))

print("\nFiles created:")
print(OUTPUT_DIR / "train.csv")
print(OUTPUT_DIR / "val.csv")
print(OUTPUT_DIR / "test.csv")