# Faculty Data Quality Improvement Tasks

## Priority Tasks for Data Quality Enhancement

### 1. Fix Duplicate Entry (✓ Completed)
- **Issue**: `fernandez-rosa` and `fernndez-rosa` appear to be the same person
- **Action**: Merge entries, standardize spelling
- **Status**: To be completed

### 2. Add ORCID IDs (High Priority)
Currently only 7 out of 125 enriched faculty (5.6%) have ORCID IDs. Target faculty:

#### Top 10 Faculty Needing ORCID IDs:
1. **Guy Leonard** - University of Oxford
2. **Marina Marcet-Houben** - Barcelona Supercomputing Center
3. **Daniel McDonald** - University of Colorado Boulder
4. **Claudia Bank** - SIB Swiss Institute of Bioinformatics
5. **Julian Catchen** - University of Illinois
6. **Laura Kubatko** - Ohio State University
7. **Milan Malinsky** - University of Basel
8. **Michael Matschiner** - Natural History Museum, University of Oslo
9. **Camille Marchet** - CNRS / University of Lille
10. **Joseph Bielawski** - Dalhousie University

### 3. Enrich High-Value Unenriched Faculty
Priority targets with multiple participations:

1. **Sonya Dyhrman** (dyhrman-sonya)
   - 9 participations (2016-2025)
   - Columbia University

2. **Manuel Garber** (garber-manuel)
   - 5 participations (2011-2015)
   - UMass Medical School

3. **Antoine Limasset** (limasset-antoine)
   - 5 participations (2020-2025)
   - CNRS/University of Lille

4. **David Barnett** (barnett-david)
   - 4 participations (2022-2025)

5. **Daniel Falush** (falush-daniel)
   - 3 participations
   - Well-known population geneticist

### 4. Add Missing Lab Websites
- Only 16 out of 125 enriched faculty (12.8%) have lab websites
- Many professors have easily findable lab pages

### 5. Data Standardization

#### Research Areas Consolidation
Current issues:
- "genomics" appears in 28 variations
- "evolution" appears in 37 variations
- "genetics" appears in 20 variations

Proposed hierarchy:
```
- Genomics
  - Population Genomics
  - Evolutionary Genomics
  - Comparative Genomics
  - Single-cell Genomics
  - Metagenomics
- Evolution
  - Molecular Evolution
  - Evolutionary Biology
  - Evolutionary Genetics
- Bioinformatics
  - Computational Biology
  - Systems Biology
```

#### Department Name Standardization
- Remove "Department of" prefix for consistency
- Use standard abbreviations (CS for Computer Science, etc.)

### 6. Workshop-Specific Improvements

#### Coverage by Workshop:
- **WPhylo**: 88.0% enriched (best coverage)
- **WoG**: 82.4% enriched
- **WPSG**: 79.0% enriched (needs attention)

### 7. Data Validation Checks

#### Implement validation for:
- Lab Website URLs (ensure http:// or https:// prefix)
- ORCID format (XXXX-XXXX-XXXX-XXXX)
- Email addresses (institutional emails)
- Duplicate detection (similar names)

## Progress Tracking

### Completed:
- [x] Initial data enrichment (137 faculty)
- [x] Fixed data confidence display issue
- [x] Updated Scott Handley's information

### In Progress:
- [ ] Fix fernandez/fernndez duplicate
- [ ] Add ORCID IDs for top 10 faculty

### Todo:
- [ ] Enrich high-participation faculty
- [ ] Add missing lab websites
- [ ] Standardize research areas
- [ ] Create validation script

## Quick Wins (Can be done in 2-3 hours)
1. Fix duplicate entry (5 minutes)
2. Add 10 ORCID IDs (30 minutes)
3. Enrich top 3 high-value faculty (1 hour)
4. Add 10 lab websites (30 minutes)

## Metrics to Track
- Current enrichment: 137/171 (80.1% after cleanup)
- Target enrichment: 145/171 (85%)
- ORCID coverage: 7/137 (5.1%) → Target: 50/137 (36%)
- Lab website coverage: 16/137 (11.7%) → Target: 50/137 (36%)