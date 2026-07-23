"""
Train Plant Disease Detection Model.

Supports:
- EfficientNetB0 (default, recommended for 95%+ accuracy)
- ResNet50
- Custom CNN (lightweight fallback)

Two-phase training for transfer learning:
  Phase 1: Frozen base → train classification head
  Phase 2: Unfreeze top layers → fine-tune with low LR
"""

import os
import argparse
import numpy as np
import tensorflow as tf
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, classification_report, confusion_matrix
)
from sklearn.utils.class_weight import compute_class_weight
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for saving plots
import matplotlib.pyplot as plt
import json

from preprocessing import (
    create_data_generators, get_labels_from_dataset,
    IMG_SIZE, BATCH_SIZE
)

# Suppress TF logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, 'dataset')
MODELS_DIR = os.path.join(BASE_DIR, 'models')
MODEL_SAVE_PATH = os.path.join(MODELS_DIR, 'disease_model.h5')
METADATA_PATH = os.path.join(MODELS_DIR, 'disease_classes.json')


# ══════════════════════════════════════════════════════════════════════════════
#  MODEL BUILDERS
# ══════════════════════════════════════════════════════════════════════════════

def build_custom_cnn(num_classes):
    """Builds a deeper custom CNN with better regularization."""
    print("Building Custom CNN Architecture...")

    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(IMG_SIZE[0], IMG_SIZE[1], 3)),

        tf.keras.layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling2D(2, 2),
        tf.keras.layers.Dropout(0.25),

        tf.keras.layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling2D(2, 2),
        tf.keras.layers.Dropout(0.25),

        tf.keras.layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling2D(2, 2),
        tf.keras.layers.Dropout(0.25),

        tf.keras.layers.Conv2D(256, (3, 3), activation='relu', padding='same'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling2D(2, 2),
        tf.keras.layers.Dropout(0.25),

        tf.keras.layers.GlobalAveragePooling2D(),
        tf.keras.layers.Dense(512, activation='relu'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.5),
        tf.keras.layers.Dense(num_classes, activation='softmax')
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    return model


def build_transfer_model(model_name, num_classes):
    """
    Builds a transfer learning model with a pretrained ImageNet backbone.

    Architecture:
      Input → Base Model (frozen) → GlobalAveragePooling2D
      → BatchNorm → Dense(256) → Dropout(0.3) → Softmax Output
    """
    print(f"\nBuilding Transfer Learning Model: {model_name.upper()}")
    print("Loading pretrained ImageNet weights...\n")

    input_shape = (IMG_SIZE[0], IMG_SIZE[1], 3)

    if model_name.lower() == 'resnet50':
        base_model = tf.keras.applications.ResNet50(
            weights='imagenet', include_top=False, input_shape=input_shape
        )
    elif model_name.lower() == 'efficientnetb0':
        base_model = tf.keras.applications.EfficientNetB0(
            weights='imagenet', include_top=False, input_shape=input_shape
        )
    else:
        raise ValueError(f"Unsupported model: {model_name}")

    # Freeze entire base model for Phase 1
    base_model.trainable = False

    # Build classification head
    inputs = tf.keras.layers.Input(shape=input_shape)
    x = base_model(inputs, training=False)  # training=False keeps BatchNorm in inference mode
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Dense(256, activation='relu')(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    outputs = tf.keras.layers.Dense(num_classes, activation='softmax')(x)

    model = tf.keras.Model(inputs, outputs)

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )

    return model, base_model


# ══════════════════════════════════════════════════════════════════════════════
#  EVALUATION
# ══════════════════════════════════════════════════════════════════════════════

def evaluate_model(model, val_ds, class_names):
    """
    Evaluates the model on the validation dataset and prints detailed metrics.

    Works with tf.data.Dataset (integer labels).
    """
    print("\n" + "=" * 60)
    print("EVALUATING MODEL ON VALIDATION SET")
    print("=" * 60)

    # Collect predictions and true labels from all batches
    y_true_all = []
    y_pred_all = []

    for images, labels in val_ds:
        preds = model.predict(images, verbose=0)
        y_pred_all.append(np.argmax(preds, axis=1))
        y_true_all.append(labels.numpy())

    y_true = np.concatenate(y_true_all)
    y_pred = np.concatenate(y_pred_all)

    # Classification Report
    print("\n--- Classification Report ---")
    print(classification_report(
    y_true,
    y_pred,
    labels=list(range(len(class_names))),
    target_names=class_names,
    zero_division=0
))

    # Confusion Matrix
    print("\n--- Confusion Matrix ---")
    cm = confusion_matrix(
    y_true,
    y_pred,
    labels=list(range(len(class_names)))
)
    print(cm)

    # Summary Metrics
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, average='weighted', zero_division=0)
    rec = recall_score(y_true, y_pred, average='weighted', zero_division=0)
    f1 = f1_score(y_true, y_pred, average='weighted', zero_division=0)

    print("\n--- Summary Metrics ---")
    print(f"  Accuracy:  {acc:.4f}  ({acc*100:.2f}%)")
    print(f"  Precision: {prec:.4f}")
    print(f"  Recall:    {rec:.4f}")
    print(f"  F1-score:  {f1:.4f}")

    return acc, prec, rec, f1


