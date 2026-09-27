import os
path = 'e:/Projects/GenAi-Capstone-Project/frontend/src/components/tools/InteractiveMindMap.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_effect = '''  useEffect(() => {
    loadGraph()
  }, [activeProjectId, selectedSourcesForQuery.join(','), selectedText])'''

new_effect = '''  useEffect(() => {
    // If we just restored from cache and haven't intentionally changed query parameters, skip auto-load
    const cacheKey = mindmap_
    if (globalToolCache[cacheKey] && globalToolCache[cacheKey].data) {
       return
    }
    loadGraph()
  }, [activeProjectId, selectedSourcesForQuery.join(','), selectedText, activeSessionId])'''

content = content.replace(old_effect, new_effect)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('MindMap autoload patched')
