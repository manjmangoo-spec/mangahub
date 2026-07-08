// js/ui.js

export const UI = {
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'fa-check-circle';
        if (type === 'error') icon = 'fa-triangle-exclamation';
        if (type === 'warning') icon = 'fa-circle-exclamation';
        if (type === 'info') icon = 'fa-info-circle';

        const title = type === 'success' ? 'Sucesso' : type === 'error' ? 'Erro' : type === 'warning' ? 'Atenção' : 'Informação';

        toast.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <div class="toast-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    openModal(htmlContent, widthClass = '') {
        const container = document.getElementById('modal-container');
        if (!container) return;

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        overlay.innerHTML = `
            <div class="modal-content ${widthClass}">
                ${htmlContent}
            </div>
        `;

        container.appendChild(overlay);

        // trigger reflow
        void overlay.offsetWidth;
        overlay.classList.add('active');

        // Close on background click
        overlay.addEventListener('click', (e) => {
            if(e.target === overlay) this.closeModal(overlay);
        });
    },

    closeModal(modalElement) {
        if (!modalElement) {
            // close last one
            const modals = document.querySelectorAll('.modal-overlay');
            if(modals.length > 0) modalElement = modals[modals.length - 1];
        }
        if (modalElement) {
            modalElement.classList.remove('active');
            setTimeout(() => modalElement.remove(), 300);
        }
    },

    confirm(message, onConfirm) {
        const html = `
            <div class="modal-header">
                <h3>Confirmação</h3>
                <button type="button" class="btn-icon" onclick="document.querySelector('.modal-overlay.active').click()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body text-center" style="padding: 3rem 2rem;">
                <i class="fa-solid fa-triangle-exclamation text-warning" style="font-size: 4rem; margin-bottom: 1.5rem;"></i>
                <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">Atenção</h3>
                <p class="text-muted" style="margin-bottom: 2rem;">${message}</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button type="button" class="btn btn-secondary" onclick="document.querySelector('.modal-overlay.active').click()">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="btn-confirm-action">Sim, Confirmar</button>
                </div>
            </div>
        `;
        this.openModal(html, 'modal-sm');
        
        setTimeout(() => {
            const btn = document.getElementById('btn-confirm-action');
            if (btn) {
                btn.onclick = () => {
                    onConfirm();
                    this.closeModal();
                };
            }
        }, 100);
    }
};

window.UI = UI; // Expose globally for inline event handlers if needed
