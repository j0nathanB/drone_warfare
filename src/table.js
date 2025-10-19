// table.js
export class DataTable {
  constructor(appState, selectEntityCallback) {
    this.tableBody = document.getElementById('data_table_body');
    this.appState = appState;
    this.selectEntityCallback = selectEntityCallback;
    this.currentSortColumn = null;
    this.currentSortDirection = null;
    this.tableData = [];
    this.sortingInitialized = false;
  }

  initializeSorting() {
    if (this.sortingInitialized) return; // Don't re-initialize

    // Add click handlers to all sortable headers
    const headers = document.querySelectorAll('#region-list .sortable-header');
    headers.forEach(header => {
      header.addEventListener('click', () => {
        const column = header.dataset.column;
        this.handleSort(column, header);
      });
    });

    this.sortingInitialized = true;
  }

  handleSort(column, headerElement) {
    // Determine sort direction
    if (this.currentSortColumn === column) {
      // Toggle direction if same column
      this.currentSortDirection = this.currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New column, default to ascending
      this.currentSortColumn = column;
      this.currentSortDirection = 'asc';
    }

    // Update UI indicators
    this.updateSortIndicators(column, this.currentSortDirection);

    // Sort and re-render table
    this.sortTableData(column, this.currentSortDirection);
    this.renderSortedTable();
  }

  updateSortIndicators(activeColumn, direction) {
    // Remove active state from all headers
    const allHeaders = document.querySelectorAll('.sortable-header');
    allHeaders.forEach(header => {
      header.removeAttribute('data-sort-direction');
      header.removeAttribute('aria-sort');
      header.classList.remove('active');
      // Clear sort indicator
      const indicator = header.querySelector('.sort-indicator');
      if (indicator) {
        indicator.textContent = '';
      }
    });

    // Add active state to current header
    const activeHeader = document.querySelector(`.sortable-header[data-column="${activeColumn}"]`);
    if (activeHeader) {
      activeHeader.setAttribute('data-sort-direction', direction);
      activeHeader.setAttribute('aria-sort', direction === 'asc' ? 'ascending' : 'descending');
      activeHeader.classList.add('active');

      // Set sort indicator text
      const indicator = activeHeader.querySelector('.sort-indicator');
      if (indicator) {
        indicator.textContent = direction === 'asc' ? '▲' : '▼';
      }
    }
  }

  sortTableData(column, direction) {
    // Separate "Unclear" row if it exists
    const unclearIndex = this.tableData.findIndex(item =>
      item.isUnclear || (item.properties && item.properties.shapeName === 'Unclear')
    );

    let unclearRow = null;
    if (unclearIndex !== -1) {
      unclearRow = this.tableData.splice(unclearIndex, 1)[0];
    }

    // Sort the data
    this.tableData.sort((a, b) => {
      const aValues = this.appState.admLevel === 0
        ? this.getValuesForAdmLevel0(a)
        : this.getValuesForOtherAdmLevels(a);

      const bValues = this.appState.admLevel === 0
        ? this.getValuesForAdmLevel0(b)
        : this.getValuesForOtherAdmLevels(b);

      let aValue, bValue;

      switch (column) {
        case 'region':
          aValue = aValues.shapeName;
          bValue = bValues.shapeName;
          // Text sorting
          return direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);

        case 'strikes':
          aValue = aValues.strike_count;
          bValue = bValues.strike_count;
          break;

        case 'total':
          aValue = aValues.max_total;
          bValue = bValues.max_total;
          break;

        case 'civilians':
          aValue = aValues.max_civilians;
          bValue = bValues.max_civilians;
          break;

        case 'children':
          aValue = aValues.max_children;
          bValue = bValues.max_children;
          break;

        default:
          return 0;
      }

      // Numeric sorting
      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    });

