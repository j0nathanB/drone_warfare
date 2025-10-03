describe('Enhanced Map Interactions', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForMap()
  })

  describe('Region Highlighting', () => {
    it('should highlight regions on hover in sidebar', () => {
      // Navigate to a country to see regions
      cy.navigateToCountry('AFG')
      
      // Hover over a region in the sidebar
      cy.get('[data-cy="region-list"] .region-item').first().trigger('mouseover')
      
      // Corresponding region on map should be highlighted
      cy.get('.leaflet-map-pane .highlighted-region').should('exist')
      cy.get('.leaflet-map-pane .highlighted-region').should('have.css', 'stroke', 'rgb(251, 191, 36)') // #fbbf24
    })

    it('should remove highlight when mouse leaves sidebar item', () => {
      cy.navigateToCountry('SOM')
      
      // Hover over region
      cy.get('[data-cy="region-list"] .region-item').first().trigger('mouseover')
      cy.get('.leaflet-map-pane .highlighted-region').should('exist')
      
      // Move mouse away
      cy.get('[data-cy="region-list"] .region-item').first().trigger('mouseout')
      
      // Highlight should be removed
      cy.get('.leaflet-map-pane .highlighted-region').should('not.exist')
    })

    it('should highlight all countries when hovering over global stats', () => {
      // Should be in global view initially
      cy.get('[data-cy="breadcrumb-global"]').should('exist')
      
      // Hover over main statistics card
      cy.get('[data-cy="stats-card"]').trigger('mouseover')
      
      // All country boundaries should be highlighted
      cy.get('.leaflet-map-pane .highlighted-country').should('have.length', 4) // AFG, PAK, SOM, YEM
      
      // Move mouse away from stats
      cy.get('[data-cy="stats-card"]').trigger('mouseout')
      
      // Highlights should be removed
      cy.get('.leaflet-map-pane .highlighted-country').should('not.exist')
    })
  })

  describe('Interactive Breadcrumb Navigation', () => {
    it('should navigate back to global view when clicking global breadcrumb', () => {
      // Navigate to a country
      cy.navigateToCountry('PAK')
      cy.get('[data-cy="breadcrumb-country"]').should('contain.text', 'Pakistan')
      
      // Navigate to a region
      cy.get('[data-cy="region-list"] .region-item').first().click()
      cy.get('[data-cy="breadcrumb-region"]').should('exist')
      
      // Click global breadcrumb
      cy.get('[data-cy="breadcrumb-global"]').click()
      
      // Should return to global view
      cy.verifyAppState('global')
      cy.get('[data-cy="breadcrumb-region"]').should('not.exist')
      cy.get('[data-cy="breadcrumb-country"]').should('not.exist')
    })

    it('should navigate back to country view when clicking country breadcrumb', () => {
      // Navigate through levels
      cy.navigateToCountry('YEM')
      cy.get('[data-cy="region-list"] .region-item').first().click()
      cy.get('[data-cy="breadcrumb-region"]').should('exist')
      
      // Click country breadcrumb
      cy.get('[data-cy="breadcrumb-country"]').click()
      
      // Should return to country view
      cy.verifyAppState('country', 'YEM')
      cy.get('[data-cy="breadcrumb-region"]').should('not.exist')
    })
  })

  describe('Enhanced Feature Styling', () => {
    it('should restore original styling after highlight removal', () => {
      cy.navigateToCountry('AFG')
      
      // Get original styling of a region
      cy.get('.leaflet-map-pane path').first().then(($el) => {
        const originalFill = $el.attr('fill')
        const originalStroke = $el.attr('stroke')
        
        // Hover to highlight
        cy.get('[data-cy="region-list"] .region-item').first().trigger('mouseover')
        
        // Styling should change
        cy.get('.leaflet-map-pane .highlighted-region').should('exist')
        
        // Mouse out
        cy.get('[data-cy="region-list"] .region-item').first().trigger('mouseout')
        
        // Original styling should be restored
        cy.get('.leaflet-map-pane path').first().should('have.attr', 'fill', originalFill)
        cy.get('.leaflet-map-pane path').first().should('have.attr', 'stroke', originalStroke)
      })
    })

    it('should apply different styles for different administrative levels', () => {
      // Global level - country boundaries should have specific styling
      cy.get('.leaflet-map-pane .country-boundary').should('exist')
      cy.get('.leaflet-map-pane .country-boundary').should('have.css', 'stroke-width', '2px')
      
      // Navigate to country level
      cy.navigateToCountry('PAK')
      
      // Admin level 1 should have different styling
      cy.get('.leaflet-map-pane .admin-boundary').should('exist')
      cy.get('.leaflet-map-pane .admin-boundary').should('have.css', 'stroke-width', '1px')
      
      // Navigate deeper
      cy.get('[data-cy="region-list"] .region-item').first().click()
      
      // Admin level 2 should have even lighter styling
      cy.get('.leaflet-map-pane .admin-boundary').should('have.css', 'opacity')
    })
  })

  describe('Map Zoom and Pan Interactions', () => {
    it('should zoom to feature bounds when region is selected', () => {
      // Navigate to country
      cy.navigateToCountry('SOM')
      
      // Get current map bounds
      cy.window().its('appState.map.leafletMap').then((map) => {
        const initialBounds = map.getBounds()
        
        // Select a region
        cy.get('[data-cy="region-list"] .region-item').first().click()
        
        // Map should zoom to the selected region
        cy.window().its('appState.map.leafletMap').then((map) => {
          const newBounds = map.getBounds()
          
          // Bounds should be different and more focused
          expect(newBounds.getNorth()).to.not.equal(initialBounds.getNorth())
          expect(newBounds.getSouth()).to.not.equal(initialBounds.getSouth())
        })
      })
    })

    it('should maintain zoom level when switching between visualization layers', () => {
      // Navigate and zoom to a specific region
      cy.navigateToCountry('AFG')
      cy.get('[data-cy="region-list"] .region-item').first().click()
      
      // Get current zoom level
      cy.window().its('appState.map.leafletMap').then((map) => {
        const zoomLevel = map.getZoom()
        
        // Toggle visualization layers
        cy.get('[data-cy="layer-toggle-strikes"]').check()
        cy.get('[data-cy="layer-toggle-heatmap"]').check()
        
        // Zoom level should remain the same
        cy.window().its('appState.map.leafletMap').then((map) => {
          expect(map.getZoom()).to.equal(zoomLevel)
        })
      })
    })
  })

  describe('Tooltip and Popup Interactions', () => {
    it('should show enhanced tooltips with strike statistics', () => {
      // Hover over a country
      cy.get('.leaflet-map-pane .country-boundary').first().trigger('mouseover')
      
      // Tooltip should appear with detailed information
      cy.get('.leaflet-tooltip').should('be.visible')
      cy.get('.leaflet-tooltip').should('contain.text', 'Strikes:')
      cy.get('.leaflet-tooltip').should('contain.text', 'Total Deaths:')
      cy.get('.leaflet-tooltip').should('contain.text', 'Civilians:')
    })

    it('should show region-specific popups on click', () => {
      cy.navigateToCountry('PAK')
      
      // Click on a region
      cy.get('.leaflet-map-pane .admin-boundary').first().click()
      
      // Popup should show region details
      cy.get('.leaflet-popup').should('be.visible')
      cy.get('.leaflet-popup-content').should('contain.text', 'Region Details')
      cy.get('.leaflet-popup-content').should('contain.text', 'Administrative Level')
    })
  })

  describe('Context Menu Interactions', () => {
    it('should show context menu on right-click', () => {
      // Right-click on a country
      cy.get('.leaflet-map-pane .country-boundary').first().rightclick()
      
      // Context menu should appear
      cy.get('[data-cy="map-context-menu"]').should('be.visible')
      cy.get('[data-cy="context-menu-zoom"]').should('contain.text', 'Zoom to')
      cy.get('[data-cy="context-menu-details"]').should('contain.text', 'View Details')
    })

    it('should execute context menu actions', () => {
      // Right-click and select zoom action
      cy.get('.leaflet-map-pane .country-boundary').first().rightclick()
      cy.get('[data-cy="context-menu-zoom"]').click()
      
      // Map should zoom to the clicked feature
      cy.window().its('appState.map.leafletMap').then((map) => {
        expect(map.getZoom()).to.be.greaterThan(4) // Should zoom in from global view
      })
    })
  })

  describe('Performance Optimizations', () => {
    it('should debounce hover events to prevent excessive highlighting', () => {
      // Rapidly move mouse over multiple regions
      cy.navigateToCountry('YEM')
      
      // Hover over multiple regions quickly
      cy.get('[data-cy="region-list"] .region-item').eq(0).trigger('mouseover')
      cy.get('[data-cy="region-list"] .region-item').eq(1).trigger('mouseover')
      cy.get('[data-cy="region-list"] .region-item').eq(2).trigger('mouseover')
      
      // Should handle this gracefully without errors
      cy.get('.leaflet-map-pane .highlighted-region').should('exist')
    })

    it('should efficiently update map layers without flickering', () => {
      // Toggle layers rapidly
      cy.get('[data-cy="layer-toggle-strikes"]').check()
      cy.get('[data-cy="layer-toggle-strikes"]').uncheck()
      cy.get('[data-cy="layer-toggle-strikes"]').check()
      
      // Map should update smoothly
      cy.get('.leaflet-map-pane .strike-marker').should('exist')
    })
  })
})