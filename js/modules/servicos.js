import { db } from '../db.js';
import { generateId, formatMoney } from '../utils.js';
import { UI } from '../ui.js';

export const renderServicos = () => {
    let html = `
        <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <div>
                <h2>Serviços</h2>
                <p class="text-muted">Gerencie o catálogo de serviços prestados</p>
            </div>
            <button class="btn btn-primary" onclick="window.openServicoModal()"><i class="fa-solid fa-plus"></i> Novo Serviço</button>
        </div>

        <div class="card" style="padding: 1.5rem; border-radius: var(--radius-lg); background: var(--bg-card); box-shadow: var(--shadow-md);">
            <div style="display:flex; justify-content: space-between; margin-bottom: 1rem; align-items: center; gap: 1rem; flex-wrap: wrap;">
                <div class="search-bar" style="max-width: 300px; width: 100%;">
                    <i class="fa-solid fa-search"></i>
                    <input type="text" id="search-servicos" placeholder="Buscar serviços..." oninput="window.filterServicos()">
                </div>
            </div>
            <div style="overflow-x: auto;">
                <table class="table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="text-align: left; padding: 1rem; border-bottom: 1px solid var(--border-color); color: var(--text-muted);">Cód.</th>
                            <th style="text-align: left; padding: 1rem; border-bottom: 1px solid var(--border-color); color: var(--text-muted);">Nome</th>
                            <th style="text-align: left; padding: 1rem; border-bottom: 1px solid var(--border-color); color: var(--text-muted);">Duração</th>
                            <th style="text-align: right; padding: 1rem; border-bottom: 1px solid var(--border-color); color: var(--text-muted);">Preço</th>
                            <th style="text-align: center; padding: 1rem; border-bottom: 1px solid var(--border-color); color: var(--text-muted);">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="servicos-tbody">
                        <!-- Filled by JS -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Modal Serviço -->
        <div id="modal-servico" class="modal-overlay" style="display: none;">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3 id="modal-servico-title">Novo Serviço</h3>
                    <button class="btn-icon" onclick="UI.hideStaticModal('modal-servico')"><i class="fa-solid fa-times"></i></button>
                </div>
                <form id="form-servico" onsubmit="window.saveServico(event)">
                    <div class="modal-body">
                    <input type="hidden" id="servico-id">
                    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 1rem; margin-bottom: 1rem;">
                        <div>
                            <label class="label">Código</label>
                            <input type="text" id="servico-codigo" class="input" required>
                        </div>
                        <div>
                            <label class="label">Nome do Serviço</label>
                            <input type="text" id="servico-nome" class="input" required>
                        </div>
                    </div>
                    <div style="margin-bottom: 1rem;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                        <div>
                            <label class="label">Duração (minutos)</label>
                            <input type="number" id="servico-duracao" class="input" required min="1">
                        </div>
                        <div>
                            <label class="label">Preço Final (R$)</label>
                            <input type="number" step="0.01" id="servico-preco" class="input" required min="0">
                        </div>
                    </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="UI.hideStaticModal('modal-servico')">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Salvar Serviço</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    setTimeout(loadServicos, 50);
    return html;
};

const loadServicos = (filter = '') => {
    const tbody = document.getElementById('servicos-tbody');
    if (!tbody) return;

    let services = db.get('services') || [];
    
    if (filter) {
        const lowerFilter = filter.toLowerCase();
        services = services.filter(s => 
             (s.name && s.name.toLowerCase()) .includes(lowerFilter) || 
            (s.code && s.code.toLowerCase().includes(lowerFilter)) ||
            (s.category && s.category.toLowerCase().includes(lowerFilter))
        );
    }

    if (services.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">Nenhum serviço encontrado.</td></tr>`;
        return;
    }

    let html = '';
    services.forEach(s => {
        html += `
            <tr style="border-bottom: 1px solid var(--border-light); transition: background 0.2s;" onmouseover="this.style.background='var(--bg-body)'" onmouseout="this.style.background='transparent'">
                <td style="padding: 1rem;"><strong>${s.code}</strong></td>
                <td style="padding: 1rem;">${s.name}</td>
                <td style="padding: 1rem;">${s.duration} min</td>
                <td style="text-align: right; padding: 1rem; color: var(--success); font-weight: 500;">${formatMoney(s.price)}</td>
                <td style="text-align: center; padding: 1rem;">
                    <button class="btn-icon" title="Editar" onclick="window.editServico('${s.id}')"><i class="fa-solid fa-pen text-primary"></i></button>
                    <button class="btn-icon" title="Excluir" onclick="window.deleteServico('${s.id}')"><i class="fa-solid fa-trash text-danger"></i></button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
};

// Expose functions globally for inline HTML handlers
window.filterServicos = () => {
    const term = document.getElementById('search-servicos').value;
    loadServicos(term);
};

window.openServicoModal = () => {
    document.getElementById('form-servico').reset();
    document.getElementById('servico-id').value = '';
    document.getElementById('modal-servico-title').textContent = 'Novo Serviço';
    UI.showStaticModal('modal-servico');
    document.getElementById('servico-codigo').focus();
};

window.editServico = (id) => {
    const services = db.get('services') || [];
    const servico = services.find(s => s.id === id);
    if (!servico) return;

    document.getElementById('servico-id').value = servico.id;
    document.getElementById('servico-codigo').value = servico.code;
    document.getElementById('servico-nome').value = servico.name;
    document.getElementById('servico-duracao').value = servico.duration;
    document.getElementById('servico-preco').value = servico.price;

    document.getElementById('modal-servico-title').textContent = 'Editar Serviço';
    UI.showStaticModal('modal-servico');
};

window.saveServico = (e) => {
    e.preventDefault();
    const id = document.getElementById('servico-id').value;
    const servicoData = {
        code: document.getElementById('servico-codigo').value,
        name: document.getElementById('servico-nome').value,
        duration: parseInt(document.getElementById('servico-duracao').value),
        price: parseFloat(document.getElementById('servico-preco').value)
    };

    const services = db.get('services') || [];

    if (id) {
        // Edit
        const index = services.findIndex(s => s.id === id);
        if (index > -1) {
            services[index] = { ...services[index], ...servicoData };
            UI.showToast('Serviço atualizado com sucesso!', 'success');
        }
    } else {
        // Add
        servicoData.id = generateId();
        services.push(servicoData);
        UI.showToast('Serviço adicionado com sucesso!', 'success');
    }

    db.set('services', services);
    UI.hideStaticModal('modal-servico');
    loadServicos();
};

window.deleteServico = (id) => {
    if (confirm('Tem certeza que deseja excluir este serviço?')) {
        let services = db.get('services') || [];
        services = services.filter(s => s.id !== id);
        db.set('services', services);
        UI.showToast('Serviço excluído', 'info');
        loadServicos();
    }
};
