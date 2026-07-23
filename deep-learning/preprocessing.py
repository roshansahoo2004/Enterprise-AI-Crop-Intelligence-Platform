"""
Preprocessing module for Plant Disease Detection.

FIXED: Uses stratified train/val split to ensure ALL classes appear
in both training and validation sets, even with class imbalance.
"""

import os
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split

IMG_SIZE = (224, 224)
BATCH_SIZE = 32

# ─── Data Augmentation (training only) ──────────────────────────────────────
data_augmentation = tf.keras.Sequential([
    tf.keras.layers.RandomFlip("horizontal"),
    tf.keras.layers.RandomRotation(0.15),
    tf.keras.layers.RandomZoom(0.15),
    tf.keras.layers.RandomContrast(0.1),
], name="data_augmentation")


def _get_preprocess_fn(model_name):
    model_name = model_name.lower()
    if model_name == 'resnet50':
        return tf.keras.applications.resnet50.preprocess_input
    elif model_name == 'efficientnetb0':
        return tf.keras.applications.efficientnet.preprocess_input
    else:
        return lambda x: tf.cast(x, tf.float32) / 255.0


def create_data_generators(dataset_path, model_name='efficientnetb0'):
    """
    Creates train and validation tf.data.Datasets using STRATIFIED split.
    This guarantees every class appears in both train and val sets.

    Args:
        dataset_path: Path to dataset root (subfolders = class names)
        model_name: 'custom', 'resnet50', or 'efficientnetb0'

    Returns:
        train_ds, val_ds, class_names
    """
    print(f"\n{'='*60}")
    print(f"Loading dataset from: {dataset_path}")
    print(f"Image size: {IMG_SIZE}, Batch size: {BATCH_SIZE}")
    print(f"Model preprocessing: {model_name}")
    print(f"Using STRATIFIED split (fixes missing classes in val set)")
    print(f"{'='*60}\n")

    # ── Collect all image paths and labels manually ──────────────────────────
    class_names = sorted([
        d for d in os.listdir(dataset_path)
        if os.path.isdir(os.path.join(dataset_path, d))
    ])
    class_to_idx = {name: i for i, name in enumerate(class_names)}
    num_classes = len(class_names)

    all_paths = []
    all_labels = []

    for class_name in class_names:
        class_dir = os.path.join(dataset_path, class_name)
        for fname in os.listdir(class_dir):
            if fname.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.gif')):
                all_paths.append(os.path.join(class_dir, fname))
                all_labels.append(class_to_idx[class_name])

    all_paths = np.array(all_paths)
    all_labels = np.array(all_labels)

    print(f"Total images found: {len(all_paths)}")
    print(f"Total classes: {num_classes}")

    # Print per-class counts
    print("\nPer-class image counts:")
    for i, name in enumerate(class_names):
        count = np.sum(all_labels == i)
        print(f"  {count:5d}  {name}")

    # ── STRATIFIED SPLIT ─────────────────────────────────────────────────────
    # Ensures each class is proportionally represented in both train and val
    train_paths, val_paths, train_labels, val_labels = train_test_split(
        all_paths, all_labels,
        test_size=0.2,
        random_state=42,
        stratify=all_labels        # <-- KEY FIX
    )

    print(f"\nTrain samples: {len(train_paths)}")
    print(f"Val   samples: {len(val_paths)}")

    # Verify all classes in val
    val_classes_present = len(np.unique(val_labels))
    print(f"Classes in val set: {val_classes_present}/{num_classes} " 
          if val_classes_present == num_classes 
          else f"WARNING: Only {val_classes_present}/{num_classes} classes in val!")

    # ── Build tf.data.Datasets from path lists ───────────────────────────────
    preprocess_fn = _get_preprocess_fn(model_name)

    def load_and_preprocess(path, label):
        img = tf.io.read_file(path)
        img = tf.image.decode_image(img, channels=3, expand_animations=False)
        img = tf.image.resize(img, IMG_SIZE)
        img = tf.cast(img, tf.float32)
        return img, label

    def augment_and_preprocess(img, label):
        img = data_augmentation(img, training=True)
        img = preprocess_fn(img)
        return img, label

    def preprocess_only(img, label):
        img = preprocess_fn(img)
        return img, label

    AUTOTUNE = tf.data.AUTOTUNE

    # Training pipeline: shuffle → load → augment → batch → prefetch
    train_ds = (
        tf.data.Dataset.from_tensor_slices((train_paths, train_labels))
        .shuffle(len(train_paths), seed=42)
        .map(load_and_preprocess, num_parallel_calls=AUTOTUNE)
        .batch(BATCH_SIZE)
        .map(augment_and_preprocess, num_parallel_calls=AUTOTUNE)
        .prefetch(AUTOTUNE)
    )

    # Validation pipeline: load → batch → preprocess (NO shuffle, NO augment)
    val_ds = (
        tf.data.Dataset.from_tensor_slices((val_paths, val_labels))
        .map(load_and_preprocess, num_parallel_calls=AUTOTUNE)
        .batch(BATCH_SIZE)
        .map(preprocess_only, num_parallel_calls=AUTOTUNE)
        .prefetch(AUTOTUNE)
    )

    # Attach class names for convenience
    train_ds.class_names = class_names
    val_ds.class_names = class_names

    return train_ds, val_ds, class_names, {
        'train_count': len(train_paths),
        'val_count': len(val_paths)
    }


def get_labels_from_dataset(dataset):
    """Extracts all integer labels from a tf.data.Dataset."""
    all_labels = []
    for _, labels in dataset:
        all_labels.append(labels.numpy())
    return np.concatenate(all_labels)


def preprocess_image_for_prediction(image_path, target_size=IMG_SIZE, model_name='efficientnetb0'):
    """
    Loads and preprocesses a single image for inference.
    """
    try:
        img = tf.keras.utils.load_img(image_path, target_size=target_size)
        img_array = tf.keras.utils.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        preprocess_fn = _get_preprocess_fn(model_name)
        img_array = preprocess_fn(img_array)
        return img_array
    except Exception as e:
        print(f"Error loading image {image_path}: {e}")
        return None