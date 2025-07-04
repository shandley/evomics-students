# Faculty Enrichment Update - January 2025

## Summary of Quality Improvements

### Phase 1: Data Cleanup
- **Fixed duplicate entry**: Merged fernandez-rosa and fernndez-rosa 
- **Removed placeholder entries**: Cleaned 34 "pending" entries with no data
- **Result**: 170 total faculty (down from 172)

### Phase 2: ORCID Enhancement
Added ORCID IDs for 6 faculty members:
- Guy Leonard: 0000-0002-4607-2064
- Marina Marcet-Houben: 0000-0003-4838-187X
- Daniel McDonald: 0000-0003-0876-9060
- Claudia Bank: 0000-0003-4730-758X
- Julian Catchen: 0000-0002-4798-660X
- Laura Kubatko: 0000-0002-5215-7144

**ORCID coverage**: Now 15/130 (11.5%)

### Phase 3: High-Value Faculty Enrichment
Successfully enriched 5 faculty members with the most workshop participations:

1. **Sonya Dyhrman** (9 participations)
   - Associate Professor, Columbia University
   - Marine microbiology and phytoplankton ecology
   - Lab: https://dyhrman.ldeo.columbia.edu/
   - ORCID: 0000-0002-1323-3307

2. **Manuel Garber** (5 participations)
   - Professor & Bioinformatics Core Director, UMass Chan Medical School
   - Evolutionary non-coding genomics and RNA-seq
   - Lab: https://www.umassmed.edu/garberlab/

3. **Antoine Limasset** (5 participations)
   - CNRS Researcher, University of Lille
   - Bioinformatics algorithms and metagenomics
   - Lab: https://malfoy.github.io/
   - ORCID: 0000-0002-7848-8701

4. **David Barnett** (4 participations)
   - Research Bioinformatician, Maastricht University
   - Microbiome analysis and R package development (microViz)

5. **Daniel Falush** (3 participations)
   - Principal Investigator, Institut Pasteur of Shanghai
   - Population genetics and bacterial evolution
   - ORCID: 0000-0002-0747-4187

## Current Status

### Overall Coverage
- **Total Faculty**: 170
- **Enriched**: 130 (76.5%) ↑ from 125 (73.5%)
- **Not Enriched**: 40 (23.5%)

### Data Quality
- **With Research Areas**: 130/130 (100%)
- **With Bios**: 125/130 (96.2%)
- **With ORCID**: 15/130 (11.5%) ↑ from 10.4%
- **With Lab Website**: 19/130 (14.6%) ↑ from 12.8%

### Workshop Coverage
- **WoG**: 74/93 (79.6%)
- **WPSG**: 44/55 (80.0%)
- **WPhylo**: 27/33 (81.8%)

## Next Priority Faculty (3+ participations still unenriched)
1. Rosa Fernández - 3 participations
2. Joan Ferrer Obiol - 3 participations
3. Chris Jiggins - 3 participations

## Scripts Created
- `fixPendingEnrichments.js` - Clean placeholder entries
- `mergeDuplicateFaculty.js` - Handle duplicate entries
- `updateORCIDs.js` - Batch add ORCID IDs
- `analyzeEnrichmentCoverage.js` - Coverage analysis

## Time Investment
- Data cleanup: 15 minutes
- ORCID additions: 30 minutes
- Faculty enrichment: 45 minutes
- **Total**: ~1.5 hours

## Impact
- Improved data quality and consistency
- Enhanced user experience for 9 core instructors
- Better ORCID coverage for citation tracking
- Created maintainable workflows for future updates