def plot_training_history(history, save_path, title_suffix=""):
    """Saves training/validation accuracy and loss plots."""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    # Accuracy
    ax1.plot(history.history['accuracy'], label='Train Accuracy', linewidth=2)
    ax1.plot(history.history['val_accuracy'], label='Val Accuracy', linewidth=2)
    ax1.set_title(f'Model Accuracy {title_suffix}')
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Accuracy')
    ax1.legend()
    ax1.grid(True, alpha=0.3)

    # Loss
    ax2.plot(history.history['loss'], label='Train Loss', linewidth=2)
    ax2.plot(history.history['val_loss'], label='Val Loss', linewidth=2)
    ax2.set_title(f'Model Loss {title_suffix}')
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('Loss')
    ax2.legend()
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(save_path, dpi=150)
    plt.close()
    print(f"Training plot saved to: {save_path}")


# ══════════════════════════════════════════════════════════════════════════════
#  MAIN TRAINING PIPELINE
# ══════════════════════════════════════════════════════════════════════════════

def main(args):
    # Ensure directories exist
    os.makedirs(MODELS_DIR, exist_ok=True)

    # Check dataset
    if not os.path.exists(DATASET_PATH) or not os.listdir(DATASET_PATH):
        print(f"Error: No dataset found at {DATASET_PATH}")
        print("Please place your image dataset subfolders inside the dataset/ directory.")
        return

    # ── Create data pipelines ───────────────────────────────────────────────
    print("Initializing Data Pipelines...")
    train_ds, val_ds, class_names, split_info = create_data_generators(
        DATASET_PATH, model_name=args.model
    )

    num_classes = len(class_names)
    print(f"\nTotal classes: {num_classes}")
    print(f"Classes: {class_names}")

    # ── Save class metadata for inference ───────────────────────────────────
    metadata = {
        "classes": {str(i): name for i, name in enumerate(class_names)},
        "model_name": args.model,
        "img_size": list(IMG_SIZE)
    }
    with open(METADATA_PATH, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"Class metadata saved to: {METADATA_PATH}")

    # ── Compute class weights for imbalanced dataset ────────────────────────
    print("\nComputing class weights...")
    all_labels = get_labels_from_dataset(train_ds)
    unique_classes = np.unique(all_labels)
    class_weights_array = compute_class_weight(
        class_weight='balanced',
        classes=unique_classes,
        y=all_labels
    )
    class_weights = dict(zip(unique_classes.astype(int), class_weights_array))
    print(f"Class weights: { {class_names[k]: round(v, 3) for k, v in class_weights.items()} }")

    # ── Build model ─────────────────────────────────────────────────────────
    base_model = None
    if args.model == 'custom':
        model = build_custom_cnn(num_classes)
    else:
        model, base_model = build_transfer_model(args.model, num_classes)

    model.summary(print_fn=lambda x: print(x) if 'Total' in x or 'Trainable' in x or 'Non-trainable' in x else None)
    print()

    # ── Callbacks ───────────────────────────────────────────────────────────
    early_stop = tf.keras.callbacks.EarlyStopping(
        monitor='val_loss', patience=5,
        restore_best_weights=True, verbose=1
    )
    reduce_lr = tf.keras.callbacks.ReduceLROnPlateau(
        monitor='val_loss', factor=0.2,
        patience=3, min_lr=1e-7, verbose=1
    )
    checkpoint = tf.keras.callbacks.ModelCheckpoint(
        MODEL_SAVE_PATH, monitor='val_accuracy',
        save_best_only=True, verbose=1
    )

    callbacks = [early_stop, reduce_lr, checkpoint]

    # ══════════════════════════════════════════════════════════════════════
    #  PHASE 1: Train classification head (base model frozen)
    # ══════════════════════════════════════════════════════════════════════
    phase1_epochs = args.epochs

    print("\n" + "=" * 60)
    if args.model == 'custom':
        print(f"TRAINING CUSTOM CNN — {phase1_epochs} epochs")
    else:
        print(f"PHASE 1: Training classification head (base frozen) — {phase1_epochs} epochs")
    print("=" * 60 + "\n")

    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=phase1_epochs,
        callbacks=callbacks,
        class_weight=class_weights
    )

    # Save Phase 1 training plot
    plot_path = os.path.join(MODELS_DIR, 'training_history.png')
    plot_training_history(history, plot_path, title_suffix="(Phase 1)" if base_model else "")

    # ══════════════════════════════════════════════════════════════════════
    #  PHASE 2: Fine-tune top layers of base model
    # ══════════════════════════════════════════════════════════════════════
    history_ft = None  # Will be set if Phase 2 fine-tuning runs
    if args.model != 'custom' and args.fine_tune and base_model is not None:
        print("\n" + "=" * 60)
        print("PHASE 2: Fine-tuning pretrained layers")
        print("=" * 60 + "\n")

        # Unfreeze entire base model
        base_model.trainable = True

        # Freeze early layers, keep top layers trainable
        # EfficientNetB0 has ~237 layers, ResNet50 has ~175 layers
        total_layers = len(base_model.layers)
        freeze_until = int(total_layers * 0.7)  # Freeze bottom 70%

        for layer in base_model.layers[:freeze_until]:
            layer.trainable = False

        trainable_count = sum(1 for layer in base_model.layers if layer.trainable)
        print(f"Base model layers: {total_layers}")
        print(f"Frozen layers:     {freeze_until}")
        print(f"Trainable layers:  {trainable_count}")

        # Recompile with much lower learning rate for fine-tuning
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )

        phase2_epochs = max(args.epochs // 2, 10)

        print(f"\nFine-tuning for {phase2_epochs} epochs with lr=1e-5\n")

        # Reset early stopping patience for phase 2
        early_stop_ft = tf.keras.callbacks.EarlyStopping(
            monitor='val_loss', patience=5,
            restore_best_weights=True, verbose=1
        )
        reduce_lr_ft = tf.keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss', factor=0.2,
            patience=3, min_lr=1e-8, verbose=1
        )
        checkpoint_ft = tf.keras.callbacks.ModelCheckpoint(
            MODEL_SAVE_PATH, monitor='val_accuracy',
            save_best_only=True, verbose=1
        )

        history_ft = model.fit(
            train_ds,
            validation_data=val_ds,
            epochs=phase2_epochs,
            callbacks=[early_stop_ft, reduce_lr_ft, checkpoint_ft],
            class_weight=class_weights
        )

        # Save Phase 2 training plot
        plot_path_ft = os.path.join(MODELS_DIR, 'training_history_finetune.png')
        plot_training_history(history_ft, plot_path_ft, title_suffix="(Phase 2 - Fine-tune)")

    # ══════════════════════════════════════════════════════════════════════
    #  FINAL EVALUATION
    # ══════════════════════════════════════════════════════════════════════
    print("\n" + "=" * 60)
    print("FINAL MODEL EVALUATION")
    print("=" * 60)

    # Load best checkpoint for final evaluation
    if os.path.exists(MODEL_SAVE_PATH):
        print(f"Loading best model from: {MODEL_SAVE_PATH}")
        model = tf.keras.models.load_model(MODEL_SAVE_PATH)

    acc, prec, rec, f1 = evaluate_model(model, val_ds, class_names)

    # ── Phase-5 Step-1: Write metrics.json for retrainBridge integration ──
    # Collect final loss from the last training phase's history.
    # If fine-tuning ran, use history_ft; otherwise use phase 1 history.
    last_history = history_ft if (args.model != 'custom' and args.fine_tune
                                  and base_model is not None
                                  and history_ft is not None) else history
    final_val_loss = float(last_history.history['val_loss'][-1])

    # Total epochs actually run (accounts for early stopping)
    total_epochs = len(history.history['loss'])
    if (args.model != 'custom' and args.fine_tune
            and base_model is not None and history_ft is not None):
        total_epochs += len(history_ft.history['loss'])

    # Image counts from the stratified split (returned by preprocessing)
    training_images = split_info.get('train_count', 0)
    validation_images = split_info.get('val_count', 0)

    metrics_output = {
        "accuracy": round(float(acc), 4),
        "loss": round(final_val_loss, 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1Score": round(float(f1), 4),
        "epochs": total_epochs,
        "trainingImages": training_images,
        "validationImages": validation_images,
        "timestamp": __import__('datetime').datetime.utcnow().isoformat() + 'Z'
    }

    metrics_path = os.path.join(MODELS_DIR, 'metrics.json')
    with open(metrics_path, 'w') as mf:
        json.dump(metrics_output, mf, indent=2)
    print(f"\n  📊 Metrics saved to: {metrics_path}")

    print("\n" + "=" * 60)
    print("TRAINING COMPLETE")
    print("=" * 60)
    print(f"  Model:           {args.model}")
    print(f"  Final Accuracy:  {acc*100:.2f}%")
    print(f"  Final F1-score:  {f1:.4f}")
    print(f"  Model saved to:  {MODEL_SAVE_PATH}")
    print(f"  Metadata:        {METADATA_PATH}")
    print("=" * 60 + "\n")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description="Train Plant Disease Detection Model",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Default: EfficientNetB0 with fine-tuning (recommended)
  python train_disease_model.py --model efficientnetb0 --epochs 15 --fine_tune

  # ResNet50 with fine-tuning
  python train_disease_model.py --model resnet50 --epochs 15 --fine_tune

  # Custom CNN (no pretrained weights)
  python train_disease_model.py --model custom --epochs 30
        """
    )
    parser.add_argument(
        '--model', type=str, default='efficientnetb0',
        choices=['custom', 'resnet50', 'efficientnetb0'],
        help='Model architecture (default: efficientnetb0)'
    )
    parser.add_argument(
        '--epochs', type=int, default=15,
        help='Number of training epochs (default: 15)'
    )
    parser.add_argument(
        '--fine_tune', action='store_true', default=True,
        help='Enable fine-tuning for transfer learning models (default: True)'
    )
    parser.add_argument(
        '--no_fine_tune', action='store_false', dest='fine_tune',
        help='Disable fine-tuning'
    )

    args = parser.parse_args()
    main(args)
