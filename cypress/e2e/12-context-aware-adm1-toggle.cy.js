describe('Context-Aware ADM1 Boundary Toggle', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForMap()
  })

  describe('Global Level (admLevel = 0)', () => {
    it('should show ADM1 boundaries for ALL countries when toggled on at global level', () => {
      // Verify we're at global level
      cy.verifyAppState({ admLevel: 0, country: null })

      // Ensure ADM1 checkbox is checked by default
      cy.get('#header-boundary-adm1').should('be.checked')

      // Verify ADM1 boundaries are visible for all countries (AFG, PAK, SOM, YEM)
      cy.window().then((win) => {
        const map = win.appState.map

        // Check that ADM1 boundaries are visible globally
        expect(map.boundaryLayers.adm1.visible).to.be.true

        // Verify all countries have ADM1 boundaries visible
        expect(map.countryAdm1Visibility.AFG).to.be.true
        expect(map.countryAdm1Visibility.PAK).to.be.true
        expect(map.countryAdm1Visibility.SOM).to.be.true
        expect(map.countryAdm1Visibility.YEM).to.be.true
      })
    })

    it('should hide ADM1 boundaries for ALL countries when toggled off at global level', () => {
      // Verify we're at global level
      cy.verifyAppState({ admLevel: 0, country: null })

      // Open data layers dropdown
      cy.get('[data-cy="data-layers-btn"]').click()

      // Toggle ADM1 checkbox off
      cy.get('#header-boundary-adm1').uncheck()

      // Verify ADM1 boundaries are hidden globally
      cy.window().then((win) => {
        const map = win.appState.map

        expect(map.boundaryLayers.adm1.visible).to.be.false
        expect(map.countryAdm1Visibility.AFG).to.be.false
        expect(map.countryAdm1Visibility.PAK).to.be.false
        expect(map.countryAdm1Visibility.SOM).to.be.false
        expect(map.countryAdm1Visibility.YEM).to.be.false
      })
    })

    it('should re-enable ADM1 boundaries for ALL countries when toggled back on', () => {
      // Toggle off then on
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-boundary-adm1').uncheck()
      cy.get('#header-boundary-adm1').check()

      // Verify all countries have ADM1 visible again
      cy.window().then((win) => {
        const map = win.appState.map

        expect(map.boundaryLayers.adm1.visible).to.be.true
        expect(map.countryAdm1Visibility.AFG).to.be.true
        expect(map.countryAdm1Visibility.PAK).to.be.true
        expect(map.countryAdm1Visibility.SOM).to.be.true
        expect(map.countryAdm1Visibility.YEM).to.be.true
      })
    })
  })

  describe('Country Level (admLevel = 1)', () => {
    it('should show ONLY current country ADM1 boundaries when toggled on at country level', () => {
      // Navigate to Afghanistan
      cy.navigateToCountry('AFG')
      cy.wait(500)

      cy.verifyAppState({ admLevel: 1, country: 'AFG' })

      // Verify visibility state first
      cy.window().then((win) => {
        const map = win.appState.map

        expect(map.countryAdm1Visibility.AFG).to.be.true
        expect(map.countryAdm1Visibility.PAK).to.be.true
        expect(map.countryAdm1Visibility.SOM).to.be.true
        expect(map.countryAdm1Visibility.YEM).to.be.true
      })

      // Now check the UI checkbox
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-boundary-adm1').should('be.checked')
    })

    it('should hide ONLY current country ADM1 boundaries when toggled off at country level', () => {
      // Navigate to Afghanistan
      cy.navigateToCountry('AFG')
      cy.wait(500)

      cy.verifyAppState({ admLevel: 1, country: 'AFG' })

      // Open data layers dropdown and toggle off
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-boundary-adm1').uncheck()

      // Verify only AFG ADM1 is hidden, others should remain from global state
      cy.window().then((win) => {
        const map = win.appState.map

        expect(map.countryAdm1Visibility.AFG).to.be.false
        // Other countries should still be true from global default
        expect(map.countryAdm1Visibility.PAK).to.be.true
        expect(map.countryAdm1Visibility.SOM).to.be.true
        expect(map.countryAdm1Visibility.YEM).to.be.true
      })
    })

    it('should re-enable ONLY current country ADM1 boundaries when toggled back on', () => {
      // Navigate to Afghanistan
      cy.navigateToCountry('AFG')
      cy.wait(500)

      cy.verifyAppState({ admLevel: 1, country: 'AFG' })

      // Toggle off then on
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-boundary-adm1').uncheck()
      cy.get('#header-boundary-adm1').check()

      // Verify only AFG has ADM1 toggled back on
      cy.window().then((win) => {
        const map = win.appState.map

        expect(map.countryAdm1Visibility.AFG).to.be.true
        expect(map.countryAdm1Visibility.PAK).to.be.true
        expect(map.countryAdm1Visibility.SOM).to.be.true
        expect(map.countryAdm1Visibility.YEM).to.be.true
      })
    })
  })

  describe('Cross-Country Navigation', () => {
    it('should maintain separate ADM1 visibility per country when navigating', () => {
      // Start at global, navigate to AFG
      cy.navigateToCountry('AFG')
      cy.wait(500)

      cy.verifyAppState({ admLevel: 1, country: 'AFG' })

      // Toggle AFG ADM1 off
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-boundary-adm1').uncheck()
      cy.get('[data-cy="data-layers-btn"]').click() // close dropdown

      // Navigate back to global
      cy.get('[data-cy="breadcrumb-global"]').click()
      cy.wait(500)

      cy.verifyAppState({ admLevel: 0, country: null })

      // Navigate to Pakistan
      cy.navigateToCountry('PAK')
      cy.wait(500)

      cy.verifyAppState({ admLevel: 1, country: 'PAK' })

      // Pakistan should still have visibility from global state
      cy.window().then((win) => {
        const map = win.appState.map

        // AFG state should be preserved as off
        expect(map.countryAdm1Visibility.AFG).to.be.false

        // PAK should still be on from initial global state
        expect(map.countryAdm1Visibility.PAK).to.be.true
      })
    })

    it('should handle global toggle affecting all countries then country-specific toggle', () => {
      // At global level, ADM1 is already on by default (checked)
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-boundary-adm1').should('be.checked')
      cy.get('[data-cy="data-layers-btn"]').click() // close dropdown

      // Navigate to AFG
      cy.navigateToCountry('AFG')
      cy.wait(500)

      cy.verifyAppState({ admLevel: 1, country: 'AFG' })

      // Toggle off AFG-specific ADM1
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-boundary-adm1').uncheck()

      // Only AFG should be off, others should still be on from global default
      cy.window().then((win) => {
        const map = win.appState.map

        expect(map.countryAdm1Visibility.AFG).to.be.false
        expect(map.countryAdm1Visibility.PAK).to.be.true
        expect(map.countryAdm1Visibility.SOM).to.be.true
        expect(map.countryAdm1Visibility.YEM).to.be.true
      })
    })
  })

  describe('Checkbox State Synchronization', () => {
    it('should update checkbox state based on current context', () => {
      // At global, ADM1 is checked
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-boundary-adm1').should('be.checked')
      cy.get('[data-cy="data-layers-btn"]').click() // close dropdown

      // Navigate to AFG
      cy.navigateToCountry('AFG')
      cy.wait(500)

      cy.verifyAppState({ admLevel: 1, country: 'AFG' })

      // Checkbox should still reflect AFG's visibility (which should be true from global)
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-boundary-adm1').should('be.checked')

      // Toggle off at AFG level
      cy.get('#header-boundary-adm1').uncheck()
      cy.get('[data-cy="data-layers-btn"]').click() // close dropdown

      // Navigate to PAK
      cy.get('[data-cy="breadcrumb-global"]').click()
      cy.wait(500)

      cy.verifyAppState({ admLevel: 0, country: null })

      cy.navigateToCountry('PAK')
      cy.wait(500)

      cy.verifyAppState({ admLevel: 1, country: 'PAK' })

      // Checkbox should reflect PAK's visibility (still true from global)
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-boundary-adm1').should('be.checked')
    })
  })
})
