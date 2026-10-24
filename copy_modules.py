import os

# Copy Module 1
os.makedirs('apps/frontend/src/modules/module1-shared-ev', exist_ok=True)
with open('apps/frontend/src/Module1.tsx', 'r', encoding='utf-8') as f:
    c = f.read().replace('import "./Module1.css";', 'import "../../Module1.css";')
with open('apps/frontend/src/modules/module1-shared-ev/Module1View.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

# Copy Module 2
os.makedirs('apps/frontend/src/modules/module2-parking', exist_ok=True)
with open('apps/frontend/src/Module2.tsx', 'r', encoding='utf-8') as f:
    c = f.read().replace('import "./Module2.css";', 'import "../../Module1.css";')
with open('apps/frontend/src/modules/module2-parking/Module2View.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

# Copy Module 3
os.makedirs('apps/frontend/src/modules/module3-monitoring', exist_ok=True)
with open('apps/frontend/src/Module3.tsx', 'r', encoding='utf-8') as f:
    c = f.read().replace('import "./Module3.css";', 'import "../../Module1.css";')
with open('apps/frontend/src/modules/module3-monitoring/Module3View.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

# Copy Module 4
os.makedirs('apps/frontend/src/modules/module4-redist', exist_ok=True)
with open('apps/frontend/src/Module4.tsx', 'r', encoding='utf-8') as f:
    c = f.read().replace('import "./Module4.css";', 'import "../../Module1.css";')
with open('apps/frontend/src/modules/module4-redist/Module4View.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('All module views copied successfully.')