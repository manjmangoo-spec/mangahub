// js/modules/relatorios.js
import { db } from '../db.js';
import { formatMoney, formatDateTime } from '../utils.js';
import { UI } from '../ui.js';

export const renderRelatorios = () => {
    const html = `
        <div class="view-header">
            <div class="view-title">
                <h2>Central de Relatórios</h2>
                <p class="text-muted">Acompanhe métricas, exporte dados e analise resultados.</p>
            </div>
            <div class="view-actions">
                <button class="btn btn-primary" onclick="window.printRelatorio()"><i class="fa-solid fa-print"></i> Imprimir</button>
            </div>
        </div>

        <div class="relatorios-grids">
            <!-- Navegação Lateral dos Relatórios -->
            <div class="card" style="padding: 1rem;">
                <h4 style="margin: 0 0.5rem 1rem 0.5rem; color: var(--text-secondary); font-size: 0.85rem; text-transform: uppercase;">Selecione o Relatório</h4>
                <div class="settings-nav">
                    <div class="settings-nav-item active" onclick="window.changeRelatorio(this, 'vendas')"><i class="fa-solid fa-cart-arrow-down" style="width:24px;"></i> Vendas & Faturamento</div>
                    <div class="settings-nav-item" onclick="window.changeRelatorio(this, 'produtos')"><i class="fa-solid fa-box-open" style="width:24px;"></i> Produtos Mais Vendidos</div>
                    <div class="settings-nav-item" onclick="window.changeRelatorio(this, 'caixa')"><i class="fa-solid fa-wallet" style="width:24px;"></i> Fluxo de Caixa</div>
                </div>
            </div>

            <!-- Área do Relatório -->
            <div class="card" id="relatorio-content" style="min-height: 500px;">
                <!-- Conteúdo Injetado -->
            </div>
        </div>
    `;

    window.addEventListener('view-loaded', handleViewLoaded, { once: true });
    return html;
};

function handleViewLoaded(e) {
    if (e.detail.view !== 'relatorios') return;
    
    renderRelatorioVendas();

    window.changeRelatorio = (el, type) => {
        document.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
        el.classList.add('active');

        if (type === 'vendas') renderRelatorioVendas();
        else if (type === 'produtos') renderRelatorioProdutos();
        else if (type === 'caixa') renderRelatorioCaixa();
    };

    window.printRelatorio = () => {
        window.print();
        UI.showToast('Impressão solicitada.', 'info');
    };
}

