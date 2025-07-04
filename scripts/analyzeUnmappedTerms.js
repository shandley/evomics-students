#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load data
const enrichedData = JSON.parse(readFileSync(join(__dirname, '../src/data/facultyEnriched.json'), 'utf8'));
const unmappedReport = JSON.parse(readFileSync(join(__dirname, '../src/data/taxonomy/unmappedTermsReport.json'), 'utf8'));
const mappings = JSON.parse(readFileSync(join(__dirname, '../src/data/taxonomy/termMappings.json'), 'utf8'));

console.log('UNMAPPED TERMS ANALYSIS');
console.log('='.repeat(80));

// Count frequency of unmapped terms
const termFrequency = {};
Object.values(enrichedData).forEach(faculty => {
  const researchAreas = faculty.enrichment?.academic?.researchAreas || [];
  researchAreas.forEach(term => {
    const normalized = term.toLowerCase().trim();
    if (!mappings.mappings[normalized]) {
      termFrequency[term] = (termFrequency[term] || 0) + 1;
    }
  });
});

// Sort by frequency
const sortedTerms = Object.entries(termFrequency)
  .sort(([,a], [,b]) => b - a);

console.log(`Total unique unmapped terms: ${sortedTerms.length}`);
console.log(`\nTop 50 unmapped terms by frequency:`);
console.log('-'.repeat(80));
console.log('Frequency | Term | Category Suggestion');
console.log('-'.repeat(80));

// Categorize terms
sortedTerms.slice(0, 50).forEach(([term, count]) => {
  let category = 'unknown';
  
  // Software/Tools
  if (term.match(/software|tool|package|platform|algorithm|assembler/i) || 
      ['QIIME 2', 'Galaxy platform', 'BEAST 2', 'BEAST software', 'StarBEAST2', 
       'SAMtools', 'BCFtools', 'HTSlib', 'MIRA assembler', 'FASTA algorithm',
       'stacks software', 'BioMart', 'Ensembl Genomes'].includes(term)) {
    category = 'software-tools';
  }
  // Organisms
  else if (term.match(/Arabidopsis|Drosophila|bacteria|fungi|virus|fish|butterfly|insect|bird|mammal/i) ||
           ['Atlantic cod', 'Helicobacter pylori', 'Phytophthora infestans', 'Magnaporthe oryzae'].includes(term)) {
    category = 'organisms';
  }
  // Techniques/Methods
  else if (term.match(/seq$|-seq|sequencing|GWAS|mapping|detection|assembly|analysis/i) ||
           ['RAD-seq', 'RNA-seq', 'NGS', 'SNP detection', 'EST assembly'].includes(term)) {
    category = 'techniques';
  }
  // Evolution/Adaptation
  else if (term.match(/evolution|adaptation|selection|divergence|speciation/i)) {
    category = 'evolution';
  }
  // Disease/Medical
  else if (term.match(/disease|cancer|immune|pathogen|infection|health|clinical/i) ||
           ['COVID-19', 'HIV', 'Black Death', 'thyroid cancer'].includes(term)) {
    category = 'medical';
  }
  // Genomics specific
  else if (term.match(/genomics|genome|genetic|gene|DNA|RNA|chromosome/i)) {
    category = 'genomics';
  }
  // Ecology/Environment
  else if (term.match(/ecology|environment|habitat|marine|ocean|climate/i)) {
    category = 'ecology';
  }
  // Microbiome
  else if (term.match(/microbiome|microbe|microbial|bacteria/i)) {
    category = 'microbiome';
  }
  
  console.log(`${count.toString().padStart(9)} | ${term.padEnd(40)} | ${category}`);
});

