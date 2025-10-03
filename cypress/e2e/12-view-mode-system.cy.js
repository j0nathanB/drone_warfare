describe('View Mode System', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForMap()
  })

  describe('View Mode Buttons', () => {
    it('should have all view mode buttons available', () => {
      // All view mode buttons should exist
      cy.get('[data-cy="map-view-btn"]').should('exist').should('contain.text', 'Map')
      cy.get('[data-cy="timeline-view-btn"]').should('exist').should('contain.text', 'Timeline')
      cy.get('[data-cy="compare-view-btn"]').should('exist').should('contain.text', 'Compare')
      cy.get('[data-cy="stories-view-btn"]').should('exist').should('contain.text', 'Stories')
      
      // Map view should be active by default
      cy.get('[data-cy="map-view-btn"]').should('have.class', 'active')
      cy.get('[data-cy="timeline-view-btn"]').should('not.have.class', 'active')
      cy.get('[data-cy="compare-view-btn"]').should('not.have.class', 'active')
      cy.get('[data-cy="stories-view-btn"]').should('not.have.class', 'active')
    })

    it('should switch active states when clicking different view modes', () => {
      // Switch to timeline view
      cy.get('[data-cy="timeline-view-btn"]').click()
      cy.get('[data-cy="timeline-view-btn"]').should('have.class', 'active')
      cy.get('[data-cy="map-view-btn"]').should('not.have.class', 'active')
      
      // Switch to compare view
      cy.get('[data-cy="compare-view-btn"]').click()
      cy.get('[data-cy="compare-view-btn"]').should('have.class', 'active')
      cy.get('[data-cy="timeline-view-btn"]').should('not.have.class', 'active')
      
      // Switch back to map view
      cy.get('[data-cy="map-view-btn"]').click()
      cy.get('[data-cy="map-view-btn"]').should('have.class', 'active')
      cy.get('[data-cy="compare-view-btn"]').should('not.have.class', 'active')
    })
  })

  describe('Map View Mode', () => {
    it('should show map interface in map view', () => {
      // Ensure we're in map view
      cy.get('[data-cy="map-view-btn"]').click()
      
      // Map should be visible
      cy.get('#map').should('be.visible')
      
      // Timeline container should be hidden
      cy.get('[data-cy="timeline-container"]').should('not.be.visible')
      
      // Comparison panel should be hidden
      cy.get('[data-cy="comparison-panel"]').should('not.be.visible')
      
      // Stories panel should be hidden
      cy.get('[data-cy="stories-panel"]').should('not.be.visible')
    })

    it('should maintain map interactions in map view', () => {
      cy.get('[data-cy="map-view-btn"]').click()
      
      // Should be able to navigate countries
      cy.navigateToCountry('AFG')
      cy.verifyAppState('country', 'AFG')
      
      // Layer controls should work
      cy.get('[data-cy="layer-controls"]').should('be.visible')
    })
  })

  describe('Timeline View Mode', () => {
    it('should show timeline interface when switched to timeline view', () => {
      // Switch to timeline view
      cy.get('[data-cy="timeline-view-btn"]').click()
      
      // Timeline container should be visible
      cy.get('[data-cy="timeline-container"]').should('be.visible')
      
      // Timeline components should be present
      cy.get('[data-cy="timeline-bars"]').should('be.visible')
      cy.get('[data-cy="play-btn"]').should('be.visible')
      cy.get('[data-cy="timeline-controls"]').should('be.visible')
      
      // Map should still be visible but timeline should overlay or be prominent
      cy.get('#map').should('be.visible')
    })

    it('should hide other view components in timeline view', () => {
      cy.get('[data-cy="timeline-view-btn"]').click()
      
      // Other view components should be hidden
      cy.get('[data-cy="comparison-panel"]').should('not.be.visible')
      cy.get('[data-cy="stories-panel"]').should('not.be.visible')
    })
  })

  describe('Compare View Mode', () => {
    it('should show comparison interface when switched to compare view', () => {
      // Switch to compare view
      cy.get('[data-cy="compare-view-btn"]').click()
      
      // Comparison panel should be visible
      cy.get('[data-cy="comparison-panel"]').should('be.visible')
      
      // Should have country selection dropdowns
      cy.get('[data-cy="compare-country-1"]').should('be.visible')
      cy.get('[data-cy="compare-country-2"]').should('be.visible')
      
      // Should have comparison statistics table
      cy.get('[data-cy="comparison-stats"]').should('be.visible')
    })

    it('should allow selecting countries for comparison', () => {
      cy.get('[data-cy="compare-view-btn"]').click()
      
      // Select first country
      cy.get('[data-cy="compare-country-1"]').select('AFG')
      cy.get('[data-cy="compare-country-1"]').should('have.value', 'AFG')
      
      // Select second country
      cy.get('[data-cy="compare-country-2"]').select('PAK')
      cy.get('[data-cy="compare-country-2"]').should('have.value', 'PAK')
      
      // Comparison should show data for both countries
      cy.get('[data-cy="comparison-stats"]').should('contain.text', 'Afghanistan')
      cy.get('[data-cy="comparison-stats"]').should('contain.text', 'Pakistan')
    })

    it('should update comparison when countries are changed', () => {
      cy.get('[data-cy="compare-view-btn"]').click()
      
      // Select initial countries
      cy.get('[data-cy="compare-country-1"]').select('SOM')
      cy.get('[data-cy="compare-country-2"]').select('YEM')
      
      // Get initial comparison data
      cy.get('[data-cy="comparison-stats"]').within(() => {
        cy.get('[data-cy="country-1-strikes"]').invoke('text').as('initialStrikes1')
        cy.get('[data-cy="country-2-strikes"]').invoke('text').as('initialStrikes2')
      })
      
      // Change first country
      cy.get('[data-cy="compare-country-1"]').select('AFG')
      
      // Comparison should update
      cy.get('[data-cy="comparison-stats"]').within(() => {
        cy.get('[data-cy="country-1-strikes"]').invoke('text').should('not.equal', this.initialStrikes1)
      })
    })

    it('should hide other view components in compare view', () => {
      cy.get('[data-cy="compare-view-btn"]').click()
      
      // Other view components should be hidden
      cy.get('[data-cy="timeline-container"]').should('not.be.visible')
      cy.get('[data-cy="stories-panel"]').should('not.be.visible')
    })
  })

  describe('Stories View Mode', () => {
    it('should show stories interface when switched to stories view', () => {
      // Switch to stories view
      cy.get('[data-cy="stories-view-btn"]').click()
      
      // Stories panel should be visible
      cy.get('[data-cy="stories-panel"]').should('be.visible')
      
      // Should have story navigation
      cy.get('[data-cy="story-navigation"]').should('be.visible')
      
      // Should have story content area
      cy.get('[data-cy="story-content"]').should('be.visible')
    })

    it('should display individual strike stories', () => {
      cy.get('[data-cy="stories-view-btn"]').click()
      
      // Should have story items
      cy.get('[data-cy="story-item"]').should('exist')
      cy.get('[data-cy="story-item"]').should('have.length.greaterThan', 0)
      
      // Each story should have basic information
      cy.get('[data-cy="story-item"]').first().within(() => {
        cy.get('[data-cy="story-date"]').should('exist')
        cy.get('[data-cy="story-location"]').should('exist')
        cy.get('[data-cy="story-casualties"]').should('exist')
      })
    })

    it('should allow navigation between stories', () => {
      cy.get('[data-cy="stories-view-btn"]').click()
      
      // Click on a story
      cy.get('[data-cy="story-item"]').first().click()
      
      // Story should be selected/highlighted
      cy.get('[data-cy="story-item"]').first().should('have.class', 'selected')
      
      // Story details should be displayed
      cy.get('[data-cy="story-details"]').should('be.visible')
      cy.get('[data-cy="story-details"]').should('contain.text', 'Strike Details')
    })

    it('should hide other view components in stories view', () => {
      cy.get('[data-cy="stories-view-btn"]').click()
      
      // Other view components should be hidden
      cy.get('[data-cy="timeline-container"]').should('not.be.visible')
      cy.get('[data-cy="comparison-panel"]').should('not.be.visible')
    })
  })

  describe('View Mode Transitions', () => {
    it('should show loading indicator during view mode transitions', () => {
      // Switch to timeline view
      cy.get('[data-cy="timeline-view-btn"]').click()
      
      // Loading indicator should briefly appear
      cy.get('[data-cy="view-mode-loader"]').should('exist')
      
      // Then timeline should be visible
      cy.get('[data-cy="timeline-container"]').should('be.visible')
    })

    it('should maintain data state across view mode switches', () => {
      // Navigate to a specific country in map view
      cy.navigateToCountry('PAK')
      cy.verifyAppState('country', 'PAK')
      
      // Get current statistics
      cy.get('[data-cy="total-strikes"]').invoke('text').as('mapViewStrikes')
      
      // Switch to timeline view
      cy.get('[data-cy="timeline-view-btn"]').click()
      
      // Should maintain the same country context
      cy.get('[data-cy="total-strikes"]').should(($el) => {
        expect($el.text()).to.equal(this.mapViewStrikes)
      })
      
      // Switch to compare view
      cy.get('[data-cy="compare-view-btn"]').click()
      
      // Data should still be consistent
      cy.get('[data-cy="compare-country-1"]').select('PAK')
      cy.get('[data-cy="comparison-stats"] [data-cy="country-1-strikes"]').should(($el) => {
        expect($el.text()).to.equal(this.mapViewStrikes)
      })
    })

    it('should preserve user interactions when switching view modes', () => {
      // Enable some layers in map view
      cy.get('[data-cy="layer-toggle-strikes"]').check()
      cy.get('[data-cy="layer-toggle-heatmap"]').check()
      
      // Switch to timeline view
      cy.get('[data-cy="timeline-view-btn"]').click()
      
      // Switch back to map view
      cy.get('[data-cy="map-view-btn"]').click()
      
      // Layer toggles should still be enabled
      cy.get('[data-cy="layer-toggle-strikes"]').should('be.checked')
      cy.get('[data-cy="layer-toggle-heatmap"]').should('be.checked')
    })
  })

  describe('Responsive View Mode Behavior', () => {
    it('should adapt view modes for mobile screens', () => {
      // Set mobile viewport
      cy.viewport(375, 667)
      
      // View mode buttons should be accessible
      cy.get('[data-cy="map-view-btn"]').should('be.visible')
      cy.get('[data-cy="timeline-view-btn"]').should('be.visible')
      
      // Switch to timeline view on mobile
      cy.get('[data-cy="timeline-view-btn"]').click()
      
      // Timeline should be optimized for mobile
      cy.get('[data-cy="timeline-container"]').should('be.visible')
      cy.get('[data-cy="timeline-container"]').should('have.css', 'position', 'relative')
    })

    it('should handle view mode switches on tablet screens', () => {
      // Set tablet viewport
      cy.viewport(768, 1024)
      
      // All view modes should work on tablet
      cy.get('[data-cy="compare-view-btn"]').click()
      cy.get('[data-cy="comparison-panel"]').should('be.visible')
      
      cy.get('[data-cy="stories-view-btn"]').click()
      cy.get('[data-cy="stories-panel"]').should('be.visible')
    })
  })
})