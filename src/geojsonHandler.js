// geojsonHandler.js
import { loadJSON } from './utils.js';

export class GeoJSONHandler {
  constructor() {
    this.data = {};
  }

  async loadData() {
    const results = {'AFG': [], 'PAK': [], 'SOM': [], 'YEM': []}; // Initialize an empty object to store the results

    results['AFG'][0] = await loadJSON("../../data/geojson/AFG_Adm_0.geojson");
    results['AFG'][1] = await loadJSON("../../data/geojson/AFG_Adm_1.geojson");
    results['AFG'][2] = await loadJSON("../../data/geojson/AFG_Adm_2.geojson");
    results['AFG'][3] = await loadJSON("../../data/geojson/AFG_Loc.geojson");
    results['PAK'][0] = await loadJSON("../../data/geojson/PAK_Adm_0.geojson");
    results['PAK'][1] = await loadJSON("../../data/geojson/PAK_Adm_1.geojson");
    results['PAK'][2] = await loadJSON("../../data/geojson/PAK_Adm_2.geojson");
    results['PAK'][3] = await loadJSON("../../data/geojson/PAK_Adm_3.geojson");
    results['PAK'][4] = await loadJSON("../../data/geojson/PAK_Loc.geojson");
    results['SOM'][0] = await loadJSON("../../data/geojson/SOM_Adm_0.geojson");
    results['SOM'][1] = await loadJSON("../../data/geojson/SOM_Adm_1.geojson");
    results['SOM'][2] = await loadJSON("../../data/geojson/SOM_Adm_2.geojson");
    results['SOM'][3] = await loadJSON("../../data/geojson/SOM_Adm_2.geojson");
    results['YEM'][0] = await loadJSON("../../data/geojson/YEM_Adm_0.geojson");
    results['YEM'][1] = await loadJSON("../../data/geojson/YEM_Adm_1.geojson");
    results['YEM'][2] = await loadJSON("../../data/geojson/YEM_Adm_2.geojson");
    results['YEM'][3] = await loadJSON("../../data/geojson/YEM_Loc.geojson");
  
    return results
  }

  async getData() {
    this.data = await this.loadData();
    return this.data;
  }
}