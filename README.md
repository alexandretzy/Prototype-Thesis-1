# Prototype Thesis 1 — Diabetic Retinopathy

This repository contains two related thesis prototype versions. The **model-backed RetinaCheck prototype** is the runnable version that connects the web page to your trained hybrid model. The older `dist/` folder is a static interface demo with sample-only results.

## Set up the model-backed prototype in VS Code

### 1. Download the required files

- Install [Python 3.13 (64-bit)](https://www.python.org/downloads/). If the installer offers **Add python.exe to PATH**, select it.
- Install [Visual Studio Code](https://code.visualstudio.com/).
- Download `Hybrid_InceptionV3_ResNet50_SE_best.keras` from the Kaggle notebook's **Output** panel. The file is about 353 MB and is not stored in this repository because it exceeds GitHub's regular 100 MB file limit.

### 2. Open the project folder

Clone or download this repository. In VS Code, choose **File → Open Folder**, then open the `retinacheck-model` folder. Copy the downloaded `.keras` file into that same folder, beside `retinacheck_server.py`.

### 3. Install the Python dependencies

In VS Code, choose **Terminal → New Terminal** and run:

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements-model.txt
```

TensorFlow is a large download, so the first installation can take several minutes. If PowerShell blocks environment activation, choose **Command Prompt** as the VS Code terminal and run `.venv\Scripts\activate.bat`, then run the two `pip` commands above.

### 4. Run the prototype

Keep the virtual environment active and start the local server:

```powershell
python retinacheck_server.py
```

Open [http://127.0.0.1:8000/](http://127.0.0.1:8000/) in your browser. Leave the terminal running while using the page. Press **Ctrl+C** in that terminal to stop it.

On Windows, you can also double-click `retinacheck-model/start-retinacheck.bat`. It creates a `.venv`, installs the dependencies the first time, and starts the server.

### 5. Use it

1. Choose a retinal fundus image in JPG or PNG format using **Choose an image**.
2. Select **Analyze with model**.
3. Review the predicted grade, model score, and Grad-CAM overlay.

The **sample preview** dropdown only displays preview images; those samples are not analyzed. Upload an image for an actual model run. The prototype performs inference only; it does not train or update the model.

## Project files

The runnable prototype and its full setup guide are in [`retinacheck-model/`](retinacheck-model/). That folder includes the HTML interface, Python/Flask server, dependency list, Windows launcher, sample previews, and the Word overview document. The full folder README also includes troubleshooting steps.

## Important limitations

This is an academic prototype, not a medical device or diagnostic service. Model scores are not measures of clinical certainty. Grad-CAM highlights regions that influenced a model score; it does not prove that a highlighted region is a lesion. A qualified eye-care professional must interpret retinal images and make clinical decisions.
