/**
 * Faculty Data Model
 * Provides typed access to faculty data with standardized research areas
 */

import type { EnrichedFacultyProfile } from '../types';
import { hasStandardizedResearchAreas } from '../types';
import facultyEnrichedData from '../data/facultyEnriched.json';

// Type the imported JSON data
export const facultyData: Record<string, EnrichedFacultyProfile> = facultyEnrichedData as any;

/**
 * Get all faculty profiles as an array
 */
export function getAllFaculty(): EnrichedFacultyProfile[] {
  return Object.entries(facultyData).map(([id, data]: [string, any]) => {
    const nameParts = (data.name || id).split(' ');
    const lastName = nameParts[nameParts.length - 1];
    const firstName = nameParts.slice(0, -1).join(' ');
    
    return {
      faculty: {
        id,
        firstName,
        lastName,
      },
      participations: {},
      statistics: {
        totalYears: 0,
        workshopCount: 0,
        firstYear: 0,
        lastYear: 0,
        primaryWorkshop: '',
      },
      enrichment: data.enrichment,
    };
  });
}

/**
 * Get a single faculty member by ID
 */
export function getFacultyById(id: string): EnrichedFacultyProfile | null {
  const data = facultyData[id] as any;
  if (!data) return null;

  const nameParts = (data.name || id).split(' ');
  const lastName = nameParts[nameParts.length - 1];
  const firstName = nameParts.slice(0, -1).join(' ');

  return {
    faculty: {
      id,
      firstName,
      lastName,
    },
    participations: {},
    statistics: {
      totalYears: 0,
      workshopCount: 0,
      firstYear: 0,
      lastYear: 0,
      primaryWorkshop: '',
    },
    enrichment: data.enrichment,
  };
}

/**
 * Get all unique standardized topics from faculty data
 */
export function getAllStandardizedTopics(): Set<string> {
  const topics = new Set<string>();

  Object.values(facultyData).forEach((faculty) => {
    if (hasStandardizedResearchAreas(faculty.enrichment)) {
      const { primary, secondary, techniques } = faculty.enrichment.academic.researchAreas.standardized;
      
      [...primary, ...secondary, ...techniques].forEach((topic) => {
        topics.add(topic.id);
      });
    }
  });

  return topics;
}

/**
 * Get faculty members by standardized topic ID
 */
export function getFacultyByTopic(topicId: string): EnrichedFacultyProfile[] {
  return getAllFaculty().filter((profile) => {
    if (!hasStandardizedResearchAreas(profile.enrichment)) return false;

    const { primary, secondary, techniques } = profile.enrichment.academic.researchAreas.standardized;
    
    return [...primary, ...secondary, ...techniques].some((topic) => topic.id === topicId);
  });
}

/**
 * Get topic usage statistics
 */
export function getTopicUsageStats(): Map<string, number> {
  const usage = new Map<string, number>();

  Object.values(facultyData).forEach((faculty) => {
    if (hasStandardizedResearchAreas(faculty.enrichment)) {
      const { primary, secondary, techniques } = faculty.enrichment.academic.researchAreas.standardized;
      
      [...primary, ...secondary, ...techniques].forEach((topic) => {
        usage.set(topic.id, (usage.get(topic.id) || 0) + 1);
      });
    }
  });

  return usage;
}

/**
 * Get faculty with unmapped research areas
 */
export function getFacultyWithUnmappedTerms(): EnrichedFacultyProfile[] {
  return getAllFaculty().filter((profile) => {
    if (!profile.enrichment?.academic?.researchAreas) return false;
    
    // If it's legacy format (string array) or has no standardized mapping
    return !hasStandardizedResearchAreas(profile.enrichment);
  });
}

/**
 * Calculate coverage statistics
 */
export function getCoverageStats() {
  const allFaculty = getAllFaculty();
  const withResearchAreas = allFaculty.filter(p => p.enrichment?.academic?.researchAreas);
  const withStandardized = allFaculty.filter(p => hasStandardizedResearchAreas(p.enrichment));
  
  return {
    totalFaculty: allFaculty.length,
    withResearchAreas: withResearchAreas.length,
    withStandardizedTopics: withStandardized.length,
    coveragePercentage: withResearchAreas.length > 0 
      ? Math.round((withStandardized.length / withResearchAreas.length) * 100)
      : 0,
  };
}