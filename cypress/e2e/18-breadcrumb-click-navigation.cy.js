/**
 * Test Suite: Breadcrumb Click Navigation
 *
 * Purpose: Verify that clicking breadcrumbs navigates TO that level, not BACK to parent
 *
 * Test Scenario:
 * - Navigate: Global → Afghanistan → Badakhshan
 * - Click "Afghanistan" breadcrumb
 * - Expected: Should show Afghanistan (admLevel 1) with provinces
 * - Bug: Currently resets to Global (admLevel 0)
 */

describe('Breadcrumb Click Navigation', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForMap();
  });

  it('should navigate TO Afghanistan when clicking Afghanistan breadcrumb from province level', () => {
    // Navigate to Afghanistan -> Badakhshan
    cy.get('[data-cy="region-AFG"]').click();
    cy.wait(500);

    // Verify we're at country level (Afghanistan)
    cy.get('[data-cy="breadcrumb-country"]').should('contain', 'Afghanistan');
    cy.window().then(win => {
      expect(win.appState.admLevel).to.equal(1);
      expect(win.appState.country).to.equal('AFG');
    });

    // Click on a province (e.g., Badakhshan)
    cy.get('[data-cy^="region-"]').first().click();
    cy.wait(500);

    // Verify we're at province level
    cy.get('[data-cy="breadcrumb-region"]').should('exist');
    cy.window().then(win => {
      expect(win.appState.admLevel).to.equal(2);
      expect(win.appState.country).to.equal('AFG');
      cy.log(`Before click: admLevel=${win.appState.admLevel}, country=${win.appState.country}`);
    });

    // Now click the "Afghanistan" breadcrumb
    cy.get('[data-cy="breadcrumb-country"]').click();
    cy.wait(500);

    // Expected: Should be at Afghanistan country level (admLevel 1)
    cy.window().then(win => {
      cy.log(`After click: admLevel=${win.appState.admLevel}, country=${win.appState.country}`);
      expect(win.appState.admLevel, 'admLevel should be 1 (country level)').to.equal(1);
      expect(win.appState.country, 'country should be AFG').to.equal('AFG');
    });

    // Should show Afghanistan's provinces in the table
    cy.get('.data-table tbody tr').should('have.length.greaterThan', 1);

    // Breadcrumbs should show: Global → Afghanistan
    cy.get('[data-cy="breadcrumb-global"]').should('exist');
    cy.get('[data-cy="breadcrumb-country"]').should('contain', 'Afghanistan');
    cy.get('[data-cy="breadcrumb-region"]').should('not.exist');

    // Location header should show "Afghanistan"
    cy.get('[data-cy="location-header"]').should('contain', 'Afghanistan');
  });

  it('should navigate TO province when clicking province breadcrumb from district level (Pakistan)', () => {
    // Navigate to Pakistan -> Punjab -> A district
    cy.get('[data-cy="region-PAK"]').click();
    cy.wait(500);

    // Click on Punjab province
    cy.get('[data-cy^="region-"]').contains('Punjab').click();
    cy.wait(500);

    // Verify we're at province level
    cy.get('[data-cy="breadcrumb-region"]').should('contain', 'Punjab');

    // Click on a district
    cy.get('[data-cy^="region-"]').first().click();
    cy.wait(500);

    // Verify we're at district level (admLevel 3 for Pakistan)
    cy.get('[data-cy^="breadcrumb-level-"]').should('exist');

    // Now click the "Punjab" breadcrumb
    cy.get('[data-cy="breadcrumb-region"]').click();
    cy.wait(500);

    // Expected: Should be at Punjab province level (admLevel 2)
    cy.verifyAppState({
      admLevel: 2,
      country: 'PAK',
      admName: 'Punjab'
    });

    // Should show Punjab's districts in the table
    cy.get('.data-table tbody tr').should('have.length.greaterThan', 1);

    // Breadcrumbs should show: Global → Pakistan → Punjab
    cy.get('[data-cy="breadcrumb-global"]').should('exist');
    cy.get('[data-cy="breadcrumb-country"]').should('contain', 'Pakistan');
    cy.get('[data-cy="breadcrumb-region"]').should('contain', 'Punjab');
    cy.get('[data-cy^="breadcrumb-level-3"]').should('not.exist');
  });

  it('should navigate TO country when clicking country breadcrumb from province level', () => {
    // Navigate to Yemen -> A province
    cy.get('[data-cy="region-YEM"]').click();
    cy.wait(500);

    cy.get('[data-cy^="region-"]').first().click();
    cy.wait(500);

    // Click "Yemen" breadcrumb
    cy.get('[data-cy="breadcrumb-country"]').click();
    cy.wait(500);

    // Expected: Should be at Yemen country level (admLevel 1)
    cy.verifyAppState({
      admLevel: 1,
      country: 'YEM'
    });

    // Breadcrumbs should show: Global → Yemen (no province)
    cy.get('[data-cy="breadcrumb-global"]').should('exist');
    cy.get('[data-cy="breadcrumb-country"]').should('contain', 'Yemen');
    cy.get('[data-cy="breadcrumb-region"]').should('not.exist');
  });

  it('should navigate to Global when clicking Global breadcrumb from any level', () => {
    // Navigate to Somalia -> A province
    cy.get('[data-cy="region-SOM"]').click();
    cy.wait(500);

    cy.get('[data-cy^="region-"]').first().click();
    cy.wait(500);

    // Click "Global" breadcrumb
    cy.get('[data-cy="breadcrumb-global"]').click();
    cy.wait(500);

    // Expected: Should be at global level (admLevel 0)
    cy.verifyAppState({
      admLevel: 0,
      country: null
    });

    // Should show all 4 countries
    cy.get('.data-table tbody tr').should('have.length', 4);

    // Breadcrumbs should show only: Global
    cy.get('[data-cy="breadcrumb-global"]').should('exist');
    cy.get('[data-cy="breadcrumb-country"]').should('not.exist');
  });

  it('should correctly display child regions after breadcrumb navigation', () => {
    // Navigate to Afghanistan -> Badakhshan
    cy.get('[data-cy="region-AFG"]').click();
    cy.wait(500);

    // Get the number of provinces in Afghanistan
    let provinceCount;
    cy.get('.data-table tbody tr').its('length').then(count => {
      provinceCount = count;
    });

    cy.get('[data-cy^="region-"]').first().click();
    cy.wait(500);

    // Click Afghanistan breadcrumb
    cy.get('[data-cy="breadcrumb-country"]').click();
    cy.wait(500);

    // Should show the same number of provinces again
    cy.get('.data-table tbody tr').its('length').should('eq', provinceCount);
  });

  it('should maintain correct map bounds after breadcrumb navigation', () => {
    // Navigate to Pakistan
    cy.get('[data-cy="region-PAK"]').click();
    cy.wait(500);

    // Navigate to a province
    cy.get('[data-cy^="region-"]').first().click();
    cy.wait(500);

    // Click Pakistan breadcrumb
    cy.get('[data-cy="breadcrumb-country"]').click();
    cy.wait(500);

    // Map should be zoomed to Pakistan bounds (not global)
    cy.window().then(win => {
      const map = win.appState.map.map;
      const bounds = map.getBounds();

      // Pakistan should be visible in bounds (rough check)
      // Pakistan coordinates roughly: 60-77°E, 23-37°N
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      expect(ne.lng).to.be.greaterThan(60);
      expect(sw.lng).to.be.lessThan(77);
      expect(ne.lat).to.be.greaterThan(23);
      expect(sw.lat).to.be.lessThan(37);
    });
  });
});
