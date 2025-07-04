import React from 'react';
import type { EnrichedFacultyProfile } from '../types';

interface SearchHighlightProps {
  profile: EnrichedFacultyProfile;
  searchTerm: string;
}

export const SearchHighlight: React.FC<SearchHighlightProps> = ({ profile, searchTerm }) => {
  if (!searchTerm || searchTerm.length < 2) return null;
  
  const searchLower = searchTerm.toLowerCase();
  const fullName = `${profile.faculty.firstName} ${profile.faculty.lastName}`.toLowerCase();
  
  // Check if it's a name match
  if (fullName.includes(searchLower)) {
    return null; // Don't show highlight for name matches
  }
  
  // Check for topic matches
  const matchedTopics: string[] = [];
  
  if (profile.enrichment?.academic?.researchAreas) {
    const researchAreas = profile.enrichment.academic.researchAreas;
    
    // Check raw areas
    if (Array.isArray(researchAreas)) {
      researchAreas.forEach(area => {
        if (area.toLowerCase().includes(searchLower)) {
          matchedTopics.push(area);
        }
      });
    } else {
      // Check raw areas in new format
      if (researchAreas.raw) {
        researchAreas.raw.forEach(area => {
          if (area.toLowerCase().includes(searchLower)) {
            matchedTopics.push(area);
          }
        });
      }
      
      // Check standardized topics
      if (researchAreas.standardized) {
        const { primary = [], secondary = [], techniques = [] } = researchAreas.standardized;
        [...primary, ...secondary, ...techniques].forEach(topic => {
          if (topic.label.toLowerCase().includes(searchLower)) {
            matchedTopics.push(topic.label);
          } else if (topic.synonyms?.some(syn => syn.toLowerCase().includes(searchLower))) {
            matchedTopics.push(`${topic.label} (synonym match)`);
          }
        });
      }
    }
  }
  
  if (matchedTopics.length === 0) return null;
  
  return (
    <div className="mt-2 pt-2 border-t border-gray-100">
      <div className="flex items-center gap-1 text-xs text-gray-600">
        <svg className="w-3 h-3 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>Matched: {matchedTopics.slice(0, 2).join(', ')}</span>
        {matchedTopics.length > 2 && <span>+{matchedTopics.length - 2} more</span>}
      </div>
    </div>
  );
};