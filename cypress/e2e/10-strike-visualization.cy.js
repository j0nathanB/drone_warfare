describe('Strike Visualization', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForMap()
  })

  describe('Strike Layer Controls', () => {
    it('should have layer control toggles for strikes and civilian impact', () => {
      // Strike points toggle should exist
      cy.get('[data-cy="layer-toggle-strikes"]').should('exist')
      cy.get('[data-cy="layer-toggle-strikes"]').should('have.attr', 'type', 'checkbox')
      
      // Civilian impact toggle should exist
      cy.get('[data-cy="layer-toggle-civilian"]').should('exist')
      cy.get('[data-cy="layer-toggle-civilian"]').should('have.attr', 'type', 'checkbox')
      
      // Heatmap toggle should exist
      cy.get('[data-cy="layer-toggle-heatmap"]').should('exist')
      cy.get('[data-cy="layer-toggle-heatmap"]').should('have.attr', 'type', 'checkbox')
    })

    it('should toggle strike point visibility', () => {
      // Initially strikes should not be visible
      cy.get('.leaflet-map-pane .strike-marker').should('not.exist')
      
      // Enable strike points
      cy.get('[data-cy="layer-toggle-strikes"]').check()
      
      // Strike markers should appear on map
      cy.get('.leaflet-map-pane .strike-marker').should('exist')
      cy.get('.leaflet-map-pane .strike-marker').should('have.length.greaterThan', 0)
      
      // Disable strike points
      cy.get('[data-cy="layer-toggle-strikes"]').uncheck()
      
      // Strike markers should disappear
      cy.get('.leaflet-map-pane .strike-marker').should('not.exist')
    })

    it('should toggle civilian impact visualization', () => {
      // Enable civilian impact layer
      cy.get('[data-cy="layer-toggle-civilian"]').check()
      
      // Civilian impact circles should appear
      cy.get('.leaflet-map-pane .civilian-impact-circle').should('exist')
      cy.get('.leaflet-map-pane .civilian-impact-circle').should('have.length.greaterThan', 0)
      
      // Disable civilian impact
      cy.get('[data-cy="layer-toggle-civilian"]').uncheck()
      
      // Civilian impact circles should disappear
      cy.get('.leaflet-map-pane .civilian-impact-circle').should('not.exist')
    })

    it('should toggle heatmap visualization', () => {
      // Enable heatmap
      cy.get('[data-cy="layer-toggle-heatmap"]').check()
      
      // Heatmap should appear
      cy.get('.leaflet-map-pane .heatmap-layer').should('exist')
      
      // Disable heatmap
      cy.get('[data-cy="layer-toggle-heatmap"]').uncheck()
      
      // Heatmap should disappear
      cy.get('.leaflet-map-pane .heatmap-layer').should('not.exist')
    })
  })

  describe('Strike Point Interactions', () => {
    beforeEach(() => {
      // Enable strike points for these tests
      cy.get('[data-cy="layer-toggle-strikes"]').check()
    })

    it('should show strike details on marker click', () => {
      // Click on a strike marker
      cy.get('.leaflet-map-pane .strike-marker').first().click()
      
      // Popup should appear with strike details
      cy.get('.leaflet-popup').should('be.visible')
      cy.get('.leaflet-popup-content').should('contain.text', 'Strike Location')
      cy.get('.leaflet-popup-content').should('contain.text', 'Date:')
      cy.get('.leaflet-popup-content').should('contain.text', 'Deaths:')
    })

    it('should show strike markers at different zoom levels', () => {
      // Navigate to a specific country
      cy.navigateToCountry('AFG')
      
      // Strike markers should be visible at country level
      cy.get('.leaflet-map-pane .strike-marker').should('exist')
      
      // Navigate deeper into administrative levels
      cy.get('[data-cy="region-list"] .region-item').first().click()
      
      // Markers should still be visible and potentially more detailed
      cy.get('.leaflet-map-pane .strike-marker').should('exist')
    })
  })

  describe('Civilian Impact Visualization', () => {
    beforeEach(() => {
      // Enable civilian impact layer
      cy.get('[data-cy="layer-toggle-civilian"]').check()
    })

    it('should show civilian impact circles with varying sizes', () => {
      // Civilian impact circles should exist
      cy.get('.leaflet-map-pane .civilian-impact-circle').should('exist')
      
      // Circles should have different sizes based on casualty numbers
      cy.get('.leaflet-map-pane .civilian-impact-circle').then(($circles) => {
        const radiuses = []
        $circles.each((index, circle) => {
          const radius = Cypress.$(circle).attr('r') || circle.style.radius
          radiuses.push(parseFloat(radius))
        })
        
        // Should have variation in sizes
        const uniqueRadiuses = [...new Set(radiuses)]
        expect(uniqueRadiuses.length).to.be.greaterThan(1)
      })
    })

    it('should show civilian casualty details on click', () => {
      // Click on civilian impact circle
      cy.get('.leaflet-map-pane .civilian-impact-circle').first().click()
      
      // Popup should show civilian impact details
      cy.get('.leaflet-popup').should('be.visible')
      cy.get('.leaflet-popup-content').should('contain.text', 'Civilian Impact')
      cy.get('.leaflet-popup-content').should('contain.text', 'Civilians:')
      cy.get('.leaflet-popup-content').should('contain.text', 'Children:')
    })
  })

  describe('Heatmap Visualization', () => {
    beforeEach(() => {
      // Enable heatmap
      cy.get('[data-cy="layer-toggle-heatmap"]').check()
    })

    it('should display heatmap overlay on map', () => {
      // Heatmap layer should be visible
      cy.get('.leaflet-map-pane .heatmap-layer').should('exist')
      
      // Should have heat intensity areas
      cy.get('.leaflet-map-pane .heatmap-layer canvas, .leaflet-map-pane .heatmap-layer svg').should('exist')
    })

    it('should update heatmap when filtering by year', () => {
      // Switch to timeline view and select a year
      cy.get('[data-cy="timeline-view-btn"]').click()
      cy.get('[data-cy="timeline-bar"][data-year="2010"]').click()
      
      // Heatmap should update to reflect 2010 data
      cy.get('.leaflet-map-pane .heatmap-layer').should('exist')
      
      // Select different year
      cy.get('[data-cy="timeline-bar"][data-year="2015"]').click()
      
      // Heatmap should update again
      cy.get('.leaflet-map-pane .heatmap-layer').should('exist')
    })
  })

  describe('Multiple Layer Interactions', () => {
    it('should display multiple layers simultaneously', () => {
      // Enable multiple layers
      cy.get('[data-cy="layer-toggle-strikes"]').check()
      cy.get('[data-cy="layer-toggle-civilian"]').check()
      cy.get('[data-cy="layer-toggle-heatmap"]').check()
      
      // All layers should be visible
      cy.get('.leaflet-map-pane .strike-marker').should('exist')
      cy.get('.leaflet-map-pane .civilian-impact-circle').should('exist')
      cy.get('.leaflet-map-pane .heatmap-layer').should('exist')
    })

    it('should maintain layer state when navigating regions', () => {
      // Enable layers
      cy.get('[data-cy="layer-toggle-strikes"]').check()
      cy.get('[data-cy="layer-toggle-civilian"]').check()
      
      // Navigate to a country
      cy.navigateToCountry('PAK')
      
      // Layers should still be enabled and visible
      cy.get('[data-cy="layer-toggle-strikes"]').should('be.checked')
      cy.get('[data-cy="layer-toggle-civilian"]').should('be.checked')
      cy.get('.leaflet-map-pane .strike-marker').should('exist')
      cy.get('.leaflet-map-pane .civilian-impact-circle').should('exist')
    })
  })

  describe('Performance and Data Loading', () => {
    it('should load strike visualization data efficiently', () => {
      // Monitor network requests when enabling layers
      cy.intercept('GET', '**/data/**').as('dataRequest')
      
      // Enable strike layer
      cy.get('[data-cy="layer-toggle-strikes"]').check()
      
      // Should not make additional data requests (data should already be loaded)
      cy.get('@dataRequest.all').should('have.length', 0)
      
      // Strike markers should appear quickly
      cy.get('.leaflet-map-pane .strike-marker').should('exist')
    })
  })
})