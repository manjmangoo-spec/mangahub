// js/modules/caixa.js
import { db } from '../db.js';
import { UI } from '../ui.js';
import { formatMoney, formatDateTime } from '../utils.js';

export const renderCaixa = () => {
    const html = `
        <div class="view-header">
            <div class="view-title">
                <h2>Controle de Caixa</h2>
                <p class="text-muted">Abertura, fechamento e movimentações avulsas.</p>
            </div>
            <div class="view-actions" id="caixa-header-badge">
                <!-- Status Badge -->
            </div>
        </div>

        <div class="dashboard-grids" style="grid-template-columns: 1fr 2fr;">
            <!-- Painel de Controle -->
            <div>
                <div class="caixa-panel">
                    <p class="text-secondary" style="font-weight: 500;">Saldo Atual no Caixa</p>
                    <div class="caixa-balance" id="caixa-balance-display">R$ 0,00</div>
                    
                    <div class="caixa-actions-grid" id="caixa-actions-container">
                        <!-- Botões Injetados -->
                    </div>
                </div>

                <div class="card">
                    <div class="card-header" style="margin-bottom: 0.5rem;">
                        <h3 class="card-title">Resumo do Dia</h3>
                    </div>
                    <div style="display:flex; justify-content:space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <span class="text-secondary">Entradas:</span>
                        <span class="text-success font-bold" id="caixa-res-in">R$ 0,00</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; padding: 0.5rem 0;">
                        <span class="text-secondary">Saídas:</span>
                        <span class="text-danger font-bold" id="caixa-res-out">R$ 0,00</span>
                    </div>
                </div>
            </div>

            <!-- Histórico -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Histórico de Movimentações</h3>
                    <div class="search-bar" style="width: 250px;">
                        <i class="fa-solid fa-search"></i>
                        <input type="text" id="caixa-search" placeholder="Buscar histórico...">
                    </div>
                </div>
                <div class="table-responsive" style="max-height: 500px;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Data/Hora</th>
                                <th>Tipo</th>
                                <th>Descrição</th>
                                <th class="text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody id="caixa-history-table">
                            <!-- Histórico Injetado -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    window.addEventListener('view-loaded', handleViewLoaded, { once: true });
    return html;
};

function handleViewLoaded(e) {
    if (e.detail.view !== 'caixa') return;
    updateCaixaUI();

    document.getElementById('caixa-search').addEventListener('input', updateCaixaUI);

    window.toggleCaixaStatus = () => {
        const caixa = db.getCaixa();
        if (caixa.status === 'aberto') {
            UI.confirm(`Deseja realmente fechar o caixa com o saldo de ${formatMoney(caixa.balance)}?`, () => {
                caixa.history.push({
                    id: Math.random().toString(),
                    date: new Date().toISOString(),
                    type: 'saida',
                    desc: 'Fechamento de Caixa',
                    value: caixa.balance
                });
                caixa.balance = 0;
                caixa.status = 'fechado';
                db.updateCaixa(caixa);
                updateCaixaUI();
                UI.showToast('Caixa fechado com sucesso.', 'info');
            });
        } else {
            // Abrir Caixa modal
            const html = `
                <div class="modal-header">
                    <h3>Abrir Caixa</h3>
                    <button type="button" class="btn-icon" onclick="UI.closeModal()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Fundo de Troco Inicial (R$)</label>
                        <input type="number" id="caixa-initial-value" class="input" value="0" step="0.01">
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
                        <button class="btn btn-primary" onclick="window.confirmOpenCaixa()">Confirmar Abertura</button>
                    </div>
                </div>
            `;
            UI.openModal(html, 'modal-sm');
        }
    };

    window.confirmOpenCaixa = () => {
        const val = Number(document.getElementById('caixa-initial-value').value) || 0;
        const caixa = db.getCaixa();
        caixa.status = 'aberto';
        caixa.balance = val;
        caixa.history.push({
            id: Math.random().toString(),
            date: new Date().toISOString(),
            type: 'entrada',
            desc: 'Abertura de Caixa (Troco Inicial)',
            value: val
        });
        db.updateCaixa(caixa);
        UI.closeModal();
        updateCaixaUI();
        UI.showToast('Caixa aberto com sucesso.', 'success');
    };

    window.openMovimentacaoModal = (type) => {
        const isEntrada = type === 'entrada';
        const html = `
            <div class="modal-header">
                <h3>${isEntrada ? 'Nova Entrada (Aporte)' : 'Nova Saída (Sangria)'}</h3>
                <button type="button" class="btn-icon" onclick="UI.closeModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Valor (R$)</label>
                    <input type="number" id="mov-value" class="input" step="0.01">
                </div>
                <div class="form-group">
                    <label>Descrição</label>
                    <input type="text" id="mov-desc" class="input" placeholder="Ex: Pagamento fornecedor, Troco...">
                </div>
                <div class="form-actions">
                    <button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
                    <button class="btn btn-primary" onclick="window.confirmMovimentacao('${type}')">Confirmar</button>
                </div>
            </div>
        `;
        UI.openModal(html, 'modal-sm');
    };

    window.confirmMovimentacao = (type) => {
        const val = Number(document.getElementById('mov-value').value);
        const desc = document.getElementById('mov-desc').value;

        if (!val || val <= 0) {
            UI.showToast('Informe um valor válido.', 'warning');
            return;
        }
        if (!desc.trim()) {
            UI.showToast('Informe uma descrição.', 'warning');
            return;
        }

        const caixa = db.getCaixa();
        
        if (type === 'saida' && val > caixa.balance) {
            UI.showToast('Saldo insuficiente em caixa.', 'error');
            return;
        }

        if (type === 'entrada') caixa.balance += val;
        else caixa.balance -= val;

        caixa.history.push({
            id: Math.random().toString(),
            date: new Date().toISOString(),
            type: type,
            desc: desc,
            value: val
        });

        db.updateCaixa(caixa);
        UI.closeModal();
        updateCaixaUI();
        UI.showToast('Movimentação registrada.', 'success');
    };
}

function updateCaixaUI() {
    const caixa = db.getCaixa();
    const isOpen = caixa.status === 'aberto';

    // Header Badge
    const badgeContainer = document.getElementById('caixa-header-badge');
    if (badgeContainer) {
        badgeContainer.innerHTML = isOpen 
            ? `<div class="status-badge status-success"><i class="fa-solid fa-circle"></i> CAIXA ABERTO</div>`
            : `<div class="status-badge status-danger"><i class="fa-solid fa-circle"></i> CAIXA FECHADO</div>`;
    }

    // Balance
    const balanceEl = document.getElementById('caixa-balance-display');
    if (balanceEl) balanceEl.textContent = formatMoney(caixa.balance);

    // Actions
    const actionsContainer = document.getElementById('caixa-actions-container');
    if (actionsContainer) {
        if (isOpen) {
            actionsContainer.innerHTML = `
                <button class="btn btn-outline" onclick="window.openMovimentacaoModal('entrada')"><i class="fa-solid fa-arrow-down text-success"></i> Nova Entrada</button>
                <button class="btn btn-outline" onclick="window.openMovimentacaoModal('saida')"><i class="fa-solid fa-arrow-up text-danger"></i> Sangria/Saída</button>
                <button class="btn btn-danger" style="grid-column: span 2;" onclick="window.toggleCaixaStatus()">Fechar Caixa</button>
            `;
        } else {
            actionsContainer.innerHTML = `
                <button class="btn btn-primary" style="grid-column: span 2; padding: 1rem; font-size: 1.1rem;" onclick="window.toggleCaixaStatus()"><i class="fa-solid fa-lock-open"></i> Abrir Caixa</button>
            `;
        }
    }

    // Table History & Summary
    const term = (document.getElementById('caixa-search')?.value || '').toLowerCase();
    
    let totalIn = 0;
    let totalOut = 0;
    const todayStr = new Date().toDateString();

    const filteredHistory = [...caixa.history].reverse().filter(h => {
        // compute totals for today regardless of search
        if(new Date(h.date).toDateString() === todayStr) {
            if(h.type === 'entrada') totalIn += h.value;
            else totalOut += h.value;
        }
        return h.desc.toLowerCase().includes(term);
    });

    const summaryIn = document.getElementById('caixa-res-in');
    const summaryOut = document.getElementById('caixa-res-out');
    if(summaryIn) summaryIn.textContent = formatMoney(totalIn);
    if(summaryOut) summaryOut.textContent = formatMoney(totalOut);

    const tbody = document.getElementById('caixa-history-table');
    if (tbody) {
        tbody.innerHTML = filteredHistory.map(h => {
            const isIn = h.type === 'entrada';
            return `
                <tr>
                    <td>${formatDateTime(h.date)}</td>
                    <td><span class="status-badge ${isIn ? 'status-success' : 'status-danger'}">${h.type.toUpperCase()}</span></td>
                    <td>${h.desc}</td>
                    <td class="text-right font-bold ${isIn ? 'text-success' : 'text-danger'}">${isIn ? '+' : '-'} ${formatMoney(h.value)}</td>
                </tr>
            `;
        }).join('') || `<tr><td colspan="4" class="text-center text-muted">Nenhuma movimentação encontrada.</td></tr>`;
    }
}
