import type { FacultyProfile, Filters, SortOption, EnrichedFacultyProfile, hasStandardizedResearchAreas } from '../types';
import { getTopicById, getAllTopics } from '../models/taxonomyData';

export function filterFacultyProfiles(
  profiles: FacultyProfile[],
  filters: Filters
): FacultyProfile[] {
  return profiles.filter(profile => {
    // Search filter - includes name and topic search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const fullName = `${profile.faculty.firstName} ${profile.faculty.lastName}`.toLowerCase();
      
      // Check name match
      const nameMatch = fullName.includes(searchLower);
      
      // Check topic match (for enriched profiles)
      let topicMatch = false;
      const enrichedProfile = profile as EnrichedFacultyProfile;
      
      if (enrichedProfile.enrichment?.academic?.researchAreas) {
        const researchAreas = enrichedProfile.enrichment.academic.researchAreas;
        
        // Check raw research areas
        if (Array.isArray(researchAreas)) {
          topicMatch = researchAreas.some(area => 
            area.toLowerCase().includes(searchLower)
          );
        } else {
          // Check raw areas in new format
          if (researchAreas.raw) {
            topicMatch = researchAreas.raw.some(area => 
              area.toLowerCase().includes(searchLower)
            );
          }
          
          // Check standardized topics
          if (researchAreas.standardized) {
            const { primary = [], secondary = [], techniques = [] } = researchAreas.standardized;
            const allTopics = [...primary, ...secondary, ...techniques];
            
            topicMatch = topicMatch || allTopics.some(topic => {
              // Check topic label
              if (topic.label.toLowerCase().includes(searchLower)) return true;
              
              // Check topic synonyms
              if (topic.synonyms) {
                return topic.synonyms.some(syn => 
                  syn.toLowerCase().includes(searchLower)
                );
              }
              
              // Check topic description
              if (topic.description) {
                return topic.description.toLowerCase().includes(searchLower);
              }
              
              return false;
            });
          }
        }
      }
      
      // Return true if either name or topic matches
      if (!nameMatch && !topicMatch) {
        return false;
      }
    }

    // Workshop filter
    if (filters.workshops.length > 0) {
      const hasWorkshop = filters.workshops.some(workshopId => 
        profile.participations[workshopId] && profile.participations[workshopId].length > 0
      );
      if (!hasWorkshop) {
        return false;
      }
    }

    // Year filter - show faculty who taught in the selected year
    if (filters.year !== null) {
      const facultyYears = Object.values(profile.participations).flat();
      if (!facultyYears.includes(filters.year)) {
        return false;
      }
    }

    // Topic filter
    if (filters.topics && filters.topics.length > 0) {
      const enrichedProfile = profile as EnrichedFacultyProfile;
      
      // Check if the profile has standardized research areas
      if (!enrichedProfile.enrichment?.academic?.researchAreas) {
        return false;
      }
      
      const researchAreas = enrichedProfile.enrichment.academic.researchAreas;
      
      // Handle both legacy (array) and new (object with standardized) formats
      if (Array.isArray(researchAreas)) {
        // Legacy format - no standardized topics
        return false;
      }
      
      const standardizedTopics = researchAreas.standardized;
      if (!standardizedTopics) {
        return false;
      }
      
      // Collect all topic IDs from the faculty's research areas
      const { primary = [], secondary = [], techniques = [] } = standardizedTopics;
      const facultyTopicIds = new Set<string>([
        ...primary.map(t => t.id),
        ...secondary.map(t => t.id),
        ...techniques.map(t => t.id)
      ]);
      
      if (facultyTopicIds.size === 0) {
        return false;
      }

      // Build set of relevant topics based on includeChildTopics setting
      const relevantTopics = new Set<string>();
      
      if (filters.includeChildTopics !== false) {
        // Include selected topics and all their descendants
        filters.topics.forEach(topicId => {
          relevantTopics.add(topicId);
          // Add all descendant topics
          getAllTopics().forEach(topic => {
            if (topic.parentId === topicId || hasAncestor(topic, topicId)) {
              relevantTopics.add(topic.id);
            }
          });
        });
      } else {
        // Only include exact matches
        filters.topics.forEach(topicId => relevantTopics.add(topicId));
      }

      // Check if any of the faculty's topics match the filter
      const hasMatchingTopic = Array.from(facultyTopicIds).some(topicId => 
        relevantTopics.has(topicId)
      );
      
      if (!hasMatchingTopic) {
        return false;
      }
    }

    return true;
  });
}

// Helper function to check if a topic has a specific ancestor
function hasAncestor(topic: any, ancestorId: string): boolean {
  let current = topic;
  while (current.parentId) {
    if (current.parentId === ancestorId) return true;
    current = getTopicById(current.parentId);
    if (!current) break;
  }
  return false;
}

export function sortFacultyProfiles(
  profiles: FacultyProfile[],
  sortOption: SortOption
): FacultyProfile[] {
  const sorted = [...profiles];
  
  switch (sortOption) {
    case 'lastName':
      return sorted.sort((a, b) => 
        a.faculty.lastName.localeCompare(b.faculty.lastName) ||
        a.faculty.firstName.localeCompare(b.faculty.firstName)
      );
    
    case 'firstName':
      return sorted.sort((a, b) => 
        a.faculty.firstName.localeCompare(b.faculty.firstName) ||
        a.faculty.lastName.localeCompare(b.faculty.lastName)
      );
    
    case 'totalYears':
    case 'participationCount':
      return sorted.sort((a, b) => 
        b.statistics.totalYears - a.statistics.totalYears ||
        a.faculty.lastName.localeCompare(b.faculty.lastName)
      );
    
    case 'recentYear':
      return sorted.sort((a, b) => 
        b.statistics.lastYear - a.statistics.lastYear ||
        a.faculty.lastName.localeCompare(b.faculty.lastName)
      );
    
    case 'firstYear':
      return sorted.sort((a, b) => 
        a.statistics.firstYear - b.statistics.firstYear ||
        a.faculty.lastName.localeCompare(b.faculty.lastName)
      );
    
    default:
      return sorted;
  }
}