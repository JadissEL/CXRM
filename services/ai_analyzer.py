"""
AI Analysis Service
Handles Ollama integration and CV analysis
"""
import json
import re
import ollama
from config import AI_MODEL, AI_TEMPERATURE, AI_MAX_TOKENS, AI_CONTEXT_WINDOW, MAX_CV_CHARS, PROFILE_STRENGTHS


class AIAnalyzer:
    """AI-powered CV analyzer using Ollama"""
    
    def __init__(self):
        self.model = AI_MODEL
        self.temperature = AI_TEMPERATURE
        self.max_tokens = AI_MAX_TOKENS
        self.context_window = AI_CONTEXT_WINDOW
    
    def analyze(self, cv_text, use_cache=True):
        """
        Analyze CV and extract structured information
        Uses caching for previously analyzed CVs
        
        Returns:
            dict: Analysis results with name, questions, strengths, etc.
        """
        # Check cache first
        if use_cache:
            from services.database import db
            cached = db.get_cached_analysis(cv_text)
            if cached:
                print("⚡ Using cached analysis (instant!)")
                return cached
        
        # Truncate if too long
        if len(cv_text) > MAX_CV_CHARS:
            cv_text = cv_text[:MAX_CV_CHARS]
            print(f"⚠️  CV truncated to {MAX_CV_CHARS} chars")
        
        prompt = self._build_prompt(cv_text)
        
        try:
            response = ollama.chat(
                model=self.model,
                messages=[{'role': 'user', 'content': prompt}],
                options={
                    'temperature': self.temperature,
                    'num_predict': self.max_tokens,
                    'num_ctx': self.context_window
                }
            )
            
            raw_output = response['message']['content'].strip()
            print(f"✓ AI response: {len(raw_output)} chars")
            
            result = self._parse_response(raw_output)
            
            # Cache the result
            if use_cache:
                from services.database import db
                db.cache_analysis(cv_text, result)
            
            return result
            
        except Exception as e:
            print(f"✗ AI error: {e}")
            return self._get_fallback()
    
    def _build_prompt(self, cv_text):
        """Build the analysis prompt"""
        strengths_dict = {k: False for k in PROFILE_STRENGTHS}
        strengths_json = json.dumps(strengths_dict, indent=4)
        
        return f"""Analyze this CV and extract information. Return ONLY JSON with NO markdown:

{{
  "candidate_name": "Full name of candidate (if found, otherwise 'Unknown')",
  "intro_advice": "Brief background summary (20 words max)",
  "cv_deep_dive_questions": [
    "Specific question 1 about their experience",
    "Specific question 2 about employment gaps or transitions",
    "Specific question 3 about specific skills mentioned",
    "Specific question 4 about achievements or projects",
    "Specific question 5 about career progression",
    "Specific question 6 about motivations or goals"
  ],
  "profile_strengths": {strengths_json},
  "availability_context": "Employment status clues (10 words max)",
  "relocation_context": "Location info (10 words max)"
}}

IMPORTANT: 
- For profile_strengths, set to true ONLY if the CV clearly shows experience in that area
- Check for keywords like "hotel", "hospitality", "customer support", "sales", "B2B", "technical support", "IT", languages mentioned, etc.
- Be specific with questions based on actual CV content

CV TEXT:
{cv_text}

Return ONLY the JSON object above, no other text."""
    
    def _parse_response(self, raw_output):
        """Parse AI response and extract JSON"""
        try:
            # Remove markdown formatting
            clean = re.sub(r'```json\s*', '', raw_output)
            clean = re.sub(r'```\s*', '', clean).strip()
            
            # Extract JSON
            start = clean.index('{')
            end = clean.rindex('}') + 1
            clean = clean[start:end]
            
            # Parse and validate
            data = json.loads(clean)
            print("✓ JSON parsed successfully")
            
            return data
            
        except Exception as e:
            print(f"⚠️  JSON parsing failed: {e}")
            return self._get_fallback()
    
    def _get_fallback(self):
        """Return fallback data when AI fails"""
        return {
            'candidate_name': 'Unknown',
            'intro_advice': 'Review candidate background and experience',
            'cv_deep_dive_questions': [
                'Tell me about your most recent role and responsibilities',
                'What are you looking for in your next position?',
                'How do you handle challenging situations?',
                'Can you describe a significant achievement?',
                'What interests you about this opportunity?',
                'Where do you see yourself in 3 years?'
            ],
            'profile_strengths': {k: False for k in PROFILE_STRENGTHS},
            'availability_context': 'Confirm availability and notice period',
            'relocation_context': 'Verify location preferences'
        }
    
    def check_ollama(self):
        """Check if Ollama is running"""
        try:
            ollama.list()
            return True
        except:
            return False
