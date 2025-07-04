import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the faculty enriched data
const dataPath = path.join(__dirname, '..', 'src', 'data', 'facultyEnriched.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Extract research areas
const researchAreas = new Map();
const facultyWithResearchAreas = [];

Object.values(data).forEach(faculty => {
  if (faculty.enrichment && faculty.enrichment.academic && faculty.enrichment.academic.researchAreas) {
    const areas = faculty.enrichment.academic.researchAreas;
    facultyWithResearchAreas.push({
      name: faculty.name,
      areas: areas
    });
    
    areas.forEach(area => {
      // Clean up the area text
      const cleanArea = area.trim().toLowerCase();
      if (researchAreas.has(cleanArea)) {
        researchAreas.set(cleanArea, researchAreas.get(cleanArea) + 1);
      } else {
        researchAreas.set(cleanArea, 1);
      }
    });
  }
});

// Sort by frequency
const sortedAreas = Array.from(researchAreas.entries()).sort((a, b) => b[1] - a[1]);

console.log('=== RESEARCH AREAS ANALYSIS ===\n');
console.log(`Total faculty with research areas: ${facultyWithResearchAreas.length}`);
console.log(`Total unique research areas: ${sortedAreas.length}`);
console.log(`Total research area mentions: ${Array.from(researchAreas.values()).reduce((a, b) => a + b, 0)}`);

console.log('\n=== RESEARCH AREAS BY FREQUENCY ===');
sortedAreas.forEach(([area, count]) => {
  console.log(`${count}: ${area}`);
});

console.log('\n=== FACULTY WITH RESEARCH AREAS ===');
facultyWithResearchAreas.forEach(faculty => {
  console.log(`${faculty.name}: ${faculty.areas.join(', ')}`);
});

// Analyze patterns
console.log('\n=== PATTERN ANALYSIS ===');

// Group by common keywords
const keywords = new Map();
sortedAreas.forEach(([area, count]) => {
  const words = area.split(/\s+/);
  words.forEach(word => {
    if (word.length > 3) { // Skip short words
      const cleanWord = word.replace(/[^a-zA-Z]/g, '');
      if (cleanWord.length > 3) {
        if (keywords.has(cleanWord)) {
          keywords.set(cleanWord, keywords.get(cleanWord) + count);
        } else {
          keywords.set(cleanWord, count);
        }
      }
    }
  });
});

const sortedKeywords = Array.from(keywords.entries()).sort((a, b) => b[1] - a[1]);

console.log('\nTop keywords in research areas:');
sortedKeywords.slice(0, 20).forEach(([word, count]) => {
  console.log(`${count}: ${word}`);
});

// Look for evolutionary/genomic themes
console.log('\n=== EVOLUTIONARY & GENOMIC THEMES ===');
const evolutionaryTerms = sortedAreas.filter(([area]) => 
  area.includes('evolution') || area.includes('evolutionary') || area.includes('phylogen')
);
const genomicTerms = sortedAreas.filter(([area]) => 
  area.includes('genom') || area.includes('genetic') || area.includes('dna') || area.includes('sequenc')
);

console.log('\nEvolutionary terms:');
evolutionaryTerms.forEach(([area, count]) => {
  console.log(`${count}: ${area}`);
});

console.log('\nGenomic terms:');
genomicTerms.forEach(([area, count]) => {
  console.log(`${count}: ${area}`);
});