@echo off
setlocal
set "APP=%~dp0"
set "PY=%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
set "VENV=%LOCALAPPDATA%\retinacheck-venv"
if not exist "%APP%Hybrid_InceptionV3_ResNet50_SE_best.keras" (
  echo Missing Hybrid_InceptionV3_ResNet50_SE_best.keras in this folder.
  pause
  exit /b 1
)
if not exist "%APP%InceptionV3_baseline_best.keras" (
  echo Missing InceptionV3_baseline_best.keras in this folder.
  echo If this is a Git clone, open a terminal here and run: git lfs pull
  pause
  exit /b 1
)
if not exist "%PY%" (
  echo Python 3.13 was not found at its usual install location.
  echo Reopen this window or reinstall Python with PATH enabled.
  pause
  exit /b 1
)
if not exist "%VENV%\Scripts\python.exe" (
  echo Creating the prototype's private Python environment...
  "%PY%" -m venv "%VENV%"
  if errorlevel 1 goto error
)
if not exist "%VENV%\.retinacheck-ready" (
  echo Installing TensorFlow and the prototype packages. This is a large download and may take a while.
  "%VENV%\Scripts\python.exe" -m pip install --upgrade pip
  if errorlevel 1 goto error
  "%VENV%\Scripts\python.exe" -m pip install -r "%APP%requirements-model.txt"
  if errorlevel 1 goto error
  type nul > "%VENV%\.retinacheck-ready"
)
echo Starting RetinaCheck. Keep this window open while using the prototype.
start "" http://127.0.0.1:8000
"%VENV%\Scripts\python.exe" "%APP%retinacheck_server.py"
exit /b 0
:error
echo Setup stopped because a step failed. Please keep this window open and share the error text.
pause
exit /b 1
