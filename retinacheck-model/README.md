# RetinaCheck Prototype

A local research prototype for the thesis **A Hybrid InceptionV3–ResNet50 Model for Interpretable Diabetic Retinopathy Detection**. Upload one retinal fundus image to compare the InceptionV3 baseline with the hybrid InceptionV3–ResNet50 + SE model. The page shows each model's predicted grade and five-class score bars, plus a Grad-CAM overlay for the hybrid model.

> **Research use only.** This is not a medical device and cannot diagnose diabetic retinopathy. Model scores are not clinical certainty. Grad-CAM highlights image regions that influenced the hybrid model score; it does not prove that a highlighted region is a lesion.

## Models in the comparison

- **InceptionV3 baseline:** the simpler reference classifier.
- **Hybrid InceptionV3–ResNet50 + SE:** combines learned features from InceptionV3 and ResNet50 using feature fusion and squeeze-and-excitation attention.
- Both models return scores for No DR, Mild, Moderate, Severe, and Proliferative DR. They analyze the same uploaded image so their outputs can be compared directly. They can disagree, and neither result is guaranteed to be correct.

The webpage uses HTML, CSS, and JavaScript. A local Python/Flask server uses TensorFlow/Keras for inference and OpenCV for image preparation.

## Requirements

- Windows 10 or 11, 64-bit
- Python 3.13 (64-bit)
- Git for Windows with Git LFS
- Internet access for cloning and the first package installation
- Both model files (downloaded through Git LFS):
  - `Hybrid_InceptionV3_ResNet50_SE_best.keras` (about 353 MB)
  - `InceptionV3_baseline_best.keras` (about 496 MB)

The models are tracked with Git LFS, approximately 849 MB combined. Install Git LFS before cloning. Avoid GitHub's **Download ZIP** option, which may contain small LFS pointer files instead of model weights.

## Set up in VS Code

1. In PowerShell or Git Bash, install/enable Git LFS and clone the project:

   ```powershell
   git lfs install
   git clone https://github.com/alexandretzy/Prototype-Thesis-1.git
   ```

2. In VS Code, choose **File → Open Folder** and open `Prototype-Thesis-1/retinacheck-model`. If either `.keras` file is missing or is only a small pointer file, run `git lfs pull` in the repository folder.
3. Make sure Python 3.13 (64-bit) is installed. In the VS Code terminal, create and activate a virtual environment:

   ```powershell
   py -3.13 -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

   If PowerShell blocks activation, use Command Prompt and run:

   ```bat
   .venv\Scriptsctivate.bat
   ```

4. Install the dependencies:

   ```powershell
   python -m pip install --upgrade pip
   python -m pip install -r requirements-model.txt
   ```

   TensorFlow is a large download, so the first installation can take several minutes. Alternatively, double-click `start-retinacheck.bat`; it creates a private environment and installs the packages on the first run.

## Run and use the prototype

With the virtual environment active, run:

```powershell
python retinacheck_server.py
```

Open [http://127.0.0.1:8000/](http://127.0.0.1:8000/) in your browser. Keep the terminal window open while using the page. To stop the local server, press **Ctrl+C** in that terminal.

1. Select a real retinal fundus JPG or PNG with **Choose an image**.
2. Click **Compare models**. Both trained models analyze that same image automatically; the user does not select a grade.
3. Compare their predicted grades and class score bars. The hybrid model's Grad-CAM overlay appears below.

The sample preview dropdown is only for previewing the interface. Those synthetic samples are not analyzed by either model. The prototype preprocesses images to 299 × 299 pixels following the notebook workflow. It performs inference only; it does not train or update either model.

## Generate a correctly predicted Moderate example in Kaggle

The APTOS retinal image is not included here. Use your own Kaggle account with access to the competition data and follow its rules. Run the notebook through **10. Validation comparison and training curves** so it defines `val_probabilities` and `y_val`. Add and run this separate code cell after that section:

```python
hybrid_name = next(name for name in val_probabilities if "Hybrid" in name)
hybrid_probs = val_probabilities[hybrid_name]
hybrid_predictions = hybrid_probs.argmax(axis=1)

moderate_matches = [
    i for i in range(len(y_val))
    if y_val[i] == 2 and hybrid_predictions[i] == 2
]

