from __future__ import annotations

import base64
import io
import os
from pathlib import Path

import cv2
import numpy as np
import tensorflow as tf
from flask import Flask, jsonify, request, send_from_directory
from tensorflow import keras

ROOT = Path(__file__).resolve().parent
HYBRID_MODEL_PATH = Path(os.environ.get(
    "RETINACHECK_HYBRID_MODEL", ROOT / "Hybrid_InceptionV3_ResNet50_SE_best.keras"
))
BASELINE_MODEL_PATH = Path(os.environ.get(
    "RETINACHECK_BASELINE_MODEL", ROOT / "InceptionV3_baseline_best.keras"
))
IMG_SIZE = 299
CLASS_NAMES = ["No DR", "Mild", "Moderate", "Severe", "Proliferative"]
CLAHE_CLIP_LIMIT = 2.0
CLAHE_GRID_SIZE = 8
FOV_MASK_SCALE = 0.92

app = Flask(__name__)


def preprocess(image_bytes: bytes) -> np.ndarray:
    array = np.frombuffer(image_bytes, dtype=np.uint8)
    bgr = cv2.imdecode(array, cv2.IMREAD_COLOR)
    if bgr is None:
        raise ValueError("Could not read this image. Please choose a JPG or PNG fundus image.")
    image = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    visible = gray > 7
    if visible.sum() >= 0.01 * visible.size:
        rows = np.where(visible.any(axis=1))[0]
        cols = np.where(visible.any(axis=0))[0]
        image = image[rows[0]:rows[-1] + 1, cols[0]:cols[-1] + 1]
    height, width = image.shape[:2]
    side = max(height, width)
    top = (side - height) // 2
    left = (side - width) // 2
    image = cv2.copyMakeBorder(image, top, side - height - top, left, side - width - left,
                               cv2.BORDER_CONSTANT, value=(0, 0, 0))
    image = cv2.resize(image, (IMG_SIZE, IMG_SIZE), interpolation=cv2.INTER_AREA)
    sigma = IMG_SIZE / 30
    blurred = cv2.GaussianBlur(image, (0, 0), sigma)
    image = cv2.addWeighted(image, 4, blurred, -4, 128)
    lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
    lightness, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=CLAHE_CLIP_LIMIT,
                            tileGridSize=(CLAHE_GRID_SIZE, CLAHE_GRID_SIZE))
    lightness = clahe.apply(lightness)
    image = cv2.cvtColor(cv2.merge([lightness, a, b]), cv2.COLOR_LAB2RGB)
    mask = np.zeros((IMG_SIZE, IMG_SIZE), dtype=np.uint8)
    radius = int((IMG_SIZE / 2) * FOV_MASK_SCALE)
    cv2.circle(mask, (IMG_SIZE // 2, IMG_SIZE // 2), radius, 1, -1)
    return (image * mask[..., None]).astype(np.uint8)


def encode_png(image: np.ndarray) -> str:
    ok, encoded = cv2.imencode(".png", cv2.cvtColor(image, cv2.COLOR_RGB2BGR))
    if not ok:
        raise RuntimeError("Could not encode the Grad-CAM image.")
    return "data:image/png;base64," + base64.b64encode(encoded.tobytes()).decode("ascii")


def make_gradcam_model(model):
    maps = [model.get_layer("inc_features").output, model.get_layer("res_features").output]
    outputs = maps + [model.get_layer("dr_logits").output, model.output]
    return keras.Model(model.inputs, outputs)


print(f"Loading hybrid model: {HYBRID_MODEL_PATH}", flush=True)
if not HYBRID_MODEL_PATH.is_file():
    raise FileNotFoundError(f"Hybrid model file not found: {HYBRID_MODEL_PATH}")
if not BASELINE_MODEL_PATH.is_file():
    raise FileNotFoundError(
        "Baseline model file not found: "
        f"{BASELINE_MODEL_PATH}. Place InceptionV3_baseline_best.keras beside retinacheck_server.py."
    )
hybrid_model = keras.models.load_model(HYBRID_MODEL_PATH, compile=False)
grad_model = make_gradcam_model(hybrid_model)
print(f"Loading InceptionV3 baseline: {BASELINE_MODEL_PATH}", flush=True)
baseline_model = keras.models.load_model(BASELINE_MODEL_PATH, compile=False)
print("Both models loaded; local RetinaCheck server is ready.", flush=True)


def explain(image: np.ndarray):
    tensor = tf.convert_to_tensor(image[None].astype(np.float32))
    with tf.GradientTape(persistent=True) as tape:
        features = grad_model(tensor, training=False)
        inc_map, res_map, logits, probabilities = features
        class_index = int(tf.argmax(probabilities[0]).numpy())
        score = logits[:, class_index]
    cams = []
    for fmap in (inc_map, res_map):
        gradients = tape.gradient(score, fmap)
        weights = tf.reduce_mean(gradients[0], axis=(0, 1))
        cam = tf.nn.relu(tf.reduce_sum(tf.cast(fmap[0], tf.float32) * weights, axis=-1))
        cam = tf.image.resize(cam[..., None], (IMG_SIZE, IMG_SIZE))[..., 0].numpy()
        cam = np.maximum(cam, 0)
        cam /= cam.max() + 1e-8
        cams.append(cam)
    del tape
    fused = np.mean(cams, axis=0)
    fused /= fused.max() + 1e-8
    heat = cv2.applyColorMap(np.uint8(255 * fused), cv2.COLORMAP_JET)
    heat = cv2.cvtColor(heat, cv2.COLOR_BGR2RGB)
    overlay = np.uint8(np.clip(0.60 * image + 0.40 * heat, 0, 255))
    probs = probabilities[0].numpy().astype(float)
    return class_index, probs, overlay


@app.get("/")
def home():
    return send_from_directory(ROOT, "retinacheck-prototype.html")


@app.get("/<path:name>")
def assets(name):
    return send_from_directory(ROOT, name)


@app.get("/api/health")
def health():
    return jsonify({
        "ready": True,
        "models": [HYBRID_MODEL_PATH.name, BASELINE_MODEL_PATH.name],
    })


@app.post("/api/analyze")
def analyze():
    upload = request.files.get("image")
    if upload is None or not upload.filename:
        return jsonify({"error": "Choose a retinal image first."}), 400
    try:
        image = preprocess(upload.read())
        grade, probs, overlay = explain(image)
        baseline_probs = baseline_model(
            tf.convert_to_tensor(image[None].astype(np.float32)), training=False
        )[0].numpy().astype(float)
        baseline_grade = int(np.argmax(baseline_probs))
        hybrid_result = {
            "name": "Hybrid InceptionV3–ResNet50 + SE",
            "grade": CLASS_NAMES[grade],
            "confidence": round(float(probs[grade]) * 100, 1),
            "probabilities": [round(float(p) * 100, 1) for p in probs],
        }
        baseline_result = {
            "name": "InceptionV3 baseline",
            "grade": CLASS_NAMES[baseline_grade],
            "confidence": round(float(baseline_probs[baseline_grade]) * 100, 1),
            "probabilities": [round(float(p) * 100, 1) for p in baseline_probs],
        }
        return jsonify({
            "models": [hybrid_result, baseline_result],
            # Keep the original hybrid fields for older prototype clients.
            "grade": CLASS_NAMES[grade],
            "confidence": round(float(probs[grade]) * 100, 1),
            "probabilities": [round(float(p) * 100, 1) for p in probs],
            "class_names": CLASS_NAMES,
            "heatmap": encode_png(overlay),
            "explanation": "Grad-CAM highlights image regions that influenced this model score. It is not proof of a lesion.",
        })
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        app.logger.exception("Inference failed")
        return jsonify({"error": f"Analysis failed: {exc}"}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=False)
