// Custom commands for drone warfare visualization testing

// Wait for map to be initialized
Cypress.Commands.add('waitForMap', () => {
  cy.get('#map').should('be.visible')
  cy.window().its('map').should('exist')
})

// Wait for loading to complete
Cypress.Commands.add('waitForDataLoading', () => {
  cy.get('.loading-overlay').should('not.be.visible')
})

// Wait for Leaflet map to be ready
Cypress.Commands.add('waitForLeaflet', () => {
  cy.window().its('L').should('exist')
  cy.window().then((win) => {
    return new Cypress.Promise((resolve) => {
      if (win.map && win.map._loaded) {
        resolve()
      } else {
        win.addEventListener('mapready', resolve)
      }
    })
  })
})

// Get statistics panel values
Cypress.Commands.add('getStatistic', (statName) => {
  return cy.get('[data-cy="statistics-panel"]').within(() => {
    cy.get(`[data-cy="${statName}"]`).invoke('text')
  })
})

// Tab navigation support
Cypress.Commands.add('tab', { prevSubject: 'optional' }, (subject) => {
  cy.wrap(subject).trigger('keydown', { keyCode: 9, which: 9, key: 'Tab' })
})

// Navigate to specific country by name (using custom dropdown navigation)
Cypress.Commands.add('navigateToCountry', (countryName) => {
  // Map country names to codes
  const countryCodeMap = {
    'Afghanistan': 'AFG',
    'Pakistan': 'PAK',
    'Somalia': 'SOM',
    'Yemen': 'YEM'
  }

  const expectedCode = countryCodeMap[countryName] || countryName

  // Click the custom dropdown trigger to open menu
  cy.get('[data-cy="nav-dropdown-country"]').click()

  // Click the option from the dropdown menu
  cy.get('[data-cy="dropdown-menu-country"]')
    .should('be.visible')
    .contains('.dropdown-option', countryName)
    .click()

  cy.wait(500) // Wait for the navigation to complete

  // Verify navigation occurred
  cy.window().its('appState.admLevel').should('eq', 1)
  cy.window().its('appState.country').should('eq', expectedCode)
})

// Navigate through administrative hierarchy
Cypress.Commands.add('navigateToLevel', (targetLevel) => {
  cy.window().then((win) => {
    const currentLevel = win.appState.admLevel
    
    for (let i = currentLevel; i < targetLevel; i++) {
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
    }
  })
})

// Verify app state matches expected values
Cypress.Commands.add('verifyAppState', (expectedState) => {
  cy.window().then((win) => {
    if (expectedState.admLevel !== undefined) {
      expect(win.appState.admLevel).to.equal(expectedState.admLevel)
    }
    if (expectedState.country !== undefined) {
      expect(win.appState.country).to.equal(expectedState.country)
    }
    if (expectedState.admName !== undefined) {
      expect(win.appState.admName).to.equal(expectedState.admName)
    }
  })
})

// Check mobile viewport
Cypress.Commands.add('checkMobileViewport', () => {
  cy.viewport('iphone-x')
  cy.wait(1000) // Allow for responsive layout adjustments
})