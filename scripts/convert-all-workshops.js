import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to parse CSV
function parseCSV(csvContent, workshopId) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');
  
  // Find year columns
  const yearColumns = [];
  headers.forEach((header, index) => {
    const year = parseInt(header);
    if (!isNaN(year) && year > 2000 && year < 2100) {
      yearColumns.push({ year, index });
    }
  });

  const facultyMap = new Map();
  const participations = [];

  // Process each faculty member
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    const lastName = parts[0]?.replace(/"/g, '').trim();
    const firstName = parts[1]?.replace(/"/g, '').trim();
    
    if (!lastName || !firstName) continue;
    
    // Fix common typos
    const fixedLastName = lastName === 'Handely' ? 'Handley' : lastName;
    
    const facultyId = `${fixedLastName.toLowerCase()}-${firstName.toLowerCase()}`
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    // Add to faculty map
    if (!facultyMap.has(facultyId)) {
      facultyMap.set(facultyId, {
        id: facultyId,
        firstName,
        lastName: fixedLastName
      });
    }
    
    // Create participation records
    yearColumns.forEach(({ year, index }) => {
      const value = parts[index]?.trim();
      if (value && value.toLowerCase() === 'x') {
        participations.push({
          facultyId,
          workshopId,
          year,
          role: 'faculty'
        });
      }
    });
  }

  return {
    faculty: Array.from(facultyMap.values()),
    participations
  };
}

// Load and parse all CSV files
const wogCSV = fs.readFileSync(path.join(__dirname, '../../wog-summary.csv'), 'utf-8');
const wpsgCSV = fs.readFileSync(path.join(__dirname, '../../wpsg-faculty-summary.csv'), 'utf-8');
const phyloCSV = fs.readFileSync(path.join(__dirname, '../../phylo-faculty-summary.csv'), 'utf-8');

// Parse each workshop
const wogData = parseCSV(wogCSV, 'wog');
const wpsgData = parseCSV(wpsgCSV, 'wpsg');
const phyloData = parseCSV(phyloCSV, 'wphylo');

// Combine all faculty (removing duplicates)
const allFacultyMap = new Map();

[...wogData.faculty, ...wpsgData.faculty, ...phyloData.faculty].forEach(f => {
  allFacultyMap.set(f.id, f);
});

// Combine all participations
const allParticipations = [
  ...wogData.participations,
  ...wpsgData.participations,
  ...phyloData.participations
];

// Create final data structure
const finalData = {
  faculty: Array.from(allFacultyMap.values()).sort((a, b) => 
    a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)
  ),
  participations: allParticipations.sort((a, b) => 
    a.facultyId.localeCompare(b.facultyId) || a.year - b.year
  )
};

// Write to JSON file
fs.writeFileSync(
  path.join(__dirname, '../src/data/facultyData.json'),
  JSON.stringify(finalData, null, 2)
);

// Print statistics
console.log(`Total unique faculty: ${finalData.faculty.length}`);
console.log(`Total participation records: ${finalData.participations.length}`);
console.log(`WoG participations: ${wogData.participations.length}`);
console.log(`WPSG participations: ${wpsgData.participations.length}`);
console.log(`Phylo participations: ${phyloData.participations.length}`);

// Update workshops.json
const workshopsData = {
  "wog": {
    "id": "wog",
    "name": "Workshop on Genomics",
    "shortName": "WoG",
    "description": "Annual workshop focusing on genomic data analysis techniques including genome assembly, annotation, alignment, and variant calling.",
    "active": true,
    "startYear": 2011,
    "location": "Český Krumlov, Czech Republic"
  },
  "wpsg": {
    "id": "wpsg",
    "name": "Workshop on Population and Speciation Genomics",
    "shortName": "WPSG",
    "description": "Biennial workshop analyzing genomic data at population and species levels.",
    "active": true,
    "startYear": 2016,
    "location": "Český Krumlov, Czech Republic"
  },
  "wphylo": {
    "id": "wphylo",
    "name": "Workshop on Phylogenomics",
    "shortName": "WPhylo",
    "description": "Workshop exploring large-scale phylogenetics and phylogenomics.",
    "active": true,
    "startYear": 2017,
    "location": "Český Krumlov, Czech Republic"
  }
};

fs.writeFileSync(
  path.join(__dirname, '../src/data/workshops.json'),
  JSON.stringify(workshopsData, null, 2)
);

console.log('\nData conversion complete!');