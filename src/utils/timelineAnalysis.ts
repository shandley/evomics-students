import type { EnrichedFacultyProfile, Workshop } from '../types';

export interface TimelineYear {
  year: number;
  workshops: {
    [workshopId: string]: {
      faculty: string[];
      newFaculty: string[];
      returningFaculty: string[];
      totalFaculty: number;
      topics: Map<string, number>;
      countries: Map<string, number>;
    }
  };
  totals: {
    facultyCount: number;
    newFacultyCount: number;
    workshopCount: number;
    topicCount: number;
    countryCount: number;
  };
  milestones: string[];
}

export interface TimelineData {
  years: TimelineYear[];
  minYear: number;
  maxYear: number;
  allYears: number[];
  cumulativeFaculty: Map<number, Set<string>>;
  facultyFirstYear: Map<string, number>;
  workshopStartYears: Map<string, number>;
}

export interface FacultyCareer {
  facultyId: string;
  name: string;
  firstYear: number;
  lastYear: number;
  totalYears: number;
  workshops: {
    [workshopId: string]: number[];
  };
  yearsActive: number[];
}

// Generate timeline data from faculty profiles
export function generateTimelineData(
  faculty: EnrichedFacultyProfile[],
  workshops: { [key: string]: Workshop }
): TimelineData {
  // Find year range
  let minYear = Infinity;
  let maxYear = -Infinity;
  
  faculty.forEach(profile => {
    Object.values(profile.participations).forEach(years => {
      years.forEach(year => {
        minYear = Math.min(minYear, year);
        maxYear = Math.max(maxYear, year);
      });
    });
  });
  
  // Create array of all years
  const allYears = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => minYear + i
  );
  
  // Track cumulative faculty and first appearances
  const cumulativeFaculty = new Map<number, Set<string>>();
  const facultyFirstYear = new Map<string, number>();
  const allFacultyUpToYear = new Set<string>();
  
  // Track workshop start years
  const workshopStartYears = new Map<string, number>();
  
  // Build timeline data for each year
  const years: TimelineYear[] = allYears.map(year => {
    const yearData: TimelineYear = {
      year,
      workshops: {},
      totals: {
        facultyCount: 0,
        newFacultyCount: 0,
        workshopCount: 0,
        topicCount: 0,
        countryCount: 0
      },
      milestones: []
    };
    
    const yearTopics = new Set<string>();
    const yearCountries = new Set<string>();
    const yearNewFaculty = new Set<string>();
    
    // Process each workshop
    Object.entries(workshops).forEach(([workshopId, workshop]) => {
      const workshopFaculty: string[] = [];
      const newFaculty: string[] = [];
      const returningFaculty: string[] = [];
      const topics = new Map<string, number>();
      const countries = new Map<string, number>();
      
      // Find faculty who taught this workshop this year
      faculty.forEach(profile => {
        const years = profile.participations[workshopId];
        if (years && years.includes(year)) {
          workshopFaculty.push(profile.faculty.id);
          
          // Track if this is their first year ever
          if (!facultyFirstYear.has(profile.faculty.id)) {
            facultyFirstYear.set(profile.faculty.id, year);
            newFaculty.push(profile.faculty.id);
            yearNewFaculty.add(profile.faculty.id);
          } else if (facultyFirstYear.get(profile.faculty.id) === year) {
            // First year for this faculty member
            newFaculty.push(profile.faculty.id);
            yearNewFaculty.add(profile.faculty.id);
          } else {
            returningFaculty.push(profile.faculty.id);
          }
          
          // Track topics
          const researchAreas = profile.enrichment?.academic?.researchAreas?.standardized;
          if (researchAreas) {
            researchAreas.primary?.forEach(topic => {
              topics.set(topic.id, (topics.get(topic.id) || 0) + 1);
              yearTopics.add(topic.id);
            });
          }
          
          // Track countries
          const country = profile.enrichment?.professional?.affiliation;
          if (country && country !== 'Unknown') {
            const countryName = country.split(',').pop()?.trim() || country;
            countries.set(countryName, (countries.get(countryName) || 0) + 1);
            yearCountries.add(countryName);
          }
        }
      });
      
      if (workshopFaculty.length > 0) {
        // Track workshop start year
        if (!workshopStartYears.has(workshopId)) {
          workshopStartYears.set(workshopId, year);
        }
        
        yearData.workshops[workshopId] = {
          faculty: workshopFaculty,
          newFaculty,
          returningFaculty,
          totalFaculty: workshopFaculty.length,
          topics,
          countries
        };
      }
    });
    
    // Update cumulative faculty
    allFacultyUpToYear.forEach(id => yearData.totals.facultyCount++);
    yearNewFaculty.forEach(id => {
      allFacultyUpToYear.add(id);
      yearData.totals.facultyCount++;
    });
    cumulativeFaculty.set(year, new Set(allFacultyUpToYear));
    
    // Calculate totals
    yearData.totals.newFacultyCount = yearNewFaculty.size;
    yearData.totals.workshopCount = Object.keys(yearData.workshops).length;
    yearData.totals.topicCount = yearTopics.size;
    yearData.totals.countryCount = yearCountries.size;
    
    // Add milestones
    const totalFacultySoFar = allFacultyUpToYear.size;
    if (totalFacultySoFar === 50) {
      yearData.milestones.push('50th faculty member');
    } else if (totalFacultySoFar === 100) {
      yearData.milestones.push('100th faculty member');
    } else if (totalFacultySoFar === 150) {
      yearData.milestones.push('150th faculty member');
    }
    
    return yearData;
  });
  
  return {
    years,
    minYear,
    maxYear,
    allYears,
    cumulativeFaculty,
    facultyFirstYear,
    workshopStartYears
  };
}

// Get faculty career path
export function getFacultyCareer(
  facultyId: string,
  faculty: EnrichedFacultyProfile[]
): FacultyCareer | null {
  const profile = faculty.find(f => f.faculty.id === facultyId);
  if (!profile) return null;
  
  const yearsActive = new Set<number>();
  Object.values(profile.participations).forEach(years => {
    years.forEach(year => yearsActive.add(year));
  });
  
  const sortedYears = Array.from(yearsActive).sort((a, b) => a - b);
  
  return {
    facultyId,
    name: `${profile.faculty.firstName} ${profile.faculty.lastName}`,
    firstYear: Math.min(...sortedYears),
    lastYear: Math.max(...sortedYears),
    totalYears: sortedYears.length,
    workshops: profile.participations,
    yearsActive: sortedYears
  };
}

// Calculate year-over-year changes
export function calculateYearChanges(
  currentYear: TimelineYear,
  previousYear: TimelineYear | null
): {
  facultyGrowth: number;
  newWorkshops: string[];
  facultyRetention: number;
} {
  const facultyGrowth = previousYear 
    ? currentYear.totals.facultyCount - previousYear.totals.facultyCount
    : currentYear.totals.facultyCount;
  
  const newWorkshops = previousYear
    ? Object.keys(currentYear.workshops).filter(w => !previousYear.workshops[w])
    : Object.keys(currentYear.workshops);
  
  let retained = 0;
  let total = 0;
  
  if (previousYear) {
    Object.entries(currentYear.workshops).forEach(([workshopId, data]) => {
      const prevData = previousYear.workshops[workshopId];
      if (prevData) {
        total += prevData.faculty.length;
        retained += data.returningFaculty.length;
      }
    });
  }
  
  const facultyRetention = total > 0 ? (retained / total) * 100 : 0;
  
  return {
    facultyGrowth,
    newWorkshops,
    facultyRetention
  };
}