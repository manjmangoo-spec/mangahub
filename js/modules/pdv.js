// js/modules/pdv.js
import { db } from '../db.js';
import { UI } from '../ui.js';
import { formatMoney } from '../utils.js';

let currentCart = [];
let cartDiscount = 0;
let activeCategory = 'Todas';
let searchQuery = '';

export const renderPDV = () => {
    // Check if caixa is open
    const caixa = db.getCaixa();
    if (caixa.status !== 'aberto') {
        setTimeout(() => {
            UI.showToast('O caixa está fechado! Redirecionando...', 'warning');
            window.navigateTo('caixa');
        }, 100);
        return '';
    }

    // Reset state on load
    currentCart = [];
    cartDiscount = 0;
    activeCategory = 'Todas';
    searchQuery = '';

    const html = `
        <div class="pdv-layout">
            <!-- Lista de Produtos -->
            <div class="pdv-products">
                <div class="pdv-header">
                    <div class="search-bar w-full" style="width:100%;">
                        <i class="fa-solid fa-barcode"></i>
                        <input type="text" id="pdv-search" placeholder="Pesquisar por nome ou código de barras (Leitor)">
                        <span class="shortcut">F3</span>
                    </div>
                    <div class="pdv-categories" id="pdv-categories-container">
                        <!-- Categorias Injetadas -->
                    </div>
                </div>
                <div class="pdv-grid" id="pdv-grid-container">
                    <!-- Produtos Injetados -->
                </div>
            </div>

            <!-- Carrinho Lateral -->
            <div class="pdv-cart">
                <div class="cart-header">
                    <h3 class="font-bold"><i class="fa-solid fa-cart-shopping"></i> Carrinho Atual</h3>
                    <button class="btn-icon danger" id="btn-clear-cart" title="Limpar Carrinho"><i class="fa-solid fa-trash"></i></button>
                </div>
                
                <div class="cart-items" id="pdv-cart-items">
                    <!-- Itens do Carrinho -->
                </div>

                <div class="cart-summary">
                    <div class="summary-row">
                        <span>Subtotal</span>
                        <span id="pdv-subtotal">R$ 0,00</span>
                    </div>
                    <div class="summary-row" style="color: var(--success);">
                        <span>Desconto</span>
                        <div style="display:flex; align-items:center; gap:0.5rem; justify-content:flex-end;">
                            <span>- R$</span>
                            <input type="number" id="pdv-discount" class="input" style="width: 80px; padding: 0.2rem 0.5rem; text-align:right;" value="0" min="0" step="0.01">
                        </div>
                    </div>
                    <div class="summary-row total">
                        <span>Total</span>
                        <span id="pdv-total">R$ 0,00</span>
                    </div>
                </div>

                <div class="cart-actions">
                    <button class="btn btn-secondary" style="grid-column: span 1;" id="btn-cancel-pdv">Cancelar</button>
                    <button class="btn btn-primary" style="grid-column: span 1;" id="btn-checkout-pdv"><i class="fa-solid fa-check"></i> Cobrar</button>
                </div>
            </div>
        </div>
    `;

    // Bind events after injection
    window.addEventListener('view-loaded', handleViewLoaded, { once: true });

    return html;
};