function renderRelatorioVendas() {
    const sales = db.get('sales');
    let total = 0;
    
    // Group by date for the chart
    const salesByDate = {};

    const rows = sales.slice().reverse().map(s => {
        total += s.total;
        
        const d = new Date(s.date).toLocaleDateString('pt-BR');
        if (!salesByDate[d]) salesByDate[d] = 0;
        salesByDate[d] += s.total;

        return `
            <tr>
                <td>${formatDateTime(s.date)}</td>
                <td><span class="text-muted">#${s.id}</span></td>
                <td>${s.items.length} itens</td>
                <td><span class="status-badge status-primary">${s.payment}</span></td>
                <td class="text-right text-success font-bold">${formatMoney(s.total)}</td>
            </tr>
        `;
    }).join('');

    const html = `
        <div class="card-header border-bottom mb-4">
            <h3 class="card-title">Relatório de Vendas Gerais</h3>
            <div class="text-right text-success" style="font-size: 1.5rem; font-weight: bold;">
                Total: ${formatMoney(total)}
            </div>
        </div>
        <div class="chart-container" style="margin-bottom: 2rem;">
            <canvas id="relatorioChart"></canvas>
        </div>
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>ID Pedido</th>
                        <th>Volume</th>
                        <th>Método</th>
                        <th class="text-right">Valor Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows || '<tr><td colspan="5" class="text-center text-muted">Nenhuma venda registrada.</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
    document.getElementById('relatorio-content').innerHTML = html;

    // Render chart
    setTimeout(() => {
        const ctx = document.getElementById('relatorioChart');
        if (!ctx) return;
        
        // Convert object to arrays and sort by date assuming standard DD/MM/YYYY is roughly chronological if recent
        const labels = Object.keys(salesByDate).reverse();
        const data = Object.values(salesByDate).reverse();

        if (labels.length === 0) {
            labels.push('Sem dados');
            data.push(0);
        }

        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#3B82F6';
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#94A3B8';
        const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-light').trim() || 'rgba(255,255,255,0.05)';
        
        if(window.currentRelatorioChart) window.currentRelatorioChart.destroy();
        window.currentRelatorioChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Faturamento Diário',
                    data: data,
                    backgroundColor: primaryColor,
                    borderRadius: 4,
                    maxBarThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { grid: { display: false, drawBorder: false }, ticks: { color: textColor } },
                    y: { grid: { color: gridColor }, ticks: { color: textColor } }
                }
            }
        });
    }, 50);
}

function renderRelatorioProdutos() {
    const sales = db.get('sales');
    const productStats = {};

    sales.forEach(s => {
        s.items.forEach(item => {
            if (!productStats[item.id]) {
                productStats[item.id] = { name: item.name, qty: 0, revenue: 0 };
            }
            productStats[item.id].qty += item.qty;
            productStats[item.id].revenue += (item.price * item.qty);
        });
    });

    const sorted = Object.values(productStats).sort((a, b) => b.qty - a.qty);
    const top5 = sorted.slice(0, 5);

    const rows = sorted.map((p, idx) => `
        <tr>
            <td><span class="status-badge status-info">${idx + 1}º</span></td>
            <td class="font-bold">${p.name}</td>
            <td class="text-center">${p.qty} un</td>
            <td class="text-right text-success font-bold">${formatMoney(p.revenue)}</td>
        </tr>
    `).join('');

    const html = `
        <div class="card-header border-bottom mb-4">
            <h3 class="card-title">Ranking de Produtos Mais Vendidos</h3>
        </div>
        <div class="chart-container" style="margin-bottom: 2rem;">
            <canvas id="relatorioChart"></canvas>
        </div>
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th style="width: 80px;">Posição</th>
                        <th>Produto</th>
                        <th class="text-center">Qtd. Vendida</th>
                        <th class="text-right">Faturamento Gerado</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows || '<tr><td colspan="4" class="text-center text-muted">Nenhum dado disponível.</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
    document.getElementById('relatorio-content').innerHTML = html;

    // Render chart
    setTimeout(() => {
        const ctx = document.getElementById('relatorioChart');
        if (!ctx) return;
        
        const labels = top5.map(p => p.name);
        const data = top5.map(p => p.qty);

        if (labels.length === 0) {
            labels.push('Sem dados');
            data.push(0);
        }

        const successColor = getComputedStyle(document.documentElement).getPropertyValue('--success').trim() || '#22C55E';
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#94A3B8';
        
        if(window.currentRelatorioChart) window.currentRelatorioChart.destroy();
        window.currentRelatorioChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        successColor, 
                        '#3B82F6', 
                        '#F59E0B', 
                        '#EF4444', 
                        '#8B5CF6'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: textColor } }
                },
                cutout: '70%'
            }
        });
    }, 50);
}

function renderRelatorioCaixa() {
    const caixa = db.getCaixa();
    
    let totalIn = 0;
    let totalOut = 0;

    const rows = [...caixa.history].reverse().map(h => {
        if(h.type === 'entrada') totalIn += h.value;
        else totalOut += h.value;
        
        return `
            <tr>
                <td>${formatDateTime(h.date)}</td>
                <td><span class="status-badge ${h.type === 'entrada' ? 'status-success' : 'status-danger'}">${h.type.toUpperCase()}</span></td>
                <td>${h.desc}</td>
                <td class="text-right font-bold ${h.type === 'entrada' ? 'text-success' : 'text-danger'}">${h.type === 'entrada' ? '+' : '-'} ${formatMoney(h.value)}</td>
            </tr>
        `;
    }).join('');

    const html = `
        <div class="card-header border-bottom mb-4" style="display:flex; justify-content:space-between; align-items:center;">
            <h3 class="card-title">Fluxo de Caixa (Histórico Completo)</h3>
            <div style="display:flex; gap: 1rem;">
                <div style="text-align:right;">
                    <div style="font-size:0.8rem; color:var(--text-secondary);">Total Entradas</div>
                    <div class="text-success font-bold">${formatMoney(totalIn)}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:0.8rem; color:var(--text-secondary);">Total Saídas</div>
                    <div class="text-danger font-bold">${formatMoney(totalOut)}</div>
                </div>
            </div>
        </div>
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Tipo</th>
                        <th>Descrição</th>
                        <th class="text-right">Valor</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows || '<tr><td colspan="4" class="text-center text-muted">Nenhum registro no caixa.</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
    document.getElementById('relatorio-content').innerHTML = html;
}
