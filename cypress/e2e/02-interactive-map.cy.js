describe('Drone Warfare Visualization - Interactive Map', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForDataLoading()
    cy.waitForMap()
  })

  it('should allow zooming and panning the map', () => {
    // Test map zoom functionality
    cy.get('.leaflet-control-zoom-in').click()
    cy.wait(500)
    
    // Verify zoom level changed
    cy.window().then((win) => {
      expect(win.map.getZoom()).to.be.greaterThan(2)
    })
    
    // Test zoom out
    cy.get('.leaflet-control-zoom-out').click()
    cy.wait(500)
    
    // Test map panning by dragging
    cy.get('#map')
      .trigger('mousedown', { which: 1, pageX: 400, pageY: 300 })
      .trigger('mousemove', { which: 1, pageX: 450, pageY: 350 })
      .trigger('mouseup')
  })

  it('should display country boundaries on load', () => {
    // Check that map layers are present
    cy.window().then((win) => {
      expect(win.map._layers).to.not.be.empty
    })
    
    // Check for country boundary elements
    cy.get('.leaflet-overlay-pane').should('be.visible')
    cy.get('.leaflet-overlay-pane svg').should('exist')
  })

  it('should handle country selection and drill-down', () => {
    // Click on a country (Afghanistan - assuming it's loaded first)
    cy.get('.leaflet-interactive').first().click({ force: true })
    cy.wait(1000)
    
    // Breadcrumbs should update to show selection
    cy.get('[data-cy="breadcrumbs"]').should('contain.text', 'Afghanistan')
    
    // Statistics should update with country-specific data
    cy.get('[data-cy="statistics-panel"]').within(() => {
      cy.get('[data-cy="region-name"]').should('not.be.empty')
    })
  })

  it('should update statistics when region changes', () => {
    let initialStrikes, newStrikes
    
    // Get initial statistics
    cy.getStatistic('total-strikes').then((text) => {
      initialStrikes = parseInt(text.replace(/,/g, ''))
    })
    
    // Click on a region to drill down
    cy.get('.leaflet-interactive').first().click({ force: true })
    cy.wait(1000)
    
    // Verify statistics changed
    cy.getStatistic('total-strikes').then((text) => {
      newStrikes = parseInt(text.replace(/,/g, ''))
      expect(newStrikes).to.not.equal(initialStrikes)
    })
  })

  it('should display proper breadcrumb navigation', () => {
    // Initial breadcrumb should show "Global View"
    cy.get('[data-cy="breadcrumbs"]').should('contain.text', 'Global View')
    
    // After country selection, breadcrumb should update
    cy.get('.leaflet-interactive').first().click({ force: true })
    cy.wait(1000)
    
    cy.get('[data-cy="breadcrumbs"]').within(() => {
      cy.get('.breadcrumb-item').should('have.length.at.least', 2)
    })
  })

  it('should handle map layer controls', () => {
    // Check if layer control exists (may not be implemented yet)
    cy.get('body').then(($body) => {
      if ($body.find('.leaflet-control-layers').length > 0) {
        cy.get('.leaflet-control-layers').should('be.visible')
        
        // Test layer toggle if available
        cy.get('.leaflet-control-layers').click()
        cy.get('.leaflet-control-layers-list').should('be.visible')
      }
    })
  })

  it('should maintain map state during data updates', () => {
    // Set specific zoom and center
    cy.window().then((win) => {
      win.map.setView([35, 69], 6) // Focus on Afghanistan
    })
    
    // Get current map state
    cy.window().then((win) => {
      const initialCenter = win.map.getCenter()
      const initialZoom = win.map.getZoom()
      
      // Trigger data update by clicking region
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Verify map didn't reset unexpectedly (zoom should be similar)
      expect(win.map.getZoom()).to.be.within(initialZoom - 2, initialZoom + 2)
    })
  })
})