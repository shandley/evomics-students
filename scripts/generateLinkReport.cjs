#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const LinkChecker = require('./checkLinks.cjs');

async function generateLinkReport() {
  console.log('📊 Generating link check report...');
  
  try {
    const checker = new LinkChecker();
    const result = await checker.checkAllLinks();
    
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

function generateBreakdown(links) {
  const breakdown = {
    byType: {},
    byStatus: {
      working: 0,
      broken: 0,
      warning: 0
    },
    brokenByType: {},
    topErrors: {}
  };
  
  // Count by type and status
  links.forEach(link => {
    // By type
    breakdown.byType[link.type] = (breakdown.byType[link.type] || 0) + 1;
    
    // By status
    breakdown.byStatus[link.status]++;
    
    // Broken by type
    if (link.status === 'broken') {
      breakdown.brokenByType[link.type] = (breakdown.brokenByType[link.type] || 0) + 1;
    }
    
    // Top errors
    if (link.error) {
      breakdown.topErrors[link.error] = (breakdown.topErrors[link.error] || 0) + 1;
    }
  });
  
  // Sort top errors by frequency
  breakdown.topErrors = Object.entries(breakdown.topErrors)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .reduce((obj, [error, count]) => {
      obj[error] = count;
      return obj;
    }, {});
  
  return breakdown;
}

function generateLinkRecommendations(result) {
  const recommendations = [];
  const { summary, links } = result;
  
  // High priority: Many broken links
  if (summary.brokenLinks > 10) {
    recommendations.push({
      priority: 'high',
      category: 'link_maintenance',
      title: 'Urgent Link Maintenance Required',
      description: `${summary.brokenLinks} broken links found (${100 - summary.successRate}% failure rate)`,
      action: 'Review and update broken links immediately to maintain site quality'
    });
  } else if (summary.brokenLinks > 5) {
    recommendations.push({
      priority: 'medium',
      category: 'link_maintenance',
      title: 'Link Maintenance Needed',
      description: `${summary.brokenLinks} broken links found`,
      action: 'Schedule time to review and update broken links'
    });
  }
  
  // ORCID specific issues
  const brokenOrcids = links.filter(l => l.type.includes('orcid') && l.status === 'broken');
  if (brokenOrcids.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'orcid_maintenance',
      title: 'ORCID Link Issues',
      description: `${brokenOrcids.length} ORCID links are broken`,
      action: 'Verify ORCID IDs are correctly formatted and profiles are public'
    });
  }
  
  // Website issues
  const brokenWebsites = links.filter(l => l.type === 'website' && l.status === 'broken');
  if (brokenWebsites.length > 3) {
    recommendations.push({
      priority: 'low',
      category: 'website_maintenance',
      title: 'Faculty Website Updates',
      description: `${brokenWebsites.length} faculty websites are not accessible`,
      action: 'Contact faculty to update their website URLs or remove broken links'
    });
  }
  
  // Success rate recommendations
  if (summary.successRate < 85) {
    recommendations.push({
      priority: 'high',
      category: 'data_quality',
      title: 'Poor Link Success Rate',
      description: `Link success rate is ${summary.successRate}%, below target of 85%`,
      action: 'Implement regular link checking and proactive maintenance'
    });
  } else if (summary.successRate > 95) {
    recommendations.push({
      priority: 'low',
      category: 'maintenance',
      title: 'Excellent Link Quality',
      description: `Link success rate is ${summary.successRate}% - well maintained!`,
      action: 'Continue current maintenance practices'
    });
  }
  
  return recommendations;
}

// Run if called directly
if (require.main === module) {
  generateLinkReport();
}

module.exports = generateLinkReport;