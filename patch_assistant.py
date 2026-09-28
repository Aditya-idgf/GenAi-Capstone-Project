import os
path = 'e:/Projects/GenAi-Capstone-Project/frontend/src/components/chat/AssistantResponse.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add openSourceTab to useWorkspace
content = content.replace(
    "const { setSelectedText } = useWorkspace()",
    "const { setSelectedText, openSourceTab } = useWorkspace()"
)

# Update preprocessLaTeX to include Markdown cleanup and citation mapping
old_preprocess = '''function preprocessLaTeX(content: string): string {
  if (!content) return ''
  // 1. Convert \[ ... \] to  ... 
  let text = content.replace(/\\\[([\\s\\S]*?)\\\]/g, (_, eq) => \\n\\n\\\n\\n)
  // 2. Convert \( ... \) to $ ... $
  text = text.replace(/\\\\\(([\\s\\S]*?)\\\\\)/g, (_, eq) => $\$)
  // 3. Convert standalone bracketed equations [ \text{...} ] to  ... 
  text = text.replace(/(?:^|\\n)\\s*\\[\\s*(\\\\([a-zA-Z]+)[\\s\\S]*?)\\s*\\]\\s*(?:\\n|$)/g, (_, eq) => \\n\\n\\\n\\n)
  return text
}'''

new_preprocess = '''function preprocessLaTeX(content: string): string {
  if (!content) return ''
  let text = content
  // 1. Convert HTML <br> to newlines
  text = text.replace(/<br\\s*\\/?>/gi, '\\n')
  // 2. Convert citations like [filename.pdf] or [filename.pdf, Page X] to Markdown links
  text = text.replace(/\\[([^\\]]+\\.pdf(?:,\\s*Page\\s*\\d+)?)\\]/gi, (match, p1) => {
    return [\](#cite-\)
  })
  // 3. Convert \\[ ... \\] to  ... 
  text = text.replace(/\\\[([\\s\\S]*?)\\\]/g, (_, eq) => \\n\\n\\\n\\n)
  // 4. Convert \\( ... \\) to $ ... $
  text = text.replace(/\\\\\(([\\s\\S]*?)\\\\\)/g, (_, eq) => $\$)
  // 5. Convert standalone bracketed equations
  text = text.replace(/(?:^|\\n)\\s*\\[\\s*(\\\\([a-zA-Z]+)[\\s\\S]*?)\\s*\\]\\s*(?:\\n|$)/g, (_, eq) => \\n\\n\\\n\\n)
  return text
}'''

content = content.replace(old_preprocess, new_preprocess)

# Update ReactMarkdown components to intercept citations
old_components = '''            components={{
              code({ node, inline, className, children, ...props }: any) {'''

new_components = '''            components={{
              a({ node, href, children, ...props }: any) {
                if (href && href.startsWith('#cite-')) {
                  const sourceName = decodeURIComponent(href.replace('#cite-', ''))
                  const filename = sourceName.split(',')[0].trim() // ignore page num for tab opening
                  return (
                    <button
                      type="button"
                      className="citation-pill"
                      style={{
                        background: 'var(--accent)',
                        color: 'var(--bg-app)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0 6px',
                        fontSize: '0.85em',
                        cursor: 'pointer',
                        margin: '0 2px',
                        fontFamily: 'monospace'
                      }}
                      onClick={(e) => {
                        e.preventDefault()
                        openSourceTab(filename)
                      }}
                      title={View \ in split pane}
                    >
                      {children}
                    </button>
                  )
                }
                return <a href={href} {...props}>{children}</a>
              },
              code({ node, inline, className, children, ...props }: any) {'''

content = content.replace(old_components, new_components)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('AssistantResponse.tsx patched')