if moderate_matches:
    best_i = max(moderate_matches, key=lambda i: hybrid_probs[i, 2])
    source_path = Path(val_df.iloc[best_i]["path"])
    output_path = OUTPUT_DIR / "moderate-dr-correctly-predicted.png"
    shutil.copy2(source_path, output_path)

    print(f"Saved image: {output_path}")
    print("True label: Moderate")
    print(f"Model prediction: {CLASS_NAMES[hybrid_predictions[best_i]]}")
    print(f"Model confidence: {hybrid_probs[best_i, 2] * 100:.1f}%")
else:
    print("No validation image was both labeled Moderate and predicted Moderate.")
```

If a matching image is found, expand `outputs` in Kaggle's **Output** panel and download `moderate-dr-correctly-predicted.png`. Upload it to the local prototype to compare both model outputs. The image is selected because its dataset label and hybrid prediction are both Moderate; another model version may produce a different result. Follow Kaggle's competition rules and do not redistribute APTOS images through this public repository.

## Generate No DR, Mild, Severe, and Proliferative examples

To create four more real examples at the same **3216 × 2136 pixels** as the Moderate image, run this cell after the Kaggle notebook's validation comparison has completed and `val_probabilities`, `y_val`, `val_df`, and `OUTPUT_DIR` are available. Each file is selected only when its validation label matches the hybrid model's prediction. The baseline may predict a different grade; that is useful to show in the side-by-side comparison.

```python
import cv2
import numpy as np
from pathlib import Path

hybrid_name = next(name for name in val_probabilities if "Hybrid" in name)
hybrid_probs = val_probabilities[hybrid_name]
hybrid_predictions = hybrid_probs.argmax(axis=1)

examples = [
    (0, "no-dr-correctly-predicted.png"),
    (1, "mild-dr-correctly-predicted.png"),
    (3, "severe-dr-correctly-predicted.png"),
    (4, "proliferative-dr-correctly-predicted.png"),
]

for grade, filename in examples:
    matches = np.flatnonzero((y_val == grade) & (hybrid_predictions == grade))
    if len(matches) == 0:
        print(f"No correctly predicted {CLASS_NAMES[grade]} validation image was found.")
        continue

    best_i = int(max(matches, key=lambda i: hybrid_probs[i, grade]))
    source_path = Path(val_df.iloc[best_i]["path"])
    image = cv2.imread(str(source_path), cv2.IMREAD_COLOR)
    if image is None:
        print(f"Could not read image: {source_path}")
        continue

    # Match the Moderate example's pixel dimensions.
    image = cv2.resize(image, (3216, 2136), interpolation=cv2.INTER_AREA)
    output_path = OUTPUT_DIR / filename
    cv2.imwrite(str(output_path), image)
    print(
        f"Saved {output_path} | true label: {CLASS_NAMES[grade]} | "
        f"hybrid prediction: {CLASS_NAMES[hybrid_predictions[best_i]]} | "
        f"score: {hybrid_probs[best_i, grade] * 100:.1f}%"
    )
```

In Kaggle's **Output** panel, expand `outputs` and download the PNG files that were saved. Upload each with **Choose an image** and click **Compare models**. If a grade has no correctly predicted image in the validation split, the cell reports that and does not create a misleading example. Follow the Kaggle competition rules; do not add these APTOS images to the public repository.

## Troubleshooting

- **Model file not found:** confirm both `.keras` files are beside `retinacheck_server.py`. If you cloned the project, run `git lfs pull` and check that the files are full-sized, not tiny pointer files.
- **Python command not found:** install Python 3.13 (64-bit), then reopen VS Code.
- **Package installation fails:** check your internet connection and retry the pip commands with the virtual environment active.
- **Page cannot be reached:** ensure the server terminal says it is running at `http://127.0.0.1:8000`, and keep that terminal open.
- **Port 8000 is already in use:** stop the other local server using that port, then restart this one.

## Project files

- `retinacheck-prototype.html` — browser interface and comparison display
- `retinacheck_server.py` — preprocessing, both model predictions, and hybrid Grad-CAM
- `Hybrid_InceptionV3_ResNet50_SE_best.keras` — hybrid model (Git LFS)
- `InceptionV3_baseline_best.keras` — baseline model (Git LFS)
- `requirements-model.txt` — Python dependencies
- `start-retinacheck.bat` — Windows first-run setup and launcher
- `retinacheck-prototype-overview.docx` — thesis-friendly project overview
- `sample-retina-*.png` — synthetic preview-only images
