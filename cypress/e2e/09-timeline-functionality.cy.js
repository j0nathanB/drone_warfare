describe('Timeline Functionality', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForMap()
  })

  describe('Timeline UI Components', () => {
    it('should have timeline container with bars', () => {
      // Switch to timeline view mode
      cy.get('[data-cy="timeline-view-btn"]').click()
      
      // Timeline container should be visible
      cy.get('[data-cy="timeline-container"]').should('be.visible')
      
      // Should have timeline bars for years 2004-2020
      cy.get('[data-cy="timeline-bars"]').should('exist')
      cy.get('[data-cy="timeline-bar"]').should('have.length', 17) // 2004-2020 = 17 years
      
      // Each bar should have year data attribute
      cy.get('[data-cy="timeline-bar"]').first().should('have.attr', 'data-year', '2004')
      cy.get('[data-cy="timeline-bar"]').last().should('have.attr', 'data-year', '2020')
    })

    it('should have timeline control buttons', () => {
      cy.get('[data-cy="timeline-view-btn"]').click()
      
      // Play/pause button should exist
      cy.get('[data-cy="play-btn"]').should('exist')
      cy.get('[data-cy="play-btn"]').should('contain.text', 'Play')
      
      // Reset button should exist
      cy.get('[data-cy="reset-timeline-btn"]').should('exist')
    })
  })

  describe('Timeline Interactions', () => {
    it('should select year when clicking timeline bar', () => {
      cy.get('[data-cy="timeline-view-btn"]').click()
      
      // Click on 2010 bar
      cy.get('[data-cy="timeline-bar"][data-year="2010"]').click()
      
      // Should update statistics for selected year
      cy.get('[data-cy="timeline-selected-year"]').should('contain.text', '2010')
      
      // Statistics should be filtered for 2010
      cy.get('[data-cy="total-strikes"]').should('not.contain.text', '0')
      
      // Selected bar should be highlighted
      cy.get('[data-cy="timeline-bar"][data-year="2010"]').should('have.class', 'selected')
    })

    it('should play timeline animation', () => {
      cy.get('[data-cy="timeline-view-btn"]').click()
      
      // Click play button
      cy.get('[data-cy="play-btn"]').click()
      
      // Button text should change to pause
      cy.get('[data-cy="play-btn"]').should('contain.text', 'Pause')
      
      // Should animate through years (wait for at least 2 changes)
      cy.get('[data-cy="timeline-selected-year"]').should('contain.text', '2004')
      cy.wait(1100) // Wait slightly more than 1 second for next year
      cy.get('[data-cy="timeline-selected-year"]').should('contain.text', '2005')
      
      // Click pause
      cy.get('[data-cy="play-btn"]').click()
      cy.get('[data-cy="play-btn"]').should('contain.text', 'Play')
    })

    it('should reset timeline to show all years', () => {
      cy.get('[data-cy="timeline-view-btn"]').click()
      
      // Select a specific year
      cy.get('[data-cy="timeline-bar"][data-year="2015"]').click()
      cy.get('[data-cy="timeline-selected-year"]').should('contain.text', '2015')
      
      // Reset timeline
      cy.get('[data-cy="reset-timeline-btn"]').click()
      
      // Should show all years data
      cy.get('[data-cy="timeline-selected-year"]').should('contain.text', 'All Years')
      
      // No bar should be selected
      cy.get('[data-cy="timeline-bar"].selected').should('not.exist')
    })
  })

  describe('Timeline Data Integration', () => {
    it('should update map visualization when year is selected', () => {
      cy.get('[data-cy="timeline-view-btn"]').click()
      
      // Select 2008
      cy.get('[data-cy="timeline-bar"][data-year="2008"]').click()
      
      // Map should update to show only 2008 data
      // This would be verified by checking strike markers or heatmap
      cy.get('[data-cy="timeline-selected-year"]').should('contain.text', '2008')
      
      // Statistics should reflect 2008 data only
      cy.get('[data-cy="total-strikes"]').then(($el) => {
        const strikesFor2008 = parseInt($el.text().replace(/,/g, ''))
        expect(strikesFor2008).to.be.greaterThan(0)
        expect(strikesFor2008).to.be.lessThan(1000) // Should be subset of total
      })
    })

    it('should show strike data for each year in timeline bars', () => {
      cy.get('[data-cy="timeline-view-btn"]').click()
      
      // Timeline bars should have varying heights based on strike data
      cy.get('[data-cy="timeline-bar"]').each(($bar) => {
        const year = $bar.attr('data-year')
        const height = $bar.css('height')
        
        // Each bar should have a tooltip showing strike count
        cy.wrap($bar).trigger('mouseover')
        cy.get('[data-cy="timeline-tooltip"]').should('contain.text', year)
        cy.get('[data-cy="timeline-tooltip"]').should('contain.text', 'strikes')
      })
    })
  })

  describe('Timeline View Mode Integration', () => {
    it('should switch between map and timeline views', () => {
      // Start in map view
      cy.get('[data-cy="map-view-btn"]').should('have.class', 'active')
      cy.get('[data-cy="timeline-container"]').should('not.be.visible')
      
      // Switch to timeline view
      cy.get('[data-cy="timeline-view-btn"]').click()
      cy.get('[data-cy="timeline-view-btn"]').should('have.class', 'active')
      cy.get('[data-cy="map-view-btn"]').should('not.have.class', 'active')
      cy.get('[data-cy="timeline-container"]').should('be.visible')
      
      // Switch back to map view
      cy.get('[data-cy="map-view-btn"]').click()
      cy.get('[data-cy="map-view-btn"]').should('have.class', 'active')
      cy.get('[data-cy="timeline-container"]').should('not.be.visible')
    })
  })
})