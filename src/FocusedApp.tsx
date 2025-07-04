import React, { useState } from 'react';
import { FocusedStudentStats } from './components/FocusedStudentStats';
import { ExportMenu } from './components/ExportMenu';
import { 
  LazyWorldMap, 
  LazyTimeline, 
  LazyComparisons, 
  LazyAnalytics, 
  LazyHistorical 
} from './components/LazyVisualization';
import { useFocusedStudentData } from './hooks/useFocusedStudentData';
import { useUrlState } from './hooks/useUrlState';


function FocusedApp() {
  const { loading, error, profiles, workshops, allProfiles, allWorkshops } = useFocusedStudentData();
  const { state: urlState, updateUrl, shareCurrentView } = useUrlState();
  
  // Use URL state for visualization toggles
  const showMap = urlState.showMap;
  const showTimeline = urlState.showTimeline;
  const showComparisons = urlState.showComparisons;
  const showDrilldown = urlState.showDrilldown;
  const showInactiveWorkshops = urlState.showInactiveWorkshops;


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
            <div className="flex items-center gap-3">
              <ExportMenu profiles={profiles} workshops={workshops} />
              <button
                onClick={shareCurrentView}
                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg border border-white/20 text-white transition-colors duration-200 flex items-center gap-2"
                title="Share current dashboard view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Share
              </button>
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
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
        {/* Main Stats Dashboard */}
        <FocusedStudentStats profiles={profiles} workshops={workshops} />
        
        {/* Workshop Timeline - moved up from bottom */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Workshop Timeline</h3>
          <div className="mb-4 text-sm text-gray-600">
            2011 - 2024 (14 years of student participation)
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {['wog', 'wpsg', 'wphylo'].map((workshopId) => {
              const workshop = workshops[workshopId];
              // Count unique students for this workshop
              const uniqueStudents = profiles.filter(p => p.participations[workshopId]?.length > 0).length;
              
              // Get year range for this workshop
              const workshopYears = new Set<number>();
              profiles.forEach(profile => {
                if (profile.participations[workshopId]?.length > 0) {
                  profile.participations[workshopId].forEach((year: number) => workshopYears.add(year));
                }
              });
              const years = Array.from(workshopYears).sort();
              
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
                  <div className="text-lg font-bold text-primary-600 mb-2">{uniqueStudents} students</div>
                  
                  {years.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">Active years:</div>
                      <div className="text-xs text-gray-600">
                        {years[0]} - {years[years.length - 1]}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        

        {/* Interactive Visualization Toggle Buttons */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Interactive Visualizations</h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <button
              onClick={() => updateUrl({ showMap: !showMap })}
              className={`flex items-center justify-center px-4 py-3 rounded-lg border transition-all duration-200 ${
                showMap 
                  ? 'bg-blue-100 border-blue-300 text-blue-800' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              World Map
            </button>
            
            <button
              onClick={() => updateUrl({ showTimeline: !showTimeline })}
              className={`flex items-center justify-center px-4 py-3 rounded-lg border transition-all duration-200 ${
                showTimeline 
                  ? 'bg-purple-100 border-purple-300 text-purple-800' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Timeline
            </button>
            
            <button
              onClick={() => updateUrl({ showComparisons: !showComparisons })}
              className={`flex items-center justify-center px-4 py-3 rounded-lg border transition-all duration-200 ${
                showComparisons 
                  ? 'bg-green-100 border-green-300 text-green-800' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              Comparisons
            </button>
            
            <button
              onClick={() => updateUrl({ showDrilldown: !showDrilldown })}
              className={`flex items-center justify-center px-4 py-3 rounded-lg border transition-all duration-200 ${
                showDrilldown 
                  ? 'bg-orange-100 border-orange-300 text-orange-800' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Analytics
            </button>
            
            <button
              onClick={() => updateUrl({ showInactiveWorkshops: !showInactiveWorkshops })}
              className={`flex items-center justify-center px-4 py-3 rounded-lg border transition-all duration-200 ${
                showInactiveWorkshops 
                  ? 'bg-gray-100 border-gray-300 text-gray-800' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Historical
            </button>
          </div>
        </div>

        {/* Interactive Visualizations */}
        {showMap && (
          <div className="mb-6">
            <LazyWorldMap profiles={profiles} workshops={workshops} />
          </div>
        )}

        {showTimeline && (
          <div className="mb-6">
            <LazyTimeline profiles={profiles} workshops={workshops} />
          </div>
        )}

        {showComparisons && (
          <div className="mb-6">
            <LazyComparisons profiles={profiles} workshops={workshops} />
          </div>
        )}

        {showDrilldown && (
          <div className="mb-6">
            <LazyAnalytics profiles={profiles} workshops={workshops} />
          </div>
        )}

        {showInactiveWorkshops && (
          <div className="mb-6">
            <LazyHistorical profiles={allProfiles} workshops={allWorkshops} />
          </div>
        )}

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