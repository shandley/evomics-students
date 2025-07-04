import React, { useState } from 'react';
import type { Filters, SortOption, Workshop } from '../types';

interface FilterPanelProps {
  filters: Filters;
  sortOption: SortOption;
  workshops: { [key: string]: Workshop };
  onFiltersChange: (filters: Filters) => void;
  onSortChange: (sort: SortOption) => void;
  onExport?: () => void;
  totalCount: number;
  filteredCount: number;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  sortOption,
  workshops,
  onFiltersChange,
  onSortChange,
  onExport,
  totalCount,
  filteredCount
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2010 }, (_, i) => 2011 + i);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  
  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Evomics Faculty Alumni',
          text: 'Check out this filtered view of Evomics faculty',
          url: url
        });
      } catch (err) {
        // User cancelled share
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setShowShareTooltip(true);
      setTimeout(() => setShowShareTooltip(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Search Faculty
          </label>
          <div className="relative">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              placeholder="Search by name or topic..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            />
            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Workshop Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Workshop
          </label>
          <select
            value={filters.workshops[0] || ''}
            onChange={(e) => onFiltersChange({
              ...filters,
              workshops: e.target.value ? [e.target.value] : []
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white"
          >
            <option value="">All Workshops</option>
            {Object.values(workshops).map(workshop => (
              <option key={workshop.id} value={workshop.id}>
                {workshop.shortName} - {workshop.name}
              </option>
            ))}
          </select>
        </div>

        {/* Year Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Year
          </label>
          <select
            value={filters.year || ''}
            onChange={(e) => onFiltersChange({
              ...filters,
              year: e.target.value ? parseInt(e.target.value) : null
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white"
          >
            <option value="">All Years</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Sort Options */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Sort by
          </label>
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white font-medium text-sm"
          >
            <option value="lastName">Last Name</option>
            <option value="firstName">First Name</option>
            <option value="participationCount">Years (High to Low)</option>
            <option value="recentYear">Most Recent</option>
            <option value="firstYear">First Year</option>
          </select>
        </div>
      </div>

      {/* Results summary */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <span className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredCount}</span> of <span className="font-semibold text-gray-900">{totalCount}</span> faculty members
          </span>
          
          <div className="flex items-center gap-3">
            {/* Export Button */}
            {onExport && (
              <button
                onClick={onExport}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            )}
            
            {/* Share Button */}
            <div className="relative">
              <button
                onClick={handleShare}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.316C18.114 15.438 18 15.482 18 16c0 .518.114.562.316 1.026m0-2.052a3 3 0 110 2.052m-9.632-6.684A3 3 0 119 12c0-.482-.114-.938-.316-1.342M15 9a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Share
              </button>
              
              {showShareTooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap">
                  Link copied!
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                    <div className="w-2 h-2 bg-gray-900 transform rotate-45"></div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Clear Filters */}
            {(filters.search || filters.workshops.length > 0 || filters.year !== null) && (
              <button
                onClick={() => onFiltersChange({
                  search: '',
                  workshops: [],
                  year: null
                })}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};