// js/db.js
import { generateId } from './utils.js';

const DB_KEY = 'businessHub_db_premium';

const defaultData = {
    products: [],
    customers: [],
    suppliers: [],
    employees: [
        { id: generateId(), name: 'Administrador', role: 'Administrador', doc: '000.000.000-00', phone: '', email: 'admin@admin.com', password: 'admin' }
    ],
    sales: [],
    services: [],
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
