/**
 * Form Manager Module
 * Handles form auto-save, persistence, PDF generation
 */

const FormManager = {
    init() {
        this.load();
        this.startAutoSave();
        this.initPDFGeneration();
        this.initBPOToggle();
    },

    startAutoSave() {
        const form = document.getElementById('interviewForm');
        if (!form) return;
        window.AppState.autoSaveInterval = setInterval(() => this.save(), 30000);
        form.addEventListener('input', this.debounce(() => this.save(), 2000));
    },

    async save() {
        const form = document.getElementById('interviewForm');
        if (!form) return;

        const data = this.getFormData();

        // Add scores if available
        if (window.ScoringManager) {
            data.strengths_score = window.ScoringManager.scores.strengths;
            data.matching_score = window.ScoringManager.scores.matching;
        }

        // Local Storage
        localStorage.setItem('interviewFormData', JSON.stringify(data));
        console.log('💾 Form auto-saved locally');

        // Database Save
        try {
            const rawData = { ...data };
            rawData.notes = {
                'intro': document.getElementById('candidateIntro')?.value,
                'cv_analysis': document.getElementById('cvNotes')?.value,
                'summary': document.getElementById('strengths')?.value,
                'red_flags': document.getElementById('redFlags')?.value
            };

            await fetch('/save_interview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rawData)
            });
            console.log('☁️ Form saved to database');
        } catch (error) {
            console.error('Database save failed:', error);
        }
    },

    getFormData() {
        const form = document.getElementById('interviewForm');
        if (!form) return {};
        const data = {};
        const formData = new FormData(form);
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }

        // Add IDs manually
        form.querySelectorAll('input[id], select[id], textarea[id]').forEach(input => {
            if (input.type === 'radio' || input.type === 'checkbox') {
                if (input.checked) data[input.name] = input.value;
            } else {
                data[input.id] = input.value;
            }
        });
        return data;
    },

    load() {
        const savedData = localStorage.getItem('interviewFormData');
        if (!savedData) return;

        try {
            const data = JSON.parse(savedData);
            for (const [id, value] of Object.entries(data)) {
                if (['rating', 'decision', 'onSite', 'bpoCheck'].includes(id)) {
                    const radio = document.querySelector(`input[name="${id}"][value="${value}"]`);
                    if (radio) radio.checked = true;
                    continue;
                }
                const field = document.getElementById(id);
                if (field && !field.value) field.value = value;
            }

            // Restore scores
            if (window.ScoringManager) {
                if (data.strengths_score) window.ScoringManager.scores.strengths = data.strengths_score;
                if (data.matching_score) window.ScoringManager.scores.matching = data.matching_score;
                setTimeout(() => window.ScoringManager.updateCharts(), 500);
            }

            UIComponents.showToast('📂 Restored previous session', 'info');
        } catch (error) {
            console.error('Error loading form data:', error);
        }
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => { clearTimeout(timeout); func(...args); };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    initPDFGeneration() {
        const btn = document.getElementById('generateBtn');
        if (btn) btn.addEventListener('click', () => this.generatePDF());
    },

    async generatePDF() {
        const btn = document.getElementById('generateBtn');
        const originalContent = btn?.innerHTML;

        try {
            if (btn) {
                btn.innerHTML = '<i data-lucide="loader"></i> Generating...';
                btn.disabled = true;
                lucide.createIcons();
            }

            // Recalculate scores 
            if (window.ScoringManager) await window.ScoringManager.calculateScores();

            UIComponents.showToast('📄 Generating PDF...', 'info');

            // Fill PDF Template
            ['recruiterName', 'candidateName', 'positionRole', 'interviewDate', 'interviewTime'].forEach(id => {
                const el = document.getElementById(`pdf-${id.replace('Name', '').replace('Role', '').replace('interview', '').toLowerCase()}`);
                const val = document.getElementById(id)?.value;
                if (el) el.textContent = val || '';
            });
            // Fix special naming
            document.getElementById('pdf-recruiter').textContent = document.getElementById('recruiterName')?.value || '';
            document.getElementById('pdf-candidate').textContent = document.getElementById('candidateName')?.value || '';

            // Add Scores to PDF
            if (window.ScoringManager) {
                const { strengths, matching } = window.ScoringManager.scores;
                document.getElementById('pdf-scores-container').innerHTML = `
                    <div style="margin-bottom: 2rem; display: flex; gap: 2rem; justify-content: center;">
                        <div style="text-align: center; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; width: 150px;">
                            <h4 style="margin: 0 0 0.5rem 0; color: #64748b; font-size: 0.75rem;">STRENGTHS</h4>
                            <div style="font-size: 2rem; font-weight: 800; color: #10b981;">${strengths}%</div>
                        </div>
                        <div style="text-align: center; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; width: 150px;">
                            <h4 style="margin: 0 0 0.5rem 0; color: #64748b; font-size: 0.75rem;">MATCHING</h4>
                            <div style="font-size: 2rem; font-weight: 800; color: #8b5cf6;">${matching}%</div>
                        </div>
                    </div>
                `;
            }

            const element = document.getElementById('pdf-template');
            element.classList.remove('hidden');

            const opt = {
                margin: 10,
                filename: `Interview_${document.getElementById('candidateName')?.value || 'Candidate'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            if (typeof html2pdf !== 'undefined') {
                await html2pdf().set(opt).from(element).save();
                UIComponents.showToast('✅ PDF generated!', 'success');
            }

            element.classList.add('hidden');

        } catch (error) {
            console.error('PDF error:', error);
            UIComponents.showToast('❌ PDF generation failed', 'error');
        } finally {
            if (btn && originalContent) {
                btn.innerHTML = originalContent;
                btn.disabled = false;
                lucide.createIcons();
            }
        }
    },

    initBPOToggle() {
        window.toggleBpoDetails = async (show) => {
            const bpoDetails = document.getElementById('bpoDetails');
            if (show) {
                bpoDetails.classList.remove('hidden');
                const company = document.getElementById('bpoWhich')?.value;
                if (company) this.checkBPO(company);
            } else {
                bpoDetails.classList.add('hidden');
            }
        };
        document.getElementById('bpoWhich')?.addEventListener('blur', (e) => this.checkBPO(e.target.value));
    },

    async checkBPO(company) {
        if (!company) return;
        try {
            const response = await fetch(`/check_bpo/${company}`);
            const data = await response.json();
            if (data.success && data.count > 0) {
                UIComponents.showToast(`⚠️ Found ${data.count} potential duplicates!`, 'error');
                const note = document.getElementById('bpoNotes');
                if (note) note.value = `Possible duplicate: ${data.duplicates[0].name}`;
            }
        } catch (e) { console.error(e); }
    }
};

window.FormManager = FormManager;
