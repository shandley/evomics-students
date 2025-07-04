#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read enriched data
const enrichedData = JSON.parse(readFileSync(join(__dirname, '../src/data/facultyEnriched.json'), 'utf8'));

// Find professors/directors without ORCID
const noOrcid = Object.entries(enrichedData)
  .filter(([id, data]) => !data.enrichment?.academic?.orcid)
  .filter(([id, data]) => {
    const title = data.enrichment?.professional?.title?.toLowerCase() || '';
    return title.includes('professor') || title.includes('director') || title.includes('chair');
  })
  .map(([id, data]) => ({
    id,
    name: data.name,
    title: data.enrichment?.professional?.title,
    affiliation: data.enrichment?.professional?.affiliation
  }));

console.log(`\nProfessors/Directors/Chairs without ORCID (${noOrcid.length}):`);
console.log('='.repeat(60));

noOrcid.forEach((f, i) => {
  console.log(`${(i+1).toString().padStart(2)}. ${f.name.padEnd(30)} - ${f.title}`);
  console.log(`    ${f.affiliation}`);
  console.log(`    ID: ${f.id}`);
  console.log('');
});

// Also find any with prestigious positions
const prestigious = Object.entries(enrichedData)
  .filter(([id, data]) => !data.enrichment?.academic?.orcid)
  .filter(([id, data]) => {
    const affiliation = data.enrichment?.professional?.affiliation?.toLowerCase() || '';
    return affiliation.includes('max planck') || 
           affiliation.includes('harvard') || 
           affiliation.includes('mit') || 
           affiliation.includes('stanford') ||
           affiliation.includes('oxford') ||
           affiliation.includes('cambridge');
  })
  .map(([id, data]) => ({
    id,
    name: data.name,
    affiliation: data.enrichment?.professional?.affiliation
  }));

if (prestigious.length > 0) {
  console.log('\nFaculty at prestigious institutions without ORCID:');
  console.log('='.repeat(60));
  prestigious.forEach(f => {
    console.log(`- ${f.name} at ${f.affiliation} (${f.id})`);
  });
}