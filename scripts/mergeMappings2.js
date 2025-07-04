#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load current mappings and second batch of additional mappings
const currentMappings = JSON.parse(readFileSync(join(__dirname, '../src/data/taxonomy/termMappings.json'), 'utf8'));
const additionalMappings2 = JSON.parse(readFileSync(join(__dirname, '../src/data/taxonomy/additionalMappings2.json'), 'utf8'));

console.log('MERGING SECOND BATCH OF TERM MAPPINGS');
console.log('='.repeat(80));

// Check for conflicts
const conflicts = [];
Object.keys(additionalMappings2.mappings).forEach(term => {
  if (currentMappings.mappings[term]) {
    conflicts.push(term);
  }
});

if (conflicts.length > 0) {
  console.log('WARNING: Found conflicts with existing mappings:');
  conflicts.forEach(term => {
    console.log(`  - ${term}`);
  });
  console.log('\nThese will be skipped in the merge.');
}

// Merge mappings (excluding conflicts)
const mergedMappings = {
  metadata: {
    version: "1.2.0",
    lastUpdated: new Date().toISOString().split('T')[0],
    totalMappings: 0,
    confidence: {
      high: 0,
      medium: 0,
      low: 0
    }
  },
  mappings: {
    ...currentMappings.mappings
  }
};

// Add new mappings (skip conflicts)
let addedCount = 0;
Object.entries(additionalMappings2.mappings).forEach(([term, mapping]) => {
  if (!mergedMappings.mappings[term]) {
    mergedMappings.mappings[term] = mapping;
    addedCount++;
  }
});

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

console.log(`\nCurrent mappings: ${Object.keys(currentMappings.mappings).length}`);
console.log(`Additional mappings (batch 2): ${Object.keys(additionalMappings2.mappings).length}`);
console.log(`Conflicts skipped: ${conflicts.length}`);
console.log(`New mappings added: ${addedCount}`);
console.log(`Total merged mappings: ${mergedMappings.metadata.totalMappings}`);
console.log(`\nConfidence levels:`);
console.log(`  High: ${highCount}`);
console.log(`  Medium: ${mediumCount}`);
console.log(`  Low: ${lowCount}`);

// Create backup of current version
const backupPath = join(__dirname, '../src/data/taxonomy/termMappings.v1.1.json');
writeFileSync(backupPath, JSON.stringify(currentMappings, null, 2));
console.log(`\nBackup created: ${backupPath}`);

// Write merged mappings
const outputPath = join(__dirname, '../src/data/taxonomy/termMappings.json');
writeFileSync(outputPath, JSON.stringify(mergedMappings, null, 2));
console.log(`Merged mappings written to: ${outputPath}`);

console.log('\n' + '='.repeat(80));
console.log('Merge complete!');