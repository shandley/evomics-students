#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ORCID IDs found through search - Final batch
const orcidsToAdd = [
  // Professors without ORCIDs
  { id: 'lorenzen-eline', orcid: '0000-0002-6353-2819', name: 'Eline Lorenzen' }
];

// Read the enriched faculty data
const dataPath = join(__dirname, '../src/data/facultyEnriched.json');
const enrichedData = JSON.parse(readFileSync(dataPath, 'utf8'));

console.log('Adding ORCID IDs to faculty profiles...\n');

let updatedCount = 0;

orcidsToAdd.forEach(({ id, orcid, name }) => {
  if (enrichedData[id]) {
    if (!enrichedData[id].enrichment.academic) {
      enrichedData[id].enrichment.academic = {};
    }
    
    const existing = enrichedData[id].enrichment.academic.orcid;
    if (existing !== orcid) {
      enrichedData[id].enrichment.academic.orcid = orcid;
      enrichedData[id].enrichment.lastUpdated = new Date().toISOString();
      console.log(`✓ Added ORCID ${orcid} for ${name}`);
      updatedCount++;
    } else {
      console.log(`- ${name} already has ORCID ${orcid}`);
    }
  } else {
    console.log(`✗ ${name} (${id}) not found in enriched data`);
  }
});

// Write back the updated data
if (updatedCount > 0) {
  writeFileSync(dataPath, JSON.stringify(enrichedData, null, 2));
  console.log(`\n✓ Updated ${updatedCount} faculty profiles with ORCID IDs`);
} else {
  console.log('\nNo updates needed.');
}

// Count total ORCID coverage
let totalWithOrcid = 0;
Object.values(enrichedData).forEach(faculty => {
  if (faculty.enrichment?.academic?.orcid) {
    totalWithOrcid++;
  }
});

console.log(`\nORCID Coverage: ${totalWithOrcid}/${Object.keys(enrichedData).length} (${(totalWithOrcid/Object.keys(enrichedData).length * 100).toFixed(1)}%)`);

// List remaining faculty needing ORCID IDs
const needingOrcid = [
  'catchen-julian',
  'kubatko-laura', 
  'malinsky-milan',
  'matschiner-michael',
  'marchet-camille',
  'bielawski-joseph'
];

console.log('\nStill need ORCID IDs for:');
needingOrcid.forEach(id => {
  if (enrichedData[id] && !enrichedData[id].enrichment?.academic?.orcid) {
    console.log(`- ${enrichedData[id].name}`);
  }
});