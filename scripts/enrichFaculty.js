const fs = require('fs');
const path = require('path');

// Faculty selected for proof of concept
const POC_FACULTY = [
  { id: 'leonard-guy', name: 'Guy Leonard' },
  { id: 'marcet-houben-marina', name: 'Marina Marcet-Houben' },
  { id: 'mcdonald-daniel', name: 'Daniel McDonald' },
  { id: 'bank-claudia', name: 'Claudia Bank' },
  { id: 'catchen-julian', name: 'Julian Catchen' },
  { id: 'kubatko-laura', name: 'Laura Kubatko' },
  { id: 'malinsky-milan', name: 'Milan Malinsky' },
  { id: 'matschiner-michael', name: 'Michael Matschiner' },
  { id: 'marchet-camille', name: 'Camille Marchet' },
  { id: 'bielawski-joseph', name: 'Joseph Bielawski' }
];

// Enrichment data structure
const createEnrichmentEntry = () => ({
  lastUpdated: new Date().toISOString(),
  confidence: 'low',
  professional: {},
  academic: {},
  profile: {}
});

// Save enriched data
const saveEnrichedData = (enrichedFaculty) => {
  const outputPath = path.join(__dirname, '../src/data/facultyEnriched.json');
  fs.writeFileSync(outputPath, JSON.stringify(enrichedFaculty, null, 2));
  console.log(`Saved enriched data to ${outputPath}`);
};

// Main enrichment function
const enrichFaculty = async () => {
  console.log('Starting Faculty Enrichment Proof of Concept');
  console.log('=' .repeat(50));
  
  const enrichedData = {};
  
  // Initialize enrichment entries
  POC_FACULTY.forEach(faculty => {
    enrichedData[faculty.id] = {
      ...faculty,
      enrichment: createEnrichmentEntry()
    };
  });
  
  // Log the plan
  console.log('\nSelected Faculty for POC:');
  POC_FACULTY.forEach((f, i) => {
    console.log(`${i + 1}. ${f.name} (${f.id})`);
  });
  
  console.log('\nData fields to collect:');
  console.log('- Current Affiliation');
  console.log('- Professional Title');
  console.log('- Department/Unit');
  console.log('- Personal/Lab Website');
  console.log('- ORCID ID');
  console.log('- Research Areas');
  console.log('- Profile Photo URL');
  console.log('- Short Bio\n');
  
  console.log('Ready to start web scraping with Puppeteer...');
  console.log('This will search for public professional information only.');
  console.log('No contact information will be collected.\n');
  
  // Save initial structure
  saveEnrichedData(enrichedData);
  
  return enrichedData;
};

// Run if called directly
if (require.main === module) {
  enrichFaculty();
}

module.exports = { enrichFaculty, POC_FACULTY };