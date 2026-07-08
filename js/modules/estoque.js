// js/modules/estoque.js
import { db } from '../db.js';
import { UI } from '../ui.js';
import { formatMoney } from '../utils.js';

export const renderEstoque = () => {
    const html = `
        <div class="view-header">
            <div class="view-title">
                <h2>Inventário e Estoque</h2>
                <p class="text-muted">Gerencie todos os seus produtos, categorias e preços.</p>
            </div>
            <div class="view-actions">
                <button class="btn btn-primary" onclick="window.openProdutoModal()"><i class="fa-solid fa-plus"></i> Adicionar Produto</button>
            </div>
        </div>

        <div class="card">
            <div class="toolbar">
                <div class="search-bar" style="width: 350px;">
                    <i class="fa-solid fa-search"></i>
                    <input type="text" id="estoque-search" placeholder="Buscar por código ou nome...">
                </div>
                <div class="toolbar-actions">
                    <select id="estoque-filter-cat" class="input" style="width: auto;" onchange="window.updateEstoqueUI()">
                        <option value="">Todas as Categorias</option>
                    </select>
                </div>
            </div>

            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Produto</th>
                            <th>Categoria</th>
                            <th class="text-right">Custo</th>
                            <th class="text-right">Venda</th>
                            <th class="text-center">Estoque</th>
                            <th class="text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="estoque-table-body">
                        <!-- Conteúdo Injetado -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    window.addEventListener('view-loaded', handleViewLoaded, { once: true });
    return html;
};

function handleViewLoaded(e) {
    if (e.detail.view !== 'estoque') return;
    
    populateCategoriesFilter();
    updateEstoqueUI();

    document.getElementById('estoque-search').addEventListener('input', updateEstoqueUI);

    window.updateEstoqueUI = updateEstoqueUI;

    window.openProdutoModal = (id = null) => {
        let p = { name: '', code: '', category: '', supplier: '', cost: '', price: '', stock: '', minStock: '' };
        if (id) {
            p = db.getById('products', id) || p;
        }

        const suppliers = db.get('suppliers');
        const supplierOptions = suppliers.map(s => `<option value="${s.name}" ${p.supplier === s.name ? 'selected' : ''}>${s.name}</option>`).join('');

        const html = `
            <div class="modal-header">
                <h3>${id ? 'Editar Produto' : 'Novo Produto'}</h3>
                <button type="button" class="btn-icon" onclick="UI.closeModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <form id="form-produto" onsubmit="event.preventDefault(); window.saveProduto('${id || ''}')">
                    <div class="form-grid">
                        <div class="form-group col-2">
                            <label>Nome do Produto *</label>
                            <input type="text" id="p-name" class="input" required value="${p.name}">
                        </div>
                        <div class="form-group">
                            <label>Código de Barras / SKU *</label>
                            <input type="text" id="p-code" class="input" required value="${p.code}">
                        </div>
                        <div class="form-group">
                            <label>Categoria</label>
                            <input type="text" id="p-category" class="input" value="${p.category}" list="cat-list">
                            <datalist id="cat-list">
                                ${[...new Set(db.get('products').map(x=>x.category))].map(c => `<option value="${c}">`).join('')}
                            </datalist>
                        </div>
                        <div class="form-group col-2">
                            <label>Fornecedor</label>
                            <select id="p-supplier" class="input">
                                <option value="">Sem fornecedor</option>
                                ${supplierOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Preço de Custo (R$) *</label>
                            <input type="number" id="p-cost" class="input" step="0.01" required value="${p.cost}">
                        </div>
                        <div class="form-group">
                            <label>Preço de Venda (R$) *</label>
                            <input type="number" id="p-price" class="input" step="0.01" required value="${p.price}">
                        </div>
                        <div class="form-group">
                            <label>Estoque Atual *</label>
                            <input type="number" id="p-stock" class="input" required value="${p.stock}">
                        </div>
                        <div class="form-group">
                            <label>Estoque Mínimo (Alerta)</label>
                            <input type="number" id="p-min" class="input" value="${p.minStock}">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Salvar Produto</button>
                    </div>
                </form>
            </div>
        `;
        UI.openModal(html);
    };

    window.saveProduto = (id) => {
        const item = {
            name: document.getElementById('p-name').value,
            code: document.getElementById('p-code').value,
            category: document.getElementById('p-category').value,
            supplier: document.getElementById('p-supplier').value,
            cost: Number(document.getElementById('p-cost').value),
            price: Number(document.getElementById('p-price').value),
            stock: Number(document.getElementById('p-stock').value),
            minStock: Number(document.getElementById('p-min').value) || 0
        };

        if (id) {
            db.update('products', id, item);
            UI.showToast('Produto atualizado com sucesso!');
        } else {
            db.insert('products', item);
            UI.showToast('Produto cadastrado com sucesso!');
        }

        UI.closeModal();
        populateCategoriesFilter();
        updateEstoqueUI();
    };

    window.deleteProduto = (id) => {
        UI.confirm('Tem certeza que deseja excluir permanentemente este produto?', () => {
            db.remove('products', id);
            updateEstoqueUI();
            populateCategoriesFilter();
            UI.showToast('Produto excluído.');
        });
    };
    
    window.duplicateProduto = (id) => {
        const p = db.getById('products', id);
        if (p) {
            const clone = { ...p };
            delete clone.id;
            clone.code = clone.code + '-COPIA';
            clone.name = clone.name + ' (Cópia)';
            db.insert('products', clone);
            updateEstoqueUI();
            UI.showToast('Produto duplicado.');
        }
    }
}

function populateCategoriesFilter() {
    const select = document.getElementById('estoque-filter-cat');
    if (!select) return;
    const currentVal = select.value;
    const cats = [...new Set(db.get('products').map(p => p.category).filter(Boolean))];
    select.innerHTML = '<option value="">Todas as Categorias</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');
    select.value = currentVal;
}

function updateEstoqueUI() {
    const term = (document.getElementById('estoque-search')?.value || '').toLowerCase();
    const cat = document.getElementById('estoque-filter-cat')?.value || '';
    
    let filtered = db.get('products').filter(p => {
        const matchTerm = p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term);
        const matchCat = cat === '' || p.category === cat;
        return matchTerm && matchCat;
    });

    const tbody = document.getElementById('estoque-table-body');
    if (tbody) {
        tbody.innerHTML = filtered.map(p => {
            const isLow = Number(p.stock) <= Number(p.minStock);
            const profit = p.price - p.cost;
            const margin = p.price > 0 ? ((profit / p.price) * 100).toFixed(1) : 0;
            
            return `
                <tr>
                    <td><span class="text-muted" style="font-family: monospace;">${p.code}</span></td>
                    <td>
                        <div class="font-bold">${p.name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${p.supplier || 'Sem forn.'}</div>
                    </td>
                    <td><span class="status-badge status-primary" style="background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-secondary);">${p.category || 'Geral'}</span></td>
                    <td class="text-right text-muted">${formatMoney(p.cost)}</td>
                    <td class="text-right">
                        <div class="font-bold text-success">${formatMoney(p.price)}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Margem: ${margin}%</div>
                    </td>
                    <td class="text-center">
                        <span class="status-badge ${isLow ? 'status-danger' : 'status-success'}">
                            ${p.stock} un
                        </span>
                    </td>
                    <td class="text-right">
                        <button class="btn-icon primary" title="Editar" onclick="window.openProdutoModal('${p.id}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon" title="Duplicar" onclick="window.duplicateProduto('${p.id}')"><i class="fa-solid fa-copy"></i></button>
                        <button class="btn-icon danger" title="Excluir" onclick="window.deleteProduto('${p.id}')"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('') || `<tr><td colspan="7" class="text-center text-muted" style="padding: 3rem;">Nenhum produto encontrado.</td></tr>`;
    }
}
