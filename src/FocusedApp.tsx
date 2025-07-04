import React, { useState, useMemo } from 'react';
import { FocusedStudentStats } from './components/FocusedStudentStats';
import { useFocusedStudentData } from './hooks/useFocusedStudentData';
import { filterStudents } from './utils/studentFilters';
import type { Filters } from './types/student';

// Geographic and participation insights for focused workshops
const FocusedInsights: React.FC<{
  profiles: any[];
  workshops: any;
  filters: Filters;
}> = ({ profiles, workshops, filters }) => {
  const filteredProfiles = useMemo(() => 
    filterStudents(profiles, filters), [profiles, filters]
  );

  const insights = useMemo(() => {
    const countryStats: { [country: string]: number } = {};
    const yearStats: { [year: number]: number } = {};
    const workshopYearStats: { [workshopId: string]: { [year: number]: number } } = {};
    
    filteredProfiles.forEach(profile => {
      countryStats[profile.student.country] = (countryStats[profile.student.country] || 0) + 1;
      
      Object.entries(profile.participations).forEach(([workshopId, years]: [string, number[]]) => {
        if (!workshopYearStats[workshopId]) workshopYearStats[workshopId] = {};
        years.forEach(year => {
          yearStats[year] = (yearStats[year] || 0) + 1;
          workshopYearStats[workshopId][year] = (workshopYearStats[workshopId][year] || 0) + 1;
        });
      });
    });

    return {
      totalStudents: filteredProfiles.length,
      uniqueCountries: new Set(filteredProfiles.map(p => p.student.country)).size,
      uniqueInstitutions: new Set(filteredProfiles.map(p => p.student.institution)).size,
      topCountries: Object.entries(countryStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8),
      yearRange: Object.keys(yearStats).length > 0 ? {
        earliest: Math.min(...Object.keys(yearStats).map(Number)),
        latest: Math.max(...Object.keys(yearStats).map(Number))
      } : null,
      workshopYearStats
    };
  }, [filteredProfiles]);

  return (
    <div className="space-y-6">
      {/* Geographic Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Reach</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Top Countries</h4>
            <div className="space-y-2">
              {insights.topCountries.map(([country, count], index) => (
                <div key={country} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{index + 1}. {country}</span>
                  <span className="font-medium text-primary-600">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{insights.uniqueCountries}</div>
              <div className="text-sm text-blue-700">Countries</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{insights.uniqueInstitutions}</div>
              <div className="text-sm text-purple-700">Institutions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Workshop Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Workshop Timeline</h3>
        {insights.yearRange && (
          <div className="mb-4 text-sm text-gray-600">
            {insights.yearRange.earliest} - {insights.yearRange.latest} 
            ({insights.yearRange.latest - insights.yearRange.earliest + 1} years of student participation)
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {['wog', 'wpsg', 'wphylo'].map((workshopId) => {
            const workshop = workshops[workshopId];
            const workshopData = insights.workshopYearStats[workshopId] || {};
            const years = Object.keys(workshopData).map(Number).sort();
            const totalParticipants = Object.values(workshopData).reduce((a: number, b: number) => a + b, 0);
            
            const colorMap = {
              'wog': 'border-blue-200 bg-blue-50',
              'wpsg': 'border-purple-200 bg-purple-50', 
              'wphylo': 'border-green-200 bg-green-50'
            };
            
            return (
              <div key={workshopId} className={`border rounded-lg p-4 ${colorMap[workshopId as keyof typeof colorMap]}`}>
                <h4 className="font-medium text-gray-900 mb-2">{workshop?.shortName}</h4>
                <div className="text-sm text-gray-600 mb-3" title={workshop?.name}>
                  {workshop?.name}
                </div>
                <div className="text-lg font-bold text-primary-600 mb-2">{totalParticipants} students</div>
                
                {years.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">Active years:</div>
                    <div className="text-xs text-gray-600">
                      {years[0]} - {years[years.length - 1]}
                    </div>
                    <div className="text-xs text-gray-600">
                      Peak: {Math.max(...Object.values(workshopData))} students ({Object.entries(workshopData).find(([_, count]) => count === Math.max(...Object.values(workshopData)))?.[0]})
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function FocusedApp() {
  const { loading, error, profiles, workshops } = useFocusedStudentData();
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    workshops: [],
    year: null,
    countries: [],
    institutions: []
  });

  // Simple filter controls for focused workshops
  const FilterControls: React.FC = () => {
    const { years } = useMemo(() => {
      const yearsSet = new Set<number>();
      profiles.forEach(profile => {
        Object.values(profile.participations).forEach((years: number[]) => {
          years.forEach(year => yearsSet.add(year));
        });
      });
      return {
        years: Array.from(yearsSet).sort((a, b) => b - a)
      };
    }, []);

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Statistics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Workshop Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Workshops</label>
            <div className="space-y-2">
              {Object.values(workshops).map((workshop: any) => (
                <label key={workshop.id} className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={filters.workshops.includes(workshop.id)}
                    onChange={(e) => {
                      const newWorkshops = e.target.checked
                        ? [...filters.workshops, workshop.id]
                        : filters.workshops.filter(id => id !== workshop.id);
                      setFilters({ ...filters, workshops: newWorkshops });
                    }}
                    className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  {workshop.shortName}
                </label>
              ))}
            </div>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={filters.year || ''}
              onChange={(e) => setFilters({ ...filters, year: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Results Summary */}
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium text-primary-600">{filterStudents(profiles, filters).length}</span> of{' '}
              <span className="font-medium">{profiles.length}</span> students
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => setFilters({
                search: '',
                workshops: [],
                year: null,
                countries: [],
                institutions: []
              })}
              className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-white/20 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-white rounded-full animate-spin border-t-transparent absolute top-0"></div>
            </div>
            <div className="text-white font-medium">Loading student data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="text-white font-medium">Error: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header matching faculty site exactly */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-4">
                Evomics Student Alumni
              </h1>
              <p className="text-xl text-blue-100 max-w-3xl">
                Celebrating the global community of students who have shaped genomics education worldwide
              </p>
            </div>
            <a
              href="https://evomics.org"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg border border-white/20 text-white transition-colors duration-200 flex items-center gap-2"
            >
              evomics.org
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
        {/* Main Stats Dashboard */}
        <FocusedStudentStats profiles={profiles} workshops={workshops} />
        
        {/* Filter Controls */}
        <FilterControls />
        
        {/* Focused Insights */}
        <FocusedInsights 
          profiles={profiles} 
          workshops={workshops} 
          filters={filters}
        />

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm bg-white rounded-lg p-6">
          <p>
            Evomics Student Alumni • {profiles.length} students from core workshop series
          </p>
          <p className="mt-2 text-xs">
            Focused on Workshop on Genomics, Workshop on Population and Speciation Genomics, and Workshop on Phylogenomics
          </p>
          <p className="mt-1 text-xs">
            Aggregate data only - individual student information is not displayed for privacy protection
          </p>
        </div>
      </div>
    </div>
  );
}

export default FocusedApp;