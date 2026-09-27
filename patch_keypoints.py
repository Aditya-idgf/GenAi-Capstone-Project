import os
path = 'e:/Projects/GenAi-Capstone-Project/frontend/src/components/tools/KeyPointsView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "import { useWorkspace } from '../../state/WorkspaceContext'",
    "import { useWorkspace } from '../../state/WorkspaceContext'\nimport { globalToolCache } from '../../state/ToolCache'"
)

# Add activeSessionId to destructuring
content = content.replace(
    "    selectedText,\n  } = useWorkspace()",
    "    selectedText,\n    activeSessionId,\n  } = useWorkspace()"
)

# Add caching hooks
cache_hooks = '''  // Cache restore & save
  useEffect(() => {
    if (!activeSessionId) return
    const cacheKey = keypoints_
    const cached = globalToolCache[cacheKey]
    if (cached) {
      setMarkdownResult(cached.markdownResult)
      setHasTriggered(cached.hasTriggered)
    } else {
      setMarkdownResult(null)
      setHasTriggered(false)
    }
  }, [activeSessionId])

  useEffect(() => {
    if (activeSessionId) {
      globalToolCache[keypoints_] = { markdownResult, hasTriggered }
    }
  }, [markdownResult, hasTriggered, activeSessionId])

  const handleExtract = async () => {'''

content = content.replace("  const handleExtract = async () => {", cache_hooks)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('KeyPointsView patched')
