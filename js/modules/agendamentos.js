import { db } from '../db.js';
import { generateId, formatMoney } from '../utils.js';
import { UI } from '../ui.js';

export const renderAgendamentos = () => {
    let html = `
        <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <div>
                <h2>Agenda & Marcações</h2>
                <p class="text-muted">Controle seus horários e clientes</p>
            </div>
            <button class="btn btn-primary" onclick="window.openAgendaModal()"><i class="fa-solid fa-plus"></i> Novo Agendamento</button>
        </div>

        <div class="card" style="padding: 1.5rem; border-radius: var(--radius-lg); background: var(--bg-card); box-shadow: var(--shadow-md);">
            <div style="display:flex; justify-content: space-between; margin-bottom: 1rem; align-items: center; gap: 1rem; flex-wrap: wrap;">
                <div class="search-bar" style="max-width: 300px; width: 100%;">
                    <i class="fa-solid fa-search"></i>
                    <input type="date" id="search-agenda-date" onchange="window.filterAgenda()">
                </div>
            </div>
            <div style="overflow-x: auto;">
                <table class="table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="text-align: left; padding: 1rem; border-bottom: 1px solid var(--border-color); color: var(--text-muted);">Data/Hora</th>
                            <th style="text-align: left; padding: 1rem; border-bottom: 1px solid var(--border-color); color: var(--text-muted);">Cliente</th>
                            <th style="text-align: left; padding: 1rem; border-bottom: 1px solid var(--border-color); color: var(--text-muted);">Serviço</th>
                            <th style="text-align: left; padding: 1rem; border-bottom: 1px solid var(--border-color); color: var(--text-muted);">Status</th>
                            <th style="text-align: right; padding: 1rem; border-bottom: 1px solid var(--border-color); color: var(--text-muted);">Total</th>
                            <th style="text-align: center; padding: 1rem; border-bottom: 1px solid var(--border-color); color: var(--text-muted);">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="agenda-tbody">
                        <!-- Filled by JS -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Modal Agendamento -->
        <div id="modal-agenda" class="modal-overlay" style="display: none;">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3 id="modal-agenda-title">Novo Agendamento</h3>
                    <button class="btn-icon" onclick="UI.hideStaticModal('modal-agenda')"><i class="fa-solid fa-times"></i></button>
                </div>
                <form id="form-agenda" onsubmit="window.saveAgenda(event)">
                    <div class="modal-body">
                    <input type="hidden" id="agenda-id">
                    <div style="margin-bottom: 1rem;">
                        <label class="label">Cliente</label>
                        <select id="agenda-cliente" class="input" required>
                            <!-- Filled by JS -->
                        </select>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label class="label">Serviço</label>
                        <select id="agenda-servico" class="input" required>
                            <!-- Filled by JS -->
                        </select>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div>
                            <label class="label">Data</label>
                            <input type="date" id="agenda-data" class="input" required>
                        </div>
                        <div>
                            <label class="label">Hora</label>
                            <input type="time" id="agenda-hora" class="input" required>
                        </div>
                    </div>
                    <div style="margin-bottom: 1.5rem;">
                        <label class="label">Status</label>
                        <select id="agenda-status" class="input">
                            <option value="Agendado">Agendado</option>
                            <option value="Concluído">Concluído</option>
                            <option value="Cancelado">Cancelado</option>
                        </select>
                    </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="UI.hideStaticModal('modal-agenda')">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    setTimeout(() => {
        document.getElementById('search-agenda-date').value = new Date().toISOString().split('T')[0];
        loadAgenda();
        populateAgendaSelects();
    }, 50);
    return html;
};

const populateAgendaSelects = () => {
    const clients = db.get('clients') || [];
    const services = db.get('services') || [];

    const clientSelect = document.getElementById('agenda-cliente');
    const serviceSelect = document.getElementById('agenda-servico');

    if(clientSelect) {
        clientSelect.innerHTML = '<option value="">Selecione o Cliente</option>' + 
            clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    if(serviceSelect) {
        serviceSelect.innerHTML = '<option value="">Selecione o Serviço</option>' + 
            services.map(s => `<option value="${s.id}" data-price="${s.price}">${s.name} - ${formatMoney(s.price)}</option>`).join('');
    }
};

const loadAgenda = () => {
    const tbody = document.getElementById('agenda-tbody');
    if (!tbody) return;

    let appointments = db.get('appointments') || [];
    const dateFilter = document.getElementById('search-agenda-date').value;
    
    if (dateFilter) {
        appointments = appointments.filter(a => a.date === dateFilter);
    }

    // Sort by time
    appointments.sort((a, b) => a.time.localeCompare(b.time));

    if (appointments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">Nenhum agendamento para esta data.</td></tr>`;
        return;
    }

    const clients = db.get('clients') || [];
    const services = db.get('services') || [];

    let html = '';
    appointments.forEach(a => {
        const client = clients.find(c => c.id === a.clientId) || { name: 'Desconhecido' };
        const service = services.find(s => s.id === a.serviceId) || { name: 'Desconhecido', price: 0 };
        
        let statusBadge = '';
        if(a.status === 'Agendado') statusBadge = '<span class="badge" style="background: var(--warning); color: #fff;">Agendado</span>';
        if(a.status === 'Concluído') statusBadge = '<span class="badge" style="background: var(--success); color: #fff;">Concluído</span>';
        if(a.status === 'Cancelado') statusBadge = '<span class="badge" style="background: var(--danger); color: #fff;">Cancelado</span>';

        html += `
            <tr style="border-bottom: 1px solid var(--border-light); transition: background 0.2s;" onmouseover="this.style.background='var(--bg-body)'" onmouseout="this.style.background='transparent'">
                <td style="padding: 1rem;"><strong>${a.date.split('-').reverse().join('/')}</strong> <span class="text-muted">${a.time}</span></td>
                <td style="padding: 1rem;">${client.name}</td>
                <td style="padding: 1rem;">${service.name}</td>
                <td style="padding: 1rem;">${statusBadge}</td>
                <td style="text-align: right; padding: 1rem; color: var(--success); font-weight: 500;">${formatMoney(service.price)}</td>
                <td style="text-align: center; padding: 1rem;">
                    <button class="btn-icon" title="Editar" onclick="window.editAgenda('${a.id}')"><i class="fa-solid fa-pen text-primary"></i></button>
                    <button class="btn-icon" title="Excluir" onclick="window.deleteAgenda('${a.id}')"><i class="fa-solid fa-trash text-danger"></i></button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
};

// Expose functions globally
window.filterAgenda = () => {
    loadAgenda();
};

window.openAgendaModal = () => {
    document.getElementById('form-agenda').reset();
    document.getElementById('agenda-id').value = '';
    document.getElementById('agenda-data').value = document.getElementById('search-agenda-date').value || new Date().toISOString().split('T')[0];
    document.getElementById('modal-agenda-title').textContent = 'Novo Agendamento';
    UI.showStaticModal('modal-agenda');
};

window.editAgenda = (id) => {
    const appointments = db.get('appointments') || [];
    const app = appointments.find(a => a.id === id);
    if (!app) return;

    document.getElementById('agenda-id').value = app.id;
    document.getElementById('agenda-cliente').value = app.clientId;
    document.getElementById('agenda-servico').value = app.serviceId;
    document.getElementById('agenda-data').value = app.date;
    document.getElementById('agenda-hora').value = app.time;
    document.getElementById('agenda-status').value = app.status;

    document.getElementById('modal-agenda-title').textContent = 'Editar Agendamento';
    UI.showStaticModal('modal-agenda');
};

window.saveAgenda = (e) => {
    e.preventDefault();
    const id = document.getElementById('agenda-id').value;
    const agendaData = {
        clientId: document.getElementById('agenda-cliente').value,
        serviceId: document.getElementById('agenda-servico').value,
        date: document.getElementById('agenda-data').value,
        time: document.getElementById('agenda-hora').value,
        status: document.getElementById('agenda-status').value
    };

    const appointments = db.get('appointments') || [];

    if (id) {
        // Edit
        const index = appointments.findIndex(a => a.id === id);
        if (index > -1) {
            appointments[index] = { ...appointments[index], ...agendaData };
            UI.showToast('Agendamento atualizado com sucesso!', 'success');
        }
    } else {
        // Add
        agendaData.id = generateId();
        appointments.push(agendaData);
        UI.showToast('Agendamento salvo com sucesso!', 'success');
    }

    db.set('appointments', appointments);
    UI.hideStaticModal('modal-agenda');
    loadAgenda();
};

window.deleteAgenda = (id) => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
        let appointments = db.get('appointments') || [];
        appointments = appointments.filter(a => a.id !== id);
        db.set('appointments', appointments);
        UI.showToast('Agendamento excluído', 'info');
        loadAgenda();
    }
};
