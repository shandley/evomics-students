import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { EnrichedFacultyProfile, Workshop } from '../types';
import { generateNetworkData, calculateNetworkStats } from '../utils/networkAnalysis';
import type { NetworkData, NetworkNode, NetworkLink } from '../utils/networkAnalysis';

interface FacultyNetworkVisualizationProps {
  faculty: EnrichedFacultyProfile[];
  workshops: { [key: string]: Workshop };
  onFacultyClick?: (facultyId: string) => void;
}

const FacultyNetworkVisualizationComponent: React.FC<FacultyNetworkVisualizationProps> = ({
  faculty,
  workshops,
  onFacultyClick
}) => {
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightNodes, setHighlightNodes] = useState(new Set<string>());
  const [highlightLinks, setHighlightLinks] = useState(new Set<string>());
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const [hoveredNodeDetails, setHoveredNodeDetails] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [graphState, setGraphState] = useState<{ zoom: number; center: { x: number; y: number } } | null>(null);
  
  // Filter controls
  const [minSharedTopics, setMinSharedTopics] = useState(2);
  const [showCoTeaching, setShowCoTeaching] = useState(true);
  const [showTopicConnections, setShowTopicConnections] = useState(true);
  
  // Generate network data
  const networkData = useMemo(() => {
    return generateNetworkData(faculty, workshops, {
      minSharedTopics,
      minCoTeaching: showCoTeaching ? 1 : 999, // High number to effectively disable
      maxNodes: 150 // Limit for performance
    });
  }, [faculty, workshops, minSharedTopics, showCoTeaching]);
  
  // Filter links based on type
  const filteredData = useMemo(() => {
    const filteredLinks = networkData.links.filter(link => {
      if (!showTopicConnections && link.type === 'topic') return false;
      if (!showCoTeaching && link.type === 'co-teaching') return false;
      return true;
    });
    
    return {
      nodes: networkData.nodes,
      links: filteredLinks
    };
  }, [networkData, showCoTeaching, showTopicConnections]);
  
  // Calculate statistics
  const stats = useMemo(() => calculateNetworkStats(filteredData), [filteredData]);
  
  // Restore graph state after re-render
  useEffect(() => {
    if (graphState && graphRef.current) {
      // Small delay to ensure graph is fully rendered
      setTimeout(() => {
        if (graphRef.current && graphState) {
          graphRef.current.zoom(graphState.zoom);
          if (graphState.center) {
            graphRef.current.centerAt(graphState.center.x, graphState.center.y, 0);
          }
        }
      }, 100);
    }
  }, [graphState]);
  
  // Workshop colors
  const workshopColors: Record<string, string> = {
    wog: '#3B82F6',      // blue
    wpsg: '#8B5CF6',     // purple  
    wphylo: '#10B981',   // green
    default: '#6B7280'   // gray
  };
  
  // Get enhanced faculty details
  const getFacultyDetails = useCallback((nodeId: string) => {
    const profile = faculty.find(f => f.faculty.id === nodeId);
    if (!profile) return null;
    
    // Count connections
    const connections = filteredData.links.filter(link => {
      const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
      const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;
      return sourceId === nodeId || targetId === nodeId;
    });
    
    // Get top research areas
    const researchAreas = profile.enrichment?.academic?.researchAreas?.standardized?.primary || [];
    const topAreas = researchAreas.slice(0, 3).map(area => area.label);
    
    // Get institution
    const institution = profile.enrichment?.professional?.affiliation || 'Unknown Institution';
    
    // Get workshop participation years
    const allYears = new Set<number>();
    Object.values(profile.participations).forEach(years => {
      years.forEach(year => allYears.add(year));
    });
    const yearRange = allYears.size > 0 
      ? `${Math.min(...allYears)}-${Math.max(...allYears)}`
      : 'N/A';
    
    return {
      name: `${profile.faculty.firstName} ${profile.faculty.lastName}`,
      institution,
      department: profile.enrichment?.professional?.department,
      connectionCount: connections.length,
      yearsActive: allYears.size,
      yearRange,
      topAreas,
      workshops: Object.entries(profile.participations).map(([wId, years]) => ({
        name: workshops[wId]?.shortName || wId,
        years: years.length
      }))
    };
  }, [faculty, filteredData.links, workshops]);

  // Handle mouse move for tooltip positioning
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  }, []);

  // Handle node hover
  const handleNodeHover = useCallback((node: NetworkNode | null) => {
    if (!node) {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      setHoverNode(null);
      setHoveredNodeDetails(null);
      return;
    }
    
    setHoverNode(node.id);
    setHoveredNodeDetails(getFacultyDetails(node.id));
    
    // Highlight connected nodes and links
    const connectedNodes = new Set<string>([node.id]);
    const connectedLinks = new Set<string>();
    
    filteredData.links.forEach(link => {
      // Handle both string IDs and object references
      const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
      const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;
      
      if (sourceId === node.id || targetId === node.id) {
        connectedNodes.add(sourceId);
        connectedNodes.add(targetId);
        connectedLinks.add(`${sourceId}-${targetId}`);
      }
    });
    
    setHighlightNodes(connectedNodes);
    setHighlightLinks(connectedLinks);
  }, [filteredData.links, getFacultyDetails]);
  
  // Handle node click
  const handleNodeClick = useCallback((node: NetworkNode) => {
    // Save current graph state before triggering modal
    if (graphRef.current) {
      const zoom = graphRef.current.zoom();
      const center = graphRef.current.centerAt();
      setGraphState({ zoom, center });
    }
    
    setSelectedNode(node.id);
    onFacultyClick?.(node.id);
  }, [onFacultyClick]);
  
  // Node styling
  const nodeColor = useCallback((node: NetworkNode) => {
    if (highlightNodes.has(node.id)) {
      return workshopColors[node.group] || workshopColors.default;
    }
    // Make non-highlighted nodes much more faded when hovering
    return highlightNodes.size > 0 ? '#D1D5DB' : (workshopColors[node.group] || workshopColors.default);
  }, [highlightNodes]);
  
  // Link styling
  const linkColor = useCallback((link: NetworkLink) => {
    // Handle both string IDs and object references
    const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
    const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;
    const linkId = `${sourceId}-${targetId}`;
    
    if (highlightLinks.has(linkId)) {
      if (link.type === 'both') return '#DC2626'; // red for both
      if (link.type === 'co-teaching') return '#F59E0B'; // amber for co-teaching
      return '#374151'; // darker gray for topic only when highlighted
    }
    // Make non-highlighted links very faint when hovering
    return highlightLinks.size > 0 ? '#F9FAFB' : '#E5E7EB';
  }, [highlightLinks]);
  
  const linkWidth = useCallback((link: NetworkLink) => {
    // Handle both string IDs and object references
    const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
    const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;
    const linkId = `${sourceId}-${targetId}`;
    
    if (highlightLinks.has(linkId)) {
      return Math.min(link.value, 8);
    }
    return 1;
  }, [highlightLinks]);
  
  // Find selected node details
  const selectedNodeDetails = useMemo(() => {
    if (!selectedNode) return null;
    
    const node = filteredData.nodes.find(n => n.id === selectedNode);
    if (!node) return null;
    
    const connections = filteredData.links.filter(l => {
      const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      return sourceId === selectedNode || targetId === selectedNode;
    });
    
    return { node, connections };
  }, [selectedNode, filteredData]);
  
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Faculty Network</h2>
        <p className="text-gray-600">
          Explore connections between faculty based on shared research topics and co-teaching relationships
        </p>
      </div>
      
      {/* Controls */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Shared Topics
            </label>
            <select
              value={minSharedTopics}
              onChange={(e) => setMinSharedTopics(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value={1}>1+ topics</option>
              <option value={2}>2+ topics</option>
              <option value={3}>3+ topics</option>
              <option value={4}>4+ topics</option>
            </select>
          </div>
          
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showTopicConnections}
                onChange={(e) => setShowTopicConnections(e.target.checked)}
                className="rounded text-primary-600"
              />
              <span className="text-sm">Topic Connections</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showCoTeaching}
                onChange={(e) => setShowCoTeaching(e.target.checked)}
                className="rounded text-primary-600"
              />
              <span className="text-sm">Co-Teaching</span>
            </label>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <span className="font-semibold">Node Color:</span> Primary Workshop
          </div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span> WoG
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span> WPSG
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500"></span> WPhylo
            </span>
          </div>
          <div className="flex gap-4">
            <span className="font-semibold">Link Type:</span>
            <span className="flex items-center gap-1">
              <span className="w-8 h-0.5 bg-gray-600"></span> Topics Only
            </span>
            <span className="flex items-center gap-1">
              <span className="w-8 h-0.5 bg-amber-500"></span> Co-Teaching
            </span>
            <span className="flex items-center gap-1">
              <span className="w-8 h-0.5 bg-red-600"></span> Both
            </span>
          </div>
        </div>
      </div>
      
      {/* Network Graph */}
      <div 
        ref={containerRef}
        className="relative h-[600px] border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
        onMouseMove={handleMouseMove}
      >
        <ForceGraph2D
          ref={graphRef}
          graphData={filteredData}
          nodeColor={nodeColor as any}
          linkColor={linkColor as any}
          linkWidth={linkWidth}
          linkDirectionalParticles={0}
          onNodeHover={handleNodeHover as any}
          nodeCanvasObjectMode={() => 'after'}
          onEngineStop={() => {
            // Force re-render to update positions
            if (graphRef.current) {
              graphRef.current.d3ReheatSimulation();
            }
          }}
          onNodeClick={handleNodeClick as any}
          cooldownTicks={100}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const label = node.name;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            
            // Draw node circle
            const nodeSize = Math.sqrt(node.val) * 2;
            const isHighlighted = highlightNodes.has(node.id);
            const isHovered = node.id === hoverNode;
            
            // Add glow effect for highlighted nodes
            if (isHighlighted && highlightNodes.size > 0) {
              ctx.shadowColor = workshopColors[node.group] || workshopColors.default;
              ctx.shadowBlur = 20 / globalScale;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;
            }
            
            ctx.fillStyle = nodeColor(node);
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false);
            ctx.fill();
            
            // Reset shadow
            ctx.shadowBlur = 0;
            
            // Draw border for highlighted or hovered nodes
            if (isHighlighted && highlightNodes.size > 0) {
              ctx.strokeStyle = workshopColors[node.group] || workshopColors.default;
              ctx.lineWidth = 3 / globalScale;
              ctx.stroke();
            } else if (isHovered) {
              ctx.strokeStyle = '#1F2937';
              ctx.lineWidth = 2 / globalScale;
              ctx.stroke();
            }
            
            // Draw label for highlighted nodes or when no highlighting
            if (isHighlighted || highlightNodes.size === 0) {
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = isHighlighted && highlightNodes.size > 0 ? '#000000' : '#1F2937';
              ctx.font = `${isHighlighted && highlightNodes.size > 0 ? 'bold ' : ''}${fontSize}px Sans-Serif`;
              ctx.fillText(label, node.x, node.y + nodeSize + fontSize);
            }
          }}
        />
        
        {/* Enhanced Tooltip - Inside the container */}
        {hoveredNodeDetails && (
          <div
            className="absolute z-50 pointer-events-none transition-all duration-75"
            style={{
              left: `${Math.min(mousePosition.x + 15, 750)}px`,
              top: `${mousePosition.y > 350 ? mousePosition.y - 250 : mousePosition.y + 15}px`,
              maxWidth: '350px'
            }}
          >
            <div className="bg-white rounded-lg shadow-xl p-4 max-w-sm border border-gray-200">
              <h3 className="font-bold text-lg mb-2">{hoveredNodeDetails.name}</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Institution:</span>{' '}
                  <span className="font-medium">{hoveredNodeDetails.institution}</span>
                </div>
                {hoveredNodeDetails.department && (
                  <div>
                    <span className="text-gray-600">Department:</span>{' '}
                    <span className="font-medium">{hoveredNodeDetails.department}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Network Connections:</span>{' '}
                  <span className="font-medium text-primary-600">{hoveredNodeDetails.connectionCount}</span>
                </div>
                <div>
                  <span className="text-gray-600">Years Active:</span>{' '}
                  <span className="font-medium">{hoveredNodeDetails.yearsActive} years ({hoveredNodeDetails.yearRange})</span>
                </div>
                {hoveredNodeDetails.topAreas.length > 0 && (
                  <div>
                    <span className="text-gray-600">Top Research Areas:</span>
                    <ul className="mt-1 space-y-1">
                      {hoveredNodeDetails.topAreas.map((area: string, i: number) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-primary-500 mt-1">•</span>
                          <span className="text-gray-800">{area}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Workshop Participation:</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {hoveredNodeDetails.workshops.map((w: any, i: number) => {
                      // Map workshop short names to IDs for color lookup
                      const workshopId = Object.entries(workshops).find(
                        ([_, workshop]) => workshop.shortName === w.name
                      )?.[0];
                      const bgColor = workshopId ? workshopColors[workshopId] : workshopColors.default;
                      
                      return (
                        <span 
                          key={i} 
                          className="px-2 py-1 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: bgColor }}
                        >
                          {w.name} ({w.years}×)
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500 italic">
                Click to view full profile
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-blue-700">{stats.totalNodes}</p>
          <p className="text-sm text-blue-600">Faculty in Network</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-green-700">{stats.totalLinks}</p>
          <p className="text-sm text-green-600">Connections</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-purple-700">{stats.avgDegree}</p>
          <p className="text-sm text-purple-600">Avg Connections</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 text-center">
          <div className="text-sm">
            <p><span className="font-bold text-amber-700">{stats.linkTypes.topic}</span> Topic Only</p>
            <p><span className="font-bold text-amber-700">{stats.linkTypes.coTeaching}</span> Co-Teaching</p>
            <p><span className="font-bold text-amber-700">{stats.linkTypes.both}</span> Both</p>
          </div>
        </div>
      </div>
      
      {/* Selected Node Details */}
      {selectedNodeDetails && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">
            {selectedNodeDetails.node.name}
          </h3>
          <div className="text-sm text-blue-800">
            <p className="mb-1">
              <strong>{selectedNodeDetails.connections.length}</strong> connections
            </p>
            <p className="mb-1">
              <strong>{selectedNodeDetails.node.val}</strong> total years teaching
            </p>
            <p className="mb-1">
              Workshops: {selectedNodeDetails.node.workshops.map(w => workshops[w]?.shortName).join(', ')}
            </p>
            {selectedNodeDetails.node.topics.length > 0 && (
              <p className="text-xs mt-2">
                {selectedNodeDetails.node.topics.length} research topics
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Memoize the component to prevent re-renders when modal opens/closes
export const FacultyNetworkVisualization = React.memo(FacultyNetworkVisualizationComponent, (prevProps, nextProps) => {
  // Only re-render if faculty data or workshops actually changed
  return (
    prevProps.faculty === nextProps.faculty &&
    prevProps.workshops === nextProps.workshops &&
    prevProps.onFacultyClick === nextProps.onFacultyClick
  );
});