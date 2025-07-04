import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { FacultyLocation } from '../utils/geocoding';
import type { Workshop } from '../types';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface FacultyMapProps {
  locations: FacultyLocation[];
  workshops: { [key: string]: Workshop };
  onLocationClick?: (location: FacultyLocation) => void;
}

// Component to automatically fit bounds
function FitBounds({ locations }: { locations: FacultyLocation[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(
        locations.map(loc => [loc.lat, loc.lng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);
  
  return null;
}

export const FacultyMap: React.FC<FacultyMapProps> = ({ 
  locations, 
  workshops,
  onLocationClick 
}) => {
  const [selectedLocation, setSelectedLocation] = useState<FacultyLocation | null>(null);
  
  // Color scheme based on absolute counts
  const getMarkerColor = (count: number) => {
    if (count >= 6) return '#DC2626';  // red-600
    if (count >= 4) return '#F59E0B';   // amber-500
    if (count >= 2) return '#3B82F6';   // blue-500
    return '#10B981'; // emerald-500
  };
  
  const getMarkerSize = (count: number) => {
    // Size based on absolute count
    if (count >= 6) return 25;
    if (count >= 4) return 20;
    if (count >= 2) return 15;
    return 10;
  };
  
  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={[30, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBounds locations={locations} />
        
        {locations.map((location, index) => (
          <CircleMarker
            key={`${location.lat}-${location.lng}-${index}`}
            center={[location.lat, location.lng]}
            radius={getMarkerSize(location.count)}
            fillColor={getMarkerColor(location.count)}
            color="#fff"
            weight={2}
            opacity={1}
            fillOpacity={0.8}
            eventHandlers={{
              click: () => {
                setSelectedLocation(location);
                onLocationClick?.(location);
              },
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-lg mb-1">{location.institution}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {location.city}, {location.country}
                </p>
                <p className="text-sm font-semibold mb-2">
                  {location.count} faculty member{location.count !== 1 ? 's' : ''}
                </p>
                
                {/* Faculty list preview */}
                <div className="mt-2 border-t pt-2">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Faculty:</p>
                  <ul className="text-xs space-y-0.5">
                    {location.faculty.slice(0, 5).map((faculty, idx) => (
                      <li key={idx}>
                        • {faculty.faculty.firstName} {faculty.faculty.lastName}
                      </li>
                    ))}
                    {location.faculty.length > 5 && (
                      <li className="text-gray-500 italic">
                        and {location.faculty.length - 5} more...
                      </li>
                    )}
                  </ul>
                </div>
                
                {/* Workshop breakdown */}
                <div className="mt-2 border-t pt-2">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Workshops:</p>
                  <div className="text-xs space-y-0.5">
                    {(() => {
                      const workshopCounts = new Map<string, number>();
                      location.faculty.forEach(f => {
                        Object.keys(f.participations).forEach(w => {
                          workshopCounts.set(w, (workshopCounts.get(w) || 0) + 1);
                        });
                      });
                      return Array.from(workshopCounts.entries()).map(([wId, count]) => (
                        <div key={wId}>
                          • {workshops[wId]?.shortName || wId}: {count}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg z-[1000]">
        <h4 className="text-sm font-semibold mb-2">Faculty Count</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
            <span className="text-xs">1 faculty member</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span className="text-xs">2-3 faculty members</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500"></div>
            <span className="text-xs">4-5 faculty members</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-600"></div>
            <span className="text-xs">6+ faculty members</span>
          </div>
        </div>
      </div>
    </div>
  );
};