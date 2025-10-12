/**
 * Test: Dropdown Population Fix
 *
 * Verify that ADM1 and ADM2 dropdowns are properly populated
 * and filtering works correctly.
 */

describe('16. Dropdown Population Fix', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForMap()
  })

  describe('Initial Population', () => {
    it('should populate country dropdown with all countries', () => {
      cy.get('[data-cy="nav-dropdown-country"]').within(() => {
        cy.get('.custom-dropdown-trigger').click()
      })

      // Should see all 4 countries
      cy.get('[data-cy="dropdown-menu-country"]').should('be.visible')
      cy.get('[data-cy="dropdown-menu-country"] .dropdown-option').should('have.length', 4)

      // Close dropdown
      cy.get('body').click(0, 0)
    })

    it('should populate ADM1 dropdown with all provinces from all countries', () => {
      cy.get('[data-cy="nav-dropdown-adm1"]').within(() => {
        cy.get('.custom-dropdown-trigger').click()
      })

      // Should see many ADM1 options (from all countries)
      cy.get('[data-cy="dropdown-menu-adm1"]').should('be.visible')
      cy.get('[data-cy="dropdown-menu-adm1"] .dropdown-option')
        .filter(':visible')
        .should('have.length.at.least', 1)
        .then($options => {
          cy.log(`ADM1 options count: ${$options.length}`)
        })

      // Close dropdown
      cy.get('body').click(0, 0)
    })

    it('should populate ADM2 dropdown with all districts from all countries', () => {
      cy.get('[data-cy="nav-dropdown-adm2"]').within(() => {
        cy.get('.custom-dropdown-trigger').click()
      })

      // Should see many ADM2 options (from all countries)
      cy.get('[data-cy="dropdown-menu-adm2"]').should('be.visible')
      cy.get('[data-cy="dropdown-menu-adm2"] .dropdown-option')
        .filter(':visible')
        .should('have.length.at.least', 1)
        .then($options => {
          cy.log(`ADM2 options count: ${$options.length}`)
        })

      // Close dropdown
      cy.get('body').click(0, 0)
    })
  })

  describe('Filtering After Country Selection', () => {
    it('should filter ADM1 to show only Pakistan provinces after selecting Pakistan', () => {
      // Select Pakistan
      cy.get('[data-cy="nav-dropdown-country"]').within(() => {
        cy.get('.custom-dropdown-trigger').click()
      })
      cy.get('[data-cy="dropdown-menu-country"] .dropdown-option')
        .contains('Pakistan')
        .click()

      // Wait for navigation
      cy.wait(500)

      // Open ADM1 dropdown
      cy.get('[data-cy="nav-dropdown-adm1"]').within(() => {
        cy.get('.custom-dropdown-trigger').click()
      })

      // Should see only Pakistan ADM1 options (visible)
      cy.get('[data-cy="dropdown-menu-adm1"]').should('be.visible')

      // Get all visible options
      cy.get('[data-cy="dropdown-menu-adm1"] .dropdown-option')
        .filter(':visible')
        .should('have.length.greaterThan', 0)
        .then($options => {
          // Log visible options for debugging
          const visibleCount = $options.length
          cy.log(`Visible ADM1 options after filtering: ${visibleCount}`)

          // Verify first option has correct country attribute
          expect($options.first().attr('data-country')).to.equal('PAK')
        })

      // Close dropdown
      cy.get('body').click(0, 0)
    })

    it('should filter ADM2 to show only Pakistan districts after selecting Pakistan', () => {
      // Select Pakistan
      cy.get('[data-cy="nav-dropdown-country"]').within(() => {
        cy.get('.custom-dropdown-trigger').click()
      })
      cy.get('[data-cy="dropdown-menu-country"] .dropdown-option')
        .contains('Pakistan')
        .click()

      // Wait for navigation
      cy.wait(500)

      // Open ADM2 dropdown
      cy.get('[data-cy="nav-dropdown-adm2"]').within(() => {
        cy.get('.custom-dropdown-trigger').click()
      })

      // Should see only Pakistan ADM2 options (visible)
      cy.get('[data-cy="dropdown-menu-adm2"]').should('be.visible')

      // Get all visible options
      cy.get('[data-cy="dropdown-menu-adm2"] .dropdown-option')
        .filter(':visible')
        .should('have.length.greaterThan', 0)
        .then($options => {
          // Log visible options for debugging
          const visibleCount = $options.length
          cy.log(`Visible ADM2 options after filtering: ${visibleCount}`)

          // Verify first option has correct country attribute
          expect($options.first().attr('data-country')).to.equal('PAK')
        })

      // Close dropdown
      cy.get('body').click(0, 0)
    })

    it('should further filter ADM2 after selecting ADM1', () => {
      // Select Pakistan
      cy.get('[data-cy="nav-dropdown-country"]').within(() => {
        cy.get('.custom-dropdown-trigger').click()
      })
      cy.get('[data-cy="dropdown-menu-country"] .dropdown-option')
        .contains('Pakistan')
        .click()

      cy.wait(500)

      // Select Punjab (ADM1)
      cy.get('[data-cy="nav-dropdown-adm1"]').within(() => {
        cy.get('.custom-dropdown-trigger').click()
      })
      cy.get('[data-cy="dropdown-menu-adm1"] .dropdown-option')
        .filter(':visible')
        .contains('Punjab')
        .click()

      cy.wait(500)

      // Open ADM2 dropdown
      cy.get('[data-cy="nav-dropdown-adm2"]').within(() => {
        cy.get('.custom-dropdown-trigger').click()
      })

      // Wait for menu to be visible
      cy.get('[data-cy="dropdown-menu-adm2"]').should('be.visible')

      // Should see only Punjab districts
      cy.get('[data-cy="dropdown-menu-adm2"] .dropdown-option')
        .filter(':visible')
        .should('have.length.greaterThan', 0)
        .then($options => {
          const visibleCount = $options.length
          cy.log(`Visible ADM2 options for Punjab: ${visibleCount}`)

          // Verify options are filtered to Punjab
          expect($options.first().attr('data-parent')).to.equal('Punjab')
        })

      // Close dropdown
      cy.get('body').click(0, 0)
    })
  })

  describe('Data Attributes Preservation', () => {
    it('should preserve data attributes after filtering', () => {
      // Select Afghanistan
      cy.get('[data-cy="nav-dropdown-country"]').within(() => {
        cy.get('.custom-dropdown-trigger').click()
      })
      cy.get('[data-cy="dropdown-menu-country"] .dropdown-option')
        .contains('Afghanistan')
        .click()

      cy.wait(500)

      // Open ADM1 dropdown
      cy.get('[data-cy="nav-dropdown-adm1"]').within(() => {
        cy.get('.custom-dropdown-trigger').click()
      })

      // Verify data attributes are intact
      cy.get('[data-cy="dropdown-menu-adm1"] .dropdown-option')
        .filter(':visible')
        .first()
        .should('have.attr', 'data-country', 'AFG')
        .should('have.attr', 'data-parent', 'AFG')

      // Close dropdown
      cy.get('body').click(0, 0)
    })
  })

  describe('Reset Behavior', () => {
    it('should show all ADM1 options again after resetting to global', () => {
      // Select Pakistan
      cy.get('[data-cy="nav-dropdown-country"]').within(() => {
        cy.get('.custom-dropdown-trigger').click()
      })
      cy.get('[data-cy="dropdown-menu-country"] .dropdown-option')
        .contains('Pakistan')
        .click()

      cy.wait(500)

      // Count filtered ADM1 options
      cy.get('[data-cy="nav-dropdown-adm1"]').within(() => {
        cy.get('.custom-dropdown-trigger').click()
      })

      cy.get('[data-cy="dropdown-menu-adm1"] .dropdown-option')
        .filter(':visible')
        .its('length')
        .then(filteredCount => {
          cy.log(`Filtered ADM1 count: ${filteredCount}`)

          cy.get('body').click(0, 0)

          // Reset to global by clicking breadcrumb (use first one if multiple exist)
          cy.get('[data-cy="breadcrumb-global"]').first().click()
          cy.wait(500)

          // Open ADM1 dropdown again
          cy.get('[data-cy="nav-dropdown-adm1"]').within(() => {
            cy.get('.custom-dropdown-trigger').click()
          })

          // Should see MORE options now (all countries)
          cy.get('[data-cy="dropdown-menu-adm1"] .dropdown-option')
            .filter(':visible')
            .should('have.length.at.least', filteredCount)
            .its('length')
            .then(newCount => {
              cy.log(`All ADM1 count after reset: ${newCount}`)
              expect(newCount).to.be.at.least(filteredCount)
            })

          cy.get('body').click(0, 0)
        })
    })
  })
})
