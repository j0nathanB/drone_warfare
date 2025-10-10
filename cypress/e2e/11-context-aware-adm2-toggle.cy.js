/**
 * Context-Aware ADM2 Boundary Toggle Tests
 * Tests that ADM2 checkbox toggles boundaries based on current breadcrumb context
 */

describe('Context-Aware ADM2 Boundary Toggle', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForMap()
  })

  describe('Global Level ADM2 Toggle', () => {
    it('should toggle ADM2 for ALL countries when at global level', () => {
      // Verify we're at global level
      cy.get('[data-cy="breadcrumb-global"]').should('exist')
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(0)
      })

      // Open layers dropdown and enable ADM2
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-boundary-adm2').click()

      // Verify all countries have ADM2 enabled
      cy.window().then((win) => {
        const countryAdm2 = win.appState.map.countryAdm2Visibility
        expect(countryAdm2.AFG).to.be.true
        expect(countryAdm2.PAK).to.be.true
        expect(countryAdm2.SOM).to.be.true
        expect(countryAdm2.YEM).to.be.true
        expect(win.appState.map.boundaryLayers.adm2.visible).to.be.true
      })
    })

    it('should maintain ADM2 visibility when navigating to Afghanistan', () => {
      // Enable ADM2 at global level
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-boundary-adm2').click()
      cy.wait(200)

      // Navigate to Afghanistan (dropdown will auto-close on map interaction)
      cy.navigateToCountry('AFG')
      cy.wait(500)

      // Verify ADM2 is still enabled for Afghanistan
      cy.window().then((win) => {
        expect(win.appState.map.countryAdm2Visibility.AFG).to.be.true
      })
    })

    it('should maintain ADM2 visibility when navigating to Yemen', () => {
      // Enable ADM2 at global level
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-boundary-adm2').click()
      cy.wait(200)

      // Navigate to Yemen (dropdown will auto-close)
      cy.navigateToCountry('YEM')
      cy.wait(500)

      // Verify ADM2 is enabled for Yemen
      cy.window().then((win) => {
        expect(win.appState.map.countryAdm2Visibility.YEM).to.be.true
      })
    })
  })

  describe('Country-Specific ADM2 Toggle', () => {
    it('should toggle ADM2 ONLY for current country when at country level', () => {
      // Navigate to Yemen first
      cy.navigateToCountry('YEM')
      cy.wait(500)

      // Verify we're at Yemen
      cy.window().then((win) => {
        expect(win.appState.country).to.equal('YEM')
        expect(win.appState.admLevel).to.equal(1)
      })

      // Enable ADM2 while in Yemen
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-boundary-adm2').click()
      cy.wait(200)

      // Verify only Yemen has ADM2 enabled
      cy.window().then((win) => {
        const countryAdm2 = win.appState.map.countryAdm2Visibility
        expect(countryAdm2.YEM).to.be.true
        expect(countryAdm2.AFG).to.be.false
        expect(countryAdm2.PAK).to.be.false
        expect(countryAdm2.SOM).to.be.false
      })
    })

    it('should not affect other countries when toggling in Pakistan', () => {
      // Navigate to Pakistan
      cy.navigateToCountry('PAK')
      cy.wait(500)

      // Enable ADM2 in Pakistan
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-boundary-adm2').click()
      cy.wait(200)

      // Verify only Pakistan has ADM2 enabled
      cy.window().then((win) => {
        const countryAdm2 = win.appState.map.countryAdm2Visibility
        expect(countryAdm2.PAK).to.be.true
        expect(countryAdm2.AFG).to.be.false
        expect(countryAdm2.YEM).to.be.false
        expect(countryAdm2.SOM).to.be.false
      })
    })

    it('should disable ADM2 for current country when toggled off', () => {
      // Navigate to Somalia
      cy.navigateToCountry('SOM')
      cy.wait(500)

      // Enable ADM2
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-boundary-adm2').click()
      cy.wait(200)

      // Verify enabled
      cy.window().then((win) => {
        expect(win.appState.map.countryAdm2Visibility.SOM).to.be.true
      })

      // Disable ADM2
      cy.get('#header-boundary-adm2').click()
      cy.wait(200)

      // Verify disabled
      cy.window().then((win) => {
        expect(win.appState.map.countryAdm2Visibility.SOM).to.be.false
      })
    })
  })

  describe('Mixed Context ADM2 Toggling', () => {
    it('should allow different ADM2 states for different countries', () => {
      // Enable ADM2 for Yemen
      cy.navigateToCountry('YEM')
      cy.wait(500)
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-boundary-adm2').click()
      cy.wait(200)

      // Go back to global
      cy.get('[data-cy="breadcrumb-global"]').click()
      cy.wait(500)

      // Enable ADM2 for Afghanistan
      cy.navigateToCountry('AFG')
      cy.wait(500)

      // Open dropdown (it might have closed)
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.wait(100)

      // Check if checkbox is already checked, if not, check it
      cy.get('#header-boundary-adm2').then($checkbox => {
        if (!$checkbox.is(':checked')) {
          cy.get('#header-boundary-adm2').click()
        }
      })
      cy.wait(200)

      // Verify both countries have ADM2 enabled
      cy.window().then((win) => {
        const countryAdm2 = win.appState.map.countryAdm2Visibility
        expect(countryAdm2.YEM).to.be.true
        expect(countryAdm2.AFG).to.be.true
        expect(countryAdm2.PAK).to.be.false
        expect(countryAdm2.SOM).to.be.false
      })
    })

    it('should update global ADM2 visibility when any country has it enabled', () => {
      // Navigate to Yemen and enable ADM2
      cy.navigateToCountry('YEM')
      cy.wait(500)
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-boundary-adm2').click()
      cy.wait(200)

      // Global ADM2 should be true since at least one country has it
      cy.window().then((win) => {
        expect(win.appState.map.boundaryLayers.adm2.visible).to.be.true
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid toggling', () => {
      cy.get('[data-cy="data-layers-btn"]').click()

      // Rapidly toggle 5 times
      for (let i = 0; i < 5; i++) {
        cy.get('#header-boundary-adm2').click()
        cy.wait(50)
      }

      // Should end in checked state
      cy.get('#header-boundary-adm2').should('be.checked')

      cy.window().then((win) => {
        expect(win.appState.map.boundaryLayers.adm2.visible).to.be.true
      })
    })

    it('should not affect other boundary layers', () => {
      cy.get('[data-cy="data-layers-btn"]').click()

      // Record initial states
      cy.get('#header-boundary-country').should('be.checked')
      cy.get('#header-boundary-adm1').should('be.checked')

      // Toggle ADM2
      cy.get('#header-boundary-adm2').click()

      // Other layers should be unchanged
      cy.get('#header-boundary-country').should('be.checked')
      cy.get('#header-boundary-adm1').should('be.checked')
      cy.get('#header-boundary-adm2').should('be.checked')
    })

    it('should maintain checkbox state in UI when navigating', () => {
      // Enable ADM2 globally
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-boundary-adm2').click()
      cy.wait(200)

      // Navigate to a country (dropdown will auto-close)
      cy.navigateToCountry('PAK')
      cy.wait(500)

      // Open dropdown and check checkbox state
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-boundary-adm2').should('be.checked')
    })
  })
})
