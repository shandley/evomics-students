/**
 * Topic Hierarchy Utilities
 * Provides functions for working with the scientific topics taxonomy
 */

import type { 
  TopicNode, 
  TopicHierarchyNode, 
  TaxonomyData, 
  MappingData,
  TopicSearchResult,
  TopicMapping
} from '../types/taxonomy';

interface TreeNode {
  id: string;
  label: string;
  level: number;
  description?: string;
  children: TreeNode[];
}

export class TopicHierarchy {
  private topics: Map<string, TopicNode>;
  private mappings: Map<string, TopicMapping>;
  private hierarchy: Map<string, TopicHierarchyNode>;
  private rootNodes: TopicHierarchyNode[];

  constructor(taxonomyData: TaxonomyData, mappingData?: MappingData) {
    this.topics = new Map();
    this.mappings = new Map();
    this.hierarchy = new Map();
    this.rootNodes = [];

    // Initialize topics
    this.initializeTopics(taxonomyData);
    
    // Initialize mappings if provided
    if (mappingData) {
      this.initializeMappings(mappingData);
    }

    // Build hierarchy
    this.buildHierarchy();
  }

  private initializeTopics(data: TaxonomyData): void {
    // Add Level 1 topics
    Object.entries(data.topics).forEach(([id, topic]) => {
      this.topics.set(id, topic);
    });

    // Add Level 2 topics
    if (data.level2) {
      Object.entries(data.level2).forEach(([id, topic]) => {
        this.topics.set(id, topic);
      });
    }

    // Add Level 3 topics
    if ((data as any).level3) {
      Object.entries((data as any).level3).forEach(([id, topic]) => {
        this.topics.set(id, topic as TopicNode);
      });
    }
  }

  private initializeMappings(data: MappingData): void {
    Object.entries(data.mappings).forEach(([term, mapping]) => {
      this.mappings.set(term.toLowerCase(), mapping);
    });
  }

  private buildHierarchy(): void {
    // Create hierarchy nodes
    this.topics.forEach((topic, id) => {
      const node: TopicHierarchyNode = {
        ...topic,
        children: [],
        path: []
      };
      this.hierarchy.set(id, node);
    });

    // Link parents and children
    this.hierarchy.forEach((node, id) => {
      if (node.parentId) {
        const parent = this.hierarchy.get(node.parentId);
        if (parent) {
          parent.children.push(node);
          node.parent = parent;
          node.path = [...parent.path, parent.id];
        }
      } else {
        // Root node
        node.path = [];
        this.rootNodes.push(node);
      }
    });

    // Sort children alphabetically
    this.hierarchy.forEach(node => {
      node.children.sort((a, b) => a.label.localeCompare(b.label));
    });
    this.rootNodes.sort((a, b) => a.label.localeCompare(b.label));
  }

  /**
   * Get a topic by ID
   */
  getTopic(id: string): TopicNode | undefined {
    return this.topics.get(id);
  }

  /**
   * Get hierarchy node by ID
   */
  getHierarchyNode(id: string): TopicHierarchyNode | undefined {
    return this.hierarchy.get(id);
  }

  /**
   * Get all root nodes (Level 1 topics)
   */
  getRootNodes(): TopicHierarchyNode[] {
    return this.rootNodes;
  }

  /**
   * Get children of a topic
   */
  getChildren(topicId: string): TopicHierarchyNode[] {
    const node = this.hierarchy.get(topicId);
    return node ? node.children : [];
  }

  /**
   * Get all descendants of a topic (recursive)
   */
  getDescendants(topicId: string): TopicHierarchyNode[] {
    const descendants: TopicHierarchyNode[] = [];
    const node = this.hierarchy.get(topicId);
    
    if (node) {
      const addDescendants = (n: TopicHierarchyNode) => {
        n.children.forEach(child => {
          descendants.push(child);
          addDescendants(child);
        });
      };
      addDescendants(node);
    }
    
    return descendants;
  }

  /**
   * Get the full path from root to a topic
   */
  getPath(topicId: string): TopicHierarchyNode[] {
    const node = this.hierarchy.get(topicId);
    if (!node) return [];
    
    const path: TopicHierarchyNode[] = [];
    let current: TopicHierarchyNode | undefined = node;
    
    while (current) {
      path.unshift(current);
      current = current.parent;
    }
    
    return path;
  }

