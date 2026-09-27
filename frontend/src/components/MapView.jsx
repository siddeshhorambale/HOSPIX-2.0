import React from 'react';
import { MapPin, Navigation, Building2 } from 'lucide-react';

export const MapView = ({ venueCity = 'Thane', providers = [] }) => {
  // Predefined Hub coordinates
  const cityCoords = {
    Thane: { x: 48, y: 38, name: 'Thane Hub' },
    Mulund: { x: 42, y: 52, name: 'Mulund Hub' },
    Bhiwandi: { x: 74, y: 22, name: 'Bhiwandi Hub' },
    'Navi Mumbai': { x: 62, y: 78, name: 'Navi Mumbai Hub' },
    Vashi: { x: 58, y: 72, name: 'Vashi Hub' },
  };

  const venuePos = cityCoords[venueCity] || cityCoords['Thane'];

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner relative p-4 select-none">
      {/* Map header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-2">
          <Navigation className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Mumbai Metropolitan Regional Hubs
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          Geographic Distance Optimization
        </span>
      </div>

      {/* SVG Canvas Map Schematic */}
      <div className="relative w-full h-56 bg-slate-950/80 rounded-lg overflow-hidden border border-slate-800/80">
        {/* Grid lines */}
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 divide-x divide-y divide-slate-800/30 pointer-events-none">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="border-slate-800/20" />
          ))}
        </div>

        {/* Connecting Lines between Venue and Providers */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {providers.map((p, idx) => {
            const pPos = cityCoords[p.provider_city] || { x: 50 + idx * 8, y: 50 };
            return (
              <line
                key={idx}
                x1={`${venuePos.x}%`}
                y1={`${venuePos.y}%`}
                x2={`${pPos.x}%`}
                y2={`${pPos.y}%`}
                stroke="#3B82F6"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="opacity-60"
              />
            );
          })}
        </svg>

        {/* Venue Pin */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center group cursor-pointer"
          style={{ left: `${venuePos.x}%`, top: `${venuePos.y}%` }}
        >
          <div className="w-7 h-7 rounded-full bg-rose-500 border-2 border-white shadow-lg flex items-center justify-center text-white animate-bounce">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-white bg-slate-900/90 px-1.5 py-0.5 rounded border border-rose-500/50 mt-1 whitespace-nowrap shadow-sm">
            Venue: {venueCity}
          </span>
        </div>

        {/* Provider Pins */}
        {Object.entries(cityCoords).map(([city, coord]) => {
          const isVenue = city === venueCity;
          if (isVenue) return null;

          const prov = providers.find((p) => p.provider_city === city);
          const isProvider = Boolean(prov);

          return (
            <div
              key={city}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center"
              style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
            >
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center shadow-md transition-transform ${
                  isProvider
                    ? 'bg-blue-600 border-white text-white scale-110'
                    : 'bg-slate-800 border-slate-600 text-slate-400'
                }`}
              >
                <Building2 className="w-3 h-3" />
              </div>
              <span
                className={`text-[9px] px-1 py-0.5 rounded mt-1 font-medium whitespace-nowrap ${
                  isProvider
                    ? 'bg-blue-950 text-blue-200 border border-blue-700'
                    : 'bg-slate-900 text-slate-400'
                }`}
              >
                {prov ? prov.provider_name : city}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>Event Venue</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            <span>Matched Supplier Hub</span>
          </span>
        </div>
        <span>Thane / Mulund Corridor</span>
      </div>
    </div>
  );
};
