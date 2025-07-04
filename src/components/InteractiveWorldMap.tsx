import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { StudentProfile } from '../types/student';

// Country coordinates for visualization (major countries)
const COUNTRY_COORDINATES: { [key: string]: [number, number] } = {
  'USA': [39.8283, -98.5795],
  'United States': [39.8283, -98.5795],
  'Canada': [56.1304, -106.3468],
  'UK': [55.3781, -3.4360],
  'United Kingdom': [55.3781, -3.4360],
  'Germany': [51.1657, 10.4515],
  'France': [46.2276, 2.2137],
  'Italy': [41.8719, 12.5674],
  'Spain': [40.4637, -3.7492],
  'Netherlands': [52.1326, 5.2913],
  'Sweden': [60.1282, 18.6435],
  'Norway': [60.4720, 8.4689],
  'Denmark': [56.2639, 9.5018],
  'Finland': [61.9241, 25.7482],
  'Switzerland': [46.8182, 8.2275],
  'Austria': [47.5162, 14.5501],
  'Belgium': [50.5039, 4.4699],
  'Czech Republic': [49.8175, 15.4730],
  'Poland': [51.9194, 19.1451],
  'Slovakia': [48.6690, 19.6990],
  'Slovenia': [46.1512, 14.9955],
  'Hungary': [47.1625, 19.5033],
  'Croatia': [45.1000, 15.2000],
  'Serbia': [44.0165, 21.0059],
  'Greece': [39.0742, 21.8243],
  'Portugal': [39.3999, -8.2245],
  'Ireland': [53.4129, -8.2439],
  'Iceland': [64.9631, -19.0208],
  'Estonia': [58.5953, 25.0136],
  'Latvia': [56.8796, 24.6032],
  'Lithuania': [55.1694, 23.8813],
  'Belarus': [53.7098, 27.9534],
  'Russia': [61.5240, 105.3188],
  'Ukraine': [48.3794, 31.1656],
  'Turkey': [38.9637, 35.2433],
  'Japan': [36.2048, 138.2529],
  'China': [35.8617, 104.1954],
  'South Korea': [35.9078, 127.7669],
  'Korea': [35.9078, 127.7669],
  'India': [20.5937, 78.9629],
  'Australia': [-25.2744, 133.7751],
  'New Zealand': [-40.9006, 174.8860],
  'Brazil': [-14.2350, -51.9253],
  'Brasil': [-14.2350, -51.9253],
  'Argentina': [-38.4161, -63.6167],
  'Chile': [-35.6751, -71.5430],
  'Colombia': [4.5709, -74.2973],
  'Mexico': [23.6345, -102.5528],
  'Guatemala': [15.7835, -90.2308],
  'Panama': [8.5380, -80.7821],
  'Ecuador': [-1.8312, -78.1834],
  'South Africa': [-30.5595, 22.9375],
  'Egypt': [26.0975, 30.0444],
  'Nigeria': [9.0820, 8.6753],
  'Ghana': [7.9465, -1.0232],
  'Kenya': [-0.0236, 37.9062],
  'Ethiopia': [9.1450, 40.4897],
  'Uganda': [1.3733, 32.2903],
  'Tanzania': [-6.3690, 34.8888],
  'Madagascar': [-18.7669, 46.8691],
  'Mauritius': [-20.3484, 57.5522],
  'Zambia': [-13.1339, 27.8493],
  'Malawi': [-13.2543, 34.3015],
  'Israel': [31.0461, 34.8516],
  'Lebanon': [33.8547, 35.8623],
  'Saudi Arabia': [23.8859, 45.0792],
  'United Arab Emirates': [23.4241, 53.8478],
  'Kuwait': [29.3117, 47.4818],
  'Qatar': [25.3548, 51.1839],
  'Iran': [32.4279, 53.6880],
  'Thailand': [15.8700, 100.9925],
  'Singapore': [1.3521, 103.8198],
  'Malaysia': [4.2105, 101.9758],
  'Philippines': [12.8797, 121.7740],
  'Indonesia': [-0.7893, 113.9213],
  'Bangladesh': [23.6850, 90.3563],
  'Pakistan': [30.3753, 69.3451],
  'Nepal': [28.3949, 84.1240],
  'Taiwan': [23.6978, 120.9605],
  'Cyprus': [35.1264, 33.4299],
  'Georgia': [42.3154, 43.3569],
  'Armenia': [40.0691, 45.0382],
  'Azerbaijan': [40.1431, 47.5769],
  'Kazakhstan': [48.0196, 66.9237],
  'Uzbekistan': [41.3775, 64.5853],
  'Mongolia': [46.8625, 103.8467],
  'Cuba': [21.5218, -77.7812],
  'Jamaica': [18.1096, -77.2975],
  'Costa Rica': [9.7489, -83.7534],
  'Venezuela': [6.4238, -66.5897],
  'Peru': [-9.1900, -75.0152],
  'Bolivia': [-16.2902, -63.5887],
  'Paraguay': [-23.4425, -58.4438],
  'Uruguay': [-32.5228, -55.7658],
  'Eswatini': [-26.5225, 31.4659]
};

