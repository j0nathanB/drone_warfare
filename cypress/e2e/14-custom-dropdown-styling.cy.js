/**
 * Cypress E2E Test Suite: Custom Dropdown Styling & Behavior
 *
 * Purpose: Test custom JavaScript dropdown implementation with consistent widths
 * Requirement: ADM1, ADM2, ADM3 dropdowns should have consistent minimal width
 *              and display results using custom dropdown instead of native browser dropdown
 *
 * TDD Phase: RED (Tests written first before implementation)
 */

describe('Custom Dropdown Styling & Behavior', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForMap()
  })

  describe('Dropdown Structure and Styling', () => {
    it('should have consistent minimum width for ADM1, ADM2, ADM3 dropdowns', () => {
      // Check that all three dropdowns exist
      cy.get('[data-cy="nav-dropdown-adm1"]').should('exist')
      cy.get('[data-cy="nav-dropdown-adm2"]').should('exist')
      cy.get('[data-cy="nav-dropdown-adm3"]').should('exist')

      // Get computed widths
      let adm1Width, adm2Width, adm3Width

      cy.get('[data-cy="nav-dropdown-adm1"]').then($el => {
        adm1Width = $el.width()
      })

      cy.get('[data-cy="nav-dropdown-adm2"]').then($el => {
        adm2Width = $el.width()
      })

      cy.get('[data-cy="nav-dropdown-adm3"]').then($el => {
        adm3Width = $el.width()

        // All three should have the same width
        expect(adm1Width).to.equal(adm2Width)
        expect(adm2Width).to.equal(adm3Width)

        // Minimum width should be at least 80px (enough for "Adm1", "Adm2", "Adm3")
        expect(adm1Width).to.be.at.least(80)
      })
    })

    it('should display placeholder text for collapsed state', () => {
      // Default state should show "Adm1", "Adm2", "Adm3" text
      cy.get('[data-cy="nav-dropdown-adm1"]').should('contain.text', 'Adm1')
      cy.get('[data-cy="nav-dropdown-adm2"]').should('contain.text', 'Adm2')
      cy.get('[data-cy="nav-dropdown-adm3"]').should('contain.text', 'Adm3')
    })

    it('should have custom dropdown structure (not native select)', () => {
      // Check that dropdowns are custom wrappers, not standard select elements
      cy.get('[data-cy="nav-dropdown-adm1"]')
        .should('have.class', 'custom-dropdown-wrapper')

      cy.get('[data-cy="nav-dropdown-adm2"]')
        .should('have.class', 'custom-dropdown-wrapper')

      cy.get('[data-cy="nav-dropdown-adm3"]')
        .should('have.class', 'custom-dropdown-wrapper')

      // Should contain a button trigger with role="button"
      cy.get('[data-cy="nav-dropdown-adm1"]')
        .find('.custom-dropdown-trigger')
        .should('have.attr', 'role', 'button')
    })

    it('should have dropdown menu hidden by default', () => {
      // Dropdown menus should not be visible initially
      cy.get('[data-cy="dropdown-menu-adm1"]').should('not.be.visible')
      cy.get('[data-cy="dropdown-menu-adm2"]').should('not.be.visible')
      cy.get('[data-cy="dropdown-menu-adm3"]').should('not.be.visible')
    })
  })

  describe('Dropdown Interaction Behavior', () => {
    it('should open dropdown menu when clicked', () => {
      // Navigate to a country to populate ADM1
      cy.navigateToCountry('Afghanistan')

      // Click ADM1 dropdown
      cy.get('[data-cy="nav-dropdown-adm1"]').click()

      // Dropdown menu should become visible
      cy.get('[data-cy="dropdown-menu-adm1"]')
        .should('be.visible')
        .and('have.class', 'dropdown-menu-open')
    })

    it('should close dropdown when clicking outside', () => {
      cy.navigateToCountry('Afghanistan')

      // Open dropdown
      cy.get('[data-cy="nav-dropdown-adm1"]').click()
      cy.get('[data-cy="dropdown-menu-adm1"]').should('be.visible')

      // Click outside (on the map)
      cy.get('#map').click()

      // Dropdown should close
      cy.get('[data-cy="dropdown-menu-adm1"]').should('not.be.visible')
    })

    it('should close dropdown when clicking another dropdown', () => {
      cy.navigateToCountry('Afghanistan')

      // Open ADM1 dropdown
      cy.get('[data-cy="nav-dropdown-adm1"]').click()
      cy.get('[data-cy="dropdown-menu-adm1"]').should('be.visible')

      // Open Country dropdown
      cy.get('[data-cy="nav-dropdown-country"]').click()

      // ADM1 should close
      cy.get('[data-cy="dropdown-menu-adm1"]').should('not.be.visible')
      // Country should open
      cy.get('[data-cy="dropdown-menu-country"]').should('be.visible')
    })

    it('should display options in dropdown menu', () => {
      cy.navigateToCountry('Afghanistan')

      // Open ADM1 dropdown
      cy.get('[data-cy="nav-dropdown-adm1"]').click()

      // Should show list of provinces
      cy.get('[data-cy="dropdown-menu-adm1"]')
        .should('be.visible')
        .within(() => {
          // Should have multiple options
          cy.get('.dropdown-option').should('have.length.greaterThan', 0)

          // Should include known provinces
          cy.contains('.dropdown-option', 'Kabul').should('exist')
          cy.contains('.dropdown-option', 'Herat').should('exist')
        })
    })

    it('should update displayed text when selecting option', () => {
      cy.navigateToCountry('Afghanistan')

      // Open ADM1 dropdown
      cy.get('[data-cy="nav-dropdown-adm1"]').click()

      // Select a province
      cy.contains('[data-cy="dropdown-menu-adm1"] .dropdown-option', 'Kabul').click()

      // Dropdown should close
      cy.get('[data-cy="dropdown-menu-adm1"]').should('not.be.visible')

      // Displayed text should update to "Kabul"
      cy.get('[data-cy="nav-dropdown-adm1"]').should('contain.text', 'Kabul')
    })
  })

  describe('Dropdown Width Consistency Across States', () => {
    it('should maintain consistent width when selecting different length options', () => {
      cy.navigateToCountry('Afghanistan')

      // Get initial width
      let initialWidth
      cy.get('[data-cy="nav-dropdown-adm1"]').then($el => {
        initialWidth = $el.width()
      })

      // Select short name
      cy.get('[data-cy="nav-dropdown-adm1"]').click()
      cy.contains('[data-cy="dropdown-menu-adm1"] .dropdown-option', 'Kabul').click()

      // Width should remain the same
      cy.get('[data-cy="nav-dropdown-adm1"]').then($el => {
        expect($el.width()).to.equal(initialWidth)
      })

      // Select long name
      cy.get('[data-cy="nav-dropdown-adm1"]').click()
      cy.contains('[data-cy="dropdown-menu-adm1"] .dropdown-option', 'Badakhshan').click()

      // Width should still remain the same
      cy.get('[data-cy="nav-dropdown-adm1"]').then($el => {
        expect($el.width()).to.equal(initialWidth)
      })
    })

    it('should truncate long option text with ellipsis in collapsed state', () => {
      cy.navigateToCountry('Afghanistan')

      // Select a long province name
      cy.get('[data-cy="nav-dropdown-adm1"]').click()
      cy.contains('[data-cy="dropdown-menu-adm1"] .dropdown-option', 'Badakhshan').click()

      // Check CSS overflow properties
      cy.get('[data-cy="nav-dropdown-adm1"]')
        .should('have.css', 'text-overflow', 'ellipsis')
        .and('have.css', 'overflow', 'hidden')
        .and('have.css', 'white-space', 'nowrap')
    })

    it('should display full option text in dropdown menu (no truncation)', () => {
      cy.navigateToCountry('Afghanistan')

      // Open dropdown
      cy.get('[data-cy="nav-dropdown-adm1"]').click()

      // Options in menu should show full text
      cy.get('[data-cy="dropdown-menu-adm1"] .dropdown-option')
        .should('not.have.css', 'text-overflow', 'ellipsis')
        .first()
        .should('not.have.css', 'overflow', 'hidden')
    })
  })

  describe('Keyboard Accessibility', () => {
    it('should open dropdown with Enter key', () => {
      cy.navigateToCountry('Afghanistan')

      // Focus ADM1 dropdown
      cy.get('[data-cy="nav-dropdown-adm1"]').focus()

      // Press Enter
      cy.get('[data-cy="nav-dropdown-adm1"]').type('{enter}')

      // Dropdown should open
      cy.get('[data-cy="dropdown-menu-adm1"]').should('be.visible')
    })

    it('should navigate options with arrow keys', () => {
      cy.navigateToCountry('Afghanistan')

      // Open dropdown
      cy.get('[data-cy="nav-dropdown-adm1"]').click()

      // Press down arrow
      cy.get('[data-cy="nav-dropdown-adm1"]').type('{downarrow}')

      // First option should be highlighted
      cy.get('[data-cy="dropdown-menu-adm1"] .dropdown-option')
        .first()
        .should('have.class', 'dropdown-option-highlighted')

      // Press down arrow again
      cy.get('[data-cy="nav-dropdown-adm1"]').type('{downarrow}')

      // Second option should be highlighted
      cy.get('[data-cy="dropdown-menu-adm1"] .dropdown-option')
        .eq(1)
        .should('have.class', 'dropdown-option-highlighted')
    })

    it('should select option with Enter key', () => {
      cy.navigateToCountry('Afghanistan')

      // Open dropdown
      cy.get('[data-cy="nav-dropdown-adm1"]').click()

      // Navigate with arrow keys
      cy.get('[data-cy="nav-dropdown-adm1"]').type('{downarrow}')

      // Press Enter to select
      cy.get('[data-cy="nav-dropdown-adm1"]').type('{enter}')

      // Dropdown should close
      cy.get('[data-cy="dropdown-menu-adm1"]').should('not.be.visible')

      // Selection should be made (map should navigate)
      cy.get('[data-cy="breadcrumb-global"]').should('be.visible')
    })

    it('should close dropdown with Escape key', () => {
      cy.navigateToCountry('Afghanistan')

      // Open dropdown
      cy.get('[data-cy="nav-dropdown-adm1"]').click()
      cy.get('[data-cy="dropdown-menu-adm1"]').should('be.visible')

      // Press Escape
      cy.get('[data-cy="nav-dropdown-adm1"]').type('{esc}')

      // Dropdown should close
      cy.get('[data-cy="dropdown-menu-adm1"]').should('not.be.visible')
    })
  })

  describe('Visual Styling Consistency', () => {
    it('should have consistent styling with dark theme', () => {
      // Check background color matches theme
      cy.get('[data-cy="nav-dropdown-adm1"]')
        .should('have.css', 'background-color')
        .and('match', /rgba?\(/)

      // Check border
      cy.get('[data-cy="nav-dropdown-adm1"]')
        .should('have.css', 'border')
    })

    it('should have hover state for dropdown trigger', () => {
      cy.navigateToCountry('Afghanistan')

      // Hover over dropdown
      cy.get('[data-cy="nav-dropdown-adm1"]').trigger('mouseover')

      // Should have hover styles (check for transform or background change)
      cy.get('[data-cy="nav-dropdown-adm1"]')
        .should('have.css', 'transition')
    })

    it('should have hover state for dropdown options', () => {
      cy.navigateToCountry('Afghanistan')

      // Open dropdown
      cy.get('[data-cy="nav-dropdown-adm1"]').click()

      // Hover over first option
      cy.get('[data-cy="dropdown-menu-adm1"] .dropdown-option')
        .first()
        .trigger('mouseover')
        .should('have.class', 'dropdown-option-hover')
    })

    it('should display dropdown caret icon', () => {
      // Check for caret/arrow icon
      cy.get('[data-cy="nav-dropdown-adm1"]')
        .find('.dropdown-caret, .dropdown-icon, svg')
        .should('exist')
    })
  })

  describe('Disabled State Behavior', () => {
    it('should not open dropdown menu when disabled', () => {
      // ADM3 is disabled by default
      cy.get('[data-cy="nav-dropdown-adm3"]')
        .should('have.class', 'dropdown-disabled')
        .click({ force: true })

      // Menu should not open
      cy.get('[data-cy="dropdown-menu-adm3"]').should('not.exist').or('not.be.visible')
    })

    it('should show disabled visual styling', () => {
      // ADM3 trigger button should have reduced opacity
      cy.get('[data-cy="nav-dropdown-adm3"]')
        .find('.custom-dropdown-trigger')
        .should('have.css', 'opacity')
        .and('match', /0\.[0-9]+/) // Less than 1.0
    })

    it('should not show hover state when disabled', () => {
      // Get initial background
      let initialBg
      cy.get('[data-cy="nav-dropdown-adm3"]').then($el => {
        initialBg = $el.css('background-color')
      })

      // Hover (should not change)
      cy.get('[data-cy="nav-dropdown-adm3"]').trigger('mouseover')

      cy.get('[data-cy="nav-dropdown-adm3"]').then($el => {
        expect($el.css('background-color')).to.equal(initialBg)
      })
    })
  })

  describe('Integration with Existing Navigation', () => {
    it('should update custom dropdown when breadcrumb is clicked', () => {
      // Navigate to Afghanistan > Kabul
      cy.navigateToCountry('AFG')
      cy.wait(1000)
      cy.get('[data-cy="nav-dropdown-adm1"]').click()
      cy.contains('[data-cy="dropdown-menu-adm1"] .dropdown-option', 'Kabul').click()
      cy.wait(500)

      // Custom dropdown should show "Kabul"
      cy.get('[data-cy="nav-dropdown-adm1"]').should('contain.text', 'Kabul')

      // Click Global breadcrumb
      cy.get('[data-cy="breadcrumb-global"]').click()
      cy.wait(500)

      // Custom dropdown should reset to placeholder
      cy.get('[data-cy="nav-dropdown-adm1"]').should('contain.text', 'Adm1')
    })

    it('should maintain synchronization with map state', () => {
      // Select Pakistan via custom dropdown
      cy.get('[data-cy="nav-dropdown-country"]').click()
      cy.contains('[data-cy="dropdown-menu-country"] .dropdown-option', 'PAK').click()
      cy.wait(1000)

      // Map should zoom to Pakistan
      cy.verifyAppState({
        country: 'PAK'
      })

      // Select Punjab
      cy.get('[data-cy="nav-dropdown-adm1"]').click()
      cy.wait(500)
      cy.contains('[data-cy="dropdown-menu-adm1"] .dropdown-option', 'Punjab').click()
      cy.wait(1000)

      // Map should zoom to Punjab
      cy.verifyAppState({
        country: 'PAK',
        adm1: 'Punjab'
      })
    })
  })
})
