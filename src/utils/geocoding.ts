import type { EnrichedFacultyProfile } from '../types';
import coordinatesData from '../data/institutionCoordinates.json';

export interface LocationData {
  lat: number;
  lng: number;
  city: string;
  country: string;
}

export interface FacultyLocation extends LocationData {
  institution: string;
  faculty: EnrichedFacultyProfile[];
  count: number;
}

// Type the imported coordinates
const institutionCoordinates: Record<string, LocationData> = coordinatesData;

// Normalize institution names for matching
function normalizeInstitution(name: string): string {
  return name
    .toLowerCase()
    .replace(/[,\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Find coordinates for an institution
export function getInstitutionCoordinates(institution: string): LocationData | null {
  // Handle dual affiliations (e.g., "University A / University B")
  if (institution.includes(' / ')) {
    // Try to match the first institution
    const parts = institution.split(' / ');
    for (const part of parts) {
      const coords = getInstitutionCoordinates(part.trim());
      if (coords) {
        return coords;
      }
    }
  }
  
  // Direct match
  if (institutionCoordinates[institution]) {
    return institutionCoordinates[institution];
  }
  
  // Normalized match
  const normalized = normalizeInstitution(institution);
  for (const [key, coords] of Object.entries(institutionCoordinates)) {
    if (normalizeInstitution(key) === normalized) {
      return coords;
    }
  }
  
  // Handle "University Medical Center X" -> "University of X" pattern
  if (institution.includes('University Medical Center')) {
    const cityMatch = institution.match(/University Medical Center (\w+)/);
    if (cityMatch) {
      const universityVariant = `University of ${cityMatch[1]}`;
      if (institutionCoordinates[universityVariant]) {
        return institutionCoordinates[universityVariant];
      }
    }
  }
  
  // Partial match
  for (const [key, coords] of Object.entries(institutionCoordinates)) {
    if (institution.includes(key) || key.includes(institution)) {
      return coords;
    }
    // Check for common university patterns - but make sure there's actually a prefix to match
    const instLower = institution.toLowerCase();
    const keyLower = key.toLowerCase();
    
    // For universities
    if (instLower.includes('university') && keyLower.includes('university')) {
      const instPrefix = instLower.split('university')[0].trim();
      const keyPrefix = keyLower.split('university')[0].trim();
      // Only match if both have prefixes and one contains the other
      if (instPrefix && keyPrefix && 
          (instPrefix.includes(keyPrefix) || keyPrefix.includes(instPrefix))) {
        return coords;
      }
    }
    
    // For institutes  
    if (instLower.includes('institute') && keyLower.includes('institute')) {
      const instPrefix = instLower.split('institute')[0].trim();
      const keyPrefix = keyLower.split('institute')[0].trim();
      // Only match if both have prefixes and one contains the other
      if (instPrefix && keyPrefix && 
          (instPrefix.includes(keyPrefix) || keyPrefix.includes(instPrefix))) {
        return coords;
      }
    }
  }
  
  return null;
}

// Aggregate faculty by location
export function aggregateFacultyByLocation(faculty: EnrichedFacultyProfile[]): FacultyLocation[] {
  const locationMap = new Map<string, FacultyLocation>();
  const unmappedInstitutions = new Set<string>();
  
  faculty.forEach(profile => {
    const institution = profile.enrichment?.professional?.affiliation;
    if (!institution) return;
    
    // Skip faculty with "Unknown" affiliation
    if (institution === 'Unknown') {
      unmappedInstitutions.add(institution);
      return;
    }
    
    const coords = getInstitutionCoordinates(institution);
    if (coords) {
      // Skip locations at (0,0) - these are placeholder coordinates
      if (coords.lat === 0 && coords.lng === 0) {
        unmappedInstitutions.add(institution);
        return;
      }
      
      const key = `${coords.lat},${coords.lng}`;
      if (!locationMap.has(key)) {
        locationMap.set(key, {
          ...coords,
          institution: coords.city, // Use city name as default institution display
          faculty: [],
          count: 0
        });
      }
      const location = locationMap.get(key)!;
      location.faculty.push(profile);
      location.count++;
    } else {
      unmappedInstitutions.add(institution);
    }
  });
  
  // Log unmapped institutions for future improvement
  if (unmappedInstitutions.size > 0) {
    console.log('Unmapped institutions:', Array.from(unmappedInstitutions));
    console.log(`Total unmapped: ${unmappedInstitutions.size}`);
    console.log(`Total mapped locations: ${locationMap.size}`);
  }
  
  return Array.from(locationMap.values());
}

// Get location statistics
export function getLocationStatistics(locations: FacultyLocation[]) {
  const countries = new Map<string, number>();
  const cities = new Map<string, number>();
  
  locations.forEach(location => {
    // Skip "Unknown" in statistics
    if (location.country === 'Unknown' || location.city === 'Unknown') {
      return;
    }
    
    countries.set(location.country, (countries.get(location.country) || 0) + location.count);
    cities.set(`${location.city}, ${location.country}`, 
      (cities.get(`${location.city}, ${location.country}`) || 0) + location.count);
  });
  
  return {
    totalLocations: locations.length,
    totalCountries: countries.size,
    totalCities: cities.size,
    topCountries: Array.from(countries.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
    topCities: Array.from(cities.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
  };
}