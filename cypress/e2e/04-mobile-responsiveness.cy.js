describe('Drone Warfare Visualization - Mobile Responsiveness', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should display properly on mobile devices', () => {
    cy.checkMobileViewport()
    cy.waitForDataLoading()
    
    // All main elements should be visible on mobile
    cy.get('#map').should('be.visible')
    cy.get('[data-cy="statistics-panel"]').should('be.visible')
    cy.get('[data-cy="breadcrumbs"]').should('be.visible')
    
    // Map should take appropriate space on mobile
    cy.get('#map').should('have.css', 'height').and('not.equal', '0px')
  })

  it('should have touch-friendly controls on mobile', () => {
    cy.checkMobileViewport()
    cy.waitForMap()
    
    // Zoom controls should be large enough for touch
    cy.get('.leaflet-control-zoom-in').then(($btn) => {
      const rect = $btn[0].getBoundingClientRect()
      expect(rect.width).to.be.at.least(44) // WCAG minimum touch target
      expect(rect.height).to.be.at.least(44)
    })
    
    cy.get('.leaflet-control-zoom-out').then(($btn) => {
      const rect = $btn[0].getBoundingClientRect()
      expect(rect.width).to.be.at.least(44)
      expect(rect.height).to.be.at.least(44)
    })
  })

  it('should support touch gestures for map interaction', () => {
    cy.checkMobileViewport()
    cy.waitForMap()
    
    // Test touch pan
    cy.get('#map')
      .trigger('touchstart', { touches: [{ pageX: 200, pageY: 200 }] })
      .trigger('touchmove', { touches: [{ pageX: 250, pageY: 250 }] })
      .trigger('touchend')
    
    // Map should still be functional after touch interaction
    cy.get('#map').should('be.visible')
    cy.window().its('map').should('exist')
  })

  it('should adapt layout for different mobile orientations', () => {
    // Test portrait orientation
    cy.viewport(375, 812) // iPhone X portrait
    cy.waitForDataLoading()
    
    cy.get('.app-container').should('be.visible')
    cy.get('#map').should('be.visible')
    
    // Test landscape orientation
    cy.viewport(812, 375) // iPhone X landscape
    cy.wait(500) // Allow layout adjustment
    
    cy.get('.app-container').should('be.visible')
    cy.get('#map').should('be.visible')
    cy.get('[data-cy="statistics-panel"]').should('be.visible')
  })

  it('should handle statistics panel on mobile', () => {
    cy.checkMobileViewport()
    cy.waitForDataLoading()
    
    // Statistics panel should be visible and readable
    cy.get('[data-cy="statistics-panel"]').should('be.visible')
    
    // Text should not be too small
    cy.get('[data-cy="statistics-panel"]').within(() => {
      cy.get('*').each(($el) => {
        const fontSize = parseFloat(window.getComputedStyle($el[0]).fontSize)
        if (fontSize > 0) {
          expect(fontSize).to.be.at.least(14) // Minimum readable size
        }
      })
    })
  })

  it('should maintain functionality across tablet sizes', () => {
    // Test iPad dimensions
    cy.viewport('ipad-2')
    cy.waitForDataLoading()
    cy.waitForMap()
    
    // All functionality should work on tablet
    cy.get('#map').should('be.visible')
    cy.get('[data-cy="statistics-panel"]').should('be.visible')
    
    // Test map interaction on tablet
    cy.get('.leaflet-control-zoom-in').click()
    cy.wait(500)
    
    // Interactive elements should still work
    cy.get('.leaflet-interactive').first().click({ force: true })
    cy.wait(1000)
    
    cy.get('[data-cy="breadcrumbs"]').should('contain.text', 'Afghanistan')
  })

  it('should handle small mobile screens efficiently', () => {
    // Test on very small screen (iPhone SE)
    cy.viewport(320, 568)
    cy.waitForDataLoading()
    
    // Content should not overflow
    cy.get('body').then(($body) => {
      expect($body[0].scrollWidth).to.be.at.most($body[0].clientWidth + 5) // Allow small rounding
    })
    
    // Essential elements should still be accessible
    cy.get('#map').should('be.visible')
    cy.get('[data-cy="statistics-panel"]').should('be.visible')
  })

  it('should prevent text from being too small on mobile', () => {
    cy.checkMobileViewport()
    cy.waitForDataLoading()
    
    // Check that important text is large enough to read
    cy.get('[data-cy="statistics-panel"]').within(() => {
      cy.contains('Total Strikes').should('have.css', 'font-size').then((fontSize) => {
        expect(parseFloat(fontSize)).to.be.at.least(14)
      })
    })
    
    cy.get('[data-cy="breadcrumbs"]').within(() => {
      cy.get('*').each(($el) => {
        if ($el.text().trim()) {
          cy.wrap($el).should('have.css', 'font-size').then((fontSize) => {
            expect(parseFloat(fontSize)).to.be.at.least(14)
          })
        }
      })
    })
  })

  it('should handle rapid orientation changes', () => {
    cy.waitForDataLoading()
    
    // Start in portrait
    cy.viewport(375, 812)
    cy.wait(500)
    
    // Switch to landscape
    cy.viewport(812, 375)
    cy.wait(500)
    
    // Switch back to portrait
    cy.viewport(375, 812)
    cy.wait(500)
    
    // App should remain stable and functional
    cy.get('#map').should('be.visible')
    cy.get('[data-cy="statistics-panel"]').should('be.visible')
    cy.waitForMap()
  })
})