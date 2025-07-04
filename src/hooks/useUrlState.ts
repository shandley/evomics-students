import { useState, useEffect, useCallback } from 'react';

interface UrlState {
  showMap: boolean;
  showTimeline: boolean;
  showComparisons: boolean;
  showDrilldown: boolean;
  showInactiveWorkshops: boolean;
  selectedWorkshop?: string;
  selectedYear?: number;
}

const DEFAULT_STATE: UrlState = {
  showMap: false,
  showTimeline: false,
  showComparisons: false,
  showDrilldown: false,
  showInactiveWorkshops: false
};

export function useUrlState() {
  const [state, setState] = useState<UrlState>(DEFAULT_STATE);

  // Read URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newState: UrlState = { ...DEFAULT_STATE };

    // Parse visualization toggles
    if (params.get('map') === 'true') newState.showMap = true;
    if (params.get('timeline') === 'true') newState.showTimeline = true;
    if (params.get('comparisons') === 'true') newState.showComparisons = true;
    if (params.get('analytics') === 'true') newState.showDrilldown = true;
    if (params.get('historical') === 'true') newState.showInactiveWorkshops = true;

    // Parse filters
    if (params.get('workshop')) newState.selectedWorkshop = params.get('workshop')!;
    if (params.get('year')) newState.selectedYear = parseInt(params.get('year')!);

    setState(newState);
  }, []);

  // Update URL when state changes
  const updateUrl = useCallback((newState: Partial<UrlState>) => {
    const updatedState = { ...state, ...newState };
    setState(updatedState);

    const params = new URLSearchParams();

    // Add visualization toggles
    if (updatedState.showMap) params.set('map', 'true');
    if (updatedState.showTimeline) params.set('timeline', 'true');
    if (updatedState.showComparisons) params.set('comparisons', 'true');
    if (updatedState.showDrilldown) params.set('analytics', 'true');
    if (updatedState.showInactiveWorkshops) params.set('historical', 'true');

    // Add filters
    if (updatedState.selectedWorkshop) params.set('workshop', updatedState.selectedWorkshop);
    if (updatedState.selectedYear) params.set('year', updatedState.selectedYear.toString());

    // Update URL without triggering navigation
    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [state]);

  // Share current state
  const shareCurrentView = useCallback(() => {
    const url = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: 'Evomics Student Alumni Dashboard',
        text: 'Check out this view of the Evomics student alumni data',
        url: url
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(url).then(() => {
        // Could add toast notification here
        console.log('URL copied to clipboard');
      });
    }
  }, []);

  // Generate shareable URL for specific state
  const generateShareUrl = useCallback((shareState: Partial<UrlState>) => {
    const params = new URLSearchParams();
    const fullState = { ...state, ...shareState };

    if (fullState.showMap) params.set('map', 'true');
    if (fullState.showTimeline) params.set('timeline', 'true');
    if (fullState.showComparisons) params.set('comparisons', 'true');
    if (fullState.showDrilldown) params.set('analytics', 'true');
    if (fullState.showInactiveWorkshops) params.set('historical', 'true');
    if (fullState.selectedWorkshop) params.set('workshop', fullState.selectedWorkshop);
    if (fullState.selectedYear) params.set('year', fullState.selectedYear.toString());

    return `${window.location.origin}${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
  }, [state]);

  return {
    state,
    updateUrl,
    shareCurrentView,
    generateShareUrl
  };
}