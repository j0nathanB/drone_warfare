describe('Drone Warfare Visualization - Data Loading & Error Handling', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should handle successful data loading gracefully', () => {
    // Loading overlay should appear
    cy.get('#loading-overlay').should('be.visible')
    
    // Wait for all data to load
    cy.waitForDataLoading()
    
    // Map should be functional
    cy.waitForMap()
    
    // Statistics should contain real data (not NaN or empty)
    cy.get('[data-cy="statistics-panel"]').within(() => {
      cy.get('[data-cy="total-strikes"]').should('not.contain', 'NaN')
      cy.get('[data-cy="total-strikes"]').should('not.be.empty')
      cy.get('[data-cy="total-killed"]').should('not.contain', 'NaN')
      cy.get('[data-cy="civilians-killed"]').should('not.contain', 'NaN')
    })
  })

  it('should handle network failures gracefully', () => {
    // Intercept network requests and simulate failure
    cy.intercept('GET', '/data/**/*.geojson', { forceNetworkError: true }).as('dataError')
    
    cy.visit('/')
    
    // Should still show map even if data fails
    cy.get('#map').should('be.visible')
    
    // Error state should be handled gracefully
    cy.get('body').should('not.contain', 'undefined')
    cy.get('body').should('not.contain', 'NaN')
    
    // Loading overlay should eventually disappear
    cy.get('#loading-overlay', { timeout: 15000 }).should('not.be.visible')
  })

  it('should handle malformed GeoJSON data', () => {
    // Intercept and return invalid JSON
    cy.intercept('GET', '/data/AFG_Adm_0-optimized.geojson', { body: '{ invalid json }' }).as('invalidJson')
    
    cy.visit('/')
    cy.waitForMap()
    
    // App should not crash and still display basic functionality
    cy.get('#map').should('be.visible')
    cy.get('[data-cy="statistics-panel"]').should('be.visible')
  })

  it('should handle partial data loading failures', () => {
    // Intercept one specific country data to fail
    cy.intercept('GET', '/data/AFG_Adm_1-optimized.geojson', { statusCode: 404 }).as('partialFailure')
    
    cy.visit('/')
    cy.waitForDataLoading()
    
    // Other countries should still load and work
    cy.get('#map').should('be.visible')
    cy.waitForMap()
    
    // Statistics should show data from successfully loaded countries
    cy.get('[data-cy="statistics-panel"]').within(() => {
      cy.get('[data-cy="total-strikes"]').should('not.be.empty')
    })
  })

  it('should validate data integrity after loading', () => {
    cy.waitForDataLoading()
    cy.waitForMap()
    
    // Check that loaded data makes sense
    cy.window().then((win) => {
      // Verify appState has been populated
      expect(win.appState).to.exist
      expect(win.appState.currentCountry).to.be.a('string')
      
      // Check that statistics are numbers, not NaN
      cy.get('[data-cy="total-strikes"]').invoke('text').then((text) => {
        const number = parseInt(text.replace(/,/g, ''))
        expect(number).to.be.a('number')
        expect(number).to.be.at.least(0)
        expect(isNaN(number)).to.be.false
      })
    })
  })

  it('should handle slow network conditions', () => {
    // Simulate slow network
    cy.intercept('GET', '/data/**/*.geojson', (req) => {
      req.reply((res) => {
        res.delay(3000) // 3 second delay
        res.send({ fixture: 'sample-geojson.json' })
      })
    }).as('slowNetwork')
    
    cy.visit('/')
    
    // Loading overlay should persist during slow loading
    cy.get('#loading-overlay').should('be.visible')
    
    // Map should still be visible immediately
    cy.get('#map').should('be.visible')
    
    // Eventually should complete loading (within timeout)
    cy.get('#loading-overlay', { timeout: 20000 }).should('not.be.visible')
  })

  it('should prevent negative values in statistics', () => {
    cy.waitForDataLoading()
    
    // All statistics should be non-negative
    cy.get('[data-cy="statistics-panel"]').within(() => {
      cy.get('[data-cy="total-strikes"]').invoke('text').then((text) => {
        const value = parseInt(text.replace(/,/g, ''))
        expect(value).to.be.at.least(0)
      })
      
      cy.get('[data-cy="total-killed"]').invoke('text').then((text) => {
        const value = parseInt(text.replace(/,/g, ''))
        expect(value).to.be.at.least(0)
      })
      
      cy.get('[data-cy="civilians-killed"]').invoke('text').then((text) => {
        const value = parseInt(text.replace(/,/g, ''))
        expect(value).to.be.at.least(0)
      })
    })
  })

  it('should handle rapid successive region changes', () => {
    cy.waitForDataLoading()
    cy.waitForMap()
    
    // Rapidly click different regions
    cy.get('.leaflet-interactive').then(($elements) => {
      if ($elements.length > 1) {
        cy.wrap($elements[0]).click({ force: true })
        cy.wait(100)
        cy.wrap($elements[1]).click({ force: true })
        cy.wait(100)
        if ($elements.length > 2) {
          cy.wrap($elements[2]).click({ force: true })
        }
      }
    })
    
    // App should remain stable
    cy.get('#map').should('be.visible')
    cy.get('[data-cy="statistics-panel"]').should('be.visible')
    
    // Final statistics should be valid
    cy.get('[data-cy="total-strikes"]').should('not.contain', 'NaN')
  })
})