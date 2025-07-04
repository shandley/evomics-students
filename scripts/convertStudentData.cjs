#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class StudentDataConverter {
  constructor() {
    this.students = [];
    this.workshops = {};
    this.participations = [];
    this.stats = {
      totalRecords: 0,
      uniqueStudents: 0,
      uniqueWorkshops: 0,
      countries: new Set(),
      institutions: new Set()
    };
  }

  // Generate a unique ID from name
  generateStudentId(firstName, lastName) {
    const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
    const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
    return `${cleanLast}-${cleanFirst}`;
  }

  // Generate workshop ID from name
  generateWorkshopId(workshopName) {
    const mapping = {
      'Workshop on Molecular Evolution': 'wmolevo',
      'Workshop on Genomics': 'wog',
      'Workshop on Population and Speciation Genomics': 'wpsg',
      'Workshop on Phylogenomics': 'wphylo',
      'Workshop on Microbiome and Transcriptome Analysis': 'wmta'
    };
    return mapping[workshopName] || workshopName.toLowerCase().replace(/[^a-z]/g, '').substring(0, 8);
  }

  // Clean and standardize location names
  cleanLocation(location) {
    const locationMap = {
      'Centers for Disease Control and Prevention': 'CDC, Atlanta, USA',
      'Smithsonian Institution': 'Smithsonian, Washington DC, USA',
      'Czech Republic': 'Český Krumlov, Czech Republic',
      'South Africa': 'Cape Town, South Africa'
    };
    return locationMap[location] || location;
  }

  parseTSVFile(filePath) {
    console.log('📖 Reading TSV file...');
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    // Skip header line
    const dataLines = lines.slice(1);
    this.stats.totalRecords = dataLines.length;
    
    console.log(`Found ${this.stats.totalRecords} student records`);
    
    const studentMap = new Map();
    const workshopMap = new Map();
    
    dataLines.forEach((line, index) => {
      try {
        const columns = line.split('\t');
        if (columns.length < 7) {
          console.warn(`Skipping line ${index + 2}: insufficient columns`);
          return;
        }
        
        const [surname, firstName, institution, country, workshopName, year, location] = columns;
        
        // Clean data
        const cleanFirstName = firstName.trim();
        const cleanLastName = surname.trim();
        const cleanInstitution = institution.trim();
        const cleanCountry = country.trim();
        const cleanWorkshopName = workshopName.trim();
        const cleanYear = parseInt(year.trim());
        const cleanLocation = this.cleanLocation(location.trim());
        
        // Skip invalid records
        if (!cleanFirstName || !cleanLastName || !cleanWorkshopName || isNaN(cleanYear)) {
          console.warn(`Skipping line ${index + 2}: missing required data`);
          return;
        }
        
        // Generate IDs
        const studentId = this.generateStudentId(cleanFirstName, cleanLastName);
        const workshopId = this.generateWorkshopId(cleanWorkshopName);
        
        // Track student
        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, {
            id: studentId,
            firstName: cleanFirstName,
            lastName: cleanLastName,
            institution: cleanInstitution,
            country: cleanCountry
          });
          
          this.stats.countries.add(cleanCountry);
          this.stats.institutions.add(cleanInstitution);
        }
        
        // Track workshop
        if (!workshopMap.has(workshopId)) {
          workshopMap.set(workshopId, {
            id: workshopId,
            name: cleanWorkshopName,
            shortName: this.getWorkshopShortName(cleanWorkshopName),
            description: this.getWorkshopDescription(cleanWorkshopName),
            active: cleanYear >= 2015, // Assume recent workshops are active
            startYear: cleanYear
          });
        } else {
          // Update start year if this is earlier
          const existing = workshopMap.get(workshopId);
          if (cleanYear < existing.startYear) {
            existing.startYear = cleanYear;
          }
        }
        
        // Track participation
        this.participations.push({
          studentId,
          workshopId,
          year: cleanYear,
          location: cleanLocation
        });
        
      } catch (error) {
        console.warn(`Error processing line ${index + 2}: ${error.message}`);
      }
    });
    
    // Convert maps to arrays
    this.students = Array.from(studentMap.values());
    this.workshops = Object.fromEntries(workshopMap);
    
    this.stats.uniqueStudents = this.students.length;
    this.stats.uniqueWorkshops = workshopMap.size;
    
    console.log(`✅ Processed data:`);
    console.log(`   Unique students: ${this.stats.uniqueStudents}`);
    console.log(`   Unique workshops: ${this.stats.uniqueWorkshops}`);
    console.log(`   Countries: ${this.stats.countries.size}`);
    console.log(`   Institutions: ${this.stats.institutions.size}`);
    console.log(`   Participations: ${this.participations.length}`);
  }

  getWorkshopShortName(name) {
    const shortNames = {
      'Workshop on Molecular Evolution': 'WMolEvo',
      'Workshop on Genomics': 'WoG',
      'Workshop on Population and Speciation Genomics': 'WPSG',
      'Workshop on Phylogenomics': 'WPhylo',
      'Workshop on Microbiome and Transcriptome Analysis': 'WMTA'
    };
    return shortNames[name] || name.split(' ').map(w => w[0]).join('');
  }

  getWorkshopDescription(name) {
    const descriptions = {
      'Workshop on Molecular Evolution': 'Workshop focusing on molecular evolutionary analysis and phylogenetic methods.',
      'Workshop on Genomics': 'Annual workshop focusing on genomic data analysis techniques including genome assembly, annotation, alignment, and variant calling.',
      'Workshop on Population and Speciation Genomics': 'Biennial workshop analyzing genomic data at population and species levels.',
      'Workshop on Phylogenomics': 'Workshop on phylogenomic analysis and large-scale evolutionary studies.',
      'Workshop on Microbiome and Transcriptome Analysis': 'Workshop focusing on microbiome and transcriptomic analysis methods.'
    };
    return descriptions[name] || `Workshop on ${name.replace('Workshop on ', '')}`;
  }

  // Convert to faculty-style profile format
  generateStudentProfiles() {
    console.log('🔄 Generating student profiles...');
    
    const profiles = this.students.map(student => {
      // Get participations for this student
      const studentParticipations = this.participations.filter(p => p.studentId === student.id);
      
      // Group by workshop
      const participationsByWorkshop = {};
      studentParticipations.forEach(p => {
        if (!participationsByWorkshop[p.workshopId]) {
          participationsByWorkshop[p.workshopId] = [];
        }
        participationsByWorkshop[p.workshopId].push(p.year);
      });
      
      // Calculate statistics
      const allYears = studentParticipations.map(p => p.year);
      const uniqueYears = [...new Set(allYears)];
      const workshopCount = Object.keys(participationsByWorkshop).length;
      
      return {
        student: {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          institution: student.institution,
          country: student.country
        },
        participations: participationsByWorkshop,
        statistics: {
          totalYears: uniqueYears.length,
          workshopCount: workshopCount,
          firstYear: Math.min(...allYears),
          lastYear: Math.max(...allYears)
        }
      };
    });
    
    return profiles;
  }

  writeOutputFiles() {
    console.log('💾 Writing output files...');
    
    const dataDir = path.join(__dirname, '../src/data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Generate student profiles
    const profiles = this.generateStudentProfiles();
    
    // Write student data (similar to faculty format)
    const studentData = {
      students: this.students,
      participations: this.participations,
      profiles: profiles
    };
    
    fs.writeFileSync(
      path.join(dataDir, 'studentData.json'),
      JSON.stringify(studentData, null, 2)
    );
    
    // Write workshops data
    fs.writeFileSync(
      path.join(dataDir, 'workshops.json'),
      JSON.stringify(this.workshops, null, 2)
    );
    
    // Write conversion statistics
    const stats = {
      ...this.stats,
      countries: Array.from(this.stats.countries).sort(),
      institutions: Array.from(this.stats.institutions).sort(),
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(dataDir, 'conversionStats.json'),
      JSON.stringify(stats, null, 2)
    );
    
    console.log('✅ Files written:');
    console.log(`   studentData.json (${profiles.length} profiles)`);
    console.log(`   workshops.json (${Object.keys(this.workshops).length} workshops)`);
    console.log(`   conversionStats.json`);
  }

  async convert(tsvFilePath) {
    try {
      console.log('🚀 Starting student data conversion...');
      
      this.parseTSVFile(tsvFilePath);
      this.writeOutputFiles();
      
      console.log('✅ Conversion completed successfully!');
      
      return {
        success: true,
        stats: this.stats
      };
      
    } catch (error) {
      console.error('❌ Conversion failed:', error.message);
      throw error;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const tsvPath = process.argv[2] || '/Users/scotthandley/Code/evomics-faculty/student-data/workshop_summary_stats.txt';
  
  if (!fs.existsSync(tsvPath)) {
    console.error(`TSV file not found: ${tsvPath}`);
    process.exit(1);
  }
  
  const converter = new StudentDataConverter();
  converter.convert(tsvPath)
    .then(result => {
      console.log('\n🎉 Student data conversion completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Conversion error:', error.message);
      process.exit(1);
    });
}

module.exports = StudentDataConverter;