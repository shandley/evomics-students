import React, { useState, useMemo, useEffect } from 'react';
import { StudentCard } from './components/StudentCard';
import { SimpleFilterPanel } from './components/SimpleFilterPanel';
import { StudentStats } from './components/StudentStats';
import { useStudentData } from './hooks/useStudentData';
import { filterStudents, sortStudents } from './utils/studentFilters';
import type { Filters, SortOption } from './types/student';

function StudentApp() {
  const { loading, error, profiles, workshops } = useStudentData();
  
  // Parse URL parameters on initial load
  const getInitialFilters = (): Filters => {
    const params = new URLSearchParams(window.location.search);
    return {
      search: params.get('search') || '',
      workshops: params.get('workshops')?.split(',').filter(Boolean) || [],
      year: params.get('year') ? parseInt(params.get('year')!) : null,
      countries: params.get('countries')?.split(',').filter(Boolean) || [],
      institutions: params.get('institutions')?.split(',').filter(Boolean) || []
    };
  };
  
  const getInitialSort = (): SortOption => {
    const params = new URLSearchParams(window.location.search);
    const sort = params.get('sort');
    return (sort === 'lastName' || sort === 'firstName' || sort === 'totalYears' || 
            sort === 'country' || sort === 'institution') ? sort : 'lastName';
  };
  
  const [filters, setFilters] = useState<Filters>(getInitialFilters());
  const [sortOption, setSortOption] = useState<SortOption>(getInitialSort());

  // Update URL when filters or sort change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.search) params.set('search', filters.search);
    if (filters.workshops.length > 0) params.set('workshops', filters.workshops.join(','));
    if (filters.year) params.set('year', filters.year.toString());
    if (filters.countries.length > 0) params.set('countries', filters.countries.join(','));
    if (filters.institutions.length > 0) params.set('institutions', filters.institutions.join(','));
    if (sortOption !== 'lastName') params.set('sort', sortOption);
    
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [filters, sortOption]);

  const filteredAndSortedProfiles = useMemo(() => {
    const filtered = filterStudents(profiles, filters);
    return sortStudents(filtered, sortOption);
  }, [profiles, filters, sortOption]);

  // CSV Export function
  const exportToCSV = () => {
    const csvContent = [
      // Header
      ['First Name', 'Last Name', 'Institution', 'Country', 'Workshops', 'Years', 'Total Participations'].join(','),
      // Data rows
      ...filteredAndSortedProfiles.map(profile => {
        const workshopList = Object.entries(profile.participations)
          .filter(([_, years]) => years.length > 0)
          .map(([workshopId, years]) => `${workshops[workshopId]?.shortName}(${years.join(';')})`)
          .join('|');
        
        return [
          profile.student.firstName,
          profile.student.lastName,
          `"${profile.student.institution}"`,
          profile.student.country,
          `"${workshopList}"`,
          `${profile.statistics.firstYear}-${profile.statistics.lastYear}`,
          profile.statistics.totalYears
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `evomics-students-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-primary-600 rounded-full animate-spin border-t-transparent absolute top-0"></div>
            </div>
            <div className="text-gray-600 font-medium">Loading student data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="text-red-600 font-medium">Error: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Evomics Student Alumni
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explore our global community of students who have participated in Evomics workshops. 
            Discover the diversity of participants across countries, institutions, and workshop series.
          </p>
        </div>

        {/* Stats Dashboard */}
        <StudentStats profiles={profiles} workshops={workshops} />
        
        {/* Filter Panel */}
        <SimpleFilterPanel
          filters={filters}
          sortOption={sortOption}
          profiles={profiles}
          workshops={workshops}
          onFiltersChange={setFilters}
          onSortChange={setSortOption}
          onExport={exportToCSV}
          totalCount={profiles.length}
          filteredCount={filteredAndSortedProfiles.length}
        />

        {/* Results */}
        {filteredAndSortedProfiles.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your filters to see more results.</p>
            <button
              onClick={() => setFilters({
                search: '',
                workshops: [],
                year: null,
                countries: [],
                institutions: []
              })}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedProfiles.map((profile, index) => (
              <div
                key={profile.student.id}
                style={{ animationDelay: `${Math.min(index * 50, 1000)}ms` }}
                className="animate-slide-up opacity-0"
              >
                <StudentCard
                  profile={profile}
                  workshops={workshops}
                  searchTerm={filters.search}
                />
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p>
            Evomics Student Alumni Directory • {profiles.length} students from {Object.keys(workshops).length} workshop series
          </p>
        </div>
      </div>
    </div>
  );
}

export default StudentApp;