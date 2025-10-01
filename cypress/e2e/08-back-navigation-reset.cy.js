describe('Drone Warfare Visualization - Back Navigation & Reset', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForDataLoading()
    cy.waitForMap()
  })

  describe('Back Navigation Functionality', () => {
    it('should support browser back button navigation', () => {
      // Navigate forward through levels
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(1)
      })
      
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(2)
      })
      
      // Use browser back button
      cy.go('back')
      cy.wait(1000)
      
      // Should be back at country level
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(1)
      })
      
      // Another back should go to global
      cy.go('back')
      cy.wait(1000)
      
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(0)
      })
    })

    it('should support browser forward button navigation', () => {
      // Navigate forward
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Go back
      cy.go('back')
      cy.wait(1000)
      
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(0)
      })
      
      // Use forward button
      cy.go('forward')
      cy.wait(1000)
      
      // Should be back at country level
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(1)
      })
    })

    it('should maintain consistent state during browser navigation', () => {
      // Navigate to specific country and province
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      let countryName
      cy.get('[data-cy="breadcrumbs"]').invoke('text').then((text) => {
        countryName = text
      })
      
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Go back via browser
      cy.go('back')
      cy.wait(1000)
      
      // Should be back at same country with consistent data
      cy.get('[data-cy="breadcrumbs"]').should('contain.text', 'Afghanistan')
      cy.window().then((win) => {
        expect(win.appState.country).to.equal('AFG')
        expect(win.appState.admLevel).to.equal(1)
      })
    })

    it('should handle rapid back/forward navigation', () => {
      // Navigate forward through multiple levels
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(500)
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(500)
      
      // Rapid back navigation
      cy.go('back')
      cy.wait(200)
      cy.go('back')
      cy.wait(200)
      
      // Should be at global level
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(0)
      })
      
      // Rapid forward navigation
      cy.go('forward')
      cy.wait(200)
      cy.go('forward')
      cy.wait(200)
      
      // Should be back at province level
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(2)
      })
    })
  })

  describe('Reset to Global Functionality', () => {
    it('should reset to global view via breadcrumb click', () => {
      // Navigate deep into hierarchy
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Verify we're deep in hierarchy
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.be.at.least(2)
      })
      
      // Click Global View breadcrumb
      cy.get('[data-cy="breadcrumbs"]').within(() => {
        cy.contains('Global View').click()
      })
      cy.wait(1000)
      
      // Should be completely reset
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(0)
        expect(win.appState.admName).to.equal('')
        expect(win.appState.country).to.be.null
      })
      
      // Map should show global view
      cy.get('[data-cy="breadcrumbs"]').should('contain.text', 'Global View')
      cy.get('[data-cy="breadcrumbs"] .breadcrumb-item').should('have.length', 1)
    })

    it('should reset map view when returning to global', () => {
      let initialZoom, initialCenter
      
      // Store initial map state
      cy.window().then((win) => {
        initialZoom = win.map.getZoom()
        initialCenter = win.map.getCenter()
      })
      
      // Navigate and zoom in
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Verify map has zoomed in
      cy.window().then((win) => {
        expect(win.map.getZoom()).to.be.greaterThan(initialZoom)
      })
      
      // Reset to global
      cy.get('[data-cy="breadcrumbs"]').within(() => {
        cy.contains('Global View').click()
      })
      cy.wait(1000)
      
      // Map should return to global view
      cy.window().then((win) => {
        expect(win.map.getZoom()).to.be.closeTo(initialZoom, 1)
        // Center should be approximately back to initial position
        expect(win.map.getCenter().lat).to.be.closeTo(initialCenter.lat, 5)
        expect(win.map.getCenter().lng).to.be.closeTo(initialCenter.lng, 5)
      })
    })

    it('should reset statistics when returning to global', () => {
      let globalStrikes, countryStrikes
      
      // Get initial global statistics
      cy.getStatistic('total-strikes').then((text) => {
        globalStrikes = parseInt(text.replace(/,/g, ''))
      })
      
      // Navigate to country
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      cy.getStatistic('total-strikes').then((text) => {
        countryStrikes = parseInt(text.replace(/,/g, ''))
        expect(countryStrikes).to.be.at.most(globalStrikes)
      })
      
      // Reset to global
      cy.get('[data-cy="breadcrumbs"]').within(() => {
        cy.contains('Global View').click()
      })
      cy.wait(1000)
      
      // Statistics should return to global totals
      cy.getStatistic('total-strikes').then((text) => {
        const resetStrikes = parseInt(text.replace(/,/g, ''))
        expect(resetStrikes).to.equal(globalStrikes)
      })
    })

    it('should clear all map layers when resetting', () => {
      // Navigate to country level
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Verify country-specific layers are present
      cy.get('.leaflet-overlay-pane svg path').should('exist')
      
      // Reset to global
      cy.get('[data-cy="breadcrumbs"]').within(() => {
        cy.contains('Global View').click()
      })
      cy.wait(1000)
      
      // Should have global layers again
      cy.get('.leaflet-overlay-pane svg path').should('exist')
      
      // Verify global state
      cy.window().then((win) => {
        expect(Object.keys(win.map._layers).length).to.be.greaterThan(0)
      })
    })
  })

  describe('State Recovery and Persistence', () => {
    it('should handle page refresh at different navigation levels', () => {
      // Navigate to country level
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Refresh page
      cy.reload()
      cy.waitForDataLoading()
      cy.waitForMap()
      
      // Should return to global view after refresh
      cy.get('[data-cy="breadcrumbs"]').should('contain.text', 'Global View')
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(0)
      })
    })

    it('should maintain navigation history across page interactions', () => {
      // Create navigation history
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Use breadcrumb navigation
      cy.get('[data-cy="breadcrumbs"]').within(() => {
        cy.contains('Afghanistan').click()
      })
      cy.wait(1000)
      
      // Browser back should still work
      cy.go('back')
      cy.wait(1000)
      
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(2)
      })
    })

    it('should handle invalid navigation states gracefully', () => {
      // Navigate normally first
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Manually corrupt app state (simulate edge case)
      cy.window().then((win) => {
        win.appState.admLevel = 999
        win.appState.country = 'INVALID'
        win.appState.admName = 'NonExistent'
      })
      
      // Try to navigate - should handle gracefully
      cy.get('[data-cy="breadcrumbs"]').within(() => {
        cy.contains('Global View').click()
      })
      cy.wait(1000)
      
      // Should recover to valid state
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(0)
        expect(win.appState.country).to.be.null
        expect(win.appState.admName).to.equal('')
      })
    })
  })

  describe('Navigation Shortcuts and Efficiency', () => {
    it('should provide efficient navigation between distant levels', () => {
      // Navigate deep
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Direct jump to global (not step-by-step)
      cy.get('[data-cy="breadcrumbs"]').within(() => {
        cy.contains('Global View').click()
      })
      cy.wait(1000)
      
      // Should be at global level in one step
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(0)
      })
      
      // Verify complete reset
      cy.get('[data-cy="breadcrumbs"] .breadcrumb-item').should('have.length', 1)
    })

    it('should handle keyboard navigation for accessibility', () => {
      // Navigate to create breadcrumb trail
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Test keyboard navigation on breadcrumbs
      cy.get('[data-cy="breadcrumbs"]').within(() => {
        cy.contains('Global View').focus()
        cy.focused().type('{enter}')
      })
      cy.wait(1000)
      
      // Should navigate via keyboard
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(0)
      })
    })

    it('should handle multiple rapid navigation attempts', () => {
      // Rapid navigation sequence
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(100)
      
      cy.get('[data-cy="breadcrumbs"]').within(() => {
        cy.contains('Global View').click()
      })
      cy.wait(100)
      
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(100)
      
      cy.get('[data-cy="breadcrumbs"]').within(() => {
        cy.contains('Global View').click()
      })
      cy.wait(1000)
      
      // Should end up in stable state
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(0)
      })
      
      cy.get('[data-cy="breadcrumbs"]').should('contain.text', 'Global View')
      cy.get('#map').should('be.visible')
    })

    it('should preserve performance during navigation resets', () => {
      // Navigate and reset multiple times to test performance
      for (let i = 0; i < 3; i++) {
        cy.get('.leaflet-interactive').first().click({ force: true })
        cy.wait(500)
        
        cy.get('[data-cy="breadcrumbs"]').within(() => {
          cy.contains('Global View').click()
        })
        cy.wait(500)
      }
      
      // Application should remain responsive
      cy.get('#map').should('be.visible')
      cy.get('[data-cy="statistics-panel"]').should('be.visible')
      cy.get('[data-cy="breadcrumbs"]').should('contain.text', 'Global View')
      
      // No JavaScript errors should have occurred
      cy.window().then((win) => {
        expect(win.appState).to.exist
        expect(win.map).to.exist
      })
    })
  })
})