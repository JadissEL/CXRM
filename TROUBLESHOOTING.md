# 🔧 Troubleshooting Guide

## ❌ **Error: "Could not extract text from CV"**

If you see this error, especially when uploading images (PNG, JPG, Screenshot) or scanned PDFs, it means the system cannot read the text.

### **The Cause**
Your computer is missing **Tesseract OCR**, the software required to read text from images.

### **The Fix (Windows)**

1. **Download Tesseract Installer:**
   - Go to: [https://github.com/UB-Mannheim/tesseract/wiki](https://github.com/UB-Mannheim/tesseract/wiki)
   - Download the **64-bit installer** (e.g., `tesseract-ocr-w64-setup-v5.x.x.exe`).

2. **Install It:**
   - Run the installer.
   - **IMPORTANT:** During installation, copy the installation path (usually `C:\Program Files\Tesseract-OCR`).

3. **Add to PATH (Optional but recommended):**
   - Click Start -> Type "Edit the system environment variables" -> Enter.
   - Click "Environment Variables".
   - Under "System variables", select "Path" -> Click "Edit".
   - Click "New" -> Paste the installation path (`C:\Program Files\Tesseract-OCR`).
   - Click OK -> OK -> OK.

4. **Restart Your Computer:**
   - This ensures the new path is recognized.

---

## ⚠️ **Workaround (If you can't install Tesseract)**

1. **Convert your Image to Text/PDF:**
   - Use an online converter to convert your PNG/JPG to a **text-based PDF**.
   - Or simply copy-paste the text into a `.txt` file.

2. **Upload the converted file.**
