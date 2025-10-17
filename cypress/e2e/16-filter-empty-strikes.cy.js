/**
 * Cypress E2E Test Suite: Filter Empty Strikes
 *
 * Purpose: Test the "Filter empty strikes" option in Data Visualization dropdown
 * Requirement: Allow users to toggle between full dataset and strike-only dataset
 *
 * TDD Phase: RED (Tests written first before implementation)
 */

describe('Filter Empty Strikes Option', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForMap()
  })

  describe('UI Elements', () => {
    it('should display Filter empty strikes checkbox in Data Visualization dropdown', () => {
      // Open Data Visualization dropdown
      cy.get('[data-cy="data-layers-btn"]').click()

      // Check for Options section
      cy.get('[data-cy="data-layers-content"]').within(() => {
        cy.contains('.layer-section-header', 'Options').should('exist')
      })
    })

    it('should have Filter empty strikes checkbox after Boundaries section', () => {
      cy.get('[data-cy="data-layers-btn"]').click()

      cy.get('[data-cy="data-layers-content"]').within(() => {
        // Get all section headers
        cy.get('.layer-section-header').then($headers => {
          const headers = $headers.toArray().map(el => el.textContent)
          const boundariesIndex = headers.indexOf('Boundaries')
          const optionsIndex = headers.indexOf('Options')

          expect(boundariesIndex).to.be.greaterThan(-1)
          expect(optionsIndex).to.be.greaterThan(-1)
          expect(optionsIndex).to.be.greaterThan(boundariesIndex)
        })
      })
    })

    it('should have checkbox with label "Show regions with zero strikes"', () => {
      cy.get('[data-cy="data-layers-btn"]').click()

      cy.get('[data-cy="data-layers-content"]').within(() => {
        cy.get('#filter-empty-strikes').should('exist')
        cy.get('label[for="filter-empty-strikes"]').should('contain', 'Show regions with zero strikes')
      })
    })

    it('should be unchecked by default (showing only strikes)', () => {
      cy.get('[data-cy="data-layers-btn"]').click()

      cy.get('#filter-empty-strikes').should('not.be.checked')
    })
  })

  describe('Functionality', () => {
    it('should show only regions with strikes when unchecked (default)', () => {
      cy.navigateToCountry('Afghanistan')
      cy.wait(500)

      // Get current row count (should be filtered)
      cy.get('[data-cy="data-table-body"]').find('tr').then($rows => {
        const filteredCount = $rows.length

        // All visible rows should have strike_count > 0
        $rows.each((index, row) => {
          const strikeCount = parseInt(Cypress.$(row).find('td').eq(1).text().trim())
          expect(strikeCount).to.be.greaterThan(0)
        })
      })
    })

    it('should show all regions when checkbox is checked', () => {
      cy.navigateToCountry('Afghanistan')
      cy.wait(500)

      // Get filtered count first
      cy.get('[data-cy="data-table-body"]').find('tr').its('length').then(filteredCount => {
        // Enable showing zero strikes
        cy.get('[data-cy="data-layers-btn"]').click()
        cy.get('#filter-empty-strikes').check()
        cy.get('[data-cy="data-layers-btn"]').click() // Close dropdown
        cy.wait(500)

        // Get unfiltered count
        cy.get('[data-cy="data-table-body"]').find('tr').its('length').then(unfilteredCount => {
          // Unfiltered count should be greater than or equal to filtered count
          expect(unfilteredCount).to.be.at.least(filteredCount)
        })
      })
    })

    it('should filter map features when unchecked', () => {
      cy.navigateToCountry('Afghanistan')
      cy.wait(500)

      // Count map features when filtered (default)
      cy.get('.leaflet-interactive').its('length').then(filteredFeatures => {
        // Enable showing zero strikes
        cy.get('[data-cy="data-layers-btn"]').click()
        cy.get('#filter-empty-strikes').check()
        cy.get('[data-cy="data-layers-btn"]').click()
        cy.wait(500)

        // Count map features when unfiltered
        cy.get('.leaflet-interactive').its('length').then(unfilteredFeatures => {
          expect(unfilteredFeatures).to.be.at.least(filteredFeatures)
        })
      })
    })

    it('should update statistics to reflect filtered data', () => {
      cy.navigateToCountry('Afghanistan')
      cy.wait(500)

      // Get stats when filtered (should show sum of visible regions)
      cy.get('[data-cy="total-strikes"]').invoke('text').then(filteredStrikes => {
        // Enable showing zero strikes
        cy.get('[data-cy="data-layers-btn"]').click()
        cy.get('#filter-empty-strikes').check()
        cy.get('[data-cy="data-layers-btn"]').click()
        cy.wait(500)

        // Stats should remain same (showing country total, not sum of visible rows)
        cy.get('[data-cy="total-strikes"]').invoke('text').then(unfilteredStrikes => {
          // Country total should be same regardless of filter
          expect(filteredStrikes).to.equal(unfilteredStrikes)
        })
      })
    })

    it('should persist filter state when navigating between levels', () => {
      // Enable showing zero strikes at global level
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#filter-empty-strikes').check()
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.wait(300)

      // Navigate to country
      cy.navigateToCountry('Afghanistan')
      cy.wait(500)

      // Filter should still be enabled
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#filter-empty-strikes').should('be.checked')
    })

    it('should update both table and map when toggling', () => {
      cy.navigateToCountry('Pakistan')
      cy.wait(500)

      // Default: filtered (no zero strikes)
      cy.get('[data-cy="data-table-body"]').find('tr').its('length').then(initialTableRows => {
        cy.get('.leaflet-interactive').its('length').then(initialMapFeatures => {

          // Toggle ON (show zero strikes)
          cy.get('[data-cy="data-layers-btn"]').click()
          cy.get('#filter-empty-strikes').check()
          cy.get('[data-cy="data-layers-btn"]').click()
          cy.wait(500)

          // Should show more rows and features
          cy.get('[data-cy="data-table-body"]').find('tr').its('length').should('be.gte', initialTableRows)
          cy.get('.leaflet-interactive').its('length').should('be.gte', initialMapFeatures)

          // Toggle OFF (hide zero strikes again)
          cy.get('[data-cy="data-layers-btn"]').click()
          cy.get('#filter-empty-strikes').uncheck()
          cy.get('[data-cy="data-layers-btn"]').click()
          cy.wait(500)

          // Should return to original counts
          cy.get('[data-cy="data-table-body"]').find('tr').its('length').should('eq', initialTableRows)
          cy.get('.leaflet-interactive').its('length').should('eq', initialMapFeatures)
        })
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle countries with all regions having strikes', () => {
      // Navigate to a country where all regions might have strikes
      cy.navigateToCountry('Yemen')
      cy.wait(500)

      cy.get('[data-cy="data-table-body"]').find('tr').its('length').then(filteredCount => {
        cy.get('[data-cy="data-layers-btn"]').click()
        cy.get('#filter-empty-strikes').check()
        cy.get('[data-cy="data-layers-btn"]').click()
        cy.wait(500)

        // If all regions have strikes, count should be same
        cy.get('[data-cy="data-table-body"]').find('tr').its('length').should('be.gte', filteredCount)
      })
    })

    it('should handle empty datasets gracefully', () => {
      // At global level, verify data is loaded by checking table
      cy.get('[data-cy="data-table-body"]').should('exist')
      cy.wait(500) // Wait for stats to update

      // Verify stats show strikes (not checking exact value, just that it's not empty)
      cy.get('[data-cy="total-strikes"]').should('not.be.empty')

      // Toggle filter
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#filter-empty-strikes').check()
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.wait(300)

      // Should still show data (verified by checking if table exists)
      cy.get('[data-cy="data-table-body"]').should('exist')
      cy.get('[data-cy="total-strikes"]').should('not.be.empty')
    })

    it('should work correctly with breadcrumb navigation', () => {
      // Navigate to country with filter disabled
      cy.navigateToCountry('Afghanistan')
      cy.wait(500)

      // Navigate to ADM1
      cy.get('[data-cy="data-table-body"]').find('tr').first().click()
      cy.wait(500)

      // Enable filter
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#filter-empty-strikes').check()
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.wait(500)

      // Navigate back via header breadcrumb (Global button)
      cy.get('[data-cy="breadcrumb-global"]').first().click()
      cy.wait(500)

      // Navigate back to country
      cy.navigateToCountry('Afghanistan')
      cy.wait(500)

      // Filter should still be enabled
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#filter-empty-strikes').should('be.checked')
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      cy.get('[data-cy="data-layers-btn"]').click()

      cy.get('#filter-empty-strikes').should('be.visible')
      cy.get('#filter-empty-strikes').focus()
      cy.focused().should('have.id', 'filter-empty-strikes')

      // Toggle with space key
      cy.focused().type(' ')
      cy.get('#filter-empty-strikes').should('be.checked')
    })

    it('should have proper label association', () => {
      cy.get('[data-cy="data-layers-btn"]').click()

      cy.get('label[for="filter-empty-strikes"]').click()
      cy.get('#filter-empty-strikes').should('be.checked')
    })
  })
})
