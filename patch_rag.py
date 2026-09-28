import os
path = 'e:/Projects/GenAi-Capstone-Project/backend/rag_pipeline.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_guideline = 'math. Never use raw square brackets without dollar delimiters.\\n\\n"\n         "Context from currently selected documents:\\n{context}"),'
new_guideline = 'math. Never use raw square brackets without dollar delimiters.\\n"\n         "7. CRITICAL: You MUST include inline citations in your text referencing the source documents! Format them strictly as [filename.pdf] or [filename.pdf, Page X].\\n"\n         "8. CRITICAL: Do NOT use HTML tags like <br>. Use standard markdown for line breaks and formatting.\\n\\n"\n         "Context from currently selected documents:\\n{context}"),'
content = content.replace(old_guideline, new_guideline)

old_doc = 'document_prompt = PromptTemplate.from_template("Source: {source} (Page {page})\\nContent: {page_content}")'
new_doc = 'document_prompt = PromptTemplate.from_template("Source Document: {filename}\\nContent: {page_content}")'
content = content.replace(old_doc, new_doc)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Patched rag_pipeline.py')
