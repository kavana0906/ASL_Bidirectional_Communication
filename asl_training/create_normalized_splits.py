import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
import numpy as np


# ============================================================
# PATHS
# ============================================================

FEATURE_DIR = Path(
    r"C:\ASL_Project\asl_training\features_normalized"
)

OUTPUT_DIR = Path(
    r"C:\ASL_Project\asl_training"
)

TRAIN_CSV = OUTPUT_DIR / "train_normalized.csv"
VAL_CSV = OUTPUT_DIR / "val_normalized.csv"


# ============================================================
# COLLECT FEATURES
# ============================================================

records = []

for class_dir in sorted(FEATURE_DIR.iterdir()):

    if not class_dir.is_dir():
        continue

    label = class_dir.name

    for feature_file in class_dir.glob("*.npy"):

        try:
            data = np.load(feature_file)

            # Skip completely empty/zero feature files
            if not np.any(data):
                print(
                    f"Skipping all-zero feature: {feature_file}"
                )
                continue

            # Verify expected feature dimension
            if data.ndim != 2 or data.shape[1] != 126:
                print(
                    f"Skipping invalid shape: "
                    f"{feature_file} -> {data.shape}"
                )
                continue

            records.append({
                "feature": str(feature_file),
                "label": label
            })

        except Exception as e:

            print(
                f"Could not read {feature_file}: {e}"
            )


# ============================================================
# DATAFRAME
# ============================================================

df = pd.DataFrame(records)

print("\n========== DATASET ==========")
print("Usable samples:", len(df))
print("Classes:", df["label"].nunique())

print("\nClass distribution:")
print(df["label"].value_counts().sort_index())


# ============================================================
# STRATIFIED SPLIT
# ============================================================

train_df, val_df = train_test_split(
    df,
    test_size=0.20,
    random_state=42,
    stratify=df["label"]
)


# ============================================================
# SAVE
# ============================================================

train_df = train_df.sample(
    frac=1,
    random_state=42
).reset_index(drop=True)

val_df = val_df.sample(
    frac=1,
    random_state=42
).reset_index(drop=True)


train_df.to_csv(
    TRAIN_CSV,
    index=False
)

val_df.to_csv(
    VAL_CSV,
    index=False
)


# ============================================================
# RESULTS
# ============================================================

print("\n========== SPLIT COMPLETE ==========")

print(
    f"Training samples:   {len(train_df)}"
)

print(
    f"Validation samples: {len(val_df)}"
)

print("\nTRAIN DISTRIBUTION")
print(
    train_df["label"].value_counts().sort_index()
)

print("\nVALIDATION DISTRIBUTION")
print(
    val_df["label"].value_counts().sort_index()
)

print("\nSaved:")
print(TRAIN_CSV)
print(VAL_CSV)