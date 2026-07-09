# Fix Servicos Modal
sed -i 's/<form id="form-servico" onsubmit="window.saveServico(event)" class="modal-body">/<form id="form-servico" onsubmit="window.saveServico(event)">\n                    <div class="modal-body">/g' js/modules/servicos.js

sed -i 's/<div style="display: flex; justify-content: flex-end; gap: 1rem;">/<\/div>\n                    <div class="modal-footer">/g' js/modules/servicos.js

# Fix Agendamentos Modal
sed -i 's/<form id="form-agenda" onsubmit="window.saveAgenda(event)" class="modal-body">/<form id="form-agenda" onsubmit="window.saveAgenda(event)">\n                    <div class="modal-body">/g' js/modules/agendamentos.js

sed -i 's/<div style="display: flex; justify-content: flex-end; gap: 1rem;">/<\/div>\n                    <div class="modal-footer">/g' js/modules/agendamentos.js

# Fix Estoque Modal
sed -i 's/<form id="form-produto" onsubmit="event.preventDefault(); window.saveProduto('\''${id || '\'''\''}'\'')" class="modal-body">/<form id="form-produto" onsubmit="event.preventDefault(); window.saveProduto('\''${id || '\'''\''}'\'')">\n                    <div class="modal-body">/g' js/modules/estoque.js

sed -i 's/<div class="form-actions" style="margin-top: 2rem; justify-content: flex-end;">/<\/div>\n                    <div class="modal-footer">/g' js/modules/estoque.js

# Fix Pessoas Modal
sed -i 's/<form id="form-pessoa" onsubmit="event.preventDefault(); window.savePessoa('\''${type}'\'', '\''${id || '\'''\''}'\'')" class="modal-body">/<form id="form-pessoa" onsubmit="event.preventDefault(); window.savePessoa('\''${type}'\'', '\''${id || '\'''\''}'\'')">\n                    <div class="modal-body">/g' js/modules/pessoas.js

sed -i 's/<div class="form-actions" style="margin-top: 2rem; justify-content: flex-end;">/<\/div>\n                    <div class="modal-footer">/g' js/modules/pessoas.js
