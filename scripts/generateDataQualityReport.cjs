#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const StudentDataValidator = require('./validateData.cjs');

function generateRecommendations(result) {
  const recommendations = [];
  
  const { summary, issues } = result;
  
  if (summary.criticalIssues > 0) {
    recommendations.push({
      priority: 'high',
      category: 'critical_issues',
      message: `Address ${summary.criticalIssues} critical data issues immediately`,
      action: 'Review and fix critical issues to ensure data integrity'
    });
  }
  
  if (summary.dataCompleteness < 95) {
    recommendations.push({
      priority: 'medium',
      category: 'data_completeness',
      message: `Data completeness is ${summary.dataCompleteness}% - aim for >95%`,
      action: 'Review students with missing required fields and complete data'
    });
  }
  
  if (summary.warningIssues > 10) {
    recommendations.push({
      priority: 'medium',
      category: 'data_quality',
      message: `${summary.warningIssues} warning issues found`,
      action: 'Review and address warning issues to improve data quality'
    });
  }
  
  // Check for orphaned data
  const orphanedIssues = issues.filter(issue => 
    issue.type === 'ORPHAN_PARTICIPATION' || issue.type === 'ORPHANED_PARTICIPATIONS'
  );
  
  if (orphanedIssues.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'data_consistency',
      message: 'Orphaned participation records found',
      action: 'Clean up participation records that reference non-existent students'
    });
  }
  
  // Geographic data quality
  const geoIssues = issues.filter(issue => 
    issue.type === 'SUSPICIOUS_COUNTRY' || issue.type === 'SHORT_INSTITUTION'
  );
  
  if (geoIssues.length > 0) {
    recommendations.push({
      priority: 'low',
      category: 'geographic_data',
      message: 'Geographic data quality issues detected',
      action: 'Review and standardize country and institution names'
    });
  }
  
  // If no issues, add positive recommendations
  if (summary.criticalIssues === 0 && summary.warningIssues < 5) {
    recommendations.push({
      priority: 'low',
      category: 'maintenance',
      message: 'Data quality is excellent',
      action: 'Continue regular monitoring and validation'
    });
  }
  
  return recommendations;
}

async function generateReport() {
  console.log('📊 Generating student data quality report...');
  
  try {
    const validator = new StudentDataValidator();
    const result = await validator.validate();
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        overallStatus: result.summary.overallStatus,
        totalStudents: result.summary.totalStudents,
        totalParticipations: result.summary.totalParticipations,
        totalCountries: result.summary.totalCountries,
        totalInstitutions: result.summary.totalInstitutions,
        activeWorkshops: result.summary.activeWorkshops,
        dataCompleteness: result.summary.dataCompleteness,
        totalIssues: result.issues.length,
        criticalIssues: result.summary.criticalIssues,
        warningIssues: result.summary.warningIssues,
        infoIssues: result.summary.infoIssues
      },
      issues: result.issues,
      recommendations: generateRecommendations(result)
    };
    
    // Ensure reports directory exists
    const reportsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Write report
    const reportPath = path.join(reportsDir, 'data-quality-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`✅ Report generated: ${reportPath}`);
    console.log(`📊 Summary: ${report.summary.overallStatus.toUpperCase()} - ${report.summary.totalIssues} issues found`);
    console.log(`🎓 Students: ${report.summary.totalStudents} from ${report.summary.totalCountries} countries`);
    console.log(`📈 Data Completeness: ${report.summary.dataCompleteness}%`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Failed to generate report:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateReport();
}

module.exports = { generateReport };