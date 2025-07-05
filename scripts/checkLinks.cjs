#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class StudentLinkChecker {
  constructor() {
    this.results = [];
    this.studentData = null;
    this.workshops = null;
  }

  loadData() {
    try {
      // Load student data
      const studentPath = path.join(__dirname, '../src/data/studentData.json');
      this.studentData = JSON.parse(fs.readFileSync(studentPath, 'utf8'));
      
      // Load workshops
      const workshopsPath = path.join(__dirname, '../src/data/workshops.json');
      this.workshops = JSON.parse(fs.readFileSync(workshopsPath, 'utf8'));
      
      console.log('✅ Data files loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load data files:', error.message);
      throw error;
    }
  }

  async checkUrl(url, timeout = 15000) {
    return new Promise((resolve) => {
      if (!url || typeof url !== 'string') {
        resolve({
          status: 'broken',
          statusCode: null,
          error: 'Invalid URL'
        });
        return;
      }

      // Basic URL validation
      try {
        new URL(url);
      } catch (error) {
        resolve({
          status: 'broken',
          statusCode: null,
          error: 'Malformed URL'
        });
        return;
      }

      const client = url.startsWith('https:') ? https : http;
      const timeoutId = setTimeout(() => {
        resolve({
          status: 'broken',
          statusCode: null,
          error: 'Timeout (15s)'
        });
      }, timeout);

      const request = client.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Evomics-Students-Link-Checker/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'close'
        },
        // Allow self-signed certificates for academic sites
        rejectUnauthorized: false
      }, (response) => {
        clearTimeout(timeoutId);
        
        const statusCode = response.statusCode;
        
        // Handle redirects
        if (statusCode >= 300 && statusCode < 400 && response.headers.location) {
          resolve({
            status: 'working',
            statusCode,
            error: `Redirect to ${response.headers.location}`
          });
        } else if (statusCode >= 200 && statusCode < 300) {
          resolve({
            status: 'working',
            statusCode,
            error: null
          });
        } else if (statusCode === 403) {
          // 403 might be due to bot blocking, consider as warning rather than broken
          resolve({
            status: 'warning',
            statusCode,
            error: 'Access forbidden (possibly bot blocking)'
          });
        } else if (statusCode >= 400) {
          resolve({
            status: 'broken',
            statusCode,
            error: `HTTP ${statusCode}`
          });
        } else {
          resolve({
            status: 'warning',
            statusCode,
            error: `Unexpected status code: ${statusCode}`
          });
        }
      });

      request.on('error', (error) => {
        clearTimeout(timeoutId);
        let errorMessage = error.message;
        
        if (error.code === 'ENOTFOUND') {
          errorMessage = 'Domain not found';
        } else if (error.code === 'ECONNREFUSED') {
          errorMessage = 'Connection refused';
        } else if (error.code === 'ETIMEDOUT') {
          errorMessage = 'Connection timeout';
        } else if (error.code === 'CERT_HAS_EXPIRED') {
          errorMessage = 'SSL certificate expired';
        }
        
        resolve({
          status: 'broken',
          statusCode: null,
          error: errorMessage
        });
      });

      request.setTimeout(timeout, () => {
        clearTimeout(timeoutId);
        request.destroy();
        resolve({
          status: 'broken',
          statusCode: null,
          error: 'Request timeout'
        });
      });
    });
  }

  async checkStudentSiteLinks() {
    console.log('🔍 Checking student dashboard site links...');
    
    const siteUrls = [
      'https://shandley.github.io/evomics-students/',
      'https://shandley.github.io/evomics-faculty/', // Cross-reference to faculty site
      'https://evomics.org' // Main evomics site
    ];

    for (const url of siteUrls) {
      const result = await this.checkUrl(url);
      this.results.push({
        url,
        type: 'site_link',
        status: result.status,
        statusCode: result.statusCode,
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }
  }

  async checkInstitutionalWebsites() {
    console.log('🔍 Checking institutional website links...');
    
    // Get unique institutions and try to find their websites
    const institutions = [...new Set(this.studentData.students.map(s => s.institution))];
    const institutionalUrls = [];
    
    // Common institutional website patterns
    const institutionUrlMap = {
      'CDC': 'https://www.cdc.gov',
      'NMNH': 'https://naturalhistory.si.edu',
      'Uppsala University': 'https://www.uu.se',
      'Lund University': 'https://www.lu.se', 
      'University of Copenhagen': 'https://www.ku.dk',
      'Stockholm University': 'https://www.su.se',
      'Harvard University': 'https://www.harvard.edu',
      'Stanford University': 'https://www.stanford.edu',
      'University of California, Berkeley': 'https://www.berkeley.edu',
      'MIT': 'https://www.mit.edu',
      'NIH': 'https://www.nih.gov',
      'Broad Institute': 'https://www.broadinstitute.org'
    };

    // Check major institutions that we know have websites
    for (const [institution, url] of Object.entries(institutionUrlMap)) {
      if (institutions.includes(institution)) {
        institutionalUrls.push({ institution, url });
      }
    }

    // Check a sample of institutional URLs
    const sampleUrls = institutionalUrls.slice(0, 10); // Limit to avoid too many requests

    for (const { institution, url } of sampleUrls) {
      const result = await this.checkUrl(url);
      this.results.push({
        url,
        type: 'institutional_website',
        status: result.status,
        statusCode: result.statusCode,
        error: result.error,
        institution,
        timestamp: new Date().toISOString()
      });
    }
  }

  async checkWorkshopReferences() {
    console.log('🔍 Checking workshop reference links...');
    
    // Check evomics.org workshop pages
    const workshopUrls = [
      'https://evomics.org/workshops/workshop-on-genomics/',
      'https://evomics.org/workshops/workshop-on-population-and-speciation-genomics/',
      'https://evomics.org/workshops/workshop-on-phylogenomics/',
      'https://evomics.org/workshops/'
    ];

    for (const url of workshopUrls) {
      const result = await this.checkUrl(url);
      this.results.push({
        url,
        type: 'workshop_reference',
        status: result.status,
        statusCode: result.statusCode,
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }
  }

  generateSummary() {
    const totalLinks = this.results.length;
    const workingLinks = this.results.filter(r => r.status === 'working').length;
    const warningLinks = this.results.filter(r => r.status === 'warning').length;
    const brokenLinks = this.results.filter(r => r.status === 'broken').length;
    
    const successRate = totalLinks > 0 ? (workingLinks / totalLinks * 100) : 0;
    const strictSuccessRate = totalLinks > 0 ? ((workingLinks) / totalLinks * 100) : 0; // Only count working as success

    return {
      totalLinks,
      workingLinks,
      warningLinks,
      brokenLinks,
      successRate: Math.round(successRate * 10) / 10,
      strictSuccessRate: Math.round(strictSuccessRate * 10) / 10
    };
  }

  async checkLinks() {
    console.log('🚀 Starting student site link checking process...\n');
    
    this.loadData();
    
    await this.checkStudentSiteLinks();
    await this.checkInstitutionalWebsites();
    await this.checkWorkshopReferences();
    
    const summary = this.generateSummary();
    
    console.log('\n📊 Link Check Results:');
    console.log(`   Total links checked: ${summary.totalLinks}`);
    console.log(`   Working links: ${summary.workingLinks}`);
    console.log(`   Warning links: ${summary.warningLinks}`);
    console.log(`   Broken links: ${summary.brokenLinks}`);
    console.log(`   Overall success rate: ${summary.successRate}%`);
    console.log(`   Strict success rate: ${summary.strictSuccessRate}%`);
    
    // Show details for non-working links
    const warningLinks = this.results.filter(r => r.status === 'warning');
    const brokenLinks = this.results.filter(r => r.status === 'broken');
    
    if (warningLinks.length > 0) {
      console.log('\n⚠️  Warning links found:');
      warningLinks.forEach(link => {
        console.log(`   - ${link.type}: ${link.institution || 'N/A'} - ${link.url} (${link.error})`);
      });
    }
    
    if (brokenLinks.length > 0) {
      console.log('\n❌ Broken links found:');
      brokenLinks.forEach(link => {
        console.log(`   - ${link.type}: ${link.institution || 'N/A'} - ${link.url} (${link.error})`);
      });
    }
    
    if (warningLinks.length === 0 && brokenLinks.length === 0) {
      console.log('\n✅ All links are working properly!');
    }
    
    return {
      links: this.results,
      summary
    };
  }
}

// Run link checking if called directly
if (require.main === module) {
  const checker = new StudentLinkChecker();
  checker.checkLinks()
    .then(result => {
      if (result.summary.brokenLinks > 0) {
        console.log(`\n⚠️  Found ${result.summary.brokenLinks} broken links`);
        process.exit(0); // Don't fail CI for broken external links
      }
    })
    .catch(error => {
      console.error('❌ Link checking failed:', error.message);
      process.exit(1);
    });
}

module.exports = StudentLinkChecker;