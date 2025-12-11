/**
 * CV Analyzer Module
 * Handles CV upload, analysis, and result display
 */

const CVAnalyzer = {
    /**
     * Initialize CV analyzer
     */
    init() {
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Stop click from reaching dropZone
                this.analyze();
            });
        }
    },

    /**
     * Analyze CV
     */
    async analyze() {
        const fileInput = document.getElementById('cvUpload');
        const progressContainer = document.getElementById('analysisProgress');
        const progressBar = document.getElementById('progressFill');
        const statusText = document.getElementById('analysisStatus');
        const stepsContainer = document.getElementById('agentSteps');

        if (!fileInput.files[0]) {
            window.UIComponents.showToast('Please select a CV file first', 'error');
            return;
        }

        // Show progress
        if (progressContainer) {
            progressContainer.classList.add('active');
        }

        // Progress steps
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
            // Animate progress
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

            // API call
            const formData = new FormData();
            formData.append('cv', fileInput.files[0]);

            const response = await fetch('/analyze_cv', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                if (progressBar) progressBar.style.width = '100%';
                window.UIComponents.showToast('✨ AI analysis complete!', 'success');

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
            window.UIComponents.showToast(`Error: ${error.message}`, 'error', 5000);
            if (progressContainer) progressContainer.classList.remove('active');
        }
    },

    /**
     * Apply analysis results to form
     */
    applyResults(analysis) {
        console.log('Applying analysis:', analysis);

        // 1. Candidate name
        if (analysis.candidate_name && analysis.candidate_name !== 'Unknown') {
            const nameField = document.getElementById('candidateName');
            if (nameField) {
                nameField.value = analysis.candidate_name;
                window.UIComponents.animateField(nameField);
                window.UIComponents.showToast(`✅ Candidate: ${analysis.candidate_name}`, 'success');
            }
        }

        // 2. Intro advice
        if (analysis.intro_advice) {
            const introField = document.getElementById('candidateIntro');
            if (introField && !introField.value) {
                introField.value = analysis.intro_advice;
                window.UIComponents.animateField(introField);
            }
        }

        // 3. Questions
        if (analysis.cv_deep_dive_questions && analysis.cv_deep_dive_questions.length > 0) {
            const cvNotesField = document.getElementById('cvNotes');
            if (cvNotesField) {
                cvNotesField.value = analysis.cv_deep_dive_questions
                    .map((q, i) => `${i + 1}. ${q}`)
                    .join('\n\n');
                window.UIComponents.animateField(cvNotesField);
                window.UIComponents.showToast(`✅ ${analysis.cv_deep_dive_questions.length} questions generated`, 'success');
            }
        }

        // 4. Profile strengths
        if (analysis.profile_strengths) {
            this.displayStrengths(analysis.profile_strengths);
        }

        // 5. Availability
        if (analysis.availability_context) {
            const availField = document.getElementById('availGeneralComment');
            if (availField && !availField.value) {
                availField.value = analysis.availability_context;
                window.UIComponents.animateField(availField);
            }
        }

        // 6. Relocation
        if (analysis.relocation_context) {
            const relocField = document.getElementById('locConstraints');
            if (relocField && !relocField.value) {
                relocField.value = analysis.relocation_context;
                window.UIComponents.animateField(relocField);
            }
        }

        window.AppState.currentAnalysis = analysis;
        window.FormManager?.save();
    },

    /**
     * Display profile strengths
     */
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

            window.UIComponents.showToast(`✅ ${strengthsList.length} strength(s) found!`, 'success');
        }

        setTimeout(() => {
            container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 600);
    }
};

// Make globally accessible (no ES6 modules)
window.CVAnalyzer = CVAnalyzer;
