import os
path = 'e:/Projects/GenAi-Capstone-Project/frontend/src/state/WorkspaceContext.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("const [sourceCount, setSourceCount] = useState(12)", "const [sourceCount, setSourceCount] = useState(6)")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Patched WorkspaceContext.tsx')
