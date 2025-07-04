import React, { useState, useMemo } from 'react';
import type { EnrichedFacultyProfile } from '../types';
import taxonomyData from '../data/taxonomy/scientificTopics.json';

interface TopicTaxonomyViewerProps {
  faculty: EnrichedFacultyProfile[];
  onTopicClick?: (topicId: string) => void;
}

interface TopicStats {
  facultyCount: number;
  primaryCount: number;
  secondaryCount: number;
  techniqueCount: number;
}

interface TopicNode {
  id: string;
  label: string;
  level: number;
  description: string;
  icon?: string;
  children: string[];
  parentId?: string;
  stats?: TopicStats;
}

// Merge all topic levels into a single flat structure
const getAllTopics = () => {
  const allTopics: Record<string, any> = {};
  
  // Add level 1 topics
  if (taxonomyData.topics) {
    Object.assign(allTopics, taxonomyData.topics);
  }
  
  // Add level 2 topics
  if ((taxonomyData as any).level2) {
    Object.assign(allTopics, (taxonomyData as any).level2);
  }
  
  // Add level 3 topics
  if ((taxonomyData as any).level3) {
    Object.assign(allTopics, (taxonomyData as any).level3);
  }
  
  return allTopics;
};

const topics = getAllTopics();

export const TopicTaxonomyViewer: React.FC<TopicTaxonomyViewerProps> = ({ 
  faculty,
  onTopicClick 
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  
  // Calculate topic statistics
  const topicStats = useMemo(() => {
    const stats: Record<string, TopicStats> = {};
    
    // Initialize all topics with zero counts
    Object.keys(topics).forEach(topicId => {
      stats[topicId] = {
        facultyCount: 0,
        primaryCount: 0,
        secondaryCount: 0,
        techniqueCount: 0
      };
    });
    
    // Count faculty per topic
    faculty.forEach(profile => {
      const researchAreas = profile.enrichment?.academic?.researchAreas?.standardized;
      if (!researchAreas) return;
      
      const facultyTopics = new Set<string>();
      const primaryTopics = new Set<string>();
      const secondaryTopics = new Set<string>();
      const techniqueTopics = new Set<string>();
      
      // Helper function to add topic and all its parents
      const addTopicAndParents = (
        topicId: string, 
        targetSet: Set<string>,
        countType: 'primary' | 'secondary' | 'technique'
      ) => {
        let currentId: string | undefined = topicId;
        while (currentId && topics[currentId]) {
          targetSet.add(currentId);
          facultyTopics.add(currentId);
          
          // Update specific count
          if (countType === 'primary') {
            stats[currentId].primaryCount++;
          } else if (countType === 'secondary') {
            stats[currentId].secondaryCount++;
          } else {
            stats[currentId].techniqueCount++;
          }
          
          // Move to parent
          const topicData = topics[currentId] as TopicNode;
          currentId = topicData.parentId;
        }
      };
      
      // Process primary topics
      researchAreas.primary?.forEach(topic => {
        if (stats[topic.id]) {
          addTopicAndParents(topic.id, primaryTopics, 'primary');
        }
      });
      
      // Process secondary topics
      researchAreas.secondary?.forEach(topic => {
        if (stats[topic.id]) {
          addTopicAndParents(topic.id, secondaryTopics, 'secondary');
        }
      });
      
      // Process technique topics
      researchAreas.techniques?.forEach(topic => {
        if (stats[topic.id]) {
          addTopicAndParents(topic.id, techniqueTopics, 'technique');
        }
      });
      
      // Update faculty count for each unique topic this faculty is associated with
      facultyTopics.forEach(topicId => {
        stats[topicId].facultyCount++;
      });
    });
    
    return stats;
  }, [faculty]);
  
  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };
  
  // Handle topic selection
  const handleTopicClick = (topicId: string) => {
    setSelectedTopic(topicId);
    onTopicClick?.(topicId);
  };
  
  // Get color based on faculty count
  const getCountColor = (count: number) => {
    if (count === 0) return 'text-gray-400';
    if (count < 5) return 'text-blue-600';
    if (count < 10) return 'text-green-600';
    if (count < 20) return 'text-amber-600';
    return 'text-red-600';
  };
  
  // Render a topic node
  const renderNode = (topicId: string, depth: number = 0) => {
    const topic = topics[topicId] as TopicNode;
    if (!topic) return null;
    
    const stats = topicStats[topicId];
    const hasChildren = topic.children && topic.children.length > 0;
    const isExpanded = expandedNodes.has(topicId);
    const isSelected = selectedTopic === topicId;
    
    return (
      <div key={topicId} className={`${depth > 0 ? 'ml-6' : ''}`}>
        <div
          className={`
            flex items-center justify-between p-3 rounded-lg cursor-pointer
            transition-all duration-200 group
            ${isSelected 
              ? 'bg-primary-100 border-2 border-primary-500' 
              : 'hover:bg-gray-50 border-2 border-transparent'
            }
          `}
          onClick={() => handleTopicClick(topicId)}
        >
          <div className="flex items-center gap-3 flex-1">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(topicId);
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <svg 
                  className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            
            <div className="flex items-center gap-2">
              {topic.icon && <span className="text-2xl">{topic.icon}</span>}
              <div>
                <h4 className="font-semibold text-gray-900">{topic.label}</h4>
                <p className="text-sm text-gray-600">{topic.description}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Faculty count */}
            <div className={`text-right ${getCountColor(stats.facultyCount)}`}>
              <div className="text-2xl font-bold">{stats.facultyCount}</div>
              <div className="text-xs text-gray-500">faculty</div>
            </div>
            
            {/* Breakdown badges */}
            <div className="flex gap-1">
              {stats.primaryCount > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                  {stats.primaryCount}P
                </span>
              )}
              {stats.secondaryCount > 0 && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                  {stats.secondaryCount}S
                </span>
              )}
              {stats.techniqueCount > 0 && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                  {stats.techniqueCount}T
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {topic.children.map(childId => renderNode(childId, depth + 1))}
          </div>
        )}
      </div>
    );
  };
  
  // Get root topics (level 1)
  const rootTopics = Object.values(topics)
    .filter((topic: any) => topic.level === 1)
    .map((topic: any) => topic.id);
  
  // Calculate total statistics
  const totalStats = useMemo(() => {
    const facultyWithTopics = faculty.filter(f => 
      f.enrichment?.academic?.researchAreas?.standardized
    ).length;
    
    const uniqueTopicsUsed = new Set<string>();
    faculty.forEach(profile => {
      const areas = profile.enrichment?.academic?.researchAreas?.standardized;
      if (!areas) return;
      
      areas.primary?.forEach(t => uniqueTopicsUsed.add(t.id));
      areas.secondary?.forEach(t => uniqueTopicsUsed.add(t.id));
      areas.techniques?.forEach(t => uniqueTopicsUsed.add(t.id));
    });
    
    return {
      facultyWithTopics,
      topicsUsed: uniqueTopicsUsed.size,
      totalTopics: Object.keys(topics).length
    };
  }, [faculty]);
  
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Research Topic Taxonomy</h2>
        <p className="text-gray-600">
          Explore the hierarchical organization of research topics across faculty members
        </p>
        <div className="mt-3 flex gap-6 text-sm">
          <div>
            <span className="font-semibold text-gray-700">{totalStats.facultyWithTopics}</span>
            <span className="text-gray-500"> faculty with topics</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">{totalStats.topicsUsed}</span>
            <span className="text-gray-500"> of {totalStats.totalTopics} topics used</span>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">P</span>
            <span className="text-gray-600">Primary Research Area</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">S</span>
            <span className="text-gray-600">Secondary Research Area</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">T</span>
            <span className="text-gray-600">Technique/Method</span>
          </div>
        </div>
      </div>
      
      {/* Expand/Collapse All */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setExpandedNodes(new Set(Object.keys(topics)))}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Expand All
        </button>
        <button
          onClick={() => setExpandedNodes(new Set())}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Collapse All
        </button>
      </div>
      
      {/* Topic Tree */}
      <div className="space-y-2">
        {rootTopics.map(topicId => renderNode(topicId))}
      </div>
      
      {/* Selected Topic Details */}
      {selectedTopic && topics[selectedTopic] && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">
            Selected: {(topics[selectedTopic] as TopicNode).label}
          </h3>
          <div className="text-sm text-blue-800">
            <p className="mb-2">{(topics[selectedTopic] as TopicNode).description}</p>
            <div className="flex gap-4">
              <span><strong>{topicStats[selectedTopic].facultyCount}</strong> total faculty</span>
              <span><strong>{topicStats[selectedTopic].primaryCount}</strong> primary</span>
              <span><strong>{topicStats[selectedTopic].secondaryCount}</strong> secondary</span>
              <span><strong>{topicStats[selectedTopic].techniqueCount}</strong> technique</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};