function handleViewLoaded(e) {
    if (e.detail.view !== 'pdv') return;
    updatePDVUI();

    document.getElementById('pdv-search').addEventListener('input', (ev) => {
        searchQuery = ev.target.value.toLowerCase();
        updatePDVUI();
    });

    document.getElementById('pdv-discount').addEventListener('input', (ev) => {
        cartDiscount = Number(ev.target.value) || 0;
        updateCartUI();
    });

    document.getElementById('btn-clear-cart').addEventListener('click', () => {
        if(currentCart.length > 0) {
            UI.confirm('Tem certeza que deseja limpar o carrinho?', () => {
                currentCart = [];
                cartDiscount = 0;
                document.getElementById('pdv-discount').value = '0';
                updateCartUI();
            });
        }
    });

    document.getElementById('btn-cancel-pdv').addEventListener('click', () => {
        window.navigateTo('dashboard');
    });

    document.getElementById('btn-checkout-pdv').addEventListener('click', openCheckoutModal);

    // Make functions globally available for inline onclicks in generated HTML
    window.setPDVCategory = (cat) => {
        activeCategory = cat;
        updatePDVUI();
    };

    window.addToCart = (id) => {
        const products = db.get('products');
        const prod = products.find(p => p.id === id);
        if (!prod) return;
        
        if (prod.stock <= 0) {
            UI.showToast('Produto fora de estoque!', 'error');
            return;
        }

        const existing = currentCart.find(i => i.id === id);
        if (existing) {
            if (existing.qty >= prod.stock) {
                UI.showToast('Estoque máximo atingido', 'warning');
                return;
            }
            existing.qty++;
        } else {
            currentCart.push({ ...prod, qty: 1 });
        }
        updateCartUI();
    };

    window.updateCartQty = (id, delta) => {
        const item = currentCart.find(i => i.id === id);
        if (item) {
            const prod = db.get('products').find(p => p.id === id);
            let newQty = item.qty + delta;
            
            if (newQty > prod.stock) {
                UI.showToast('Quantidade indisponível no estoque', 'warning');
                newQty = prod.stock;
            }
            
            if (newQty <= 0) {
                currentCart = currentCart.filter(i => i.id !== id);
            } else {
                item.qty = newQty;
            }
            updateCartUI();
        }
    };
}

function updatePDVUI() {
    const products = db.get('products');
    
    // Build categories
    const categories = ['Todas', ...new Set(products.map(p => p.category).filter(Boolean))];
    const catContainer = document.getElementById('pdv-categories-container');
    if (catContainer) {
        catContainer.innerHTML = categories.map(c => `
            <button class="cat-pill ${activeCategory === c ? 'active' : ''}" onclick="window.setPDVCategory('${c}')">${c}</button>
        `).join('');
    }

    // Filter products
    const filtered = products.filter(p => {
        const matchSearch =  (p.name && p.name.toLowerCase()) .includes(searchQuery) || (p.code && p.code.toLowerCase().includes(searchQuery));
        const matchCat = activeCategory === 'Todas' || p.category === activeCategory;
        return matchSearch && matchCat;
    });

    const grid = document.getElementById('pdv-grid-container');
    if (grid) {
        grid.innerHTML = filtered.map(p => `
            <div class="product-card ${p.stock <= 0 ? 'no-stock' : ''}" onclick="window.addToCart('${p.id}')">
                <div class="product-card-img">
                    <i class="fa-solid fa-image"></i>
                </div>
                <h4>${p.name}</h4>
                <div class="stock">Estoque: ${p.stock}</div>
                <div class="price">${formatMoney(p.price)}</div>
            </div>
        `).join('') || '<div style="grid-column: 1/-1; text-align:center; padding:3rem; color:var(--text-muted)">Nenhum produto encontrado.</div>';
    }
}

function updateCartUI() {
    const container = document.getElementById('pdv-cart-items');
    if (!container) return;

    if (currentCart.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 2rem;">
                <i class="fa-solid fa-basket-shopping"></i>
                <p>O carrinho está vazio</p>
            </div>
        `;
        document.getElementById('pdv-subtotal').textContent = 'R$ 0,00';
        document.getElementById('pdv-total').textContent = 'R$ 0,00';
        return;
    }

    let subtotal = 0;
    container.innerHTML = currentCart.map(item => {
        subtotal += (item.price * item.qty);
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div class="price-unit">${formatMoney(item.price)} un</div>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="window.updateCartQty('${item.id}', -1)"><i class="fa-solid fa-minus"></i></button>
                    <input type="text" class="qty-input" value="${item.qty}" readonly>
                    <button class="qty-btn" onclick="window.updateCartQty('${item.id}', 1)"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>
        `;
    }).join('');

    let total = subtotal - cartDiscount;
    if (total < 0) total = 0;

    document.getElementById('pdv-subtotal').textContent = formatMoney(subtotal);
    document.getElementById('pdv-total').textContent = formatMoney(total);
}

