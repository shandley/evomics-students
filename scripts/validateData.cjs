#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class DataValidator {
  constructor() {
    this.issues = [];
    this.facultyData = null;
    this.enrichedData = null;
    this.workshops = null;
  }

  addIssue(type, message, severity = 'warning', facultyId = null) {
    this.issues.push({
      type,
      message,
      severity,
      facultyId,
      timestamp: new Date().toISOString()
    });
  }

  loadData() {
    try {
      // Load faculty data
      const facultyPath = path.join(__dirname, '../src/data/facultyData.json');
      const facultyJson = JSON.parse(fs.readFileSync(facultyPath, 'utf8'));
      this.facultyData = facultyJson.faculty || facultyJson; // Handle both formats
      
      // Load enriched data
      const enrichedPath = path.join(__dirname, '../src/data/facultyEnriched.json');
      this.enrichedData = JSON.parse(fs.readFileSync(enrichedPath, 'utf8'));
      
      // Load workshops
      const workshopsPath = path.join(__dirname, '../src/data/workshops.json');
      this.workshops = JSON.parse(fs.readFileSync(workshopsPath, 'utf8'));
      
      console.log('✅ Data files loaded successfully');
    } catch (error) {
      this.addIssue('DATA_LOAD', `Failed to load data files: ${error.message}`, 'critical');
      throw error;
    }
  }

  validateFacultyStructure() {
    console.log('🔍 Validating faculty data structure...');
    
    if (!Array.isArray(this.facultyData)) {
      this.addIssue('STRUCTURE', 'Faculty data is not an array', 'critical');
      return;
    }

    this.facultyData.forEach((faculty, index) => {
      const facultyId = faculty.id || `index-${index}`;
      
      // Required fields
      if (!faculty.id) {
        this.addIssue('REQUIRED_FIELD', `Faculty missing ID at index ${index}`, 'critical');
      }
      if (!faculty.firstName) {
        this.addIssue('REQUIRED_FIELD', `Faculty missing firstName`, 'critical', facultyId);
      }
      if (!faculty.lastName) {
        this.addIssue('REQUIRED_FIELD', `Faculty missing lastName`, 'critical', facultyId);
      }

      // ID format validation
      if (faculty.id && !/^[a-zA-Z0-9_-]+$/.test(faculty.id)) {
        this.addIssue('ID_FORMAT', `Faculty ID contains invalid characters: ${faculty.id}`, 'warning', facultyId);
      }

      // Email validation
      if (faculty.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(faculty.email)) {
        this.addIssue('EMAIL_FORMAT', `Invalid email format: ${faculty.email}`, 'warning', facultyId);
      }

      // ORCID validation
      if (faculty.orcid && !/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(faculty.orcid)) {
        this.addIssue('ORCID_FORMAT', `Invalid ORCID format: ${faculty.orcid}`, 'warning', facultyId);
      }

      // URL validation
      if (faculty.website && !this.isValidUrl(faculty.website)) {
        this.addIssue('URL_FORMAT', `Invalid website URL: ${faculty.website}`, 'warning', facultyId);
      }
    });
  }

  validateEnrichmentData() {
    console.log('🔍 Validating enrichment data...');
    
    if (!this.enrichedData || typeof this.enrichedData !== 'object') {
      this.addIssue('ENRICHMENT', 'Enriched data is not a valid object', 'critical');
      return;
    }

    const facultyIds = this.facultyData.map(f => f.id);
    const enrichedIds = Object.keys(this.enrichedData);
    
    // Check for orphaned enrichment data
    enrichedIds.forEach(id => {
      if (!facultyIds.includes(id)) {
        this.addIssue('ORPHANED_ENRICHMENT', `Enrichment data exists for non-existent faculty: ${id}`, 'warning');
      }
    });

    // Validate enrichment structure
    Object.entries(this.enrichedData).forEach(([facultyId, data]) => {
      if (!data.enrichment) {
        this.addIssue('ENRICHMENT_MISSING', `No enrichment data for faculty`, 'info', facultyId);
        return;
      }

      const enrichment = data.enrichment;
      
      // Validate confidence level
      if (enrichment.confidence && !['high', 'medium', 'low'].includes(enrichment.confidence)) {
        this.addIssue('CONFIDENCE_LEVEL', `Invalid confidence level: ${enrichment.confidence}`, 'warning', facultyId);
      }

      // Validate professional data
      if (enrichment.professional?.affiliation && typeof enrichment.professional.affiliation !== 'string') {
        this.addIssue('AFFILIATION_TYPE', 'Affiliation should be a string', 'warning', facultyId);
      }

      // Validate academic data
      if (enrichment.academic?.researchAreas && !Array.isArray(enrichment.academic.researchAreas)) {
        this.addIssue('RESEARCH_AREAS_TYPE', 'Research areas should be an array', 'warning', facultyId);
      }

      // Validate ORCID in enrichment
      if (enrichment.academic?.orcid && !/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(enrichment.academic.orcid)) {
        this.addIssue('ENRICHMENT_ORCID_FORMAT', `Invalid ORCID in enrichment: ${enrichment.academic.orcid}`, 'warning', facultyId);
      }
    });
  }

  validateWorkshopData() {
    console.log('🔍 Validating workshop data...');
    
    if (!this.workshops || typeof this.workshops !== 'object') {
      this.addIssue('WORKSHOPS', 'Workshop data is not a valid object', 'critical');
      return;
    }

    Object.entries(this.workshops).forEach(([workshopId, workshop]) => {
      // Required fields
      if (!workshop.name) {
        this.addIssue('WORKSHOP_NAME', `Workshop missing name`, 'critical', workshopId);
      }
      if (!workshop.shortName) {
        this.addIssue('WORKSHOP_SHORT_NAME', `Workshop missing shortName`, 'warning', workshopId);
      }
      if (typeof workshop.active !== 'boolean') {
        this.addIssue('WORKSHOP_ACTIVE', `Workshop active field should be boolean`, 'warning', workshopId);
      }
      if (!workshop.startYear || workshop.startYear < 2000 || workshop.startYear > new Date().getFullYear()) {
        this.addIssue('WORKSHOP_START_YEAR', `Invalid workshop start year: ${workshop.startYear}`, 'warning', workshopId);
      }
    });
  }

  validateParticipationData() {
    console.log('🔍 Validating participation data...');
    
    const workshopIds = Object.keys(this.workshops);
    const currentYear = new Date().getFullYear();
    
    this.facultyData.forEach(faculty => {
      if (!faculty.participations || typeof faculty.participations !== 'object') {
        this.addIssue('PARTICIPATION_MISSING', `No participation data`, 'warning', faculty.id);
        return;
      }

      Object.entries(faculty.participations).forEach(([workshopId, years]) => {
        // Check if workshop exists
        if (!workshopIds.includes(workshopId)) {
          this.addIssue('INVALID_WORKSHOP', `Participation in unknown workshop: ${workshopId}`, 'warning', faculty.id);
        }

        // Check if years is an array
        if (!Array.isArray(years)) {
          this.addIssue('PARTICIPATION_FORMAT', `Participation years should be an array for workshop ${workshopId}`, 'warning', faculty.id);
          return;
        }

        // Validate year values
        years.forEach(year => {
          if (typeof year !== 'number' || year < 2000 || year > currentYear + 1) {
            this.addIssue('INVALID_YEAR', `Invalid participation year: ${year} for workshop ${workshopId}`, 'warning', faculty.id);
          }
        });
      });
    });
  }

  checkDuplicates() {
    console.log('🔍 Checking for duplicates...');
    
    const ids = [];
    const names = [];
    const emails = [];
    const orcids = [];

    this.facultyData.forEach(faculty => {
      // Check duplicate IDs
      if (ids.includes(faculty.id)) {
        this.addIssue('DUPLICATE_ID', `Duplicate faculty ID: ${faculty.id}`, 'critical');
      } else {
        ids.push(faculty.id);
      }

      // Check duplicate names
      const fullName = `${faculty.firstName} ${faculty.lastName}`;
      if (names.includes(fullName)) {
        this.addIssue('DUPLICATE_NAME', `Duplicate faculty name: ${fullName}`, 'warning', faculty.id);
      } else {
        names.push(fullName);
      }

      // Check duplicate emails
      if (faculty.email) {
        if (emails.includes(faculty.email)) {
          this.addIssue('DUPLICATE_EMAIL', `Duplicate email: ${faculty.email}`, 'warning', faculty.id);
        } else {
          emails.push(faculty.email);
        }
      }

      // Check duplicate ORCIDs
      if (faculty.orcid) {
        if (orcids.includes(faculty.orcid)) {
          this.addIssue('DUPLICATE_ORCID', `Duplicate ORCID: ${faculty.orcid}`, 'warning', faculty.id);
        } else {
          orcids.push(faculty.orcid);
        }
      }
    });
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  generateStats() {
    const totalFaculty = this.facultyData.length;
    const enrichedCount = Object.keys(this.enrichedData).filter(id => 
      this.enrichedData[id].enrichment
    ).length;
    const orcidCount = this.facultyData.filter(f => f.orcid).length;
    
    return {
      totalFaculty,
      enrichedProfiles: enrichedCount,
      enrichmentPercentage: Math.round((enrichedCount / totalFaculty) * 100),
      orcidCoverage: Math.round((orcidCount / totalFaculty) * 100),
      workshopCount: Object.keys(this.workshops).length
    };
  }

  async validate() {
    console.log('🚀 Starting data validation...');
    
    this.loadData();
    this.validateFacultyStructure();
    this.validateEnrichmentData();
    this.validateWorkshopData();
    this.validateParticipationData();
    this.checkDuplicates();
    
    const stats = this.generateStats();
    const criticalIssues = this.issues.filter(i => i.severity === 'critical');
    const warningIssues = this.issues.filter(i => i.severity === 'warning');
    
    console.log(`\n📊 Validation Results:`);
    console.log(`   Total Faculty: ${stats.totalFaculty}`);
    console.log(`   Enriched Profiles: ${stats.enrichedProfiles} (${stats.enrichmentPercentage}%)`);
    console.log(`   ORCID Coverage: ${stats.orcidCoverage}%`);
    console.log(`   Critical Issues: ${criticalIssues.length}`);
    console.log(`   Warnings: ${warningIssues.length}`);
    
    if (criticalIssues.length > 0) {
      console.log(`\n❌ Critical Issues:`);
      criticalIssues.forEach(issue => {
        console.log(`   - ${issue.type}: ${issue.message}`);
      });
    }
    
    if (warningIssues.length > 0 && warningIssues.length <= 5) {
      console.log(`\n⚠️  Warnings:`);
      warningIssues.slice(0, 5).forEach(issue => {
        console.log(`   - ${issue.type}: ${issue.message}`);
      });
    }
    
    return {
      success: criticalIssues.length === 0,
      stats,
      issues: this.issues
    };
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new DataValidator();
  validator.validate()
    .then(result => {
      if (!result.success) {
        console.log('\n❌ Validation failed due to critical issues');
        process.exit(1);
      } else {
        console.log('\n✅ Validation passed');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('💥 Validation error:', error.message);
      process.exit(1);
    });
}

module.exports = DataValidator;