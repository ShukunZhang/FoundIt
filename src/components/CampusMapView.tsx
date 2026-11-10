import React, { useMemo, useState } from 'react';
import type { BuildingInfo, DeskInfo, FoundItem, LostReport } from '../types';

interface CampusMapViewProps {
  buildings: BuildingInfo[];
  desks: DeskInfo[];
  items: FoundItem[];
  reports: LostReport[];
}

export const CampusMapView: React.FC<CampusMapViewProps> = ({ buildings, desks, items, reports }) => {
  const [selectedId, setSelectedId] = useState<string | null>(buildings[0]?.id ?? null);
  const selected = buildings.find((building) => building.id === selectedId) ?? null;
  const desk = desks.find((entry) => entry.id === selected?.deskId);

  const counts = useMemo(() => {
    return buildings.map((building) => {
      const deskName = desks.find((entry) => entry.id === building.deskId)?.name;
      const found = items.filter((item) => item.desk === deskName && item.status !== 'picked-up' && item.status !== 'donated').length;
      const lost = reports.filter((report) => report.building.toLowerCase().includes(building.shortName.toLowerCase()) && report.status !== 'closed').length;
      return { id: building.id, found, lost };
    });
  }, [buildings, desks, items, reports]);

  return (
    <div data-tour="map" className="grid lg:grid-cols-[1.4fr_0.8fr] gap-4">
      <div className="bg-white rounded-3xl border border-slate-200 p-4">
        <h2 className="text-lg font-bold">Campus lost and found map</h2>
        <p className="text-xs text-slate-500 mb-3">Gold pins are staffed desks. Select a building for hours and what it is holding.</p>
        <svg viewBox="0 0 100 100" className="w-full h-[420px] bg-[#efe6d8] rounded-2xl">
          <path d="M8 78 C 30 70, 55 84, 92 62" fill="none" stroke="#c6a15a" strokeWidth="1.2" />
          {buildings.map((building) => {
            const count = counts.find((entry) => entry.id === building.id);
            const active = building.id === selectedId;
            return (
              <g key={building.id} onClick={() => setSelectedId(building.id)} className="cursor-pointer">
                <circle cx={building.mapX} cy={building.mapY} r={active ? 4.2 : 3.2} fill={building.deskId ? '#c6a15a' : '#7c6a58'} stroke="#1c1814" strokeWidth="0.4" />
                <text x={building.mapX + 4} y={building.mapY + 1} fontSize="3.2" fill="#1c1814">{building.shortName}</text>
                <text x={building.mapX + 4} y={building.mapY + 4.4} fontSize="2.4" fill="#5c5146">{count?.found ?? 0} found · {count?.lost ?? 0} lost</text>
              </g>
            );
          })}
        </svg>
      </div>
      <aside className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
        <h3 className="font-bold text-lg">{selected?.name ?? 'Select a building'}</h3>
        {desk ? (
          <>
            <p className="text-sm font-semibold">{desk.name}</p>
            <p className="text-xs text-slate-600">{desk.room}</p>
            <p className="text-xs text-slate-600">{desk.hours}</p>
            <p className="text-xs text-slate-500">{desk.phone}</p>
            <p className="text-xs">About a 5–12 minute walk from the campus centre, depending on where you are.</p>
          </>
        ) : (
          <p className="text-xs text-slate-600">This building does not keep a desk. Items found here should go to the nearest staffed desk.</p>
        )}
        <div className="text-xs space-y-1">
          <p><strong>{counts.find((entry) => entry.id === selected?.id)?.found ?? 0}</strong> found items at the linked desk</p>
          <p><strong>{counts.find((entry) => entry.id === selected?.id)?.lost ?? 0}</strong> lost reports mentioning this building</p>
        </div>
      </aside>
    </div>
  );
};
