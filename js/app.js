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
import { renderServicos } from './modules/servicos.js';
import { renderAgendamentos } from './modules/agendamentos.js';

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
            ,'servicos': renderServicos,
            'agendamentos': renderAgendamentos
        };
        
        this.checkAuth();
    }

    checkAuth() {
        const user = localStorage.getItem('cndhub_user');
        if (user) {
            document.getElementById('login-root').style.display = 'none';
            document.getElementById('app-root').style.display = 'flex';
            window.currentUser = JSON.parse(user);
            this.init();
        } else {
            document.getElementById('login-root').style.display = 'flex';
            document.getElementById('app-root').style.display = 'none';
            this.setupLogin();
        }
    }

    setupLogin() {
        const form = document.getElementById('login-form');
        const err = document.getElementById('login-error');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            
            const users = db.get('employees');
            let user = users.find(u => (u.email === email || u.name === email) && u.password === pass);
            
            // Fallback for demo/admin
            if (!user && email === 'admin@admin.com' && pass === 'admin') {
                user = { id: 'admin-fallback', name: 'Administrador', role: 'Administrador', email: 'admin@admin.com' };
            }
            
            if (user) {
                localStorage.setItem('cndhub_user', JSON.stringify(user));
                window.location.reload();
            } else {
                err.style.display = 'block';
            }
        });
    }

    init() {
        this.applyTheme();
        this.setupNavigation();
        this.updateHeader();
        this.setupGlobalActions();
        
        // Listen to DB changes to update global UI parts if needed
        window.addEventListener('db-updated', () => this.updateHeader());

        // Handle routing
        window.addEventListener('hashchange', () => this.handleRoute());
        
        // Initial route
        setTimeout(() => UI.showToast('Bem-vindo(a) ao Nexus ERP!', 'success'), 1000);
        if (!window.location.hash) {
            window.location.hash = '#dashboard';
        } else {
            this.handleRoute();
        }
    }

    setupGlobalActions() {
        // Logout
        const btnLogout = document.getElementById('btn-logout');
        if(btnLogout) {
            btnLogout.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('cndhub_user');
                window.location.reload();
            });
        }

        // Theme Toggle
        const btnTheme = document.getElementById('btn-theme-toggle');
        if(btnTheme) {
            btnTheme.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-theme');
                const target = current === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', target);
                
                const settings = db.getSettings();
                settings.theme = target;
                db.updateSettings(settings);
            });
        }

        // Global Search
        const searchModal = document.getElementById('modal-global-search');
        const searchInput = document.getElementById('global-search-input');
        const searchTrigger = document.getElementById('global-search-trigger');
        
        if(searchTrigger && searchModal && searchInput) {
            searchTrigger.addEventListener('click', () => {
                UI.showStaticModal('modal-global-search');
                setTimeout(() => searchInput.focus(), 100);
            });

            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'k') {
                    e.preventDefault();
                    UI.showStaticModal('modal-global-search');
                    setTimeout(() => searchInput.focus(), 100);
                }
                if (e.key === 'Escape') {
                    searchModal.style.display = 'none';
                }
            });

            searchModal.addEventListener('click', (e) => {
                if(e.target === searchModal) searchModal.style.display = 'none';
            });

            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                const results = document.getElementById('global-search-results');
                if (query.length < 2) {
                    results.innerHTML = '<p class="text-muted" style="text-align: center; padding: 2rem 0;">Comece a digitar para buscar...</p>';
                    return;
                }

                let html = '';
                // Search products
                const products = db.get('products').filter(p =>  (p.name && p.name.toLowerCase()) .includes(query) || (p.code && p.code.toLowerCase().includes(query)));
                if(products.length > 0) {
                    html += '<h4 style="margin-bottom: 0.5rem; color: var(--primary);">Produtos</h4>';
                    products.forEach(p => {
                        html += `<div style="padding: 0.5rem; border-bottom: 1px solid var(--border-color); cursor: pointer;" onclick="window.location.hash='estoque'; UI.hideStaticModal('modal-global-search');">${p.name} (SKU: ${p.sku}) - Estoque: ${p.stock}</div>`;
                    });
                }

                // Search clients
                const clients = db.get('clients').filter(c =>  (c.name && c.name.toLowerCase()) .includes(query) || (c.doc && c.doc.includes(query)));
                if(clients.length > 0) {
                    html += '<h4 style="margin-top: 1rem; margin-bottom: 0.5rem; color: var(--primary);">Clientes</h4>';
                    clients.forEach(c => {
                        html += `<div style="padding: 0.5rem; border-bottom: 1px solid var(--border-color); cursor: pointer;" onclick="window.location.hash='clientes'; UI.hideStaticModal('modal-global-search');">${c.name} (${c.doc})</div>`;
                    });
                }

                if(html === '') {
                    html = '<p class="text-muted" style="text-align: center; padding: 2rem 0;">Nenhum resultado encontrado.</p>';
                }
                results.innerHTML = html;
            });
        }

        // Notifications
        const btnNotif = document.getElementById('btn-notifications');
        const modalNotif = document.getElementById('modal-notifications');
        if(btnNotif && modalNotif) {
            btnNotif.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isHidden = window.getComputedStyle(modalNotif).display === 'none' || modalNotif.style.display === 'none';
                modalNotif.style.display = isHidden ? 'flex' : 'none';
            });

            modalNotif.addEventListener('click', (e) => {
                if(e.target === modalNotif) {
                    modalNotif.style.display = 'none';
                }
            });
            
            document.addEventListener('click', (e) => {
                if(modalNotif.style.display === 'flex' && !modalNotif.contains(e.target) && !btnNotif.contains(e.target)) {
                    modalNotif.style.display = 'none';
                }
            });
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
        
        if (window.currentUser) {
            const userName = document.getElementById('header-user-name');
            const userAvatar = document.getElementById('header-user-avatar');
            if(userName) userName.textContent = window.currentUser.name;
            if(userAvatar) {
                const initials = window.currentUser.name.substring(0, 1).toUpperCase();
                userAvatar.src = `https://ui-avatars.com/api/?name=${initials}&background=3B82F6&color=fff&rounded=true&bold=true`;
            }
        }

        // Update notifications
        const products = db.get('products');
        const lowStock = products.filter(p => p.stock <= p.minStock);
        
        const badge = document.getElementById('notification-badge');
        const list = document.getElementById('notifications-list');
        
        if (badge && list) {
            if (lowStock.length > 0) {
                badge.style.display = 'flex';
                badge.textContent = lowStock.length;
                
                let html = '';
                lowStock.forEach(p => {
                    html += `
                        <div style="padding: 1.25rem; background: var(--bg-card-hover); border-radius: var(--radius-md); border-left: 4px solid var(--warning); display: flex; flex-direction: column; gap: 0.5rem; transition: background 0.2s ease; cursor: pointer;" onmouseover="this.style.background='var(--border-color)';" onmouseout="this.style.background='var(--bg-card-hover)';">
                            <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-primary); font-weight: 600; font-size: 0.95rem;"><i class="fa-solid fa-triangle-exclamation" style="color: var(--warning);"></i> Estoque Baixo</div>
                            <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">${p.name} (Restam: ${p.stock})</p>
                        </div>
                    `;
                });
                list.innerHTML = html;
            } else {
                badge.style.display = 'none';
                list.innerHTML = '<p class="text-muted" style="text-align:center; padding: 2rem 0;">Sem notificações no momento.</p>';
            }
        }

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
