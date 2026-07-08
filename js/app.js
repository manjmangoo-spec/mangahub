// js/app.js
import { db } from './db.js';
import { UI } from './ui.js';

// Modules
import { renderDashboard } from './modules/dashboard.js';
import { renderEstoque } from './modules/estoque.js';
import { renderPDV } from './modules/pdv.js';
import { renderCaixa } from './modules/caixa.js';
import { renderClientes, renderFornecedores, renderFuncionarios } from './modules/pessoas.js';
import { renderRelatorios } from './modules/relatorios.js';
import { renderConfiguracoes } from './modules/configuracoes.js';

class App {
    constructor() {
        this.contentArea = document.getElementById('app-content');
        this.routes = {
            'dashboard': renderDashboard,
            'pdv': renderPDV,
            'caixa': renderCaixa,
            'estoque': renderEstoque,
            'clientes': renderClientes,
            'fornecedores': renderFornecedores,
            'funcionarios': renderFuncionarios,
            'relatorios': renderRelatorios,
            'configuracoes': renderConfiguracoes
        };
        
        this.init();
    }

    init() {
        this.applyTheme();
        this.setupNavigation();
        this.updateHeader();
        
        // Listen to DB changes to update global UI parts if needed
        window.addEventListener('db-updated', () => this.updateHeader());

        // Handle routing
        window.addEventListener('hashchange', () => this.handleRoute());
        
        // Initial route
        if (!window.location.hash) {
            window.location.hash = '#dashboard';
        } else {
            this.handleRoute();
        }
    }

    applyTheme() {
        const theme = db.getSettings().theme || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
    }

    updateHeader() {
        const settings = db.getSettings();
        const headerName = document.getElementById('header-company-name');
        if (headerName) headerName.textContent = settings.companyName;
        this.applyTheme();
    }

    setupNavigation() {
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('toggleSidebar');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('mobile-open');
            });
        }

        // Close sidebar if clicked outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                    sidebar.classList.remove('mobile-open');
                }
            }
        });

        const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // If on mobile, close sidebar after clicking
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('mobile-open');
                }
            });
        });
    }

    handleRoute() {
        const hash = window.location.hash.substring(1) || 'dashboard';
        
        // Update active class in sidebar
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-route') === hash) {
                item.classList.add('active');
            }
        });

        // Render content
        const renderFunction = this.routes[hash];
        if (renderFunction) {
            // Wrap in a div to apply animation
            const wrapper = document.createElement('div');
            wrapper.className = 'view-wrapper';
            
            // Allow render function to return HTML string or a DOM element
            const result = renderFunction();
            if (typeof result === 'string') {
                wrapper.innerHTML = result;
                this.contentArea.innerHTML = '';
                this.contentArea.appendChild(wrapper);
                // Dispatch event so modules can bind their events after DOM injection
                window.dispatchEvent(new CustomEvent('view-loaded', { detail: { view: hash } }));
            } else if (result instanceof Promise) {
                result.then(res => {
                    wrapper.innerHTML = res;
                    this.contentArea.innerHTML = '';
                    this.contentArea.appendChild(wrapper);
                    window.dispatchEvent(new CustomEvent('view-loaded', { detail: { view: hash } }));
                });
            }
        } else {
            this.contentArea.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <h3>Página não encontrada</h3>
                    <p>A rota solicitada não existe.</p>
                </div>
            `;
        }
    }
}

// Global hook to change route programmatically
window.navigateTo = (route) => {
    window.location.hash = `#${route}`;
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.BusinessApp = new App();
});
