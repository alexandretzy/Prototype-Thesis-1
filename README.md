# Prototype Thesis 1 — Diabetic Retinopathy

This repository contains two related thesis prototype versions. The **model-backed RetinaCheck prototype** is the runnable version that connects the web page to your trained hybrid model. The older `dist/` folder is a static interface demo with sample-only results.

## Set up the model-backed prototype in VS Code

### 1. Download the required files

- Install [Python 3.13 (64-bit)](https://www.python.org/downloads/). If the installer offers **Add python.exe to PATH**, select it.
- Install Git for Windows with Git LFS enabled. The trained 353 MB model is included in this repository using Git LFS.

### 2. Open the project folder

In PowerShell or Git Bash, run `git lfs install` and clone the repository: `git clone https://github.com/alexandretzy/Prototype-Thesis-1.git`. This downloads the model via Git LFS. In VS Code, choose **File → Open Folder** and open the `retinacheck-model` folder inside the cloned repository. The `.keras` model should already be beside `retinacheck_server.py`; if it is missing, run `git lfs pull` in the repository folder.

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

