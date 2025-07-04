/**
 * Scientific Topics Taxonomy Type Definitions
 */

export interface TopicNode {
  id: string;
  label: string;
  level: 1 | 2 | 3 | 4;
  parentId?: string;
  description?: string;
  synonyms?: string[];
  children?: string[];
  icon?: string;
  metadata?: {
    addedDate: string;
    addedBy?: string;
    lastModified?: string;
    usage?: number;
  };
}

export interface TopicMapping {
  standardizedId: string;
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
  reviewedBy?: string;
  reviewedDate?: string;
}

export interface TaxonomyData {
  metadata: {
    version: string;
    lastUpdated: string;
    totalTopics: number;
    levels: number;
  };
  topics: Record<string, TopicNode>;
  level2: Record<string, TopicNode>;
}

export interface MappingData {
  metadata: {
    version: string;
    lastUpdated: string;
    totalMappings: number;
    confidence: {
      high: number;
      medium: number;
      low: number;
    };
  };
  mappings: Record<string, TopicMapping>;
}

export interface StandardizedResearchAreas {
  raw: string[];
  standardized: {
    primary: TopicNode[];
    secondary: TopicNode[];
    techniques: TopicNode[];
  };
  lastUpdated?: string;
  lastMigrated?: string;
}

export interface TopicHierarchyNode extends Omit<TopicNode, 'children'> {
  children: TopicHierarchyNode[];
  parent?: TopicHierarchyNode;
  path: string[];
}

export interface TopicSearchResult {
  topic: TopicNode;
  matchType: 'exact' | 'synonym' | 'partial';
  relevance: number;
}

export interface TopicFilter {
  selectedTopics: string[];
  includeChildren: boolean;
  level?: 1 | 2 | 3 | 4;
}

export interface TopicStats {
  totalTopics: number;
  byLevel: Record<number, number>;
  byCategory: Record<string, number>;
  unmappedTerms: number;
  coveragePercentage: number;
}