import { useMemo } from 'react';
import type { EnrichedFacultyProfile } from '../types';
import { getAllFaculty } from '../models/facultyData';
import { getTopicById } from '../models/taxonomyData';

export interface TopicUsageInfo {
  topicId: string;
  count: number;
  faculty: string[];
}

export function useTopicFilter() {
  const faculty = useMemo(() => getAllFaculty(), []);
  
  const topicUsage = useMemo(() => {
    const usage = new Map<string, Set<string>>();
    
    faculty.forEach((profile: EnrichedFacultyProfile) => {
      if (profile.enrichment?.academic?.researchAreas) {
        const researchAreas = profile.enrichment.academic.researchAreas;
        
        // Handle both legacy and new formats
        if (!Array.isArray(researchAreas) && researchAreas.standardized) {
          const { primary = [], secondary = [], techniques = [] } = researchAreas.standardized;
          const allTopics = [...primary, ...secondary, ...techniques];
          
          allTopics.forEach(topic => {
            if (!usage.has(topic.id)) {
              usage.set(topic.id, new Set());
            }
            usage.get(topic.id)!.add(profile.faculty.id);
          });
        }
      }
    });
    
    return usage;
  }, [faculty]);
  
  const getTopicCount = (topicId: string): number => {
    return topicUsage.get(topicId)?.size || 0;
  };
  
  const getTopicFaculty = (topicId: string): string[] => {
    return Array.from(topicUsage.get(topicId) || []);
  };
  
  const getTopicInfo = (topicId: string): TopicUsageInfo => {
    return {
      topicId,
      count: getTopicCount(topicId),
      faculty: getTopicFaculty(topicId),
    };
  };
  
  return {
    getTopicCount,
    getTopicFaculty,
    getTopicInfo,
    topicUsage,
  };
}