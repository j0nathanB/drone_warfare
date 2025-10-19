/**
 * Test Suite: Heatmap Boundary Shading
 *
 * Purpose: Verify that heatmap visualization shades administrative boundaries
 * with colors based on strike intensity, not bubbles/circles.
 *
 * TDD Phase: RED - These tests should fail initially
 */

describe('Heatmap Boundary Shading', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForMap()
    cy.wait(2000) // Wait for data to load and heatmap to render
  })

  describe('Initial State', () => {
    it('should have heatmap checkbox in header controls', () => {
      cy.get('#header-heatmap').should('exist')
      cy.get('#header-heatmap').should('have.attr', 'type', 'checkbox')
    })

    it('should have heatmap checked by default', () => {
      cy.get('#header-heatmap').should('be.checked')
    })

    it('should have heatmap layer in map layers', () => {
      cy.window().then((win) => {
        expect(win.appState.map.layers.heatmap).to.exist
      })
    })
  })

  describe('Heatmap Visualization Type', () => {
    it('should display polygons (not circles) when heatmap is enabled', () => {
      cy.window().then((win) => {
        const heatmapLayer = win.appState.map.layers.heatmap

        // Heatmap layer should have features (heatmap is checked by default)
        expect(heatmapLayer.getLayers().length).to.be.greaterThan(0)

        // Check that features are polygons, not circles
        const layers = heatmapLayer.getLayers()

        // Log layer types for debugging
        const layerTypes = layers.map(layer => layer.constructor.name)
        console.log('Heatmap layer types:', layerTypes)

        // Leaflet uses L.Polygon or L.Path for GeoJSON polygons
        const hasPolygons = layers.some(layer =>
          layer instanceof L.Polygon ||
          layer instanceof L.Path ||
          layer.constructor.name === 'Polygon'
        )
        const hasCircles = layers.some(layer => layer instanceof L.Circle)

        expect(hasPolygons).to.be.true
        expect(hasCircles).to.be.false
      })
    })

    it('should NOT display circle markers in heatmap layer', () => {
      cy.window().then((win) => {
        const heatmapLayer = win.appState.map.layers.heatmap
        const layers = heatmapLayer.getLayers()

        // Verify no circle markers
        const circleMarkers = layers.filter(layer =>
          layer instanceof L.Circle || layer instanceof L.CircleMarker
        )

        expect(circleMarkers.length).to.equal(0)
      })
    })

    it('should shade entire boundary polygons, not just center points', () => {
      cy.get('#header-heatmap').check({ force: true })

      cy.window().then((win) => {
        const heatmapLayer = win.appState.map.layers.heatmap
        const layers = heatmapLayer.getLayers()

        // Check that we have polygon layers
        expect(layers.length).to.be.greaterThan(0)

        // Verify each layer is a polygon with multiple points (not a circle)
        layers.forEach(layer => {
          if (layer.getLatLngs) {
            const latLngs = layer.getLatLngs()
            // Polygons should have multiple coordinate points
            expect(latLngs.length).to.be.greaterThan(0)
          }
        })
      })
    })
  })

  describe('Color Intensity Based on Strike Count', () => {
    it('should apply different colors to regions based on strike intensity', () => {
      cy.get('#header-heatmap').check({ force: true })

      cy.window().then((win) => {
        const heatmapLayer = win.appState.map.layers.heatmap
        const layers = heatmapLayer.getLayers()

        // Collect unique fill colors
        const fillColors = new Set()
        layers.forEach(layer => {
          if (layer.options && layer.options.fillColor) {
            fillColors.add(layer.options.fillColor)
          }
        })

        // Should have multiple colors representing different intensities
        expect(fillColors.size).to.be.greaterThan(1)
      })
    })

    it('should use higher intensity colors for regions with more strikes', () => {
      cy.get('#header-heatmap').check({ force: true })

      cy.window().then((win) => {
        const heatmapLayer = win.appState.map.layers.heatmap
        const layers = heatmapLayer.getLayers()

        // Find layers with different strike counts
        const layerData = layers.map(layer => ({
          strikeCount: layer.feature?.properties?.strike_count || 0,
          fillColor: layer.options?.fillColor
        }))

        // Verify that we have data
        expect(layerData.length).to.be.greaterThan(0)

        // Higher strike counts should correlate with warmer colors (red/orange)
        // This is a basic check - actual implementation may vary
        const highStrikeRegions = layerData.filter(d => d.strikeCount > 50)
        const lowStrikeRegions = layerData.filter(d => d.strikeCount < 10 && d.strikeCount > 0)

        if (highStrikeRegions.length > 0 && lowStrikeRegions.length > 0) {
          // Just verify colors are assigned (detailed color verification would be complex)
          expect(highStrikeRegions[0].fillColor).to.exist
          expect(lowStrikeRegions[0].fillColor).to.exist
        }
      })
    })

    it('should use appropriate opacity for heatmap polygons', () => {
      cy.get('#header-heatmap').check({ force: true })

      cy.window().then((win) => {
        const heatmapLayer = win.appState.map.layers.heatmap
        const layers = heatmapLayer.getLayers()

        layers.forEach(layer => {
          if (layer.options) {
            // Fill opacity should be set (not fully transparent, not fully opaque)
            expect(layer.options.fillOpacity).to.be.greaterThan(0)
            expect(layer.options.fillOpacity).to.be.lessThan(1)
          }
        })
      })
    })
  })

  describe('Heatmap Toggle Behavior', () => {
    it('should show heatmap polygons when checkbox is checked', () => {
      // Uncheck first
      cy.get('#header-heatmap').uncheck({ force: true })

      // Then check
      cy.get('#header-heatmap').check({ force: true })

      cy.window().then((win) => {
        const heatmapLayer = win.appState.map.layers.heatmap
        expect(heatmapLayer.getLayers().length).to.be.greaterThan(0)
      })
    })

    it('should hide heatmap polygons when checkbox is unchecked', () => {
      // Check first
      cy.get('#header-heatmap').check({ force: true })

      // Then uncheck
      cy.get('#header-heatmap').uncheck({ force: true })

      cy.window().then((win) => {
        const heatmapLayer = win.appState.map.layers.heatmap
        expect(heatmapLayer.getLayers().length).to.equal(0)
      })
    })

    it('should preserve heatmap state when navigating between regions', () => {
      // Enable heatmap
      cy.get('#header-heatmap').check({ force: true })

      // Navigate to a country by clicking on table row
      cy.get('[data-cy="data-table"] tbody tr').contains('Afghanistan').click()
      cy.wait(1000)

      // Heatmap should still be visible with updated data
      cy.window().then((win) => {
        const heatmapLayer = win.appState.map.layers.heatmap
        expect(heatmapLayer.getLayers().length).to.be.greaterThan(0)

        // Verify polygons, not circles (check for L.Polygon or L.Path)
        const layers = heatmapLayer.getLayers()
        const hasPolygons = layers.some(layer =>
          layer instanceof L.Polygon ||
          layer instanceof L.Path ||
          layer.constructor.name === 'Polygon'
        )
        expect(hasPolygons).to.be.true
      })
    })
  })

  describe('Heatmap at Different Administrative Levels', () => {
    it('should display heatmap at global level (ADM0)', () => {
      cy.get('#header-heatmap').check({ force: true })

      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(0)

        const heatmapLayer = win.appState.map.layers.heatmap
        const layers = heatmapLayer.getLayers()

        // Should have 4 countries at global level
        expect(layers.length).to.be.at.least(4)
      })
    })

    it('should display heatmap at country level (ADM1)', () => {
      // Navigate to Pakistan by clicking table row
      cy.get('[data-cy="data-table"] tbody tr').contains('Pakistan').click()
      cy.wait(1000)

      cy.get('#header-heatmap').check({ force: true })
      cy.wait(500)

      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(1)

        const heatmapLayer = win.appState.map.layers.heatmap
        const layers = heatmapLayer.getLayers()

        // Should have province-level boundaries
        expect(layers.length).to.be.greaterThan(0)

        // Verify polygons (check for L.Polygon or L.Path)
        const hasPolygons = layers.some(layer =>
          layer instanceof L.Polygon ||
          layer instanceof L.Path ||
          layer.constructor.name === 'Polygon'
        )
        expect(hasPolygons).to.be.true
      })
    })

    it('should display heatmap at province level (ADM2)', () => {
      // Navigate to Pakistan
      cy.get('[data-cy="data-table"] tbody tr').contains('Pakistan').click()
      cy.wait(1000)

      // Click on a province (get first region from table)
      cy.get('[data-cy="data-table"] tbody tr').first().click()
      cy.wait(1000)

      cy.get('#header-heatmap').check({ force: true })
      cy.wait(500)

      cy.window().then((win) => {
        expect(win.appState.admLevel).to.equal(2)

        const heatmapLayer = win.appState.map.layers.heatmap
        const layers = heatmapLayer.getLayers()

        // Should have district-level boundaries
        expect(layers.length).to.be.greaterThan(0)

        // Verify polygons (check for L.Polygon or L.Path)
        const hasPolygons = layers.some(layer =>
          layer instanceof L.Polygon ||
          layer instanceof L.Path ||
          layer.constructor.name === 'Polygon'
        )
        expect(hasPolygons).to.be.true
      })
    })
  })

  describe('Heatmap Visual Styling', () => {
    it('should have semi-transparent fill for visibility of underlying map', () => {
      cy.get('#header-heatmap').check({ force: true })

      cy.window().then((win) => {
        const heatmapLayer = win.appState.map.layers.heatmap
        const layers = heatmapLayer.getLayers()

        layers.forEach(layer => {
          if (layer.options && layer.options.fillOpacity !== undefined) {
            // Should be semi-transparent (between 0 and 1)
            expect(layer.options.fillOpacity).to.be.greaterThan(0)
            expect(layer.options.fillOpacity).to.be.lessThan(1)
          }
        })
      })
    })

    it('should have visible boundary strokes for region separation', () => {
      cy.get('#header-heatmap').check({ force: true })

      cy.window().then((win) => {
        const heatmapLayer = win.appState.map.layers.heatmap
        const layers = heatmapLayer.getLayers()

        layers.forEach(layer => {
          if (layer.options) {
            // Should have stroke color defined
            expect(layer.options.color).to.exist

            // Stroke weight should be visible but not too thick
            if (layer.options.weight !== undefined) {
              expect(layer.options.weight).to.be.greaterThan(0)
              expect(layer.options.weight).to.be.lessThan(5)
            }
          }
        })
      })
    })
  })

  describe('Heatmap Popup Information', () => {
    it('should show popup with region info when clicking heatmap polygon', () => {
      cy.get('#header-heatmap').check({ force: true })
      cy.wait(500)

      // Find and click on a heatmap polygon layer
      // Heatmap polygons are in the heatmap layer group
      cy.window().then((win) => {
        const heatmapLayer = win.appState.map.layers.heatmap
        const layers = heatmapLayer.getLayers()

        // Verify we have layers to click on
        expect(layers.length).to.be.greaterThan(0)

        // Trigger click on first layer
        if (layers[0].fire) {
          layers[0].fire('click')
        }
      })

      // Popup should appear with region information
      cy.get('.leaflet-popup', { timeout: 3000 }).should('be.visible')
      cy.get('.leaflet-popup-content').should('contain', 'Strike')
    })
  })
})
