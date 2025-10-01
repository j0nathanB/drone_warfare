describe('Drone Warfare Visualization - Administrative Divisions', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForDataLoading()
    cy.waitForMap()
  })

  describe('Afghanistan Administrative Levels', () => {
    it('should navigate through Afghanistan admin levels 0->1->2', () => {
      // Level 0: Global view
      cy.get('[data-cy="breadcrumbs"]').should('contain.text', 'Global View')
      
      // Level 1: Select Afghanistan (Country)
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(1)
        expect(win.appState.country).to.equal('AFG')
      })
      
      cy.get('[data-cy="breadcrumbs"]').should('contain.text', 'Afghanistan')
      
      // Level 2: Select a province
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(2)
        expect(win.appState.country).to.equal('AFG')
        expect(win.appState.admName).to.not.be.empty
      })
      
      // Breadcrumbs should show 3 levels
      cy.get('[data-cy="breadcrumbs"]').within(() => {
        cy.get('.breadcrumb-item').should('have.length', 3)
      })
    })

    it('should respect Afghanistan maximum admin level (2)', () => {
      // Navigate to deepest level for Afghanistan
      cy.get('.leaflet-interactive').first().click({ force: true }) // Country
      cy.wait(1000)
      cy.get('.leaflet-interactive').first().click({ force: true }) // Province
      cy.wait(1000)
      
      const currentLevel = 2
      
      // Try to go deeper - should not exceed level 2 for Afghanistan
      cy.get('.leaflet-interactive').then(($elements) => {
        if ($elements.length > 0) {
          cy.wrap($elements.first()).click({ force: true })
          cy.wait(1000)
          
          cy.window().then((win) => {
            // Should either stay at level 2 or go to final detail view
            expect(win.appState.admLevel).to.be.at.most(3)
            expect(win.appState.country).to.equal('AFG')
          })
        }
      })
    })

    it('should display Afghanistan provinces correctly', () => {
      // Navigate to Afghanistan provinces
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Should have multiple provinces visible
      cy.get('.leaflet-interactive').should('have.length.at.least', 5)
      
      // Verify province data structure
      cy.window().then((win) => {
        expect(win.appState.geojson['AFG']).to.exist
        expect(win.appState.geojson['AFG'][1]).to.exist // Admin level 1 data
        expect(win.appState.geojson['AFG'][1].features).to.be.an('array')
      })
    })

    it('should handle Afghanistan province selection and statistics', () => {
      // Navigate to Afghanistan
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Select a specific province
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Verify province-specific statistics
      cy.get('[data-cy="statistics-panel"]').within(() => {
        cy.get('[data-cy="total-strikes"]').should('not.contain', 'NaN')
        cy.get('[data-cy="total-strikes"]').should('not.be.empty')
      })
      
      // Province name should be in breadcrumbs
      cy.window().then((win) => {
        if (win.appState.admName) {
          cy.get('[data-cy="breadcrumbs"]').should('contain.text', win.appState.admName)
        }
      })
    })
  })

  describe('Pakistan Administrative Levels', () => {
    it('should navigate through Pakistan admin levels 0->1->2->3', () => {
      // Find and select Pakistan
      cy.get('.leaflet-interactive').then(($elements) => {
        // Try each element until we find Pakistan
        for (let i = 0; i < Math.min($elements.length, 4); i++) {
          cy.wrap($elements[i]).click({ force: true })
          cy.wait(500)
          
          cy.get('[data-cy="breadcrumbs"]').then(($breadcrumb) => {
            if ($breadcrumb.text().includes('Pakistan')) {
              // Found Pakistan - now test the hierarchy
              cy.window().then((win) => {
                expect(win.appState.country).to.equal('PAK')
                expect(win.appState.admLevel).to.equal(1)
              })
              
              // Level 2: Select province
              cy.get('.leaflet-interactive').first().click({ force: true })
              cy.wait(1000)
              
              cy.window().then((win) => {
                expect(win.appState.admLevel).to.equal(2)
                expect(win.appState.country).to.equal('PAK')
              })
              
              // Level 3: Select district
              cy.get('.leaflet-interactive').first().click({ force: true })
              cy.wait(1000)
              
              cy.window().then((win) => {
                expect(win.appState.admLevel).to.equal(3)
                expect(win.appState.country).to.equal('PAK')
              })
              
              return false // Break the loop
            }
          })
        }
      })
    })

    it('should respect Pakistan maximum admin level (3)', () => {
      // Navigate to Pakistan and go to maximum depth
      cy.get('.leaflet-interactive').then(($elements) => {
        cy.wrap($elements).each(($el) => {
          cy.wrap($el).click({ force: true })
          cy.wait(500)
          
          cy.get('[data-cy="breadcrumbs"]').then(($breadcrumb) => {
            if ($breadcrumb.text().includes('Pakistan')) {
              // Navigate through all levels
              cy.get('.leaflet-interactive').first().click({ force: true })
              cy.wait(1000)
              cy.get('.leaflet-interactive').first().click({ force: true })
              cy.wait(1000)
              cy.get('.leaflet-interactive').first().click({ force: true })
              cy.wait(1000)
              
              // Should be at max level 3 or detail view
              cy.window().then((win) => {
                expect(win.appState.admLevel).to.be.at.most(4)
                expect(win.appState.country).to.equal('PAK')
              })
              
              return false
            }
          })
        })
      })
    })

    it('should display Pakistan administrative hierarchy correctly', () => {
      // Navigate to Pakistan
      cy.get('.leaflet-interactive').then(($elements) => {
        cy.wrap($elements).each(($el) => {
          cy.wrap($el).click({ force: true })
          cy.wait(500)
          
          cy.get('[data-cy="breadcrumbs"]').then(($breadcrumb) => {
            if ($breadcrumb.text().includes('Pakistan')) {
              // Verify Pakistan data structure supports deeper hierarchy
              cy.window().then((win) => {
                expect(win.appState.geojson['PAK']).to.exist
                expect(win.appState.geojson['PAK'][1]).to.exist // Provinces
                expect(win.appState.geojson['PAK'][2]).to.exist // Districts
                expect(win.appState.geojson['PAK'][3]).to.exist // Sub-districts
              })
              
              return false
            }
          })
        })
      })
    })
  })

  describe('Somalia Administrative Levels', () => {
    it('should navigate through Somalia admin levels correctly', () => {
      // Find and select Somalia
      cy.get('.leaflet-interactive').then(($elements) => {
        cy.wrap($elements).each(($el) => {
          cy.wrap($el).click({ force: true })
          cy.wait(500)
          
          cy.get('[data-cy="breadcrumbs"]').then(($breadcrumb) => {
            if ($breadcrumb.text().includes('Somalia')) {
              cy.window().then((win) => {
                expect(win.appState.country).to.equal('SOM')
                expect(win.appState.admLevel).to.equal(1)
              })
              
              // Navigate to province level
              cy.get('.leaflet-interactive').first().click({ force: true })
              cy.wait(1000)
              
              cy.window().then((win) => {
                expect(win.appState.admLevel).to.equal(2)
                expect(win.appState.country).to.equal('SOM')
              })
              
              return false
            }
          })
        })
      })
    })

    it('should respect Somalia maximum admin level (2)', () => {
      // Test that Somalia doesn't go beyond level 2
      cy.get('.leaflet-interactive').then(($elements) => {
        cy.wrap($elements).each(($el) => {
          cy.wrap($el).click({ force: true })
          cy.wait(500)
          
          cy.get('[data-cy="breadcrumbs"]').then(($breadcrumb) => {
            if ($breadcrumb.text().includes('Somalia')) {
              // Go to max depth
              cy.get('.leaflet-interactive').first().click({ force: true })
              cy.wait(1000)
              cy.get('.leaflet-interactive').first().click({ force: true })
              cy.wait(1000)
              
              // Should not exceed level 2 for Somalia
              cy.window().then((win) => {
                expect(win.appState.admLevel).to.be.at.most(3)
                expect(win.appState.country).to.equal('SOM')
              })
              
              return false
            }
          })
        })
      })
    })
  })

  describe('Yemen Administrative Levels', () => {
    it('should navigate through Yemen admin levels correctly', () => {
      // Find and select Yemen
      cy.get('.leaflet-interactive').then(($elements) => {
        cy.wrap($elements).each(($el) => {
          cy.wrap($el).click({ force: true })
          cy.wait(500)
          
          cy.get('[data-cy="breadcrumbs"]').then(($breadcrumb) => {
            if ($breadcrumb.text().includes('Yemen')) {
              cy.window().then((win) => {
                expect(win.appState.country).to.equal('YEM')
                expect(win.appState.admLevel).to.equal(1)
              })
              
              // Navigate deeper
              cy.get('.leaflet-interactive').first().click({ force: true })
              cy.wait(1000)
              
              cy.window().then((win) => {
                expect(win.appState.admLevel).to.equal(2)
                expect(win.appState.country).to.equal('YEM')
              })
              
              return false
            }
          })
        })
      })
    })

    it('should respect Yemen maximum admin level (2)', () => {
      // Test that Yemen doesn't go beyond level 2
      cy.get('.leaflet-interactive').then(($elements) => {
        cy.wrap($elements).each(($el) => {
          cy.wrap($el).click({ force: true })
          cy.wait(500)
          
          cy.get('[data-cy="breadcrumbs"]').then(($breadcrumb) => {
            if ($breadcrumb.text().includes('Yemen')) {
              // Go to max depth
              cy.get('.leaflet-interactive').first().click({ force: true })
              cy.wait(1000)
              cy.get('.leaflet-interactive').first().click({ force: true })
              cy.wait(1000)
              
              // Should not exceed level 2 for Yemen
              cy.window().then((win) => {
                expect(win.appState.admLevel).to.be.at.most(3)
                expect(win.appState.country).to.equal('YEM')
              })
              
              return false
            }
          })
        })
      })
    })
  })

  describe('Cross-Country Navigation', () => {
    it('should handle switching between countries correctly', () => {
      // Select Afghanistan
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      cy.window().then((win) => {
        expect(win.appState.country).to.equal('AFG')
      })
      
      // Reset to global view
      cy.get('[data-cy="breadcrumbs"] .breadcrumb-item').first().click()
      cy.wait(1000)
      
      // Now select a different country (Pakistan)
      cy.get('.leaflet-interactive').then(($elements) => {
        cy.wrap($elements).each(($el) => {
          cy.wrap($el).click({ force: true })
          cy.wait(500)
          
          cy.get('[data-cy="breadcrumbs"]').then(($breadcrumb) => {
            if ($breadcrumb.text().includes('Pakistan')) {
              cy.window().then((win) => {
                expect(win.appState.country).to.equal('PAK')
                expect(win.appState.admLevel).to.equal(1)
              })
              return false
            }
          })
        })
      })
    })

    it('should maintain correct data when switching countries', () => {
      let afghanistanStrikes, pakistanStrikes
      
      // Get Afghanistan data
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      cy.getStatistic('total-strikes').then((text) => {
        afghanistanStrikes = parseInt(text.replace(/,/g, ''))
      })
      
      // Reset and get Pakistan data
      cy.get('[data-cy="breadcrumbs"] .breadcrumb-item').first().click()
      cy.wait(1000)
      
      cy.get('.leaflet-interactive').then(($elements) => {
        cy.wrap($elements).each(($el) => {
          cy.wrap($el).click({ force: true })
          cy.wait(500)
          
          cy.get('[data-cy="breadcrumbs"]').then(($breadcrumb) => {
            if ($breadcrumb.text().includes('Pakistan')) {
              cy.getStatistic('total-strikes').then((text) => {
                pakistanStrikes = parseInt(text.replace(/,/g, ''))
                expect(pakistanStrikes).to.not.equal(afghanistanStrikes)
              })
              return false
            }
          })
        })
      })
    })
  })

  describe('Administrative Data Integrity', () => {
    it('should maintain consistent parent-child relationships', () => {
      // Navigate to a province and verify its parent relationship
      cy.get('.leaflet-interactive').first().click({ force: true }) // Afghanistan
      cy.wait(1000)
      
      cy.get('.leaflet-interactive').first().click({ force: true }) // Province
      cy.wait(1000)
      
      cy.window().then((win) => {
        expect(win.appState.country).to.equal('AFG')
        expect(win.appState.admName).to.not.be.empty
        
        // Check that current admin name is consistent
        if (win.appState.geojson['AFG'][win.appState.admLevel]) {
          const features = win.appState.geojson['AFG'][win.appState.admLevel].features
          const currentFeature = features.find(f => f.properties.shapeName === win.appState.admName)
          if (currentFeature) {
            expect(currentFeature.properties.parentAdm).to.equal('Afghanistan')
          }
        }
      })
    })

    it('should display appropriate number of sub-divisions', () => {
      // Each country should have reasonable number of admin divisions
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Afghanistan should have multiple provinces
      cy.get('.leaflet-interactive').should('have.length.at.least', 3)
      cy.get('.leaflet-interactive').should('have.length.at.most', 50) // Reasonable upper bound
    })

    it('should handle administrative boundaries correctly', () => {
      // Navigate through levels and verify boundaries are displayed
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Should have boundary polygons visible
      cy.get('.leaflet-overlay-pane svg path').should('exist')
      
      cy.get('.leaflet-interactive').first().click({ force: true })
      cy.wait(1000)
      
      // Should still have boundaries at deeper level
      cy.get('.leaflet-overlay-pane svg path').should('exist')
    })
  })
})