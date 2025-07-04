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

// Create thematic categories
const categories = {
  'Bioinformatics & Computational Biology': {
    keywords: ['bioinformatics', 'computational', 'algorithms', 'data', 'statistical', 'machine learning', 'deep learning', 'programming', 'software', 'methods'],
    areas: new Set()
  },
  'Genomics & Sequencing': {
    keywords: ['genomics', 'genome', 'sequencing', 'assembly', 'annotation', 'variant', 'ngs', 'next-generation', 'long-read', 'nanopore', 'illumina'],
    areas: new Set()
  },
  'Evolution & Phylogenetics': {
    keywords: ['evolution', 'evolutionary', 'phylogen', 'phylodyn', 'molecular clock', 'divergence', 'speciation', 'adaptation', 'selection'],
    areas: new Set()
  },
  'Population Genetics': {
    keywords: ['population', 'demographic', 'coalescent', 'genetic variation', 'allele', 'ancestry', 'migration', 'admixture'],
    areas: new Set()
  },
  'Microbiome & Ecology': {
    keywords: ['microbiome', 'metagenomics', 'microbial', 'ecology', 'environmental', 'marine', 'host-microbe', 'symbiosis'],
    areas: new Set()
  },
  'Comparative Genomics': {
    keywords: ['comparative', 'pangenomics', 'synteny', 'ortholog', 'paralog', 'gene family', 'duplication'],
    areas: new Set()
  },
  'Functional Genomics': {
    keywords: ['transcriptomics', 'rna-seq', 'expression', 'regulation', 'functional', 'proteomics', 'metabolomics'],
    areas: new Set()
  },
  'Human & Medical Genetics': {
    keywords: ['human', 'medical', 'clinical', 'disease', 'cancer', 'gwas', 'precision', 'personalized', 'health'],
    areas: new Set()
  },
  'Ancient DNA & Paleogenomics': {
    keywords: ['ancient', 'paleogenomics', 'archaeogenetics', 'extinct', 'paleopathology', 'neanderthal'],
    areas: new Set()
  },
  'Organism-Specific Studies': {
    keywords: ['plant', 'fungal', 'bacterial', 'viral', 'animal', 'mammal', 'fish', 'insect', 'bird', 'primate'],
    areas: new Set()
  },
  'Structural & Variant Analysis': {
    keywords: ['structural', 'variant', 'snp', 'indel', 'duplication', 'deletion', 'rearrangement', 'chromosom'],
    areas: new Set()
  },
  'Statistical & Mathematical Methods': {
    keywords: ['bayesian', 'statistical', 'mathematical', 'probabilistic', 'inference', 'modeling', 'simulation'],
    areas: new Set()
  }
};

// Categorize research areas
const uncategorized = new Set();

sortedAreas.forEach(([area, count]) => {
  let categorized = false;
  
  for (const [categoryName, category] of Object.entries(categories)) {
    if (category.keywords.some(keyword => area.includes(keyword))) {
      category.areas.add({ area, count });
      categorized = true;
      break;
    }
  }
  
  if (!categorized) {
    uncategorized.add({ area, count });
  }
});

// Generate comprehensive report
console.log('=== COMPREHENSIVE RESEARCH AREAS ANALYSIS ===\n');

console.log('## Summary Statistics');
console.log(`- Total faculty with research areas: ${facultyWithResearchAreas.length}`);
console.log(`- Total unique research areas: ${sortedAreas.length}`);
console.log(`- Total research area mentions: ${Array.from(researchAreas.values()).reduce((a, b) => a + b, 0)}`);
console.log(`- Average research areas per faculty: ${(Array.from(researchAreas.values()).reduce((a, b) => a + b, 0) / facultyWithResearchAreas.length).toFixed(1)}`);

console.log('\n## Thematic Categories\n');

// Sort categories by total mentions
const sortedCategories = Object.entries(categories)
  .map(([name, category]) => ({
    name,
    areas: Array.from(category.areas),
    totalMentions: Array.from(category.areas).reduce((sum, item) => sum + item.count, 0)
  }))
  .sort((a, b) => b.totalMentions - a.totalMentions);

sortedCategories.forEach(category => {
  console.log(`### ${category.name} (${category.totalMentions} mentions)`);
  
  // Sort areas within category by frequency
  const sortedCategoryAreas = category.areas.sort((a, b) => b.count - a.count);
  
  sortedCategoryAreas.forEach(({ area, count }) => {
    console.log(`  - ${area} (${count})`);
  });
  console.log('');
});

console.log(`### Uncategorized Terms (${Array.from(uncategorized).reduce((sum, item) => sum + item.count, 0)} mentions)`);
Array.from(uncategorized).sort((a, b) => b.count - a.count).forEach(({ area, count }) => {
  console.log(`  - ${area} (${count})`);
});

console.log('\n## Standardization Issues Identified\n');

// Find potential duplicates and variations
const duplicateAnalysis = new Map();

sortedAreas.forEach(([area]) => {
  const normalized = area.replace(/[-_\s]/g, '').toLowerCase();
  if (duplicateAnalysis.has(normalized)) {
    duplicateAnalysis.get(normalized).push(area);
  } else {
    duplicateAnalysis.set(normalized, [area]);
  }
});

