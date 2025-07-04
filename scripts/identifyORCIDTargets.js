#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read enriched data
const enrichedData = JSON.parse(readFileSync(join(__dirname, '../src/data/facultyEnriched.json'), 'utf8'));
const facultyData = JSON.parse(readFileSync(join(__dirname, '../src/data/facultyData.json'), 'utf8'));

// Get participation counts
const participationCounts = {};
facultyData.participations.forEach(p => {
  participationCounts[p.facultyId] = (participationCounts[p.facultyId] || 0) + 1;
});

// Find faculty without ORCID
const withoutOrcid = [];
const withOrcid = [];

Object.entries(enrichedData).forEach(([id, data]) => {
  const hasOrcid = !!data.enrichment?.academic?.orcid;
  const entry = {
    id,
    name: data.name,
    affiliation: data.enrichment?.professional?.affiliation || 'Unknown',
    participations: participationCounts[id] || 0,
    hasWebsite: !!data.enrichment?.professional?.labWebsite
  };
  
  if (hasOrcid) {
    withOrcid.push({ ...entry, orcid: data.enrichment.academic.orcid });
  } else {
    withoutOrcid.push(entry);
  }
});

// Sort by participation count
withoutOrcid.sort((a, b) => b.participations - a.participations);

console.log('ORCID Expansion Target List');
console.log('='.repeat(80));
console.log(`\nCurrent Status: ${withOrcid.length}/161 faculty have ORCID IDs (${(withOrcid.length/161*100).toFixed(1)}%)`);
console.log(`Target: Add ORCIDs for ${withoutOrcid.length} faculty\n`);

// Group by priority
const highPriority = withoutOrcid.filter(f => f.participations >= 3);
const mediumPriority = withoutOrcid.filter(f => f.participations === 2);
const lowPriority = withoutOrcid.filter(f => f.participations === 1);

console.log('Priority Groups:');
console.log(`- High (3+ participations): ${highPriority.length} faculty`);
console.log(`- Medium (2 participations): ${mediumPriority.length} faculty`);
console.log(`- Low (1 participation): ${lowPriority.length} faculty`);

// Print high priority targets
console.log('\n\nHIGH PRIORITY TARGETS (3+ participations):');
console.log('-'.repeat(80));
highPriority.forEach((f, i) => {
  console.log(`${(i+1).toString().padStart(2)}. ${f.name.padEnd(30)} - ${f.participations} years - ${f.affiliation}`);
});

// Print first 20 medium priority
console.log('\n\nMEDIUM PRIORITY TARGETS (2 participations) - First 20:');
console.log('-'.repeat(80));
mediumPriority.slice(0, 20).forEach((f, i) => {
  console.log(`${(i+1).toString().padStart(2)}. ${f.name.padEnd(30)} - ${f.affiliation}`);
});

// Faculty who already have ORCID
console.log('\n\nFaculty WITH ORCID IDs:');
console.log('-'.repeat(80));
withOrcid.sort((a, b) => b.participations - a.participations).forEach((f, i) => {
  console.log(`${(i+1).toString().padStart(2)}. ${f.name.padEnd(30)} - ${f.orcid}`);
});

console.log(`\n\nRecommendation: Start with the ${highPriority.length} high-priority faculty (3+ participations)`);
console.log('These represent the most active instructors who would benefit most from ORCID visibility.');