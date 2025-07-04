import type { StudentProfile, Filters, SortOption } from '../types/student';

export function filterStudents(
  profiles: StudentProfile[],
  filters: Filters
): StudentProfile[] {
  return profiles.filter(profile => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const name = `${profile.student.firstName} ${profile.student.lastName}`.toLowerCase();
      const institution = profile.student.institution.toLowerCase();
      const country = profile.student.country.toLowerCase();
      
      if (!name.includes(searchTerm) && 
          !institution.includes(searchTerm) && 
          !country.includes(searchTerm)) {
        return false;
      }
    }

    // Workshop filter
    if (filters.workshops.length > 0) {
      const hasMatchingWorkshop = filters.workshops.some(workshopId => 
        profile.participations[workshopId] && profile.participations[workshopId].length > 0
      );
      if (!hasMatchingWorkshop) {
        return false;
      }
    }

    // Year filter
    if (filters.year) {
      const hasYearParticipation = Object.values(profile.participations).some(years => 
        years.includes(filters.year!)
      );
      if (!hasYearParticipation) {
        return false;
      }
    }

    // Country filter
    if (filters.countries.length > 0) {
      if (!filters.countries.includes(profile.student.country)) {
        return false;
      }
    }

    // Institution filter
    if (filters.institutions.length > 0) {
      if (!filters.institutions.includes(profile.student.institution)) {
        return false;
      }
    }

    return true;
  });
}

export function sortStudents(
  profiles: StudentProfile[],
  sortOption: SortOption
): StudentProfile[] {
  const sorted = [...profiles];
  
  switch (sortOption) {
    case 'firstName':
      return sorted.sort((a, b) => 
        a.student.firstName.localeCompare(b.student.firstName)
      );
    case 'lastName':
      return sorted.sort((a, b) => 
        a.student.lastName.localeCompare(b.student.lastName)
      );
    case 'totalYears':
      return sorted.sort((a, b) => 
        b.statistics.totalYears - a.statistics.totalYears
      );
    case 'country':
      return sorted.sort((a, b) => 
        a.student.country.localeCompare(b.student.country)
      );
    case 'institution':
      return sorted.sort((a, b) => 
        a.student.institution.localeCompare(b.student.institution)
      );
    default:
      return sorted;
  }
}