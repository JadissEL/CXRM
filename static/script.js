/**
 * Quadriga Interview Flow v2.1
 * Combined script for browser compatibility
 */

console.log('🚀 Quadriga Interview Flow v2.1 Loaded');

// ============================================
// GLOBAL STATE
// ============================================

window.AppState = {
    theme: localStorage.getItem('theme') || 'light',
    autoSaveInterval: null,
    currentAnalysis: null,
    formData: {}
};

// ============================================
// UI COMPONENTS
// ============================================

const UIComponents = {
    init() {
        this.initTheme();
        this.initDragDrop();
        this.initKeyboardShortcuts();
        this.syncRecruiterName();
    },

    initTheme() {
        const { theme } = window.AppState;
        document.documentElement.setAttribute('data-theme', theme);

        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.checked = theme === 'dark';
            toggle.addEventListener('change', () => this.toggleTheme());
        }
    },

    toggleTheme() {
        const newTheme = window.AppState.theme === 'light' ? 'dark' : 'light';
        window.AppState.theme = newTheme;
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.showToast(`Switched to ${newTheme} mode`, 'info');
    },

    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const iconMap = {
            success: 'check-circle',
            error: 'alert-circle',
            info: 'info'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i data-lucide="${iconMap[type]}" style="width: 20px; height: 20px;"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    initDragDrop() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('cvUpload');

        if (!dropZone || !fileInput) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, e => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('drag-over');
            });
        });

        dropZone.addEventListener('drop', e => {
            const files = e.dataTransfer.files;
            if (files.length) {
                fileInput.files = files;
                this.handleFileSelect(files[0]);
            }
        });

        dropZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', e => {
            if (e.target.files.length) {
                this.handleFileSelect(e.target.files[0]);
            }
        });
    },

    handleFileSelect(file) {
        const fileName = document.getElementById('fileName');
        if (fileName) {
            fileName.textContent = `📄 ${file.name}`;
        }
        this.showToast(`File selected: ${file.name}`, 'success');
    },

    initKeyboardShortcuts() {
        document.addEventListener('keydown', e => {
            const isCtrl = e.ctrlKey || e.metaKey;

            if (isCtrl && e.key === 's') {
                e.preventDefault();
                FormManager.save();
                this.showToast('💾 Form saved', 'success');
            }

            if (isCtrl && e.key === 'g') {
                e.preventDefault();
                const btn = document.getElementById('generateBtn');
                if (btn) btn.click();
            }

            if (isCtrl && e.key === 'd') {
                e.preventDefault();
                this.toggleTheme();
            }

            if (isCtrl && e.key === 'u') {
                e.preventDefault();
                const input = document.getElementById('cvUpload');
                if (input) input.click();
            }
        });
    },

    syncRecruiterName() {
        const nameInput = document.getElementById('recruiterName');
        const nameDisplay = document.getElementById('recruiterNameDisplay');

        if (nameInput && nameDisplay) {
            nameInput.addEventListener('input', e => {
                nameDisplay.textContent = e.target.value || '________';
            });
        }
    },

    animateField(field) {
        field.style.transition = 'all 0.3s ease';
        field.style.background = 'rgba(79, 70, 229, 0.1)';
        setTimeout(() => {
            field.style.background = '';
        }, 1000);
    }
};

// ============================================
// CV ANALYZER
// ============================================

