import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Process faculty updates from CSV
export function processFacultyUpdates(csvPath) {
  // Load existing data
  const facultyDataPath = path.join(__dirname, '../src/data/facultyData.json');
  const enrichedDataPath = path.join(__dirname, '../src/data/facultyEnriched.json');
  
  const facultyData = JSON.parse(fs.readFileSync(facultyDataPath, 'utf8'));
  const enrichedData = JSON.parse(fs.readFileSync(enrichedDataPath, 'utf8'));
  
  // Parse CSV
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const updates = parse(csvContent, {
    columns: true,
    skip_empty_lines: true
  });
  
  console.log(`Processing ${updates.length} faculty updates...\n`);
  
  let updateCount = 0;
  const updateLog = [];
  
  updates.forEach(update => {
    // Find faculty by email or name match
    const faculty = facultyData.faculty.find(f => 
      `${f.firstName} ${f.lastName}`.toLowerCase() === 
      `${update['First Name']} ${update['Last Name']}`.toLowerCase()
    );
    
    if (!faculty) {
      updateLog.push({
        status: 'error',
        name: `${update['First Name']} ${update['Last Name']}`,
        message: 'Faculty not found in database'
      });
      return;
    }
    
    // Create or update enrichment
    if (!enrichedData[faculty.id]) {
      enrichedData[faculty.id] = {
        id: faculty.id,
        name: `${faculty.firstName} ${faculty.lastName}`,
        enrichment: {
          lastUpdated: new Date().toISOString(),
          confidence: 'high',
          professional: {},
          academic: {},
          profile: {}
        }
      };
    }
    
    const enrichment = enrichedData[faculty.id].enrichment;
    
    // Update professional info
    if (update['Current Affiliation']) {
      enrichment.professional.affiliation = update['Current Affiliation'].trim();
    }
    if (update['Professional Title']) {
      enrichment.professional.title = update['Professional Title'].trim();
    }
    if (update['Department']) {
      enrichment.professional.department = update['Department'].trim();
    }
    if (update['Lab/Personal Website']) {
      enrichment.professional.labWebsite = update['Lab/Personal Website'].trim();
    }
    
    // Update academic info
    if (update['ORCID ID']) {
      enrichment.academic.orcid = update['ORCID ID'].trim();
    }
    if (update['Research Areas']) {
      enrichment.academic.researchAreas = update['Research Areas']
        .split(',')
        .map(area => area.trim().toLowerCase())
        .filter(area => area.length > 0);
    }
    
    // Update profile
    if (update['Short Bio']) {
      enrichment.profile.shortBio = update['Short Bio'].trim();
    }
    
    enrichment.lastUpdated = new Date().toISOString();
    enrichment.confidence = 'high';
    enrichment.profile.source = 'Faculty self-submission';
    
    updateCount++;
    updateLog.push({
      status: 'success',
      name: `${faculty.firstName} ${faculty.lastName}`,
      message: 'Successfully updated'
    });
  });
  
  // Save updated data
  fs.writeFileSync(enrichedDataPath, JSON.stringify(enrichedData, null, 2));
  
  // Generate report
  console.log('Update Summary:');
  console.log(`- Total submissions: ${updates.length}`);
  console.log(`- Successful updates: ${updateCount}`);
  console.log(`- Errors: ${updates.length - updateCount}\n`);
  
  updateLog.forEach(log => {
    const icon = log.status === 'success' ? '✅' : '❌';
    console.log(`${icon} ${log.name}: ${log.message}`);
  });
  
  return updateLog;
}

// Run if called directly
if (process.argv[2]) {
  processFacultyUpdates(process.argv[2]);
}