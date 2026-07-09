// js/modules/pessoas.js
import { db } from '../db.js';
import { UI } from '../ui.js';
import { formatMoney } from '../utils.js';

// Factory to generate the view for Clientes, Fornecedores or Funcionarios
const generatePessoasView = (type) => {
    const config = {
        'customers': { title: 'Clientes', icon: 'fa-users', collection: 'customers', addLabel: 'Novo Cliente', roleCol: 'Email' },
        'suppliers': { title: 'Fornecedores', icon: 'fa-truck', collection: 'suppliers', addLabel: 'Novo Fornecedor', roleCol: 'Email' },
        'employees': { title: 'Funcionários', icon: 'fa-user-tie', collection: 'employees', addLabel: 'Novo Funcionário', roleCol: 'Cargo' }
    };
    
    const cfg = config[type];

    const html = `
        <div class="view-header">
            <div class="view-title">
                <h2>${cfg.title}</h2>
                <p class="text-muted">Gestão completa de cadastros.</p>
            </div>
            <div class="view-actions">
                <button class="btn btn-primary" onclick="window.openPessoaModal('${type}')"><i class="fa-solid fa-plus"></i> ${cfg.addLabel}</button>
            </div>
        </div>

        <div class="card">
            <div class="toolbar">
                <div class="search-bar" style="width: 350px;">
                    <i class="fa-solid fa-search"></i>
                    <input type="text" id="pes-search" placeholder="Pesquisar por nome ou documento...">
                </div>
            </div>
            
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Nome / Razão Social</th>
                            <th>Documento</th>
                            <th>Telefone</th>
                            <th>${cfg.roleCol}</th>
                            <th class="text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="pes-table-body">
                        <!-- Injetado -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // A small hack: since we might switch between them, we use a global listener bound dynamically
    window.currentPessoaType = type;
    window.addEventListener('view-loaded', handlePessoasLoaded, { once: true });
    
    return html;
};

function handlePessoasLoaded() {
    updatePessoasUI();
    document.getElementById('pes-search').addEventListener('input', updatePessoasUI);

    window.openPessoaModal = (type, id = null) => {
        let p = { name: '', doc: '', phone: '', email: '', address: '', role: '' };
        if (id) {
            p = db.getById(type, id) || p;
        }

        const isEmp = type === 'employees';

        const html = `
            <div class="modal-header">
                <h3>${id ? 'Editar Cadastro' : 'Novo Cadastro'}</h3>
                <button type="button" class="btn-icon" onclick="UI.closeModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <form id="form-pessoa" onsubmit="event.preventDefault(); window.savePessoa('${type}', '${id || ''}')">
                    <div class="form-grid">
                        <div class="form-group col-2">
                            <label>Nome / Razão Social *</label>
                            <input type="text" id="pes-name" class="input" required value="${p.name}">
                        </div>
                        <div class="form-group">
                            <label>Documento (CPF/CNPJ)</label>
                            <input type="text" id="pes-doc" class="input" value="${p.doc}">
                        </div>
                        <div class="form-group">
                            <label>Telefone / WhatsApp</label>
                            <input type="text" id="pes-phone" class="input" value="${p.phone}">
                        </div>
                        <div class="form-group ${isEmp ? '' : 'col-2'}">
                            <label>Email</label>
                            <input type="email" id="pes-email" class="input" value="${p.email}">
                        </div>
                        ${isEmp ? `
                            <div class="form-group">
                                <label>Cargo / Função</label>
                                <input type="text" id="pes-role" class="input" value="${p.role}">
                            </div>
                        ` : ''}
                        <div class="form-group col-2">
                            <label>Endereço Completo</label>
                            <input type="text" id="pes-address" class="input" value="${p.address}">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Salvar</button>
                    </div>
                </form>
            </div>
        `;
        UI.openModal(html);
    };

    window.savePessoa = (type, id) => {
        const item = {
            name: document.getElementById('pes-name').value,
            doc: document.getElementById('pes-doc').value,
            phone: document.getElementById('pes-phone').value,
            email: document.getElementById('pes-email').value,
            address: document.getElementById('pes-address').value,
            role: document.getElementById('pes-role') ? document.getElementById('pes-role').value : ''
        };

        if (id) {
            db.update(type, id, item);
            UI.showToast('Cadastro atualizado com sucesso!');
        } else {
            db.insert(type, item);
            UI.showToast('Cadastrado com sucesso!');
        }

        UI.closeModal();
        updatePessoasUI();
    };

    window.deletePessoa = (type, id) => {
        UI.confirm('Tem certeza que deseja excluir este cadastro?', () => {
            db.remove(type, id);
            updatePessoasUI();
            UI.showToast('Excluído com sucesso.');
        });
    };
}

function updatePessoasUI() {
    const type = window.currentPessoaType;
    const term = (document.getElementById('pes-search')?.value || '').toLowerCase();
    
    const isEmp = type === 'employees';
    
    let filtered = db.get(type).filter(p =>  (p.name && p.name.toLowerCase()) .includes(term) || (p.doc && p.doc.toLowerCase().includes(term)));

    const tbody = document.getElementById('pes-table-body');
    if (tbody) {
        tbody.innerHTML = filtered.map(p => `
            <tr>
                <td class="font-bold">${p.name}</td>
                <td><span class="text-muted">${p.doc || '-'}</span></td>
                <td>${p.phone || '-'}</td>
                <td>${isEmp ? `<span class="status-badge status-info">${p.role || '-'}</span>` : (p.email || '-')}</td>
                <td class="text-right">
                    <button class="btn-icon primary" title="Editar" onclick="window.openPessoaModal('${type}', '${p.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon danger" title="Excluir" onclick="window.deletePessoa('${type}', '${p.id}')"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `).join('') || `<tr><td colspan="5" class="text-center text-muted" style="padding: 3rem;">Nenhum registro encontrado.</td></tr>`;
    }
}

export const renderClientes = () => generatePessoasView('customers');
export const renderFornecedores = () => generatePessoasView('suppliers');
export const renderFuncionarios = () => generatePessoasView('employees');
