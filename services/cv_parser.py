"""
CV Text Extraction Service
Handles all file format parsing
"""
import os
import re
from pathlib import Path

# Check for optional dependencies
# Check for optional dependencies
HAS_PDFPLUMBER = False
HAS_PYPDF = False
HAS_PDF = False

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
    HAS_PDF = True
except ImportError:
    pass

try:
    import pypdf
    HAS_PYPDF = True
    HAS_PDF = True
except ImportError:
    pass

try:
    from docx import Document
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False

try:
    from striprtf import rtf_to_text
    HAS_RTF = True
except ImportError:
    HAS_RTF = False

try:
    from odf import text as odf_text, teletype
    from odf.opendocument import load as odf_load
    HAS_ODT = True
except ImportError:
    HAS_ODT = False

try:
    from PIL import Image
    import pytesseract
    
    # Auto-detect Tesseract path on Windows
    if os.name == 'nt':
        possible_paths = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            os.path.join(os.getenv('LOCALAPPDATA', ''), r"Tesseract-OCR\tesseract.exe")
        ]
        for path in possible_paths:
            if os.path.exists(path):
                pytesseract.pytesseract.tesseract_cmd = path
                break
                
    HAS_OCR = True
except ImportError:
    HAS_OCR = False


class CVParser:
    """Universal CV text extractor"""
    
    def __init__(self):
        self.extractors = {
            'pdf': self._extract_pdf,
            'docx': self._extract_docx,
            'doc': self._extract_docx,
            'txt': self._extract_txt,
            'rtf': self._extract_rtf,
            'odt': self._extract_odt,
            'jpg': self._extract_image,
            'jpeg': self._extract_image,
            'png': self._extract_image,
            'bmp': self._extract_image,
            'gif': self._extract_image,
            'htm': self._extract_html,
            'html': self._extract_html
        }
    
    def extract(self, filepath):
        """Main extraction method"""
        ext = Path(filepath).suffix.lower().replace('.', '')
        
        if ext not in self.extractors:
            return f"Unsupported format: .{ext}"
        
        extractor = self.extractors[ext]
        return extractor(filepath)
    
    def _extract_pdf(self, filepath):
        """Extract from PDF with fallback strategies"""
        if not HAS_PDFPLUMBER and not HAS_PYPDF:
            return "Error: PDF libraries not installed"
        
        text_plumber = ""
        text_pypdf = ""
        
        # Method 1: pdfplumber (Better layout preservation)
        if HAS_PDFPLUMBER:
            try:
                with pdfplumber.open(filepath) as pdf:
                    text_plumber = '\n'.join(page.extract_text() or '' for page in pdf.pages)
            except Exception as e:
                print(f"pdfplumber error: {e}")

        # Method 2: pypdf (Robust fallback)
        if HAS_PYPDF:
            try:
                with open(filepath, 'rb') as file:
                    reader = pypdf.PdfReader(file)
                    text_pypdf = '\n'.join(page.extract_text() or '' for page in reader.pages)
            except Exception as e:
                print(f"pypdf error: {e}")
            
        # Return the best result
        if len(text_plumber.strip()) > len(text_pypdf.strip()):
            return text_plumber
        elif len(text_pypdf.strip()) > 0:
            return text_pypdf
        else:
            return text_plumber # Return whatever we have even if empty
    
    def _extract_docx(self, filepath):
        """Extract from DOCX/DOC"""
        if not HAS_DOCX:
            return "Error: python-docx not installed"
        
        try:
            doc = Document(filepath)
            paragraphs = [p.text for p in doc.paragraphs]
            
            # Extract tables
            tables = []
            for table in doc.tables:
                for row in table.rows:
                    tables.append(' | '.join(cell.text for cell in row.cells))
            
            return '\n'.join(paragraphs + tables)
        except Exception as e:
            return f"Error extracting DOCX: {e}"
    
    def _extract_txt(self, filepath):
        """Extract from TXT"""
        encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1', 'ascii']
        
        for encoding in encodings:
            try:
                with open(filepath, 'r', encoding=encoding) as f:
                    return f.read()
            except:
                continue
        
        return "Error: Could not decode text file"
    
    def _extract_rtf(self, filepath):
        """Extract from RTF"""
        if not HAS_RTF:
            return "Error: striprtf not installed"
        
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                rtf_content = f.read()
            return rtf_to_text(rtf_content)
        except Exception as e:
            return f"Error extracting RTF: {e}"
    
    def _extract_odt(self, filepath):
        """Extract from ODT"""
        if not HAS_ODT:
            return "Error: odfpy not installed"
        
        try:
            doc = odf_load(filepath)
            all_text = []
            for paragraph in doc.getElementsByType(odf_text.P):
                all_text.append(teletype.extractText(paragraph))
            return '\n'.join(all_text)
        except Exception as e:
            return f"Error extracting ODT: {e}"
    
    def _extract_image(self, filepath):
        """Extract from image using OCR"""
        if not HAS_OCR:
            return "Error: OCR not available. Install pytesseract and Tesseract"
        
        try:
            image = Image.open(filepath)
            text = pytesseract.image_to_string(image)
            return text
        except Exception as e:
            return f"Error with OCR: {e}"
    
    def _extract_html(self, filepath):
        """Extract from HTML"""
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                html = f.read()
            # Remove tags
            text = re.sub(r'<[^>]+>', ' ', html)
            text = re.sub(r'\s+', ' ', text)
            return text.strip()
        except Exception as e:
            return f"Error extracting HTML: {e}"