const CVAnalyzer = {
    init() {
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.analyze());
        }
    },

    async analyze() {
        const fileInput = document.getElementById('cvUpload');
        const progressContainer = document.getElementById('analysisProgress');
        const progressBar = document.getElementById('progressFill');
        const statusText = document.getElementById('analysisStatus');
        const stepsContainer = document.getElementById('agentSteps');

        if (!fileInput.files[0]) {
            UIComponents.showToast('Please select a CV file first', 'error');
            return;
        }

        if (progressContainer) {
            progressContainer.classList.add('active');
        }

        const steps = [
            { id: 1, text: 'Extracting text from CV' },
            { id: 2, text: 'Analyzing content' },
            { id: 3, text: 'Identifying strengths' },
            { id: 4, text: 'Generating questions' },
            { id: 5, text: 'Finalizing analysis' }
        ];

        if (stepsContainer) {
            stepsContainer.innerHTML = steps.map(step => `
                <div class="agent-step" id="step-${step.id}">
                    <div class="step-icon">⏳</div>
                    <span style="font-size: 0.875rem;">${step.text}</span>
                </div>
            `).join('');
        }

        try {
            let progress = 0;
            for (const step of steps) {
                const stepEl = document.getElementById(`step-${step.id}`);
                if (stepEl) stepEl.classList.add('active');

                if (statusText) statusText.textContent = step.text;

                progress += (100 / steps.length);
                if (progressBar) progressBar.style.width = `${Math.min(progress, 95)}%`;

                await new Promise(resolve => setTimeout(resolve, 500));

                if (stepEl) {
                    stepEl.classList.remove('active');
                    stepEl.classList.add('complete');
                    stepEl.querySelector('.step-icon').textContent = '✓';
                }
            }

            const formData = new FormData();
            formData.append('cv', fileInput.files[0]);

            const response = await fetch('/analyze_cv', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                if (progressBar) progressBar.style.width = '100%';
                UIComponents.showToast('✨ AI analysis complete!', 'success');

                const analysis = JSON.parse(data.analysis);
                this.applyResults(analysis);

                setTimeout(() => {
                    if (progressContainer) progressContainer.classList.remove('active');
                }, 2000);
            } else {
                throw new Error(data.error || 'Analysis failed');
            }
        } catch (error) {
            console.error('Analysis error:', error);
            UIComponents.showToast(`Error: ${error.message}`, 'error', 5000);
            if (progressContainer) progressContainer.classList.remove('active');
        }
    },

    applyResults(analysis) {
        console.log('Applying analysis:', analysis);

        if (analysis.candidate_name && analysis.candidate_name !== 'Unknown') {
            const nameField = document.getElementById('candidateName');
            if (nameField) {
                nameField.value = analysis.candidate_name;
                UIComponents.animateField(nameField);
                UIComponents.showToast(`✅ Candidate: ${analysis.candidate_name}`, 'success');
            }
        }

        if (analysis.intro_advice) {
            const introField = document.getElementById('candidateIntro');
            if (introField && !introField.value) {
                introField.value = analysis.intro_advice;
                UIComponents.animateField(introField);
            }
        }

        if (analysis.cv_deep_dive_questions && analysis.cv_deep_dive_questions.length > 0) {
            const cvNotesField = document.getElementById('cvNotes');
            if (cvNotesField) {
                cvNotesField.value = analysis.cv_deep_dive_questions
                    .map((q, i) => `${i + 1}. ${q}`)
                    .join('\n\n');
                UIComponents.animateField(cvNotesField);
                UIComponents.showToast(`✅ ${analysis.cv_deep_dive_questions.length} questions generated`, 'success');
            }
        }

        if (analysis.profile_strengths) {
            this.displayStrengths(analysis.profile_strengths);
        }

        if (analysis.availability_context) {
            const availField = document.getElementById('availGeneralComment');
            if (availField && !availField.value) {
                availField.value = analysis.availability_context;
                UIComponents.animateField(availField);
            }
        }

        if (analysis.relocation_context) {
            const relocField = document.getElementById('locConstraints');
            if (relocField && !relocField.value) {
                relocField.value = analysis.relocation_context;
                UIComponents.animateField(relocField);
            }
        }

        window.AppState.currentAnalysis = analysis;
        FormManager.save();
    },

    displayStrengths(strengths) {
        const container = document.getElementById('profileStrengthsContainer');
        if (!container) return;

        const strengthsList = Object.entries(strengths)
            .filter(([, value]) => value === true)
            .map(([key]) => key);

        if (strengthsList.length === 0) {
            container.innerHTML = `
                <div style="padding: 1.5rem; background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; border-radius: 12px; text-align: center;">
                    <p style="color: #dc2626; font-weight: 700; margin: 0;">⚠️ No matching profile strengths detected</p>
                    <p style="color: #94a3b8; margin-top: 0.5rem; font-size: 0.875rem;">Review CV manually</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem;">
                    ${strengthsList.map(strength => `
                        <div style="padding: 0.65rem 1.25rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border-radius: 25px; font-weight: 700; font-size: 0.875rem; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); display: flex; align-items: center; gap: 0.5rem;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            ${strength}
                        </div>
                    `).join('')}
                </div>
                <p style="margin: 0; padding: 1rem; border-radius: 8px; background: rgba(16, 185, 129, 0.1); font-size: 0.9375rem; font-weight: 600;">
                    ✅ Identified ${strengthsList.length} strength${strengthsList.length > 1 ? 's' : ''}
                </p>
            `;

            UIComponents.showToast(`✅ ${strengthsList.length} strength(s) found!`, 'success');
        }

        setTimeout(() => {
            container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 600);
    }
};

