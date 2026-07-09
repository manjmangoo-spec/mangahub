// js/modules/configuracoes.js
import { db } from '../db.js';
import { UI } from '../ui.js';

export const renderConfiguracoes = () => {
    const settings = db.getSettings();

    const html = `
        <div class="view-header">
            <div class="view-title">
                <h2>Configurações do Sistema</h2>
                <p class="text-muted">Ajuste preferências, temas e realize backups.</p>
            </div>
        </div>

        <div class="settings-grid">
            <!-- Menu Lateral -->
            <div>
                <div class="settings-nav">
                    <div class="settings-nav-item active" onclick="window.changeSettingsTab(this, 'geral')"><i class="fa-solid fa-building" style="width:24px;"></i> Empresa & Geral</div>
                    <div class="settings-nav-item" onclick="window.changeSettingsTab(this, 'aparencia')"><i class="fa-solid fa-palette" style="width:24px;"></i> Aparência & Tema</div>
                    <div class="settings-nav-item" onclick="window.changeSettingsTab(this, 'dados')"><i class="fa-solid fa-database" style="width:24px;"></i> Backup de Dados</div>
                </div>
            </div>

            <!-- Conteúdo -->
            <div class="settings-content-card" id="settings-content">
                <!-- Injetado -->
            </div>
        </div>
    `;

    window.addEventListener('view-loaded', handleViewLoaded, { once: true });
    return html;
};

function handleViewLoaded(e) {
    if (e.detail.view !== 'configuracoes') return;
    
    renderTabGeral();

    window.changeSettingsTab = (el, type) => {
        document.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
        el.classList.add('active');

        if (type === 'geral') renderTabGeral();
        else if (type === 'aparencia') renderTabAparencia();
        else if (type === 'dados') renderTabDados();
    };

    window.saveSettings = (type) => {
        const settings = db.getSettings();
        if (type === 'geral') {
            settings.companyName = document.getElementById('set-company').value;
        } else if (type === 'aparencia') {
            settings.theme = document.getElementById('set-theme').value;
            // Immediate apply
            document.documentElement.setAttribute('data-theme', settings.theme);
        }
        db.updateSettings(settings);
        window.BusinessApp.updateHeader(); // forces header update
        UI.showToast('Configurações salvas com sucesso.');
    };

    window.exportData = () => {
        const dataStr = JSON.stringify(db.data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'businesshub_backup.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        UI.showToast('Backup exportado com sucesso.');
    };

    window.importData = () => {
        const input = document.getElementById('import-file');
        if (!input.files.length) {
            UI.showToast('Selecione um arquivo de backup primeiro.', 'warning');
            return;
        }

        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                // Validate some base keys
                if (importedData.products && importedData.settings) {
                    UI.confirm('Atenção: Todos os dados atuais serão apagados e substituídos pelo backup. Deseja continuar?', () => {
                        db.data = importedData;
                        db.save();
                        window.BusinessApp.updateHeader();
                        UI.showToast('Dados restaurados com sucesso!', 'success');
                        setTimeout(() => window.location.reload(), 1500); // reload to reset state fully
                    });
                } else {
                    UI.showToast('Arquivo de backup inválido ou corrompido.', 'error');
                }
            } catch (err) {
                UI.showToast('Erro ao ler o arquivo json.', 'error');
            }
        };
        reader.readAsText(file);
    };

    window.resetData = () => {
        UI.confirm('Atenção MÁXIMA: Isso apagará TODOS os dados, vendas, produtos e clientes. O sistema retornará ao estado inicial de fábrica. Deseja realmente fazer isso?', () => {
            db.reset();
            UI.showToast('Sistema resetado.', 'info');
            setTimeout(() => window.location.reload(), 1000);
        });
    }
}

