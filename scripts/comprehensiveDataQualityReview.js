#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read all data files
const facultyData = JSON.parse(readFileSync(join(__dirname, '../src/data/facultyData.json'), 'utf8'));
const enrichedData = JSON.parse(readFileSync(join(__dirname, '../src/data/facultyEnriched.json'), 'utf8'));

console.log('COMPREHENSIVE FACULTY DATA QUALITY REVIEW');
console.log('='.repeat(80));
console.log(`Report generated: ${new Date().toISOString()}\n`);

// 1. Overall Coverage Statistics
console.log('1. OVERALL COVERAGE STATISTICS');
console.log('-'.repeat(40));
const totalFaculty = facultyData.faculty.length;
const enrichedCount = Object.keys(enrichedData).length;
const enrichmentRate = ((enrichedCount / totalFaculty) * 100).toFixed(1);
console.log(`Total faculty in system: ${totalFaculty}`);
console.log(`Enriched faculty: ${enrichedCount} (${enrichmentRate}%)`);
console.log(`Not enriched: ${totalFaculty - enrichedCount}`);

// 2. ORCID Coverage
console.log('\n\n2. ORCID COVERAGE ANALYSIS');
console.log('-'.repeat(40));
const withOrcid = Object.values(enrichedData).filter(f => f.enrichment?.academic?.orcid).length;
const orcidCoverage = ((withOrcid / enrichedCount) * 100).toFixed(1);
console.log(`Faculty with ORCID: ${withOrcid}/${enrichedCount} (${orcidCoverage}%)`);

// ORCID format validation
const invalidOrcids = [];
Object.entries(enrichedData).forEach(([id, data]) => {
  const orcid = data.enrichment?.academic?.orcid;
  if (orcid && !/^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/.test(orcid)) {
    invalidOrcids.push({ id, orcid });
  }
});
console.log(`ORCID format validation: ${invalidOrcids.length} issues found`);
if (invalidOrcids.length > 0) {
  invalidOrcids.forEach(item => console.log(`  - ${item.id}: ${item.orcid}`));
}

// 3. Professional Information Completeness
console.log('\n\n3. PROFESSIONAL INFORMATION COMPLETENESS');
console.log('-'.repeat(40));
const hasTitle = Object.values(enrichedData).filter(f => f.enrichment?.professional?.title).length;
const hasAffiliation = Object.values(enrichedData).filter(f => f.enrichment?.professional?.affiliation).length;
const hasDepartment = Object.values(enrichedData).filter(f => f.enrichment?.professional?.department).length;
const hasWebsite = Object.values(enrichedData).filter(f => f.enrichment?.professional?.labWebsite).length;

console.log(`With professional title: ${hasTitle}/${enrichedCount} (${((hasTitle/enrichedCount)*100).toFixed(1)}%)`);
console.log(`With affiliation: ${hasAffiliation}/${enrichedCount} (${((hasAffiliation/enrichedCount)*100).toFixed(1)}%)`);
console.log(`With department: ${hasDepartment}/${enrichedCount} (${((hasDepartment/enrichedCount)*100).toFixed(1)}%)`);
console.log(`With lab website: ${hasWebsite}/${enrichedCount} (${((hasWebsite/enrichedCount)*100).toFixed(1)}%)`);

// 4. Academic Information Completeness
console.log('\n\n4. ACADEMIC INFORMATION COMPLETENESS');
console.log('-'.repeat(40));
const hasResearchAreas = Object.values(enrichedData).filter(f => f.enrichment?.academic?.researchAreas?.length > 0).length;
const hasBio = Object.values(enrichedData).filter(f => f.enrichment?.profile?.shortBio).length;
console.log(`With research areas: ${hasResearchAreas}/${enrichedCount} (${((hasResearchAreas/enrichedCount)*100).toFixed(1)}%)`);
console.log(`With biography: ${hasBio}/${enrichedCount} (${((hasBio/enrichedCount)*100).toFixed(1)}%)`);

// 5. Data Confidence Levels
console.log('\n\n5. DATA CONFIDENCE DISTRIBUTION');
console.log('-'.repeat(40));
const confidence = { high: 0, medium: 0, low: 0, other: 0 };
Object.values(enrichedData).forEach(data => {
  const level = data.enrichment?.confidence || 'other';
  if (confidence.hasOwnProperty(level)) {
    confidence[level]++;
  } else {
    confidence.other++;
  }
});
console.log(`High confidence: ${confidence.high} (${((confidence.high/enrichedCount)*100).toFixed(1)}%)`);
console.log(`Medium confidence: ${confidence.medium} (${((confidence.medium/enrichedCount)*100).toFixed(1)}%)`);
console.log(`Low confidence: ${confidence.low} (${((confidence.low/enrichedCount)*100).toFixed(1)}%)`);
if (confidence.other > 0) {
  console.log(`Other/Unknown: ${confidence.other}`);
}

