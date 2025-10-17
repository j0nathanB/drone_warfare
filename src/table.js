// table.js
export class DataTable {
  constructor(appState, selectEntityCallback) {
    this.tableBody = document.getElementById('data_table_body');
    this.appState = appState;
    this.selectEntityCallback = selectEntityCallback;
  }

  getValuesForAdmLevel0(data) {
    // Handle both FeatureCollection and individual feature formats
    const properties = data.features ? data.features[0].properties : data.properties;
    
    return {
      shapeName: properties.shapeISO || properties.shapeName,
      strike_count: properties.strike_count,
      max_total: Array.isArray(properties.max_total) ? properties.max_total.reduce((a, b) => (a + b), 0) : (properties.max_total || 0),
      max_civilians: Array.isArray(properties.max_civilians) ? properties.max_civilians.reduce((a, b) => (a + b), 0) : (properties.max_civilians || 0),
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
            <span class="country-stat-value">${values.max_total.toLocaleString()}</span>
          </div>
          <div class="country-stat">
            <span class="country-stat-label">Civilians</span>
            <span class="country-stat-value">${values.max_civilians.toLocaleString()}</span>
          </div>
          <div class="country-stat">
            <span class="country-stat-label">Children</span>
            <span class="country-stat-value">${values.max_children.toLocaleString()}</span>
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
  }
}
