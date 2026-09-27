import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export const WeatherMap = ({
  eventLocation,
  providers = [],
  impactRadiusKm = 3.5,
  rainfallMm = 0,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const defaultLat = eventLocation?.latitude || 19.2183;
    const defaultLon = eventLocation?.longitude || 72.9781;

    // Initialize Map instance once
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLon],
        zoom: 12,
        zoomControl: false, // Relocate zoom controls to bottom-right to prevent legend collision
        scrollWheelZoom: false,
      });

      // Standard OpenStreetMap free raster tile layer (No API key required, zero watermarks)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
      }).addTo(map);

      // Add Zoom Control to Bottom-Right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
      layerGroupRef.current = L.layerGroup().addTo(map);
    }

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    const evLat = Number(eventLocation?.latitude) || 19.2183;
    const evLon = Number(eventLocation?.longitude) || 72.9781;

    // 1. Weather Impact Radius Radar Circle
    const radiusMeters = Math.max(1500, (Number(impactRadiusKm) || 3.5) * 1000);
    const radarColor = rainfallMm >= 60 ? '#DC2626' : (rainfallMm >= 25 ? '#D99B26' : '#2F7D4A');
    const radarFill = rainfallMm >= 60 ? '#FEE2E2' : (rainfallMm >= 25 ? '#FEF3C7' : '#E7F4EA');

    L.circle([evLat, evLon], {
      radius: radiusMeters,
      color: radarColor,
      weight: 2,
      dashArray: '6, 6',
      fillColor: radarFill,
      fillOpacity: 0.25,
    }).addTo(layerGroup).bindPopup(
      `<div class="p-2 text-xs font-sans">
        <strong style="color: #082D46; font-size: 13px;">Weather Disruption Radar</strong><br/>
        <div style="margin-top: 4px; color: #596B76;">
          <strong>Coverage:</strong> ${(radiusMeters / 1000).toFixed(1)} km radius<br/>
          <strong>Precipitation:</strong> ${rainfallMm} mm/hr<br/>
          <strong>Corridor Alert:</strong> ${rainfallMm >= 60 ? 'Severe Flash Flooding' : (rainfallMm >= 25 ? 'Waterlogging Expected' : 'Normal Transit')}
        </div>
      </div>`
    );

    // 2. Event Venue Marker (Prominent Gold & Navy Pulsing Pin)
    const eventIcon = L.divIcon({
      className: 'custom-event-pin',
      html: `
        <div style="position: relative; width: 40px; height: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: #D99B26; opacity: 0.4; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 28px; height: 28px; border-radius: 50%; background: #082D46; border: 3px solid #F4D98A; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(8,45,70,0.45);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F4D98A" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div style="position: absolute; top: 32px; background: #082D46; color: #F4D98A; font-size: 9px; font-weight: 800; padding: 1.5px 6px; border-radius: 6px; border: 1px solid #F4D98A; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.25);">
            EVENT VENUE
          </div>
        </div>
      `,
      iconSize: [40, 52],
      iconAnchor: [20, 20],
    });

    L.marker([evLat, evLon], { icon: eventIcon })
      .addTo(layerGroup)
      .bindPopup(
        `<div class="p-2 text-xs font-sans">
          <span style="font-weight: 800; color: #082D46; font-size: 13px;">${eventLocation?.name || 'Target Event Venue'}</span><br/>
          <span style="color: #596B76;">City / Region: ${eventLocation?.city || 'Thane Hub'}</span><br/>
          <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #E7E5DC; color: #8C6A00; font-weight: 700;">
            Primary Fulfillment Destination
          </div>
        </div>`
      );

    // 3. Provider Markers & Connecting Corridors
    // Prepare bounds covering event venue and providers
    const bounds = L.latLngBounds([[evLat, evLon]]);

    // Group providers by proximity to detect exact coordinate overlaps and apply subtle jitter
    const coordOccurrences = {};

    providers.forEach((prov, idx) => {
      let rawLat = Number(prov.latitude);
      let rawLon = Number(prov.longitude);

      // If provider has missing coords, default to nearby Thane/Mumbai hubs
      if (!rawLat || !rawLon) {
        rawLat = evLat + ((idx + 1) * 0.015 * (idx % 2 === 0 ? 1 : -1));
        rawLon = evLon + ((idx + 1) * 0.018 * (idx % 3 === 0 ? -1 : 1));
      }

      // Check if coordinates overlap exactly with another pin or event venue
      const coordKey = `${rawLat.toFixed(4)}_${rawLon.toFixed(4)}`;
      const seenCount = coordOccurrences[coordKey] || 0;
      coordOccurrences[coordKey] = seenCount + 1;

      let pLat = rawLat;
      let pLon = rawLon;

      // Jitter if identical coordinates to ensure all pins remain distinctly visible
      if (seenCount > 0 || (Math.abs(pLat - evLat) < 0.001 && Math.abs(pLon - evLon) < 0.001)) {
        const angle = (seenCount * (2 * Math.PI) / 5) + (idx * 0.5);
        const offset = 0.0055 * (seenCount + 1); // ~500m offset
        pLat += Math.sin(angle) * offset;
        pLon += Math.cos(angle) * offset;
      }

      bounds.extend([pLat, pLon]);

      const risk = Number(prov.disruption_risk_percent) || 20;
      const isDisrupted = prov.status === 'SEVERELY_DISRUPTED' || risk >= 75;
      const isWarning = prov.status === 'AT_RISK' || (risk >= 45 && risk < 75);

      const pinBg = isDisrupted ? '#DC2626' : (isWarning ? '#D99B26' : '#2F7D4A');
      const statusText = isDisrupted ? 'Flooded Corridor' : (isWarning ? 'At-Risk' : 'Operational');

      // Clean display name
      const displayName = prov.name || `Provider #${prov.provider_id || prov.id || idx + 1}`;

      const providerIcon = L.divIcon({
        className: 'custom-provider-pin',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; position: relative;">
            <div style="width: 26px; height: 26px; border-radius: 50%; background: ${pinBg}; border: 2.5px solid #FFFFFF; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 10px rgba(0,0,0,0.3);">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
            </div>
            <div style="background: white; border: 1px solid #E7E5DC; border-radius: 6px; padding: 2px 7px; font-size: 10px; font-weight: 700; color: #082D46; margin-top: 3px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.12); display: flex; align-items: center; gap: 4px;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: ${pinBg};"></span>
              <span>${displayName}</span>
            </div>
          </div>
        `,
        iconSize: [120, 48],
        iconAnchor: [60, 13],
      });

      // Provider Marker
      L.marker([pLat, pLon], { icon: providerIcon })
        .addTo(layerGroup)
        .bindPopup(
          `<div class="p-2 text-xs font-sans">
            <strong style="color: #082D46; font-size: 13px;">${displayName}</strong><br/>
            <div style="margin-top: 4px; color: #596B76;">
              <strong>City:</strong> ${prov.city || 'Thane'}<br/>
              <strong>Distance:</strong> ${prov.distance_km ? `${Number(prov.distance_km).toFixed(1)} km` : 'Local Hub'}<br/>
              <strong>Disruption Risk:</strong> <span style="color: ${pinBg}; font-weight: 800;">${risk}% (${statusText})</span><br/>
              <strong>Routing:</strong> ${prov.recommended_routing || 'Standard transit'}
            </div>
          </div>`
        );

      // Connecting delivery corridor polyline
      const lineDash = isDisrupted ? '6, 6' : (isWarning ? '4, 4' : '');
      const lineColor = isDisrupted ? '#DC2626' : (isWarning ? '#D99B26' : '#2F7D4A');

      L.polyline([[pLat, pLon], [evLat, evLon]], {
        color: lineColor,
        weight: isDisrupted ? 2.5 : 2,
        opacity: isDisrupted ? 0.6 : 0.75,
        dashArray: lineDash,
      }).addTo(layerGroup);
    });

    // Fit map bounds smoothly with comfortable padding
    try {
      map.fitBounds(bounds, {
        padding: [45, 45],
        maxZoom: 13,
        animate: true,
      });
    } catch {
      map.setView([evLat, evLon], 12);
    }
  }, [eventLocation, providers, impactRadiusKm, rainfallMm]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#E7E5DC] shadow-xs bg-white">
      {/* Map Header / Legend Overlay - Positioned cleanly in top-left without overlapping zoom */}
      <div className="absolute top-3 left-3 z-[999] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#E7E5DC] shadow-sm flex flex-wrap items-center gap-3 text-[11px]">
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#082D46] border border-[#F4D98A]" />
          <span className="font-bold text-[#082D46]">Event Venue</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#2F7D4A]" />
          <span className="text-slate-600 font-medium">Operational Hub</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#D99B26]" />
          <span className="text-slate-600 font-medium">At-Risk Corridor</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
          <span className="text-slate-600 font-medium">Flooded Corridor</span>
        </div>
      </div>

      {/* Map Container Element */}
      <div ref={mapContainerRef} className="w-full h-80 sm:h-96" />
    </div>
  );
};
