import os

path = 'e:/Projects/GenAi-Capstone-Project/frontend/src/components/tools/InteractiveMindMap.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("wheelSensitivity: 0.15,", "wheelSensitivity: 0.35,")

old_mouseover = '''    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target
      if (node.hasClass('faded')) return // don't highlight if it's already faded out by selection/search
      cy.batch(() => {
        node.addClass('hover-highlight')
        node.connectedEdges().addClass('hover-edge-highlight')
        node.neighborhood('node').addClass('hover-neighbor')
      })
    })'''

new_mouseover = '''    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target
      cy.container()!.style.cursor = 'pointer'
      if (node.hasClass('faded')) return // don't highlight if it's already faded out by selection/search
      cy.batch(() => {
        node.addClass('hover-highlight')
        node.connectedEdges().addClass('hover-edge-highlight')
        node.neighborhood('node').addClass('hover-neighbor')
      })
    })'''

old_mouseout = '''    cy.on('mouseout', 'node', (evt) => {
      const node = evt.target
      cy.batch(() => {
        node.removeClass('hover-highlight')
        node.connectedEdges().removeClass('hover-edge-highlight')
        node.neighborhood('node').removeClass('hover-neighbor')
      })
    })'''

new_mouseout = '''    cy.on('mouseout', 'node', (evt) => {
      const node = evt.target
      cy.container()!.style.cursor = 'default'
      cy.batch(() => {
        node.removeClass('hover-highlight')
        node.connectedEdges().removeClass('hover-edge-highlight')
        node.neighborhood('node').removeClass('hover-neighbor')
      })
    })'''

content = content.replace(old_mouseover, new_mouseover)
content = content.replace(old_mouseout, new_mouseout)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Frontend patched.')
