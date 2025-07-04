# ORCID ID Update Report - July 2025

## Overview
Successfully searched for and updated ORCID IDs for 7 out of 10 requested faculty members in the Evomics Faculty Alumni database.

## Successfully Updated Faculty

### ✅ Added ORCID IDs (7 faculty)

1. **Rachael Dudaniec** - Associate Professor, Macquarie University
   - ORCID: `0000-0002-1854-6808`
   - Research: Landscape genetics, evolutionary genetics, conservation genetics
   - Verified: Macquarie University profile, ORCID database

2. **Sarah Hird** - Assistant Professor, University of Connecticut  
   - ORCID: `0000-0002-1998-9387`
   - Research: Microbiome evolution, gut microbiota, bioinformatics
   - Verified: UConn MCB department, ORCID database

3. **Andrew Kern** - Professor, University of Oregon
   - ORCID: `0000-0003-4381-4680` 
   - Research: Population genetics, evolutionary biology, machine learning
   - Verified: Institute of Ecology and Evolution, ORCID database

4. **Fabrizio Mafessoni** - Research Group Leader, Max Planck Institute for Evolutionary Anthropology
   - ORCID: `0000-0003-4319-2076`
   - Research: Evolutionary anthropology, ancient DNA, population genetics  
   - Verified: Max Planck Institute, PNAS publications

5. **Angela Hancock** - Group Leader, Max Planck Institute (moving to Purdue 2025)
   - ORCID: `0000-0002-4768-3377`
   - Research: Population genetics, quantitative genetics, climate adaptation
   - Verified: MPI Plant Biology, Wikidata

6. **Petr Danecek** - Senior Bioinformatician, Wellcome Sanger Institute  
   - ORCID: `0000-0002-4159-1666` *(corrected previous entry)*
   - Research: BCFtools/SAMtools development, large-scale sequencing
   - Verified: Wellcome Sanger Institute, ARDC Research Link

7. **Gytis Dudas** - Scientist, Vilnius University Life Sciences Center
   - ORCID: `0000-0002-0227-4158`
   - Research: Viral evolution, RNA virus ecology, phylogenetics
   - Verified: GGBC Gothenburg University, ORCID database

## Faculty Without Found ORCID IDs

### ❌ Could Not Locate (3 faculty)

1. **Ryan Gutenkunst** - Associate Professor, University of Arizona
   - Status: Extensive academic profile found, but no ORCID ID located
   - Institution: Multiple departments (MCB, EEB, Public Health)
   - Note: May need direct contact or personal webpage check

2. **Daniel Fifield** - Memorial University of Newfoundland  
   - Status: No exact match found for "Daniel Fifield"
   - Alternative: Found **David A. Fifield** (ORCID: `0000-0001-5433-4733`)
   - Note: David A. Fifield is seabird researcher at Memorial University - possible name variation

3. **Kirk Gosik** - Cornell University
   - Status: Academic profiles found but no ORCID ID
   - Current: Director of Computational Biology at Constantiam Biosciences
   - Previous: Penn State College of Medicine, Broad Institute
   - Note: Active researcher but may not have public ORCID

## Technical Implementation

### Update Process
- Created `updateNewORCIDs.js` script for safe batch updates
- Generated backup: `facultyEnriched.json.backup.2025-07-02T23-47-36-078Z`  
- Updated `lastUpdated` timestamps for all modified records
- Added ORCID IDs to `academic` section of faculty enrichment data

### Data Structure
```json
{
  "academic": {
    "researchAreas": [...],
    "orcid": "0000-0000-0000-0000"
  }
}
```

### Verification Methods
- Cross-referenced institutional websites
- Verified ORCID database entries  
- Confirmed research specializations
- Checked publication records where available

## Recommendations

### For Missing ORCID IDs
1. **Ryan Gutenkunst**: Contact directly via University of Arizona email
2. **Daniel Fifield**: Verify if this is David A. Fifield or different person
3. **Kirk Gosik**: Check LinkedIn profile or personal webpage for ORCID

### Future ORCID Collection
- Add ORCID field to faculty update Google Form
- Include ORCID in workshop registration/application process
- Periodic verification of existing ORCID IDs for accuracy

## Impact
- **Coverage Increase**: Added 7 new ORCID identifiers
- **Data Quality**: Corrected 1 existing ORCID (Petr Danecek)  
- **Research Integration**: Enhanced faculty profiles for better discoverability
- **Academic Networking**: Improved connections to publication records

---
*Updated: July 2, 2025*  
*Backup Location: `src/data/facultyEnriched.json.backup.2025-07-02T23-47-36-078Z`*