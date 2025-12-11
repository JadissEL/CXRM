"""
Scoring & Analytics Routes
"""
from flask import Blueprint, request, jsonify
from services.scoring import scorer
from services.database import db

bp = Blueprint('scoring', __name__)


@bp.route('/calculate_scores', methods=['POST'])
def calculate_scores():
    """
    Calculate strength and matching scores
    
    Expects JSON with:
    - profile_strengths: dict from AI
    - form_data: dict of form fields
    - ai_analysis: full AI analysis
    """
    try:
        data = request.get_json()
        
        profile_strengths = data.get('profile_strengths', {})
        form_data = data.get('form_data', {})
        ai_analysis = data.get('ai_analysis', {})
        
        # Calculate scores
        strengths_score = scorer.calculate_strengths_score(profile_strengths)
        matching_score = scorer.calculate_matching_score(form_data, ai_analysis)
        
        return jsonify({
            'success': True,
            'strengths_score': strengths_score,
            'matching_score': matching_score,
            'strengths_color': scorer.get_score_color(strengths_score),
            'matching_color': scorer.get_score_color(matching_score),
            'strengths_label': scorer.get_score_label(strengths_score),
            'matching_label': scorer.get_score_label(matching_score)
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })


@bp.route('/save_interview', methods=['POST'])
def save_interview():
    """Save complete interview to database"""
    try:
        data = request.get_json()
        
        interview_id = db.save_interview(data)
        
        return jsonify({
            'success': True,
            'interview_id': interview_id,
            'message': 'Interview saved successfully'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })


@bp.route('/check_bpo/<company>', methods=['GET'])
def check_bpo(company):
    """Check for BPO duplicates"""
    try:
        duplicates = db.check_bpo_duplicate(company)
        
        return jsonify({
            'success': True,
            'duplicates': duplicates,
            'count': len(duplicates)
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })
