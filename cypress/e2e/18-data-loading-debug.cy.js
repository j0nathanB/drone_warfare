describe('Data Loading Debug', () => {
  it('should load the page and check for JavaScript errors', () => {
    let consoleErrors = [];
    let consoleLogs = [];

    // Capture console errors and logs
    cy.on('window:before:load', (win) => {
      cy.stub(win.console, 'error').callsFake((...args) => {
        consoleErrors.push(args.join(' '));
      });
      cy.stub(win.console, 'log').callsFake((...args) => {
        consoleLogs.push(args.join(' '));
      });
    });

    // Visit the page
    cy.visit('/', {
      timeout: 30000,
      onBeforeLoad(win) {
        // Capture unhandled errors
        win.addEventListener('error', (e) => {
          consoleErrors.push(`Uncaught error: ${e.message}`);
        });
      }
    });

    // Wait for loading screen to disappear
    cy.get('#loadingScreen', { timeout: 30000 }).should('not.be.visible');

    // Check if data loaded
    cy.window().then((win) => {
      // Check if appState exists
      expect(win.appState, 'appState should exist').to.exist;

      // Check if geojson data loaded
      if (win.appState.geojson) {
        cy.log('GeoJSON data loaded:', Object.keys(win.appState.geojson));

        // Check each country
        ['AFG', 'PAK', 'SOM', 'YEM'].forEach(country => {
          expect(win.appState.geojson[country], `${country} data should exist`).to.exist;
        });
      } else {
        throw new Error('appState.geojson is not loaded');
      }

      // Check strike visualization
      if (win.appState.strikeVisualization) {
        const strikeData = win.appState.strikeVisualization.allStrikes;
        cy.log(`Total strikes loaded: ${strikeData.length}`);
        expect(strikeData.length, 'Should have strike data').to.be.greaterThan(0);
      } else {
        throw new Error('strikeVisualization is not initialized');
      }

      // Log console output
      cy.log('=== Console Logs ===');
      consoleLogs.forEach(log => cy.log(log));

      // Log any console errors
      if (consoleErrors.length > 0) {
        cy.log('Console errors detected:');
        consoleErrors.forEach(err => cy.log(err));
        throw new Error(`Console errors detected: ${consoleErrors.join('\n')}`);
      }
    });

    // Check if statistics are displayed
    cy.get('[data-cy="total-strikes"]').then($el => {
      const strikeCount = $el.text();
      cy.log(`Strike count displayed: ${strikeCount}`);
      expect(parseInt(strikeCount.replace(/,/g, '')) || 0).to.be.greaterThan(0);
    });
  });

  it('should display strike points on the map', () => {
    cy.visit('/', { timeout: 30000 });
    cy.get('#loadingScreen', { timeout: 30000 }).should('not.be.visible');

    // Check if strikes checkbox is checked
    cy.get('#strikes').should('be.checked');

    // Check if strike markers exist on the map
    cy.window().then((win) => {
      const strikeLayer = win.appState.strikeVisualization.layers.strikes;
      const layerCount = strikeLayer.getLayers().length;
      cy.log(`Strike markers on map: ${layerCount}`);
      expect(layerCount, 'Should have strike markers').to.be.greaterThan(0);
    });
  });
});
