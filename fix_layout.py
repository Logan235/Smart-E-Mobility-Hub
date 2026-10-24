import os

path = 'apps/frontend/src/components/layout/MainLayout.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

old_style = 'style={{ width: collapsed ? "72px" : "250px", transition: "width 0.25s ease" }}'
new_style = 'style={{ width: collapsed ? "76px" : "250px", flex: "0 0 " + (collapsed ? "76px" : "250px"), transition: "all 0.25s ease" }}'

if old_style in code:
    code = code.replace(old_style, new_style)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(code)
    print("MainLayout width and flex updated successfully.")
else:
    print("old_style not found.")
