import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { BuildingInfo, DeskInfo, FoundItem, LostReport } from '../types';
import { CAMPUS_COORDINATES } from '../lib/campusCoordinates';

interface CampusMapViewProps {
  buildings: BuildingInfo[];
  desks: DeskInfo[];
  items: FoundItem[];
  reports: LostReport[];
}

interface MapPin {
  id: string;
  name: string;
  shortName: string;
  latitude: number;
  longitude: number;
  hasDesk: boolean;
  found: number;
  lost: number;
}

export const CampusMapView: React.FC<CampusMapViewProps> = ({ buildings, desks, items, reports }) => {
  const [selectedId, setSelectedId] = useState<string | null>(buildings[0]?.id ?? null);
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pinsRef = useRef<L.LayerGroup | null>(null);

  const pins = useMemo<MapPin[]>(() => {
    return buildings.flatMap((building) => {
      const point = CAMPUS_COORDINATES[building.id];
      if (!point) return [];
      const deskName = desks.find((entry) => entry.id === building.deskId)?.name;
      const found = items.filter((item) => item.desk === deskName && item.status !== 'picked-up' && item.status !== 'donated').length;
      const lost = reports.filter((report) => report.building.toLowerCase().includes(building.shortName.toLowerCase()) && report.status !== 'closed').length;
      return [{
        id: building.id,
        name: building.name,
        shortName: building.shortName,
        latitude: point.latitude,
        longitude: point.longitude,
        hasDesk: Boolean(building.deskId),
        found,
        lost,
      }];
    });
  }, [buildings, desks, items, reports]);

  const selected = buildings.find((building) => building.id === selectedId) ?? null;
  const selectedPin = pins.find((pin) => pin.id === selectedId) ?? null;
  const desk = desks.find((entry) => entry.id === selected?.deskId);

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;
    const map = L.map(mapElement.current, { scrollWheelZoom: true }).setView([43.4716, -80.5445], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    pinsRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      pinsRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!selectedId && pins[0]) setSelectedId(pins[0].id);
  }, [pins, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    const group = pinsRef.current;
    if (!map || !group) return;
    group.clearLayers();
    const bounds: L.LatLngExpression[] = [];
    for (const pin of pins) {
      const active = pin.id === selectedId;
      const marker = L.circleMarker([pin.latitude, pin.longitude], {
        radius: active ? 12 : 9,
        color: '#1c1814',
        weight: 1,
        fillColor: pin.hasDesk ? '#c6a15a' : '#7c6a58',
        fillOpacity: 0.95,
      });
      marker.bindTooltip(`${pin.shortName} · ${pin.found} found · ${pin.lost} lost`, { direction: 'top' });
      marker.on('click', () => setSelectedId(pin.id));
      marker.addTo(group);
      bounds.push([pin.latitude, pin.longitude]);
    }
    if (bounds.length > 0 && !selectedId) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [32, 32] });
    }
    map.invalidateSize();
  }, [pins, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPin) return;
    map.flyTo([selectedPin.latitude, selectedPin.longitude], 16, { duration: 0.6 });
  }, [selectedPin]);

  const directions = selectedPin
    ? `https://www.openstreetmap.org/directions?to=${selectedPin.latitude}%2C${selectedPin.longitude}`
    : null;

  return (
    <div data-tour="map" className="grid lg:grid-cols-[1.4fr_0.8fr] gap-4">
      <div className="bg-white rounded-3xl border border-slate-200 p-4">
        <h2 className="text-lg font-bold">Campus lost and found map</h2>
        <p className="text-xs text-slate-500 mb-3">Gold pins are staffed desks on the University of Waterloo campus. Select a building for hours and what it is holding.</p>
        <div ref={mapElement} className="h-[420px] w-full rounded-2xl overflow-hidden" />
      </div>
      <aside className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
        <h3 className="font-bold text-lg">{selected?.name ?? 'Select a building'}</h3>
        {desk ? (
          <>
            <p className="text-sm font-semibold">{desk.name}</p>
            <p className="text-xs text-slate-600">{desk.room}</p>
            <p className="text-xs text-slate-600">{desk.hours}</p>
            <p className="text-xs text-slate-500">{desk.phone}</p>
          </>
        ) : (
          <p className="text-xs text-slate-600">This building does not keep a desk. Items found here should go to the nearest staffed desk.</p>
        )}
        <div className="text-xs space-y-1">
          <p><strong>{selectedPin?.found ?? 0}</strong> found items at the linked desk</p>
          <p><strong>{selectedPin?.lost ?? 0}</strong> lost reports mentioning this building</p>
        </div>
        {directions && (
          <a href={directions} target="_blank" rel="noreferrer" className="inline-block text-xs font-bold text-amber-800">
            Directions on OpenStreetMap
          </a>
        )}
      </aside>
    </div>
  );
};
