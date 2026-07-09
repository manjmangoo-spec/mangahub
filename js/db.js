// js/db.js
import { generateId } from './utils.js';

const DB_KEY = 'businessHub_db_premium';

const defaultData = {
    products: [
        { id: generateId(), code: '001', name: 'MacBook Pro M3 Max 36GB', category: 'Eletrônicos', supplier: 'Apple Br', cost: 15000, price: 22000, stock: 5, minStock: 2, image: '' },
        { id: generateId(), code: '002', name: 'Cadeira Ergonômica Elements', category: 'Móveis', supplier: 'Elements', cost: 850, price: 1599, stock: 12, minStock: 5, image: '' },
        { id: generateId(), code: '003', name: 'Mouse Logitech MX Master 3S', category: 'Acessórios', supplier: 'Logitech', cost: 350, price: 650, stock: 3, minStock: 5, image: '' },
        { id: generateId(), code: '004', name: 'Monitor Dell UltraSharp 27"', category: 'Eletrônicos', supplier: 'Dell', cost: 1800, price: 2900, stock: 8, minStock: 3, image: '' }
    ],
    customers: [
        { id: generateId(), name: 'Empresa Alpha Ltda', doc: '12.345.678/0001-90', phone: '(11) 99999-9999', email: 'contato@alpha.com', address: 'Av Paulista, 1000' }
    ],
    suppliers: [
        { id: generateId(), name: 'Distribuidora Tech', doc: '98.765.432/0001-10', phone: '(11) 88888-8888', email: 'vendas@disttech.com', address: 'Rua das Indústrias, 500' }
    ],
    employees: [
        { id: generateId(), name: 'Administrador', role: 'Administrador', doc: '000.000.000-00', phone: '', email: 'admin@admin.com', password: 'admin' }
    ],
    sales: [],
    services: [
        { id: generateId(), code: "S001", name: "Serviço de Manutenção", category: "Manutenção", duration: 60, price: 150 },
        { id: generateId(), code: "S002", name: "Consultoria Especializada", category: "Consultoria", duration: 120, price: 300 },
        { id: generateId(), code: "S003", name: "Atendimento Padrão", category: "Geral", duration: 30, price: 50 }
    ],
    appointments: [],
    caixa: { 
        status: 'fechado', // 'aberto' | 'fechado'
        balance: 0,
        history: [] 
    },
    settings: { 
        companyName: 'Central de Negócios', 
        theme: 'dark' 
    }
};

class Database {
    constructor() {
        this.data = this.loadData();
    }

    loadData() {
        const stored = localStorage.getItem(DB_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error("Error parsing DB", e);
                return defaultData;
            }
        }
        return defaultData;
    }

    save() {
        localStorage.setItem(DB_KEY, JSON.stringify(this.data));
        // Dispatch custom event for cross-module reactivity if needed
        window.dispatchEvent(new Event('db-updated'));
    }

    // Generic Methods
    get(collection) {
        return this.data[collection] || [];
    }

    getById(collection, id) {
        return this.get(collection).find(item => item.id === id);
    }

    insert(collection, item) {
        if (!item.id) item.id = generateId();
        if (!this.data[collection]) this.data[collection] = [];
        this.data[collection].push(item);
        this.save();
        return item;
    }

    update(collection, id, updates) {
        const index = this.get(collection).findIndex(item => item.id === id);
        if (index !== -1) {
            this.data[collection][index] = { ...this.data[collection][index], ...updates };
            this.save();
            return this.data[collection][index];
        }
        return null;
    }

    remove(collection, id) {
        this.data[collection] = this.get(collection).filter(item => item.id !== id);
        this.save();
    }

    // Specific accessors
    getSettings() {
        return this.data.settings;
    }

    updateSettings(newSettings) {
        this.data.settings = { ...this.data.settings, ...newSettings };
        this.save();
    }

    getCaixa() {
        return this.data.caixa;
    }

    updateCaixa(updates) {
        this.data.caixa = { ...this.data.caixa, ...updates };
        this.save();
    }

    reset() {
        localStorage.removeItem(DB_KEY);
        this.data = defaultData;
        this.save();
    }
}

export const db = new Database();
