import React from 'react';
import type { EnrichedFacultyProfile } from '../types';
import { getTopicById, getTopicPath } from '../models/taxonomyData';

interface TopicDisplayProps {
  profile: EnrichedFacultyProfile;
  variant?: 'card' | 'modal';
  maxItems?: number;
}

const topicLevelColors = {
  1: 'bg-blue-100 text-blue-800 border-blue-200',
  2: 'bg-green-100 text-green-800 border-green-200',
  3: 'bg-purple-100 text-purple-800 border-purple-200',
  4: 'bg-orange-100 text-orange-800 border-orange-200'
};

export const TopicDisplay: React.FC<TopicDisplayProps> = ({ 
  profile, 
  variant = 'card',
  maxItems = 3 
}) => {
  // Check if profile has standardized research areas
  if (!profile.enrichment?.academic?.researchAreas) {
    return null;
  }
  
  const researchAreas = profile.enrichment.academic.researchAreas;
  
  // Handle legacy format (just an array of strings)
  if (Array.isArray(researchAreas)) {
    if (variant === 'card') {
      return null; // Don't show raw areas on cards
    }
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Research Areas</h4>
        <div className="flex flex-wrap gap-2">
          {researchAreas.map((area, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs"
            >
              {area}
            </span>
          ))}
        </div>
      </div>
    );
  }
  
  // Handle new format with standardized topics
  const { primary = [], secondary = [], techniques = [] } = researchAreas.standardized || {};
  const allTopics = [...primary, ...secondary, ...techniques];
  
  if (allTopics.length === 0) {
    return null;
  }
  
  if (variant === 'card') {
    // Card view: show condensed version
    const topicsToShow = allTopics.slice(0, maxItems);
    const remainingCount = allTopics.length - topicsToShow.length;
    
    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex flex-wrap gap-1">
          {topicsToShow.map((topic, index) => {
            const colors = topicLevelColors[topic.level as keyof typeof topicLevelColors] || topicLevelColors[2];
            return (
              <span
                key={`${topic.id}-${index}`}
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${colors}`}
                title={topic.description || topic.label}
              >
                {topic.label}
              </span>
            );
          })}
          {remainingCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
              +{remainingCount} more
            </span>
          )}
        </div>
      </div>
    );
  }
  
  // Modal view: show full details with categories
  return (
    <div className="space-y-4">
      {/* Standardized Topics */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Research Topics</h4>
        
        {primary.length > 0 && (
          <div className="mb-3">
            <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Primary Areas</h5>
            <div className="flex flex-wrap gap-2">
              {primary.map((topic, index) => (
                <TopicBadge key={`primary-${index}`} topic={topic} showPath />
              ))}
            </div>
          </div>
        )}
        
        {secondary.length > 0 && (
          <div className="mb-3">
            <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Secondary Areas</h5>
            <div className="flex flex-wrap gap-2">
              {secondary.map((topic, index) => (
                <TopicBadge key={`secondary-${index}`} topic={topic} showPath />
              ))}
            </div>
          </div>
        )}
        
        {techniques.length > 0 && (
          <div className="mb-3">
            <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Techniques & Methods</h5>
            <div className="flex flex-wrap gap-2">
              {techniques.map((topic, index) => (
                <TopicBadge key={`technique-${index}`} topic={topic} showPath />
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Raw Areas (for reference) */}
      {researchAreas.raw && researchAreas.raw.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Original Research Areas</h4>
          <div className="flex flex-wrap gap-2">
            {researchAreas.raw.map((area, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface TopicBadgeProps {
  topic: any;
  showPath?: boolean;
}

const TopicBadge: React.FC<TopicBadgeProps> = ({ topic, showPath = false }) => {
  const colors = topicLevelColors[topic.level as keyof typeof topicLevelColors] || topicLevelColors[2];
  
  if (showPath) {
    const path = getTopicPath(topic.id);
    const pathLabels = path.slice(0, -1).map(t => t.label).join(' › ');
    
    return (
      <div className="inline-flex items-center">
        {pathLabels && (
          <span className="text-xs text-gray-500 mr-1">{pathLabels} ›</span>
        )}
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colors}`}
          title={topic.description || topic.label}
        >
          {topic.label}
        </span>
      </div>
    );
  }
  
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colors}`}
      title={topic.description || topic.label}
    >
      {topic.label}
    </span>
  );
};