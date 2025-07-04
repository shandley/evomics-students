/**
 * Taxonomy Data Model
 * Provides typed access to the scientific topics taxonomy
 */

import type { TaxonomyData, TopicNode, MappingData, TopicHierarchyNode } from '../types/taxonomy';
import taxonomyJson from '../data/taxonomy/scientificTopics.json';
import mappingsJson from '../data/taxonomy/termMappings.json';

// Type the imported JSON data
export const taxonomy: TaxonomyData = taxonomyJson as TaxonomyData;
export const mappings: MappingData = mappingsJson as MappingData;

/**
 * Get all topics as a flat array
 */
export function getAllTopics(): TopicNode[] {
  const allTopics: TopicNode[] = [];
  
  // Add all topics from main topics object
  Object.values(taxonomy.topics).forEach(topic => {
    allTopics.push(topic);
  });
  
  // Add all Level 2 topics
  if (taxonomy.level2) {
    Object.values(taxonomy.level2).forEach(topic => {
      allTopics.push(topic);
    });
  }
  
  // Add all Level 3 topics
  if ((taxonomy as any).level3) {
    Object.values((taxonomy as any).level3).forEach((topic: any) => {
      allTopics.push(topic as TopicNode);
    });
  }
  
  return allTopics;
}

/**
 * Get a topic by ID from any level
 */
export function getTopicById(id: string): TopicNode | null {
  // Check main topics
  if (taxonomy.topics[id]) return taxonomy.topics[id];
  
  // Check level 2
  if (taxonomy.level2?.[id]) return taxonomy.level2[id];
  
  // Check level 3
  if ((taxonomy as any).level3?.[id]) return (taxonomy as any).level3[id];
  
  return null;
}

/**
 * Get topics by level
 */
export function getTopicsByLevel(level: 1 | 2 | 3 | 4): TopicNode[] {
  return getAllTopics().filter(topic => topic.level === level);
}

/**
 * Get child topics of a parent
 */
export function getChildTopics(parentId: string): TopicNode[] {
  return getAllTopics().filter(topic => topic.parentId === parentId);
}

/**
 * Build a hierarchical tree structure
 */
export function buildTopicHierarchy(): TopicHierarchyNode[] {
  const topicMap = new Map<string, TopicHierarchyNode>();
  const roots: TopicHierarchyNode[] = [];
  
  // First pass: Create all nodes
  getAllTopics().forEach(topic => {
    topicMap.set(topic.id, {
      ...topic,
      children: [],
      path: [],
    });
  });
  
  // Second pass: Build relationships
  topicMap.forEach(node => {
    if (node.parentId && topicMap.has(node.parentId)) {
      const parent = topicMap.get(node.parentId)!;
      parent.children.push(node);
      node.parent = parent;
      
      // Build path
      let current = node;
      const path = [current.id];
      while (current.parent) {
        current = current.parent;
        path.unshift(current.id);
      }
      node.path = path;
    } else if (node.level === 1) {
      roots.push(node);
      node.path = [node.id];
    }
  });
  
  return roots;
}

/**
 * Get the full hierarchical path for a topic
 */
export function getTopicPath(topicId: string): TopicNode[] {
  const topic = getTopicById(topicId);
  if (!topic) return [];
  
  const path: TopicNode[] = [topic];
  let current = topic;
  
  while (current.parentId) {
    const parent = getTopicById(current.parentId);
    if (!parent) break;
    path.unshift(parent);
    current = parent;
  }
  
  return path;
}

/**
 * Search topics by label or synonym
 */
export function searchTopics(query: string): TopicNode[] {
  const lowerQuery = query.toLowerCase();
  
  return getAllTopics().filter(topic => {
    // Check label
    if (topic.label.toLowerCase().includes(lowerQuery)) return true;
    
    // Check synonyms
    if (topic.synonyms?.some(syn => syn.toLowerCase().includes(lowerQuery))) return true;
    
    // Check description
    if (topic.description?.toLowerCase().includes(lowerQuery)) return true;
    
    return false;
  });
}

/**
 * Get the standardized topic ID for a raw term
 */
export function getStandardizedTopicId(rawTerm: string): string | null {
  const mapping = mappings.mappings[rawTerm];
  return mapping?.standardizedId || null;
}

/**
 * Get topics organized by parent category
 */
export function getTopicsByCategory(): Map<string, TopicNode[]> {
  const categories = new Map<string, TopicNode[]>();
  
  // Get all Level 1 topics (categories)
  const level1Topics = getTopicsByLevel(1);
  
  level1Topics.forEach(category => {
    const children = getAllTopics().filter(topic => 
      topic.parentId === category.id || 
      getTopicPath(topic.id).some(p => p.id === category.id)
    );
    categories.set(category.id, children);
  });
  
  return categories;
}

/**
 * Get statistics about the taxonomy
 */
export function getTaxonomyStats() {
  const allTopics = getAllTopics();
  const byLevel = new Map<number, number>();
  
  allTopics.forEach(topic => {
    byLevel.set(topic.level, (byLevel.get(topic.level) || 0) + 1);
  });
  
  return {
    totalTopics: allTopics.length,
    byLevel: Object.fromEntries(byLevel),
    totalMappings: Object.keys(mappings.mappings).length,
    mappingConfidence: mappings.metadata.confidence,
  };
}