/**
 * Dropdown Breadcrumb Country Inference Tests
 *
 * Tests that clicking an ADM1 breadcrumb properly infers and sets the country dropdown,
 * then updates the ADM1 dropdown to show only that country's provinces.
 *
 * USER ISSUE: "Selecting Adm1 from the breadcrumbs does not update the country or the Adm1 menu
 * if the country hasn't been selected. The ideal flow would be something like select Adm1,
 * update country, update Adm1 menu to reflect the Adm1's of that country."
 */

describe('Dropdown Country Inference from Breadcrumb Navigation', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForMap()
  })

  it('should infer and set country dropdown when clicking ADM1 breadcrumb', () => {
    // Navigate to Pakistan via map click (simulates user clicking on map)
    cy.navigateToCountry('Pakistan')
    cy.wait(500)

    // Navigate to an ADM1 (province) by clicking first row in table
    cy.get('[data-cy="data-table-body"]').find('tr').first().click()
    cy.wait(1000)

    // Verify we have breadcrumbs (country and ADM1)
    cy.get('[data-cy="breadcrumb-country"]').should('exist')
    cy.get('[data-cy="breadcrumb-region"]').should('exist')

    // Get current state before clicking breadcrumb
    cy.get('[data-cy="breadcrumb-region"] span').invoke('text').then(adm1Name => {
      console.log('ADM1 name:', adm1Name)

      // PROBLEM: Click the ADM1 breadcrumb
      cy.get('[data-cy="breadcrumb-region"]').click()
      cy.wait(500)

      // EXPECTATION: Country dropdown should be set to Pakistan
      cy.get('[data-cy="nav-dropdown-country"]').should('exist')
      cy.get('[data-cy="nav-dropdown-country"] .dropdown-display-text')
        .should('contain', 'Pakistan')

      // EXPECTATION: ADM1 dropdown should show only Pakistan provinces when opened
      cy.get('[data-cy="nav-dropdown-adm1"]').should('exist')
      cy.get('[data-cy="nav-dropdown-adm1"] .custom-dropdown-trigger').first().click()

      // Count visible options
      cy.get('[data-cy="nav-dropdown-adm1"] .dropdown-option:visible')
        .should('have.length.greaterThan', 0)
        .each($option => {
          // All options should belong to Pakistan
          expect($option.attr('data-country')).to.equal('PAK')
        })
    })
  })

  it('should update country dropdown when clicking breadcrumb from fresh state', () => {
    // Navigate to Afghanistan via map
    cy.navigateToCountry('Afghanistan')
    cy.wait(500)

    // Navigate to an ADM1 (province) by clicking first row in table
    cy.get('[data-cy="data-table-body"]').find('tr').first().click()
    cy.wait(1000)

    // Verify breadcrumbs
    cy.get('[data-cy="breadcrumb-country"]').should('exist')
    cy.get('[data-cy="breadcrumb-region"]').should('exist')

    // Reset to global to simulate "fresh state"
    cy.get('[data-cy="breadcrumb-global"]').click()
    cy.wait(500)

    // Verify we're at global
    cy.get('[data-cy="location-header"]').should('contain', 'Global')

    // Navigate back to Afghanistan  via dropdown
    cy.get('[data-cy="nav-dropdown-country"] .custom-dropdown-trigger').first().click()
    cy.get('[data-cy="nav-dropdown-country"] .dropdown-option[data-value="AFG"]').click()
    cy.wait(500)

    // Select an ADM1
    cy.get('[data-cy="nav-dropdown-adm1"] .custom-dropdown-trigger').first().click()
    cy.get('[data-cy="nav-dropdown-adm1"] .dropdown-option:visible').first().click()
    cy.wait(500)

    // Now click the ADM1 breadcrumb
    cy.get('[data-cy="breadcrumb-region"]').click()
    cy.wait(500)

    // EXPECTATION: Country dropdown should STILL show Afghanistan
    cy.get('[data-cy="nav-dropdown-country"] .dropdown-display-text')
      .should('contain', 'Afghanistan')

    // EXPECTATION: ADM1 dropdown should STILL be filtered to Afghanistan
    cy.get('[data-cy="nav-dropdown-adm1"] .custom-dropdown-trigger').first().click()
    cy.get('[data-cy="nav-dropdown-adm1"] .dropdown-option:visible').each($option => {
      expect($option.attr('data-country')).to.equal('AFG')
    })
  })
})
