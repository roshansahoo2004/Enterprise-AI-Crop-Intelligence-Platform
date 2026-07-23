import os
import sys
import json
import numpy as np
import joblib

# ─── Feature Display Labels ─────────────────────────────────────────────────
FEATURE_NAMES = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
FEATURE_LABELS = {
    'N': 'Nitrogen',
    'P': 'Phosphorus',
    'K': 'Potassium',
    'temperature': 'Temperature',
    'humidity': 'Humidity',
    'ph': 'Soil pH',
    'rainfall': 'Rainfall'
}

# ─── Paths ───────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_MODEL_PATH = os.path.join(BASE_DIR, 'models', 'best_model.pkl')
DEFAULT_SCALER_PATH = os.path.join(BASE_DIR, 'scalers', 'scaler.pkl')
DEFAULT_ENCODER_PATH = os.path.join(BASE_DIR, 'scalers', 'label_encoder.pkl')
DEFAULT_EXPLAINER_PATH = os.path.join(BASE_DIR, 'models', 'shap_explainer.pkl')

def main():
    # Resolve file paths (supports command line arguments for version synchronization)
    model_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_MODEL_PATH
    scaler_path = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_SCALER_PATH
    encoder_path = sys.argv[3] if len(sys.argv) > 3 else DEFAULT_ENCODER_PATH
    explainer_path = sys.argv[4] if len(sys.argv) > 4 else DEFAULT_EXPLAINER_PATH

    model = None
    scaler = None
    label_encoder = None
    explainer = None
    load_error = None

    # Load artifacts with fallback capability
    try:
        if os.path.exists(model_path):
            model = joblib.load(model_path)
        else:
            load_error = f"Model path not found: {model_path}"

        if os.path.exists(scaler_path):
            scaler = joblib.load(scaler_path)
        else:
            load_error = f"Scaler path not found: {scaler_path}"

        if os.path.exists(encoder_path):
            label_encoder = joblib.load(encoder_path)
        else:
            load_error = f"Encoder path not found: {encoder_path}"

        # Load or generate SHAP explainer
        if load_error is None:
            if os.path.exists(explainer_path):
                try:
                    explainer = joblib.load(explainer_path)
                except Exception:
                    explainer = None

            if explainer is None and model is not None:
                import shap
                explainer = shap.TreeExplainer(model)
                try:
                    joblib.dump(explainer, explainer_path)
                except Exception:
                    pass
    except Exception as e:
        load_error = str(e)

    # Let the parent Node process know if startup succeeded
    startup_status = {
        "status": "READY" if load_error is None else "FALLBACK",
        "error": load_error,
        "model_path": model_path
    }
    print(json.dumps(startup_status))
    sys.stdout.flush()

    # Enter persistent stdin loop
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            req = json.loads(line)
            req_id = req.get("reqId")
            features_input = req.get("features") # list of 7 values
            predicted_crop = req.get("predicted_crop")

            if load_error is not None or explainer is None or model is None or scaler is None or label_encoder is None:
                # Automatic fallback to Rule-Based XAI
                response = {
                    "reqId": req_id,
                    "shapAvailable": False,
                    "error": load_error or "SHAP artifacts are not loaded"
                }
                print(json.dumps(response))
                sys.stdout.flush()
                continue

            # Scale input features
            input_array = np.array(features_input).reshape(1, -1)
            input_scaled = scaler.transform(input_array)

            # Find matching class index
            classes_list = list(label_encoder.classes_)
            predicted_crop_lower = str(predicted_crop).lower()
            predicted_class_idx = -1
            for i, c in enumerate(classes_list):
                if str(c).lower() == predicted_crop_lower:
                    predicted_class_idx = i
                    break

            if predicted_class_idx == -1:
                # Predicted crop not found in encoder classes
                response = {
                    "reqId": req_id,
                    "shapAvailable": False,
                    "error": f"Crop '{predicted_crop}' not found in label classes"
                }
                print(json.dumps(response))
                sys.stdout.flush()
                continue

            # Compute SHAP values
            shap_values = explainer.shap_values(input_scaled)

            # Extract SHAP array for the winning class index
            class_shap = None
            base_value = 0.0

            if isinstance(shap_values, list):
                # RandomForest list style output
                class_shap = shap_values[predicted_class_idx][0]
                base_value = float(explainer.expected_value[predicted_class_idx])
            elif isinstance(shap_values, np.ndarray):
                if len(shap_values.shape) == 3:
                    if shap_values.shape[2] == len(model.classes_):
                        # Shape is (num_samples, num_features, num_classes)
                        class_shap = shap_values[0, :, predicted_class_idx]
                    elif shap_values.shape[1] == len(model.classes_):
                        # Shape is (num_samples, num_classes, num_features)
                        class_shap = shap_values[0, predicted_class_idx, :]
                    else:
                        class_shap = shap_values[0, :, predicted_class_idx]
                    
                    if isinstance(explainer.expected_value, (list, np.ndarray)):
                        base_value = float(explainer.expected_value[predicted_class_idx])
                    else:
                        base_value = float(explainer.expected_value)
                elif len(shap_values.shape) == 2:
                    class_shap = shap_values[0]
                    base_value = float(explainer.expected_value)
                else:
                    class_shap = shap_values[0]
                    base_value = float(explainer.expected_value)
            else:
                raise TypeError("Unsupported SHAP output structure")

            # Calculate importance metrics and directions
            abs_shap = [abs(v) for v in class_shap]
            total_abs_shap = sum(abs_shap) or 1.0

            feature_contributions = []
            for i, name in enumerate(FEATURE_NAMES):
                val = float(class_shap[i])
                importance = float((abs(val) / total_abs_shap) * 100)
                
                # Determine influence direction
                if val > 0.005:
                    direction = "positive"
                elif val < -0.005:
                    direction = "negative"
                else:
                    direction = "neutral"

                feature_contributions.append({
                    "feature": FEATURE_LABELS[name],
                    "shapValue": round(val, 5),
                    "direction": direction,
                    "importance": round(importance, 2)
                })

            # Sort by importance descending
            feature_contributions = sorted(feature_contributions, key=lambda x: x["importance"], reverse=True)

            response = {
                "reqId": req_id,
                "shapAvailable": True,
                "baseValue": round(base_value, 5),
                "expectedValue": round(base_value, 5),
                "featureContributions": feature_contributions
            }
            print(json.dumps(response))
            sys.stdout.flush()

        except Exception as e:
            response = {
                "shapAvailable": False,
                "error": str(e)
            }
            if 'req_id' in locals():
                response["reqId"] = req_id
            print(json.dumps(response))
            sys.stdout.flush()

if __name__ == '__main__':
    main()
