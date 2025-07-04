#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class StudentDataValidator {
  constructor() {
    this.issues = [];
    this.studentData = null;
    this.workshops = null;
    this.students = [];
    this.participations = [];
  }

  addIssue(type, message, severity = 'warning', studentId = null) {
    this.issues.push({
      type,
      message,
      severity,
      studentId,
      timestamp: new Date().toISOString()
    });
  }

  loadData() {
    try {
      // Load student data
      const studentPath = path.join(__dirname, '../src/data/studentData.json');
      this.studentData = JSON.parse(fs.readFileSync(studentPath, 'utf8'));
      this.students = this.studentData.students || [];
      this.participations = this.studentData.participations || [];
      
      // Load workshops
      const workshopsPath = path.join(__dirname, '../src/data/workshops.json');
      this.workshops = JSON.parse(fs.readFileSync(workshopsPath, 'utf8'));
      
      console.log('✅ Student data files loaded successfully');
      console.log(`📊 Loaded ${this.students.length} students and ${this.participations.length} participations`);
    } catch (error) {
      this.addIssue('DATA_LOAD', `Failed to load data files: ${error.message}`, 'critical');
      throw error;
    }
  }

  validateStudentStructure() {
    console.log('🔍 Validating student data structure...');
    
    if (!Array.isArray(this.students)) {
      this.addIssue('STRUCTURE', 'Students data is not an array', 'critical');
      return;
    }

    if (!Array.isArray(this.participations)) {
      this.addIssue('STRUCTURE', 'Participations data is not an array', 'critical');
      return;
    }

    // Validate each student record
    this.students.forEach((student, index) => {
      const requiredFields = ['id', 'firstName', 'lastName', 'institution', 'country'];
      
      requiredFields.forEach(field => {
        if (!student[field] || student[field].trim() === '') {
          this.addIssue('MISSING_FIELD', 
            `Student at index ${index} missing required field: ${field}`, 
            'critical', 
            student.id
          );
        }
      });

      // Validate ID format
      if (student.id && !/^[a-z0-9-]+$/.test(student.id)) {
        this.addIssue('INVALID_ID', 
          `Student ID "${student.id}" contains invalid characters (should be lowercase letters, numbers, and hyphens only)`, 
          'warning', 
          student.id
        );
      }
    });

    console.log(`✅ Validated ${this.students.length} student records`);
  }

  validateParticipations() {
    console.log('🔍 Validating participation data...');
    
    const studentIds = new Set(this.students.map(s => s.id));
    const workshopIds = new Set(Object.keys(this.workshops));

    this.participations.forEach((participation, index) => {
      const requiredFields = ['studentId', 'workshopId', 'year'];
      
      requiredFields.forEach(field => {
        if (!participation[field]) {
          this.addIssue('MISSING_FIELD', 
            `Participation at index ${index} missing required field: ${field}`, 
            'critical', 
            participation.studentId
          );
        }
      });

      // Validate student ID exists
      if (participation.studentId && !studentIds.has(participation.studentId)) {
        this.addIssue('ORPHAN_PARTICIPATION', 
          `Participation references non-existent student ID: ${participation.studentId}`, 
          'critical', 
          participation.studentId
        );
      }

      // Validate workshop ID exists
      if (participation.workshopId && !workshopIds.has(participation.workshopId)) {
        this.addIssue('INVALID_WORKSHOP', 
          `Participation references non-existent workshop ID: ${participation.workshopId}`, 
          'warning', 
          participation.studentId
        );
      }

      // Validate year range
      const currentYear = new Date().getFullYear();
      if (participation.year && (participation.year < 2000 || participation.year > currentYear + 1)) {
        this.addIssue('INVALID_YEAR', 
          `Participation year ${participation.year} is outside reasonable range (2000-${currentYear + 1})`, 
          'warning', 
          participation.studentId
        );
      }
    });

    console.log(`✅ Validated ${this.participations.length} participation records`);
  }

  validateDataConsistency() {
    console.log('🔍 Validating data consistency...');
    
    // Check for duplicate student IDs
    const studentIds = this.students.map(s => s.id);
    const duplicateIds = studentIds.filter((id, index) => studentIds.indexOf(id) !== index);
    
    if (duplicateIds.length > 0) {
      duplicateIds.forEach(id => {
        this.addIssue('DUPLICATE_ID', 
          `Duplicate student ID found: ${id}`, 
          'critical', 
          id
        );
      });
    }

    // Check for students without participations
    const participatingStudents = new Set(this.participations.map(p => p.studentId));
    const studentsWithoutParticipations = this.students.filter(s => !participatingStudents.has(s.id));
    
    if (studentsWithoutParticipations.length > 0) {
      studentsWithoutParticipations.forEach(student => {
        this.addIssue('NO_PARTICIPATIONS', 
          `Student ${student.firstName} ${student.lastName} has no workshop participations`, 
          'warning', 
          student.id
        );
      });
    }

    // Check for participations without students (orphaned)
    const studentIdSet = new Set(studentIds);
    const orphanedParticipations = this.participations.filter(p => !studentIdSet.has(p.studentId));
    
    if (orphanedParticipations.length > 0) {
      this.addIssue('ORPHANED_PARTICIPATIONS', 
        `Found ${orphanedParticipations.length} participations with no corresponding student records`, 
        'critical'
      );
    }

    console.log(`✅ Data consistency validation complete`);
  }

  validateGeographicData() {
    console.log('🔍 Validating geographic data...');
    
    const countries = new Set();
    const institutions = new Set();
    
    this.students.forEach(student => {
      if (student.country) {
        countries.add(student.country);
      }
      if (student.institution) {
        institutions.add(student.institution);
      }
    });

    // Check for suspicious country names
    const suspiciousCountries = Array.from(countries).filter(country => 
      country.length < 2 || country.length > 50 || /[0-9]/.test(country)
    );
    
    suspiciousCountries.forEach(country => {
      this.addIssue('SUSPICIOUS_COUNTRY', 
        `Suspicious country name: "${country}"`, 
        'warning'
      );
    });

    // Check for very short institution names
    const shortInstitutions = Array.from(institutions).filter(inst => 
      inst.length < 3 && !/^[A-Z]{2,3}$/.test(inst) // Allow short acronyms like "CDC"
    );
    
    shortInstitutions.forEach(institution => {
      this.addIssue('SHORT_INSTITUTION', 
        `Unusually short institution name: "${institution}"`, 
        'info'
      );
    });

    console.log(`✅ Geographic validation complete: ${countries.size} countries, ${institutions.size} institutions`);
  }

  validateWorkshopData() {
    console.log('🔍 Validating workshop data...');
    
    if (!this.workshops || typeof this.workshops !== 'object') {
      this.addIssue('WORKSHOP_STRUCTURE', 'Workshop data is not a valid object', 'critical');
      return;
    }

    const workshopIds = Object.keys(this.workshops);
    
    workshopIds.forEach(workshopId => {
      const workshop = this.workshops[workshopId];
      
      if (!workshop.name || !workshop.shortName) {
        this.addIssue('INCOMPLETE_WORKSHOP', 
          `Workshop ${workshopId} missing name or shortName`, 
          'warning'
        );
      }
    });

    // Check for participations in workshops not marked as active
    const activeWorkshops = workshopIds.filter(id => this.workshops[id].active);
    const inactiveWorkshops = workshopIds.filter(id => !this.workshops[id].active);
    
    console.log(`📊 Found ${activeWorkshops.length} active workshops and ${inactiveWorkshops.length} inactive workshops`);
    console.log(`✅ Workshop data validation complete`);
  }

  generateSummary() {
    const totalStudents = this.students.length;
    const totalParticipations = this.participations.length;
    const totalCountries = new Set(this.students.map(s => s.country)).size;
    const totalInstitutions = new Set(this.students.map(s => s.institution)).size;
    const activeWorkshops = Object.keys(this.workshops).filter(id => this.workshops[id].active).length;
    
    // Calculate data completeness
    const completeStudents = this.students.filter(student => 
      student.id && student.firstName && student.lastName && 
      student.institution && student.country
    ).length;
    
    const dataCompleteness = totalStudents > 0 ? (completeStudents / totalStudents * 100) : 0;

    const criticalIssues = this.issues.filter(issue => issue.severity === 'critical').length;
    const overallStatus = criticalIssues === 0 ? 'pass' : 'fail';

    return {
      overallStatus,
      totalStudents,
      totalParticipations,
      totalCountries,
      totalInstitutions,
      activeWorkshops,
      dataCompleteness: Math.round(dataCompleteness * 10) / 10,
      criticalIssues,
      warningIssues: this.issues.filter(issue => issue.severity === 'warning').length,
      infoIssues: this.issues.filter(issue => issue.severity === 'info').length
    };
  }

  async validate() {
    console.log('🚀 Starting student data validation...\n');
    
    this.loadData();
    
    this.validateStudentStructure();
    this.validateParticipations();
    this.validateDataConsistency();
    this.validateGeographicData();
    this.validateWorkshopData();
    
    const summary = this.generateSummary();
    
    console.log('\n📊 Validation Summary:');
    console.log(`Status: ${summary.overallStatus.toUpperCase()}`);
    console.log(`Students: ${summary.totalStudents}`);
    console.log(`Participations: ${summary.totalParticipations}`);
    console.log(`Countries: ${summary.totalCountries}`);
    console.log(`Institutions: ${summary.totalInstitutions}`);
    console.log(`Active Workshops: ${summary.activeWorkshops}`);
    console.log(`Data Completeness: ${summary.dataCompleteness}%`);
    console.log(`Issues: ${summary.criticalIssues} critical, ${summary.warningIssues} warnings, ${summary.infoIssues} info`);
    
    if (summary.criticalIssues > 0) {
      console.log('\n❌ Critical issues found:');
      this.issues
        .filter(issue => issue.severity === 'critical')
        .forEach(issue => console.log(`  - ${issue.message}`));
    }
    
    return {
      summary,
      issues: this.issues
    };
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new StudentDataValidator();
  validator.validate()
    .then(result => {
      if (result.summary.criticalIssues > 0) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    });
}

module.exports = StudentDataValidator;