// 6. Workshop Coverage
console.log('\n\n6. WORKSHOP-SPECIFIC COVERAGE');
console.log('-'.repeat(40));
const workshopStats = {};
facultyData.participations.forEach(p => {
  if (!workshopStats[p.workshopId]) {
    workshopStats[p.workshopId] = { total: new Set(), enriched: new Set() };
  }
  workshopStats[p.workshopId].total.add(p.facultyId);
  if (enrichedData[p.facultyId]) {
    workshopStats[p.workshopId].enriched.add(p.facultyId);
  }
});

Object.entries(workshopStats).forEach(([workshop, stats]) => {
  const coverage = ((stats.enriched.size / stats.total.size) * 100).toFixed(1);
  console.log(`${workshop.toUpperCase()}: ${stats.enriched.size}/${stats.total.size} faculty enriched (${coverage}%)`);
});

// 7. High-Participation Faculty Coverage
console.log('\n\n7. HIGH-PARTICIPATION FACULTY COVERAGE');
console.log('-'.repeat(40));
const participationCounts = {};
facultyData.participations.forEach(p => {
  participationCounts[p.facultyId] = (participationCounts[p.facultyId] || 0) + 1;
});

const highParticipation = Object.entries(participationCounts)
  .filter(([_, count]) => count >= 5)
  .map(([id, count]) => ({ id, count, enriched: !!enrichedData[id] }));

const highPartEnriched = highParticipation.filter(f => f.enriched).length;
console.log(`Faculty with 5+ participations: ${highParticipation.length}`);
console.log(`Enriched: ${highPartEnriched}/${highParticipation.length} (${((highPartEnriched/highParticipation.length)*100).toFixed(1)}%)`);

// 8. Data Quality Issues
console.log('\n\n8. DATA QUALITY ISSUES DETECTED');
console.log('-'.repeat(40));
const issues = [];

// Check for missing critical data
Object.entries(enrichedData).forEach(([id, data]) => {
  if (!data.enrichment?.professional?.affiliation) {
    issues.push(`${id}: Missing affiliation`);
  }
  if (!data.enrichment?.professional?.title) {
    issues.push(`${id}: Missing professional title`);
  }
});

// Check for potential duplicates
const nameMap = {};
facultyData.faculty.forEach(f => {
  const fullName = `${f.firstName} ${f.lastName}`.toLowerCase();
  if (!nameMap[fullName]) nameMap[fullName] = [];
  nameMap[fullName].push(f.id);
});
Object.entries(nameMap).forEach(([name, ids]) => {
  if (ids.length > 1) {
    issues.push(`Potential duplicate: ${name} (${ids.join(', ')})`);
  }
});

console.log(`Total issues found: ${issues.length}`);
if (issues.length > 0 && issues.length <= 10) {
  issues.forEach(issue => console.log(`  - ${issue}`));
} else if (issues.length > 10) {
  issues.slice(0, 10).forEach(issue => console.log(`  - ${issue}`));
  console.log(`  ... and ${issues.length - 10} more`);
}

// 9. Recent Updates
console.log('\n\n9. RECENT UPDATE ACTIVITY');
console.log('-'.repeat(40));
const today = new Date();
const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

const recentUpdates = Object.values(enrichedData).filter(data => {
  const updateDate = new Date(data.enrichment?.lastUpdated || 0);
  return updateDate > lastWeek;
}).length;

const monthlyUpdates = Object.values(enrichedData).filter(data => {
  const updateDate = new Date(data.enrichment?.lastUpdated || 0);
  return updateDate > lastMonth;
}).length;

console.log(`Updated in last 7 days: ${recentUpdates}`);
console.log(`Updated in last 30 days: ${monthlyUpdates}`);

// 10. Summary Score
console.log('\n\n10. OVERALL DATA QUALITY SCORE');
console.log('-'.repeat(40));
const scores = {
  enrichmentCoverage: enrichedCount / totalFaculty,
  orcidCoverage: withOrcid / enrichedCount,
  professionalCompleteness: (hasTitle + hasAffiliation + hasDepartment) / (enrichedCount * 3),
  academicCompleteness: (hasResearchAreas + hasBio) / (enrichedCount * 2),
  highConfidence: confidence.high / enrichedCount
};

const overallScore = (Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length * 100).toFixed(1);

console.log('Component scores:');
Object.entries(scores).forEach(([component, score]) => {
  console.log(`  ${component}: ${(score * 100).toFixed(1)}%`);
});
console.log(`\nOVERALL QUALITY SCORE: ${overallScore}%`);

// Grade assignment
let grade = 'F';
if (overallScore >= 90) grade = 'A+';
else if (overallScore >= 85) grade = 'A';
else if (overallScore >= 80) grade = 'B+';
else if (overallScore >= 75) grade = 'B';
else if (overallScore >= 70) grade = 'C+';
else if (overallScore >= 65) grade = 'C';
else if (overallScore >= 60) grade = 'D';

console.log(`QUALITY GRADE: ${grade}`);

console.log('\n' + '='.repeat(80));
console.log('END OF REPORT');