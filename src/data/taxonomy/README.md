# Scientific Topics Taxonomy

## Overview
This directory contains the standardized scientific topics dictionary for the Evomics Faculty Alumni system. The taxonomy provides a hierarchical classification of research areas to improve consistency, searchability, and user experience.

## Structure

### Hierarchy Levels
1. **Level 1**: Major Scientific Domains (10 categories)
2. **Level 2**: Core Disciplines (40-50 categories)
3. **Level 3**: Specializations (150-200 terms)
4. **Level 4**: Techniques/Methods (300-400 terms)

### File Organization
- `scientificTopics.json` - Main taxonomy definition
- `termMappings.json` - Mappings from current terms to standardized terms
- `examples/` - Sample data and use cases
- `validation/` - Validation rules and schemas

## Naming Conventions

### ID Format
- Use kebab-case for all IDs: `comparative-genomics`
- IDs must be unique across all levels
- IDs should be descriptive but concise
- No special characters except hyphens

### Label Format
- Use Title Case for labels: `Comparative Genomics`
- Keep labels concise (2-4 words preferred)
- Avoid abbreviations in labels (use synonyms instead)
- Use ampersand (&) for compound categories

### Examples
```json
{
  "id": "single-cell-genomics",
  "label": "Single-Cell Genomics",
  "level": 2,
  "parentId": "genomics-omics",
  "synonyms": ["single cell genomics", "single-cell sequencing", "scRNA-seq"]
}
```

## Category Descriptions

### Level 1 Categories

1. **Computational Sciences** - Computer science applications in biology
2. **Genomics & Omics Sciences** - Large-scale molecular data analysis
3. **Evolutionary Biology** - Evolution and phylogenetics
4. **Population & Quantitative Sciences** - Population-level genetic analysis
5. **Microbiology & Microbiome Sciences** - Microorganisms and communities
6. **Molecular & Cellular Biology** - Molecular mechanisms and cells
7. **Medical & Clinical Sciences** - Human health applications
8. **Ecology & Environmental Sciences** - Organisms and environments
9. **Mathematical & Statistical Sciences** - Mathematical methods in biology
10. **Technology & Methodology Development** - New tools and approaches

## Usage Guidelines

### Adding New Topics
1. Determine appropriate level (1-4)
2. Find correct parent category
3. Check for existing similar terms
4. Follow naming conventions
5. Add synonyms for discoverability
6. Update metadata counts

### Mapping Existing Terms
1. Search for exact matches first
2. Check synonyms for close matches
3. Consider broader categories if no exact match
4. Document confidence level (high/medium/low)
5. Add notes for ambiguous cases

### Validation Rules
- All topics must have: id, label, level
- Level 2-4 must have parentId
- Parent must exist before children
- No circular references
- Synonyms must be unique across taxonomy

## Data Model

### Topic Structure
```typescript
interface Topic {
  id: string;                    // Unique identifier
  label: string;                 // Display name
  level: 1 | 2 | 3 | 4;         // Hierarchy level
  parentId?: string;             // Parent topic ID (required for L2-4)
  description?: string;          // Brief description
  synonyms?: string[];           // Alternative names
  children?: string[];           // Child topic IDs
  icon?: string;                 // Emoji or icon identifier
  metadata?: {
    addedDate: string;           // ISO date when added
    addedBy: string;             // Who added it
    lastModified?: string;       // Last modification date
    usage?: number;              // Usage count
  };
}
```

### Mapping Structure
```typescript
interface TermMapping {
  originalTerm: string;          // Current term in use
  standardizedId: string;        // Mapped topic ID
  confidence: 'high' | 'medium' | 'low';
  notes?: string;                // Explanation or context
  reviewedBy?: string;           // Who reviewed mapping
  reviewedDate?: string;         // When reviewed
}
```

## Maintenance

### Quarterly Review Process
1. Analyze new unmapped terms
2. Review low-confidence mappings
3. Consider new topic additions
4. Update synonym lists
5. Deprecate obsolete terms

### Version Control
- Use semantic versioning (MAJOR.MINOR.PATCH)
- MAJOR: Significant restructuring
- MINOR: New topics added
- PATCH: Corrections and synonyms

### Change Log Format
```json
{
  "version": "1.1.0",
  "date": "2025-04-01",
  "changes": [
    {
      "type": "added",
      "description": "Added 5 new Level 3 topics under Medical Sciences"
    }
  ]
}
```

## Integration

### Frontend Usage
```typescript
import { scientificTopics } from './data/taxonomy/scientificTopics.json';
import { TopicHierarchy } from './utils/topicHierarchy';

const hierarchy = new TopicHierarchy(scientificTopics);
const genomicsTopics = hierarchy.getChildren('genomics-omics');
```

### Search Integration
```typescript
// Search includes synonyms
const results = hierarchy.searchTopics('NGS');
// Returns topics with 'NGS' in label or synonyms
```

### Filter Implementation
```typescript
// Get all faculty in a topic and its subtopics
const faculty = getFacultyByTopic('evolutionary-biology', true);
```

## Best Practices

1. **Consistency** - Use existing patterns when adding new topics
2. **Clarity** - Topic labels should be self-explanatory
3. **Coverage** - Ensure all research areas are represented
4. **Balance** - Maintain reasonable depth across categories
5. **Evolution** - Plan for growth and change in scientific fields

## Resources

### External Taxonomies for Reference
- MeSH (Medical Subject Headings)
- Gene Ontology (GO)
- NCBI Taxonomy
- Wikipedia Categories
- Journal Classification Systems

### Contact
For questions or suggestions about the taxonomy:
- Create an issue in the repository
- Email: fourthculture@gmail.com

## Future Enhancements

### Planned Features
- Level 3 & 4 expansion
- External taxonomy mappings
- Multi-language support
- API endpoint for taxonomy
- Machine learning suggestions
- Collaborative editing interface

### Under Consideration
- Topic relationships (beyond hierarchy)
- Temporal aspects (emerging fields)
- Geographic variations
- Interdisciplinary connections
- Impact metrics per topic