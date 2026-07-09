sed -i '/\/\* Sidebar \*\//a \
.sidebar {\n\
    flex-shrink: 0;\n\
    width: var(--sidebar-width);\n\
    background-color: var(--bg-card);\n\
    border-right: 1px solid var(--border-color);\n\
    display: flex;\n\
    flex-direction: column;\n\
    transition: var(--transition);\n\
    z-index: 50;\n\
}' css/layout.css
