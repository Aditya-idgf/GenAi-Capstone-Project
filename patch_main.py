import os
path = 'e:/Projects/GenAi-Capstone-Project/backend/main.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "chain    = get_rag_chain(project_id=request.project_id, k=request.source_count, filenames=request.filenames)",
    "k_val = max(request.source_count, 12)\n        chain    = get_rag_chain(project_id=request.project_id, k=k_val, filenames=request.filenames)"
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Patched main.py')
