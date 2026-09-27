import os
path = 'e:/Projects/GenAi-Capstone-Project/frontend/src/components/tools/InteractiveMindMap.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "import { useWorkspace } from '../../state/WorkspaceContext'",
    "import { useWorkspace } from '../../state/WorkspaceContext'\nimport { globalToolCache } from '../../state/ToolCache'"
)

# Add activeSessionId
content = content.replace(
    "    activeSources,\n  } = useWorkspace()",
    "    activeSources,\n    activeSessionId,\n  } = useWorkspace()"
)

cache_hooks = '''  // Cache restore & save
  useEffect(() => {
    if (!activeSessionId) return
    const cacheKey = mindmap_
    const cached = globalToolCache[cacheKey]
    if (cached) {
      setData(cached.data)
      setLoading(false)
    } else {
      setData(null)
      setLoading(true) // will be overridden by initial load logic if we auto-load, but let's let the user press "Generate" or auto-load if it does that. Wait, the mind map auto-loads on mount!
    }
  }, [activeSessionId])

  useEffect(() => {
    if (activeSessionId && data) {
      globalToolCache[mindmap_] = { data }
    }
  }, [data, activeSessionId])

  // Load mind map from backend'''

content = content.replace("  // Load mind map from backend", cache_hooks)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('MindMap patched')
