/**
 * Test Suite: Hierarchical Dropdown Navigation System
 *
 * Tests the breadcrumb/dropdown navigation system with cascading filters:
 * - Global -> Country -> ADM1 -> ADM2 -> ADM3 (Pakistan only)
 * - Selecting an element from a dropdown auto-filters other dropdowns
 * - ADM3 is grayed out by default and only enabled for Pakistan ADM2
 * - Existing breadcrumb behavior remains intact
 */

describe('Hierarchical Dropdown Navigation System', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForMap()
  })

  describe('Initial State - Global View', () => {
    it('should display all 5 dropdown selects in the breadcrumb area', () => {
      // Global level dropdown (should show "Global" as selected)
      cy.get('[data-cy="nav-dropdown-global"]').should('exist').should('be.visible')

      // Country dropdown (should show all countries)
      cy.get('[data-cy="nav-dropdown-country"]').should('exist').should('be.visible')

      // ADM1 dropdown (should show all ADM1 from all countries initially)
      cy.get('[data-cy="nav-dropdown-adm1"]').should('exist').should('be.visible')

      // ADM2 dropdown (should show all ADM2 from all countries initially)
      cy.get('[data-cy="nav-dropdown-adm2"]').should('exist').should('be.visible')

      // ADM3 dropdown (should be grayed out/disabled initially)
      cy.get('[data-cy="nav-dropdown-adm3"]')
        .should('exist')
        .should('be.visible')
        .should('be.disabled')
    })

    it('should have "Global" selected in the global dropdown', () => {
      cy.get('[data-cy="nav-dropdown-global"]')
        .find('option:selected')
        .should('have.text', 'Global')
    })

    it('should show all 4 countries in the country dropdown', () => {
      cy.get('[data-cy="nav-dropdown-country"]')
        .find('option')
        .should('have.length.at.least', 5) // 1 placeholder + 4 countries

      // Verify country options exist
      cy.get('[data-cy="nav-dropdown-country"]').within(() => {
        cy.contains('option', 'Afghanistan').should('exist')
        cy.contains('option', 'Pakistan').should('exist')
        cy.contains('option', 'Somalia').should('exist')
        cy.contains('option', 'Yemen').should('exist')
      })
    })

    it('should show all ADM1 regions from all countries in ADM1 dropdown', () => {
      // ADM1 dropdown should have options from all countries
      cy.get('[data-cy="nav-dropdown-adm1"]')
        .find('option')
        .should('have.length.at.least', 2) // At least placeholder + some regions
    })

    it('should have ADM3 dropdown disabled and grayed out', () => {
      cy.get('[data-cy="nav-dropdown-adm3"]')
        .should('be.disabled')
        .should('have.class', 'dropdown-disabled')
    })
  })

  describe('Country Selection - Cascading Filters', () => {
    it('should filter ADM1 dropdown when selecting Afghanistan', () => {
      // Select Afghanistan from country dropdown
      cy.get('[data-cy="nav-dropdown-country"]').select('Afghanistan')

      // Verify ADM1 dropdown only shows Afghanistan regions
      cy.get('[data-cy="nav-dropdown-adm1"]')
        .find('option')
        .each(($option) => {
          const value = $option.val()
          if (value) { // Skip placeholder/empty option
            cy.wrap($option).should('have.attr', 'data-country', 'AFG')
          }
        })

      // Verify ADM2 dropdown is filtered to Afghanistan ADM2s
      cy.get('[data-cy="nav-dropdown-adm2"]')
        .find('option[data-country]')
        .each(($option) => {
          cy.wrap($option).should('have.attr', 'data-country', 'AFG')
        })

      // Verify ADM3 remains disabled (Afghanistan doesn't have ADM3)
      cy.get('[data-cy="nav-dropdown-adm3"]').should('be.disabled')
    })

    it('should filter ADM1 dropdown when selecting Pakistan', () => {
      // Select Pakistan from country dropdown
      cy.get('[data-cy="nav-dropdown-country"]').select('Pakistan')

      // Verify ADM1 dropdown only shows Pakistan regions
      cy.get('[data-cy="nav-dropdown-adm1"]')
        .find('option[data-country]')
        .each(($option) => {
          cy.wrap($option).should('have.attr', 'data-country', 'PAK')
        })

      // Verify ADM2 dropdown is filtered to Pakistan ADM2s
      cy.get('[data-cy="nav-dropdown-adm2"]')
        .find('option[data-country]')
        .each(($option) => {
          cy.wrap($option).should('have.attr', 'data-country', 'PAK')
        })

      // ADM3 should still be disabled until ADM2 is selected
      cy.get('[data-cy="nav-dropdown-adm3"]').should('be.disabled')
    })

    it('should navigate to country view when selecting a country', () => {
      // Select Afghanistan
      cy.get('[data-cy="nav-dropdown-country"]').select('Afghanistan')

      // Verify app state updated to country level
      cy.verifyAppState({ admLevel: 1, country: 'AFG' })

      // Verify breadcrumb shows Afghanistan
      cy.get('[data-cy="breadcrumb-country"]')
        .should('exist')
        .should('contain', 'AFG')

      // Verify statistics panel updates
      cy.get('[data-cy="statistics-panel"]').should('be.visible')
      cy.get('[data-cy="total-strikes"]').should('not.contain', '0')
    })
  })

  describe('ADM1 Selection - Cascading Filters', () => {
    it('should filter ADM2 dropdown when selecting an ADM1 region', () => {
      // First select a country
      cy.get('[data-cy="nav-dropdown-country"]').select('Afghanistan')

      // Then select an ADM1 region (e.g., first available option)
      cy.get('[data-cy="nav-dropdown-adm1"]')
        .find('option[data-country="AFG"]')
        .first()
        .then(($option) => {
          const adm1Name = $option.val()
          cy.get('[data-cy="nav-dropdown-adm1"]').select(adm1Name)

          // Verify ADM2 dropdown only shows ADM2s within this ADM1
          cy.get('[data-cy="nav-dropdown-adm2"]')
            .find('option[data-parent]')
            .each(($adm2Option) => {
              cy.wrap($adm2Option).should('have.attr', 'data-parent', adm1Name)
            })
        })
    })

    it('should navigate to ADM1 view when selecting an ADM1 region', () => {
      // Select country first
      cy.get('[data-cy="nav-dropdown-country"]').select('Pakistan')

      // Select an ADM1 region
      cy.get('[data-cy="nav-dropdown-adm1"]')
        .find('option[data-country="PAK"]')
        .first()
        .then(($option) => {
          const adm1Name = $option.text()
          cy.get('[data-cy="nav-dropdown-adm1"]').select(adm1Name)

          // Verify navigation occurred
          cy.verifyAppState({ admLevel: 2, country: 'PAK' })

          // Verify breadcrumb updated
          cy.get('[data-cy="breadcrumb-region"]')
            .should('exist')
            .should('contain', adm1Name)
        })
    })

    it('should keep ADM3 disabled when selecting Afghanistan ADM1', () => {
      cy.get('[data-cy="nav-dropdown-country"]').select('Afghanistan')

      cy.get('[data-cy="nav-dropdown-adm1"]')
        .find('option[data-country="AFG"]')
        .first()
        .then(($option) => {
          cy.get('[data-cy="nav-dropdown-adm1"]').select($option.val())

          // ADM3 should remain disabled for Afghanistan
          cy.get('[data-cy="nav-dropdown-adm3"]').should('be.disabled')
        })
    })
  })

  describe('ADM2 Selection - Pakistan ADM3 Enabling', () => {
    it('should enable ADM3 dropdown when selecting Pakistan ADM2', () => {
      // Navigate to Pakistan -> ADM1 -> ADM2
      cy.get('[data-cy="nav-dropdown-country"]').select('Pakistan')

      cy.get('[data-cy="nav-dropdown-adm1"]')
        .find('option[data-country="PAK"]')
        .first()
        .then(($adm1Option) => {
          cy.get('[data-cy="nav-dropdown-adm1"]').select($adm1Option.val())

          // Now select an ADM2
          cy.get('[data-cy="nav-dropdown-adm2"]')
            .find('option[data-parent]')
            .first()
            .then(($adm2Option) => {
              cy.get('[data-cy="nav-dropdown-adm2"]').select($adm2Option.val())

              // ADM3 should now be enabled
              cy.get('[data-cy="nav-dropdown-adm3"]')
                .should('not.be.disabled')
                .should('not.have.class', 'dropdown-disabled')

              // ADM3 should show options
              cy.get('[data-cy="nav-dropdown-adm3"]')
                .find('option')
                .should('have.length.at.least', 2) // Placeholder + at least one ADM3
            })
        })
    })

    it('should keep ADM3 disabled when selecting non-Pakistan ADM2', () => {
      // Select Afghanistan
      cy.get('[data-cy="nav-dropdown-country"]').select('Afghanistan')

      cy.get('[data-cy="nav-dropdown-adm1"]')
        .find('option[data-country="AFG"]')
        .first()
        .then(($adm1Option) => {
          cy.get('[data-cy="nav-dropdown-adm1"]').select($adm1Option.val())

          // Select an ADM2
          cy.get('[data-cy="nav-dropdown-adm2"]')
            .find('option[data-parent]')
            .first()
            .then(($adm2Option) => {
              if ($adm2Option.length > 0) {
                cy.get('[data-cy="nav-dropdown-adm2"]').select($adm2Option.val())

                // ADM3 should remain disabled for Afghanistan
                cy.get('[data-cy="nav-dropdown-adm3"]').should('be.disabled')
              }
            })
        })
    })

    it('should filter ADM3 dropdown based on selected ADM2 (Pakistan)', () => {
      // Navigate to Pakistan ADM2
      cy.get('[data-cy="nav-dropdown-country"]').select('Pakistan')

      cy.get('[data-cy="nav-dropdown-adm1"]')
        .find('option[data-country="PAK"]')
        .first()
        .then(($adm1Option) => {
          cy.get('[data-cy="nav-dropdown-adm1"]').select($adm1Option.val())

          cy.get('[data-cy="nav-dropdown-adm2"]')
            .find('option[data-parent]')
            .first()
            .then(($adm2Option) => {
              const adm2Name = $adm2Option.val()
              cy.get('[data-cy="nav-dropdown-adm2"]').select(adm2Name)

              // Verify ADM3 options are filtered to this ADM2
              cy.get('[data-cy="nav-dropdown-adm3"]')
                .find('option[data-parent]')
                .each(($adm3Option) => {
                  cy.wrap($adm3Option).should('have.attr', 'data-parent', adm2Name)
                })
            })
        })
    })
  })

  describe('ADM3 Selection - Pakistan Only', () => {
    it('should navigate to ADM3 view when selecting Pakistan ADM3', () => {
      // Full navigation: Pakistan -> ADM1 -> ADM2 -> ADM3
      cy.get('[data-cy="nav-dropdown-country"]').select('Pakistan')

      cy.get('[data-cy="nav-dropdown-adm1"]')
        .find('option[data-country="PAK"]')
        .first()
        .then(($adm1) => {
          cy.get('[data-cy="nav-dropdown-adm1"]').select($adm1.val())

          cy.get('[data-cy="nav-dropdown-adm2"]')
            .find('option[data-parent]')
            .first()
            .then(($adm2) => {
              cy.get('[data-cy="nav-dropdown-adm2"]').select($adm2.val())

              cy.get('[data-cy="nav-dropdown-adm3"]')
                .find('option[data-parent]')
                .first()
                .then(($adm3) => {
                  const adm3Name = $adm3.text()
                  cy.get('[data-cy="nav-dropdown-adm3"]').select($adm3.val())

                  // Verify navigation to ADM3 level (Pakistan goes to admLevel 3 for ADM3)
                  // Note: admLevel 3 means we're viewing ADM3 subdivisions
                  cy.window().its('appState.admLevel').should('be.gte', 3)
                  cy.window().its('appState.country').should('eq', 'PAK')

                  // Verify breadcrumbs updated (should have at least country + adm1 + adm2 + adm3)
                  cy.get('.breadcrumb-node')
                    .should('have.length.at.least', 3) // Global + Country + at least one more
                })
            })
        })
    })
  })

  describe('Dropdown Synchronization with Breadcrumbs', () => {
    it('should update dropdowns when clicking breadcrumb to go back', () => {
      // Navigate deep: Pakistan -> ADM1 -> ADM2
      cy.get('[data-cy="nav-dropdown-country"]').select('PAK')

      cy.get('[data-cy="nav-dropdown-adm1"]')
        .find('option[data-country="PAK"]')
        .first()
        .then(($adm1) => {
          cy.get('[data-cy="nav-dropdown-adm1"]').select($adm1.val())

          cy.get('[data-cy="nav-dropdown-adm2"]')
            .find('option[data-parent]')
            .first()
            .then(($adm2) => {
              cy.get('[data-cy="nav-dropdown-adm2"]').select($adm2.val())

              // Verify we're at ADM2 level or deeper
              cy.window().its('appState.admLevel').should('be.gte', 2)

              // Now click breadcrumb to go back to country level
              cy.get('[data-cy="breadcrumb-country"]').click()

              // Wait for navigation to complete - should go to country level (admLevel 1) or global
              cy.window().its('appState.admLevel').should('be.lte', 1)

              // Verify ADM2 dropdown is reset
              cy.get('[data-cy="nav-dropdown-adm2"]')
                .find('option:selected')
                .invoke('val')
                .should('be.empty')

              // ADM3 should be disabled
              cy.get('[data-cy="nav-dropdown-adm3"]').should('be.disabled')
            })
        })
    })

    it('should update dropdowns when clicking Global breadcrumb', () => {
      // Navigate to a country
      cy.get('[data-cy="nav-dropdown-country"]').select('Afghanistan')

      // Click Global breadcrumb
      cy.get('[data-cy="breadcrumb-global"]').click()

      // Verify all dropdowns reset to global state
      cy.get('[data-cy="nav-dropdown-global"]')
        .find('option:selected')
        .should('contain', 'Global')

      cy.get('[data-cy="nav-dropdown-country"]')
        .find('option:selected')
        .invoke('val')
        .should('be.empty')

      cy.get('[data-cy="nav-dropdown-adm1"]')
        .find('option[data-country]')
        .should('have.length.at.least', 1) // Should show all ADM1s again

      cy.get('[data-cy="nav-dropdown-adm3"]').should('be.disabled')
    })
  })

  describe('Existing Breadcrumb Click Behavior', () => {
    it('should preserve existing breadcrumb click navigation', () => {
      // Navigate using dropdown navigation
      cy.navigateToCountry('AFG')

      // Verify breadcrumb appears
      cy.get('[data-cy="breadcrumb-country"]').should('exist')

      // Click breadcrumb to go back
      cy.get('[data-cy="breadcrumb-global"]').click()

      // Verify navigation back to global
      cy.verifyAppState({ admLevel: 0, country: null })
    })

    it('should preserve breadcrumb visual styling and arrows', () => {
      cy.navigateToCountry('PAK')

      // Verify breadcrumb structure
      cy.get('[data-cy="breadcrumbs"]').within(() => {
        cy.get('.breadcrumb-arrow').should('exist')
        cy.get('.breadcrumb-node').should('have.length.at.least', 2)
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle rapid dropdown selections gracefully', () => {
      cy.get('[data-cy="nav-dropdown-country"]').select('Afghanistan')
      cy.get('[data-cy="nav-dropdown-country"]').select('Pakistan')
      cy.get('[data-cy="nav-dropdown-country"]').select('Yemen')

      // Should end up at Yemen
      cy.verifyAppState({ admLevel: 1, country: 'YEM' })
    })

    it('should maintain dropdown state after map zoom/pan', () => {
      cy.get('[data-cy="nav-dropdown-country"]').select('Somalia')

      // Zoom map
      cy.get('#map').trigger('wheel', { deltaY: -100 })

      // Verify dropdown selection persists
      cy.get('[data-cy="nav-dropdown-country"]')
        .find('option:selected')
        .should('contain', 'Somalia')
    })

    it('should handle missing ADM3 data gracefully', () => {
      // For countries without ADM3, dropdown should remain disabled
      cy.get('[data-cy="nav-dropdown-country"]').select('Yemen')

      cy.get('[data-cy="nav-dropdown-adm1"]')
        .find('option[data-country="YEM"]')
        .first()
        .then(($option) => {
          if ($option.length > 0) {
            cy.get('[data-cy="nav-dropdown-adm1"]').select($option.val())

            // ADM3 should remain disabled
            cy.get('[data-cy="nav-dropdown-adm3"]').should('be.disabled')
          }
        })
    })
  })

  describe('Visual Styling and Accessibility', () => {
    it('should apply disabled styling to ADM3 dropdown when disabled', () => {
      cy.get('[data-cy="nav-dropdown-adm3"]')
        .should('have.class', 'dropdown-disabled')
        .should('have.css', 'opacity')
        .and('match', /0\.\d+/) // Should be semi-transparent
    })

    it('should have proper labels for each dropdown', () => {
      cy.contains('label', 'Global').should('exist')
      cy.contains('label', 'Country').should('exist')
      cy.contains('label', 'Adm1').should('exist')
      cy.contains('label', 'Adm2').should('exist')
      cy.contains('label', 'Adm3').should('exist')
    })

    it('should be keyboard accessible', () => {
      // Focus on country dropdown directly
      cy.get('[data-cy="nav-dropdown-country"]').focus()
      cy.focused().should('have.attr', 'data-cy', 'nav-dropdown-country')

      // Use keyboard to select (this will open dropdown and navigate)
      cy.focused().type('{downarrow}')
    })
  })
})
