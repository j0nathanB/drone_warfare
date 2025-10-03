/**
 * Layer Toggle Checkbox Visibility Tests
 * Tests that clicking div.layer-toggle toggles the visibility of checkboxes it contains
 */

describe('Layer Toggle Checkbox Visibility', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForMap()
  })

  it('should toggle checkbox visibility when clicking div.layer-toggle', () => {
    // First expand the data layers dropdown to see the layer toggles
    cy.get('[data-cy="data-layers-btn"]').click()
    cy.get('[data-cy="data-layers-content"]').should('be.visible')

    // Get the first layer toggle div
    cy.get('.layer-toggle').first().as('layerToggle')
    cy.get('@layerToggle').find('input[type="checkbox"]').as('checkbox')
    cy.get('@layerToggle').find('label').as('label')

    // Initially, checkbox and label should be visible
    cy.get('@checkbox').should('be.visible')
    cy.get('@label').should('be.visible')

    // Click the layer-toggle div (not the checkbox itself) - click on the div but not on the checkbox
    cy.get('@layerToggle').then($el => {
      // Click on an empty area of the div, not on the checkbox or label
      const rect = $el[0].getBoundingClientRect()
      cy.wrap($el).click(rect.width - 10, rect.height / 2)
    })

    // After clicking, checkbox should be hidden but div should remain
    cy.get('@checkbox').should('not.be.visible')
    cy.get('@label').should('not.be.visible')
    cy.get('@layerToggle').should('be.visible')

    // Click again to toggle back
    cy.get('@layerToggle').then($el => {
      const rect = $el[0].getBoundingClientRect()
      cy.wrap($el).click(rect.width - 10, rect.height / 2)
    })

    // Checkbox and label should be visible again
    cy.get('@checkbox').should('be.visible')
    cy.get('@label').should('be.visible')
  })

  it('should maintain checkbox state when toggling visibility', () => {
    // Expand the data layers dropdown
    cy.get('[data-cy="data-layers-btn"]').click()
    cy.get('[data-cy="data-layers-content"]').should('be.visible')

    cy.get('.layer-toggle').first().as('layerToggle')
    cy.get('@layerToggle').find('input[type="checkbox"]').as('checkbox')

    // Check the initial state and modify it
    cy.get('@checkbox').should('be.checked')
    cy.get('@checkbox').uncheck()
    cy.get('@checkbox').should('not.be.checked')

    // Hide the checkbox by clicking the layer-toggle div (not on checkbox)
    cy.get('@layerToggle').then($el => {
      const rect = $el[0].getBoundingClientRect()
      cy.wrap($el).click(rect.width - 10, rect.height / 2)
    })
    cy.get('@checkbox').should('not.be.visible')

    // Show it again
    cy.get('@layerToggle').then($el => {
      const rect = $el[0].getBoundingClientRect()
      cy.wrap($el).click(rect.width - 10, rect.height / 2)
    })
    cy.get('@checkbox').should('be.visible')

    // Verify the checkbox state was preserved
    cy.get('@checkbox').should('not.be.checked')
  })

  it('should work for all layer toggle divs', () => {
    // Expand the data layers dropdown
    cy.get('[data-cy="data-layers-btn"]').click()
    cy.get('[data-cy="data-layers-content"]').should('be.visible')

    // Test each layer toggle
    cy.get('.layer-toggle').each(($layerToggle, index) => {
      cy.wrap($layerToggle).as(`layerToggle${index}`)
      cy.get(`@layerToggle${index}`).find('input[type="checkbox"]').as(`checkbox${index}`)
      cy.get(`@layerToggle${index}`).find('label').as(`label${index}`)

      // Initially visible
      cy.get(`@checkbox${index}`).should('be.visible')
      cy.get(`@label${index}`).should('be.visible')

      // Click to hide (not on checkbox)
      cy.get(`@layerToggle${index}`).then($el => {
        const rect = $el[0].getBoundingClientRect()
        cy.wrap($el).click(rect.width - 10, rect.height / 2)
      })
      cy.get(`@checkbox${index}`).should('not.be.visible')
      cy.get(`@label${index}`).should('not.be.visible')

      // Click to show
      cy.get(`@layerToggle${index}`).then($el => {
        const rect = $el[0].getBoundingClientRect()
        cy.wrap($el).click(rect.width - 10, rect.height / 2)
      })
      cy.get(`@checkbox${index}`).should('be.visible')
      cy.get(`@label${index}`).should('be.visible')
    })
  })

  it('should not interfere with checkbox functionality when visible', () => {
    // Expand the data layers dropdown
    cy.get('[data-cy="data-layers-btn"]').click()
    cy.get('[data-cy="data-layers-content"]').should('be.visible')

    cy.get('.layer-toggle').first().as('layerToggle')
    cy.get('@layerToggle').find('input[type="checkbox"]').as('checkbox')

    // Ensure checkbox is visible
    cy.get('@checkbox').should('be.visible')

    // Test normal checkbox functionality
    const initialState = cy.get('@checkbox').should('be.checked')
    cy.get('@checkbox').click()
    cy.get('@checkbox').should('not.be.checked')
    cy.get('@checkbox').click()
    cy.get('@checkbox').should('be.checked')
  })
})