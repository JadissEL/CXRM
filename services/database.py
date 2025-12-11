"""
Database Models & Setup
SQLite database for interview management
"""
import sqlite3
import hashlib
import json
from datetime import datetime
from pathlib import Path
from config import BASE_DIR


class Database:
    """Database manager for interview data"""
    
    def __init__(self, db_path=None):
        if db_path is None:
            db_path = BASE_DIR / 'data' / 'interviews.db'
        
        db_path.parent.mkdir(exist_ok=True)
        self.db_path = db_path
        self.init_db()
    
    def get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_db(self):
        """Initialize database tables"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Candidates table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS candidates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                nationality TEXT,
                bpo_company TEXT,
                bpo_stop_date TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Interviews table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS interviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                candidate_id INTEGER,
                recruiter_name TEXT NOT NULL,
                position TEXT,
                interview_date DATE,
                interview_time TIME,
                rating INTEGER,
                decision TEXT,
                strengths_score INTEGER,
                matching_score INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (candidate_id) REFERENCES candidates(id)
            )
        ''')
        
        # CV Analysis Cache
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cv_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cv_hash TEXT UNIQUE NOT NULL,
                candidate_name TEXT,
                analysis_json TEXT NOT NULL,
                hit_count INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Interview Notes
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS interview_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                interview_id INTEGER,
                section TEXT,
                content TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (interview_id) REFERENCES interviews(id)
            )
        ''')
        
        # Create indexes
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_cv_hash ON cv_cache(cv_hash)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_candidate_name ON candidates(name)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_bpo_company ON candidates(bpo_company)')
        
        conn.commit()
        conn.close()
        
        print("✓ Database initialized")
    
    def get_cv_hash(self, cv_text):
        """Generate hash for CV text"""
        return hashlib.sha256(cv_text.encode()).hexdigest()
    
    def get_cached_analysis(self, cv_text):
        """Get cached CV analysis if exists"""
        cv_hash = self.get_cv_hash(cv_text)
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT analysis_json, candidate_name, hit_count 
            FROM cv_cache 
            WHERE cv_hash = ?
        ''', (cv_hash,))
        
        result = cursor.fetchone()
        
        if result:
            # Update hit count and last used
            cursor.execute('''
                UPDATE cv_cache 
                SET hit_count = hit_count + 1, 
                    last_used = CURRENT_TIMESTAMP 
                WHERE cv_hash = ?
            ''', (cv_hash,))
            conn.commit()
            
            print(f"✓ Cache HIT! (used {result['hit_count']} times)")
            conn.close()
            return json.loads(result['analysis_json'])
        
        conn.close()
        print("✗ Cache MISS - will analyze with AI")
        return None
    
    def cache_analysis(self, cv_text, analysis):
        """Cache CV analysis result"""
        cv_hash = self.get_cv_hash(cv_text)
        candidate_name = analysis.get('candidate_name', 'Unknown')
        analysis_json = json.dumps(analysis)
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO cv_cache (cv_hash, candidate_name, analysis_json)
                VALUES (?, ?, ?)
            ''', (cv_hash, candidate_name, analysis_json))
            
            conn.commit()
            print(f"✓ Analysis cached for: {candidate_name}")
        except sqlite3.IntegrityError:
            # Already exists, update it
            cursor.execute('''
                UPDATE cv_cache 
                SET analysis_json = ?, last_used = CURRENT_TIMESTAMP 
                WHERE cv_hash = ?
            ''', (analysis_json, cv_hash))
            conn.commit()
            print(f"✓ Cache updated for: {candidate_name}")
        
        conn.close()
    
    def check_bpo_duplicate(self, company_name):
        """Check for BPO duplicates"""
        if not company_name:
            return []
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT name, bpo_company, bpo_stop_date, created_at
            FROM candidates
            WHERE LOWER(bpo_company) LIKE LOWER(?)
            ORDER BY created_at DESC
            LIMIT 10
        ''', (f'%{company_name}%',))
        
        results = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return results
    
    def save_interview(self, interview_data):
        """Save complete interview"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Save or update candidate
        candidate_id = self._save_candidate(cursor, interview_data)
        
        # Save interview
        cursor.execute('''
            INSERT INTO interviews (
                candidate_id, recruiter_name, position, interview_date, 
                interview_time, rating, decision, strengths_score, matching_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            candidate_id,
            interview_data.get('recruiter_name'),
            interview_data.get('position'),
            interview_data.get('interview_date'),
            interview_data.get('interview_time'),
            interview_data.get('rating'),
            interview_data.get('decision'),
            interview_data.get('strengths_score'),
            interview_data.get('matching_score')
        ))
        
        interview_id = cursor.lastrowid
        
        # Save notes
        notes = interview_data.get('notes', {})
        for section, content in notes.items():
            if content:
                cursor.execute('''
                    INSERT INTO interview_notes (interview_id, section, content)
                    VALUES (?, ?, ?)
                ''', (interview_id, section, content))
        
        conn.commit()
        conn.close()
        
        print(f"✓ Interview saved (ID: {interview_id})")
        return interview_id
    
    def _save_candidate(self, cursor, data):
        """Save or update candidate"""
        cursor.execute('''
            SELECT id FROM candidates WHERE name = ?
        ''', (data.get('candidate_name'),))
        
        existing = cursor.fetchone()
        
        if existing:
            candidate_id = existing['id']
            cursor.execute('''
                UPDATE candidates 
                SET email = ?, phone = ?, nationality = ?, 
                    bpo_company = ?, bpo_stop_date = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (
                data.get('email'), data.get('phone'), data.get('nationality'),
                data.get('bpo_company'), data.get('bpo_stop_date'), candidate_id
            ))
        else:
            cursor.execute('''
                INSERT INTO candidates (name, email, phone, nationality, bpo_company, bpo_stop_date)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                data.get('candidate_name'), data.get('email'), data.get('phone'),
                data.get('nationality'), data.get('bpo_company'), data.get('bpo_stop_date')
            ))
            candidate_id = cursor.lastrowid
        
        return candidate_id


# Global database instance
db = Database()