function openCheckoutModal() {
    if (currentCart.length === 0) {
        UI.showToast('Adicione produtos ao carrinho primeiro.', 'warning');
        return;
    }

    const subtotal = currentCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const total = Math.max(0, subtotal - cartDiscount);

    const html = `
        <div class="modal-header">
            <h3>Finalizar Venda</h3>
            <button type="button" class="btn-icon" onclick="UI.closeModal()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
            <div style="text-align: center; margin-bottom: 2rem;">
                <p class="text-secondary mb-2">Total a pagar</p>
                <h1 style="font-size: 2.5rem; color: var(--primary);">${formatMoney(total)}</h1>
            </div>

            <h4 style="margin-bottom: 1rem;">Método de Pagamento</h4>
            <div class="payment-grid">
                <label class="payment-option">
                    <input type="radio" name="payment_method" value="PIX" checked onchange="window.toggleTrocoPDV()">
                    <div class="payment-card">
                        <i class="fa-brands fa-pix"></i>
                        <span>PIX</span>
                    </div>
                </label>
                <label class="payment-option">
                    <input type="radio" name="payment_method" value="Dinheiro" onchange="window.toggleTrocoPDV()">
                    <div class="payment-card">
                        <i class="fa-solid fa-money-bill-wave"></i>
                        <span>Dinheiro</span>
                    </div>
                </label>
                <label class="payment-option">
                    <input type="radio" name="payment_method" value="Cartão de Crédito" onchange="window.toggleTrocoPDV()">
                    <div class="payment-card">
                        <i class="fa-regular fa-credit-card"></i>
                        <span>Crédito</span>
                    </div>
                </label>
                <label class="payment-option">
                    <input type="radio" name="payment_method" value="Cartão de Débito" onchange="window.toggleTrocoPDV()">
                    <div class="payment-card">
                        <i class="fa-solid fa-credit-card"></i>
                        <span>Débito</span>
                    </div>
                </label>
            </div>

            <div id="troco-container" style="display: none; background: var(--bg-card-hover); padding: 1.5rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
                <div class="form-group">
                    <label>Valor Recebido (R$)</label>
                    <input type="number" id="checkout-received" class="input" style="font-size: 1.25rem; font-weight: bold;" oninput="window.calcTrocoPDV(${total})">
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top: 1rem;">
                    <span class="text-secondary">Troco a devolver:</span>
                    <span id="checkout-troco" style="font-size: 1.5rem; font-weight: bold; color: var(--success);">R$ 0,00</span>
                </div>
            </div>

            <button type="button" class="btn btn-primary w-full" style="padding: 1rem; font-size: 1.1rem;" onclick="window.confirmCheckout()">Confirmar Recebimento</button>
        </div>
    `;

    UI.openModal(html);

    // Global handlers for modal
    window.toggleTrocoPDV = () => {
        const method = document.querySelector('input[name="payment_method"]:checked').value;
        const c = document.getElementById('troco-container');
        if(method === 'Dinheiro') {
            c.style.display = 'block';
            document.getElementById('checkout-received').focus();
        } else {
            c.style.display = 'none';
        }
    };

    window.calcTrocoPDV = (totalVal) => {
        const received = Number(document.getElementById('checkout-received').value);
        let troco = received - totalVal;
        if(troco < 0) troco = 0;
        document.getElementById('checkout-troco').textContent = formatMoney(troco);
    };

    window.confirmCheckout = () => {
        const method = document.querySelector('input[name="payment_method"]:checked').value;
        
        if (method === 'Dinheiro') {
            const received = Number(document.getElementById('checkout-received').value);
            if (received < total) {
                UI.showToast('Valor recebido é menor que o total!', 'error');
                return;
            }
        }

        // Process Sale
        const sale = {
            date: new Date().toISOString(),
            items: [...currentCart],
            subtotal,
            discount: cartDiscount,
            total,
            payment: method
        };
        db.insert('sales', sale);

        // Deduct Inventory
        currentCart.forEach(item => {
            const p = db.getById('products', item.id);
            if(p) db.update('products', p.id, { stock: p.stock - item.qty });
        });

        // Register Caixa movement
        const caixa = db.getCaixa();
        caixa.balance += total;
        caixa.history.push({
            id: db.insert('caixa_history_dummy', {}).id, // fast id
            date: new Date().toISOString(),
            type: 'entrada',
            desc: `Venda PDV - ${method}`,
            value: total
        });
        db.updateCaixa(caixa);

        UI.closeModal();
        
        // Reset Cart UI
        currentCart = [];
        cartDiscount = 0;
        document.getElementById('pdv-discount').value = '0';
        updateCartUI();
        updatePDVUI();
        
        // Show Print Modal
        const printModal = document.getElementById('modal-print');
        if (printModal) {
            printModal.style.display = 'flex';
            
            // Set up print button
            const btnPrint = document.getElementById('btn-print-receipt');
            // Remove old listeners to avoid multiple triggers
            const newBtn = btnPrint.cloneNode(true);
            btnPrint.parentNode.replaceChild(newBtn, btnPrint);
            
            newBtn.addEventListener('click', () => {
                printReceipt(sale);
                printModal.style.display = 'none';
                UI.showToast('Imprimindo comprovante...', 'success');
            });
        } else {
            UI.showToast('Venda finalizada com sucesso!', 'success');
        }
    };
}

