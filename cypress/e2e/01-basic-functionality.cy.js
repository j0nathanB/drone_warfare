describe('Drone Warfare Visualization - Basic Functionality', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should load the page and display the map immediately', () => {
    // Check that essential elements are present
    cy.get('#map').should('be.visible')
    cy.get('[data-cy="statistics-panel"]').should('be.visible')
    cy.get('[data-cy="breadcrumbs"]').should('be.visible')
    
    // Verify page title
    cy.title().should('contain', 'Drone Warfare')
  })

  it('should show loading overlay initially then hide it', () => {
    // Loading overlay should be visible initially
    cy.get('.loading-overlay').should('be.visible')
    
    // Wait for data to load and overlay to disappear
    cy.waitForDataLoading()
    
    // Map should be functional after loading
    cy.waitForMap()
  })

  it('should initialize Leaflet map with correct view', () => {
    cy.waitForMap()
    
    // Verify map container is properly sized
    cy.get('#map').should('have.css', 'height').and('not.equal', '0px')
    
    // Check that Leaflet is loaded
    cy.window().its('L').should('exist')
    cy.window().its('map').should('exist')
  })

  it('should display statistics panel with initial values', () => {
    cy.waitForDataLoading()
    
    // Statistics should be visible and contain data
    cy.get('[data-cy="statistics-panel"]').within(() => {
      cy.contains('Total Strikes').should('be.visible')
      cy.contains('Total Killed').should('be.visible')
      cy.contains('Civilians Killed').should('be.visible')
      cy.contains('Children Killed').should('be.visible')
    })
  })

  it('should have responsive design elements', () => {
    // Test desktop layout
    cy.viewport(1280, 720)
    cy.get('.app-container').should('be.visible')
    
    // Test tablet layout  
    cy.viewport('ipad-2')
    cy.get('.app-container').should('be.visible')
    
    // Test mobile layout
    cy.checkMobileViewport()
    cy.get('.app-container').should('be.visible')
  })

  it('should load without JavaScript errors', () => {
    cy.window().then((win) => {
      cy.on('window:error', (err) => {
        throw new Error(`JavaScript error: ${err.message}`)
      })
    })
    
    cy.waitForDataLoading()
    cy.waitForMap()
  })
})