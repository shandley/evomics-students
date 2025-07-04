#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const taxonomy = JSON.parse(readFileSync(join(__dirname, '../src/data/taxonomy/scientificTopics.json'), 'utf8'));
const mappings = JSON.parse(readFileSync(join(__dirname, '../src/data/taxonomy/termMappings.json'), 'utf8'));

// Get all existing topic IDs
const existingIds = new Set([
  ...Object.keys(taxonomy.topics),
  ...Object.keys(taxonomy.level2 || {})
]);

// Find missing topics
const missing = [];
Object.entries(mappings.mappings).forEach(([term, mapping]) => {
  if (!existingIds.has(mapping.standardizedId)) {
    missing.push({ 
      term, 
      mappedTo: mapping.standardizedId,
      confidence: mapping.confidence,
      notes: mapping.notes
    });
  }
});

console.log('Missing topics that need to be added:');
console.log('=' .repeat(50));
missing.forEach(item => {
  console.log(`Term: "${item.term}"`);
  console.log(`Maps to: ${item.mappedTo}`);
  console.log(`Notes: ${item.notes}`);
  console.log('-'.repeat(30));
});

console.log(`\nTotal missing: ${missing.length}`);

// Group by probable parent
const byParent = {};
missing.forEach(item => {
  const id = item.mappedTo;
  let parent = 'unknown';
  
  // Guess parent based on ID
  if (id.includes('genomics')) parent = 'genomics-omics';
  else if (id.includes('evolution') || id === 'speciation' || id === 'adaptation') parent = 'evolutionary-biology';
  else if (id.includes('genetic')) parent = 'population-quantitative';
  else if (id.includes('sequenc') || id === 'genome-assembly') parent = 'technology-methods';
  else if (id.includes('analysis') || id.includes('annotation')) parent = 'technology-methods';
  else if (id.includes('cancer') || id.includes('clinical')) parent = 'medical-clinical';
  else if (id.includes('ecology') || id === 'biodiversity') parent = 'ecology-environmental';
  else if (id.includes('microb')) parent = 'microbiology-microbiome';
  else if (id.includes('data') || id.includes('algorithm')) parent = 'computational-sciences';
  else if (id === 'systems-biology' || id === 'developmental-biology') parent = 'molecular-cellular';
  else if (id.includes('statistic') || id.includes('bayes') || id.includes('inference')) parent = 'mathematical-statistical';
  
  if (!byParent[parent]) byParent[parent] = [];
  byParent[parent].push(item);
});

console.log('\nGrouped by probable parent:');
Object.entries(byParent).forEach(([parent, items]) => {
  console.log(`\n${parent}: ${items.length} topics`);
  items.forEach(item => {
    console.log(`  - ${item.mappedTo}`);
  });
});