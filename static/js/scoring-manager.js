/**
 * Scoring Manager Module
 * Handles scoring calculation and chart visualization
 */

const ScoringManager = {
    charts: {},
    scores: {
        strengths: 0,
        matching: 0
    },

    init() {
        const btn = document.getElementById('refreshScores');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.calculateScores();
            });
        }
        this.initCharts();
    },

    initCharts() {
        if (typeof Chart === 'undefined') return;

        const strengthCtx = document.getElementById('strengthChart');
        const matchingCtx = document.getElementById('matchingChart');

        if (strengthCtx && matchingCtx) {
            this.charts.strength = this.createDonutChart(strengthCtx, '#0f172a'); // Onyx
            this.charts.matching = this.createDonutChart(matchingCtx, '#64748b'); // Slate
        }
    },

    createDonutChart(ctx, color) {
        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Score', 'Remaining'],
                datasets: [{
                    data: [0, 100],
                    backgroundColor: [color, '#e2e8f0'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                cutout: '75%',
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
    },

    async calculateScores() {
        const btn = document.getElementById('refreshScores');
        if (btn) {
            btn.innerHTML = '<i data-lucide="loader" class="animate-spin"></i> Calculating...';
            btn.disabled = true;
            lucide.createIcons();
        }

        try {
            const formData = FormManager.getFormData();
            const analysis = window.AppState.currentAnalysis || {};

            const payload = {
                form_data: formData,
                ai_analysis: analysis,
                profile_strengths: analysis.profile_strengths || {}
            };

            const response = await fetch('/calculate_scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                this.scores.strengths = result.strengths_score;
                this.scores.matching = result.matching_score;
                this.updateCharts(result);
                UIComponents.showToast('✅ Scores updated!', 'success');
            } else {
                UIComponents.showToast('Error calculating scores', 'error');
            }

        } catch (error) {
            console.error('Scoring error:', error);
        } finally {
            if (btn) {
                btn.innerHTML = '<i data-lucide="refresh-cw"></i> Calculate';
                btn.disabled = false;
                lucide.createIcons();
            }
        }
    },

    updateCharts(data) {
        if (this.charts.strength) {
            this.charts.strength.data.datasets[0].data = [this.scores.strengths, 100 - this.scores.strengths];
            this.charts.strength.data.datasets[0].backgroundColor[0] = data ? data.strengths_color : '#0f172a';
            this.charts.strength.update();
        }

        if (this.charts.matching) {
            this.charts.matching.data.datasets[0].data = [this.scores.matching, 100 - this.scores.matching];
            this.charts.matching.data.datasets[0].backgroundColor[0] = data ? data.matching_color : '#64748b';
            this.charts.matching.update();
        }

        document.getElementById('strengthScore').querySelector('div:first-child').textContent = `${this.scores.strengths}%`;
        document.getElementById('matchingScore').querySelector('div:first-child').textContent = `${this.scores.matching}%`;

        // Update status text
        const sStatus = document.getElementById('strengthStatusText');
        if (sStatus) sStatus.textContent = 'Score';

        const mStatus = document.getElementById('matchingStatusText');
        if (mStatus) mStatus.textContent = 'Match';

        if (data) {
            const sLabel = document.getElementById('strengthLabel');
            const mLabel = document.getElementById('matchingLabel');
            sLabel.textContent = data.strengths_label;
            mLabel.textContent = data.matching_label;
            sLabel.style.color = data.strengths_color;
            mLabel.style.color = data.matching_color;
        }
    }
};

window.ScoringManager = ScoringManager;
