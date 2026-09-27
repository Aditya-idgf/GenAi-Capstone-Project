import os

path = 'e:/Projects/GenAi-Capstone-Project/backend/main.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_prompt = '''    prompt = (
        "You are an expert analytical assistant. Your task is to extract the most critical key points from the provided text.\\n"
        "Output the result STRICTLY in beautifully formatted Markdown.\\n"
        "Use properly nested hierarchies: Main Headings (##), Subheadings (###), unordered bullets (-), and sub-bullets.\\n"
        "Ensure the output is highly readable, professional, and visually structured.\\n\\n"
        f"TEXT TO ANALYZE:\\n{context_text[:12000]}"
    )'''

new_prompt = '''    prompt = (
        "You are an expert academic research assistant. Your task is to extract and synthesize the most critical key points from the provided text for a target audience of researchers.\\n"
        "Output the result STRICTLY in beautifully formatted Markdown.\\n"
        "REQUIREMENTS:\\n"
        "1. Use properly nested hierarchies: Main Topics as Headings (##) and Subtopics as Subheadings (###).\\n"
        "2. For the main points under each topic, use numbered lists (1., 2., 3.).\\n"
        "3. For supporting details, evidence, or metrics under each main point, use indented bullet points (-, *).\\n"
        "4. Emphasize methodologies, quantitative results, novel findings, and conclusions.\\n"
        "5. The final output must look like a highly professional, rigorous academic executive summary.\\n\\n"
        f"TEXT TO ANALYZE:\\n{context_text[:12000]}"
    )'''

content = content.replace(old_prompt, new_prompt)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Backend patched.')
