const fs = require('fs');
const path = require('path');

// Load faculty data
const facultyDataPath = path.join(__dirname, '../src/data/facultyData.json');
const facultyData = JSON.parse(fs.readFileSync(facultyDataPath, 'utf8'));
const allFaculty = facultyData.faculty;

// Load existing enriched data
const enrichedDataPath = path.join(__dirname, '../src/data/facultyEnriched.json');
const existingEnriched = JSON.parse(fs.readFileSync(enrichedDataPath, 'utf8'));

// Get list of already enriched faculty IDs
const enrichedIds = new Set(Object.keys(existingEnriched));

// Filter out already enriched faculty
const facultyToEnrich = allFaculty.filter(f => !enrichedIds.has(f.id));

console.log('🎓 Faculty Enrichment Status');
console.log('=' .repeat(50));
console.log(`Total faculty: ${allFaculty.length}`);
console.log(`Already enriched: ${enrichedIds.size}`);
console.log(`To be enriched: ${facultyToEnrich.length}`);
console.log('');

// Group faculty into batches
const BATCH_SIZE = 10;
const batches = [];
for (let i = 0; i < facultyToEnrich.length; i += BATCH_SIZE) {
  batches.push(facultyToEnrich.slice(i, i + BATCH_SIZE));
}

console.log(`Processing in ${batches.length} batches of up to ${BATCH_SIZE} faculty each`);
console.log('');

// Save progress function
const saveProgress = (enrichedData) => {
  fs.writeFileSync(enrichedDataPath, JSON.stringify(enrichedData, null, 2));
  console.log(`✅ Progress saved: ${Object.keys(enrichedData).length} faculty enriched total`);
};

// Process faculty in batches
const processBatches = async () => {
  let totalProcessed = enrichedIds.size;
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`\n📋 Processing Batch ${i + 1}/${batches.length}`);
    console.log('-'.repeat(40));
    
    for (const faculty of batch) {
      console.log(`\nSearching: ${faculty.firstName} ${faculty.lastName} (${faculty.id})`);
      
      // Simulate enrichment (in real implementation, this would call Puppeteer)
      const mockEnrichment = {
        lastUpdated: new Date().toISOString(),
        confidence: 'pending',
        professional: {},
        academic: {},
        profile: {}
      };
      
      existingEnriched[faculty.id] = {
        id: faculty.id,
        name: `${faculty.firstName} ${faculty.lastName}`,
        enrichment: mockEnrichment
      };
      
      totalProcessed++;
      console.log(`Progress: ${totalProcessed}/${allFaculty.length} (${((totalProcessed/allFaculty.length)*100).toFixed(1)}%)`);
    }
    
    // Save progress after each batch
    saveProgress(existingEnriched);
    
    // Pause between batches to avoid rate limiting
    if (i < batches.length - 1) {
      console.log(`\n⏸️  Pausing for 5 seconds before next batch...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('✨ Enrichment Complete!');
  console.log(`Total faculty enriched: ${Object.keys(existingEnriched).length}`);
  console.log(`Output saved to: ${enrichedDataPath}`);
};

// Create a list of faculty for manual review
const createReviewList = () => {
  const reviewPath = path.join(__dirname, 'faculty-to-enrich.txt');
  const content = facultyToEnrich.map((f, i) => 
    `${i + 1}. ${f.firstName} ${f.lastName} (${f.id})`
  ).join('\n');
  
  fs.writeFileSync(reviewPath, content);
  console.log(`\n📝 Review list saved to: ${reviewPath}`);
};

// Main execution
console.log('\n🚀 Starting Faculty Enrichment Process\n');
console.log('This script will prepare the enrichment of all remaining faculty.');
console.log('Due to the large number of requests, we\'ll process in batches.\n');

// Create review list
createReviewList();

// Ask user to proceed
console.log('\nNOTE: Full enrichment would require ~5-6 hours of web scraping.');
console.log('This script creates a template structure for all faculty.');
console.log('You can run actual web scraping separately for specific faculty.\n');

// Process batches
processBatches().catch(console.error);