/**
 * UI Components Module
 * Handles theme, toasts, drag-drop, keyboard shortcuts
 */

const UIComponents = {
    /**
     * Initialize UI components
     */
    init() {
        this.initTheme();
        this.initDragDrop();
        this.initKeyboardShortcuts();
        this.syncRecruiterName();
    },

    /**
     * Theme Management
     */
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

    /**
     * Toast Notifications
     */
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

    /**
     * Drag & Drop
     */
    initDragDrop() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('cvUpload');

        if (!dropZone || !fileInput) return;

        // Prevent defaults
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, e => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // Highlight on drag over
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

        // Handle drop
        dropZone.addEventListener('drop', e => {
            const files = e.dataTransfer.files;
            if (files.length) {
                fileInput.files = files;
                this.handleFileSelect(files[0]);
            }
        });

        // Handle click
        dropZone.addEventListener('click', () => fileInput.click());

        // Handle file input change
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

    /**
     * Keyboard Shortcuts
     */
    initKeyboardShortcuts() {
        document.addEventListener('keydown', e => {
            const isCtrl = e.ctrlKey || e.metaKey;

            if (isCtrl && e.key === 's') {
                e.preventDefault();
                window.FormManager?.save();
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

    /**
     * Recruiter Name Sync
     */
    syncRecruiterName() {
        const nameInput = document.getElementById('recruiterName');
        const nameDisplay = document.getElementById('recruiterNameDisplay');

        if (nameInput && nameDisplay) {
            nameInput.addEventListener('input', e => {
                nameDisplay.textContent = e.target.value || '________';
            });
        }
    },

    /**
     * Field Animation
     */
    animateField(field) {
        field.style.transition = 'all 0.3s ease';
        field.style.background = 'rgba(79, 70, 229, 0.1)';
        setTimeout(() => {
            field.style.background = '';
        }, 1000);
    }
};

// Make globally accessible (no ES6 modules)
window.UIComponents = UIComponents;
