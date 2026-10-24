path = 'Smart-E-Mobility-Hub/apps/frontend/src/modules/module4-redist/Module4View.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('import "./Module4.css";', 'import "../../Module1.css";')
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed Module4View.tsx CSS import cleanly')
