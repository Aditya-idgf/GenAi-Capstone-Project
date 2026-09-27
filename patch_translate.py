import os
path = 'e:/Projects/GenAi-Capstone-Project/frontend/src/components/tools/TranslateView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "import { useWorkspace } from '../../state/WorkspaceContext'",
    "import { useWorkspace } from '../../state/WorkspaceContext'\nimport { globalToolCache } from '../../state/ToolCache'"
)

# Add activeSessionId
content = content.replace(
    "  const { selectedText, messages } = useWorkspace()",
    "  const { selectedText, messages, activeSessionId } = useWorkspace()"
)

cache_hooks = '''  // Cache restore & save
  useEffect(() => {
    if (!activeSessionId) return
    const cacheKey = 	ranslate_
    const cached = globalToolCache[cacheKey]
    if (cached) {
      if (cached.inputText) setInputText(cached.inputText)
      if (cached.translatedText) setTranslatedText(cached.translatedText)
      if (cached.glossary) setGlossary(cached.glossary)
    } else {
      setTranslatedText('')
      setGlossary([])
    }
  }, [activeSessionId])

  useEffect(() => {
    if (activeSessionId) {
      globalToolCache[	ranslate_] = { inputText, translatedText, glossary }
    }
  }, [inputText, translatedText, glossary, activeSessionId])

  useEffect(() => {'''

content = content.replace("  useEffect(() => {\n    if (typeof window", cache_hooks + "\n    if (typeof window")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('TranslateView patched')
