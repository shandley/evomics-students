#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the enriched faculty data
const dataPath = join(__dirname, '../src/data/facultyEnriched.json');
const enrichedData = JSON.parse(readFileSync(dataPath, 'utf8'));

// Find all faculty with pending status
const pendingFaculty = [];
const validFaculty = [];

Object.entries(enrichedData).forEach(([id, data]) => {
  if (data.enrichment?.confidence === 'pending') {
    // Check if they have any actual enrichment data
    const hasData = 
      (data.enrichment.professional && Object.keys(data.enrichment.professional).length > 0) ||
      (data.enrichment.academic && Object.keys(data.enrichment.academic).length > 0) ||
      (data.enrichment.profile && Object.keys(data.enrichment.profile).length > 0);
    
    if (!hasData) {
      pendingFaculty.push(id);
    } else {
      // Has data but marked as pending - should be updated
      validFaculty.push({
        id,
        message: 'Has data but marked as pending'
      });
    }
  }
});

console.log(`\nFound ${pendingFaculty.length} faculty with pending status and no data:`);
console.log('═'.repeat(60));

pendingFaculty.forEach(id => {
  console.log(`- ${id}`);
});

if (validFaculty.length > 0) {
  console.log(`\n\nFound ${validFaculty.length} faculty with data but marked as pending:`);
  console.log('═'.repeat(60));
  validFaculty.forEach(({ id, message }) => {
    console.log(`- ${id}: ${message}`);
  });
}

// Option to remove pending entries
console.log('\n\nOptions:');
console.log('1. Remove all pending entries with no data from facultyEnriched.json');
console.log('2. List faculty IDs that need enrichment');
console.log('3. Exit without changes');

// Read user input
process.stdin.resume();
process.stdin.setEncoding('utf8');

console.log('\nEnter option (1, 2, or 3): ');

process.stdin.on('data', function (text) {
  const option = text.trim();
  
  if (option === '1') {
    // Remove pending entries
    const cleanedData = {};
    Object.entries(enrichedData).forEach(([id, data]) => {
      if (!(pendingFaculty.includes(id))) {
        cleanedData[id] = data;
      }
    });
    
    // Write back the cleaned data
    writeFileSync(dataPath, JSON.stringify(cleanedData, null, 2));
    console.log(`\nRemoved ${pendingFaculty.length} pending entries from facultyEnriched.json`);
    
    // Also update enriched_faculty.txt
    const enrichedListPath = join(__dirname, '../src/data/enriched_faculty.txt');
    const enrichedList = readFileSync(enrichedListPath, 'utf8').split('\n').filter(Boolean);
    const cleanedList = enrichedList.filter(id => !pendingFaculty.includes(id));
    writeFileSync(enrichedListPath, cleanedList.join('\n') + '\n');
    console.log(`Updated enriched_faculty.txt (removed ${enrichedList.length - cleanedList.length} entries)`);
    
  } else if (option === '2') {
    // Save list of faculty needing enrichment
    const needsEnrichmentPath = join(__dirname, '../src/data/needs_enrichment.txt');
    writeFileSync(needsEnrichmentPath, pendingFaculty.join('\n') + '\n');
    console.log(`\nSaved list of ${pendingFaculty.length} faculty needing enrichment to needs_enrichment.txt`);
    
  } else if (option === '3') {
    console.log('\nExiting without changes.');
  } else {
    console.log('\nInvalid option. Exiting without changes.');
  }
  
  process.exit(0);
});