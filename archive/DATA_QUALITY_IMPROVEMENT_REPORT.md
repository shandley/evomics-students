# Faculty Data Quality Analysis & Improvement Recommendations

## Executive Summary

The Evomics faculty database contains 171 faculty members with 427 total participations across 3 workshops. Currently, 125 faculty (73.1%) have enriched profiles. This analysis identifies key data quality issues and provides actionable recommendations for improvement.

## 1. Data Consistency Issues

### 1.1 Duplicate Entries
- **Issue**: Found potential duplicate entry:
  - `fernandez-rosa` vs `fernndez-rosa` (likely the same person with different spellings)
- **Action**: Merge these entries, standardizing to the correct spelling

### 1.2 Inconsistent Department/Affiliation Formats
- **Issue**: Multiple variations for similar departments:
  - Biology: "Biology", "Department of Biology", "Biological Sciences", etc.
  - Computer Science: "Computer Science", "Department of Computer Science", "Faculty of Computer Science"
  - Genetics: "Department of Genetics", "Department of Evolutionary Genetics", etc.
- **Recommendation**: Standardize department names using a controlled vocabulary

### 1.3 Missing/Incomplete URLs
- **Issue**: Only 12.8% of enriched profiles have lab websites
- **Opportunity**: Quick win to add lab URLs for the remaining 87.2%

### 1.4 ORCID Coverage
- **Issue**: Only 5.6% (7 out of 125) enriched faculty have ORCID IDs
- **Recommendation**: Priority addition as ORCID provides stable researcher identification

## 2. Coverage Analysis

### 2.1 Workshop Enrichment Rates
- **WPhylo**: 88.0% enriched (best coverage)
- **WoG**: 82.4% enriched
- **WPSG**: 79.0% enriched (lowest coverage)

### 2.2 High-Value Faculty Without Enrichment
Top priority faculty for enrichment (multiple years of participation):

1. **Sonya Dyhrman** (dyhrman-sonya)
   - 9 participations (2016-2025)
   - Columbia University faculty - easy to enrich

2. **Manuel Garber** (garber-manuel)
   - 5 participations (2011-2015)
   - UMass Medical School - straightforward enrichment

3. **Antoine Limasset** (limasset-antoine)
   - 5 participations (2020-2025)
   - CNRS/University of Lille - current faculty

4. **David Barnett** (barnett-david)
   - 4 participations (2022-2025)
   - Recent regular faculty

5. **Daniel Falush** (falush-daniel)
   - 3 participations
   - Well-known researcher - easy to find information

## 3. Simple Enhancement Opportunities

### 3.1 Research Area Standardization
**Issue**: Overlapping/duplicate research areas
- "genomics" appears in 28 variations (genomics, population genomics, evolutionary genomics, etc.)
- "evolution" appears in 37 variations
- "genetics" appears in 20 variations

**Recommendation**: Create hierarchical taxonomy:
```
- Genomics
  - Population Genomics
  - Evolutionary Genomics
  - Comparative Genomics
  - Single-cell Genomics
  - Metagenomics
```

### 3.2 Quick Data Additions

**Missing ORCID IDs for Enriched Faculty** (top priority):
1. Guy Leonard - University of Oxford
2. Marina Marcet-Houben - Barcelona Supercomputing Center
3. Daniel McDonald - University of Colorado Boulder
4. Claudia Bank - SIB Swiss Institute of Bioinformatics
5. Julian Catchen - University of Illinois
6. Laura Kubatko - Ohio State University
7. Milan Malinsky - University of Basel
8. Michael Matschiner - Natural History Museum, University of Oslo
9. Camille Marchet - CNRS / University of Lille
10. Joseph Bielawski - Dalhousie University

### 3.3 Data Validation Needs
- **Lab Website URLs**: Add validation to ensure all URLs start with http:// or https://
- **ORCID Format**: Implement validation for XXXX-XXXX-XXXX-XXXX format
- **Email Addresses**: Consider adding validated institutional emails

## 4. Actionable Improvements (Priority Order)

### Immediate Actions (1-2 hours work)
1. **Fix duplicate entry**: Merge fernandez-rosa and fernndez-rosa
2. **Add ORCID IDs**: For the 10 faculty listed above (easily findable)
3. **Enrich Sonya Dyhrman**: 9-time participant, Columbia faculty
4. **Enrich Manuel Garber**: 5-time participant, UMass Medical School

### Short-term Actions (1 day work)
1. **Standardize departments**: Create mapping table for common variations
2. **Add lab websites**: Focus on enriched faculty missing URLs
3. **Enrich remaining high-value faculty**: Those with 3+ participations
4. **Standardize research areas**: Create hierarchical taxonomy

### Medium-term Actions (1 week work)
1. **Complete WPSG enrichment**: Bring from 79% to 90%+
2. **Add missing professional titles**: 8 faculty missing titles
3. **Validate all URLs and ORCIDs**: Implement format checking
4. **Create data enrichment guide**: For consistent future additions

## 5. Data Quality Metrics

### Current State
- **Total Coverage**: 73.1% enriched
- **Professional Info**: 92.8% have titles, 93.6% have departments
- **Academic Info**: 100% have research areas, 5.6% have ORCIDs
- **Web Presence**: 12.8% have lab websites
- **Biographical Info**: 96.0% have short bios

### Target State (achievable in 1 month)
- **Total Coverage**: 85% enriched
- **ORCID Coverage**: 50% of enriched faculty
- **Lab Website Coverage**: 60% of enriched faculty
- **Zero duplicate entries**
- **Standardized departments and research areas**

## 6. Implementation Recommendations

1. **Create a Google Sheet** with priority faculty for enrichment
2. **Use batch ORCID lookup** via ORCID public API
3. **Implement automated URL validation** in the processing script
4. **Add data quality checks** to the faculty update workflow
5. **Consider web scraping** for lab websites of major universities

## Conclusion

The faculty database has good coverage (73.1%) but significant opportunities for improvement exist in:
- Adding ORCID IDs (quick win)
- Standardizing data formats
- Enriching high-value faculty
- Adding lab websites

These improvements would significantly enhance the value of the faculty directory for workshop participants and organizers.