interface InteractiveWorldMapProps {
  profiles: StudentProfile[];
  workshops: { [key: string]: any };
}

export const InteractiveWorldMap: React.FC<InteractiveWorldMapProps> = ({ 
  profiles, 
  workshops 
}) => {
  const mapData = useMemo(() => {
    const countryStats: { [country: string]: {
      total: number;
      workshops: { [workshopId: string]: number };
      coordinates?: [number, number];
    }} = {};

    profiles.forEach(profile => {
      const country = profile.student.country;
      if (!countryStats[country]) {
        countryStats[country] = {
          total: 0,
          workshops: {},
          coordinates: COUNTRY_COORDINATES[country]
        };
      }
      
      countryStats[country].total++;
      
      Object.keys(profile.participations).forEach(workshopId => {
        if (profile.participations[workshopId].length > 0) {
          countryStats[country].workshops[workshopId] = 
            (countryStats[country].workshops[workshopId] || 0) + 1;
        }
      });
    });

    return Object.entries(countryStats)
      .filter(([_, data]) => data.coordinates)
      .map(([country, data]) => ({
        country,
        ...data
      }));
  }, [profiles]);

  const getMarkerSize = (count: number) => {
    const maxCount = Math.max(...mapData.map(d => d.total));
    return Math.max(8, Math.min(40, (count / maxCount) * 40));
  };

  const getMarkerColor = (data: any) => {
    const workshopIds = Object.keys(data.workshops);
    if (workshopIds.length === 1) {
      const workshopId = workshopIds[0];
      switch (workshopId) {
        case 'wog': return '#2563eb'; // Blue
        case 'wpsg': return '#9333ea'; // Purple
        case 'wphylo': return '#059669'; // Green
        default: return '#6b7280'; // Gray
      }
    }
    return '#f59e0b'; // Orange for multiple workshops
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Global Student Distribution</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span>WoG only</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-600"></div>
            <span>WPSG only</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
            <span>WPhylo only</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Multiple</span>
          </div>
        </div>
      </div>
      
      <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {mapData.map((data) => (
            <CircleMarker
              key={data.country}
              center={data.coordinates!}
              radius={getMarkerSize(data.total)}
              fillColor={getMarkerColor(data)}
              color="#ffffff"
              weight={2}
              opacity={0.8}
              fillOpacity={0.6}
            >
              <Popup>
                <div className="p-2">
                  <h4 className="font-semibold text-gray-900 mb-2">{data.country}</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>{data.total}</strong> students
                  </p>
                  
                  <div className="space-y-1">
                    {Object.entries(data.workshops).map(([workshopId, count]) => {
                      const workshop = workshops[workshopId];
                      return (
                        <div key={workshopId} className="flex justify-between text-sm">
                          <span className="text-gray-600">{workshop?.shortName}:</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>
          Bubble size represents total students. Colors indicate workshop participation patterns.
          Click bubbles for detailed breakdown by workshop.
        </p>
      </div>
    </div>
  );
};