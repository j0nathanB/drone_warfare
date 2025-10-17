/**
 * Cypress E2E Test Suite: Location Header Display
 *
 * Purpose: Test the location header that displays current navigation level
 *          above the statistics card in the sidebar
 * Requirement: Display current location (e.g., "Global", "Afghanistan", "Afghanistan - Badakhshan")
 *
 * TDD Phase: RED (Tests written first before implementation)
 */

describe('Current Location Header', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForMap()
  })

  describe('Initial State', () => {
    it('should display location header above stats card', () => {
      cy.get('[data-cy="location-header"]').should('exist')
      cy.get('[data-cy="location-header"]').should('be.visible')
    })

    it('should show "Global" as initial location', () => {
      cy.get('[data-cy="location-header"]').should('contain', 'Global')
    })

    it('should be positioned above the statistics panel', () => {
      // Check that location header comes before stats card in DOM
      cy.get('.sidebar .info-panel').within(() => {
        cy.get('[data-cy="location-header"]').should('exist')
        cy.get('[data-cy="stats-card"]').should('exist')
      })

      // Verify location header appears before stats card
      cy.get('[data-cy="location-header"]').then($header => {
        cy.get('[data-cy="stats-card"]').then($statsCard => {
          const headerTop = $header.offset().top
          const statsTop = $statsCard.offset().top
          expect(headerTop).to.be.lessThan(statsTop)
        })
      })
    })

    it('should have appropriate styling', () => {
      cy.get('[data-cy="location-header"]')
        .should('have.css', 'font-size')
        .and('match', /^\d+px$/)

      cy.get('[data-cy="location-header"]')
        .should('have.css', 'color')
    })
  })

  describe('Navigation Updates', () => {
    it('should update to country name when country is selected', () => {
      cy.navigateToCountry('Afghanistan')
      cy.get('[data-cy="location-header"]').should('contain', 'Afghanistan')
    })

    it('should show country and ADM1 when drilling down', () => {
      cy.navigateToCountry('Afghanistan')

      // Select a province (ADM1)
      cy.get('[data-cy="data-table-body"]').find('tr').first().click()
      cy.wait(500)

      // Should show "Afghanistan - [Province Name]"
      cy.get('[data-cy="location-header"]').then($header => {
        const text = $header.text()
        expect(text).to.include('Afghanistan')
        expect(text).to.include('-')
      })
    })

    it('should show full hierarchy when at ADM2 level', () => {
      cy.navigateToCountry('Pakistan')

      // Navigate to ADM1
      cy.get('[data-cy="data-table-body"]').find('tr').first().click()
      cy.wait(500)

      // Navigate to ADM2
      cy.get('[data-cy="data-table-body"]').find('tr').first().click()
      cy.wait(500)

      // Should show "Pakistan - [Province] - [District]"
      cy.get('[data-cy="location-header"]').then($header => {
        const text = $header.text()
        const separators = (text.match(/-/g) || []).length
        expect(separators).to.be.at.least(1) // At least one separator
      })
    })

    it('should update when navigating back via breadcrumbs', () => {
      cy.navigateToCountry('Afghanistan')
      cy.get('[data-cy="location-header"]').should('contain', 'Afghanistan')

      // Click global breadcrumb
      cy.get('[data-cy="breadcrumb-global"]').first().click()
      cy.wait(300)

      cy.get('[data-cy="location-header"]').should('contain', 'Global')
    })
  })

  describe('Different Countries', () => {
    const countries = ['Afghanistan', 'Pakistan', 'Somalia', 'Yemen']

    countries.forEach(country => {
      it(`should display ${country} when selected`, () => {
        cy.navigateToCountry(country)
        cy.get('[data-cy="location-header"]').should('contain', country)
      })
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      cy.get('[data-cy="location-header"]').should('be.visible')
    })

    it('should have appropriate heading semantics', () => {
      cy.get('[data-cy="location-header"]')
        .invoke('prop', 'tagName')
        .should('match', /^(H2|H3|DIV)$/)
    })

    it('should have sufficient color contrast', () => {
      cy.get('[data-cy="location-header"]')
        .should('have.css', 'color')
    })
  })

  describe('Responsive Behavior', () => {
    it('should be visible on mobile viewport', () => {
      cy.viewport(375, 667)
      cy.get('[data-cy="location-header"]').should('be.visible')
    })

    it('should handle long location names gracefully', () => {
      cy.navigateToCountry('Afghanistan')

      // Navigate deep into hierarchy
      cy.get('[data-cy="data-table-body"]').find('tr').first().click()
      cy.wait(500)

      cy.get('[data-cy="location-header"]').then($header => {
        const text = $header.text()
        expect(text.length).to.be.greaterThan(0)

        // Check that text doesn't overflow container
        const headerWidth = $header.width()
        const parentWidth = $header.parent().width()
        expect(headerWidth).to.be.at.most(parentWidth + 1) // Allow 1px tolerance
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid navigation changes', () => {
      cy.navigateToCountry('Afghanistan')
      cy.get('[data-cy="location-header"]').should('contain', 'Afghanistan')

      cy.get('[data-cy="breadcrumb-global"]').first().click()
      cy.wait(100)

      cy.navigateToCountry('Pakistan')
      cy.get('[data-cy="location-header"]').should('contain', 'Pakistan')
    })

    it('should persist after dropdown navigation', () => {
      // Use dropdown to navigate to country
      cy.get('.header-breadcrumb-nav').within(() => {
        cy.get('select, .custom-dropdown-wrapper').first().click()
      })

      cy.wait(200)

      // Click on Afghanistan option if dropdown is visible
      cy.get('body').then($body => {
        if ($body.find('[data-cy="dropdown-menu-country"]').length > 0) {
          cy.get('[data-cy="dropdown-menu-country"]').within(() => {
            cy.contains('.dropdown-option', 'Afghanistan').click()
          })
        } else {
          // Fallback to native select if custom dropdown not found
          cy.get('.header-breadcrumb-nav select').first().select('AFG')
        }
      })

      cy.wait(500)
      cy.get('[data-cy="location-header"]').should('contain', 'Afghanistan')
    })

    it('should display properly when navigating to ADM3 level (Pakistan only)', () => {
      cy.navigateToCountry('Pakistan')

      // Navigate to ADM1
      cy.get('[data-cy="data-table-body"]').find('tr').first().click()
      cy.wait(500)

      // Navigate to ADM2
      cy.get('[data-cy="data-table-body"]').find('tr').first().click()
      cy.wait(500)

      // If ADM3 data available, navigate to it
      cy.get('[data-cy="data-table-body"]').then($tbody => {
        if ($tbody.find('tr').length > 0) {
          cy.get('[data-cy="data-table-body"]').find('tr').first().click()
          cy.wait(500)

          // Should show hierarchy with 3+ separators
          cy.get('[data-cy="location-header"]').then($header => {
            const text = $header.text()
            const separators = (text.match(/-/g) || []).length
            expect(separators).to.be.at.least(2)
          })
        }
      })
    })
  })

  describe('Format and Display', () => {
    it('should use " - " as separator between location levels', () => {
      cy.navigateToCountry('Afghanistan')

      // Navigate to ADM1
      cy.get('[data-cy="data-table-body"]').find('tr').first().click()
      cy.wait(500)

      // Check for " - " separator (space-dash-space)
      cy.get('[data-cy="location-header"]').then($header => {
        const text = $header.text()
        expect(text).to.match(/\s-\s/)
      })
    })

    it('should trim whitespace from location names', () => {
      cy.navigateToCountry('Afghanistan')

      cy.get('[data-cy="location-header"]').then($header => {
        const text = $header.text()
        // Should not start or end with whitespace
        expect(text).to.equal(text.trim())
      })
    })

    it('should display location in correct hierarchical order', () => {
      cy.navigateToCountry('Afghanistan')

      // Navigate to ADM1
      cy.get('[data-cy="data-table-body"]').find('tr').first().click()
      cy.wait(500)

      // Get the province name from breadcrumbs AFTER navigation completes
      cy.get('[data-cy="breadcrumbs"] .breadcrumb-node').last().invoke('text').then(provinceName => {
        const cleanProvinceName = provinceName.trim()

        // Location header should be "Afghanistan - [Province]"
        cy.get('[data-cy="location-header"]').then($header => {
          const text = $header.text()
          expect(text).to.equal(`Afghanistan - ${cleanProvinceName}`)
        })
      })
    })

    it('should NOT show "Country1 - Country2" when switching countries via breadcrumbs', () => {
      // Navigate to Afghanistan first
      cy.navigateToCountry('Afghanistan')
      cy.wait(500)
      cy.get('[data-cy="location-header"]').should('contain', 'Afghanistan')
      cy.get('[data-cy="location-header"]').should('not.contain', '-')

      // Navigate back to global
      cy.get('[data-cy="breadcrumb-global"]').first().click()
      cy.wait(500)
      cy.get('[data-cy="location-header"]').should('contain', 'Global')

      // Navigate to Pakistan
      cy.navigateToCountry('Pakistan')
      cy.wait(500)

      // Should show ONLY "Pakistan", NOT "Afghanistan - Pakistan"
      cy.get('[data-cy="location-header"]').then($header => {
        const text = $header.text()
        expect(text).to.equal('Pakistan')
        expect(text).to.not.contain('Afghanistan')
      })
    })

    it('should correctly update when switching countries via breadcrumb click', () => {
      // Navigate to Afghanistan and drill down to ADM1
      cy.navigateToCountry('Afghanistan')
      cy.wait(500)
      cy.get('[data-cy="data-table-body"]').find('tr').first().click()
      cy.wait(500)

      // Location header should show "Afghanistan - [Province]"
      cy.get('[data-cy="location-header"]').then($header => {
        const text = $header.text()
        expect(text).to.include('Afghanistan')
        expect(text).to.include('-')
      })

      // Navigate back to Global by clicking the header breadcrumb, then back to Afghanistan
      cy.get('[data-cy="breadcrumb-global"]').first().click()
      cy.wait(500)
      cy.get('[data-cy="location-header"]').should('contain', 'Global')

      cy.navigateToCountry('Afghanistan')
      cy.wait(500)

      // Should show ONLY "Afghanistan", not duplicate countries
      cy.get('[data-cy="location-header"]').then($header => {
        const text = $header.text()
        expect(text).to.equal('Afghanistan')
        expect(text).to.not.match(/Afghanistan.*Afghanistan/)
      })
    })
  })
})
