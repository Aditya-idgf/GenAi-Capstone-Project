import os
path = 'e:/Projects/GenAi-Capstone-Project/frontend/src/components/tools/CompareView.tsx'
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
    const cacheKey = compare_
    const cached = globalToolCache[cacheKey]
    if (cached) {
      if (cached.docA) setDocA(cached.docA)
      if (cached.docB) setDocB(cached.docB)
      if (cached.focusTopic) setFocusTopic(cached.focusTopic)
      setResult(cached.result)
    } else {
      setResult(null)
    }
  }, [activeSessionId])

  useEffect(() => {
    if (activeSessionId) {
      globalToolCache[compare_] = { docA, docB, focusTopic, result }
    }
  }, [docA, docB, focusTopic, result, activeSessionId])

  // Load project docs'''

content = content.replace("  // Load project docs", cache_hooks)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('CompareView patched')
