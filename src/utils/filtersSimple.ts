import type { FacultyProfile, Filters, SortOption } from '../types';

export function filterFacultyProfiles(
  profiles: FacultyProfile[],
  filters: Filters
): FacultyProfile[] {
  return profiles.filter(profile => {
    // Search filter - name and institution
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const name = `${profile.faculty.firstName} ${profile.faculty.lastName}`.toLowerCase();
      const institution = profile.faculty.institution?.toLowerCase() || '';
      if (!name.includes(searchTerm) && !institution.includes(searchTerm)) {
        return false;
      }
    }

    // Workshop filter
    if (filters.workshops && filters.workshops.length > 0) {
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
    if (filters.countries && filters.countries.length > 0) {
      if (!filters.countries.includes(profile.faculty.country)) {
        return false;
      }
    }

    // Institution filter
    if (filters.institutions && filters.institutions.length > 0) {
      if (!filters.institutions.includes(profile.faculty.institution)) {
        return false;
      }
    }

    return true;
  });
}

export function sortFacultyProfiles(
  profiles: FacultyProfile[],
  sortOption: SortOption
): FacultyProfile[] {
  const sorted = [...profiles];
  
  switch (sortOption) {
    case 'firstName':
      return sorted.sort((a, b) => 
        a.faculty.firstName.localeCompare(b.faculty.firstName)
      );
    case 'lastName':
      return sorted.sort((a, b) => 
        a.faculty.lastName.localeCompare(b.faculty.lastName)
      );
    case 'totalYears':
      return sorted.sort((a, b) => 
        b.statistics.totalYears - a.statistics.totalYears
      );
    case 'country':
      return sorted.sort((a, b) => 
        a.faculty.country.localeCompare(b.faculty.country)
      );
    case 'institution':
      return sorted.sort((a, b) => 
        a.faculty.institution.localeCompare(b.faculty.institution)
      );
    default:
      return sorted;
  }
}