// Category summary
const categories = {};
sortedTerms.forEach(([term, count]) => {
  let category = 'unknown';
  // Same categorization logic as above
  if (term.match(/software|tool|package|platform|algorithm|assembler/i) || 
      ['QIIME 2', 'Galaxy platform', 'BEAST 2', 'BEAST software', 'StarBEAST2', 
       'SAMtools', 'BCFtools', 'HTSlib', 'MIRA assembler', 'FASTA algorithm',
       'stacks software', 'BioMart', 'Ensembl Genomes'].includes(term)) {
    category = 'software-tools';
  }
  else if (term.match(/Arabidopsis|Drosophila|bacteria|fungi|virus|fish|butterfly|insect|bird|mammal/i) ||
           ['Atlantic cod', 'Helicobacter pylori', 'Phytophthora infestans', 'Magnaporthe oryzae'].includes(term)) {
    category = 'organisms';
  }
  else if (term.match(/seq$|-seq|sequencing|GWAS|mapping|detection|assembly|analysis/i) ||
           ['RAD-seq', 'RNA-seq', 'NGS', 'SNP detection', 'EST assembly'].includes(term)) {
    category = 'techniques';
  }
  else if (term.match(/evolution|adaptation|selection|divergence|speciation/i)) {
    category = 'evolution';
  }
  else if (term.match(/disease|cancer|immune|pathogen|infection|health|clinical/i) ||
           ['COVID-19', 'HIV', 'Black Death', 'thyroid cancer'].includes(term)) {
    category = 'medical';
  }
  else if (term.match(/genomics|genome|genetic|gene|DNA|RNA|chromosome/i)) {
    category = 'genomics';
  }
  else if (term.match(/ecology|environment|habitat|marine|ocean|climate/i)) {
    category = 'ecology';
  }
  else if (term.match(/microbiome|microbe|microbial|bacteria/i)) {
    category = 'microbiome';
  }
  
  if (!categories[category]) categories[category] = { count: 0, terms: 0 };
  categories[category].count += count;
  categories[category].terms++;
});

console.log('\n\nCATEGORY SUMMARY');
console.log('-'.repeat(80));
console.log('Category | Unique Terms | Total Occurrences');
console.log('-'.repeat(80));
Object.entries(categories)
  .sort(([,a], [,b]) => b.count - a.count)
  .forEach(([cat, data]) => {
    console.log(`${cat.padEnd(20)} | ${data.terms.toString().padStart(12)} | ${data.count.toString().padStart(17)}`);
  });

console.log('\n\nRECOMMENDATIONS');
console.log('-'.repeat(80));
console.log('1. Add Level 3/4 categories for specific organisms (Arabidopsis, Drosophila, etc.)');
console.log('2. Create software/tools category under technology-methods');
console.log('3. Add specific evolution concepts (adaptive evolution, divergence, etc.)');
console.log('4. Expand medical/disease categories');
console.log('5. Add specific sequencing techniques (RAD-seq, RNA-seq, etc.)');

// Generate mapping suggestions
import { writeFileSync } from 'fs';
const suggestions = {};

sortedTerms.slice(0, 100).forEach(([term, count]) => {
  let suggestedId = null;
  let confidence = 'medium';
  let notes = '';
  
  // Software mappings
  if (['QIIME 2', 'Galaxy platform', 'BEAST 2', 'BEAST software', 'StarBEAST2'].includes(term)) {
    suggestedId = 'bioinformatics-software';
    notes = 'Major bioinformatics platform';
  }
  else if (['SAMtools', 'BCFtools', 'HTSlib'].includes(term)) {
    suggestedId = 'sequence-analysis-tools';
    notes = 'Sequence manipulation tools';
  }
  else if (term === 'NGS') {
    suggestedId = 'sequencing-technology';
    confidence = 'high';
    notes = 'Synonym for next-generation sequencing';
  }
  else if (term === 'RAD-seq' || term === 'RNA-seq') {
    suggestedId = 'sequencing-techniques';
    notes = 'Specific sequencing method';
  }
  else if (term.includes('Arabidopsis')) {
    suggestedId = 'model-plant-genomics';
    notes = 'Model organism - plants';
  }
  else if (term === 'Drosophila genetics') {
    suggestedId = 'model-insect-genomics';
    notes = 'Model organism - insects';
  }
  else if (term.match(/adaptive evolution|adaptive genomics|adaptation genomics/)) {
    suggestedId = 'adaptation';
    confidence = 'high';
    notes = 'Maps to existing adaptation category';
  }
  
  if (suggestedId) {
    suggestions[term.toLowerCase()] = {
      standardizedId: suggestedId,
      confidence,
      notes,
      frequency: count
    };
  }
});

const outputPath = join(__dirname, '../src/data/taxonomy/additionalMappingSuggestions.json');
writeFileSync(outputPath, JSON.stringify({
  generated: new Date().toISOString(),
  totalSuggestions: Object.keys(suggestions).length,
  suggestions
}, null, 2));

console.log(`\nMapping suggestions written to: ${outputPath}`);