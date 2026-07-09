sed -i '/import { renderConfiguracoes } from '\''\.\/modules\/configuracoes\.js'\'';/a import { renderServicos } from '\''./modules/servicos.js'\'';\nimport { renderAgendamentos } from '\''./modules/agendamentos.js'\'';' js/app.js
sed -i '/'\''configuracoes'\'': renderConfiguracoes/a \            ,'\''servicos'\'': renderServicos,\n            '\''agendamentos'\'': renderAgendamentos' js/app.js
