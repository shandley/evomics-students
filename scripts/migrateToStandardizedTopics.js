#!/usr/bin/env node

/**
 * Migration Script: Convert faculty research areas to standardized topics
 * 
 * This script:
 * 1. Reads current faculty enriched data
 * 2. Maps research areas to standardized topics
 * 3. Preserves original terms
 * 4. Creates backup before modification
 * 5. Supports dry-run mode
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const createBackup = !args.includes('--no-backup');
const verbose = args.includes('--verbose');

console.log('FACULTY DATA MIGRATION TO STANDARDIZED TOPICS');
console.log('='.repeat(80));
console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
console.log(`Backup: ${createBackup ? 'YES' : 'NO'}`);
console.log(`Verbose: ${verbose ? 'YES' : 'NO'}`);
console.log('');

// Load data files
const dataDir = join(__dirname, '../src/data');
const enrichedPath = join(dataDir, 'facultyEnriched.json');
const taxonomyPath = join(dataDir, 'taxonomy/scientificTopics.json');
const mappingsPath = join(dataDir, 'taxonomy/termMappings.json');

// Check files exist
if (!existsSync(enrichedPath)) {
  console.error(`ERROR: Faculty enriched data not found at ${enrichedPath}`);
  process.exit(1);
}

// Load data
const enrichedData = JSON.parse(readFileSync(enrichedPath, 'utf8'));
const taxonomy = JSON.parse(readFileSync(taxonomyPath, 'utf8'));
const mappings = JSON.parse(readFileSync(mappingsPath, 'utf8'));

// Create backup if requested
if (createBackup && !isDryRun) {
  const backupPath = enrichedPath.replace('.json', `.backup-${new Date().toISOString().split('T')[0]}.json`);
  copyFileSync(enrichedPath, backupPath);
  console.log(`Backup created: ${backupPath}\n`);
}

// Build topic lookup map
const topicMap = new Map();
// Add all topics from all levels
Object.values(taxonomy.topics).forEach(topic => topicMap.set(topic.id, topic));
Object.values(taxonomy.level2 || {}).forEach(topic => topicMap.set(topic.id, topic));
Object.values(taxonomy.level3 || {}).forEach(topic => topicMap.set(topic.id, topic));

// Migration statistics
const stats = {
  totalFaculty: 0,
  facultyWithResearchAreas: 0,
  facultyMigrated: 0,
  totalTerms: 0,
  mappedTerms: 0,
  unmappedTerms: 0,
  uniqueUnmapped: new Set(),
  mappingConfidence: { high: 0, medium: 0, low: 0 }
};

// Migrate faculty data
const migratedData = {};

Object.entries(enrichedData).forEach(([facultyId, facultyData]) => {
  stats.totalFaculty++;
  
  // Check if faculty has research areas
  const researchAreas = facultyData.enrichment?.academic?.researchAreas;
  if (!researchAreas || !Array.isArray(researchAreas)) {
    migratedData[facultyId] = facultyData;
    return;
  }
  
  stats.facultyWithResearchAreas++;
  
  // Check if already migrated (has standardized structure)
  if (researchAreas.raw && researchAreas.standardized) {
    if (verbose) {
      console.log(`${facultyId}: Already migrated, skipping`);
    }
    migratedData[facultyId] = facultyData;
    return;
  }
  
  // Perform migration
  const migrationResult = migrateResearchAreas(researchAreas);
  
  // Create new faculty data with migrated research areas
  const newFacultyData = {
    ...facultyData,
    enrichment: {
      ...facultyData.enrichment,
      academic: {
        ...facultyData.enrichment.academic,
        researchAreas: {
          raw: researchAreas, // Preserve original
          standardized: migrationResult.standardized,
          lastMigrated: new Date().toISOString()
        }
      }
    }
  };
  
  // Update stats
  stats.facultyMigrated++;
  stats.totalTerms += researchAreas.length;
  stats.mappedTerms += migrationResult.mapped;
  stats.unmappedTerms += migrationResult.unmapped.length;
  migrationResult.unmapped.forEach(term => stats.uniqueUnmapped.add(term));
  
  // Log if verbose
  if (verbose && (migrationResult.mapped > 0 || migrationResult.unmapped.length > 0)) {
    console.log(`\n${facultyId} (${facultyData.name || 'Unknown'}):`);
    console.log(`  Original terms: ${researchAreas.length}`);
    console.log(`  Mapped: ${migrationResult.mapped}`);
    if (migrationResult.unmapped.length > 0) {
      console.log(`  Unmapped: ${migrationResult.unmapped.join(', ')}`);
    }
  }
  
  migratedData[facultyId] = newFacultyData;
});

// Function to migrate research areas
function migrateResearchAreas(rawTerms) {
  const standardized = {
    primary: [],
    secondary: [],
    techniques: []
  };
  
  const unmapped = [];
  let mapped = 0;
  const seen = new Set();
  
  rawTerms.forEach(term => {
    const normalizedTerm = term.toLowerCase().trim();
    const mapping = mappings.mappings[normalizedTerm];
    
    if (mapping) {
      const topic = topicMap.get(mapping.standardizedId);
      if (topic && !seen.has(topic.id)) {
        seen.add(topic.id);
        mapped++;
        
        // Update confidence stats
        stats.mappingConfidence[mapping.confidence]++;
        
        // Categorize by level and parent
        if (topic.level === 1 || (topic.level === 2 && topic.parentId !== 'technology-methods')) {
          standardized.primary.push(topic);
        } else if (topic.level === 2 && topic.parentId === 'technology-methods') {
          standardized.techniques.push(topic);
        } else {
          standardized.secondary.push(topic);
        }
      }
    } else {
      unmapped.push(term);
    }
  });
  
  // Sort arrays for consistency
  standardized.primary.sort((a, b) => a.label.localeCompare(b.label));
  standardized.secondary.sort((a, b) => a.label.localeCompare(b.label));
  standardized.techniques.sort((a, b) => a.label.localeCompare(b.label));
  
  return { standardized, unmapped, mapped };
}

// Display results
console.log('\n\nMIGRATION RESULTS');
console.log('='.repeat(80));
console.log(`Total faculty processed: ${stats.totalFaculty}`);
console.log(`Faculty with research areas: ${stats.facultyWithResearchAreas}`);
console.log(`Faculty migrated: ${stats.facultyMigrated}`);
console.log(`\nTerms:`);
console.log(`  Total terms: ${stats.totalTerms}`);
console.log(`  Successfully mapped: ${stats.mappedTerms} (${((stats.mappedTerms / stats.totalTerms) * 100).toFixed(1)}%)`);
console.log(`  Unmapped: ${stats.unmappedTerms} (${((stats.unmappedTerms / stats.totalTerms) * 100).toFixed(1)}%)`);
console.log(`  Unique unmapped terms: ${stats.uniqueUnmapped.size}`);
console.log(`\nMapping confidence:`);
console.log(`  High: ${stats.mappingConfidence.high}`);
console.log(`  Medium: ${stats.mappingConfidence.medium}`);
console.log(`  Low: ${stats.mappingConfidence.low}`);

// Show sample of unmapped terms
if (stats.uniqueUnmapped.size > 0) {
  console.log('\nTop unmapped terms:');
  const unmappedSample = Array.from(stats.uniqueUnmapped).slice(0, 20);
  unmappedSample.forEach(term => console.log(`  - ${term}`));
  if (stats.uniqueUnmapped.size > 20) {
    console.log(`  ... and ${stats.uniqueUnmapped.size - 20} more`);
  }
}

// Write migrated data if not dry run
if (!isDryRun) {
  writeFileSync(enrichedPath, JSON.stringify(migratedData, null, 2));
  console.log(`\n✅ Migration complete! Data written to ${enrichedPath}`);
} else {
  console.log('\n⚠️  DRY RUN - No changes were made to the data files.');
  
  // Write sample output for review
  const samplePath = join(dataDir, 'taxonomy/migrationSample.json');
  const sample = {};
  Object.entries(migratedData).slice(0, 5).forEach(([id, data]) => {
    if (data.enrichment?.academic?.researchAreas?.standardized) {
      sample[id] = {
        name: data.name,
        original: data.enrichment.academic.researchAreas.raw,
        standardized: data.enrichment.academic.researchAreas.standardized
      };
    }
  });
  writeFileSync(samplePath, JSON.stringify(sample, null, 2));
  console.log(`Sample output written to ${samplePath}`);
}

// Create unmapped terms report
const unmappedReportPath = join(dataDir, 'taxonomy/unmappedTermsReport.json');
writeFileSync(unmappedReportPath, JSON.stringify({
  date: new Date().toISOString(),
  totalUnmapped: stats.uniqueUnmapped.size,
  terms: Array.from(stats.uniqueUnmapped).sort()
}, null, 2));
console.log(`\nUnmapped terms report: ${unmappedReportPath}`);

console.log('\n' + '='.repeat(80));
console.log('Migration script completed.');