function printReceipt(sale) {
    const settings = db.getSettings();
    let html = `
        <html>
        <head>
            <title>Comprovante de Venda</title>
            <style>
                body { font-family: 'Courier New', Courier, monospace; font-size: 12px; margin: 0; padding: 20px; width: 300px; }
                .center { text-align: center; }
                .line { border-bottom: 1px dashed #000; margin: 10px 0; }
                table { width: 100%; border-collapse: collapse; }
                th, td { text-align: left; padding: 2px 0; }
                .right { text-align: right; }
            </style>
        </head>
        <body>
            <div class="center">
                <h2>${settings.companyName}</h2>
                <p>Comprovante de Venda</p>
                <p>${new Date(sale.date).toLocaleString('pt-BR')}</p>
            </div>
            <div class="line"></div>
            <table>
                <tr>
                    <th>Qtd</th>
                    <th>Item</th>
                    <th class="right">Total</th>
                </tr>
    `;
    
    sale.items.forEach(item => {
        html += `
            <tr>
                <td>${item.qty}x</td>
                <td>${item.name}</td>
                <td class="right">${formatMoney(item.qty * item.price)}</td>
            </tr>
        `;
    });
    
    html += `
            </table>
            <div class="line"></div>
            <table>
                <tr><td>Subtotal:</td><td class="right">${formatMoney(sale.subtotal)}</td></tr>
                <tr><td>Desconto:</td><td class="right">${formatMoney(sale.discount)}</td></tr>
                <tr><th>TOTAL:</th><th class="right">${formatMoney(sale.total)}</th></tr>
                <tr><td>Pgto:</td><td class="right">${sale.payment}</td></tr>
            </table>
            <div class="line"></div>
            <div class="center">
                <p>Obrigado pela preferência!</p>
            </div>
        </body>
        </html>
    `;
    
    const win = window.open('', '_blank');
    if(win) {
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => {
            win.print();
            win.close();
        }, 500);
    } else {
        alert("Pop-ups bloqueados. Impossível imprimir.");
    }
}
