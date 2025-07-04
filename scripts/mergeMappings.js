#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load original and additional mappings
const originalMappings = JSON.parse(readFileSync(join(__dirname, '../src/data/taxonomy/termMappings.json'), 'utf8'));
const additionalMappings = JSON.parse(readFileSync(join(__dirname, '../src/data/taxonomy/additionalMappings.json'), 'utf8'));

console.log('MERGING TERM MAPPINGS');
console.log('='.repeat(80));

// Merge mappings
const mergedMappings = {
  metadata: {
    version: "1.1.0",
    lastUpdated: new Date().toISOString().split('T')[0],
    totalMappings: 0,
    confidence: {
      high: 0,
      medium: 0,
      low: 0
    }
  },
  mappings: {
    ...originalMappings.mappings,
    ...additionalMappings.mappings
  }
};

// Update counts
let highCount = 0, mediumCount = 0, lowCount = 0;
Object.values(mergedMappings.mappings).forEach(mapping => {
  if (mapping.confidence === 'high') highCount++;
  else if (mapping.confidence === 'medium') mediumCount++;
  else if (mapping.confidence === 'low') lowCount++;
});

mergedMappings.metadata.totalMappings = Object.keys(mergedMappings.mappings).length;
mergedMappings.metadata.confidence.high = highCount;
mergedMappings.metadata.confidence.medium = mediumCount;
mergedMappings.metadata.confidence.low = lowCount;

console.log(`Original mappings: ${Object.keys(originalMappings.mappings).length}`);
console.log(`Additional mappings: ${Object.keys(additionalMappings.mappings).length}`);
console.log(`Total merged mappings: ${mergedMappings.metadata.totalMappings}`);
console.log(`\nConfidence levels:`);
console.log(`  High: ${highCount}`);
console.log(`  Medium: ${mediumCount}`);
console.log(`  Low: ${lowCount}`);

// Create backup of original
const backupPath = join(__dirname, '../src/data/taxonomy/termMappings.backup.json');
writeFileSync(backupPath, JSON.stringify(originalMappings, null, 2));
console.log(`\nBackup created: ${backupPath}`);

// Write merged mappings
const outputPath = join(__dirname, '../src/data/taxonomy/termMappings.json');
writeFileSync(outputPath, JSON.stringify(mergedMappings, null, 2));
console.log(`Merged mappings written to: ${outputPath}`);

console.log('\n' + '='.repeat(80));
console.log('Merge complete!');