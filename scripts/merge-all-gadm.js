#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration for each country and admin level
const mergeConfigs = [
  // Afghanistan
  { country: 'AFG', level: 0, nameField: 'COUNTRY', parentField: null },
  { country: 'AFG', level: 1, nameField: 'NAME_1', parentField: null },
  { country: 'AFG', level: 2, nameField: 'NAME_2', parentField: 'NAME_1' },

  // Pakistan
  { country: 'PAK', level: 0, nameField: 'COUNTRY', parentField: null },
  { country: 'PAK', level: 1, nameField: 'NAME_1', parentField: null },
  { country: 'PAK', level: 2, nameField: 'NAME_2', parentField: 'NAME_1' },
  { country: 'PAK', level: 3, nameField: 'NAME_3', parentField: 'NAME_2' },

  // Somalia
  { country: 'SOM', level: 0, nameField: 'COUNTRY', parentField: null },
  { country: 'SOM', level: 1, nameField: 'NAME_1', parentField: null },
  { country: 'SOM', level: 2, nameField: 'NAME_2', parentField: 'NAME_1' },

  // Yemen
  { country: 'YEM', level: 0, nameField: 'COUNTRY', parentField: null },
  { country: 'YEM', level: 1, nameField: 'NAME_1', parentField: null },
  { country: 'YEM', level: 2, nameField: 'NAME_2', parentField: 'NAME_1' },
];

// Country name mappings
const countryNameMappings = {
  'AFG': {
    0: {},
    1: {
      'Panjshir': 'Panjsher',
      'SariPul': 'Sari Pul',
      'Wardak': 'Maydan Wardak'
    },
    2: {}
  },
  'PAK': {
    0: {},
    1: {
      'AzadKashmir': 'Azad Kashmir',
      'Khyber-Pakhtunkhwa': 'Khyber Pakhtunkhwa',
      'Islamabad': 'Islamabad Capital Territory'
    },
    2: {},
    3: {}
  },
  'SOM': {
    0: {},
    1: {},
    2: {}
  },
  'YEM': {
    0: {},
    1: {},
    2: {}
  }
};

function mergeGADM(config) {
  const { country, level, nameField, parentField } = config;

  console.log(`\n🔄 Processing ${country} ADM${level}...`);

  // Load GADM file
  const gadmFile = `/Users/zen/dev/src/drone_warfare/src/geojson/test/gadm41_${country}_${level}.json`;
  if (!fs.existsSync(gadmFile)) {
    console.warn(`⚠️  GADM file not found: ${gadmFile}`);
    return;
  }
  const gadmData = JSON.parse(fs.readFileSync(gadmFile, 'utf8'));

  // Load strike data file
  const strikeFile = `/Users/zen/dev/src/drone_warfare/data/cleanup/10_geojson_output/${country}_Adm_${level}.geojson`;
  if (!fs.existsSync(strikeFile)) {
    console.warn(`⚠️  Strike file not found: ${strikeFile}`);
    return;
  }
  const strikeData = JSON.parse(fs.readFileSync(strikeFile, 'utf8'));

  // Create map of names to strike data
  const strikeMap = {};
  strikeData.features.forEach(feature => {
    const name = feature.properties.shapeName;
    strikeMap[name] = feature.properties;
  });

  // Get name mappings for this country/level
  const nameMapping = countryNameMappings[country][level] || {};

  // Merge features
  const mergedFeatures = gadmData.features.map(gadmFeature => {
    const regionName = gadmFeature.properties[nameField];
    const parentName = parentField ? gadmFeature.properties[parentField] : null;

    // Try to find strike data using name mapping
    const mappedName = nameMapping[regionName] || regionName;
    const strikeProps = strikeMap[mappedName];

    if (!strikeProps) {
      console.warn(`   ⚠️  No strike data for: ${regionName}`);
      // Create empty strike data
      return {
        ...gadmFeature,
        properties: {
          ...gadmFeature.properties,
          shapeISO: country,
          shapeGroup: country,
          shapeType: `ADM${level}`,
          shapeName: regionName,
          parentAdm: parentName || getCountryName(country),
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

    // Merge GADM geometry with strike data
    return {
      type: 'Feature',
      geometry: gadmFeature.geometry,
      properties: {
        ...gadmFeature.properties,
        shapeISO: strikeProps.shapeISO || country,
        shapeID: strikeProps.shapeID,
        shapeGroup: strikeProps.shapeGroup || country,
        shapeType: strikeProps.shapeType || `ADM${level}`,
        shapeName: regionName,
        parentAdm: strikeProps.parentAdm || parentName || getCountryName(country),
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

  // Create merged GeoJSON
  const mergedGeoJSON = {
    type: 'FeatureCollection',
    features: mergedFeatures
  };

  // Write output
  const outputFile = `/Users/zen/dev/src/drone_warfare/data/${country}_Adm_${level}-gadm.geojson`;
  fs.writeFileSync(outputFile, JSON.stringify(mergedGeoJSON, null, 2));

  const sizeMB = (fs.statSync(outputFile).size / 1024 / 1024).toFixed(2);
  console.log(`   ✅ Merged ${mergedFeatures.length} features → ${outputFile}`);
  console.log(`   📊 Size: ${sizeMB} MB`);
}

function getCountryName(code) {
  const names = {
    'AFG': 'Afghanistan',
    'PAK': 'Pakistan',
    'SOM': 'Somalia',
    'YEM': 'Yemen'
  };
  return names[code] || code;
}

// Run all merges
console.log('🚀 Starting GADM merge for all countries...');
mergeConfigs.forEach(config => mergeGADM(config));
console.log('\n✨ All merges complete!');
