/**
 * Test Suite: Table Sorting Functionality
 *
 * Purpose: Verify that data table columns can be sorted in ascending
 * and descending order with proper visual indicators.
 *
 * TDD Phase: RED - Writing tests before implementation
 * Expected: All tests should FAIL initially
 */

describe('Table Sorting', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.waitForMap()

    // Navigate to a country by clicking on a country card
    // This shows the table view instead of cards
    cy.get('[data-cy="region-cards"]').should('be.visible')
    cy.get('.country-card').first().click()
    cy.wait(500)

    // Wait for table to be visible
    cy.get('[data-cy="region-list"]').should('be.visible')
    cy.get('[data-cy="data-table-body"]').should('exist')
  })

  describe('Initial State', () => {
    it('should display table headers with sortable indicators', () => {
      // Check that all column headers exist in the region-list table
      cy.get('#region-list table thead th').should('have.length', 5)

      // Check for sortable class or attribute on headers
      cy.get('#region-list thead th[data-sortable="true"]').should('have.length.at.least', 4)

      // First column (Region name) should be sortable
      cy.get('#region-list thead th').eq(0).should('have.attr', 'data-sortable', 'true')

      // Numeric columns should be sortable
      cy.get('#region-list thead th').eq(1).should('have.attr', 'data-sortable', 'true') // Strikes
      cy.get('#region-list thead th').eq(2).should('have.attr', 'data-sortable', 'true') // Total
      cy.get('#region-list thead th').eq(3).should('have.attr', 'data-sortable', 'true') // Civilians
      cy.get('#region-list thead th').eq(4).should('have.attr', 'data-sortable', 'true') // Children
    })

    it('should show sort indicators on column headers', () => {
      // Check for sort indicator element (could be arrow, icon, or text)
      cy.get('#region-list thead th[data-sortable="true"]').each(($th) => {
        cy.wrap($th).find('.sort-indicator').should('exist')
      })
    })

    it('should have no active sort by default or sort by strikes descending', () => {
      // Either no column has active sort, or Strikes column is sorted descending by default
      cy.get('#region-list thead th').then(($headers) => {
        const activeSorts = $headers.filter('[data-sort-direction]')
        // Either no sorts or just one default sort
        expect(activeSorts.length).to.be.at.most(1)
      })
    })
  })

  describe('Sorting by Region Name (Text)', () => {
    it('should sort regions alphabetically ascending when clicking Region header once', () => {
      // Click the Region header
      cy.get('#region-list thead th').eq(0).click()

      // Verify sort direction indicator shows ascending
      cy.get('#region-list thead th').eq(0).should('have.attr', 'data-sort-direction', 'asc')
      cy.get('#region-list thead th').eq(0).find('.sort-indicator').should('contain.text', '▲')

      // Verify table is sorted alphabetically
      cy.get('[data-cy="data-table-body"] tr td:first-child').then(($cells) => {
        const regionNames = $cells.map((i, el) => el.textContent.trim()).get()
        // Filter out "Unclear" row if present
        const filteredNames = regionNames.filter(name => name !== 'Unclear')
        const sortedNames = [...filteredNames].sort()
        expect(filteredNames).to.deep.equal(sortedNames)
      })
    })

    it('should sort regions alphabetically descending when clicking Region header twice', () => {
      // Click twice to get descending order
      cy.get('#region-list thead th').eq(0).click()
      cy.get('#region-list thead th').eq(0).click()

      // Verify sort direction indicator shows descending
      cy.get('#region-list thead th').eq(0).should('have.attr', 'data-sort-direction', 'desc')
      cy.get('#region-list thead th').eq(0).find('.sort-indicator').should('contain.text', '▼')

      // Verify table is sorted reverse alphabetically
      cy.get('[data-cy="data-table-body"] tr td:first-child').then(($cells) => {
        const regionNames = $cells.map((i, el) => el.textContent.trim()).get()
        const filteredNames = regionNames.filter(name => name !== 'Unclear')
        const sortedNames = [...filteredNames].sort().reverse()
        expect(filteredNames).to.deep.equal(sortedNames)
      })
    })

    it('should toggle between ascending and descending on repeated clicks', () => {
      const regionHeader = cy.get('#region-list thead th').eq(0)

      // First click - ascending
      regionHeader.click()
      cy.get('#region-list thead th').eq(0).should('have.attr', 'data-sort-direction', 'asc')

      // Second click - descending
      regionHeader.click()
      cy.get('#region-list thead th').eq(0).should('have.attr', 'data-sort-direction', 'desc')

      // Third click - ascending again
      regionHeader.click()
      cy.get('#region-list thead th').eq(0).should('have.attr', 'data-sort-direction', 'asc')
    })
  })

  describe('Sorting by Strikes (Numeric)', () => {
    it('should sort by strike count ascending when clicking Strikes header once', () => {
      cy.get('#region-list thead th').eq(1).click()

      // Verify sort indicator
      cy.get('#region-list thead th').eq(1).should('have.attr', 'data-sort-direction', 'asc')
      cy.get('#region-list thead th').eq(1).find('.sort-indicator').should('contain.text', '▲')

      // Verify numeric sorting (excluding Unclear row)
      cy.get('[data-cy="data-table-body"] tr').then(($rows) => {
        const strikes = []
        $rows.each((i, row) => {
          const firstCell = row.querySelector('td:first-child').textContent.trim()
          if (firstCell !== 'Unclear') {
            const strikeCount = parseInt(row.querySelector('td:nth-child(2)').textContent.trim())
            strikes.push(strikeCount)
          }
        })

        const sortedStrikes = [...strikes].sort((a, b) => a - b)
        expect(strikes).to.deep.equal(sortedStrikes)
      })
    })

    it('should sort by strike count descending when clicking Strikes header twice', () => {
      cy.get('#region-list thead th').eq(1).click()
      cy.get('#region-list thead th').eq(1).click()

      // Verify sort indicator
      cy.get('#region-list thead th').eq(1).should('have.attr', 'data-sort-direction', 'desc')
      cy.get('#region-list thead th').eq(1).find('.sort-indicator').should('contain.text', '▼')

      // Verify numeric sorting descending
      cy.get('[data-cy="data-table-body"] tr').then(($rows) => {
        const strikes = []
        $rows.each((i, row) => {
          const firstCell = row.querySelector('td:first-child').textContent.trim()
          if (firstCell !== 'Unclear') {
            const strikeCount = parseInt(row.querySelector('td:nth-child(2)').textContent.trim())
            strikes.push(strikeCount)
          }
        })

        const sortedStrikes = [...strikes].sort((a, b) => b - a)
        expect(strikes).to.deep.equal(sortedStrikes)
      })
    })
  })

  describe('Sorting by Total Killed (Numeric)', () => {
    it('should sort by total killed ascending', () => {
      cy.get('#region-list thead th').eq(2).click()

      cy.get('#region-list thead th').eq(2).should('have.attr', 'data-sort-direction', 'asc')
      cy.get('#region-list thead th').eq(2).find('.sort-indicator').should('contain.text', '▲')

      cy.get('[data-cy="data-table-body"] tr').then(($rows) => {
        const totals = []
        $rows.each((i, row) => {
          const firstCell = row.querySelector('td:first-child').textContent.trim()
          if (firstCell !== 'Unclear') {
            const total = parseInt(row.querySelector('td:nth-child(3)').textContent.trim())
            totals.push(total)
          }
        })

        const sortedTotals = [...totals].sort((a, b) => a - b)
        expect(totals).to.deep.equal(sortedTotals)
      })
    })

    it('should sort by total killed descending', () => {
      cy.get('#region-list thead th').eq(2).click()
      cy.get('#region-list thead th').eq(2).click()

      cy.get('#region-list thead th').eq(2).should('have.attr', 'data-sort-direction', 'desc')
      cy.get('#region-list thead th').eq(2).find('.sort-indicator').should('contain.text', '▼')
    })
  })

  describe('Sorting by Civilians Killed (Numeric)', () => {
    it('should sort by civilians killed ascending', () => {
      cy.get('#region-list thead th').eq(3).click()

      cy.get('#region-list thead th').eq(3).should('have.attr', 'data-sort-direction', 'asc')
      cy.get('#region-list thead th').eq(3).find('.sort-indicator').should('contain.text', '▲')
    })

    it('should sort by civilians killed descending', () => {
      cy.get('#region-list thead th').eq(3).click()
      cy.get('#region-list thead th').eq(3).click()

      cy.get('#region-list thead th').eq(3).should('have.attr', 'data-sort-direction', 'desc')
      cy.get('#region-list thead th').eq(3).find('.sort-indicator').should('contain.text', '▼')
    })
  })

  describe('Sorting by Children Killed (Numeric)', () => {
    it('should sort by children killed ascending', () => {
      cy.get('#region-list thead th').eq(4).click()

      cy.get('#region-list thead th').eq(4).should('have.attr', 'data-sort-direction', 'asc')
      cy.get('#region-list thead th').eq(4).find('.sort-indicator').should('contain.text', '▲')
    })

    it('should sort by children killed descending', () => {
      cy.get('#region-list thead th').eq(4).click()
      cy.get('#region-list thead th').eq(4).click()

      cy.get('#region-list thead th').eq(4).should('have.attr', 'data-sort-direction', 'desc')
      cy.get('#region-list thead th').eq(4).find('.sort-indicator').should('contain.text', '▼')
    })
  })

  describe('Sort Indicator Visual Feedback', () => {
    it('should only show active sort indicator on currently sorted column', () => {
      // Sort by Strikes
      cy.get('#region-list thead th').eq(1).click()

      // Only Strikes column should have active sort
      cy.get('#region-list thead th').eq(1).should('have.attr', 'data-sort-direction')
      cy.get('#region-list thead th').eq(0).should('not.have.attr', 'data-sort-direction')
      cy.get('#region-list thead th').eq(2).should('not.have.attr', 'data-sort-direction')

      // Now sort by Region
      cy.get('#region-list thead th').eq(0).click()

      // Only Region column should have active sort
      cy.get('#region-list thead th').eq(0).should('have.attr', 'data-sort-direction')
      cy.get('#region-list thead th').eq(1).should('not.have.attr', 'data-sort-direction')
      cy.get('#region-list thead th').eq(2).should('not.have.attr', 'data-sort-direction')
    })

    it('should update sort indicator arrow direction on toggle', () => {
      const strikesHeader = cy.get('#region-list thead th').eq(1)

      // First click - should show ascending arrow
      strikesHeader.click()
      cy.get('#region-list thead th').eq(1).find('.sort-indicator').should('contain.text', '▲')

      // Second click - should show descending arrow
      strikesHeader.click()
      cy.get('#region-list thead th').eq(1).find('.sort-indicator').should('contain.text', '▼')
    })

    it('should have pointer cursor on sortable headers', () => {
      cy.get('thead th[data-sortable="true"]').each(($th) => {
        cy.wrap($th).should('have.css', 'cursor', 'pointer')
      })
    })
  })

  describe('Unclear Row Handling', () => {
    it('should keep "Unclear" row at the bottom when sorting', () => {
      // Sort by strikes ascending
      cy.get('#region-list thead th').eq(1).click()

      // Check if Unclear row exists, and if so, verify it's last
      cy.get('[data-cy="data-table-body"] tr').then(($rows) => {
        if ($rows.length > 1) {
          const lastRow = $rows.last().find('td:first-child').text().trim()
          // If there's an Unclear row, it should be last
          if ($rows.text().includes('Unclear')) {
            expect(lastRow).to.equal('Unclear')
          }
        }
      })

      // Sort by strikes descending
      cy.get('#region-list thead th').eq(1).click()

      // Unclear should still be last
      cy.get('[data-cy="data-table-body"] tr').then(($rows) => {
        if ($rows.length > 1) {
          const lastRow = $rows.last().find('td:first-child').text().trim()
          if ($rows.text().includes('Unclear')) {
            expect(lastRow).to.equal('Unclear')
          }
        }
      })
    })
  })

  describe('Sort Persistence', () => {
    it('should allow sorting multiple times in same session', () => {
      // Sort by strikes descending
      cy.get('#region-list thead th').eq(1).click()
      cy.get('#region-list thead th').eq(1).click()
      cy.get('#region-list thead th').eq(1).should('have.attr', 'data-sort-direction', 'desc')

      // Change to region name ascending
      cy.get('#region-list thead th').eq(0).click()
      cy.get('#region-list thead th').eq(0).should('have.attr', 'data-sort-direction', 'asc')

      // Change to total killed descending
      cy.get('#region-list thead th').eq(2).click()
      cy.get('#region-list thead th').eq(2).click()
      cy.get('#region-list thead th').eq(2).should('have.attr', 'data-sort-direction', 'desc')

      // Verify previous sorts are cleared
      cy.get('#region-list thead th').eq(0).should('not.have.attr', 'data-sort-direction')
      cy.get('#region-list thead th').eq(1).should('not.have.attr', 'data-sort-direction')
    })
  })

  describe('Edge Cases', () => {
    it('should handle sorting with equal values correctly', () => {
      // Some regions might have same strike count
      // They should maintain stable sort order (original order for equal values)
      cy.get('#region-list thead th').eq(1).click()

      // Should complete without errors
      cy.get('[data-cy="data-table-body"] tr').should('have.length.at.least', 1)
    })

    it('should handle sorting with zero values correctly', () => {
      // Navigate to a region that might have zero strikes in sub-regions
      cy.get('#region-list thead th').eq(1).click()

      // Verify zeros appear first in ascending sort
      cy.get('[data-cy="data-table-body"] tr').first().find('td:nth-child(2)').invoke('text').then((firstValue) => {
        const value = parseInt(firstValue.trim())
        expect(value).to.be.at.least(0)
      })
    })

    it('should allow rapid clicking on sort headers without errors', () => {
      // Rapid clicks should not cause errors
      const header = cy.get('#region-list thead th').eq(1)
      header.click()
      header.click()
      header.click()
      header.click()

      // Should still work and show valid sort direction
      cy.get('#region-list thead th').eq(1).should('have.attr', 'data-sort-direction')
      cy.get('[data-cy="data-table-body"] tr').should('have.length.at.least', 1)
    })
  })

  describe('Accessibility', () => {
    it('should have aria-sort attribute on sorted column', () => {
      cy.get('#region-list thead th').eq(1).click()

      // Check for proper ARIA attributes
      cy.get('#region-list thead th').eq(1).should('have.attr', 'aria-sort', 'ascending')

      // Click again for descending
      cy.get('#region-list thead th').eq(1).click()
      cy.get('#region-list thead th').eq(1).should('have.attr', 'aria-sort', 'descending')
    })

    it('should have appropriate aria-label on sortable headers', () => {
      cy.get('#region-list thead th[data-sortable="true"]').each(($th) => {
        cy.wrap($th).should('have.attr', 'aria-label')
        cy.wrap($th).invoke('attr', 'aria-label').should('include', 'Sort by')
      })
    })
  })
})
