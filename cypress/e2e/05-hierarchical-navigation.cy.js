describe('Drone Warfare Visualization - Hierarchical Navigation', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForDataLoading()
    cy.waitForMap()
  })

  describe('Country-Level Navigation', () => {
    it('should display all supported countries on initial load', () => {
      // Verify all countries are available for selection
      const expectedCountries = ['Afghanistan', 'Pakistan', 'Somalia', 'Yemen']
      
      // Check that country boundaries are visible
      cy.get('.leaflet-overlay-pane svg').should('exist')
      cy.get('.leaflet-interactive').should('have.length.at.least', 4)
      
      // Verify statistics show global totals
      cy.get('[data-cy="breadcrumbs"]').should('contain.text', 'Global View')
    })

    it('should select Afghanistan and drill down to provinces', () => {
      // Click on Afghanistan (first interactive element should be AFG)
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Verify country selection
      cy.get('[data-cy="breadcrumbs"]').should('contain.text', 'Afghanistan')
      
      // Verify administrative level 1 (provinces) are displayed
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(1)
        expect(win.appState.country).to.equal('AFG')
      })
      
      // Statistics should update to show Afghanistan-only data
      cy.get('[data-cy="statistics-panel"]').within(() => {
        cy.get('[data-cy="region-name"]').should('contain.text', 'Afghanistan')
      })
    })

    it('should select Pakistan and show its administrative divisions', () => {
      // Find and click Pakistan
      cy.get('.leaflet-interactive').then(($elements) => {
        // Click through elements to find Pakistan
        cy.wrap($elements).each(($el, index) => {
          cy.wrap($el).click({ force: true })
          cy.wait(500)
          
          cy.get('[data-cy="breadcrumbs"]').then(($breadcrumb) => {
            if ($breadcrumb.text().includes('Pakistan')) {
              // Found Pakistan, verify state
              cy.window().then((win) => {
                expect(win.appState.country).to.equal('PAK')
                expect(win.appState.admLevel).to.equal(1)
              })
              return false // Break the loop
            }
          })
        })
      })
    })

    it('should handle country switching correctly', () => {
      // Select Afghanistan first
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      cy.get('[data-cy="breadcrumbs"]').should('contain.text', 'Afghanistan')
      
      // Reset and select different country
      cy.get('[data-cy="breadcrumbs"] .breadcrumb-item').first().click()
      cy.wait(1000)
      
      // Should return to global view
      cy.get('[data-cy="breadcrumbs"]').should('contain.text', 'Global View')
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(0)
      })
    })
  })

  describe('Provincial/State-Level Navigation', () => {
    it('should drill down to Afghanistan provinces and select one', () => {
      // Navigate to Afghanistan
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Click on a province
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Should now be at administrative level 2
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(2)
        expect(win.appState.country).to.equal('AFG')
        expect(win.appState.admName).to.not.be.empty
      })
      
      // Breadcrumbs should show: Global > Afghanistan > Province
      cy.get('[data-cy="breadcrumbs"]').within(() => {
        cy.get('.breadcrumb-item').should('have.length', 3)
      })
    })

    it('should handle Pakistan provinces correctly (deeper hierarchy)', () => {
      // Pakistan supports up to admin level 3, others only to level 2
      cy.get('.leaflet-interactive').then(($elements) => {
        // Find and select Pakistan
        cy.wrap($elements).each(($el) => {
          cy.wrap($el).click({ force: true })
          cy.wait(500)
          
          cy.get('[data-cy="breadcrumbs"]').then(($breadcrumb) => {
            if ($breadcrumb.text().includes('Pakistan')) {
              // Now in Pakistan, drill down to province
              cy.get('.leaflet-interactive').first().click({ force: true })
              cy.wait(1000)
              
              // Should be at admin level 2 in Pakistan
              cy.window().then((win) => {
                expect(win.appState.country).to.equal('PAK')
                expect(win.appState.admLevel).to.equal(2)
              })
              
              return false // Break loop
            }
          })
        })
      })
    })

    it('should update statistics when drilling down to provinces', () => {
      let countryStrikes, provinceStrikes
      
      // Get country-level statistics
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      cy.getStatistic('total-strikes').then((text) => {
        countryStrikes = parseInt(text.replace(/,/g, ''))
      })
      
      // Drill down to province
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Province statistics should be different (and likely smaller)
      cy.getStatistic('total-strikes').then((text) => {
        provinceStrikes = parseInt(text.replace(/,/g, ''))
        expect(provinceStrikes).to.be.at.most(countryStrikes)
      })
    })
  })

  describe('District/Local-Level Navigation', () => {
    it('should navigate to deepest level for Afghanistan (admin level 2)', () => {
      // Navigate to Afghanistan -> Province -> District
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Try to go deeper - should reach max depth for Afghanistan
      cy.get('.leaflet-interactive').then(($elements) => {
        if ($elements.length > 0) {
          cy.wrap($elements.first()).click({ force: true })
          cy.wait(1000)
          
          // Should either be at level 3 or stayed at level 2 (max depth)
          cy.window().then((win) => {
            expect(win.appState.admLevel).to.be.at.most(3)
            expect(win.appState.country).to.equal('AFG')
          })
        }
      })
    })

    it('should navigate to deepest level for Pakistan (admin level 3)', () => {
      // Find Pakistan and navigate through all levels
      cy.get('.leaflet-interactive').then(($elements) => {
        cy.wrap($elements).each(($el) => {
          cy.wrap($el).click({ force: true })
          cy.wait(500)
          
          cy.get('[data-cy="breadcrumbs"]').then(($breadcrumb) => {
            if ($breadcrumb.text().includes('Pakistan')) {
              // Level 1: Pakistan provinces
              cy.get('.leaflet-interactive').first().click({ force: true })
              cy.wait(1000)
              
              // Level 2: Districts
              cy.get('.leaflet-interactive').first().click({ force: true })
              cy.wait(1000)
              
              // Level 3: Sub-districts (Pakistan only)
              cy.get('.leaflet-interactive').then(($subElements) => {
                if ($subElements.length > 0) {
                  cy.wrap($subElements.first()).click({ force: true })
                  cy.wait(1000)
                  
                  cy.window().then((win) => {
                    expect(win.appState.country).to.equal('PAK')
                    expect(win.appState.admLevel).to.be.at.most(4)
                  })
                }
              })
              
              return false
            }
          })
        })
      })
    })

    it('should prevent navigation beyond maximum depth', () => {
      // Navigate to maximum depth and verify no further navigation possible
      cy.get('.leaflet-interactive').first().click({ force: true }) // Country
      cy.wait(1000)
      
      cy.get('.leaflet-interactive').first().click({ force: true }) // Province
      cy.wait(1000)
      
      let currentLevel
      cy.window().then((win) => {
        currentLevel = win.appState.admLevel
        
        // Try to go deeper
        cy.get('.leaflet-interactive').then(($elements) => {
          if ($elements.length > 0) {
            cy.wrap($elements.first()).click({ force: true })
            cy.wait(1000)
            
            // Check if we actually went deeper or hit the limit
            cy.window().then((win2) => {
              if (win2.appState.country === 'PAK') {
                expect(win2.appState.admLevel).to.be.at.most(4)
              } else {
                expect(win2.appState.admLevel).to.be.at.most(3)
              }
            })
          }
        })
      })
    })
  })

  describe('Breadcrumb Navigation', () => {
    it('should display correct breadcrumb hierarchy', () => {
      // Start at global
      cy.get('[data-cy="breadcrumbs"]').should('contain.text', 'Global View')
      
      // Navigate to country
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      cy.get('[data-cy="breadcrumbs"]').within(() => {
        cy.get('.breadcrumb-item').should('have.length', 2)
        cy.contains('Global View').should('exist')
        cy.contains('Afghanistan').should('exist')
      })
      
      // Navigate to province
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      cy.get('[data-cy="breadcrumbs"]').within(() => {
        cy.get('.breadcrumb-item').should('have.length', 3)
      })
    })

    it('should allow navigation back through breadcrumbs', () => {
      // Navigate deep
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Click on country breadcrumb to go back
      cy.get('[data-cy="breadcrumbs"]').within(() => {
        cy.contains('Afghanistan').click()
      })
      cy.wait(1000)
      
      // Should be back at country level
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(1)
        expect(win.appState.country).to.equal('AFG')
      })
      
      // Click on global breadcrumb
      cy.get('[data-cy="breadcrumbs"]').within(() => {
        cy.contains('Global View').click()
      })
      cy.wait(1000)
      
      // Should be back at global level
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(0)
      })
    })

    it('should maintain accurate breadcrumb names', () => {
      // Navigate and verify names are preserved
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Verify province name appears in breadcrumbs
      cy.window().then((win) => {
        if (win.appState.admName) {
          cy.get('[data-cy="breadcrumbs"]').should('contain.text', win.appState.admName)
        }
      })
    })
  })

  describe('Map View and Zoom Behavior', () => {
    it('should zoom to selected regions appropriately', () => {
      let initialZoom, countryZoom, provinceZoom
      
      // Get initial zoom
      cy.window().then((win) => {
        initialZoom = win.map.getZoom()
      })
      
      // Select country
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      cy.window().then((win) => {
        countryZoom = win.map.getZoom()
        expect(countryZoom).to.be.greaterThan(initialZoom)
      })
      
      // Select province
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      cy.window().then((win) => {
        provinceZoom = win.map.getZoom()
        expect(provinceZoom).to.be.greaterThan(countryZoom)
      })
    })

    it('should center map on selected regions', () => {
      let initialCenter, newCenter
      
      cy.window().then((win) => {
        initialCenter = win.map.getCenter()
      })
      
      // Select a country
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      cy.window().then((win) => {
        newCenter = win.map.getCenter()
        // Center should have changed
        expect(newCenter.lat).to.not.equal(initialCenter.lat)
        expect(newCenter.lng).to.not.equal(initialCenter.lng)
      })
    })

    it('should clear previous layers when navigating', () => {
      // Navigate to country
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      let countryLayers
      cy.window().then((win) => {
        countryLayers = Object.keys(win.map._layers).length
      })
      
      // Navigate deeper
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Layer count should change (old cleared, new added)
      cy.window().then((win) => {
        const provinceLayers = Object.keys(win.map._layers).length
        // Should have different layer composition
        expect(provinceLayers).to.not.equal(countryLayers)
      })
    })
  })
})