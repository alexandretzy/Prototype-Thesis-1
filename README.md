# Prototype Thesis 1 — Diabetic Retinopathy

This repository contains a static interface demo in `dist/` and the runnable **RetinaCheck model-backed prototype** in `retinacheck-model/`.

The model-backed prototype compares the trained **InceptionV3 baseline** and **Hybrid InceptionV3–ResNet50 + SE** on the same uploaded retinal image. It displays both predicted grades and their five-class scores, plus a Grad-CAM overlay for the hybrid model. The uploaded image is classified automatically; users do not choose the grade.

## Run the prototype

1. Install Git for Windows, Git LFS, and Python 3.13 (64-bit).
2. In PowerShell or Git Bash, run:

   ```powershell
   git lfs install
   git clone https://github.com/alexandretzy/Prototype-Thesis-1.git
   ```

   Git LFS downloads both model files, about 849 MB combined. Avoid GitHub's **Download ZIP** option. If model files are missing after cloning, run `git lfs pull` from the cloned repository.
3. In VS Code, choose **File → Open Folder** and open `Prototype-Thesis-1/retinacheck-model`.
4. Follow the setup, dependency, run, and usage steps in [`retinacheck-model/README.md`](retinacheck-model/README.md).

The runnable folder includes a Windows launcher, `start-retinacheck.bat`, which creates a private Python environment, installs the dependencies on first use, and starts the local server. Keep its terminal window open while using the webpage at `http://127.0.0.1:8000/`.

## Moderate example

The detailed README explains how to generate `moderate-dr-correctly-predicted.png` from a validation image in Kaggle. The APTOS image itself is not redistributed in this repository; follow the Kaggle competition rules.

## Important limitation

This is an academic research prototype, not a medical device. Model scores are not clinical certainty, and Grad-CAM does not prove that an image region is a lesion. A qualified eye-care professional must interpret retinal images and make clinical decisions.
