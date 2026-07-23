"""
ML Training Pipeline for Crop Recommendation System
=====================================================
- Loads Crop_recommendation.csv
- Cleans data, handles missing values
- Feature scaling with StandardScaler
- Label encoding with LabelEncoder
- Trains Random Forest and XGBoost classifiers
- 5-fold Stratified Cross Validation
- Evaluates: Accuracy, Precision, Recall, F1-score
- Saves best model as best_model.pkl
"""

import os
import sys
import json
import warnings
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix
)
from xgboost import XGBClassifier

warnings.filterwarnings('ignore')

# ─── Paths ───────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, '..', 'dataset', 'Crop_recommendation.csv')
MODELS_DIR = os.path.join(BASE_DIR, 'models')
SCALERS_DIR = os.path.join(BASE_DIR, 'scalers')

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(SCALERS_DIR, exist_ok=True)


def load_and_clean_data(path):
    """Load dataset and perform cleaning."""
    print("=" * 60)
    print("  CROP RECOMMENDATION MODEL TRAINING PIPELINE")
    print("=" * 60)

    print(f"\n📂 Loading dataset from: {path}")
    df = pd.read_csv(path)

    print(f"   Shape: {df.shape}")
    print(f"   Columns: {list(df.columns)}")
    print(f"   Crops: {df['label'].nunique()} unique classes")

    # Check for missing values
    missing = df.isnull().sum()
    if missing.sum() > 0:
        print(f"\n⚠️  Missing values found:")
        print(missing[missing > 0])
        # Impute numeric columns with mean
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        imputer = SimpleImputer(strategy='mean')
        df[numeric_cols] = imputer.fit_transform(df[numeric_cols])
        print("   ✅ Missing values imputed with mean strategy")
    else:
        print("   ✅ No missing values found")

    # Check for duplicates
    dupes = df.duplicated().sum()
    if dupes > 0:
        print(f"   ⚠️  {dupes} duplicate rows found — removing")
        df = df.drop_duplicates()
    else:
        print("   ✅ No duplicate rows")

    # Display class distribution
    print(f"\n📊 Class Distribution:")
    for crop, count in df['label'].value_counts().items():
        print(f"   {crop:15s} : {count:4d} samples")

    return df


def prepare_features(df):
    """Scale features and encode labels."""
    print("\n🔧 Preparing features...")

    feature_cols = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
    X = df[feature_cols].values
    y = df['label'].values

    # Feature scaling
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    print("   ✅ Features scaled with StandardScaler")

    # Label encoding
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    print(f"   ✅ Labels encoded: {len(label_encoder.classes_)} classes")

    # Save scaler and label encoder
    scaler_path = os.path.join(SCALERS_DIR, 'scaler.pkl')
    encoder_path = os.path.join(SCALERS_DIR, 'label_encoder.pkl')
    joblib.dump(scaler, scaler_path)
    joblib.dump(label_encoder, encoder_path)
    print(f"   💾 Scaler saved to: {scaler_path}")
    print(f"   💾 Label encoder saved to: {encoder_path}")

    return X_scaled, y_encoded, label_encoder, feature_cols


