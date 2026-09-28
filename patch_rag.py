import os
path = 'e:/Projects/GenAi-Capstone-Project/backend/rag_pipeline.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add PromptTemplate import if missing
if 'from langchain_core.prompts import PromptTemplate' not in content:
    content = content.replace(
        'from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder',
        'from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder, PromptTemplate'
    )

old_qa_prompt = '''         "3. If the user's question relates to the documents, use the context extensively to form your answer.\\n"
         "4. If the user's question is completely unrelated to the documents or context is empty, you MAY use your general knowledge, but politely mention that the answer is not drawn from the uploaded sources.\\n"
         "5. Always aim to be helpful, accurate, and structured in your response.\\n"
         "6. When presenting mathematical formulas or equations, ALWAYS format them using proper LaTeX syntax enclosed in double dollar signs (...) for standalone block equations, or single dollar signs ($...$) for inline math. Never use raw square brackets without dollar delimiters.\\n\\n"
         "Context from currently selected documents:\\n{context}"),'''

new_qa_prompt = '''         "3. If the user's question relates to the documents, use the context extensively to form your answer.\\n"
         "4. If the user's question is completely unrelated to the documents or context is empty, you MAY use your general knowledge, but politely mention that the answer is not drawn from the uploaded sources.\\n"
         "5. Always aim to be helpful, accurate, and structured in your response.\\n"
         "6. When presenting mathematical formulas or equations, ALWAYS format them using proper LaTeX syntax enclosed in double dollar signs (...) for standalone block equations, or single dollar signs ($...$) for inline math. Never use raw square brackets without dollar delimiters.\\n"
         "7. ALWAYS include inline citations in your text referencing the source documents! Format them strictly as [filename.pdf] or [filename.pdf, Page X].\\n"
         "8. Do NOT use HTML tags like <br>. Use standard markdown for line breaks and formatting.\\n\\n"
         "Context from currently selected documents:\\n{context}"),'''

content = content.replace(old_qa_prompt, new_qa_prompt)

old_chain = 'qa_chain = create_stuff_documents_chain(llm, qa_prompt)'
new_chain = '''document_prompt = PromptTemplate.from_template("Source: {source} (Page {page})\\nContent: {page_content}")
    qa_chain = create_stuff_documents_chain(llm, qa_prompt, document_prompt=document_prompt)'''

content = content.replace(old_chain, new_chain)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('rag_pipeline.py patched')
