import type { StudentProfile } from '../types/student';

/**
 * Data Consistency Utilities
 * 
 * These utilities ensure consistent counting and data processing across all dashboard components.
 * Use these functions to maintain data integrity and avoid discrepancies between panels.
 */

/**
 * Count unique students per workshop
 * @param profiles Array of student profiles
 * @param workshopIds Array of workshop IDs to count
 * @returns Object with workshop ID as key and unique student count as value
 */
export const countUniqueStudentsByWorkshop = (
  profiles: StudentProfile[], 
  workshopIds: string[] = ['wog', 'wpsg', 'wphylo']
): { [workshopId: string]: number } => {
  return workshopIds.reduce((acc, workshopId) => {
    acc[workshopId] = profiles.filter(p => p.participations[workshopId]?.length > 0).length;
    return acc;
  }, {} as { [workshopId: string]: number });
};

/**
 * Count unique students per year per workshop
 * @param profiles Array of student profiles
 * @returns Nested object: { year: { workshopId: Set<studentId> } }
 */
export const countUniqueStudentsByYearWorkshop = (
  profiles: StudentProfile[]
): { [year: number]: { [workshopId: string]: Set<string> } } => {
  const uniqueStudentsByYearWorkshop: { [year: number]: { [workshopId: string]: Set<string> } } = {};

  profiles.forEach(profile => {
    Object.entries(profile.participations).forEach(([workshopId, years]) => {
      years.forEach(year => {
        if (!uniqueStudentsByYearWorkshop[year]) {
          uniqueStudentsByYearWorkshop[year] = {};
        }
        if (!uniqueStudentsByYearWorkshop[year][workshopId]) {
          uniqueStudentsByYearWorkshop[year][workshopId] = new Set();
        }
        uniqueStudentsByYearWorkshop[year][workshopId].add(profile.student.id);
      });
    });
  });

  return uniqueStudentsByYearWorkshop;
};

/**
 * Count unique students per country
 * @param profiles Array of student profiles
 * @returns Object with country as key and unique student count as value
 */
export const countUniqueStudentsByCountry = (profiles: StudentProfile[]): { [country: string]: number } => {
  const countryStats: { [country: string]: number } = {};
  
  profiles.forEach(profile => {
    const country = profile.student.country;
    countryStats[country] = (countryStats[country] || 0) + 1;
  });
  
  return countryStats;
};

/**
 * Count unique countries per workshop
 * @param profiles Array of student profiles
 * @returns Object with workshop ID as key and Set of countries as value
 */
export const countUniqueCountriesByWorkshop = (
  profiles: StudentProfile[]
): { [workshopId: string]: Set<string> } => {
  const workshopCountries: { [workshopId: string]: Set<string> } = {
    wog: new Set(),
    wpsg: new Set(),
    wphylo: new Set()
  };
  
  profiles.forEach(profile => {
    Object.keys(profile.participations).forEach(workshopId => {
      if (profile.participations[workshopId].length > 0 && workshopId in workshopCountries) {
        workshopCountries[workshopId].add(profile.student.country);
      }
    });
  });
  
  return workshopCountries;
};

/**
 * Get total participation-years (for calculating averages)
 * @param profiles Array of student profiles
 * @returns Total number of participation-years across all students and workshops
 */
export const getTotalParticipationYears = (profiles: StudentProfile[]): number => {
  return profiles.reduce((total, profile) => total + profile.statistics.totalYears, 0);
};

/**
 * Get year range from all participations
 * @param profiles Array of student profiles
 * @returns Object with earliest and latest year, plus total range
 */
export const getYearRange = (profiles: StudentProfile[]): { earliest: number; latest: number; range: number } | null => {
  const allYears = new Set<number>();
  
  profiles.forEach(profile => {
    Object.values(profile.participations).flat().forEach(year => allYears.add(year));
  });
  
  if (allYears.size === 0) return null;
  
  const years = Array.from(allYears);
  const earliest = Math.min(...years);
  const latest = Math.max(...years);
  
  return {
    earliest,
    latest,
    range: latest - earliest + 1
  };
};

/**
 * Validation function to check data consistency across components
 * @param profiles Array of student profiles
 * @returns Object with validation results and any inconsistencies found
 */
export const validateDataConsistency = (profiles: StudentProfile[]): {
  isValid: boolean;
  issues: string[];
  summary: {
    totalStudents: number;
    totalParticipations: number;
    workshopCounts: { [workshopId: string]: number };
    yearRange: { earliest: number; latest: number; range: number } | null;
  };
} => {
  const issues: string[] = [];
  
  // Basic counts
  const totalStudents = profiles.length;
  const totalParticipations = getTotalParticipationYears(profiles);
  const workshopCounts = countUniqueStudentsByWorkshop(profiles);
  const yearRange = getYearRange(profiles);
  
  // Validation checks
  if (totalStudents === 0) {
    issues.push('No student profiles found');
  }
  
  if (totalParticipations === 0) {
    issues.push('No participations found');
  }
  
  if (totalParticipations < totalStudents) {
    issues.push('Total participations is less than total students (impossible)');
  }
  
  // Check workshop counts sum doesn't exceed reasonable bounds
  const workshopSum = Object.values(workshopCounts).reduce((sum, count) => sum + count, 0);
  if (workshopSum < totalStudents) {
    issues.push('Sum of workshop participants is less than total students');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    summary: {
      totalStudents,
      totalParticipations,
      workshopCounts,
      yearRange
    }
  };
};