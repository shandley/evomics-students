#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read enriched data
const enrichedData = JSON.parse(readFileSync(join(__dirname, '../src/data/facultyEnriched.json'), 'utf8'));

// Find all without ORCID
const withoutOrcid = Object.entries(enrichedData)
  .filter(([id, data]) => !data.enrichment?.academic?.orcid)
  .map(([id, data]) => ({
    id,
    name: data.name,
    title: data.enrichment?.professional?.title || 'Unknown',
    affiliation: data.enrichment?.professional?.affiliation || 'Unknown',
    hasWebsite: !!data.enrichment?.professional?.labWebsite
  }));

console.log(`\nRemaining faculty without ORCID (${withoutOrcid.length} total):`);
console.log('='.repeat(80));
console.log('Need 6 more to reach 90% coverage\n');

// Group by likely availability
const professors = withoutOrcid.filter(f => f.title.toLowerCase().includes('professor'));
const researchers = withoutOrcid.filter(f => 
  f.title.toLowerCase().includes('researcher') || 
  f.title.toLowerCase().includes('scientist') ||
  f.title.toLowerCase().includes('bioinformatician'));
const others = withoutOrcid.filter(f => 
  !f.title.toLowerCase().includes('professor') && 
  !f.title.toLowerCase().includes('researcher') &&
  !f.title.toLowerCase().includes('scientist') &&
  !f.title.toLowerCase().includes('bioinformatician'));

if (professors.length > 0) {
  console.log('PROFESSORS (Most likely to have ORCID):');
  console.log('-'.repeat(40));
  professors.forEach((f, i) => {
    console.log(`${(i+1).toString().padStart(2)}. ${f.name.padEnd(30)} - ${f.title}`);
    console.log(`    ${f.affiliation} (${f.id})`);
  });
}

if (researchers.length > 0) {
  console.log('\n\nRESEARCHERS/SCIENTISTS:');
  console.log('-'.repeat(40));
  researchers.forEach((f, i) => {
    console.log(`${(i+1).toString().padStart(2)}. ${f.name.padEnd(30)} - ${f.title}`);
    console.log(`    ${f.affiliation} (${f.id})`);
  });
}

if (others.length > 0) {
  console.log('\n\nOTHER POSITIONS:');
  console.log('-'.repeat(40));
  others.slice(0, 10).forEach((f, i) => {
    console.log(`${(i+1).toString().padStart(2)}. ${f.name.padEnd(30)} - ${f.title}`);
    console.log(`    ${f.affiliation} (${f.id})`);
  });
}

// Special cases to check
console.log('\n\nSPECIAL CASES TO CHECK:');
console.log('-'.repeat(40));
const specialCases = withoutOrcid.filter(f => 
  f.name.includes('é') || 
  f.name.includes('è') || 
  f.name.includes('ñ') ||
  f.name.includes('ç') ||
  f.affiliation.includes('Max Planck') ||
  f.affiliation.includes('Harvard') ||
  f.affiliation.includes('Oxford') ||
  f.affiliation.includes('Cambridge'));
  
specialCases.forEach(f => {
  console.log(`- ${f.name} at ${f.affiliation} (${f.id})`);
});