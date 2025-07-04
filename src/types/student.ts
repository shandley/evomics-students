// Clean student data types for simplified site

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  institution: string;
  country: string;
}

export interface Workshop {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  active: boolean;
  startYear: number;
  endYear?: number;
}

export interface StudentProfile {
  student: Student;
  participations: {
    [workshopId: string]: number[];
  };
  statistics: {
    totalYears: number;
    workshopCount: number;
    firstYear: number;
    lastYear: number;
  };
}

export interface Filters {
  search: string;
  workshops: string[];
  year: number | null;
  countries: string[];
  institutions: string[];
}

export type SortOption = 'lastName' | 'firstName' | 'totalYears' | 'country' | 'institution';

// Geographic data for visualizations
export interface CountryStats {
  country: string;
  studentCount: number;
  workshopBreakdown: { [workshopId: string]: number };
}

export interface InstitutionStats {
  institution: string;
  country: string;
  studentCount: number;
  workshopBreakdown: { [workshopId: string]: number };
}