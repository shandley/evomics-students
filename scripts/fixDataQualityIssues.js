#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read data files
const enrichedPath = join(__dirname, '../src/data/facultyEnriched.json');
const facultyDataPath = join(__dirname, '../src/data/facultyData.json');
const enrichedData = JSON.parse(readFileSync(enrichedPath, 'utf8'));
const facultyData = JSON.parse(readFileSync(facultyDataPath, 'utf8'));

console.log('Fixing Data Quality Issues...\n');

let fixCount = 0;

// 1. Fix trailing slashes in URLs
console.log('1. Removing trailing slashes from URLs:');
Object.entries(enrichedData).forEach(([id, data]) => {
  if (data.enrichment?.professional?.labWebsite) {
    const url = data.enrichment.professional.labWebsite;
    if (url.endsWith('/') && url.length > 8) {
      enrichedData[id].enrichment.professional.labWebsite = url.slice(0, -1);
      console.log(`   ✓ ${id}: ${url} → ${url.slice(0, -1)}`);
      fixCount++;
    }
  }
});

// 2. Fix name consistency issues (update facultyData.json to match enriched names)
console.log('\n2. Fixing name inconsistencies:');
const nameUpdates = {
  'ahren-dag': { firstName: 'Dag', lastName: 'Ahrén' },
  'barth-julia': { firstName: 'Julia M.I.', lastName: 'Barth' },
  'gabaldon-toni': { firstName: 'Toni', lastName: 'Gabaldón' },
  'neilsen-rasmus': { firstName: 'Rasmus', lastName: 'Nielsen' },
  'rodriguez-ezpeleta-naiara': { firstName: 'Naiara', lastName: 'Rodriguez-Ezpeleta' },
  'ocana-pallares-eduard': { firstName: 'Eduard', lastName: 'Ocaña-Pallarès' },
  'montoliu-nern-merc': { firstName: 'Mercè', lastName: 'Montoliu-Nerin' },
  'martinez-redondo-gemma': { firstName: 'Gemma Isabel', lastName: 'Martínez-Redondo' },
  'kaessman-henrik': { firstName: 'Henrik', lastName: 'Kaessmann' }
};

Object.entries(nameUpdates).forEach(([id, update]) => {
  const faculty = facultyData.faculty.find(f => f.id === id);
  if (faculty) {
    const oldName = `${faculty.firstName} ${faculty.lastName}`;
    faculty.firstName = update.firstName;
    faculty.lastName = update.lastName;
    const newName = `${update.firstName} ${update.lastName}`;
    console.log(`   ✓ ${id}: "${oldName}" → "${newName}"`);
    fixCount++;
  }
});

// 3. Add missing titles
console.log('\n3. Adding missing titles:');
const titleUpdates = {
  'marcet-houben-marina': 'Bioinformatician',
  'catchen-julian': 'Associate Professor',
  'kubatko-laura': 'Professor',
  'malinsky-milan': 'Group Leader',
  'marchet-camille': 'CNRS Researcher',
  'bielawski-joseph': 'Professor',
  'droge-johannes': 'Bioinformatics Specialist',
  'guido-roderic': 'Senior Research Fellow',
  'scofield-doug': 'Senior Bioinformatician'
};

Object.entries(titleUpdates).forEach(([id, title]) => {
  if (enrichedData[id] && !enrichedData[id].enrichment?.professional?.title) {
    if (!enrichedData[id].enrichment.professional) {
      enrichedData[id].enrichment.professional = {};
    }
    enrichedData[id].enrichment.professional.title = title;
    enrichedData[id].enrichment.lastUpdated = new Date().toISOString();
    console.log(`   ✓ ${id}: Added title "${title}"`);
    fixCount++;
  }
});

// 4. Add missing departments for those with titles
console.log('\n4. Adding missing departments:');
const deptUpdates = {
  'marcet-houben-marina': 'Life Sciences Department',
  'catchen-julian': 'Department of Evolution, Ecology, and Behavior',
  'kubatko-laura': 'Department of Statistics and Department of Evolution, Ecology and Organismal Biology',
  'malinsky-milan': 'Evolutionary Genomics',
  'marchet-camille': 'CRIStAL',
  'bielawski-joseph': 'Department of Biology',
  'droge-johannes': 'Centre for Biotechnology',
  'guido-roderic': 'Zoology Department',
  'scofield-doug': 'National Bioinformatics Infrastructure Sweden'
};

Object.entries(deptUpdates).forEach(([id, dept]) => {
  if (enrichedData[id] && !enrichedData[id].enrichment?.professional?.department) {
    enrichedData[id].enrichment.professional.department = dept;
    console.log(`   ✓ ${id}: Added department "${dept}"`);
    fixCount++;
  }
});

// Write updated data
writeFileSync(enrichedPath, JSON.stringify(enrichedData, null, 2));
writeFileSync(facultyDataPath, JSON.stringify(facultyData, null, 2));

console.log(`\n✅ Fixed ${fixCount} data quality issues`);
console.log('   - Updated facultyEnriched.json');
console.log('   - Updated facultyData.json');

// Report remaining issues
console.log('\nRemaining items to address:');
console.log('- 5 faculty still missing bios (fillault-daniel, rodriguez-ezpeleta-naiara, pettersson-olga-vinnere, szollosi-gergely, nordborg-magnus)');
console.log('- Ready to proceed with ORCID expansion!');