  /**
   * Search for topics by query
   */
  searchTopics(query: string): TopicSearchResult[] {
    const results: TopicSearchResult[] = [];
    const lowerQuery = query.toLowerCase();
    
    this.topics.forEach((topic, id) => {
      // Exact match on label
      if (topic.label.toLowerCase() === lowerQuery) {
        results.push({
          topic,
          matchType: 'exact',
          relevance: 1.0
        });
        return;
      }
      
      // Synonym match
      if (topic.synonyms?.some(syn => syn.toLowerCase() === lowerQuery)) {
        results.push({
          topic,
          matchType: 'synonym',
          relevance: 0.9
        });
        return;
      }
      
      // Partial match on label
      if (topic.label.toLowerCase().includes(lowerQuery)) {
        results.push({
          topic,
          matchType: 'partial',
          relevance: 0.7
        });
        return;
      }
      
      // Partial match on synonyms
      if (topic.synonyms?.some(syn => syn.toLowerCase().includes(lowerQuery))) {
        results.push({
          topic,
          matchType: 'partial',
          relevance: 0.5
        });
      }
    });
    
    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);
    
    return results;
  }

  /**
   * Map a raw term to standardized topic
   */
  mapTerm(rawTerm: string): TopicMapping | undefined {
    return this.mappings.get(rawTerm.toLowerCase());
  }

  /**
   * Get topics by level
   */
  getTopicsByLevel(level: 1 | 2 | 3 | 4): TopicNode[] {
    const topics: TopicNode[] = [];
    this.topics.forEach(topic => {
      if (topic.level === level) {
        topics.push(topic);
      }
    });
    return topics.sort((a, b) => a.label.localeCompare(b.label));
  }

  /**
   * Get topics by parent
   */
  getTopicsByParent(parentId: string): TopicNode[] {
    const topics: TopicNode[] = [];
    this.topics.forEach(topic => {
      if (topic.parentId === parentId) {
        topics.push(topic);
      }
    });
    return topics.sort((a, b) => a.label.localeCompare(b.label));
  }

  /**
   * Check if one topic is ancestor of another
   */
  isAncestor(ancestorId: string, descendantId: string): boolean {
    const node = this.hierarchy.get(descendantId);
    if (!node) return false;
    
    let current = node.parent;
    while (current) {
      if (current.id === ancestorId) return true;
      current = current.parent;
    }
    
    return false;
  }

  /**
   * Get statistics about the taxonomy
   */
  getStats(): {
    totalTopics: number;
    byLevel: Record<number, number>;
    byCategory: Record<string, number>;
  } {
    const byLevel: Record<number, number> = {};
    const byCategory: Record<string, number> = {};
    
    this.topics.forEach(topic => {
      // Count by level
      byLevel[topic.level] = (byLevel[topic.level] || 0) + 1;
      
      // Count by top-level category
      if (topic.level === 1) {
        byCategory[topic.id] = this.getDescendants(topic.id).length + 1;
      }
    });
    
    return {
      totalTopics: this.topics.size,
      byLevel,
      byCategory
    };
  }

  /**
   * Export hierarchy as tree structure
   */
  exportTree(): TreeNode[] {
    const buildTree = (nodes: TopicHierarchyNode[]): TreeNode[] => {
      return nodes.map(node => ({
        id: node.id,
        label: node.label,
        level: node.level,
        description: node.description,
        children: buildTree(node.children)
      }));
    };
    
    return buildTree(this.rootNodes);
  }

  /**
   * Get all unique terms from mappings
   */
  getMappedTerms(): string[] {
    return Array.from(this.mappings.keys()).sort();
  }

  /**
   * Standardize a list of research areas
   */
  standardizeResearchAreas(rawTerms: string[]): {
    primary: TopicNode[];
    secondary: TopicNode[];
    techniques: TopicNode[];
    unmapped: string[];
  } {
    const primary: TopicNode[] = [];
    const secondary: TopicNode[] = [];
    const techniques: TopicNode[] = [];
    const unmapped: string[] = [];
    const seen = new Set<string>();

    rawTerms.forEach(term => {
      const mapping = this.mapTerm(term);
      
      if (mapping) {
        const topic = this.getTopic(mapping.standardizedId);
        if (topic && !seen.has(topic.id)) {
          seen.add(topic.id);
          
          // Categorize by level and type
          if (topic.level === 1 || topic.level === 2) {
            if (topic.parentId === 'technology-methods') {
              techniques.push(topic);
            } else {
              primary.push(topic);
            }
          } else if (topic.level === 3 || topic.level === 4) {
            secondary.push(topic);
          }
        }
      } else {
        unmapped.push(term);
      }
    });

    return { primary, secondary, techniques, unmapped };
  }
}