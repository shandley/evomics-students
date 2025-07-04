#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class LinkChecker {
  constructor() {
    this.results = [];
    this.facultyData = null;
    this.enrichedData = null;
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
          'User-Agent': 'Mozilla/5.0 (compatible; Evomics-Faculty-Link-Checker/1.0)',
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
            error: `Unexpected status ${statusCode}`
          });
        }
      });

      request.on('error', (error) => {
        clearTimeout(timeoutId);
        
        // Categorize common errors
        let errorMessage = error.message;
        if (error.code === 'ENOTFOUND') {
          errorMessage = 'Domain not found';
        } else if (error.code === 'ECONNREFUSED') {
          errorMessage = 'Connection refused';
        } else if (error.code === 'ETIMEDOUT') {
          errorMessage = 'Connection timeout';
        } else if (error.code === 'CERT_HAS_EXPIRED') {
          errorMessage = 'SSL certificate expired';
        } else if (error.message.includes('certificate')) {
          errorMessage = 'SSL certificate issue';
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
          error: 'Connection timeout'
        });
      });
    });
  }

  async checkFacultyLinks() {
    console.log('🔍 Checking faculty website links...');
    
    const promises = this.facultyData.map(async (faculty) => {
      const links = [];
      
      // Check main website
      if (faculty.website) {
        const result = await this.checkUrl(faculty.website);
        links.push({
          type: 'website',
          url: faculty.website,
          facultyId: faculty.id,
          facultyName: `${faculty.firstName} ${faculty.lastName}`,
          ...result
        });
      }
      
      // Check enriched data links
      const enriched = this.enrichedData[faculty.id];
      if (enriched?.enrichment?.professional?.labWebsite) {
        const result = await this.checkUrl(enriched.enrichment.professional.labWebsite);
        links.push({
          type: 'lab_website',
          url: enriched.enrichment.professional.labWebsite,
          facultyId: faculty.id,
          facultyName: `${faculty.firstName} ${faculty.lastName}`,
          ...result
        });
      }
      
      return links;
    });
    
    const allResults = await Promise.all(promises);
    return allResults.flat();
  }

  async checkOrcidLinks() {
    console.log('🔍 Checking ORCID links...');
    
    const orcidPromises = this.facultyData.map(async (faculty) => {
      const orcidLinks = [];
      
      // Check main ORCID
      if (faculty.orcid) {
        const orcidUrl = `https://orcid.org/${faculty.orcid}`;
        const result = await this.checkUrl(orcidUrl);
        orcidLinks.push({
          type: 'orcid',
          url: orcidUrl,
          facultyId: faculty.id,
          facultyName: `${faculty.firstName} ${faculty.lastName}`,
          ...result
        });
      }
      
      // Check enriched ORCID
      const enriched = this.enrichedData[faculty.id];
      if (enriched?.enrichment?.academic?.orcid && enriched.enrichment.academic.orcid !== faculty.orcid) {
        const orcidUrl = `https://orcid.org/${enriched.enrichment.academic.orcid}`;
        const result = await this.checkUrl(orcidUrl);
        orcidLinks.push({
          type: 'orcid_enriched',
          url: orcidUrl,
          facultyId: faculty.id,
          facultyName: `${faculty.firstName} ${faculty.lastName}`,
          ...result
        });
      }
      
      return orcidLinks;
    });
    
    const allOrcidResults = await Promise.all(orcidPromises);
    return allOrcidResults.flat();
  }

  async checkInstitutionalLinks() {
    console.log('🔍 Checking institutional affiliation links...');
    
    // This could be expanded to check institutional pages
    // For now, we'll focus on explicitly provided URLs
    const institutionalLinks = [];
    
    // Check for any institutional URLs in enrichment data
    for (const [facultyId, data] of Object.entries(this.enrichedData)) {
      if (data.enrichment?.profile?.source) {
        const faculty = this.facultyData.find(f => f.id === facultyId);
        if (faculty && this.isValidUrl(data.enrichment.profile.source)) {
          const result = await this.checkUrl(data.enrichment.profile.source);
          institutionalLinks.push({
            type: 'profile_source',
            url: data.enrichment.profile.source,
            facultyId,
            facultyName: `${faculty.firstName} ${faculty.lastName}`,
            ...result
          });
        }
      }
    }
    
    return institutionalLinks;
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  async checkAllLinks() {
    console.log('🚀 Starting link checking process...');
    
    this.loadData();
    
    // Check all types of links
    const facultyLinks = await this.checkFacultyLinks();
    const orcidLinks = await this.checkOrcidLinks();
    const institutionalLinks = await this.checkInstitutionalLinks();
    
    this.results = [...facultyLinks, ...orcidLinks, ...institutionalLinks];
    
    // Generate summary
    const summary = this.generateSummary();
    
    console.log(`\n📊 Link Check Results:`);
    console.log(`   Total links checked: ${summary.totalLinks}`);
    console.log(`   Working links: ${summary.workingLinks}`);
    console.log(`   Warning links: ${summary.warningLinks}`);
    console.log(`   Broken links: ${summary.brokenLinks}`);
    console.log(`   Overall success rate: ${summary.successRate}%`);
    console.log(`   Strict success rate: ${summary.strictSuccessRate}%`);
    
    if (summary.warningLinks > 0) {
      console.log(`\n⚠️  Warning links found:`);
      const warningLinks = this.results.filter(r => r.status === 'warning');
      warningLinks.slice(0, 3).forEach(link => {
        console.log(`   - ${link.type}: ${link.facultyName} - ${link.url} (${link.error})`);
      });
      if (warningLinks.length > 3) {
        console.log(`   ... and ${warningLinks.length - 3} more warnings`);
      }
    }
    
    if (summary.brokenLinks > 0) {
      console.log(`\n❌ Broken links found:`);
      const brokenLinks = this.results.filter(r => r.status === 'broken');
      brokenLinks.slice(0, 5).forEach(link => {
        console.log(`   - ${link.type}: ${link.facultyName} - ${link.url} (${link.error})`);
      });
      if (brokenLinks.length > 5) {
        console.log(`   ... and ${brokenLinks.length - 5} more`);
      }
    }
    
    return {
      links: this.results,
      summary
    };
  }

  generateSummary() {
    const totalLinks = this.results.length;
    const workingLinks = this.results.filter(r => r.status === 'working').length;
    const brokenLinks = this.results.filter(r => r.status === 'broken').length;
    const warningLinks = this.results.filter(r => r.status === 'warning').length;
    
    // Consider warnings as working for success rate calculation
    const functionalLinks = workingLinks + warningLinks;
    
    return {
      totalLinks,
      workingLinks,
      brokenLinks,
      warningLinks,
      functionalLinks,
      successRate: totalLinks > 0 ? Math.round((functionalLinks / totalLinks) * 100) : 0,
      strictSuccessRate: totalLinks > 0 ? Math.round((workingLinks / totalLinks) * 100) : 0,
      timestamp: new Date().toISOString()
    };
  }
}

// Run if called directly
if (require.main === module) {
  const checker = new LinkChecker();
  checker.checkAllLinks()
    .then(result => {
      const { brokenLinks, successRate } = result.summary;
      
      if (brokenLinks > 0) {
        console.log(`\n⚠️  Found ${brokenLinks} broken links (${successRate}% success rate)`);
        
        // Only fail if there are many broken links or very low success rate
        if (brokenLinks > 20 || successRate < 80) {
          console.log('❌ Too many broken links - failing workflow');
          process.exit(1);
        } else {
          console.log('✅ Acceptable number of broken links - creating issue for tracking');
          process.exit(0);
        }
      } else {
        console.log('\n✅ All links are working');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('💥 Link checking error:', error.message);
      process.exit(1);
    });
}

module.exports = LinkChecker;