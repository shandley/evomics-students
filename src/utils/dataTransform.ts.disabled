import type { Faculty, Participation, FacultyProfile } from '../types';
import { ParticipationRole } from '../types';

export function parseCSVToFaculty(csvContent: string, workshopId: string): {
  faculty: Faculty[];
  participations: Participation[];
} {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');
  
  // Find year columns (those that are 4-digit numbers)
  const yearColumns: { year: number; index: number }[] = [];
  headers.forEach((header, index) => {
    const year = parseInt(header);
    if (!isNaN(year) && year > 2000 && year < 2100) {
      yearColumns.push({ year, index });
    }
  });

  const facultyMap = new Map<string, Faculty>();
  const participations: Participation[] = [];

  // Process each faculty member
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    const lastName = parts[0]?.replace(/"/g, '').trim();
    const firstName = parts[1]?.replace(/"/g, '').trim();
    
    if (!lastName || !firstName) continue;
    
    const facultyId = `${lastName.toLowerCase()}-${firstName.toLowerCase()}`.replace(/\s+/g, '-');
    
    // Create faculty member
    if (!facultyMap.has(facultyId)) {
      facultyMap.set(facultyId, {
        id: facultyId,
        firstName,
        lastName
      });
    }
    
    // Create participation records
    yearColumns.forEach(({ year, index }) => {
      const value = parts[index]?.trim();
      if (value && value !== '' && value.toLowerCase() !== 'x') {
        // If there's any non-empty value, consider it participation
        participations.push({
          facultyId,
          workshopId,
          year,
          role: ParticipationRole.FACULTY
        });
      } else if (value && value.toLowerCase() === 'x') {
        participations.push({
          facultyId,
          workshopId,
          year,
          role: ParticipationRole.FACULTY
        });
      }
    });
  }

  return {
    faculty: Array.from(facultyMap.values()),
    participations
  };
}

export function generateFacultyProfiles(
  faculty: Faculty[],
  participations: Participation[]
): FacultyProfile[] {
  const profiles = faculty.map(f => {
    const facultyParticipations = participations.filter(p => p.facultyId === f.id);
    const workshopYears: { [workshopId: string]: number[] } = {};
    
    facultyParticipations.forEach(p => {
      if (!workshopYears[p.workshopId]) {
        workshopYears[p.workshopId] = [];
      }
      workshopYears[p.workshopId].push(p.year);
    });
    
    // Sort years for each workshop
    Object.keys(workshopYears).forEach(workshopId => {
      workshopYears[workshopId].sort((a, b) => a - b);
    });
    
    const allYears = facultyParticipations.map(p => p.year);
    const uniqueWorkshops = new Set(facultyParticipations.map(p => p.workshopId));
    
    return {
      faculty: f,
      participations: workshopYears,
      statistics: {
        totalYears: allYears.length,
        workshopCount: uniqueWorkshops.size,
        firstYear: Math.min(...allYears),
        lastYear: Math.max(...allYears),
        primaryWorkshop: Object.entries(workshopYears)
          .sort(([, yearsA], [, yearsB]) => yearsB.length - yearsA.length)[0]?.[0] || ''
      }
    };
  });
  
  return profiles;
}