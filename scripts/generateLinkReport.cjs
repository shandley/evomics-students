#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const StudentLinkChecker = require('./checkLinks.cjs');

function generateBreakdown(links) {
  const breakdown = {
    byType: {},
    byStatus: {
      working: 0,
      broken: 0,
      warning: 0
    },
    byInstitution: {}
  };
  
  links.forEach(link => {
    // By type
    if (!breakdown.byType[link.type]) {
      breakdown.byType[link.type] = {
        total: 0,
        working: 0,
        broken: 0,
        warning: 0
      };
    }
    breakdown.byType[link.type].total++;
    breakdown.byType[link.type][link.status]++;
    
    // By status
    breakdown.byStatus[link.status]++;
    
    // By institution (if available)
    if (link.institution) {
      if (!breakdown.byInstitution[link.institution]) {
        breakdown.byInstitution[link.institution] = {
          total: 0,
          working: 0,
          broken: 0,
          warning: 0
        };
      }
      breakdown.byInstitution[link.institution].total++;
      breakdown.byInstitution[link.institution][link.status]++;
    }
  });
  
  return breakdown;
}

function generateLinkRecommendations(result) {
  const recommendations = [];
  const { summary, links } = result;
  
  if (summary.brokenLinks > 0) {
    recommendations.push({
      priority: 'high',
      category: 'broken_links',
      message: `${summary.brokenLinks} broken links need attention`,
      action: 'Review and fix broken links to maintain site integrity'
    });
  }
  
  if (summary.warningLinks > 3) {
    recommendations.push({
      priority: 'medium',
      category: 'warning_links',
      message: `${summary.warningLinks} links have warnings`,
      action: 'Review warning links - may be temporary issues or bot blocking'
    });
  }
  
  // Check for site accessibility issues
  const siteLinks = links.filter(link => link.type === 'site_link');
  const brokenSiteLinks = siteLinks.filter(link => link.status === 'broken');
  
  if (brokenSiteLinks.length > 0) {
    recommendations.push({
      priority: 'critical',
      category: 'site_accessibility',
      message: 'Core site links are broken',
      action: 'Immediately check site deployment and accessibility'
    });
  }
  
  // Check institutional website health
  const institutionalLinks = links.filter(link => link.type === 'institutional_website');
  const brokenInstitutional = institutionalLinks.filter(link => link.status === 'broken');
  
  if (brokenInstitutional.length > 2) {
    recommendations.push({
      priority: 'medium',
      category: 'institutional_links',
      message: `${brokenInstitutional.length} institutional websites are broken`,
      action: 'Review institutional URLs and update if organizations have changed domains'
    });
  }
  
  // Positive feedback for good health
  if (summary.successRate >= 95) {
    recommendations.push({
      priority: 'low',
      category: 'maintenance',
      message: 'Link health is excellent',
      action: 'Continue regular monitoring'
    });
  }
  
  return recommendations;
}

async function generateLinkReport() {
  console.log('📊 Generating student site link check report...');
  
  try {
    const checker = new StudentLinkChecker();
    const result = await checker.checkLinks();
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: result.summary,
      links: result.links,
      breakdown: generateBreakdown(result.links),
      recommendations: generateLinkRecommendations(result)
    };
    
    // Ensure reports directory exists
    const reportsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Write report
    const reportPath = path.join(reportsDir, 'link-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`✅ Link report generated: ${reportPath}`);
    console.log(`📊 Summary: ${report.summary.successRate}% success rate (${report.summary.brokenLinks} broken)`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Failed to generate link report:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateLinkReport();
}

module.exports = { generateLinkReport };