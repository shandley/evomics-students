#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load taxonomy and mapping data
const taxonomyData = JSON.parse(readFileSync(join(__dirname, '../src/data/taxonomy/scientificTopics.json'), 'utf8'));
const mappingData = JSON.parse(readFileSync(join(__dirname, '../src/data/taxonomy/termMappings.json'), 'utf8'));

console.log('TAXONOMY VALIDATION');
console.log('='.repeat(80));

// Basic validation of taxonomy structure
let errors = [];
let warnings = [];

// Check Level 1 topics
console.log('\nLevel 1 Topics:');
Object.entries(taxonomyData.topics).forEach(([id, topic]) => {
  console.log(`  - ${topic.label} (${topic.children.length} children)`);
  
  if (!topic.id || !topic.label || !topic.level) {
    errors.push(`Level 1 topic ${id} missing required fields`);
  }
  
  if (topic.level !== 1) {
    errors.push(`Topic ${id} in topics section has level ${topic.level}, expected 1`);
  }
});

// Check Level 2 topics
console.log('\nLevel 2 Topics Sample:');
const level2Topics = Object.entries(taxonomyData.level2).slice(0, 10);
level2Topics.forEach(([id, topic]) => {
  console.log(`  - ${topic.label} (parent: ${topic.parentId})`);
  
  if (!topic.parentId) {
    errors.push(`Level 2 topic ${id} missing parent`);
  }
  
  if (!taxonomyData.topics[topic.parentId]) {
    errors.push(`Level 2 topic ${id} has invalid parent: ${topic.parentId}`);
  }
});
console.log(`  ... and ${Object.keys(taxonomyData.level2).length - 10} more`);

// Validate mappings
console.log('\n\nMAPPING VALIDATION');
console.log('-'.repeat(80));

// Check if all mapped topics exist
const allTopicIds = new Set([
  ...Object.keys(taxonomyData.topics),
  ...Object.keys(taxonomyData.level2 || {}),
  ...Object.keys(taxonomyData.level3 || {})
]);

let invalidMappings = 0;
Object.entries(mappingData.mappings).forEach(([term, mapping]) => {
  if (!allTopicIds.has(mapping.standardizedId)) {
    invalidMappings++;
    errors.push(`Mapping for "${term}" points to non-existent topic: ${mapping.standardizedId}`);
  }
});

console.log(`Total mappings: ${Object.keys(mappingData.mappings).length}`);
console.log(`Valid mappings: ${Object.keys(mappingData.mappings).length - invalidMappings}`);
console.log(`Invalid mappings: ${invalidMappings}`);

// Check mapping confidence distribution
const confidenceCounts = { high: 0, medium: 0, low: 0 };
Object.values(mappingData.mappings).forEach(mapping => {
  confidenceCounts[mapping.confidence]++;
});

console.log('\nMapping Confidence:');
console.log(`  High: ${confidenceCounts.high}`);
console.log(`  Medium: ${confidenceCounts.medium}`);
console.log(`  Low: ${confidenceCounts.low}`);

// Load faculty data and check coverage
const enrichedData = JSON.parse(readFileSync(join(__dirname, '../src/data/facultyEnriched.json'), 'utf8'));

console.log('\n\nFACULTY TERM COVERAGE');
console.log('-'.repeat(80));

// Extract all unique terms
const allFacultyTerms = new Set();
let totalFacultyTerms = 0;

Object.values(enrichedData).forEach(faculty => {
  const terms = faculty.enrichment?.academic?.researchAreas || [];
  terms.forEach(term => {
    totalFacultyTerms++;
    allFacultyTerms.add(term.toLowerCase().trim());
  });
});

// Check mapping coverage
const mappedTermsSet = new Set(Object.keys(mappingData.mappings));
let mappedCount = 0;
const unmappedTerms = [];

allFacultyTerms.forEach(term => {
  if (mappedTermsSet.has(term)) {
    mappedCount++;
  } else {
    unmappedTerms.push(term);
  }
});

const coveragePercent = ((mappedCount / allFacultyTerms.size) * 100).toFixed(1);

console.log(`Total unique faculty terms: ${allFacultyTerms.size}`);
console.log(`Mapped terms: ${mappedCount}`);
console.log(`Unmapped terms: ${unmappedTerms.length}`);
console.log(`Coverage: ${coveragePercent}%`);

console.log('\nTop 20 Unmapped Terms:');
unmappedTerms.sort().slice(0, 20).forEach(term => {
  console.log(`  - ${term}`);
});

// Summary
console.log('\n\nVALIDATION SUMMARY');
console.log('='.repeat(80));

if (errors.length === 0) {
  console.log('✅ No critical errors found');
} else {
  console.log(`❌ ${errors.length} errors found:`);
  errors.slice(0, 5).forEach(error => console.log(`   - ${error}`));
  if (errors.length > 5) {
    console.log(`   ... and ${errors.length - 5} more`);
  }
}

if (warnings.length > 0) {
  console.log(`\n⚠️  ${warnings.length} warnings:`);
  warnings.forEach(warning => console.log(`   - ${warning}`));
}

console.log('\nNext Steps:');
console.log('1. Add mappings for the remaining unmapped terms');
console.log('2. Expand Level 3 and Level 4 topics as needed');
console.log('3. Review and improve low-confidence mappings');
console.log('4. Add descriptions to all Level 2 topics');

// Write unmapped terms to file for review
import { writeFileSync } from 'fs';
const unmappedPath = join(__dirname, '../src/data/taxonomy/unmappedTerms.json');
writeFileSync(unmappedPath, JSON.stringify({
  totalTerms: allFacultyTerms.size,
  mappedTerms: mappedCount,
  unmappedTerms: unmappedTerms.sort(),
  coverage: coveragePercent
}, null, 2));

console.log(`\nUnmapped terms written to: ${unmappedPath}`);