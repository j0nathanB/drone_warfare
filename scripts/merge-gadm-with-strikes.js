#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load the GADM file (high-detail geometry)
const gadmFile = '/Users/zen/dev/src/drone_warfare/src/geojson/test/gadm41_AFG_1.json';
const gadmData = JSON.parse(fs.readFileSync(gadmFile, 'utf8'));

// Load the existing file (has strike data)
const strikeFile = '/Users/zen/dev/src/drone_warfare/data/cleanup/10_geojson_output/AFG_Adm_1.geojson';
const strikeData = JSON.parse(fs.readFileSync(strikeFile, 'utf8'));

// Name mappings for provinces with different spellings
const nameMapping = {
  'Panjshir': 'Panjsher',
  'SariPul': 'Sari Pul',
  'Wardak': 'Maydan Wardak'
};

// Create a map of province names to strike data
const strikeMap = {};
strikeData.features.forEach(feature => {
  const name = feature.properties.shapeName;
  strikeMap[name] = feature.properties;
});

// Merge: Use GADM geometry, add strike data properties
const mergedFeatures = gadmData.features.map(gadmFeature => {
  const provinceName = gadmFeature.properties.NAME_1;

  // Try to find strike data, using name mapping if needed
  const mappedName = nameMapping[provinceName] || provinceName;
  const strikeProps = strikeMap[mappedName];

  if (!strikeProps) {
    console.warn(`No strike data found for province: ${provinceName}`);
    // Create empty strike data
    return {
      ...gadmFeature,
      properties: {
        ...gadmFeature.properties,
        shapeISO: 'AFG',
        shapeGroup: 'AFG',
        shapeType: 'ADM1',
        shapeName: provinceName,
        parentAdm: 'Afghanistan',
        strike_count: 0,
        dates: [],
        min_total: 0,
        max_total: 0,
        min_civilians: 0,
        max_civilians: 0,
        min_children: 0,
        max_children: 0
      }
    };
  }

  return {
    type: 'Feature',
    geometry: gadmFeature.geometry, // Use GADM's high-detail geometry
    properties: {
      // Keep GADM properties
      ...gadmFeature.properties,
      // Add strike data properties (override if needed)
      shapeISO: strikeProps.shapeISO || 'AFG',
      shapeID: strikeProps.shapeID,
      shapeGroup: strikeProps.shapeGroup || 'AFG',
      shapeType: strikeProps.shapeType || 'ADM1',
      shapeName: provinceName,
      parentAdm: strikeProps.parentAdm || 'Afghanistan',
      strike_count: strikeProps.strike_count || 0,
      dates: strikeProps.dates || [],
      min_total: strikeProps.min_total || 0,
      max_total: strikeProps.max_total || 0,
      min_civilians: strikeProps.min_civilians || 0,
      max_civilians: strikeProps.max_civilians || 0,
      min_children: strikeProps.min_children || 0,
      max_children: strikeProps.max_children || 0,
      Shape_Leng: strikeProps.Shape_Leng,
      Shape_Area: strikeProps.Shape_Area
    }
  };
});

// Create the merged GeoJSON
const mergedGeoJSON = {
  type: 'FeatureCollection',
  features: mergedFeatures
};

// Write to output file
const outputFile = '/Users/zen/dev/src/drone_warfare/data/AFG_Adm_1-gadm.geojson';
fs.writeFileSync(outputFile, JSON.stringify(mergedGeoJSON, null, 2));

console.log(`✅ Merged ${mergedFeatures.length} provinces`);
console.log(`📝 Output: ${outputFile}`);
console.log(`📊 File size: ${(fs.statSync(outputFile).size / 1024).toFixed(2)} KB`);
