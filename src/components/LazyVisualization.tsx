import React, { Suspense, lazy } from 'react';
import type { StudentProfile, Workshop } from '../types/student';

// Lazy load visualization components
const InteractiveWorldMap = lazy(() => 
  import('./InteractiveWorldMap').then(module => ({ default: module.InteractiveWorldMap }))
);

const InteractiveTimeline = lazy(() => 
  import('./InteractiveTimeline').then(module => ({ default: module.InteractiveTimeline }))
);

const WorkshopComparisons = lazy(() => 
  import('./WorkshopComparisons').then(module => ({ default: module.WorkshopComparisons }))
);

const DrilldownAnalytics = lazy(() => 
  import('./DrilldownAnalytics').then(module => ({ default: module.DrilldownAnalytics }))
);

const InactiveWorkshopsInfo = lazy(() => 
  import('./InactiveWorkshopsInfo').then(module => ({ default: module.InactiveWorkshopsInfo }))
);

interface VisualizationProps {
  profiles: StudentProfile[];
  workshops: { [key: string]: Workshop };
}

const LoadingSpinner = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
    <div className="flex items-center justify-center h-64">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
        <div className="w-12 h-12 border-4 border-blue-500 rounded-full animate-spin border-t-transparent absolute top-0"></div>
      </div>
      <span className="ml-4 text-gray-600">Loading visualization...</span>
    </div>
  </div>
);

export const LazyWorldMap: React.FC<VisualizationProps> = (props) => (
  <Suspense fallback={<LoadingSpinner />}>
    <InteractiveWorldMap {...props} />
  </Suspense>
);

export const LazyTimeline: React.FC<VisualizationProps> = (props) => (
  <Suspense fallback={<LoadingSpinner />}>
    <InteractiveTimeline {...props} />
  </Suspense>
);

export const LazyComparisons: React.FC<VisualizationProps> = (props) => (
  <Suspense fallback={<LoadingSpinner />}>
    <WorkshopComparisons {...props} />
  </Suspense>
);

export const LazyAnalytics: React.FC<VisualizationProps> = (props) => (
  <Suspense fallback={<LoadingSpinner />}>
    <DrilldownAnalytics {...props} />
  </Suspense>
);

export const LazyHistorical: React.FC<VisualizationProps> = (props) => (
  <Suspense fallback={<LoadingSpinner />}>
    <InactiveWorkshopsInfo {...props} />
  </Suspense>
);