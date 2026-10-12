# RetinaCheck Prototype

A small, local research prototype for the thesis **A Hybrid InceptionV3–ResNet50 Model for Interpretable Diabetic Retinopathy Detection**. It lets a user select a retinal fundus image, run the trained model, and view a Grad-CAM heatmap.

> **Research use only.** This prototype is not a medical device and cannot diagnose diabetic retinopathy. A clinician must interpret retinal images and make care decisions. Grad-CAM highlights image regions that influenced a model score; it does not prove that a highlighted region is a lesion.

## What the model does

The trained model combines two image-analysis branches:

- **InceptionV3** learns visual patterns at different scales.
- **ResNet50** learns features through a deep network with shortcut connections.
- **Feature fusion** joins information from the two branches.
- **SE (squeeze-and-excitation) attention** learns which fused features to emphasize.
- A final classifier returns scores for five grades: No DR, Mild, Moderate, Severe, and Proliferative DR.
- **Grad-CAM** is calculated after prediction to visualize influential regions from both branches.

The browser interface is built with HTML, CSS, and JavaScript. A local Python/Flask server loads the `.keras` model, preprocesses the uploaded image with OpenCV, and returns a prediction and heatmap.

## Requirements

- Windows 10 or 11, 64-bit
- [Python 3.13 (64-bit)](https://www.python.org/downloads/). During setup, select **Add python.exe to PATH** if offered.
- [Visual Studio Code](https://code.visualstudio.com/)
- The trained file `Hybrid_InceptionV3_ResNet50_SE_best.keras` (about 353 MB)
- Internet for the first dependency installation

The model file is not stored in this GitHub repository because it is larger than GitHub's regular 100 MB file limit. Download the `.keras` model from the Kaggle notebook's **Output** panel (or from your secure model storage) and place it in the same folder as `retinacheck_server.py`.

The expected folder contents are:

```text
retinacheck-model/
├── README.md
├── retinacheck-prototype.html
├── retinacheck_server.py
├── requirements-model.txt
├── start-retinacheck.bat
└── Hybrid_InceptionV3_ResNet50_SE_best.keras  # download separately
```

## Set up in VS Code

1. Download or clone this project, then open its project folder in VS Code (**File → Open Folder**).
2. Download `Hybrid_InceptionV3_ResNet50_SE_best.keras` from Kaggle and copy it into the project folder beside `retinacheck_server.py`.
3. In VS Code, open **Terminal → New Terminal**. Create and activate a virtual environment:

   ```powershell
   py -3.13 -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

   If PowerShell blocks activation, use Command Prompt in VS Code and run:

   ```bat
   .venv\Scripts\activate.bat
   ```

4. Install the required packages:

   ```powershell
   python -m pip install --upgrade pip
   python -m pip install -r requirements-model.txt
   ```

   TensorFlow is a large download, so the first installation may take several minutes.

## Run the prototype

With the virtual environment active, start the server:

```powershell
python retinacheck_server.py
```

Open [http://127.0.0.1:8000/](http://127.0.0.1:8000/) in a browser. Keep the VS Code terminal running while you use the page. To stop the server, focus the terminal and press **Ctrl+C**.

On the original Windows setup, you can also double-click `start-retinacheck.bat`; it creates a local `.venv`, installs the dependencies the first time, and starts the server.

## Use the page

1. Choose a retinal fundus image in JPG or PNG format using the upload control.
2. Select **Analyze with model**.
3. Review the predicted grade, model score, and Grad-CAM overlay.
4. The **sample preview** dropdown only changes the sample preview. Those sample images are not analyzed by the trained model. Use the upload control for an actual model run.

The server preprocesses images to 299 × 299 pixels using the notebook's image preparation workflow, then evaluates the saved model. The prototype performs inference only; it does not train or update the model.

## Troubleshooting

- **“Model file not found”**: confirm the `.keras` file is in the same folder as `retinacheck_server.py` and that its filename is exactly `Hybrid_InceptionV3_ResNet50_SE_best.keras`.
- **`py -3.13` is not recognized**: install Python 3.13 (64-bit), then reopen VS Code so it detects the installation.
- **Package installation fails**: check your internet connection, confirm the virtual environment is active, and retry the `pip install` command.
- **The page does not open**: confirm the server started successfully and visit `http://127.0.0.1:8000/` yourself.
- **Port 8000 is already in use**: close the other local server using that port, then restart this one.

## Project files

- `retinacheck-prototype.html` — browser interface
- `retinacheck_server.py` — Flask server, model inference, preprocessing, and Grad-CAM
- `requirements-model.txt` — Python packages
- `start-retinacheck.bat` — Windows helper for first-time setup and starting the server
- `retinacheck-prototype-overview.docx` — thesis-friendly description of the prototype (if included in the downloaded project)
- `sample-retina-*.png` — preview-only sample images; not diagnostic test cases

## Important note about results

Model scores are outputs of this trained model, not measures of clinical certainty. Performance depends on the training data, image quality, and camera differences. The model and heatmaps should be evaluated by qualified researchers and clinicians before making claims about clinical use or lesion localization.

