#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read all data files
const facultyData = JSON.parse(readFileSync(join(__dirname, '../src/data/facultyData.json'), 'utf8'));
const enrichedData = JSON.parse(readFileSync(join(__dirname, '../src/data/facultyEnriched.json'), 'utf8'));
const enrichedList = readFileSync(join(__dirname, '../src/data/enriched_faculty.txt'), 'utf8')
  .split('\n').filter(Boolean);

console.log('Faculty Enrichment Coverage Analysis');
console.log('='.repeat(60));

// Get all faculty IDs
const allFacultyIds = facultyData.faculty.map(f => f.id);
console.log(`\nTotal faculty in system: ${allFacultyIds.length}`);

// Check enrichment status
const enrichedInJson = Object.keys(enrichedData);
console.log(`Faculty in facultyEnriched.json: ${enrichedInJson.length}`);
console.log(`Faculty in enriched_faculty.txt: ${enrichedList.length}`);

// Find discrepancies
const inJsonNotInList = enrichedInJson.filter(id => !enrichedList.includes(id));
const inListNotInJson = enrichedList.filter(id => !enrichedInJson.includes(id));
const notEnriched = allFacultyIds.filter(id => !enrichedInJson.includes(id));

console.log(`\nDiscrepancies:`);
console.log(`- In JSON but not in list: ${inJsonNotInList.length}`);
console.log(`- In list but not in JSON: ${inListNotInJson.length}`);

// Calculate participation stats for unenriched faculty
const participationStats = {};
facultyData.participations.forEach(p => {
  if (!participationStats[p.facultyId]) {
    participationStats[p.facultyId] = 0;
  }
  participationStats[p.facultyId]++;
});

// Sort unenriched by participation count
const unenrichedWithStats = notEnriched.map(id => {
  const faculty = facultyData.faculty.find(f => f.id === id);
  return {
    id,
    name: `${faculty.firstName} ${faculty.lastName}`,
    participations: participationStats[id] || 0
  };
}).sort((a, b) => b.participations - a.participations);

console.log(`\n\nUnenriched Faculty (${notEnriched.length} total):`);
console.log('='.repeat(60));
console.log('\nTop 20 by participation count:');
unenrichedWithStats.slice(0, 20).forEach((f, i) => {
  console.log(`${(i + 1).toString().padStart(2)}. ${f.name.padEnd(30)} - ${f.participations} participations (${f.id})`);
});

// Workshop coverage analysis
const workshopCoverage = {
  wog: { total: 0, enriched: 0 },
  wpsg: { total: 0, enriched: 0 },
  wphylo: { total: 0, enriched: 0 }
};

const facultyWorkshops = {};
facultyData.participations.forEach(p => {
  if (!facultyWorkshops[p.facultyId]) {
    facultyWorkshops[p.facultyId] = new Set();
  }
  facultyWorkshops[p.facultyId].add(p.workshopId);
});

Object.entries(facultyWorkshops).forEach(([facultyId, workshops]) => {
  workshops.forEach(workshop => {
    workshopCoverage[workshop].total++;
    if (enrichedInJson.includes(facultyId)) {
      workshopCoverage[workshop].enriched++;
    }
  });
});

console.log('\n\nWorkshop Coverage:');
console.log('='.repeat(60));
Object.entries(workshopCoverage).forEach(([workshop, stats]) => {
  const percent = ((stats.enriched / stats.total) * 100).toFixed(1);
  console.log(`${workshop.toUpperCase()}: ${stats.enriched}/${stats.total} (${percent}%)`);
});

// Summary
console.log('\n\nSUMMARY:');
console.log('='.repeat(60));
console.log(`Total Faculty: ${allFacultyIds.length}`);
console.log(`Enriched: ${enrichedInJson.length} (${((enrichedInJson.length / allFacultyIds.length) * 100).toFixed(1)}%)`);
console.log(`Not Enriched: ${notEnriched.length} (${((notEnriched.length / allFacultyIds.length) * 100).toFixed(1)}%)`);

// Data quality check
console.log('\n\nData Quality Check:');
console.log('='.repeat(60));
const hasOrcid = Object.values(enrichedData).filter(f => f.enrichment?.academic?.orcid).length;
const hasLabWebsite = Object.values(enrichedData).filter(f => f.enrichment?.professional?.labWebsite).length;
const hasResearchAreas = Object.values(enrichedData).filter(f => f.enrichment?.academic?.researchAreas?.length > 0).length;
const hasBio = Object.values(enrichedData).filter(f => f.enrichment?.profile?.shortBio).length;

console.log(`With ORCID: ${hasOrcid}/${enrichedInJson.length} (${((hasOrcid / enrichedInJson.length) * 100).toFixed(1)}%)`);
console.log(`With Lab Website: ${hasLabWebsite}/${enrichedInJson.length} (${((hasLabWebsite / enrichedInJson.length) * 100).toFixed(1)}%)`);
console.log(`With Research Areas: ${hasResearchAreas}/${enrichedInJson.length} (${((hasResearchAreas / enrichedInJson.length) * 100).toFixed(1)}%)`);
console.log(`With Bio: ${hasBio}/${enrichedInJson.length} (${((hasBio / enrichedInJson.length) * 100).toFixed(1)}%)`);