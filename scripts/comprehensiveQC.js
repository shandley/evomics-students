#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read all data files
const facultyData = JSON.parse(readFileSync(join(__dirname, '../src/data/facultyData.json'), 'utf8'));
const enrichedData = JSON.parse(readFileSync(join(__dirname, '../src/data/facultyEnriched.json'), 'utf8'));

console.log('Comprehensive Quality Control Report');
console.log('='.repeat(80));

// 1. Check for broken or suspicious URLs
console.log('\n1. URL Quality Check');
console.log('-'.repeat(40));
const urlIssues = [];
Object.entries(enrichedData).forEach(([id, data]) => {
  const labUrl = data.enrichment?.professional?.labWebsite;
  if (labUrl) {
    // Check for common issues
    if (!labUrl.startsWith('http://') && !labUrl.startsWith('https://')) {
      urlIssues.push({ id, issue: 'Missing protocol', url: labUrl });
    }
    if (labUrl.includes(' ')) {
      urlIssues.push({ id, issue: 'Contains spaces', url: labUrl });
    }
    if (labUrl.endsWith('/') && labUrl.length > 8) {
      urlIssues.push({ id, issue: 'Trailing slash', url: labUrl });
    }
  }
});
console.log(`URLs checked: ${Object.values(enrichedData).filter(d => d.enrichment?.professional?.labWebsite).length}`);
console.log(`Issues found: ${urlIssues.length}`);
urlIssues.forEach(issue => {
  console.log(`  - ${issue.id}: ${issue.issue} (${issue.url})`);
});

// 2. ORCID Format Validation
console.log('\n\n2. ORCID Format Validation');
console.log('-'.repeat(40));
const orcidIssues = [];
const orcidPattern = /^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/;
Object.entries(enrichedData).forEach(([id, data]) => {
  const orcid = data.enrichment?.academic?.orcid;
  if (orcid && !orcidPattern.test(orcid)) {
    orcidIssues.push({ id, orcid });
  }
});
console.log(`ORCIDs checked: ${Object.values(enrichedData).filter(d => d.enrichment?.academic?.orcid).length}`);
console.log(`Format issues: ${orcidIssues.length}`);
orcidIssues.forEach(issue => {
  console.log(`  - ${issue.id}: ${issue.orcid}`);
});

// 3. Name Consistency Check
console.log('\n\n3. Name Consistency Check');
console.log('-'.repeat(40));
const nameIssues = [];
Object.entries(enrichedData).forEach(([id, enrichedFaculty]) => {
  const faculty = facultyData.faculty.find(f => f.id === id);
  if (faculty) {
    const expectedName = `${faculty.firstName} ${faculty.lastName}`;
    if (enrichedFaculty.name !== expectedName) {
      nameIssues.push({
        id,
        expected: expectedName,
        found: enrichedFaculty.name
      });
    }
  }
});
console.log(`Names checked: ${Object.keys(enrichedData).length}`);
console.log(`Mismatches found: ${nameIssues.length}`);
nameIssues.forEach(issue => {
  console.log(`  - ${issue.id}: Expected "${issue.expected}", found "${issue.found}"`);
});

// 4. Research Areas Analysis
console.log('\n\n4. Research Areas Analysis');
console.log('-'.repeat(40));
const allResearchAreas = {};
let emptyResearchAreas = 0;
Object.values(enrichedData).forEach(data => {
  const areas = data.enrichment?.academic?.researchAreas || [];
  if (areas.length === 0) emptyResearchAreas++;
  areas.forEach(area => {
    const normalized = area.toLowerCase().trim();
    allResearchAreas[normalized] = (allResearchAreas[normalized] || 0) + 1;
  });
});
const sortedAreas = Object.entries(allResearchAreas)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20);
console.log(`Total unique research areas: ${Object.keys(allResearchAreas).length}`);
console.log(`Faculty with empty research areas: ${emptyResearchAreas}`);
console.log('\nTop 20 research areas:');
sortedAreas.forEach(([area, count]) => {
  console.log(`  ${count.toString().padStart(3)} - ${area}`);
});

