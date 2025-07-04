#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ORCID updates based on web search results
const orcidUpdates = {
  // Michael Cummings - Could not find ORCID in search results
  
  // Manfred Grabherr - Already has ORCID: 0000-0001-8792-6508
  
  'mclysaght-aoife': {
    orcid: '0000-0003-2552-6220',
    confidence: 'high',
    source: 'ORCID website'
  },
  
  'molloy-erin': {
    orcid: '0000-0001-5553-3312',
    confidence: 'high',
    source: 'ORCID website'
  },
  
  'moyle-leonie': {
    orcid: '0000-0003-4960-8001',
    confidence: 'high',
    source: 'New Phytologist journal'
  },
  
  'pearson-william': {
    orcid: '0000-0002-0727-3680',
    confidence: 'high',
    source: 'Wikidata'
  },
  
  'schleper-christa': {
    orcid: '0000-0002-1918-2735',
    confidence: 'high',
    source: 'ORCID website'
  },
  
  'shekhar-karthik': {
    orcid: '0000-0003-4349-6600',
    confidence: 'high',
    source: 'ORCID website'
  },
  
  'stanke-mario': {
    orcid: '0000-0001-8696-0384',
    confidence: 'high',
    source: 'Publications'
  },
  
  'uller-tobias': {
    orcid: '0000-0003-1293-5842',
    confidence: 'high',
    source: 'Lund University profile'
  }
};

// Load the existing enriched data
const enrichedDataPath = path.join(__dirname, '../src/data/facultyEnriched.json');
const enrichedData = JSON.parse(fs.readFileSync(enrichedDataPath, 'utf-8'));

// Update each faculty member
let updatedCount = 0;
for (const [facultyId, update] of Object.entries(orcidUpdates)) {
  if (enrichedData[facultyId]) {
    if (!enrichedData[facultyId].enrichment) {
      enrichedData[facultyId].enrichment = {
        lastUpdated: new Date().toISOString(),
        confidence: 'pending'
      };
    }
    
    if (!enrichedData[facultyId].enrichment.academic) {
      enrichedData[facultyId].enrichment.academic = {};
    }
    
    // Update ORCID
    enrichedData[facultyId].enrichment.academic.orcid = update.orcid;
    
    // Update confidence if it's better than current
    if (update.confidence === 'high' && enrichedData[facultyId].enrichment.confidence !== 'high') {
      enrichedData[facultyId].enrichment.confidence = 'high';
    }
    
    // Update last updated timestamp
    enrichedData[facultyId].enrichment.lastUpdated = new Date().toISOString();
    
    console.log(`Updated ${facultyId} with ORCID: ${update.orcid} (source: ${update.source})`);
    updatedCount++;
  }
}

// Save the updated data
fs.writeFileSync(enrichedDataPath, JSON.stringify(enrichedData, null, 2), 'utf-8');

console.log(`\nUpdate complete! Updated ${updatedCount} faculty members with ORCID IDs.`);

// Summary of faculty without ORCID
console.log('\nNote: Could not find ORCID for:');
console.log('- Michael Cummings (University of Maryland) - No ORCID found in search results');
console.log('\nAlready had ORCID:');
console.log('- Manfred Grabherr (Uppsala University) - Already has ORCID: 0000-0001-8792-6508');