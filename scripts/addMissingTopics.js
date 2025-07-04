#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load current taxonomy
const taxonomyPath = join(__dirname, '../src/data/taxonomy/scientificTopics.json');
const taxonomy = JSON.parse(readFileSync(taxonomyPath, 'utf8'));

console.log('ADDING MISSING TOPICS TO TAXONOMY');
console.log('='.repeat(80));

// Add missing Level 2 topics
const missingTopics = {
  // Already exists, but listed as children without definition
  "molecular-biology": {
    "id": "molecular-biology",
    "label": "Molecular Biology",
    "level": 2,
    "parentId": "molecular-cellular",
    "description": "Study of molecular basis of biological activity",
    "synonyms": ["molecular mechanisms", "molecular processes"],
    "children": []
  },
  "cell-biology": {
    "id": "cell-biology",
    "label": "Cell Biology",
    "level": 2,
    "parentId": "molecular-cellular",
    "description": "Study of cell structure, function, and behavior",
    "synonyms": ["cellular biology", "cytology"],
    "children": []
  },
  "synthetic-biology": {
    "id": "synthetic-biology",
    "label": "Synthetic Biology",
    "level": 2,
    "parentId": "molecular-cellular",
    "description": "Engineering of biological systems and organisms",
    "synonyms": ["synbio", "biological engineering"],
    "children": []
  },
  "viral-genomics": {
    "id": "viral-genomics",
    "label": "Viral Genomics",
    "level": 2,
    "parentId": "microbiology-microbiome",
    "description": "Genomic analysis of viruses and viral evolution",
    "synonyms": ["virus genomics", "viral genome analysis"],
    "children": []
  },
  "computational-infrastructure": {
    "id": "computational-infrastructure",
    "label": "Computational Infrastructure",
    "level": 2,
    "parentId": "technology-methods",
    "description": "Infrastructure and platforms for computational biology",
    "synonyms": ["bioinformatics infrastructure", "computational platforms"],
    "children": []
  }
};

// Additional missing topics identified from mappings
const additionalMissingTopics = {
  "immunology": {
    "id": "immunology",
    "label": "Immunology",
    "level": 2,
    "parentId": "medical-clinical",
    "description": "Study of immune systems and immune responses",
    "synonyms": ["immunogenetics", "immune system biology"],
    "children": []
  },
  "pathogen-genomics": {
    "id": "pathogen-genomics",
    "label": "Pathogen Genomics",
    "level": 2,
    "parentId": "microbiology-microbiome",
    "description": "Genomic analysis of pathogenic organisms",
    "synonyms": ["pathogen genetics", "infectious disease genomics"],
    "children": []
  },
  "neurobiology": {
    "id": "neurobiology",
    "label": "Neurobiology",
    "level": 2,
    "parentId": "molecular-cellular",
    "description": "Study of the nervous system and neural mechanisms",
    "synonyms": ["neuroscience", "neural biology"],
    "children": []
  },
  "organellar-genomics": {
    "id": "organellar-genomics",
    "label": "Organellar Genomics",
    "level": 2,
    "parentId": "genomics-omics",
    "description": "Genomics of cellular organelles (mitochondria, chloroplasts)",
    "synonyms": ["organelle genomics", "mitochondrial genomics"],
    "children": []
  },
  "mammalian-genomics": {
    "id": "mammalian-genomics",
    "label": "Mammalian Genomics",
    "level": 3,
    "parentId": "vertebrate-genomics",
    "description": "Genomics of mammalian species",
    "synonyms": ["mammal genomics"]
  },
  "landscape-genetics": {
    "id": "landscape-genetics",
    "label": "Landscape Genetics",
    "level": 3,
    "parentId": "population-genetics",
    "description": "Spatial patterns of genetic variation",
    "synonyms": ["spatial genetics", "geographic genetics"]
  },
  "macroevolution": {
    "id": "macroevolution",
    "label": "Macroevolution",
    "level": 2,
    "parentId": "evolutionary-biology",
    "description": "Large-scale evolutionary patterns above species level",
    "synonyms": ["macroevolutionary patterns"],
    "children": []
  }
};

// Need to add vertebrate-genomics as parent for mammalian-genomics
const vertebrateGenomics = {
  "vertebrate-genomics": {
    "id": "vertebrate-genomics",
    "label": "Vertebrate Genomics",
    "level": 2,
    "parentId": "genomics-omics",
    "description": "Genomics of vertebrate organisms",
    "synonyms": ["vertebrate genome analysis"],
    "children": []
  }
};

// Add all missing topics
const allNewTopics = {
  ...missingTopics,
  ...additionalMissingTopics,
  ...vertebrateGenomics
};

// Add topics to taxonomy
let addedCount = 0;
Object.entries(allNewTopics).forEach(([id, topic]) => {
  if (!taxonomy.topics[id]) {
    taxonomy.topics[id] = topic;
    addedCount++;
    console.log(`Added: ${topic.label} (Level ${topic.level})`);
  } else {
    console.log(`Already exists: ${id}`);
  }
});

// Update metadata count
taxonomy.metadata.totalTopics = Object.keys(taxonomy.topics).length;

console.log(`\nTotal topics added: ${addedCount}`);
console.log(`Total topics in taxonomy: ${taxonomy.metadata.totalTopics}`);

// Write updated taxonomy
writeFileSync(taxonomyPath, JSON.stringify(taxonomy, null, 2));
console.log(`\nTaxonomy updated: ${taxonomyPath}`);

console.log('\n' + '='.repeat(80));
console.log('Missing topics added successfully!');