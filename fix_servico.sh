sed -i '/<div style="margin-bottom: 1rem;">/,/<\/div>/ {
    /Categoria/ {
        N
        N
        d
    }
}' js/modules/servicos.js
