// table.js
export class DataTable {
  constructor(appState, selectEntityCallback) {
    this.tableBody = document.getElementById('data_table_body');
    this.appState = appState;
    this.selectEntityCallback = selectEntityCallback;
  }

  createTableRowContent(data, admLevel) {
    if (admLevel === 0) {
      return `
        <td>${data.features[0].properties.shapeISO}</td>
        <td>${data.features[0].properties.strike_count}</td>
        <td>${data.features[0].properties.max_total}</td>
        <td>${data.features[0].properties.max_total - data.features[0].properties.max_civilians - data.features[0].properties.max_children}</td>
        <td>${data.features[0].properties.max_civilians}</td>
        <td>${data.features[0].properties.max_children}</td>
      `;
    } else {
      return `
        <td>${data.properties.shapeName}</td>
        <td>${data.properties.strike_count}</td>
        <td>${data.properties.max_total.reduce((a, b) => (a + b), 0)}</td>
        <td>${data.properties.max_total.reduce((a, b) => (a + b), 0) - data.properties.max_civilians.reduce((a, b) => (a + b), 0) - data.properties.max_children.reduce((a, b) => (a + b), 0)}</td>
        <td>${data.properties.max_civilians.reduce((a, b) => (a + b), 0)}</td>
        <td>${data.properties.max_children.reduce((a, b) => (a + b), 0)}</td>
      `;
    }
  }

  loadTable(data = []) {
    // Clear the table before loading new data
    while (this.tableBody.firstChild) {
      this.tableBody.removeChild(this.tableBody.firstChild);
    }

    console.log(this.appState)
  
    for (let i = 0; i < data.length; i++) {
      const tableRow = document.createElement('tr');
      tableRow.innerHTML = this.createTableRowContent(data[i], this.appState.admLevel);
      this.tableBody.appendChild(tableRow);
  
      const featureBounds = L.geoJSON(data[i]).getBounds();
      
      // When the user clicks on a country in the table
      tableRow.addEventListener('click', () => {
        if ('features' in data[i]) {
          this.selectEntityCallback(data[i].features[0].properties, this.appState.map, this);
        } else {
          this.selectEntityCallback(data[i].properties, this.appState.map, this);
        }
        // zoomToFeature({ target: { getBounds: () => featureBounds } });
      });
      
    }
  }
}
