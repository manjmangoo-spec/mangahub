sed -i '/<!-- Stats Row -->/i \
        <!-- Ações Rápidas (Universal Launcher) -->\
        <div style="margin-bottom: 2rem;">\
            <h3 style="margin-bottom: 1rem; font-size: 1.1rem; color: var(--text-primary);">Ações Rápidas</h3>\
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem;">\
                <div class="card stat-card" style="cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding: 1.5rem 1rem;" onclick="window.navigateTo('\''pdv'\'')">\
                    <div class="stat-icon bg-primary-light text-primary" style="margin-bottom: 1rem;"><i class="fa-solid fa-cash-register"><\/i><\/div>\
                    <div style="font-weight: 600; color: var(--text-primary);">Nova Venda<\/div>\
                <\/div>\
                <div class="card stat-card" style="cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding: 1.5rem 1rem;" onclick="window.navigateTo('\''agendamentos'\'')">\
                    <div class="stat-icon bg-success-light text-success" style="margin-bottom: 1rem;"><i class="fa-regular fa-calendar-check"><\/i><\/div>\
                    <div style="font-weight: 600; color: var(--text-primary);">Agendar Horário<\/div>\
                <\/div>\
                <div class="card stat-card" style="cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding: 1.5rem 1rem;" onclick="window.navigateTo('\''clientes'\'')">\
                    <div class="stat-icon bg-warning-light text-warning" style="margin-bottom: 1rem;"><i class="fa-solid fa-user-plus"><\/i><\/div>\
                    <div style="font-weight: 600; color: var(--text-primary);">Novo Cliente<\/div>\
                <\/div>\
                <div class="card stat-card" style="cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding: 1.5rem 1rem;" onclick="window.navigateTo('\''estoque'\'')">\
                    <div class="stat-icon bg-danger-light text-danger" style="margin-bottom: 1rem;"><i class="fa-solid fa-box-open"><\/i><\/div>\
                    <div style="font-weight: 600; color: var(--text-primary);">Cadastrar Produto<\/div>\
                <\/div>\
                <div class="card stat-card" style="cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding: 1.5rem 1rem;" onclick="window.navigateTo('\''caixa'\'')">\
                    <div class="stat-icon bg-info-light text-info" style="margin-bottom: 1rem;"><i class="fa-solid fa-wallet"><\/i><\/div>\
                    <div style="font-weight: 600; color: var(--text-primary);">Lançar Despesa<\/div>\
                <\/div>\
            <\/div>\
        <\/div>\
' js/modules/dashboard.js
