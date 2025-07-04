#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const DataValidator = require('./validateData.cjs');

async function generateReport() {
  console.log('📊 Generating data quality report...');
  
  try {
    const validator = new DataValidator();
    const result = await validator.validate();
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        overallStatus: result.success ? 'pass' : 'fail',
        totalFaculty: result.stats.totalFaculty,
        enrichedProfiles: result.stats.enrichedProfiles,
        enrichmentPercentage: result.stats.enrichmentPercentage,
        orcidCoverage: result.stats.orcidCoverage,
        workshopCount: result.stats.workshopCount,
        totalIssues: result.issues.length,
        criticalIssues: result.issues.filter(i => i.severity === 'critical').length,
        warningIssues: result.issues.filter(i => i.severity === 'warning').length,
        infoIssues: result.issues.filter(i => i.severity === 'info').length
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
    
    return report;
    
  } catch (error) {
    console.error('❌ Failed to generate report:', error.message);
    process.exit(1);
  }
}

function generateRecommendations(result) {
  const recommendations = [];
  const { issues, stats } = result;
  
  // Critical issues recommendations
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  if (criticalIssues.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'data_integrity',
      title: 'Fix Critical Data Issues',
      description: `${criticalIssues.length} critical issues found that need immediate attention`,
      action: 'Review and fix all critical validation errors before deployment'
    });
  }
  
  // Enrichment recommendations
  if (stats.enrichmentPercentage < 90) {
    recommendations.push({
      priority: 'medium',
      category: 'data_enrichment',
      title: 'Improve Faculty Profile Enrichment',
      description: `Only ${stats.enrichmentPercentage}% of faculty have enriched profiles`,
      action: 'Run enrichment scripts to gather missing professional information'
    });
  }
  
  // ORCID recommendations
  if (stats.orcidCoverage < 85) {
    recommendations.push({
      priority: 'medium',
      category: 'orcid_coverage',
      title: 'Increase ORCID Coverage',
      description: `ORCID coverage is ${stats.orcidCoverage}%, below target of 85%`,
      action: 'Run ORCID lookup scripts to find missing identifiers'
    });
  }
  
  // Duplicate detection
  const duplicateIssues = issues.filter(i => i.type.includes('DUPLICATE'));
  if (duplicateIssues.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'data_cleanup',
      title: 'Resolve Duplicate Records',
      description: `${duplicateIssues.length} duplicate entries found`,
      action: 'Review and merge or remove duplicate faculty records'
    });
  }
  
  // URL validation issues
  const urlIssues = issues.filter(i => i.type.includes('URL'));
  if (urlIssues.length > 5) {
    recommendations.push({
      priority: 'low',
      category: 'url_maintenance',
      title: 'Update Invalid URLs',
      description: `${urlIssues.length} invalid URLs found`,
      action: 'Review and update faculty website URLs'
    });
  }
  
  return recommendations;
}

// Run if called directly
if (require.main === module) {
  generateReport();
}

module.exports = generateReport;