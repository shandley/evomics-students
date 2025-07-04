#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the faculty data
const facultyDataPath = join(__dirname, '../src/data/facultyData.json');
const allFacultyPath = join(__dirname, '../src/data/all_faculty.txt');

const facultyData = JSON.parse(readFileSync(facultyDataPath, 'utf8'));

console.log('Merging duplicate faculty entries...\n');

// Find the two entries
const fernandez1 = facultyData.faculty.find(f => f.id === 'fernandez-rosa');
const fernandez2 = facultyData.faculty.find(f => f.id === 'fernndez-rosa');

console.log('Found duplicates:');
console.log(`1. ${fernandez1.firstName} ${fernandez1.lastName} (${fernandez1.id})`);
console.log(`2. ${fernandez2.firstName} ${fernandez2.lastName} (${fernandez2.id})`);

// The correct spelling has the accent: Fernández (fernndez-rosa has the accent)
// We'll keep fernandez-rosa as the ID but update the lastName to have the accent

// Update the faculty entry
const fernandezIndex = facultyData.faculty.findIndex(f => f.id === 'fernandez-rosa');
facultyData.faculty[fernandezIndex].lastName = 'Fernández'; // Add accent

// Remove the duplicate
facultyData.faculty = facultyData.faculty.filter(f => f.id !== 'fernndez-rosa');

// Update all participations from fernndez-rosa to fernandez-rosa
let updatedCount = 0;
facultyData.participations.forEach(p => {
  if (p.facultyId === 'fernndez-rosa') {
    p.facultyId = 'fernandez-rosa';
    updatedCount++;
  }
});

console.log(`\nUpdated ${updatedCount} participation records`);

// Sort faculty by last name, first name for consistency
facultyData.faculty.sort((a, b) => {
  const lastCompare = a.lastName.localeCompare(b.lastName);
  if (lastCompare !== 0) return lastCompare;
  return a.firstName.localeCompare(b.firstName);
});

// Write updated faculty data
writeFileSync(facultyDataPath, JSON.stringify(facultyData, null, 2));
console.log('\n✓ Updated facultyData.json');

// Update all_faculty.txt - remove the duplicate
const allFaculty = readFileSync(allFacultyPath, 'utf8').split('\n').filter(Boolean);
const updatedAllFaculty = allFaculty.filter(id => id !== 'fernndez-rosa');
writeFileSync(allFacultyPath, updatedAllFaculty.join('\n') + '\n');
console.log('✓ Updated all_faculty.txt');

// Summary
console.log('\nMerge complete:');
console.log(`- Kept ID: fernandez-rosa`);
console.log(`- Updated name: Rosa Fernández (with accent)`);
console.log(`- Merged ${updatedCount} participations`);
console.log(`- Total faculty: ${facultyData.faculty.length}`);