// ============================================
// FORM MANAGER
// ============================================

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

    save() {
        const form = document.getElementById('interviewForm');
        if (!form) return;

        const data = {};
        const fields = form.querySelectorAll('input, textarea, select');

        fields.forEach(field => {
            if (field.id) {
                data[field.id] = field.value;
            }
        });

        localStorage.setItem('interviewFormData', JSON.stringify(data));
        console.log('💾 Form auto-saved');
    },

    load() {
        const savedData = localStorage.getItem('interviewFormData');
        if (!savedData) return;

        try {
            const data = JSON.parse(savedData);

            for (const [id, value] of Object.entries(data)) {
                const field = document.getElementById(id);
                if (field && !field.value) {
                    field.value = value;
                }
            }

            UIComponents.showToast('📂 Restored previous session', 'info');
        } catch (error) {
            console.error('Error loading form data:', error);
        }
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    initPDFGeneration() {
        const btn = document.getElementById('generateBtn');
        if (btn) {
            btn.addEventListener('click', () => this.generatePDF());
        }
    },

    async generatePDF() {
        const btn = document.getElementById('generateBtn');
        const originalContent = btn?.innerHTML;

        try {
            if (btn) {
                btn.innerHTML = '<i data-lucide="loader"></i> Generating...';
                btn.disabled = true;
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }

            UIComponents.showToast('📄 Generating PDF...', 'info');

            document.getElementById('pdf-recruiter').textContent =
                document.getElementById('recruiterName')?.value || '';
            document.getElementById('pdf-candidate').textContent =
                document.getElementById('candidateName')?.value || '';
            document.getElementById('pdf-position').textContent =
                document.getElementById('positionRole')?.value || '';
            document.getElementById('pdf-date').textContent =
                document.getElementById('interviewDate')?.value || '';
            document.getElementById('pdf-time').textContent =
                document.getElementById('interviewTime')?.value || '';

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
            } else {
                throw new Error('html2pdf library not loaded');
            }

            element.classList.add('hidden');

        } catch (error) {
            console.error('PDF error:', error);
            UIComponents.showToast('❌ PDF generation failed', 'error');
        } finally {
            if (btn && originalContent) {
                btn.innerHTML = originalContent;
                btn.disabled = false;
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        }
    },

    initBPOToggle() {
        window.toggleBpoDetails = (show) => {
            const bpoDetails = document.getElementById('bpoDetails');
            if (bpoDetails) {
                if (show) {
                    bpoDetails.classList.remove('hidden');
                } else {
                    bpoDetails.classList.add('hidden');
                }
            }
        };
    }
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Initializing Quadriga Interview Flow v2.1...');

    UIComponents.init();
    CVAnalyzer.init();
    FormManager.init();

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    console.log('✅ Application ready!');
    UIComponents.showToast('Welcome to Quadriga Interview Flow 2.1', 'info');
});

window.addEventListener('beforeunload', () => {
    if (AppState.autoSaveInterval) {
        clearInterval(AppState.autoSaveInterval);
    }
    FormManager.save();
});
