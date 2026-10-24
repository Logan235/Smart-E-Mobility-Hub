import os

for root, dirs, files in os.walk('Smart-E-Mobility-Hub/apps/frontend/src/modules'):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            content = content.replace('import "./Module2.css";', 'import "../../Module1.css";')
            content = content.replace('import "./Module4.css";', 'import "../../Module1.css";')
            content = content.replace('import "./Module1.css";', 'import "../../Module1.css";')
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)

print('Fixed CSS imports cleanly')
