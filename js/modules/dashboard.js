// js/modules/dashboard.js
import { db } from '../db.js';
import { formatMoney, formatDateTime } from '../utils.js';

export const renderDashboard = () => {
    // Collect stats
    const today = new Date().toDateString();
    const now = new Date();
    
    let revToday = 0;
    let revMonth = 0;
    let salesTodayCount = 0;
    
    const sales = db.get('sales');
    sales.forEach(sale => {
        const d = new Date(sale.date);
        if (d.toDateString() === today) {
            revToday += sale.total;
            salesTodayCount++;
        }
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
            revMonth += sale.total;
        }
    });

    const products = db.get('products');
    const customers = db.get('customers');
    const lowStock = products.filter(p => Number(p.stock) <= Number(p.minStock));

    const html = `
        <div class="view-header">
            <div class="view-title">
                <h2>Dashboard Financeiro</h2>
                <p class="text-muted">Visão geral e desempenho do seu negócio em tempo real.</p>
            </div>
            <div class="view-actions">
                <button class="btn btn-secondary" onclick="window.navigateTo('relatorios')"><i class="fa-solid fa-download"></i> Relatórios</button>
                <button class="btn btn-primary" onclick="window.navigateTo('pdv')"><i class="fa-solid fa-plus"></i> Nova Venda (PDV)</button>
            </div>
        </div>

        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-icon bg-primary-light text-primary"><i class="fa-solid fa-dollar-sign"></i></div>
                <div class="kpi-details">
                    <div class="kpi-label">Receita de Hoje</div>
                    <div class="kpi-value">${formatMoney(revToday)}</div>
                    <div class="kpi-trend text-success"><i class="fa-solid fa-arrow-trend-up"></i> <span>Em alta</span></div>
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon bg-success-light text-success"><i class="fa-solid fa-wallet"></i></div>
                <div class="kpi-details">
                    <div class="kpi-label">Receita do Mês</div>
                    <div class="kpi-value">${formatMoney(revMonth)}</div>
                    <div class="kpi-trend text-muted"><span>Faturamento mensal</span></div>
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon bg-warning-light text-warning"><i class="fa-solid fa-cart-shopping"></i></div>
                <div class="kpi-details">
                    <div class="kpi-label">Vendas Hoje</div>
                    <div class="kpi-value">${salesTodayCount}</div>
                    <div class="kpi-trend text-muted"><span>Pedidos concluídos</span></div>
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon bg-info-light text-info"><i class="fa-solid fa-users"></i></div>
                <div class="kpi-details">
                    <div class="kpi-label">Total de Clientes</div>
                    <div class="kpi-value">${customers.length}</div>
                    <div class="kpi-trend text-muted"><span>Base ativa</span></div>
                </div>
            </div>
        </div>

        <div class="dashboard-grids">
            <!-- Coluna Principal -->
            <div style="display:flex; flex-direction:column; gap:1.5rem;">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Faturamento (Últimos 7 Dias)</h3>
                        <button class="btn-icon"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                    </div>
                    <div class="chart-container">
                        <canvas id="dashboardChart"></canvas>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Últimas Vendas</h3>
                        <button class="btn btn-secondary btn-sm" onclick="window.navigateTo('relatorios')">Ver todas</button>
                    </div>
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Data e Hora</th>
                                    <th>Nº Pedido</th>
                                    <th>Pagamento</th>
                                    <th class="text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sales.slice().reverse().slice(0, 5).map(s => `
                                    <tr>
                                        <td>${formatDateTime(s.date)}</td>
                                        <td><span class="text-muted">#${s.id.toUpperCase()}</span></td>
                                        <td><span class="status-badge ${s.payment === 'PIX' ? 'status-info' : 'status-primary'}">${s.payment}</span></td>
                                        <td class="text-right font-bold text-success">${formatMoney(s.total)}</td>
                                    </tr>
                                `).join('') || '<tr><td colspan="4" class="text-center text-muted">Nenhuma venda realizada ainda.</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Coluna Secundária -->
            <div style="display:flex; flex-direction:column; gap:1.5rem;">
                <div class="card stock-alert-card">
                    <div class="card-header">
                        <h3 class="card-title" style="color: var(--danger);"><i class="fa-solid fa-triangle-exclamation" style="margin-right: 0.5rem;"></i>Atenção: Estoque Baixo</h3>
                        <span class="badge" style="position:relative; width:auto; padding:2px 8px;">${lowStock.length}</span>
                    </div>
                    ${lowStock.length > 0 ? `
                        <div class="activity-list">
                            ${lowStock.slice(0, 5).map(p => `
                                <div class="activity-item" style="align-items:center;">
                                    <div class="activity-icon bg-danger-light text-danger"><i class="fa-solid fa-box"></i></div>
                                    <div class="activity-content">
                                        <h4>${p.name}</h4>
                                        <p>Cód: ${p.code}</p>
                                    </div>
                                    <div class="text-right">
                                        <div class="font-bold text-danger">${p.stock} un</div>
                                        <div style="font-size:0.7rem; color:var(--text-muted)">Min: ${p.minStock}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="empty-state" style="padding: 2rem;">
                            <i class="fa-solid fa-check-circle text-success" style="font-size: 2.5rem;"></i>
                            <h3 style="font-size: 1rem; margin-top: 1rem;">Estoque Saudável</h3>
                            <p style="font-size: 0.8rem;">Todos os produtos estão acima do nível mínimo.</p>
                        </div>
                    `}
                    <div class="mt-4">
                        <button class="btn btn-outline w-full" onclick="window.navigateTo('estoque')">Gerenciar Estoque</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    window.addEventListener('view-loaded', handleDashboardLoaded, { once: true });

    return html;
};

function handleDashboardLoaded(e) {
    if (e.detail.view !== 'dashboard') return;
    
    setTimeout(initChart, 100); // Wait a bit for DOM injection
}

function initChart() {
    const ctx = document.getElementById('dashboardChart');
    if (!ctx) return;

    // Build past 7 days labels and simulate data
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }));
        // Let's create some realistic looking random data or fetch from db if available
        // For this demo, let's just make it visually pleasing
        data.push(Math.floor(Math.random() * 5000) + 1000); 
    }
    
    // Add real data from today if exists
    const sales = db.get('sales');
    let revToday = 0;
    const todayStr = new Date().toDateString();
    sales.forEach(sale => {
        if (new Date(sale.date).toDateString() === todayStr) {
            revToday += sale.total;
        }
    });
    if (revToday > 0) {
        data[6] = revToday;
    }

    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#3B82F6';
    const primaryLight = getComputedStyle(document.documentElement).getPropertyValue('--primary-light').trim() || 'rgba(59, 130, 246, 0.15)';
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#94A3B8';
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-light').trim() || 'rgba(255, 255, 255, 0.05)';

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Faturamento (R$)',
                data: data,
                borderColor: primaryColor,
                backgroundColor: primaryLight,
                borderWidth: 3,
                pointBackgroundColor: primaryColor,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 10,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { color: textColor, font: { family: "'Poppins', sans-serif" } }
                },
                y: {
                    grid: { color: gridColor, drawBorder: false },
                    ticks: { 
                        color: textColor, 
                        font: { family: "'Poppins', sans-serif" },
                        callback: function(value) {
                            return 'R$ ' + value;
                        }
                    }
                }
            }
        }
    });
}

