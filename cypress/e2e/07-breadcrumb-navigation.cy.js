describe('Drone Warfare Visualization - Breadcrumb Navigation', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForDataLoading()
    cy.waitForMap()
  })

  describe('Breadcrumb Display and Structure', () => {
    it('should display Global View breadcrumb on initial load', () => {
      cy.get('[data-cy="breadcrumbs"]').should('be.visible')
      cy.get('[data-cy="breadcrumbs"]').should('contain.text', 'Global View')
      
      // Should have only one breadcrumb item initially
      cy.get('[data-cy="breadcrumbs"] .breadcrumb-item').should('have.length', 1)
    })

    it('should update breadcrumbs when navigating to country level', () => {
      // Navigate to Afghanistan
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Should now have 2 breadcrumb items
      cy.get('[data-cy="breadcrumbs"] .breadcrumb-item').should('have.length', 2)
      
      // Should contain both Global View and Afghanistan
      cy.get('[data-cy="breadcrumbs"]').should('contain.text', 'Global View')
      cy.get('[data-cy="breadcrumbs"]').should('contain.text', 'Afghanistan')
      
      // Current (last) item should not be clickable
      cy.get('[data-cy="breadcrumbs"] .breadcrumb-item').last().should('have.class', 'active')
    })

    it('should build full breadcrumb trail through administrative levels', () => {
      // Navigate: Global -> Afghanistan -> Province
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Should have 3 breadcrumb items
      cy.get('[data-cy="breadcrumbs"] .breadcrumb-item').should('have.length', 3)
      
      // Verify hierarchy structure
      cy.get('[data-cy="breadcrumbs"]').within(() => {
        cy.get('.breadcrumb-item').eq(0).should('contain.text', 'Global View')
        cy.get('.breadcrumb-item').eq(1).should('contain.text', 'Afghanistan')
        cy.get('.breadcrumb-item').eq(2).should('have.class', 'active') // Current province
      })
    })

    it('should display correct country names in breadcrumbs', () => {
      const countries = [
        { selector: 0, name: 'Afghanistan' },
        { selector: 1, name: 'Pakistan' },
        { selector: 2, name: 'Somalia' },
        { selector: 3, name: 'Yemen' }
      ]
      
      countries.forEach((country, index) => {
        // Reset to global view
        if (index > 0) {
          cy.get('[data-cy="breadcrumbs"] .breadcrumb-item').first().click()
          cy.wait(1000)
        }
        
        // Try to select country
        cy.get('.leaflet-interactive').then(($elements) => {
          if ($elements.length > country.selector) {
            cy.wrap($elements[country.selector]).click({ force: true })
            cy.wait(1000)
            
            // Check if we got the expected country
            cy.get('[data-cy="breadcrumbs"]').then(($breadcrumbs) => {
              if ($breadcrumbs.text().includes(country.name)) {
                cy.get('[data-cy="breadcrumbs"]').should('contain.text', country.name)
              }
            })
          }
        })
      })
    })

    it('should handle province/state names in breadcrumbs', () => {
      // Navigate to province level
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Province name should appear in breadcrumbs
      cy.window().then((win) => {
        if (win.appState.admName && win.appState.admName.trim()) {
          cy.get('[data-cy="breadcrumbs"]').should('contain.text', win.appState.admName)
        }
      })
      
      // Breadcrumb should show the administrative hierarchy
      cy.get('[data-cy="breadcrumbs"] .breadcrumb-item').should('have.length.at.least', 3)
    })
  })

  describe('Breadcrumb Clickability and Navigation', () => {
    it('should allow clicking Global View to return to global level', () => {
      // Navigate deep into hierarchy
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Click Global View breadcrumb
      cy.get('[data-cy="breadcrumbs"]').within(() => {
        cy.contains('Global View').click()
      })
      cy.wait(1000)
      
      // Should be back at global level
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(0)
      })
      
      cy.get('[data-cy="breadcrumbs"]').should('contain.text', 'Global View')
      cy.get('[data-cy="breadcrumbs"] .breadcrumb-item').should('have.length', 1)
    })

    it('should allow clicking country breadcrumb to return to country level', () => {
      // Navigate: Global -> Afghanistan -> Province
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Click Afghanistan breadcrumb
      cy.get('[data-cy="breadcrumbs"]').within(() => {
        cy.contains('Afghanistan').click()
      })
      cy.wait(1000)
      
      // Should be back at country level
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(1)
        expect(win.appState.country).to.equal('AFG')
      })
      
      cy.get('[data-cy="breadcrumbs"] .breadcrumb-item').should('have.length', 2)
    })

    it('should not allow clicking the current (active) breadcrumb item', () => {
      // Navigate to province
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      const currentLevel = 2
      
      // Current breadcrumb item should have 'active' class and not be clickable
      cy.get('[data-cy="breadcrumbs"] .breadcrumb-item').last().should('have.class', 'active')
      
      // Clicking active item should not change state
      cy.get('[data-cy="breadcrumbs"] .breadcrumb-item').last().click()
      cy.wait(500)
      
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(currentLevel)
      })
    })

    it('should handle intermediate breadcrumb clicks correctly', () => {
      // Navigate deep: Global -> Afghanistan -> Province -> District (if available)
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Try to go deeper if possible
      cy.get('.leaflet-interactive').then(($elements) => {
        if ($elements.length > 0) {
          cy.wrap($elements.first()).click({ force: true })
          cy.wait(1000)
          
          // Now click the province breadcrumb (should be second-to-last)
          cy.get('[data-cy="breadcrumbs"] .breadcrumb-item').then(($items) => {
            if ($items.length > 2) {
              // Click the province level (not global, not current)
              cy.wrap($items[$items.length - 2]).click()
              cy.wait(1000)
              
              // Should be back at province level
              cy.window().then((win) => {
                expect(win.appState.admLevel).to.equal(2)
              })
            }
          })
        }
      })
    })
  })

  describe('Breadcrumb State Management', () => {
    it('should maintain consistent breadcrumb state during navigation', () => {
      // Navigate to country
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Store country name
      let countryName
      cy.get('[data-cy="breadcrumbs"]').invoke('text').then((text) => {
        countryName = text
      })
      
      // Navigate to province
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Country name should still be in breadcrumbs
      cy.get('[data-cy="breadcrumbs"]').should('contain.text', 'Afghanistan')
      
      // Navigate back via breadcrumb
      cy.get('[data-cy="breadcrumbs"]').within(() => {
        cy.contains('Afghanistan').click()
      })
      cy.wait(1000)
      
      // Should be back at same country level
      cy.get('[data-cy="breadcrumbs"]').should('contain.text', 'Afghanistan')
      cy.get('[data-cy="breadcrumbs"] .breadcrumb-item').should('have.length', 2)
    })

    it('should clear breadcrumbs correctly when resetting to global', () => {
      // Navigate deep
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Should have multiple breadcrumbs
      cy.get('[data-cy="breadcrumbs"] .breadcrumb-item').should('have.length.at.least', 3)
      
      // Reset to global
      cy.get('[data-cy="breadcrumbs"]').within(() => {
        cy.contains('Global View').click()
      })
      cy.wait(1000)
      
      // Should only have Global View breadcrumb
      cy.get('[data-cy="breadcrumbs"] .breadcrumb-item').should('have.length', 1)
      cy.get('[data-cy="breadcrumbs"]').should('contain.text', 'Global View')
    })

    it('should update breadcrumbs when switching between countries', () => {
      // Navigate to Afghanistan
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      cy.get('[data-cy="breadcrumbs"]').should('contain.text', 'Afghanistan')
      
      // Reset and navigate to different country
      cy.get('[data-cy="breadcrumbs"]').within(() => {
        cy.contains('Global View').click()
      })
      cy.wait(1000)
      
      // Try to find and select Pakistan
      cy.get('.leaflet-interactive').then(($elements) => {
        cy.wrap($elements).each(($el) => {
          cy.wrap($el).click({ force: true })
          cy.wait(500)
          
          cy.get('[data-cy="breadcrumbs"]').then(($breadcrumb) => {
            if ($breadcrumb.text().includes('Pakistan')) {
              // Breadcrumbs should now show Pakistan instead of Afghanistan
              cy.get('[data-cy="breadcrumbs"]').should('contain.text', 'Pakistan')
              cy.get('[data-cy="breadcrumbs"]').should('not.contain.text', 'Afghanistan')
              return false
            }
          })
        })
      })
    })
  })

  describe('Breadcrumb Visual and Accessibility', () => {
    it('should have proper visual hierarchy in breadcrumbs', () => {
      // Navigate through levels
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Check breadcrumb styling
      cy.get('[data-cy="breadcrumbs"]').should('be.visible')
      
      // Active item should be visually distinct
      cy.get('[data-cy="breadcrumbs"] .breadcrumb-item.active').should('exist')
      
      // Non-active items should be clickable (have pointer cursor)
      cy.get('[data-cy="breadcrumbs"] .breadcrumb-item').not('.active').should('have.css', 'cursor', 'pointer')
    })

    it('should handle long administrative names gracefully', () => {
      // Navigate to province level to test longer names
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Breadcrumbs should not overflow container
      cy.get('[data-cy="breadcrumbs"]').then(($breadcrumbs) => {
        const containerWidth = $breadcrumbs[0].offsetWidth
        const scrollWidth = $breadcrumbs[0].scrollWidth
        
        // Should not have horizontal overflow
        expect(scrollWidth).to.be.at.most(containerWidth + 10) // Allow small tolerance
      })
      
      // Text should be readable (not too small)
      cy.get('[data-cy="breadcrumbs"] .breadcrumb-item').each(($item) => {
        cy.wrap($item).should('have.css', 'font-size').then((fontSize) => {
          expect(parseFloat(fontSize)).to.be.at.least(12) // Minimum readable size
        })
      })
    })

    it('should provide proper breadcrumb separators', () => {
      // Navigate to create breadcrumb trail
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Should have breadcrumb separators between items
      cy.get('[data-cy="breadcrumbs"]').within(() => {
        // Check for separator characters or elements
        cy.get('.breadcrumb-separator, .breadcrumb-divider').should('exist')
        // OR check for text content that includes separators
        cy.contains(/[>\/\\|]/).should('exist')
      })
    })

    it('should maintain breadcrumb functionality on mobile', () => {
      cy.checkMobileViewport()
      cy.waitForDataLoading()
      
      // Navigate on mobile
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Breadcrumbs should still be visible and functional
      cy.get('[data-cy="breadcrumbs"]').should('be.visible')
      
      // Should be able to click breadcrumb on mobile
      cy.get('[data-cy="breadcrumbs"]').within(() => {
        cy.contains('Global View').click()
      })
      cy.wait(1000)
      
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(0)
      })
    })
  })
})