// 5. Affiliation Standardization Check
console.log('\n\n5. Affiliation Analysis');
console.log('-'.repeat(40));
const affiliations = {};
Object.values(enrichedData).forEach(data => {
  const affiliation = data.enrichment?.professional?.affiliation;
  if (affiliation) {
    affiliations[affiliation] = (affiliations[affiliation] || 0) + 1;
  }
});
const multipleFromSame = Object.entries(affiliations)
  .filter(([_, count]) => count > 1)
  .sort((a, b) => b[1] - a[1]);
console.log(`Unique affiliations: ${Object.keys(affiliations).length}`);
console.log(`Institutions with multiple faculty:`);
multipleFromSame.forEach(([inst, count]) => {
  console.log(`  ${count} - ${inst}`);
});

// 6. Data Completeness by Confidence Level
console.log('\n\n6. Data Completeness by Confidence');
console.log('-'.repeat(40));
const byConfidence = { high: [], medium: [], low: [], pending: [] };
Object.entries(enrichedData).forEach(([id, data]) => {
  const confidence = data.enrichment?.confidence || 'unknown';
  if (byConfidence[confidence]) {
    byConfidence[confidence].push(id);
  }
});
Object.entries(byConfidence).forEach(([level, ids]) => {
  console.log(`${level}: ${ids.length} faculty`);
});

// 7. Missing Critical Data
console.log('\n\n7. Missing Critical Data');
console.log('-'.repeat(40));
const missingTitle = [];
const missingAffiliation = [];
const missingDepartment = [];
const missingBio = [];

Object.entries(enrichedData).forEach(([id, data]) => {
  if (!data.enrichment?.professional?.title) missingTitle.push(id);
  if (!data.enrichment?.professional?.affiliation) missingAffiliation.push(id);
  if (!data.enrichment?.professional?.department) missingDepartment.push(id);
  if (!data.enrichment?.profile?.shortBio) missingBio.push(id);
});

console.log(`Missing title: ${missingTitle.length}`);
console.log(`Missing affiliation: ${missingAffiliation.length}`);
console.log(`Missing department: ${missingDepartment.length}`);
console.log(`Missing bio: ${missingBio.length}`);

if (missingTitle.length > 0 && missingTitle.length <= 10) {
  console.log('\nFaculty missing title:', missingTitle.join(', '));
}

// 8. Special Characters in Names
console.log('\n\n8. Special Characters Check');
console.log('-'.repeat(40));
const specialCharNames = [];
facultyData.faculty.forEach(f => {
  const fullName = `${f.firstName} ${f.lastName}`;
  if (/[àáäâèéëêìíïîòóöôùúüûñç]/i.test(fullName)) {
    specialCharNames.push({ id: f.id, name: fullName });
  }
});
console.log(`Names with special characters: ${specialCharNames.length}`);
specialCharNames.forEach(f => {
  console.log(`  - ${f.id}: ${f.name}`);
});

// Summary
console.log('\n\n' + '='.repeat(80));
console.log('SUMMARY OF ISSUES TO ADDRESS:');
console.log('='.repeat(80));
const totalIssues = urlIssues.length + orcidIssues.length + nameIssues.length + 
                   missingTitle.length + missingAffiliation.length;
console.log(`Total potential issues: ${totalIssues}`);
console.log('\nPriority fixes:');
if (urlIssues.length > 0) console.log(`- Fix ${urlIssues.length} URL issues`);
if (orcidIssues.length > 0) console.log(`- Fix ${orcidIssues.length} ORCID format issues`);
if (nameIssues.length > 0) console.log(`- Fix ${nameIssues.length} name mismatches`);
if (missingTitle.length > 0) console.log(`- Add ${missingTitle.length} missing titles`);
if (missingAffiliation.length > 0) console.log(`- Add ${missingAffiliation.length} missing affiliations`);

console.log('\nNext recommended action:');
if (totalIssues > 5) {
  console.log('→ Fix data quality issues before adding more ORCIDs');
} else {
  console.log('→ Proceed with ORCID expansion - data quality is excellent!');
}