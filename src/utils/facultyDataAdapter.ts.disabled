/**
 * Adapter to transform enriched faculty data to work with existing components
 */

import type { Faculty, EnrichedFacultyProfile } from '../types';
import { hasStandardizedResearchAreas } from '../types';
import enrichedData from '../data/facultyEnriched.json';

interface EnrichedDataEntry {
  id: string;
  name: string;
  enrichment?: {
    lastUpdated: string;
    confidence: 'high' | 'medium' | 'low';
    professional?: {
      title?: string;
      affiliation?: string;
      department?: string;
      labWebsite?: string;
    };
    academic?: {
      researchAreas?: {
        raw: string[];
        standardized?: {
          primary: any[];
          secondary: any[];
          techniques: any[];
        };
        lastMigrated?: string;
      };
      orcid?: string;
    };
    profile?: {
      shortBio?: string;
      source?: string;
    };
  };
}

/**
 * Transform enriched faculty data to Faculty type
 */
export function transformEnrichedToFaculty(enrichedEntry: EnrichedDataEntry): Faculty {
  const nameParts = enrichedEntry.name.split(' ');
  const lastName = nameParts[nameParts.length - 1];
  const firstName = nameParts.slice(0, -1).join(' ');
  
  return {
    id: enrichedEntry.id,
    firstName,
    lastName,
    currentAffiliation: enrichedEntry.enrichment?.professional?.affiliation,
    website: enrichedEntry.enrichment?.professional?.labWebsite,
    orcid: enrichedEntry.enrichment?.academic?.orcid,
    bio: enrichedEntry.enrichment?.profile?.shortBio,
  };
}

/**
 * Get all faculty from enriched data
 */
export function getEnrichedFacultyList(): Faculty[] {
  return Object.entries(enrichedData).map(([id, data]) => {
    const entry = data as EnrichedDataEntry;
    return transformEnrichedToFaculty({ ...entry, id });
  });
}

/**
 * Get research areas display text
 */
export function getResearchAreasDisplay(enrichment?: EnrichedFacultyProfile['enrichment']): string[] {
  if (!enrichment?.academic?.researchAreas) return [];
  
  // Check if it has standardized structure
  if (hasStandardizedResearchAreas(enrichment)) {
    // For now, return the raw areas until UI is updated to show hierarchical structure
    return enrichment.academic.researchAreas.raw;
  }
  
  // Legacy format - just an array of strings
  return enrichment.academic.researchAreas as unknown as string[];
}

/**
 * Get primary research topics
 */
export function getPrimaryTopics(enrichment?: EnrichedFacultyProfile['enrichment']): string[] {
  if (!hasStandardizedResearchAreas(enrichment)) return [];
  
  return enrichment.academic.researchAreas.standardized.primary.map(topic => topic.label);
}

/**
 * Get all standardized topic labels
 */
export function getAllTopicLabels(enrichment?: EnrichedFacultyProfile['enrichment']): {
  primary: string[];
  secondary: string[];
  techniques: string[];
} {
  if (!hasStandardizedResearchAreas(enrichment)) {
    return { primary: [], secondary: [], techniques: [] };
  }
  
  const { primary, secondary, techniques } = enrichment.academic.researchAreas.standardized;
  
  return {
    primary: primary.map(t => t.label),
    secondary: secondary.map(t => t.label),
    techniques: techniques.map(t => t.label),
  };
}

/**
 * Get topic hierarchy display
 */
export function getTopicHierarchyDisplay(topicId: string, enrichment?: EnrichedFacultyProfile['enrichment']): string {
  if (!hasStandardizedResearchAreas(enrichment)) return '';
  
  const { primary, secondary, techniques } = enrichment.academic.researchAreas.standardized;
  const allTopics = [...primary, ...secondary, ...techniques];
  
  const topic = allTopics.find(t => t.id === topicId);
  if (!topic) return '';
  
  // Build hierarchy string
  const parts: string[] = [topic.label];
  
  if (topic.parentId) {
    const parent = allTopics.find(t => t.id === topic.parentId);
    if (parent) {
      parts.unshift(parent.label);
    }
  }
  
  return parts.join(' → ');
}