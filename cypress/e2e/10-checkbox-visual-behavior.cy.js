/**
 * Checkbox Visual Behavior Tests
 * Tests to ensure that clicking checkboxes ONLY toggles the checkbox state
 * without any undesired visual side effects
 */

describe('Checkbox Visual Behavior', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForMap()
    cy.get('[data-cy="data-layers-btn"]').click()
  })

  describe('Checkbox Click Behavior', () => {
    it('should only toggle checkbox when clicked, no other visual changes', () => {
      cy.get('#header-heatmap').as('checkbox')
      cy.get('#header-heatmap').parent('.layer-toggle').as('container')

      // Record initial state
      cy.get('@checkbox').should('be.checked')
      cy.get('@container').then($container => {
        const initialClasses = $container.attr('class')

        // Click checkbox
        cy.get('@checkbox').click()

        // Checkbox should be unchecked
        cy.get('@checkbox').should('not.be.checked')

        // Container classes should remain the same (no layer-enabled/layer-disabled added)
        cy.get('@container').should($el => {
          const currentClasses = $el.attr('class')
          // Classes should be identical or only differ by hover/focus states
          expect(currentClasses).to.not.include('layer-enabled')
          expect(currentClasses).to.not.include('layer-disabled')
        })
      })
    })

    it('should not add temporary animation classes when checkbox is clicked', () => {
      cy.get('#header-heatmap').as('checkbox')
      cy.get('#header-heatmap').parent('.layer-toggle').as('container')

      // Click checkbox
      cy.get('@checkbox').click()

      // Immediately check for unwanted classes
      cy.get('@container').should('not.have.class', 'layer-enabled')
      cy.get('@container').should('not.have.class', 'layer-disabled')

      // Wait a bit and check again
      cy.wait(100)
      cy.get('@container').should('not.have.class', 'layer-enabled')
      cy.get('@container').should('not.have.class', 'layer-disabled')

      // Wait for any animations to complete
      cy.wait(400)
      cy.get('@container').should('not.have.class', 'layer-enabled')
      cy.get('@container').should('not.have.class', 'layer-disabled')
    })

    it('should not trigger double-toggle when clicking checkbox directly', () => {
      cy.get('#header-heatmap').as('checkbox')

      // Initial state: checked
      cy.get('@checkbox').should('be.checked')

      // Click once
      cy.get('@checkbox').click()

      // Should be unchecked (not double-toggled back to checked)
      cy.get('@checkbox').should('not.be.checked')

      // Click again
      cy.get('@checkbox').click()

      // Should be checked again
      cy.get('@checkbox').should('be.checked')
    })

    it('should not have visual flash or flicker when checkbox is clicked', () => {
      cy.get('#header-heatmap').parent('.layer-toggle').as('container')
      cy.get('#header-heatmap').as('checkbox')

      // Monitor background color stability
      cy.get('@container').then($container => {
        const computedStyle = window.getComputedStyle($container[0])
        const initialBackground = computedStyle.backgroundColor

        // Click checkbox
        cy.get('@checkbox').click()

        // Background should either stay the same or transition smoothly (no flash)
        cy.get('@container').should($el => {
          const currentBg = window.getComputedStyle($el[0]).backgroundColor
          // Parse RGBA values
          const parseRGBA = (rgba) => {
            const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/)
            return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : null
          }

          const initial = parseRGBA(initialBackground)
          const current = parseRGBA(currentBg)

          if (initial && current) {
            // Colors should be in the same dark range (no white flash)
            // All RGB components should be < 100 for dark theme
            expect(current[0]).to.be.lessThan(100)
            expect(current[1]).to.be.lessThan(100)
            expect(current[2]).to.be.lessThan(100)
          }
        })
      })
    })

    it('should not show persistent background change after clicking', () => {
      cy.get('#header-heatmap').parent('.layer-toggle').as('container')
      cy.get('#header-heatmap').as('checkbox')

      // Click checkbox
      cy.get('@checkbox').click()

      // Wait a moment for any transitions
      cy.wait(100)

      // After click completes, should not have layer-enabled or layer-disabled classes
      cy.get('@container').should('not.have.class', 'layer-enabled')
      cy.get('@container').should('not.have.class', 'layer-disabled')

      // Background should return to normal state (hover effects are OK, but not persistent)
      // The key is that there should be no persistent visual state change
      cy.get('@container').then($el => {
        const classes = $el.attr('class') || ''
        // Ensure no animation or feedback classes are present
        expect(classes).to.not.match(/layer-(enabled|disabled|active|animating)/)
      })
    })
  })

  describe('Container vs Checkbox Click Behavior', () => {
    it('should behave identically whether clicking checkbox or container', () => {
      cy.get('#header-heatmap').as('checkbox')
      cy.get('#header-bubblemap').as('otherCheckbox')
      cy.get('#header-heatmap').parent('.layer-toggle').as('container')
      cy.get('#header-bubblemap').parent('.layer-toggle').as('otherContainer')

      // Test 1: Click checkbox directly
      cy.get('@checkbox').should('be.checked')
      cy.get('@checkbox').click()
      cy.get('@checkbox').should('not.be.checked')

      // Test 2: Click container (should toggle the checkbox the same way)
      cy.get('@otherCheckbox').should('not.be.checked')
      cy.get('@otherContainer').click()
      cy.get('@otherCheckbox').should('be.checked')
    })

    it('should prevent double-toggle when clicking checkbox (not container)', () => {
      cy.get('#header-heatmap').as('checkbox')

      // Get initial state
      cy.get('@checkbox').invoke('prop', 'checked').then(initialState => {
        // Click the checkbox element directly
        cy.get('@checkbox').click()

        // Should be opposite of initial state (single toggle)
        cy.get('@checkbox').should(initialState ? 'not.be.checked' : 'be.checked')
      })
    })
  })

  describe('No Unintended Side Effects', () => {
    it('should not modify checkbox state when clicking label for attribute', () => {
      // The label's "for" attribute should handle this natively
      cy.get('label[for="header-heatmap"]').as('label')
      cy.get('#header-heatmap').as('checkbox')

      cy.get('@checkbox').should('be.checked')

      // Click label
      cy.get('@label').click()

      // Checkbox should toggle
      cy.get('@checkbox').should('not.be.checked')

      // Click label again
      cy.get('@label').click()

      // Checkbox should toggle back
      cy.get('@checkbox').should('be.checked')
    })

    it('should not leave residual animation classes after interaction', () => {
      cy.get('#header-heatmap').parent('.layer-toggle').as('container')
      cy.get('#header-heatmap').as('checkbox')

      // Click checkbox
      cy.get('@checkbox').click()

      // Wait for any animations to complete
      cy.wait(500)

      // Container should have no animation/feedback classes
      cy.get('@container').then($el => {
        const classes = $el.attr('class')
        expect(classes).to.not.include('layer-enabled')
        expect(classes).to.not.include('layer-disabled')
        expect(classes).to.not.include('animating')
        expect(classes).to.not.include('transitioning')
      })
    })
  })
})
