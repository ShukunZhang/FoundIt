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
  building: string;
  latitude: number;
  longitude: number;
  found: number;
  lost: number;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char
  ));
}

function samePlace(left: string, right: string): boolean {
  const a = left.trim().toLowerCase();
  const b = right.trim().toLowerCase();
  return a === b || a.startsWith(b) || b.startsWith(a);
}

export const CampusMapView: React.FC<CampusMapViewProps> = ({ buildings, desks, items, reports }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pinsRef = useRef<L.LayerGroup | null>(null);
  const fittedRef = useRef(false);

  const pins = useMemo<MapPin[]>(() => {
    return desks.flatMap((desk) => {
      const point = CAMPUS_COORDINATES[desk.id];
      if (!point) return [];
      const building = buildings.find((entry) => entry.id === desk.id);
      const found = items.filter((item) => item.desk === desk.name && item.status !== 'picked-up' && item.status !== 'donated').length;
      const lost = reports.filter((report) => {
        const place = report.building.toLowerCase();
        return report.status !== 'closed' && (place.includes(desk.name.toLowerCase()) || (building ? place.includes(building.shortName.toLowerCase()) : false));
      }).length;
      return [{
        id: desk.id,
        name: desk.name,
        building: desk.building,
        latitude: point.latitude,
        longitude: point.longitude,
        found,
        lost,
      }];
    });
  }, [buildings, desks, items, reports]);

  const selectedPin = pins.find((pin) => pin.id === selectedId) ?? null;
  const desk = desks.find((entry) => entry.id === selectedId);

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
    if (pins.length === 0) return;
    if (!pins.some((pin) => pin.id === selectedId)) setSelectedId(pins[0].id);
  }, [pins, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    const group = pinsRef.current;
    if (!map || !group) return;
    group.clearLayers();
    const bounds: L.LatLngExpression[] = [];
    for (const pin of pins) {
      const active = pin.id === selectedId;
      const countLabel = `${pin.found} item${pin.found === 1 ? '' : 's'}`;
      const marker = L.marker([pin.latitude, pin.longitude], {
        icon: L.divIcon({
          className: 'foundit-pin',
          html: `<div class="foundit-pin-card${active ? ' is-active' : ''}"><strong>${escapeHtml(pin.name)}</strong><span>${countLabel}</span></div>`,
          iconSize: [156, 46],
          iconAnchor: [78, 46],
        }),
        zIndexOffset: active ? 500 : 0,
      });
      marker.on('click', () => setSelectedId(pin.id));
      marker.addTo(group);
      bounds.push([pin.latitude, pin.longitude]);
    }
    map.invalidateSize();
    if (bounds.length > 0 && !fittedRef.current) {
      map.fitBounds(L.latLngBounds(bounds), {
        paddingTopLeft: [28, 64],
        paddingBottomRight: [28, 36],
        maxZoom: 15,
      });
      fittedRef.current = true;
    }
  }, [pins, selectedId]);

  const directions = selectedPin
    ? `https://www.openstreetmap.org/directions?to=${selectedPin.latitude}%2C${selectedPin.longitude}`
    : null;

  return (
    <div className="grid lg:grid-cols-[1.4fr_0.8fr] gap-4">
      <div className="bg-white rounded-3xl border border-slate-200 p-4">
        <h2 className="text-lg font-bold">Campus lost and found map</h2>
        <p className="text-xs text-slate-500 mb-3">Each pin is a staffed desk, with its name and how many items are there. Select a pin for hours.</p>
        <div ref={mapElement} className="h-[420px] w-full rounded-2xl overflow-hidden" />
      </div>
      <aside className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
        <h3 className="font-bold text-lg">{desk?.name ?? 'Select a desk'}</h3>
        {desk ? (
          <>
            {selectedPin && !samePlace(desk.name, selectedPin.building) && (
              <p className="text-sm font-semibold">{selectedPin.building}</p>
            )}
            <p className="text-xs text-slate-600">{desk.room}</p>
            <p className="text-xs text-slate-600">{desk.hours}</p>
            <p className="text-xs text-slate-500">{desk.phone}</p>
          </>
        ) : (
          <p className="text-xs text-slate-600">Select a desk pin to see hours and what it is holding.</p>
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
