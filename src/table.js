// table.js
export class DataTable {
  constructor(appState, selectEntityCallback) {
    this.tableBody = document.getElementById('data_table_body');
    this.appState = appState;
    this.selectEntityCallback = selectEntityCallback;
  }

  getValuesForAdmLevel0(data) {
    return {
      shapeName: data.features[0].properties.shapeISO,
      strike_count: data.features[0].properties.strike_count,
      max_total: data.features[0].properties.max_total.reduce((a, b) => (a + b), 0),
      max_civilians: data.features[0].properties.max_civilians.reduce((a, b) => (a + b), 0),
      max_children: data.features[0].properties.max_children.reduce((a, b) => (a + b), 0)
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
      <td>${Math.max(0, values.max_total - values.max_civilians - values.max_children)}</td>
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

    // Create the unclear row HTML
    const unclearRowHtml = `
      <tr>
        <td>Unclear</td>
        <td>${unclearRow.strikeCount}</td>
        <td>${unclearRow.maxTotal}</td>
        <td>${unclearRow.maxTotal - unclearRow.maxCivilians - unclearRow.maxChildren}</td>
        <td>${unclearRow.maxCivilians}</td>
        <td>${unclearRow.maxChildren}</td>
      </tr>
    `;
    const tableRowUnclear = document.createElement('tr');
    tableRowUnclear.innerHTML = unclearRowHtml;
    // Append the unclear row to the table
    this.tableBody.appendChild(tableRowUnclear);
    // this.table.innerHTML += unclearRowHtml;
  }
}
