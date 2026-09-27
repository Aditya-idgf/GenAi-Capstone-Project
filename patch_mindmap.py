import os

path = 'e:/Projects/GenAi-Capstone-Project/frontend/src/components/tools/InteractiveMindMap.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add wheelSensitivity to cytoscape init
content = content.replace("boxSelectionEnabled: false,", "wheelSensitivity: 0.15,\n      boxSelectionEnabled: false,")

# Add hover and zoom handlers
handlers = """
    // Hover effects (minimalistic premium highlight)
    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target
      if (node.hasClass('faded')) return // don't highlight if it's already faded out by selection/search
      cy.batch(() => {
        node.addClass('hover-highlight')
        node.connectedEdges().addClass('hover-edge-highlight')
        node.neighborhood('node').addClass('hover-neighbor')
      })
    })

    cy.on('mouseout', 'node', (evt) => {
      const node = evt.target
      cy.batch(() => {
        node.removeClass('hover-highlight')
        node.connectedEdges().removeClass('hover-edge-highlight')
        node.neighborhood('node').removeClass('hover-neighbor')
      })
    })

    // Dynamic label sizing based on zoom
    cy.on('zoom', () => {
      const currentZoom = cy.zoom();
      // Base zoom is around 1. If we zoom out (e.g., 0.2), we want the font size to scale up so it remains legible.
      // We will adjust the font size inversely to zoom, up to a maximum multiplier.
      const multiplier = Math.min(Math.max(1 / currentZoom, 1), 5);
      cy.nodes().forEach(node => {
        const baseSize = parseFloat(node.data('labelSize'));
        node.style('font-size', \\px\);
      });
    });

    cyRef.current = cy
"""

content = content.replace("cyRef.current = cy", handlers)

# Add hover styles to style array
hover_styles = """        {
          selector: '.hover-highlight',
          style: {
            'border-width': 3,
            'border-color': '#ffffff',
            'overlay-opacity': 0.6,
            'overlay-padding': 12,
            'z-index': 990,
          },
        },
        {
          selector: '.hover-neighbor',
          style: {
            'border-color': '#f8fafc',
            'overlay-opacity': 0.3,
            'overlay-padding': 8,
          },
        },
        {
          selector: '.hover-edge-highlight',
          style: {
            'width': 2,
            'line-color': '#94a3b8',
            'opacity': 0.8,
            'z-index': 989,
          },
        },
        {
          selector: '.highlighted',"""

content = content.replace("        {\n          selector: '.highlighted',", hover_styles)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('InteractiveMindMap patched successfully.')
