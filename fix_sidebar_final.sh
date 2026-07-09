sed -i 's/.sidebar {/.sidebar {\n    position: fixed;\n    top: 0;\n    left: 0;\n    bottom: 0;/g' css/layout.css
sed -i 's/.main-content {/.main-content {\n    margin-left: var(--sidebar-width);\n    width: calc(100% - var(--sidebar-width));/g' css/layout.css
sed -i '/@media (max-width: 768px) {/a \    .main-content { margin-left: 0; width: 100%; }' css/layout.css
