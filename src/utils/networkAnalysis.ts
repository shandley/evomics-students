import type { EnrichedFacultyProfile, Workshop } from '../types';

export interface NetworkNode {
  id: string;
  name: string;
  group: string; // workshop ID
  val: number; // node size based on participation years
  workshops: string[];
  topics: string[];
}

export interface NetworkLink {
  source: string;
  target: string;
  value: number; // connection strength
  type: 'topic' | 'co-teaching' | 'both';
  sharedTopics?: string[];
  sharedWorkshops?: string[];
}

export interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

// Calculate shared topics between two faculty members
function calculateSharedTopics(faculty1: EnrichedFacultyProfile, faculty2: EnrichedFacultyProfile): string[] {
  const topics1 = new Set<string>();
  const topics2 = new Set<string>();
  
  // Collect all topics for faculty 1
  const areas1 = faculty1.enrichment?.academic?.researchAreas?.standardized;
  if (areas1) {
    areas1.primary?.forEach(t => topics1.add(t.id));
    areas1.secondary?.forEach(t => topics1.add(t.id));
    areas1.techniques?.forEach(t => topics1.add(t.id));
  }
  
  // Collect all topics for faculty 2
  const areas2 = faculty2.enrichment?.academic?.researchAreas?.standardized;
  if (areas2) {
    areas2.primary?.forEach(t => topics2.add(t.id));
    areas2.secondary?.forEach(t => topics2.add(t.id));
    areas2.techniques?.forEach(t => topics2.add(t.id));
  }
  
  // Find intersection
  return Array.from(topics1).filter(topic => topics2.has(topic));
}

// Calculate co-teaching relationships
function calculateCoTeaching(faculty1: EnrichedFacultyProfile, faculty2: EnrichedFacultyProfile): string[] {
  const sharedWorkshops: string[] = [];
  
  // Check each workshop
  Object.entries(faculty1.participations).forEach(([workshopId, years1]) => {
    const years2 = faculty2.participations[workshopId];
    if (years2) {
      // Check if they taught in the same years
      const sharedYears = years1.filter(year => years2.includes(year));
      if (sharedYears.length > 0) {
        sharedWorkshops.push(workshopId);
      }
    }
  });
  
  return sharedWorkshops;
}

// Generate network data from faculty profiles
export function generateNetworkData(
  faculty: EnrichedFacultyProfile[],
  workshops: { [key: string]: Workshop },
  options: {
    minSharedTopics?: number;
    minCoTeaching?: number;
    maxNodes?: number;
  } = {}
): NetworkData {
  const { minSharedTopics = 1, minCoTeaching = 1, maxNodes = 100 } = options;
  
  // Filter to faculty with topics (for topic-based connections)
  const facultyWithTopics = faculty.filter(f => 
    f.enrichment?.academic?.researchAreas?.standardized
  );
  
  // Limit nodes if specified
  const selectedFaculty = maxNodes && facultyWithTopics.length > maxNodes
    ? facultyWithTopics.slice(0, maxNodes)
    : facultyWithTopics;
  
  // Create nodes
  const nodes: NetworkNode[] = selectedFaculty.map(profile => {
    const allTopics = new Set<string>();
    const areas = profile.enrichment?.academic?.researchAreas?.standardized;
    if (areas) {
      areas.primary?.forEach(t => allTopics.add(t.id));
      areas.secondary?.forEach(t => allTopics.add(t.id));
      areas.techniques?.forEach(t => allTopics.add(t.id));
    }
    
    // Determine primary workshop (most years)
    let primaryWorkshop = '';
    let maxYears = 0;
    Object.entries(profile.participations).forEach(([workshopId, years]) => {
      if (years.length > maxYears) {
        maxYears = years.length;
        primaryWorkshop = workshopId;
      }
    });
    
    return {
      id: profile.faculty.id,
      name: `${profile.faculty.firstName} ${profile.faculty.lastName}`,
      group: primaryWorkshop,
      val: profile.statistics.totalYears,
      workshops: Object.keys(profile.participations),
      topics: Array.from(allTopics)
    };
  });
  
  // Create links
  const links: NetworkLink[] = [];
  const linkMap = new Map<string, NetworkLink>();
  
  // Compare each pair of faculty
  for (let i = 0; i < selectedFaculty.length; i++) {
    for (let j = i + 1; j < selectedFaculty.length; j++) {
      const faculty1 = selectedFaculty[i];
      const faculty2 = selectedFaculty[j];
      
      const sharedTopics = calculateSharedTopics(faculty1, faculty2);
      const sharedWorkshops = calculateCoTeaching(faculty1, faculty2);
      
      // Check if they meet minimum criteria
      if (sharedTopics.length >= minSharedTopics || sharedWorkshops.length >= minCoTeaching) {
        const linkId = `${faculty1.faculty.id}-${faculty2.faculty.id}`;
        
        // Calculate connection strength
        const topicStrength = sharedTopics.length;
        const coTeachingStrength = sharedWorkshops.length * 2; // Weight co-teaching higher
        const totalStrength = topicStrength + coTeachingStrength;
        
        // Determine link type
        let linkType: 'topic' | 'co-teaching' | 'both';
        if (sharedTopics.length > 0 && sharedWorkshops.length > 0) {
          linkType = 'both';
        } else if (sharedTopics.length > 0) {
          linkType = 'topic';
        } else {
          linkType = 'co-teaching';
        }
        
        links.push({
          source: faculty1.faculty.id,
          target: faculty2.faculty.id,
          value: totalStrength,
          type: linkType,
          sharedTopics: sharedTopics.length > 0 ? sharedTopics : undefined,
          sharedWorkshops: sharedWorkshops.length > 0 ? sharedWorkshops : undefined
        });
      }
    }
  }
  
  return { nodes, links };
}

// Calculate network statistics
export function calculateNetworkStats(networkData: NetworkData) {
  const { nodes, links } = networkData;
  
  // Calculate degree for each node
  const nodeDegrees = new Map<string, number>();
  nodes.forEach(node => nodeDegrees.set(node.id, 0));
  
  links.forEach(link => {
    nodeDegrees.set(link.source, (nodeDegrees.get(link.source) || 0) + 1);
    nodeDegrees.set(link.target, (nodeDegrees.get(link.target) || 0) + 1);
  });
  
  // Find highly connected faculty
  const sortedByDegree = Array.from(nodeDegrees.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  // Count link types
  const linkTypes = {
    topic: links.filter(l => l.type === 'topic').length,
    coTeaching: links.filter(l => l.type === 'co-teaching').length,
    both: links.filter(l => l.type === 'both').length
  };
  
  // Calculate average degree
  const degrees = Array.from(nodeDegrees.values());
  const avgDegree = degrees.reduce((a, b) => a + b, 0) / degrees.length;
  
  return {
    totalNodes: nodes.length,
    totalLinks: links.length,
    avgDegree: avgDegree.toFixed(1),
    linkTypes,
    mostConnected: sortedByDegree.map(([id, degree]) => ({
      id,
      name: nodes.find(n => n.id === id)?.name || '',
      degree
    }))
  };
}