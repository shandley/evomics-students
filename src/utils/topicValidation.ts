/**
 * Topic Validation Utilities
 * Validates taxonomy structure and mappings
 */

import type { TaxonomyData, MappingData, TopicNode } from '../types/taxonomy';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: ValidationStats;
}

export interface ValidationError {
  type: 'missing_parent' | 'circular_reference' | 'duplicate_id' | 'invalid_level' | 'missing_required';
  topicId?: string;
  message: string;
}

export interface ValidationWarning {
  type: 'missing_description' | 'no_children' | 'unmapped_term' | 'low_confidence';
  topicId?: string;
  message: string;
}

export interface ValidationStats {
  totalTopics: number;
  totalMappings: number;
  orphanTopics: number;
  leafTopics: number;
  averageChildren: number;
  maxDepth: number;
}

export class TopicValidator {
  /**
   * Validate taxonomy data structure
   */
  static validateTaxonomy(data: TaxonomyData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const allTopics = new Map<string, TopicNode>();
    const childCounts = new Map<string, number>();
    
    // Collect all topics
    Object.entries(data.topics).forEach(([id, topic]) => {
      allTopics.set(id, topic);
    });
    if (data.level2) {
      Object.entries(data.level2).forEach(([id, topic]) => {
        allTopics.set(id, topic);
      });
    }

    // Check for duplicates
    const seenIds = new Set<string>();
    allTopics.forEach((topic, id) => {
      if (seenIds.has(id)) {
        errors.push({
          type: 'duplicate_id',
          topicId: id,
          message: `Duplicate topic ID: ${id}`
        });
      }
      seenIds.add(id);
    });

    // Validate each topic
    allTopics.forEach((topic, id) => {
      // Check required fields
      if (!topic.id || !topic.label || !topic.level) {
        errors.push({
          type: 'missing_required',
          topicId: id,
          message: `Topic ${id} missing required fields`
        });
      }

      // Check level validity
      if (topic.level < 1 || topic.level > 4) {
        errors.push({
          type: 'invalid_level',
          topicId: id,
          message: `Topic ${id} has invalid level: ${topic.level}`
        });
      }

      // Check parent exists
      if (topic.parentId && !allTopics.has(topic.parentId)) {
        errors.push({
          type: 'missing_parent',
          topicId: id,
          message: `Topic ${id} references non-existent parent: ${topic.parentId}`
        });
      }

      // Check for circular references
      if (topic.parentId) {
        const visited = new Set<string>();
        let current = topic;
        while (current.parentId) {
          if (visited.has(current.id)) {
            errors.push({
              type: 'circular_reference',
              topicId: id,
              message: `Circular reference detected for topic ${id}`
            });
            break;
          }
          visited.add(current.id);
          current = allTopics.get(current.parentId)!;
          if (!current) break;
        }
      }

      // Warnings
      if (!topic.description) {
        warnings.push({
          type: 'missing_description',
          topicId: id,
          message: `Topic ${id} has no description`
        });
      }

      // Count children
      if (topic.children) {
        childCounts.set(id, topic.children.length);
      } else {
        childCounts.set(id, 0);
      }
    });

    // Calculate stats
    const orphanTopics = Array.from(allTopics.values()).filter(t => 
      t.level > 1 && !t.parentId
    ).length;

    const leafTopics = Array.from(childCounts.values()).filter(c => c === 0).length;
    
    const totalChildren = Array.from(childCounts.values()).reduce((sum, c) => sum + c, 0);
    const nodesWithChildren = Array.from(childCounts.values()).filter(c => c > 0).length;
    const averageChildren = nodesWithChildren > 0 ? totalChildren / nodesWithChildren : 0;

    // Calculate max depth
    let maxDepth = 0;
    allTopics.forEach(topic => {
      if (topic.level > maxDepth) {
        maxDepth = topic.level;
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalTopics: allTopics.size,
        totalMappings: 0,
        orphanTopics,
        leafTopics,
        averageChildren,
        maxDepth
      }
    };
  }

  /**
   * Validate mapping data
   */
  static validateMappings(
    mappingData: MappingData, 
    taxonomyData: TaxonomyData
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Get all valid topic IDs
    const validTopicIds = new Set<string>();
    Object.keys(taxonomyData.topics).forEach(id => validTopicIds.add(id));
    if (taxonomyData.level2) {
      Object.keys(taxonomyData.level2).forEach(id => validTopicIds.add(id));
    }

    // Validate each mapping
    Object.entries(mappingData.mappings).forEach(([term, mapping]) => {
      // Check if mapped topic exists
      if (!validTopicIds.has(mapping.standardizedId)) {
        errors.push({
          type: 'missing_parent',
          message: `Mapping for "${term}" references non-existent topic: ${mapping.standardizedId}`
        });
      }

      // Warn about low confidence mappings
      if (mapping.confidence === 'low') {
        warnings.push({
          type: 'low_confidence',
          message: `Low confidence mapping for term: "${term}"`
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalTopics: validTopicIds.size,
        totalMappings: Object.keys(mappingData.mappings).length,
        orphanTopics: 0,
        leafTopics: 0,
        averageChildren: 0,
        maxDepth: 0
      }
    };
  }

  /**
   * Find unmapped terms in faculty data
   */
  static findUnmappedTerms(
    facultyTerms: string[],
    mappingData: MappingData
  ): string[] {
    const mappedTerms = new Set(
      Object.keys(mappingData.mappings).map(t => t.toLowerCase())
    );
    
    const unmapped: string[] = [];
    const seen = new Set<string>();

    facultyTerms.forEach(term => {
      const normalized = term.toLowerCase().trim();
      if (!mappedTerms.has(normalized) && !seen.has(normalized)) {
        unmapped.push(term);
        seen.add(normalized);
      }
    });

    return unmapped.sort();
  }

  /**
   * Generate validation report
   */
  static generateReport(result: ValidationResult): string {
    const lines: string[] = [
      'TAXONOMY VALIDATION REPORT',
      '=' .repeat(50),
      '',
      `Status: ${result.valid ? 'VALID ✅' : 'INVALID ❌'}`,
      '',
      'STATISTICS',
      '-'.repeat(30),
      `Total Topics: ${result.stats.totalTopics}`,
      `Total Mappings: ${result.stats.totalMappings}`,
      `Orphan Topics: ${result.stats.orphanTopics}`,
      `Leaf Topics: ${result.stats.leafTopics}`,
      `Average Children: ${result.stats.averageChildren.toFixed(2)}`,
      `Max Depth: ${result.stats.maxDepth}`,
      ''
    ];

    if (result.errors.length > 0) {
      lines.push('ERRORS', '-'.repeat(30));
      result.errors.forEach(error => {
        lines.push(`❌ ${error.message}`);
      });
      lines.push('');
    }

    if (result.warnings.length > 0) {
      lines.push('WARNINGS', '-'.repeat(30));
      result.warnings.forEach(warning => {
        lines.push(`⚠️  ${warning.message}`);
      });
      lines.push('');
    }

    return lines.join('\n');
  }
}