def train_and_evaluate(X, y, label_encoder):
    """Train RF and XGBoost, evaluate with 5-fold CV, return best model."""
    print("\n" + "=" * 60)
    print("  MODEL TRAINING & EVALUATION")
    print("=" * 60)

    models = {
        'Random Forest': RandomForestClassifier(
            n_estimators=200,
            max_depth=20,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        ),
        'XGBoost': XGBClassifier(
            n_estimators=200,
            max_depth=10,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            use_label_encoder=False,
            eval_metric='mlogloss',
            verbosity=0
        )
    }

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scoring = ['accuracy', 'precision_macro', 'recall_macro', 'f1_macro']

    results = {}

    for name, model in models.items():
        print(f"\n{'─' * 50}")
        print(f"  🤖 Training: {name}")
        print(f"{'─' * 50}")

        # 5-fold cross validation
        cv_results = cross_validate(
            model, X, y,
            cv=cv,
            scoring=scoring,
            return_train_score=True,
            n_jobs=-1
        )

        metrics = {
            'accuracy': cv_results['test_accuracy'].mean(),
            'precision': cv_results['test_precision_macro'].mean(),
            'recall': cv_results['test_recall_macro'].mean(),
            'f1_score': cv_results['test_f1_macro'].mean(),
            'accuracy_std': cv_results['test_accuracy'].std(),
        }

        print(f"\n   📈 5-Fold Cross Validation Results:")
        print(f"   {'Metric':<15} {'Mean':>10} {'Std':>10}")
        print(f"   {'─' * 35}")
        print(f"   {'Accuracy':<15} {metrics['accuracy']:>10.4f} {metrics['accuracy_std']:>10.4f}")
        print(f"   {'Precision':<15} {metrics['precision']:>10.4f}")
        print(f"   {'Recall':<15} {metrics['recall']:>10.4f}")
        print(f"   {'F1-Score':<15} {metrics['f1_score']:>10.4f}")

        # Train on full data for final model
        model.fit(X, y)

        # Full classification report
        y_pred = model.predict(X)
        print(f"\n   📋 Full Training Classification Report:")
        report = classification_report(
            y, y_pred,
            target_names=label_encoder.classes_,
            digits=4
        )
        print(report)

        results[name] = {
            'model': model,
            'metrics': metrics
        }

    return results


def select_and_save_best(results):
    """Select the best model by F1-score and save it."""
    print("\n" + "=" * 60)
    print("  MODEL COMPARISON & SELECTION")
    print("=" * 60)

    print(f"\n   {'Model':<20} {'Accuracy':>10} {'F1-Score':>10}")
    print(f"   {'─' * 40}")

    best_name = None
    best_f1 = -1

    for name, data in results.items():
        m = data['metrics']
        print(f"   {name:<20} {m['accuracy']:>10.4f} {m['f1_score']:>10.4f}")
        if m['f1_score'] > best_f1:
            best_f1 = m['f1_score']
            best_name = name

    print(f"\n   🏆 Best Model: {best_name} (F1-Score: {best_f1:.4f})")

    # Save best model
    best_model = results[best_name]['model']
    model_path = os.path.join(MODELS_DIR, 'best_model.pkl')
    joblib.dump(best_model, model_path)
    print(f"   💾 Model saved to: {model_path}")

    # Regenerate and cache SHAP explainer for synchronization
    try:
        import shap
        print("   🔍 Generating and caching SHAP explainer...")
        explainer = shap.TreeExplainer(best_model)
        explainer_path = os.path.join(MODELS_DIR, 'shap_explainer.pkl')
        joblib.dump(explainer, explainer_path)
        print(f"   💾 SHAP explainer successfully cached at: {explainer_path}")
    except Exception as e:
        print(f"   ⚠️ Failed to cache SHAP explainer: {e}")

    # Save model metadata
    metadata = {
        'model_name': best_name,
        'metrics': {k: float(v) for k, v in results[best_name]['metrics'].items()},
        'classes': list(results[best_name]['model'].classes_) if hasattr(results[best_name]['model'], 'classes_') else None,
        'features': ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
    }
    meta_path = os.path.join(MODELS_DIR, 'model_metadata.json')
    with open(meta_path, 'w') as f:
        json.dump(
    metadata,
    f,
    indent=2,
    default=lambda x: int(x) if isinstance(x, np.integer) else x
)
    print(f"   💾 Metadata saved to: {meta_path}")

    return best_model


def main():
    # Load and clean
    df = load_and_clean_data(DATASET_PATH)

    # Prepare features
    X, y, label_encoder, feature_cols = prepare_features(df)

    # Train and evaluate
    results = train_and_evaluate(X, y, label_encoder)

    # Select and save best
    best_model = select_and_save_best(results)

    print("\n" + "=" * 60)
    print("  ✅ TRAINING PIPELINE COMPLETE")
    print("=" * 60)
    print()


if __name__ == '__main__':
    main()