const potentialDuplicates = Array.from(duplicateAnalysis.entries())
  .filter(([, variations]) => variations.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

console.log('### Potential Duplicates and Variations:');
potentialDuplicates.forEach(([normalized, variations]) => {
  console.log(`**${normalized}**: ${variations.join(', ')}`);
});

// Find similar terms
console.log('\n### Similar Terms Analysis:');
const similarTerms = {
  'genomics variants': ['genomics', 'genome', 'genome assembly', 'genome annotation', 'genome evolution'],
  'sequencing variants': ['sequencing', 'next-generation sequencing', 'ngs', 'long-read sequencing', 'nanopore sequencing'],
  'evolution variants': ['evolution', 'evolutionary biology', 'evolutionary genetics', 'evolutionary genomics'],
  'population variants': ['population genetics', 'population genomics', 'population structure'],
  'phylogenetic variants': ['phylogenetics', 'phylogenomics', 'phylogeography', 'phylodynamics'],
  'microbiome variants': ['microbiome', 'microbiome analysis', 'microbiome evolution', 'gut microbiome'],
  'computational variants': ['computational biology', 'computational genomics', 'computational methods', 'computational phylogenetics']
};

Object.entries(similarTerms).forEach(([group, terms]) => {
  const found = terms.filter(term => researchAreas.has(term));
  if (found.length > 1) {
    console.log(`**${group}**: ${found.map(t => `${t} (${researchAreas.get(t)})`).join(', ')}`);
  }
});

console.log('\n## Hierarchical Structure Suggestions\n');

const hierarchicalStructure = {
  'Computational Biology & Bioinformatics': {
    'Algorithms & Methods': ['algorithms', 'bioinformatics algorithms', 'computational methods', 'statistical methods'],
    'Data Analysis': ['data analysis', 'data mining', 'data science', 'statistical analysis'],
    'Software & Tools': ['bioinformatics tools', 'software development', 'programming'],
    'Machine Learning': ['machine learning', 'deep learning', 'artificial intelligence']
  },
  'Genomics': {
    'Genome Analysis': ['genomics', 'comparative genomics', 'functional genomics', 'structural genomics'],
    'Genome Assembly & Annotation': ['genome assembly', 'genome annotation', 'gene prediction'],
    'Sequencing Technologies': ['next-generation sequencing', 'long-read sequencing', 'single-cell genomics'],
    'Pangenomics': ['pangenomics', 'genome graphs', 'structural variation']
  },
  'Evolution & Phylogenetics': {
    'Molecular Evolution': ['molecular evolution', 'molecular clock', 'divergence time estimation'],
    'Phylogenetic Analysis': ['phylogenetics', 'phylogenomics', 'phylogeography', 'phylodynamics'],
    'Evolutionary Processes': ['natural selection', 'adaptation', 'speciation', 'convergent evolution'],
    'Evolutionary Genomics': ['evolutionary genomics', 'evolutionary genetics', 'adaptive evolution']
  },
  'Population & Quantitative Genetics': {
    'Population Genetics': ['population genetics', 'population structure', 'demographic inference'],
    'Population Genomics': ['population genomics', 'population stratification'],
    'Quantitative Genetics': ['quantitative genetics', 'statistical genetics', 'complex traits'],
    'Association Studies': ['gwas', 'association studies', 'genetic mapping']
  }
};

Object.entries(hierarchicalStructure).forEach(([mainCategory, subCategories]) => {
  console.log(`### ${mainCategory}`);
  Object.entries(subCategories).forEach(([subCategory, examples]) => {
    console.log(`  **${subCategory}**: ${examples.join(', ')}`);
  });
  console.log('');
});

console.log('\n## Recommendations for Standardization\n');

console.log('### 1. Primary Categories to Establish:');
const primaryCategories = [
  'Computational Biology & Bioinformatics',
  'Genomics & Genome Analysis', 
  'Evolution & Phylogenetics',
  'Population & Quantitative Genetics',
  'Microbiome & Microbial Ecology',
  'Functional Genomics & Gene Expression',
  'Human & Medical Genetics',
  'Ancient DNA & Paleogenomics',
  'Organism-Specific Studies',
  'Statistical & Mathematical Methods'
];

primaryCategories.forEach(category => {
  console.log(`- ${category}`);
});

console.log('\n### 2. Terms to Standardize:');
const standardizations = [
  'Use "next-generation sequencing" instead of "NGS"',
  'Use "single-cell genomics" instead of "single cell genomics"',
  'Use "genome assembly" as primary term',
  'Use "phylogenomics" instead of "phylogenomic"',
  'Use "microbiome analysis" as umbrella term',
  'Use "population genomics" for population-level genome studies',
  'Use "computational biology" as primary computational term'
];

standardizations.forEach(rec => {
  console.log(`- ${rec}`);
});

console.log('\n### 3. Hierarchy Levels:');
console.log('- **Level 1**: Broad discipline (e.g., "Genomics")');
console.log('- **Level 2**: Subdiscipline (e.g., "Comparative Genomics")');
console.log('- **Level 3**: Specific methods/approaches (e.g., "Genome Assembly")');
console.log('- **Level 4**: Organism/system-specific (e.g., "Plant Genomics")');