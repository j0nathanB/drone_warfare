/**
 * Layer Controls Tests
 * Tests for the new Layers dropdown with Heat map, Bubble map, and Boundaries
 */

describe('Layer Controls', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForMap()
  })

  describe('Layers Dropdown', () => {
    it('should display "Layers" button in header', () => {
      cy.get('[data-cy="data-layers-btn"]').should('be.visible')
      cy.get('[data-cy="data-layers-btn"]').should('contain', 'Layers')
    })

    it('should open and close dropdown when clicked', () => {
      // Initially closed
      cy.get('[data-cy="data-layers-content"]').should('not.be.visible')

      // Open dropdown
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('.data-layers-dropdown').should('have.class', 'open')
      cy.get('[data-cy="data-layers-content"]').should('be.visible')

      // Close dropdown
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('.data-layers-dropdown').should('not.have.class', 'open')
    })

    it('should close dropdown when clicking outside', () => {
      // Open dropdown
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('[data-cy="data-layers-content"]').should('be.visible')

      // Click outside
      cy.get('#map').click({ force: true })
      cy.get('.data-layers-dropdown').should('not.have.class', 'open')
    })
  })

  describe('Heat Map Layer', () => {
    it('should have heat map checkbox checked by default', () => {
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-heatmap').should('be.checked')
    })

    it('should toggle heat map layer when unchecked', () => {
      cy.get('[data-cy="data-layers-btn"]').click()

      // Verify heat map layer exists initially
      cy.window().then((win) => {
        const appState = win.appState || win.droneWarfareApp
        expect(appState.map.layers.heatmap).to.exist
      })

      // Uncheck heat map
      cy.get('#header-heatmap').click()

      // Verify heat map layer is hidden/removed
      cy.window().then((win) => {
        const appState = win.appState || win.droneWarfareApp
        const heatmapLayer = appState.map.layers.heatmap
        // Layer should be empty or removed from map
        expect(heatmapLayer.getLayers().length).to.equal(0)
      })
    })

    it('should re-enable heat map when checked again', () => {
      cy.get('[data-cy="data-layers-btn"]').click()

      // Uncheck then recheck
      cy.get('#header-heatmap').click()
      cy.wait(200)
      cy.get('#header-heatmap').click()

      // Verify heat map layer is displayed
      cy.window().then((win) => {
        const appState = win.appState || win.droneWarfareApp
        const heatmapLayer = appState.map.layers.heatmap
        expect(heatmapLayer.getLayers().length).to.be.greaterThan(0)
      })
    })
  })

  describe('Bubble Map Layer', () => {
    it('should have bubble map checkbox unchecked by default', () => {
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-bubblemap').should('not.be.checked')
    })

    it('should display bubble map when checked', () => {
      cy.get('[data-cy="data-layers-btn"]').click()

      // Check bubble map
      cy.get('#header-bubblemap').click()

      // Verify bubble map layer is displayed
      cy.window().then((win) => {
        const appState = win.appState || win.droneWarfareApp
        expect(appState.map.layers.bubblemap).to.exist
        const bubblemapLayer = appState.map.layers.bubblemap
        expect(bubblemapLayer.getLayers().length).to.be.greaterThan(0)
      })
    })

    it('should hide bubble map when unchecked', () => {
      cy.get('[data-cy="data-layers-btn"]').click()

      // Check then uncheck
      cy.get('#header-bubblemap').click()
      cy.wait(200)
      cy.get('#header-bubblemap').click()

      // Verify bubble map layer is hidden
      cy.window().then((win) => {
        const appState = win.appState || win.droneWarfareApp
        const bubblemapLayer = appState.map.layers.bubblemap
        expect(bubblemapLayer.getLayers().length).to.equal(0)
      })
    })
  })

  describe('Boundary Controls', () => {
    it('should display Boundaries section header', () => {
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('.layer-section-header').should('contain', 'Boundaries')
    })

    it('should have Country and Adm1 checked by default', () => {
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-boundary-country').should('be.checked')
      cy.get('#header-boundary-adm1').should('be.checked')
    })

    it('should have Adm2 unchecked by default', () => {
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-boundary-adm2').should('not.be.checked')
    })

    it('should have Adm3 disabled and grayed out', () => {
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-boundary-adm3').should('be.disabled')
      cy.get('#header-boundary-adm3').parents('.layer-toggle').should('have.class', 'layer-disabled')
    })

    it('should hide Country boundaries when unchecked', () => {
      cy.get('[data-cy="data-layers-btn"]').click()

      // Uncheck Country
      cy.get('#header-boundary-country').click()

      // Verify Country boundaries are hidden
      cy.window().then((win) => {
        const appState = win.appState || win.droneWarfareApp
        const boundaryLayers = appState.map.boundaryLayers
        expect(boundaryLayers.country.visible).to.be.false
      })
    })

    it('should hide Adm1 boundaries when unchecked', () => {
      cy.get('[data-cy="data-layers-btn"]').click()

      // Uncheck Adm1
      cy.get('#header-boundary-adm1').click()

      // Verify Adm1 boundaries are hidden
      cy.window().then((win) => {
        const appState = win.appState || win.droneWarfareApp
        const boundaryLayers = appState.map.boundaryLayers
        expect(boundaryLayers.adm1.visible).to.be.false
      })
    })

    it('should show Adm2 boundaries when checked', () => {
      cy.get('[data-cy="data-layers-btn"]').click()

      // Check Adm2
      cy.get('#header-boundary-adm2').click()

      // Verify Adm2 boundaries are shown
      cy.window().then((win) => {
        const appState = win.appState || win.droneWarfareApp
        const boundaryLayers = appState.map.boundaryLayers
        expect(boundaryLayers.adm2.visible).to.be.true
      })
    })

    it('should apply indentation styling to boundary checkboxes', () => {
      cy.get('[data-cy="data-layers-btn"]').click()

      cy.get('#header-boundary-country').parents('.layer-toggle').should('have.class', 'layer-indent')
      cy.get('#header-boundary-adm1').parents('.layer-toggle').should('have.class', 'layer-indent')
      cy.get('#header-boundary-adm2').parents('.layer-toggle').should('have.class', 'layer-indent')
      cy.get('#header-boundary-adm3').parents('.layer-toggle').should('have.class', 'layer-indent')
    })
  })

  describe('Multiple Layer Interactions', () => {
    it('should allow toggling multiple layers independently', () => {
      cy.get('[data-cy="data-layers-btn"]').click()

      // Toggle heat map off
      cy.get('#header-heatmap').click()
      cy.get('#header-heatmap').should('not.be.checked')

      // Toggle bubble map on
      cy.get('#header-bubblemap').click()
      cy.get('#header-bubblemap').should('be.checked')

      // Toggle Country boundaries off
      cy.get('#header-boundary-country').click()
      cy.get('#header-boundary-country').should('not.be.checked')

      // Verify all states are independent
      cy.get('#header-heatmap').should('not.be.checked')
      cy.get('#header-bubblemap').should('be.checked')
      cy.get('#header-boundary-country').should('not.be.checked')
      cy.get('#header-boundary-adm1').should('be.checked')
    })

    it('should maintain layer states when dropdown is closed and reopened', () => {
      cy.get('[data-cy="data-layers-btn"]').click()

      // Change some states
      cy.get('#header-heatmap').click()
      cy.get('#header-bubblemap').click()

      // Close dropdown
      cy.get('[data-cy="data-layers-btn"]').click()

      // Reopen dropdown
      cy.get('[data-cy="data-layers-btn"]').click()

      // Verify states persisted
      cy.get('#header-heatmap').should('not.be.checked')
      cy.get('#header-bubblemap').should('be.checked')
    })
  })

  describe('Keyboard Accessibility', () => {
    it('should open dropdown with Enter key', () => {
      cy.get('[data-cy="data-layers-btn"]').focus()
      cy.get('[data-cy="data-layers-btn"]').type('{enter}')
      cy.get('.data-layers-dropdown').should('have.class', 'open')
    })

    it('should open dropdown with Space key', () => {
      cy.get('[data-cy="data-layers-btn"]').focus()
      cy.get('[data-cy="data-layers-btn"]').trigger('keydown', { key: ' ', code: 'Space' })
      cy.get('.data-layers-dropdown').should('have.class', 'open')
    })

    it('should allow toggling checkboxes with keyboard', () => {
      cy.get('[data-cy="data-layers-btn"]').click()

      cy.get('#header-heatmap').focus()
      cy.get('#header-heatmap').type(' ')
      cy.get('#header-heatmap').should('not.be.checked')
    })
  })

  describe('Visual Feedback', () => {
    it('should show dropdown caret rotation when opened', () => {
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('.dropdown-caret').should('have.css', 'transform')
    })

    it('should apply reduced opacity to disabled Adm3 option', () => {
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-boundary-adm3').parents('.layer-toggle').should('have.css', 'opacity', '0.4')
    })

    it('should show not-allowed cursor on disabled Adm3', () => {
      cy.get('[data-cy="data-layers-btn"]').click()
      cy.get('#header-boundary-adm3').should('have.css', 'cursor', 'not-allowed')
    })
  })

  describe('Checkbox Hover State Consistency', () => {
    beforeEach(() => {
      cy.get('[data-cy="data-layers-btn"]').click()
    })

    it('should maintain pointer cursor on checkbox during entire interaction', () => {
      cy.get('#header-heatmap').as('checkbox')

      // Initial hover
      cy.get('@checkbox')
        .trigger('mouseover')
        .should('have.css', 'cursor', 'pointer')

      // During click
      cy.get('@checkbox').click()

      // Immediately after click - cursor should still be pointer
      cy.get('@checkbox')
        .should('have.css', 'cursor', 'pointer')

      // Click again to deselect
      cy.get('@checkbox').click()

      // Cursor should still be pointer, not briefly flashing to default
      cy.get('@checkbox')
        .should('have.css', 'cursor', 'pointer')
    })

    it('should maintain pointer cursor on layer-toggle container', () => {
      cy.get('#header-heatmap').parent('.layer-toggle').as('container')
      cy.get('#header-heatmap').as('checkbox')

      // Hover over container
      cy.get('@container')
        .trigger('mouseover')
        .should('have.css', 'cursor', 'pointer')

      // Click checkbox
      cy.get('@checkbox').click()

      // Container cursor should remain pointer
      cy.get('@container')
        .should('have.css', 'cursor', 'pointer')

      // Click again
      cy.get('@checkbox').click()

      // Container cursor should still be pointer
      cy.get('@container')
        .should('have.css', 'cursor', 'pointer')
    })

    it('should not flash background color when toggling checkbox', () => {
      cy.get('#header-heatmap').parent('.layer-toggle').as('container')
      cy.get('#header-heatmap').as('checkbox')

      // Record initial background
      cy.get('@container').then($el => {
        const initialBg = $el.css('background-color')

        // Click checkbox
        cy.get('@checkbox').click()

        // Background should transition smoothly without white/bright flash
        // Check that it stays in dark color space
        cy.get('@container').should($el => {
          const bg = $el.css('background-color')
          // Should be rgba with low values (dark), not rgb(255,255,255) or similar
          const match = bg.match(/rgba?\((\d+), (\d+), (\d+)/)
          if (match) {
            const [, r, g, b] = match.map(Number)
            // All RGB values should be less than 100 (dark colors)
            expect(r).to.be.lessThan(100)
            expect(g).to.be.lessThan(100)
            expect(b).to.be.lessThan(100)
          }
        })
      })
    })

    it('should handle rapid toggling without cursor flickering', () => {
      cy.get('#header-heatmap').as('checkbox')

      // Rapidly click 5 times
      for (let i = 0; i < 5; i++) {
        cy.get('@checkbox').click()
        cy.wait(50)
      }

      // After rapid clicking, cursor should still be pointer
      cy.get('@checkbox')
        .trigger('mouseover')
        .should('have.css', 'cursor', 'pointer')
    })

    it('should maintain hover state when moving between label and checkbox', () => {
      cy.get('#header-heatmap').parent('.layer-toggle').as('container')
      cy.get('#header-heatmap').as('checkbox')
      cy.get('#header-heatmap').siblings('label').as('label')

      // Hover label
      cy.get('@label')
        .trigger('mouseover')
        .should('have.css', 'cursor', 'pointer')

      // Move to checkbox
      cy.get('@checkbox')
        .trigger('mouseover')
        .should('have.css', 'cursor', 'pointer')

      // Container should maintain pointer throughout
      cy.get('@container')
        .should('have.css', 'cursor', 'pointer')
    })
  })
})
