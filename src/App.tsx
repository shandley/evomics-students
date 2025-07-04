import { useState, useMemo, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { FacultyCard } from './components/FacultyCard';
import { EnhancedFilterPanel } from './components/EnhancedFilterPanel';
import { StatsCards } from './components/StatsCards';
import { FacultyModal } from './components/FacultyModal';
import { GeographicDistribution } from './components/GeographicDistribution';
// import { TopicTaxonomyViewer } from './components/TopicTaxonomyViewer';
import { FacultyNetworkVisualization } from './components/FacultyNetworkVisualization';
import { TimelineVisualization } from './components/TimelineVisualization';
import { useFacultyData } from './hooks/useFacultyData';
import { filterFacultyProfiles, sortFacultyProfiles } from './utils/filtersSimple';
import { exportToCSV, generateFilename } from './utils/export';
import type { Filters, SortOption, EnrichedFacultyProfile } from './types';

function App() {
  const { loading, error, profiles, workshops } = useFacultyData();
  
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
    return (sort === 'lastName' || sort === 'firstName' || sort === 'totalYears') ? sort : 'lastName';
  };
  
  const [filters, setFilters] = useState<Filters>(getInitialFilters());
  const [sortOption, setSortOption] = useState<SortOption>(getInitialSort());
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  // const [showTaxonomy, setShowTaxonomy] = useState(false);
  const [showNetwork, setShowNetwork] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  // Update URL when filters or sort change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.search) params.set('search', filters.search);
    if (filters.workshops.length > 0) params.set('workshops', filters.workshops.join(','));
    if (filters.year) params.set('year', filters.year.toString());
    if (filters.countries && filters.countries.length > 0) params.set('countries', filters.countries.join(','));
    if (filters.institutions && filters.institutions.length > 0) params.set('institutions', filters.institutions.join(','));
    if (sortOption !== 'lastName') params.set('sort', sortOption);
    
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [filters, sortOption]);

  // Use profiles directly (no enrichment data yet for students)
  const enrichedProfiles = useMemo(() => {
    return profiles as EnrichedFacultyProfile[];
  }, [profiles]);

  const filteredAndSortedProfiles = useMemo(() => {
    const filtered = filterFacultyProfiles(enrichedProfiles, filters);
    return sortFacultyProfiles(filtered, sortOption);
  }, [enrichedProfiles, filters, sortOption]);

  // Find selected profile
  const selectedProfile = useMemo(() => {
    if (!selectedFacultyId) return null;
    return enrichedProfiles.find(p => p.faculty.id === selectedFacultyId) || null;
  }, [selectedFacultyId, enrichedProfiles]);

  // Handle navigation between faculty in modal
  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!selectedFacultyId) return;
    
    const currentIndex = filteredAndSortedProfiles.findIndex(p => p.faculty.id === selectedFacultyId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'prev' 
      ? (currentIndex - 1 + filteredAndSortedProfiles.length) % filteredAndSortedProfiles.length
      : (currentIndex + 1) % filteredAndSortedProfiles.length;
    
    setSelectedFacultyId(filteredAndSortedProfiles[newIndex].faculty.id);
  };

  // Stable callback for network visualization
  const handleNetworkFacultyClick = useCallback((facultyId: string) => {
    setSelectedFacultyId(facultyId);
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-primary-600 rounded-full animate-spin border-t-transparent absolute top-0"></div>
          </div>
          <div className="text-gray-600 font-medium">Loading student data...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="text-red-600 font-medium">Error: {error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <StatsCards 
        profiles={enrichedProfiles} 
        workshops={workshops} 
      />
      
      {/* Toggle Buttons */}
      <div className="mb-4 flex justify-end gap-3">
        <button
          onClick={() => setShowTimeline(!showTimeline)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {showTimeline ? 'Hide' : 'Show'} Timeline
        </button>
        <button
          onClick={() => setShowNetwork(!showNetwork)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {showNetwork ? 'Hide' : 'Show'} Student Network
        </button>
        <button
          onClick={() => setShowMap(!showMap)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {showMap ? 'Hide' : 'Show'} Geographic Distribution
        </button>
      </div>
      
      {/* Timeline Visualization */}
      {showTimeline && (
        <TimelineVisualization
          faculty={enrichedProfiles}
          workshops={workshops}
          onFacultyClick={(facultyId) => {
            setSelectedFacultyId(facultyId);
          }}
        />
      )}
      
      {/* Student Network Visualization */}
      {showNetwork && (
        <FacultyNetworkVisualization
          faculty={enrichedProfiles}
          workshops={workshops}
          onFacultyClick={handleNetworkFacultyClick}
        />
      )}
      
      
      {/* Geographic Distribution Map */}
      {showMap && (
        <GeographicDistribution 
          faculty={enrichedProfiles}
          workshops={workshops}
        />
      )}
      
      <EnhancedFilterPanel
        filters={filters}
        sortOption={sortOption}
        workshops={workshops}
        onFiltersChange={setFilters}
        onSortChange={setSortOption}
        onExport={() => {
          const filename = generateFilename(filters);
          exportToCSV(filteredAndSortedProfiles, workshops, filename);
        }}
        totalCount={profiles.length}
        filteredCount={filteredAndSortedProfiles.length}
      />

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
              key={profile.faculty.id}
              style={{ animationDelay: `${index * 50}ms` }}
              className="animate-slide-up"
            >
              <FacultyCard
                profile={profile}
                workshops={workshops}
                onClick={() => setSelectedFacultyId(profile.faculty.id)}
                searchTerm={filters.search}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Faculty Modal */}
      <FacultyModal
        profile={selectedProfile}
        workshops={workshops}
        isOpen={!!selectedFacultyId}
        onClose={() => setSelectedFacultyId(null)}
        onNavigate={handleNavigate}
      />
    </Layout>
  );
}

export default App;