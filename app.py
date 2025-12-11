"""
Quadriga Interview Flow - Main Application
AI-Powered Interview Management System v2.1
"""
from flask import Flask, render_template
from config import SECRET_KEY, DEBUG, HOST, PORT, SUPPORTED_FORMATS
from routes import cv_analysis, scoring


def create_app():
    """Application factory"""
    app = Flask(__name__)
    app.config['SECRET_KEY'] = SECRET_KEY
    app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB
    
    # Register blueprints
    app.register_blueprint(cv_analysis.bp)
    app.register_blueprint(scoring.bp)
    
    # Main route
    @app.route('/')
    def index():
        return render_template('index.html')
    
    return app


def print_startup_message():
    """Print startup information"""
    print("\n" + "=" * 70)
    print("  🎯 QUADRIGA INTERVIEW FLOW - AI CV ANALYZER v2.1")
    print("=" * 70)
    print(f"\n  🤖 AI: Llama 3.2 (Local, Free, Unlimited)")
    print(f"  📄 Formats: {len(SUPPORTED_FORMATS)} types supported")
    print(f"  🔒 Privacy: 100% Local Processing")
    print(f"\n  🌐 Server: http://{HOST}:{PORT}")
    print("\n" + "=" * 70)
    
    # Check optional features
    from services.cv_parser import HAS_OCR, HAS_RTF, HAS_ODT
    print("  Optional features:")
    print(f"    • OCR (images): {'✓ Enabled' if HAS_OCR else '✗ Disabled'}")
    print(f"    • RTF support: {'✓ Enabled' if HAS_RTF else '✗ Disabled'}")
    print(f"    • ODT support: {'✓ Enabled' if HAS_ODT else '✗ Disabled'}")
    print("=" * 70 + "\n")


if __name__ == '__main__':
    print_startup_message()
    
    app = create_app()
    app.run(
        host=HOST,
        port=PORT,
        debug=DEBUG
    )
