"""
Interview Scoring System
Calculates strength and matching scores
"""


class InterviewScorer:
    """Calculate interview scores based on AI analysis and form data"""
    
    def __init__(self):
        self.strength_weights = {
            'Hospitality': 10,
            'Customer care': 10,
            'Customer technical support': 15,
            'Customer service': 10,
            'Sales': 12,
            'B2B sales': 15,
            'IT': 13,
            'Languages': 15
        }
    
    def calculate_strengths_score(self, profile_strengths):
        """
        Calculate strengths score (0-100) based on AI-detected strengths
        
        Args:
            profile_strengths: dict of strength: bool from AI analysis
            
        Returns:
            int: Score from 0-100
        """
        if not profile_strengths:
            return 0
        
        total_possible = sum(self.strength_weights.values())
        achieved = 0
        
        for strength, has_it in profile_strengths.items():
            if has_it and strength in self.strength_weights:
                achieved += self.strength_weights[strength]
        
        score = int((achieved / total_possible) * 100)
        return min(100, score)
    
    def calculate_matching_score(self, form_data, ai_analysis):
        """
        Calculate matching score (0-100) based on form responses
        
        Scoring factors:
        - Availability (20 points)
        - Shifts willingness (15 points)
        - On-site availability (15 points)
        - Permit status (10 points)
        - BPO status (10 points)
        - Notice period (10 points)
        - Mobility (10 points)
        - Rating (10 points)
        
        Args:
            form_data: dict of form field values
            ai_analysis: dict from AI analysis
            
        Returns:
            int: Score from 0-100
        """
        score = 0
        
        # Availability (20 points)
        avail = form_data.get('availGeneral', '').lower()
        if 'asap' in avail or 'immediate' in avail:
            score += 20
        elif 'week' in avail or '1 month' in avail:
            score += 15
        elif avail:
            score += 10
        
        # Shifts (15 points)
        shift = form_data.get('shiftAvail', '')
        if 'fully' in shift.lower():
            score += 15
        elif 'with restrictions' in shift.lower():
            score += 8
        
        # On-site (15 points)
        onsite = form_data.get('onSite', '')
        if onsite == 'Yes':
            score += 15
        elif onsite == 'Flexible':
            score += 10
        elif onsite == 'No':
            score += 0
        
        # Permit status (10 points)
        permit = form_data.get('permitStatus', '')
        if 'Valid' in permit:
            score += 10
        elif 'In Process' in permit:
            score += 5
        
        # BPO status (10 points - inverse scoring)
        bpo = form_data.get('bpoCheck', '')
        if bpo == 'No':
            score += 10
        elif bpo == 'Yes':
            # Check if cooled off
            score += 5
        
        # Notice period (10 points)
        notice = form_data.get('noticePeriod', '').lower()
        if not notice or 'none' in notice or '0' in notice:
            score += 10
        elif 'week' in notice or '1' in notice:
            score += 7
        elif 'month' in notice:
            score += 4
        
        # Mobility (10 points)
        mobility = form_data.get('mobility', [])
        if 'Car' in mobility and 'License' in mobility:
            score += 10
        elif 'Car' in mobility or 'License' in mobility:
            score += 5
        
        # Overall rating (10 points)
        rating = form_data.get('rating', 0)
        try:
            rating_val = int(rating)
            score += rating_val * 2  # 5 stars = 10 points
        except:
            pass
        
        return min(100, score)
    
    def get_score_color(self, score):
        """Get color for score visualization (Monochrome Theme)"""
        if score >= 80:
            return '#0f172a'  # Onyx (High)
        elif score >= 60:
            return '#475569'  # Slate (Good)
        elif score >= 40:
            return '#64748b'  # Grey (Average)
        else:
            return '#94a3b8'  # Silver (Low)
    
    def get_score_label(self, score):
        """Get label for score"""
        if score >= 80:
            return 'Excellent'
        elif score >= 60:
            return 'Good'
        elif score >= 40:
            return 'Fair'
        else:
            return 'Poor'


# Global scorer instance
scorer = InterviewScorer()
