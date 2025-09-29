#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sourceDir = 'src/geojson';
const outputDir = 'data';
const simplificationLevel = 0.05; // 5% of original detail
const quantization = 1e4; // Coordinate precision

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Get all GeoJSON files
const geojsonFiles = fs.readdirSync(sourceDir)
    .filter(file => file.endsWith('.geojson'));

console.log(`Found ${geojsonFiles.length} GeoJSON files to optimize\n`);

// Track optimization results
let totalOriginalSize = 0;
let totalOptimizedSize = 0;

geojsonFiles.forEach((filename, index) => {
    const sourcePath = path.join(sourceDir, filename);
    const tempTopoPath = path.join(outputDir, filename.replace('.geojson', '_temp.json'));
    const outputPath = path.join(outputDir, filename.replace('.geojson', '-optimized.geojson'));
    
    console.log(`[${index + 1}/${geojsonFiles.length}] Processing ${filename}...`);
    
    try {
        // Get original file size
        const originalStats = fs.statSync(sourcePath);
        const originalSize = originalStats.size;
        totalOriginalSize += originalSize;
        
        // Step 1: Convert GeoJSON to TopoJSON
        console.log('  Converting to TopoJSON...');
        execSync(`geo2topo boundaries="${sourcePath}" > "${tempTopoPath}"`, { 
            stdio: 'pipe' 
        });
        
        // Step 2: Simplify and quantize
        console.log('  Simplifying geometries...');
        const simplifiedTopoPath = tempTopoPath.replace('_temp.json', '_simplified.json');
        execSync(`toposimplify -p ${simplificationLevel} -f < "${tempTopoPath}" > "${simplifiedTopoPath}"`, { 
            stdio: 'pipe' 
        });
        
        // Step 3: Apply quantization for coordinate precision
        console.log('  Applying quantization...');
        const quantizedTopoPath = tempTopoPath.replace('_temp.json', '_quantized.json');
        execSync(`topoquantize ${quantization} < "${simplifiedTopoPath}" > "${quantizedTopoPath}"`, { 
            stdio: 'pipe' 
        });
        
        // Step 4: Convert back to GeoJSON
        console.log('  Converting back to GeoJSON...');
        execSync(`topo2geo boundaries="${outputPath}" < "${quantizedTopoPath}"`, { 
            stdio: 'pipe' 
        });
        
        // Clean up temporary files
        [tempTopoPath, simplifiedTopoPath, quantizedTopoPath].forEach(tempFile => {
            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
        });
        
        // Get optimized file size
        const optimizedStats = fs.statSync(outputPath);
        const optimizedSize = optimizedStats.size;
        totalOptimizedSize += optimizedSize;
        
        // Calculate savings
        const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
        const originalMB = (originalSize / 1024 / 1024).toFixed(2);
        const optimizedKB = (optimizedSize / 1024).toFixed(1);
        
        console.log(`  ✅ ${filename}: ${originalMB}MB → ${optimizedKB}KB (${savings}% reduction)\n`);
        
    } catch (error) {
        console.error(`  ❌ Error processing ${filename}:`, error.message);
    }
});

// Summary
const totalSavings = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1);
const originalTotalMB = (totalOriginalSize / 1024 / 1024).toFixed(2);
const optimizedTotalMB = (totalOptimizedSize / 1024 / 1024).toFixed(2);

console.log('🎉 Optimization Complete!');
console.log('========================');
console.log(`Original total size: ${originalTotalMB}MB`);
console.log(`Optimized total size: ${optimizedTotalMB}MB`);
console.log(`Total savings: ${totalSavings}% (${(originalTotalMB - optimizedTotalMB).toFixed(2)}MB saved)`);
console.log(`Files saved to: ${outputDir}/`);