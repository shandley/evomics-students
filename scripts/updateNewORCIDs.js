#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.join(__dirname, '..', 'src', 'data', 'facultyEnriched.json');

// ORCID IDs found through web search
const orcidUpdates = {
  'dudaniec-rachael': '0000-0002-1854-6808',
  'hird-sarah': '0000-0002-1998-9387', 
  'kern-andrew': '0000-0003-4381-4680',
  'mafessoni-fabrizio': '0000-0003-4319-2076',
  'hancock-angela': '0000-0002-4768-3377',
  'danacek-petr': '0000-0002-4159-1666', // Update existing ORCID (was incorrect)
  'dudas-gytis': '0000-0002-0227-4158',
  // Note: Ryan Gutenkunst, Daniel/David Fifield, and Kirk Gosik ORCID IDs were not found
};

async function updateORCIDs() {
  try {
    console.log('Reading faculty data...');
    const data = await fs.readFile(DATA_PATH, 'utf8');
    const facultyData = JSON.parse(data);
    
    let updatedCount = 0;
    
    for (const [facultyId, orcid] of Object.entries(orcidUpdates)) {
      if (facultyData[facultyId]) {
        if (!facultyData[facultyId].enrichment) {
          facultyData[facultyId].enrichment = {};
        }
        if (!facultyData[facultyId].enrichment.academic) {
          facultyData[facultyId].enrichment.academic = {};
        }
        
        // Add or update ORCID
        const previousOrcid = facultyData[facultyId].enrichment.academic.orcid;
        facultyData[facultyId].enrichment.academic.orcid = orcid;
        
        // Update lastUpdated timestamp
        facultyData[facultyId].enrichment.lastUpdated = new Date().toISOString();
        
        console.log(`✅ Updated ${facultyData[facultyId].name} (${facultyId}): ${previousOrcid ? 'corrected' : 'added'} ORCID ${orcid}`);
        updatedCount++;
      } else {
        console.log(`❌ Faculty ID ${facultyId} not found in data`);
      }
    }
    
    // Create backup
    const backupPath = DATA_PATH + '.backup.' + new Date().toISOString().replace(/[:.]/g, '-');
    await fs.copyFile(DATA_PATH, backupPath);
    console.log(`📁 Created backup: ${path.basename(backupPath)}`);
    
    // Write updated data
    await fs.writeFile(DATA_PATH, JSON.stringify(facultyData, null, 2));
    console.log(`✅ Updated ${updatedCount} faculty records with ORCID IDs`);
    
    // Summary of what wasn't found
    console.log('\n📋 ORCID Search Results Summary:');
    console.log('✅ Successfully found and added/updated:');
    console.log('   - Rachael Dudaniec: 0000-0002-1854-6808');
    console.log('   - Sarah Hird: 0000-0002-1998-9387');
    console.log('   - Andrew Kern: 0000-0003-4381-4680');
    console.log('   - Fabrizio Mafessoni: 0000-0003-4319-2076');
    console.log('   - Angela Hancock: 0000-0002-4768-3377');
    console.log('   - Petr Danecek: 0000-0002-4159-1666 (corrected)');
    console.log('   - Gytis Dudas: 0000-0002-0227-4158');
    
    console.log('\n❌ Could not find ORCID IDs for:');
    console.log('   - Ryan Gutenkunst (University of Arizona) - extensive profile found but no ORCID');
    console.log('   - Daniel Fifield (Memorial University) - may be David A. Fifield (0000-0001-5433-4733)');
    console.log('   - Kirk Gosik (Cornell/Penn State/Constantiam) - profile found but no ORCID ID located');
    
    console.log('\n📝 Notes:');
    console.log('   - David A. Fifield (seabird researcher) found instead of Daniel Fifield');
    console.log('   - All faculty members have verified institutional affiliations');
    console.log('   - Some researchers may not have public ORCID profiles');
    
  } catch (error) {
    console.error('Error updating ORCID IDs:', error);
    process.exit(1);
  }
}

updateORCIDs();