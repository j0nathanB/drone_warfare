// geojsonHandler.js
import { loadJSON } from './utils.js';

export class GeoJSONHandler {
  constructor() {
    this.data = {};
  }

  async loadData() {
    const results = {'AFG': [], 'PAK': [], 'SOM': [], 'YEM': []};

    const username = "j0nathanb";
    const repo = "drone_warfare";
    const ref = "main";
    // Using GADM high-detail boundaries for all countries
    // const baseURL = `https://raw.githubusercontent.com/${username}/${repo}/${ref}/data/`;
    // Use dynamic path resolution to work with both file:// and http:// protocols
    const baseURL = './data'
    const locURL = './data/cleanup/10_geojson_output' // Location data still from old source

    // Load all files in parallel using Promise.all for better performance
    const [
      afgAdm0, afgAdm1, afgAdm2, afgLoc,
      pakAdm0, pakAdm1, pakAdm2, pakAdm3, pakLoc,
      somAdm0, somAdm1, somAdm2, somLoc,
      yemAdm0, yemAdm1, yemAdm2, yemLoc
    ] = await Promise.all([
      loadJSON(`${baseURL}/AFG_Adm_0-gadm.geojson`),
      loadJSON(`${baseURL}/AFG_Adm_1-gadm.geojson`),
      loadJSON(`${baseURL}/AFG_Adm_2-gadm.geojson`),
      loadJSON(`${locURL}/AFG_Loc.geojson`),
      loadJSON(`${baseURL}/PAK_Adm_0-gadm.geojson`),
      loadJSON(`${baseURL}/PAK_Adm_1-gadm.geojson`),
      loadJSON(`${baseURL}/PAK_Adm_2-gadm.geojson`),
      loadJSON(`${baseURL}/PAK_Adm_3-gadm.geojson`),
      loadJSON(`${locURL}/PAK_Loc.geojson`),
      loadJSON(`${baseURL}/SOM_Adm_0-gadm.geojson`),
      loadJSON(`${baseURL}/SOM_Adm_1-gadm.geojson`),
      loadJSON(`${baseURL}/SOM_Adm_2-gadm.geojson`),
      loadJSON(`${locURL}/SOM_Loc.geojson`),
      loadJSON(`${baseURL}/YEM_Adm_0-gadm.geojson`),
      loadJSON(`${baseURL}/YEM_Adm_1-gadm.geojson`),
      loadJSON(`${baseURL}/YEM_Adm_2-gadm.geojson`),
      loadJSON(`${locURL}/YEM_Loc.geojson`)
    ]);

    // Assign loaded data to results
    results['AFG'][0] = afgAdm0;
    results['AFG'][1] = afgAdm1;
    results['AFG'][2] = afgAdm2;
    results['AFG'][3] = afgLoc;
    results['PAK'][0] = pakAdm0;
    results['PAK'][1] = pakAdm1;
    results['PAK'][2] = pakAdm2;
    results['PAK'][3] = pakAdm3;
    results['PAK'][4] = pakLoc;
    results['SOM'][0] = somAdm0;
    results['SOM'][1] = somAdm1;
    results['SOM'][2] = somAdm2;
    results['SOM'][3] = somLoc;
    results['YEM'][0] = yemAdm0;
    results['YEM'][1] = yemAdm1;
    results['YEM'][2] = yemAdm2;
    results['YEM'][3] = yemLoc;
  
    return results;
  }

  async getData() {
    this.data = await this.loadData();
    return this.data;
  }
}