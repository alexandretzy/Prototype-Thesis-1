# Prototype Thesis 1 — Diabetic Retinopathy

This repository contains two related thesis prototype versions:

## Model-backed RetinaCheck prototype

The runnable local prototype is in [`retinacheck-model/`](retinacheck-model/). It connects a browser interface to a Python/Flask server, loads the trained hybrid InceptionV3–ResNet50–SE model, and generates Grad-CAM visualizations. See its [README](retinacheck-model/README.md) for downloads, VS Code setup, dependencies, and run instructions.

The trained `.keras` model is not included in this repository because it is about 353 MB and exceeds GitHub's regular 100 MB file limit. The subfolder README explains how to obtain it from Kaggle and where to place it.

## Static interface demo

The existing frontend demo is in [`dist/`](dist/). It is a static user-interface demonstration and does not run the trained model. Its sample predictions and heatmaps are illustrative only.

## Safety

Both versions are academic prototypes, not medical devices or diagnostic services. Predictions and Grad-CAM images are not a substitute for review by an eye-care professional.
