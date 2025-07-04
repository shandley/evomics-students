import React, { useMemo } from 'react';
import type { Filters, SortOption, Workshop, StudentProfile } from '../types/student';

interface SimpleFilterPanelProps {
  filters: Filters;
  sortOption: SortOption;
  profiles: StudentProfile[];
  workshops: { [key: string]: Workshop };
  onFiltersChange: (filters: Filters) => void;
  onSortChange: (sort: SortOption) => void;
  onExport?: () => void;
  totalCount: number;
  filteredCount: number;
}

export const SimpleFilterPanel: React.FC<SimpleFilterPanelProps> = ({
  filters,
  sortOption,
  profiles,
  workshops,
  onFiltersChange,
  onSortChange,
  onExport,
  totalCount,
  filteredCount
}) => {
  // Extract unique values for filter dropdowns
  const { countries, institutions, years } = useMemo(() => {
    const countriesSet = new Set<string>();
    const institutionsSet = new Set<string>();
    const yearsSet = new Set<number>();

    profiles.forEach(profile => {
      countriesSet.add(profile.student.country);
      institutionsSet.add(profile.student.institution);
      
      Object.values(profile.participations).forEach(years => {
        years.forEach(year => yearsSet.add(year));
      });
    });

    return {
      countries: Array.from(countriesSet).sort(),
      institutions: Array.from(institutionsSet).sort(),
      years: Array.from(yearsSet).sort((a, b) => b - a) // Most recent first
    };
  }, [profiles]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, search: e.target.value });
  };

  const handleWorkshopToggle = (workshopId: string) => {
    const newWorkshops = filters.workshops.includes(workshopId)
      ? filters.workshops.filter(id => id !== workshopId)
      : [...filters.workshops, workshopId];
    onFiltersChange({ ...filters, workshops: newWorkshops });
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = e.target.value ? parseInt(e.target.value) : null;
    onFiltersChange({ ...filters, year });
  };

  const handleCountryToggle = (country: string) => {
    const newCountries = filters.countries.includes(country)
      ? filters.countries.filter(c => c !== country)
      : [...filters.countries, country];
    onFiltersChange({ ...filters, countries: newCountries });
  };

  const handleInstitutionToggle = (institution: string) => {
    const newInstitutions = filters.institutions.includes(institution)
      ? filters.institutions.filter(i => i !== institution)
      : [...filters.institutions, institution];
    onFiltersChange({ ...filters, institutions: newInstitutions });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      workshops: [],
      year: null,
      countries: [],
      institutions: []
    });
  };

  const hasActiveFilters = filters.search || filters.workshops.length > 0 || 
    filters.year || filters.countries.length > 0 || filters.institutions.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      {/* Search and Sort Row */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search students, institutions..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Sort */}
        <div className="lg:w-48">
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="lastName">Sort by Last Name</option>
            <option value="firstName">Sort by First Name</option>
            <option value="country">Sort by Country</option>
            <option value="institution">Sort by Institution</option>
            <option value="totalYears">Sort by Participation</option>
          </select>
        </div>
      </div>

      {/* Filter Chips Row */}
      <div className="flex flex-wrap gap-4 mb-4">
        {/* Workshop Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Workshops</label>
          <div className="flex flex-wrap gap-2">
            {Object.values(workshops).map(workshop => (
              <button
                key={workshop.id}
                onClick={() => handleWorkshopToggle(workshop.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.workshops.includes(workshop.id)
                    ? 'bg-primary-100 text-primary-800 border border-primary-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {workshop.shortName}
              </button>
            ))}
          </div>
        </div>

        {/* Year Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
          <select
            value={filters.year || ''}
            onChange={handleYearChange}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Years</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced Filters (Collapsible) */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-primary-600 mb-3">
          Advanced Filters
          <span className="ml-1 group-open:rotate-90 transition-transform inline-block">▶</span>
        </summary>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Countries */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Countries ({filters.countries.length} selected)
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
              {countries.map(country => (
                <label key={country} className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={filters.countries.includes(country)}
                    onChange={() => handleCountryToggle(country)}
                    className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  {country}
                </label>
              ))}
            </div>
          </div>

          {/* Institutions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Institutions ({filters.institutions.length} selected)
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
              {institutions.slice(0, 20).map(institution => (
                <label key={institution} className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={filters.institutions.includes(institution)}
                    onChange={() => handleInstitutionToggle(institution)}
                    className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="truncate" title={institution}>{institution}</span>
                </label>
              ))}
              {institutions.length > 20 && (
                <p className="text-xs text-gray-500 pt-1">
                  Showing first 20 institutions. Use search to find more.
                </p>
              )}
            </div>
          </div>
        </div>
      </details>

      {/* Results and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Showing <span className="font-medium">{filteredCount}</span> of{' '}
          <span className="font-medium">{totalCount}</span> students
        </div>
        
        <div className="flex gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          )}
          
          {onExport && (
            <button
              onClick={onExport}
              className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Export CSV
            </button>
          )}
        </div>
      </div>
    </div>
  );
};