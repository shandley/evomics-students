#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read enriched faculty data
const enrichedData = JSON.parse(readFileSync(join(__dirname, '../src/data/facultyEnriched.json'), 'utf8'));

console.log('ANALYZING CURRENT RESEARCH TERMS');
console.log('='.repeat(80));

// Extract all research areas
const termFrequency = {};
const termsByFaculty = {};
let totalTerms = 0;
let facultyWithTerms = 0;

Object.entries(enrichedData).forEach(([facultyId, data]) => {
  const researchAreas = data.enrichment?.academic?.researchAreas || [];
  
  if (researchAreas.length > 0) {
    facultyWithTerms++;
    termsByFaculty[facultyId] = researchAreas;
    
    researchAreas.forEach(term => {
      totalTerms++;
      const normalizedTerm = term.trim().toLowerCase();
      termFrequency[normalizedTerm] = (termFrequency[normalizedTerm] || 0) + 1;
    });
  }
});

// Sort terms by frequency
const sortedTerms = Object.entries(termFrequency)
  .sort(([,a], [,b]) => b - a);

console.log(`\nTotal faculty with research areas: ${facultyWithTerms}`);
console.log(`Total unique terms: ${sortedTerms.length}`);
console.log(`Total term occurrences: ${totalTerms}`);
console.log(`Average terms per faculty: ${(totalTerms / facultyWithTerms).toFixed(1)}`);

// Top 100 terms
console.log('\n\nTOP 100 MOST FREQUENT TERMS');
console.log('-'.repeat(80));
console.log('Rank | Term | Count | % of Total');
console.log('-'.repeat(80));

const top100 = sortedTerms.slice(0, 100);
top100.forEach(([term, count], index) => {
  const percentage = ((count / totalTerms) * 100).toFixed(1);
  console.log(`${(index + 1).toString().padStart(4)} | ${term.padEnd(50)} | ${count.toString().padStart(5)} | ${percentage.padStart(5)}%`);
});

// Analyze term patterns
console.log('\n\nTERM PATTERN ANALYSIS');
console.log('-'.repeat(80));

// Find similar terms (potential duplicates)
const similarTermGroups = {};
sortedTerms.forEach(([term1, count1]) => {
  sortedTerms.forEach(([term2, count2]) => {
    if (term1 !== term2) {
      // Check for very similar terms
      if (
        term1.replace(/[-\s]/g, '') === term2.replace(/[-\s]/g, '') || // Same without spaces/hyphens
        term1.includes(term2) || term2.includes(term1) || // One contains the other
        levenshteinDistance(term1, term2) <= 2 // Very close spelling
      ) {
        const key = [term1, term2].sort().join('::');
        if (!similarTermGroups[key]) {
          similarTermGroups[key] = { terms: [term1, term2], counts: [count1, count2] };
        }
      }
    }
  });
});

console.log('\nPotential duplicate terms:');
Object.values(similarTermGroups).forEach(group => {
  if (group.terms[0] !== group.terms[1]) { // Avoid showing same term twice
    console.log(`- "${group.terms[0]}" (${group.counts[0]}) <-> "${group.terms[1]}" (${group.counts[1]})`);
  }
});

// Category analysis
console.log('\n\nCATEGORY ANALYSIS');
console.log('-'.repeat(80));

const categories = {
  genomics: { pattern: /genom|sequenc|ngs|assembly/i, count: 0, terms: new Set() },
  evolution: { pattern: /evol|phylo|speciat|darwin/i, count: 0, terms: new Set() },
  bioinformatics: { pattern: /bioinform|computational|algorithm|software/i, count: 0, terms: new Set() },
  population: { pattern: /population|demograph|genetic variation|coalescent/i, count: 0, terms: new Set() },
  microbiome: { pattern: /microbi|bacteria|viral|pathogen/i, count: 0, terms: new Set() },
  statistics: { pattern: /statist|bayes|model|inference/i, count: 0, terms: new Set() },
  molecular: { pattern: /molecular|protein|gene|expression|regulation/i, count: 0, terms: new Set() },
  ecology: { pattern: /ecolog|environment|biodiversity|conservation/i, count: 0, terms: new Set() },
  medical: { pattern: /medic|clinic|disease|cancer|human/i, count: 0, terms: new Set() },
  cellular: { pattern: /cell|development|differentiation|stem/i, count: 0, terms: new Set() }
};

sortedTerms.forEach(([term, count]) => {
  Object.entries(categories).forEach(([catName, catData]) => {
    if (catData.pattern.test(term)) {
      catData.count += count;
      catData.terms.add(term);
    }
  });
});

console.log('Category | Term Count | Occurrence Count | Top Terms');
console.log('-'.repeat(80));
Object.entries(categories)
  .sort(([,a], [,b]) => b.count - a.count)
  .forEach(([catName, catData]) => {
    const topTerms = Array.from(catData.terms)
      .map(t => ({ term: t, count: termFrequency[t] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(t => `${t.term} (${t.count})`)
      .join(', ');
    
    console.log(`${catName.padEnd(15)} | ${catData.terms.size.toString().padStart(10)} | ${catData.count.toString().padStart(15)} | ${topTerms}`);
  });

// Generate mapping candidates
console.log('\n\nGENERATING TOP 100 MAPPING FILE...');

const mappingCandidates = top100.map(([term, count]) => ({
  originalTerm: term,
  frequency: count,
  suggestedMapping: suggestMapping(term),
  confidence: 'medium',
  notes: ''
}));

// Write to file
import { writeFileSync } from 'fs';
const outputPath = join(__dirname, '../src/data/taxonomy/mappingCandidates.json');
writeFileSync(outputPath, JSON.stringify(mappingCandidates, null, 2));
console.log(`\nMapping candidates written to: ${outputPath}`);

// Helper functions
function levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

function suggestMapping(term) {
  // Simple mapping suggestions based on common patterns
  const mappings = {
    'bioinformatics': 'bioinformatics',
    'computational biology': 'computational-biology',
    'genomics': 'genomics-omics',
    'evolutionary biology': 'evolutionary-biology',
    'phylogenetics': 'phylogenetics',
    'population genetics': 'population-genetics',
    'molecular evolution': 'molecular-evolution',
    'microbiome': 'microbiome-research',
    'next-generation sequencing': 'sequencing-technology',
    'ngs': 'sequencing-technology',
    'comparative genomics': 'comparative-genomics',
    'functional genomics': 'functional-genomics',
    'transcriptomics': 'transcriptomics',
    'metagenomics': 'metagenomics',
    'single-cell genomics': 'single-cell-genomics',
    'single cell genomics': 'single-cell-genomics'
  };
  
  return mappings[term] || null;
}

console.log('\n' + '='.repeat(80));
console.log('ANALYSIS COMPLETE');