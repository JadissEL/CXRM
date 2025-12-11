"""
Configuration for Quadriga Interview Flow
"""
import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).parent.absolute()

# Upload settings
UPLOAD_FOLDER = BASE_DIR / 'uploads'
UPLOAD_FOLDER.mkdir(exist_ok=True)
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB

# Supported file formats
SUPPORTED_FORMATS = {
    'pdf': 'PDF Document',
    'docx': 'Word Document (Modern)',
    'doc': 'Word Document (Legacy)',
    'txt': 'Plain Text',
    'rtf': 'Rich Text Format',
    'odt': 'OpenDocument Text',
    'jpg': 'JPEG Image',
    'jpeg': 'JPEG Image',
    'png': 'PNG Image',
    'bmp': 'Bitmap Image',
    'gif': 'GIF Image',
    'htm': 'HTML Document',
    'html': 'HTML Document'
}

# AI settings
AI_MODEL = 'llama3.2'
MAX_CV_CHARS = 1500
AI_TEMPERATURE = 0.3
AI_MAX_TOKENS = 300
AI_CONTEXT_WINDOW = 1024

# Profile strength categories
PROFILE_STRENGTHS = [
    'Hospitality',
    'Customer care',
    'Customer technical support',
    'Customer service',
    'Sales',
    'B2B sales',
    'IT',
    'Languages'
]

# Flask settings
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
DEBUG = True
HOST = '127.0.0.1'
PORT = 5000
