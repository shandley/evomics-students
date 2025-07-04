import React, { useMemo, useState, useCallback } from 'react';
import type { EnrichedFacultyProfile, Workshop } from '../types';
import { generateTimelineData, calculateYearChanges, getFacultyCareer } from '../utils/timelineAnalysis';
import type { TimelineData, TimelineYear } from '../utils/timelineAnalysis';

interface TimelineVisualizationProps {
  faculty: EnrichedFacultyProfile[];
  workshops: { [key: string]: Workshop };
  onFacultyClick?: (facultyId: string) => void;
}

export const TimelineVisualization: React.FC<TimelineVisualizationProps> = ({
  faculty,
  workshops,
  onFacultyClick
}) => {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'geographic'>('overview');
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  
  // Generate timeline data
  const timelineData = useMemo(() => 
    generateTimelineData(faculty, workshops), 
    [faculty, workshops]
  );
  
  // Get data for selected year
  const selectedYearData = useMemo(() => {
    if (!selectedYear) return null;
    return timelineData.years.find(y => y.year === selectedYear);
  }, [selectedYear, timelineData]);
  
  // Get previous year data for comparison
  const previousYearData = useMemo(() => {
    if (!selectedYear) return null;
    const index = timelineData.years.findIndex(y => y.year === selectedYear);
    return index > 0 ? timelineData.years[index - 1] : null;
  }, [selectedYear, timelineData]);
  
  // Calculate changes
  const yearChanges = useMemo(() => {
    if (!selectedYearData) return null;
    return calculateYearChanges(selectedYearData, previousYearData);
  }, [selectedYearData, previousYearData]);
  
  // Get selected faculty career
  const selectedFacultyCareer = useMemo(() => {
    if (!selectedFacultyId) return null;
    return getFacultyCareer(selectedFacultyId, faculty);
  }, [selectedFacultyId, faculty]);
  
  // Workshop colors
  const workshopColors: Record<string, string> = {
    wog: '#3B82F6',      // blue
    wpsg: '#8B5CF6',     // purple  
    wphylo: '#10B981',   // green
  };
  
  // Calculate timeline dimensions
  const timelineWidth = 1200;
  const yearWidth = timelineWidth / timelineData.allYears.length;
  const timelineHeight = 200;
  
  // Handle year click
  const handleYearClick = (year: number) => {
    setSelectedYear(year === selectedYear ? null : year);
  };
  
  // Get faculty for a specific year and workshop
  const getFacultyForYearWorkshop = (year: number, workshopId: string) => {
    const yearData = timelineData.years.find(y => y.year === year);
    if (!yearData || !yearData.workshops[workshopId]) return [];
    
    return yearData.workshops[workshopId].faculty.map(id => {
      const profile = faculty.find(f => f.faculty.id === id);
      return profile ? {
        id,
        name: `${profile.faculty.firstName} ${profile.faculty.lastName}`,
        isNew: yearData.workshops[workshopId].newFaculty.includes(id)
      } : null;
    }).filter(Boolean);
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Workshop Timeline</h2>
        <p className="text-gray-600">
          Explore the evolution of Evomics workshops from {timelineData.minYear} to {timelineData.maxYear}
        </p>
      </div>
      
      {/* View Mode Selector */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setViewMode('overview')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            viewMode === 'overview' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setViewMode('geographic')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            viewMode === 'geographic' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Geographic Spread
        </button>
      </div>
      
      {/* Timeline Visualization */}
      <div className="relative overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Year labels */}
          <div className="flex justify-between mb-2 px-2">
            {timelineData.allYears.map((year, index) => (
              <div key={year} className="text-center" style={{ width: yearWidth }}>
                {(index === 0 || year % 5 === 0) && (
                  <span className="text-sm text-gray-600">{year}</span>
                )}
              </div>
            ))}
          </div>
          
          {/* Main timeline */}
          <div className="relative h-64 bg-gray-50 rounded-lg p-4">
            {/* Different views based on mode */}
            {viewMode === 'overview' && (
              <>
                {/* Workshop tracks */}
                {Object.entries(workshops).map((([workshopId, workshop], workshopIndex) => (
              <div 
                key={workshopId} 
                className="absolute w-full"
                style={{ top: `${workshopIndex * 80 + 20}px` }}
              >
                <div className="text-sm font-medium text-gray-700 mb-1">
                  {workshop.shortName}
                </div>
                
                {/* Year blocks */}
                <div className="relative h-12">
                  {timelineData.years.map((yearData, index) => {
                    const workshopData = yearData.workshops[workshopId];
                    if (!workshopData) return null;
                    
                    const barHeight = Math.min(40, Math.max(10, workshopData.totalFaculty * 3));
                    const isSelected = yearData.year === selectedYear;
                    const isHovered = yearData.year === hoveredYear;
                    
                    return (
                      <div
                        key={yearData.year}
                        className="absolute bottom-0 cursor-pointer transition-all duration-200"
                        style={{
                          left: `${index * yearWidth}px`,
                          width: `${yearWidth - 2}px`,
                          height: `${barHeight}px`,
                          backgroundColor: workshopColors[workshopId],
                          opacity: isSelected || isHovered ? 1 : 0.7,
                          transform: `scaleY(${isSelected ? 1.1 : 1})`,
                        }}
                        onClick={() => handleYearClick(yearData.year)}
                        onMouseEnter={() => setHoveredYear(yearData.year)}
                        onMouseLeave={() => setHoveredYear(null)}
                      >
                        {/* New faculty indicator */}
                        {workshopData.newFaculty.length > 0 && (
                          <div 
                            className="absolute top-0 left-0 right-0 bg-yellow-400"
                            style={{ height: `${(workshopData.newFaculty.length / workshopData.totalFaculty) * 100}%` }}
                          />
                        )}
                        
                        {/* Faculty count */}
                        {(isHovered || isSelected) && (
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-1 py-0.5 rounded">
                            {workshopData.totalFaculty}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )))}
            
                {/* COVID-19 indicator for 2021 */}
                {timelineData.years.map((yearData, index) => {
                  if (yearData.year === 2021) {
                    return (
                      <div
                        key="covid-2021"
                        className="absolute top-0 bottom-0"
                        style={{ 
                          left: `${index * yearWidth}px`,
                          width: `${yearWidth}px`
                        }}
                      >
                        <div className="h-full bg-gray-200 opacity-50 border-x border-gray-400" />
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap">
                          <span className="text-xs font-medium text-gray-600 bg-white px-1 rounded">
                            COVID-19
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
                
                {/* Other milestones */}
                {timelineData.years.map((yearData, index) => 
                  yearData.milestones.map((milestone, mIndex) => (
                    <div
                      key={`${yearData.year}-${mIndex}`}
                      className="absolute top-0 w-0.5 h-full bg-red-500"
                      style={{ left: `${index * yearWidth + yearWidth / 2}px` }}
                    >
                      <div 
                        className="absolute left-2 whitespace-nowrap text-xs text-red-600 font-medium"
                        style={{ 
                          top: `${-20 - (mIndex * 15)}px`,
                          transform: index > timelineData.years.length / 2 ? 'translateX(-100%)' : 'none',
                          marginLeft: index > timelineData.years.length / 2 ? '-8px' : '0'
                        }}
                      >
                        {milestone}
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
            
            
            
            {/* Geographic Spread View */}
            {viewMode === 'geographic' && (
              <div className="relative h-full">
                <div className="text-sm font-medium text-gray-700 mb-2">Geographic Expansion</div>
                <div className="relative h-48">
                  {/* Country count over time */}
                  <div className="mb-4">
                    <svg width={timelineWidth} height={120}>
                      {/* COVID-19 indicator */}
                      {timelineData.years.map((yearData, index) => {
                        if (yearData.year === 2021) {
                          return (
                            <rect
                              key="covid-rect-geo"
                              x={index * yearWidth}
                              y={0}
                              width={yearWidth}
                              height={120}
                              fill="#9CA3AF"
                              opacity={0.2}
                            />
                          );
                        }
                        return null;
                      })}
                      
                      <polyline
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2"
                        points={timelineData.years.map((yearData, index) => {
                          const x = index * yearWidth + yearWidth / 2;
                          const y = 120 - (yearData.totals.countryCount / 30) * 100; // Scale to max 30 countries
                          return `${x},${y}`;
                        }).join(' ')}
                      />
                      {timelineData.years.map((yearData, index) => {
                        const x = index * yearWidth + yearWidth / 2;
                        const y = 120 - (yearData.totals.countryCount / 30) * 100;
                        
                        return (
                          <g key={yearData.year}>
                            <circle
                              cx={x}
                              cy={y}
                              r="3"
                              fill="#10B981"
                              className="cursor-pointer"
                              onClick={() => handleYearClick(yearData.year)}
                            />
                            {(hoveredYear === yearData.year || selectedYear === yearData.year) && (
                              <text x={x} y={y - 10} textAnchor="middle" className="text-xs fill-gray-700">
                                {yearData.totals.countryCount}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                  <p className="text-xs text-gray-600">Countries represented</p>
                  
                  {/* Top countries bar */}
                  <div className="mt-4 flex gap-2">
                    {selectedYearData && (() => {
                      const countries = new Map<string, number>();
                      Object.values(selectedYearData.workshops).forEach(workshop => {
                        workshop.countries.forEach((count, country) => {
                          countries.set(country, (countries.get(country) || 0) + count);
                        });
                      });
                      const topCountries = Array.from(countries.entries())
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5);
                      
                      return topCountries.map(([country, count]) => (
                        <div key={country} className="text-xs">
                          <div className="font-medium">{country}</div>
                          <div className="text-gray-500">{count} faculty</div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Cumulative faculty line chart */}
          <div className="mt-6 h-32 relative bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Cumulative Faculty Count
            </div>
            <svg width={timelineWidth} height={80}>
              <polyline
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
                points={timelineData.years.map((yearData, index) => {
                  const x = index * yearWidth + yearWidth / 2;
                  const y = 80 - (yearData.totals.facultyCount / 170) * 70; // Scale to max
                  return `${x},${y}`;
                }).join(' ')}
              />
              {/* Data points */}
              {timelineData.years.map((yearData, index) => {
                const x = index * yearWidth + yearWidth / 2;
                const y = 80 - (yearData.totals.facultyCount / 170) * 70;
                const isSelected = yearData.year === selectedYear;
                
                return (
                  <circle
                    key={yearData.year}
                    cx={x}
                    cy={y}
                    r={isSelected ? 5 : 3}
                    fill="#3B82F6"
                    className="cursor-pointer"
                    onClick={() => handleYearClick(yearData.year)}
                  />
                );
              })}
            </svg>
          </div>
        </div>
      </div>
      
      {/* Selected Year Details */}
      {selectedYearData && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">
            {selectedYearData.year} Overview
          </h3>
          
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-700">
                {selectedYearData.totals.facultyCount}
              </p>
              <p className="text-sm text-blue-600">Total Faculty</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-700">
                {selectedYearData.totals.newFacultyCount}
              </p>
              <p className="text-sm text-green-600">New Faculty</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-700">
                {selectedYearData.totals.workshopCount}
              </p>
              <p className="text-sm text-purple-600">Active Workshops</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-700">
                {selectedYearData.totals.topicCount}
              </p>
              <p className="text-sm text-amber-600">Research Topics</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-700">
                {selectedYearData.totals.countryCount}
              </p>
              <p className="text-sm text-red-600">Countries</p>
            </div>
          </div>
          
          {/* Workshop Details */}
          <div className="space-y-3">
            {Object.entries(selectedYearData.workshops).map(([workshopId, data]) => (
              <div key={workshopId} className="bg-white rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2">
                  {workshops[workshopId].name}
                </h4>
                <div className="text-sm text-gray-600">
                  <p>{data.totalFaculty} faculty ({data.newFaculty.length} new, {data.returningFaculty.length} returning)</p>
                  {data.faculty.length <= 10 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {getFacultyForYearWorkshop(selectedYearData.year, workshopId).map(f => f && (
                        <button
                          key={f.id}
                          onClick={() => {
                            setSelectedFacultyId(f.id);
                            onFacultyClick?.(f.id);
                          }}
                          className={`px-2 py-1 rounded text-xs ${
                            f.isNew 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-700'
                          } hover:bg-opacity-75`}
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Year-over-year changes */}
          {yearChanges && previousYearData && (
            <div className="mt-4 text-sm text-gray-600">
              <p>
                <span className={yearChanges.facultyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {yearChanges.facultyGrowth >= 0 ? '+' : ''}{yearChanges.facultyGrowth}
                </span> faculty from {previousYearData.year}
              </p>
              {yearChanges.facultyRetention > 0 && (
                <p>{yearChanges.facultyRetention.toFixed(0)}% faculty retention</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};