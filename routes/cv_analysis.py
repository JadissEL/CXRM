"""
CV Analysis Routes
"""
import os
import json
import traceback
from flask import Blueprint, request, jsonify
from pathlib import Path
from services import CVParser, AIAnalyzer
from config import UPLOAD_FOLDER

bp = Blueprint('cv_analysis', __name__)

# Initialize services
cv_parser = CVParser()
ai_analyzer = AIAnalyzer()


@bp.route('/analyze_cv', methods=['POST'])
def analyze_cv():
    """
    Analyze uploaded CV
    
    Returns:
        JSON with analysis results
    """
    print("\n" + "🚀 " * 30)
    print("AI CV ANALYSIS STARTED")
    print("🚀 " * 30 + "\n")
    
    try:
        # Validate upload
        if 'cv' not in request.files:
            return jsonify({'success': False, 'error': 'No CV file uploaded'})
        
        file = request.files['cv']
        if not file.filename:
            return jsonify({'success': False, 'error': 'No file selected'})
        
        print(f"✓ File received: {file.filename}")
        
        # Save temporarily
        filepath = UPLOAD_FOLDER / file.filename
        file.save(str(filepath))
        
        # Extract text
        cv_text = cv_parser.extract(str(filepath))
        
        # Cleanup
        try:
            os.remove(filepath)
            print("✓ Temp file cleaned up")
        except:
            pass
        
        # Validate extraction
        if "Error" in cv_text[:50]:
            print(f"❌ Extraction error: {cv_text}")
            return jsonify({
                'success': False,
                'error': cv_text  # Return the specific error message
            })
            
        if len(cv_text.strip()) < 10:
            print(f"❌ Error: Text too short ({len(cv_text)} chars)")
            return jsonify({
                'success': False,
                'error': 'Could not extract text. The file might be an image or scanned PDF. Please try a text-based PDF or Word doc.'
            })
        
        print(f"✓ Extracted {len(cv_text)} characters\n")
        
        # Check Ollama
        if not ai_analyzer.check_ollama():
            return jsonify({
                'success': False,
                'error': 'Ollama not running'
            })
        
        print("✓ Ollama available\n")
        
        # Analyze with AI
        print(f"🧠 Analyzing CV...")
        analysis = ai_analyzer.analyze(cv_text)
        
        print("\n✅ Analysis complete!\n")
        
        return jsonify({
            'success': True,
            'analysis': json.dumps(analysis)
        })
    
    except Exception as e:
        print(f"\n❌ Error: {e}\n")
        traceback.print_exc()
        
        # Return fallback
        return jsonify({
            'success': True,
            'analysis': json.dumps(ai_analyzer._get_fallback())
        })