function renderTabGeral() {
    const s = db.getSettings();
    document.getElementById('settings-content').innerHTML = `
        <h3 style="margin-bottom: 1.5rem;">Dados da Empresa</h3>
        <div class="form-group">
            <label>Nome do Estabelecimento / Razão Social</label>
            <input type="text" id="set-company" class="input" value="${s.companyName}">
        </div>
        <div class="form-actions" style="margin-top: 2rem;">
            <button class="btn btn-primary" onclick="window.saveSettings('geral')">Salvar Alterações</button>
        </div>
    `;
}

function renderTabAparencia() {
    const s = db.getSettings();
    document.getElementById('settings-content').innerHTML = `
        <h3 style="margin-bottom: 1.5rem;">Aparência</h3>
        <div class="form-group">
            <label>Tema do Sistema</label>
            <select id="set-theme" class="input">
                <option value="dark" ${s.theme === 'dark' ? 'selected' : ''}>Escuro (Premium Dark)</option>
                <option value="light" ${s.theme === 'light' ? 'selected' : ''}>Claro (Clean Light)</option>
            </select>
            <p class="text-muted mt-2" style="font-size: 0.8rem;">Altera imediatamente o visual de toda a aplicação.</p>
        </div>
        <div class="form-actions" style="margin-top: 2rem;">
            <button class="btn btn-primary" onclick="window.saveSettings('aparencia')">Salvar Tema</button>
        </div>
    `;
}

function renderTabDados() {
    document.getElementById('settings-content').innerHTML = `
        <h3 style="margin-bottom: 1.5rem;">Backup e Restauração</h3>
        
        <div style="display:flex; gap: 2rem; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 300px; padding: 1.5rem; background: var(--bg-card-hover); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                <h4>Exportar Backup</h4>
                <p class="text-muted" style="margin: 0.5rem 0 1.5rem; font-size: 0.85rem;">Baixe um arquivo JSON com todos os dados do sistema (vendas, produtos, etc).</p>
                <button class="btn btn-primary" onclick="window.exportData()"><i class="fa-solid fa-download"></i> Gerar e Baixar Backup</button>
            </div>

            <div style="flex: 1; min-width: 300px; padding: 1.5rem; background: var(--bg-card-hover); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                <h4>Restaurar Backup</h4>
                <p class="text-muted" style="margin: 0.5rem 0 1.5rem; font-size: 0.85rem;">Selecione um arquivo .json previamente exportado para restaurar o sistema.</p>
                <label class="custom-file-upload" style="display: block; margin-bottom: 1.5rem;"><input type="file" id="import-file" accept=".json" style="display: none;" onchange="document.getElementById('file-name-display').textContent = this.files[0] ? this.files[0].name : 'Nenhum arquivo selecionado'"><div class="file-upload-box" style="border: 2px dashed var(--border-color); border-radius: var(--radius-md); padding: 2rem; text-align: center; cursor: pointer; transition: all 0.2s ease; background: var(--bg-body);"><i class="fa-solid fa-cloud-arrow-up" style="font-size: 2.5rem; color: var(--primary); margin-bottom: 1rem;"></i><div style="font-weight: 500; font-size: 1rem; color: var(--text-primary); margin-bottom: 0.25rem;">Clique para selecionar arquivo</div><div id="file-name-display" style="font-size: 0.85rem; color: var(--text-muted);">Nenhum arquivo .json selecionado</div></div></label>
                <button class="btn btn-secondary" onclick="window.importData()"><i class="fa-solid fa-upload"></i> Restaurar Dados</button>
            </div>
        </div>

        <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px dashed var(--border-color);">
            <h4 class="text-danger">Zona de Perigo</h4>
            <p class="text-muted" style="margin: 0.5rem 0 1rem; font-size: 0.85rem;">Resetar o sistema apagará todos os dados salvos localmente e retornará aos dados de demonstração iniciais.</p>
            <button class="btn btn-danger" onclick="window.resetData()"><i class="fa-solid fa-triangle-exclamation"></i> Resetar Tudo (Padrão de Fábrica)</button>
        </div>
    `;
}