    // Re-add "Unclear" row at the end
    if (unclearRow) {
      this.tableData.push(unclearRow);
    }
  }

  renderSortedTable() {
    // Clear table
    while (this.tableBody.firstChild) {
      this.tableBody.removeChild(this.tableBody.firstChild);
    }

    // Render sorted data
    this.tableData.forEach(item => {
      if (item.isUnclear) {
        // Render unclear row
        const unclearRowHtml = `
          <td>Unclear</td>
          <td>${item.strikeCount}</td>
          <td>${item.maxTotal}</td>
          <td>${item.maxCivilians}</td>
          <td>${item.maxChildren}</td>
        `;
        const tableRow = document.createElement('tr');
        tableRow.innerHTML = unclearRowHtml;
        this.tableBody.appendChild(tableRow);
      } else {
        // Render regular row
        const tableRow = document.createElement('tr');
        tableRow.innerHTML = this.createTableRowContent(item, this.appState.admLevel);
        this.tableBody.appendChild(tableRow);

        const featureBounds = L.geoJSON(item).getBounds();
        tableRow.addEventListener('click', () => {
          if ('features' in item) {
            this.selectEntityCallback(item.features[0].properties, this.appState);
          } else {
            this.selectEntityCallback(item.properties, this.appState);
          }
          this.appState.map.zoomToFeature(null, featureBounds);
        });
      }
    });
  }

  getValuesForAdmLevel0(data) {
    // Handle both FeatureCollection and individual feature formats
    const properties = data.features ? data.features[0].properties : data.properties;

    return {
      shapeName: properties.shapeISO || properties.shapeName,
      strike_count: properties.strike_count,
      min_total: Array.isArray(properties.min_total) ? properties.min_total.reduce((a, b) => (a + b), 0) : (properties.min_total || 0),
      max_total: Array.isArray(properties.max_total) ? properties.max_total.reduce((a, b) => (a + b), 0) : (properties.max_total || 0),
      min_civilians: Array.isArray(properties.min_civilians) ? properties.min_civilians.reduce((a, b) => (a + b), 0) : (properties.min_civilians || 0),
      max_civilians: Array.isArray(properties.max_civilians) ? properties.max_civilians.reduce((a, b) => (a + b), 0) : (properties.max_civilians || 0),
      min_children: Array.isArray(properties.min_children) ? properties.min_children.reduce((a, b) => (a + b), 0) : (properties.min_children || 0),
      max_children: Array.isArray(properties.max_children) ? properties.max_children.reduce((a, b) => (a + b), 0) : (properties.max_children || 0)
    };
  }

  getValuesForOtherAdmLevels(data) {
    return {
      shapeName: data.properties.shapeName,
      strike_count: data.properties.strike_count,
      max_total: data.properties.max_total.reduce((a, b) => (a + b), 0),
      max_civilians: data.properties.max_civilians.reduce((a, b) => (a + b), 0),
      max_children: data.properties.max_children.reduce((a, b) => (a + b), 0)
    };
  }

  createTableRowContent(data, admLevel) {
    const values = admLevel === 0
      ? this.getValuesForAdmLevel0(data)
      : this.getValuesForOtherAdmLevels(data);

    return `
      <td>${values.shapeName}</td>
      <td>${values.strike_count}</td>
      <td>${values.max_total}</td>
      <td>${values.max_civilians}</td>
      <td>${values.max_children}</td>
    `;
  }

  updateUnclearRow(unclearRow, data) {
    const values = this.appState.admLevel === 0
      ? this.getValuesForAdmLevel0(data)
      : this.getValuesForOtherAdmLevels(data);
    
    unclearRow.strikeCount = Math.max(0, unclearRow.strikeCount - values.strike_count);
    unclearRow.maxTotal = Math.max(0, unclearRow.maxTotal - values.max_total);
    unclearRow.maxCivilians = Math.max(0, unclearRow.maxCivilians - values.max_civilians);
    unclearRow.maxChildren = Math.max(0, unclearRow.maxChildren - values.max_children);
  
    return unclearRow;
  }
  

  loadTable(data = []) {
    const regionCards = document.getElementById('region-cards');
    const regionList = document.getElementById('region-list');

    if (this.appState.admLevel === 0) {
      // Global view - show cards
      if (regionCards) regionCards.style.display = 'grid';
      if (regionList) regionList.style.display = 'none';
      this.loadCards(data);
    } else {
      // Country/region view - show table
      if (regionCards) regionCards.style.display = 'none';
      if (regionList) regionList.style.display = 'block';
      this.loadTableRows(data);
      // Initialize sorting after table is visible
      this.initializeSorting();
    }
  }

  loadCards(data = []) {
    const regionCards = document.getElementById('region-cards');
    if (!regionCards) return;

    // Clear existing cards
    regionCards.innerHTML = '';

    const countryNames = {
      'AFG': 'Afghanistan',
      'PAK': 'Pakistan',
      'SOM': 'Somalia',
      'YEM': 'Yemen'
    };

    for (let i = 0; i < data.length; i++) {
      const values = this.getValuesForAdmLevel0(data[i]);
      const countryCode = values.shapeName;
      const countryName = countryNames[countryCode] || countryCode;

      const card = document.createElement('div');
      card.className = 'country-card';
      card.innerHTML = `
        <div class="country-card-header">
          <h4>${countryName}</h4>
          <span class="country-strikes">${values.strike_count} strikes</span>
        </div>
        <div class="country-card-stats">
          <div class="country-stat">
            <span class="country-stat-label">Total Killed</span>
            <span class="country-stat-value">${values.min_total === values.max_total ? values.max_total.toLocaleString() : `${values.min_total.toLocaleString()} to ${values.max_total.toLocaleString()}`}</span>
          </div>
          <div class="country-stat">
            <span class="country-stat-label">Civilians</span>
            <span class="country-stat-value">${values.min_civilians === values.max_civilians ? values.max_civilians.toLocaleString() : `${values.min_civilians.toLocaleString()} to ${values.max_civilians.toLocaleString()}`}</span>
          </div>
          <div class="country-stat">
            <span class="country-stat-label">Children</span>
            <span class="country-stat-value">${values.min_children === values.max_children ? values.max_children.toLocaleString() : `${values.min_children.toLocaleString()} to ${values.max_children.toLocaleString()}`}</span>
          </div>
        </div>
      `;

      const featureBounds = L.geoJSON(data[i]).getBounds();
      card.addEventListener('click', () => {
        if ('features' in data[i]) {
          this.selectEntityCallback(data[i].features[0].properties, this.appState);
        } else {
          this.selectEntityCallback(data[i].properties, this.appState);
        }
        this.appState.map.zoomToFeature(null, featureBounds);
      });

      regionCards.appendChild(card);
    }
  }

  loadTableRows(data = []) {
    // Store the data for sorting
    this.tableData = [...data];

    // Clear the table before loading new data
    while (this.tableBody.firstChild) {
      this.tableBody.removeChild(this.tableBody.firstChild);
    }

    let unclearRow = this.appState.previousTotals;
    // console.log(unclearRow)

    for (let i = 0; i < data.length; i++) {
      const tableRow = document.createElement('tr');
      tableRow.innerHTML = this.createTableRowContent(data[i], this.appState.admLevel);
      this.tableBody.appendChild(tableRow);
      unclearRow = this.updateUnclearRow(unclearRow, data[i]);
      const featureBounds = L.geoJSON(data[i]).getBounds();

      // When the user clicks on a country in the table
      tableRow.addEventListener('click', () => {
        if ('features' in data[i]) {
          this.selectEntityCallback(data[i].features[0].properties, this.appState);
        } else {
          this.selectEntityCallback(data[i].properties, this.appState);
        }
        this.appState.map.zoomToFeature(null, featureBounds);
      });
    }

    // Only add the unclear row if not at global level (admLevel > 0)
    if (this.appState.admLevel > 0) {
      // Add unclear row to tableData for sorting
      const unclearRowData = {
        isUnclear: true,
        strikeCount: unclearRow.strikeCount,
        maxTotal: unclearRow.maxTotal,
        maxCivilians: unclearRow.maxCivilians,
        maxChildren: unclearRow.maxChildren
      };
      this.tableData.push(unclearRowData);

      const unclearRowHtml = `
        <tr>
          <td>Unclear</td>
          <td>${unclearRow.strikeCount}</td>
          <td>${unclearRow.maxTotal}</td>
          <td>${unclearRow.maxCivilians}</td>
          <td>${unclearRow.maxChildren}</td>
        </tr>
      `;
      const tableRowUnclear = document.createElement('tr');
      tableRowUnclear.innerHTML = unclearRowHtml;
      // Append the unclear row to the table
      this.tableBody.appendChild(tableRowUnclear);
    }

    // Apply current sort if one is active
    if (this.currentSortColumn && this.currentSortDirection) {
      this.sortTableData(this.currentSortColumn, this.currentSortDirection);
      this.renderSortedTable();
      this.updateSortIndicators(this.currentSortColumn, this.currentSortDirection);
    }
  }
}
