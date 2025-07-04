import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import type { TopicNode, TopicHierarchyNode } from '../types/taxonomy';
import { buildTopicHierarchy, getTopicsByLevel } from '../models/taxonomyData';
import { getTopicUsageStats } from '../models/facultyData';

interface TopicFilterProps {
  selectedTopics: string[];
  onTopicToggle: (topicId: string) => void;
  onClearTopics: () => void;
  includeChildren: boolean;
  onIncludeChildrenChange: (include: boolean) => void;
}

interface TopicTreeNodeProps {
  node: TopicHierarchyNode;
  selected: boolean;
  onToggle: (topicId: string) => void;
  expanded: boolean;
  onExpandToggle: (topicId: string) => void;
  usageCount: number;
  level: number;
}

const TopicTreeNode: React.FC<TopicTreeNodeProps> = ({
  node,
  selected,
  onToggle,
  expanded,
  onExpandToggle,
  usageCount,
  level,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const indentClass = `pl-${Math.min(level * 4, 12)}`;

  return (
    <div>
      <div
        className={`flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer ${indentClass}`}
        onClick={() => onToggle(node.id)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpandToggle(node.id);
            }}
            className="mr-1"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>
        )}
        {!hasChildren && <span className="w-5" />}
        
        <div className="flex items-center flex-1">
          <div className={`w-4 h-4 mr-2 border rounded ${selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
            {selected && <Check className="w-3 h-3 text-white" />}
          </div>
          <span className={`flex-1 ${selected ? 'font-medium text-blue-900' : 'text-gray-700'}`}>
            {node.label}
          </span>
          {usageCount > 0 && (
            <span className="text-sm text-gray-500 ml-2">({usageCount})</span>
          )}
        </div>
      </div>
      
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <ConnectedTopicTreeNode
              key={child.id}
              node={child}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Connected component to access context
const ConnectedTopicTreeNode: React.FC<{ node: TopicHierarchyNode; level: number }> = ({ node, level }) => {
  const { selectedTopics, onToggle, expandedNodes, onExpandToggle, usageStats } = React.useContext(TopicFilterContext);
  
  return (
    <TopicTreeNode
      node={node}
      selected={selectedTopics.includes(node.id)}
      onToggle={onToggle}
      expanded={expandedNodes.includes(node.id)}
      onExpandToggle={onExpandToggle}
      usageCount={usageStats.get(node.id) || 0}
      level={level}
    />
  );
};

// Context for passing props down the tree
const TopicFilterContext = React.createContext<{
  selectedTopics: string[];
  onToggle: (topicId: string) => void;
  expandedNodes: string[];
  onExpandToggle: (topicId: string) => void;
  usageStats: Map<string, number>;
}>({
  selectedTopics: [],
  onToggle: () => {},
  expandedNodes: [],
  onExpandToggle: () => {},
  usageStats: new Map(),
});

export const TopicFilter: React.FC<TopicFilterProps> = ({
  selectedTopics,
  onTopicToggle,
  onClearTopics,
  includeChildren,
  onIncludeChildrenChange,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  // Get topic hierarchy and usage stats
  const hierarchy = useMemo(() => buildTopicHierarchy(), []);
  const usageStats = useMemo(() => getTopicUsageStats(), []);
  
  // Calculate total selected count
  const selectedCount = selectedTopics.length;
  
  const handleExpandToggle = (nodeId: string) => {
    setExpandedNodes(prev =>
      prev.includes(nodeId)
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    );
  };
  
  const contextValue = {
    selectedTopics,
    onToggle: onTopicToggle,
    expandedNodes,
    onExpandToggle: handleExpandToggle,
    usageStats,
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Research Topics
      </label>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex items-center justify-between">
          <span className="text-gray-700">
            {selectedCount === 0 ? 'All Topics' : `${selectedCount} topic${selectedCount !== 1 ? 's' : ''} selected`}
          </span>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="max-h-96 overflow-y-auto">
            {/* Header controls */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Filter by Research Topics</span>
                {selectedCount > 0 && (
                  <button
                    onClick={onClearTopics}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear all
                  </button>
                )}
              </div>
              
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={includeChildren}
                  onChange={(e) => onIncludeChildrenChange(e.target.checked)}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-600">Include sub-topics automatically</span>
              </label>
            </div>
            
            {/* Topic tree */}
            <div className="py-2">
              <TopicFilterContext.Provider value={contextValue}>
                {hierarchy.map((rootNode) => (
                  <ConnectedTopicTreeNode
                    key={rootNode.id}
                    node={rootNode}
                    level={0}
                  />
                ))}
              </TopicFilterContext.Provider>
            </div>
          </div>
          
          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-3">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};