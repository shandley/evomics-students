import React, { useState, useEffect, useMemo, useRef } from 'react';
import { searchTopics, getAllTopics } from '../models/taxonomyData';
import { getAllFaculty } from '../models/facultyData';
import type { TopicNode, EnrichedFacultyProfile } from '../types';

interface SearchWithSuggestionsProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface Suggestion {
  type: 'topic' | 'faculty';
  label: string;
  sublabel?: string;
  value: string;
  count?: number;
}

export const SearchWithSuggestions: React.FC<SearchWithSuggestionsProps> = ({
  value,
  onChange,
  placeholder = "Search by name or topic...",
  className = ""
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get topic usage counts
  const topicUsageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const faculty = getAllFaculty();
    
    faculty.forEach((profile: EnrichedFacultyProfile) => {
      if (profile.enrichment?.academic?.researchAreas?.standardized) {
        const { primary = [], secondary = [], techniques = [] } = profile.enrichment.academic.researchAreas.standardized;
        [...primary, ...secondary, ...techniques].forEach(topic => {
          counts.set(topic.id, (counts.get(topic.id) || 0) + 1);
        });
      }
    });
    
    return counts;
  }, []);

  // Generate suggestions based on input
  const suggestions = useMemo(() => {
    if (!value || value.length < 2) return [];
    
    const searchLower = value.toLowerCase();
    const results: Suggestion[] = [];
    
    // Search topics
    const matchingTopics = searchTopics(value);
    matchingTopics.slice(0, 5).forEach(topic => {
      const count = topicUsageCounts.get(topic.id) || 0;
      if (count > 0) {
        results.push({
          type: 'topic',
          label: topic.label,
          sublabel: `Research topic (${count} faculty)`,
          value: topic.label,
          count
        });
      }
    });
    
    // Also check for exact matches in raw research areas
    const faculty = getAllFaculty();
    const rawAreaMatches = new Set<string>();
    
    faculty.forEach((profile: EnrichedFacultyProfile) => {
      if (profile.enrichment?.academic?.researchAreas) {
        const areas = profile.enrichment.academic.researchAreas;
        const rawAreas = Array.isArray(areas) ? areas : areas.raw || [];
        
        rawAreas.forEach(area => {
          if (area.toLowerCase().includes(searchLower) && !rawAreaMatches.has(area)) {
            rawAreaMatches.add(area);
          }
        });
      }
    });
    
    // Add raw area suggestions
    Array.from(rawAreaMatches).slice(0, 3).forEach(area => {
      results.push({
        type: 'topic',
        label: area,
        sublabel: 'Research area',
        value: area
      });
    });
    
    // Sort by count (if available) and limit total suggestions
    return results
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 8);
  }, [value, topicUsageCounts]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          onChange(suggestions[selectedIndex].value);
          setShowSuggestions(false);
          setSelectedIndex(-1);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        }}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.value}-${index}`}
              className={`w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                index === selectedIndex ? 'bg-gray-50' : ''
              }`}
              onClick={() => {
                onChange(suggestion.value);
                setShowSuggestions(false);
                setSelectedIndex(-1);
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{suggestion.label}</div>
                  {suggestion.sublabel && (
                    <div className="text-xs text-gray-500">{suggestion.sublabel}</div>
                  )}
                </div>
                {suggestion.type === 'topic' && (
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};