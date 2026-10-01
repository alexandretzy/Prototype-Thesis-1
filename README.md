# RetinaCare Screening Prototype

A responsive, static interface prototype based on the thesis concept for interpretable diabetic retinopathy screening.

## Open it

Open `dist/index.html` in a browser. No install or build step is needed.

## Included workflow

- Overview dashboard with the five severity categories and fictional sample cases.
- Screening list with search and case detail navigation.
- Local JPG or PNG image preview, plus a selectable sample result scenario.
- Result view with five example class scores and a Grad-CAM-style overlay toggle.
- Model overview showing the proposed InceptionV3 and ResNet50 fusion pipeline and the prototype's JavaScript base classes.

## Prototype limits

This is a frontend demonstration. It has no trained model or backend. Predictions, confidence values, case records, and the heatmap are sample UI data, not outputs from a retinal-image analysis. A chosen image is previewed in the browser tab only; the prototype does not upload it or retain it after the tab is closed. Do not use it for diagnosis, referral, or patient care.
