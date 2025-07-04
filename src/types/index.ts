// Core data types for the student alumni system

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  institution: string;
  country: string;
  email?: string;
  currentPosition?: string;
  website?: string;
  orcid?: string;
  photo?: string;
  bio?: string;
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

export interface StudentParticipation {
  studentId: string;
  workshopId: string;
  year: number;
  location: string;
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
  year: number | null;  // null means "All Years"
  countries?: string[];  // Selected countries
  institutions?: string[];  // Selected institutions
}

export type SortOption = 'lastName' | 'firstName' | 'totalYears' | 'country' | 'institution';

// Student enrichment data (simplified from faculty version)
export interface StudentEnrichment {
  lastUpdated: string;
  confidence: 'high' | 'medium' | 'low';
  career?: {
    currentPosition?: string;
    currentInstitution?: string;
    careerStage?: 'student' | 'postdoc' | 'faculty' | 'industry' | 'government';
  };
  academic?: {
    orcid?: string;
    linkedIn?: string;
    researchAreas?: string[];
  };
  profile?: {
    photoUrl?: string;
    shortBio?: string;
    source?: string;
  };
}

export interface EnrichedStudentProfile extends StudentProfile {
  enrichment?: StudentEnrichment;
}

// Legacy aliases for compatibility with existing components
export type Faculty = Student;
export type FacultyProfile = StudentProfile;
export type FacultyEnrichment = StudentEnrichment;
export type EnrichedFacultyProfile = EnrichedStudentProfile;

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