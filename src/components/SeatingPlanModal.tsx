import React, { useState } from 'react';
import { X, Users, Sparkles, Search } from 'lucide-react';
import { Guest, EventConfig } from '../types';

interface SeatingPlanModalProps {
  guests: Guest[];
  config: EventConfig;
  isOpen: boolean;
  onClose: () => void;
}

export const SeatingPlanModal: React.FC<SeatingPlanModalProps> = ({
  guests,
  config,
  isOpen,
  onClose
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  if (!isOpen) return null;

  // Build map of tables
  const tablesMap: Record<string, Guest[]> = {};
  for (let i = 1; i <= (config.totalTables || 10); i++) {
    tablesMap[`Table ${i}`] = [];
  }

  guests.forEach((g) => {
    if (g.attending !== 'yes') return;
    const tName = g.table && g.table !== '-' ? g.table : 'Table 1';
    if (!tablesMap[tName]) tablesMap[tName] = [];
    tablesMap[tName].push(g);
  });

  const sortedTableNames = Object.keys(tablesMap).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });

  const q = filterQuery.trim().toLowerCase();
  const visibleTableNames = sortedTableNames.filter((tableName) => {
    if (!q) return true;
    if (tableName.toLowerCase().includes(q)) return true;
    const tGuests = tablesMap[tableName] || [];
    return tGuests.some((g) => g.name.toLowerCase().includes(q) || (g.seat && g.seat.toLowerCase().includes(q)));
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="romantic-stationery-card rounded-3xl max-w-3xl w-full p-5 sm:p-8 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Delicate Inner Frame */}
        <div className="absolute inset-3 border border-[#c5a059]/30 rounded-2xl pointer-events-none"></div>

        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#3A5A74] hover:text-[#274155] transition z-10"
          title="Close seating plan"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center pb-4 border-b border-[#c5a059]/30 relative z-10">
          <div className="inline-flex items-center space-x-1.5 text-[#3A5A74] text-xs font-serif font-semibold uppercase tracking-[0.2em]">
            <span>❦</span>
            <span>Grand Ballroom Directory</span>
            <span>❦</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-serif text-[#18232c] mt-1 font-normal">
            Reception Seating Arrangement
          </h3>
          <p className="text-xs text-[#475569] font-serif italic mt-1">
            "Browse tables and honored guest placements for our evening celebration."
          </p>

          {/* Quick Search inside Modal */}
          <div className="max-w-md mx-auto mt-3 relative">
            <Search className="w-4 h-4 text-[#3A5A74] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Quick search guest or table (e.g. Claire Bennett, Table 3)..."
              className="w-full pl-9 pr-8 py-2 bg-white rounded-xl border border-[#c8d7e3] text-xs font-serif text-[#18232c] focus:outline-none focus:border-[#3A5A74] focus:ring-1 focus:ring-[#3A5A74]/20 shadow-xs"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 pr-1 space-y-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleTableNames.length === 0 ? (
              <div className="col-span-2 text-center py-10 text-xs font-serif italic text-slate-500">
                No tables or guests found matching "{filterQuery}".
              </div>
            ) : (
              visibleTableNames.map((tableName) => {
                const tableGuests = tablesMap[tableName] || [];
                const maxSeats = config.seatsPerTable || 12;
                const occupiedSeats = tableGuests.reduce((sum, g) => sum + Math.max(1, typeof g.count === 'number' ? g.count : 1), 0);

                return (
                  <div
                    key={tableName}
                    className="p-4 bg-[#ffffff] rounded-2xl border border-[#c8d7e3] space-y-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-[#c5a059]/30 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-[#3A5A74]"></span>
                        <h4 className="font-serif text-[#18232c] text-base font-normal">
                          {tableName}
                        </h4>
                      </div>
                      <span className="text-[10px] font-serif font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3]">
                        {occupiedSeats} / {maxSeats} Seats {occupiedSeats >= maxSeats ? '(Full)' : `(${maxSeats - occupiedSeats} open)`}
                      </span>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {tableGuests.length === 0 ? (
                        <div className="p-3 bg-[#f8fafc] rounded-xl border border-dashed border-[#c8d7e3] text-center text-xs font-serif italic text-[#506173]">
                          Open Table (Awaiting Guest Assignment)
                        </div>
                      ) : (
                        tableGuests.map((g) => {
                          const isMatch = q && g.name.toLowerCase().includes(q);
                          return (
                            <div
                              key={g.id}
                              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition ${
                                isMatch
                                  ? 'bg-[#ebf2f7] border-[#3A5A74] ring-1 ring-[#3A5A74]/30'
                                  : 'bg-[#f8fafc] border-[#c8d7e3]'
                              }`}
                            >
                              <div className="font-serif text-[#18232c] flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059]"></span>
                                <span className={`font-medium ${isMatch ? 'font-semibold text-[#1d354a]' : ''}`}>
                                  {g.name}
                                </span>
                                {g.count && g.count > 1 ? (
                                  <span className="text-[10px] text-[#3A5A74] font-sans font-semibold bg-[#ebf2f7] px-1.5 py-0.2 rounded border border-[#c8d7e3]">
                                    Party of {g.count}
                                  </span>
                                ) : null}
                              </div>
                              <span className="text-[10px] text-[#3A5A74] font-serif font-semibold px-2 py-0.5 rounded bg-white border border-[#c8d7e3]">
                                {g.seat || 'Seat 1'}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-[#c5a059]/30 text-center relative z-10">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#3A5A74] hover:bg-[#274155] text-white text-xs font-serif font-semibold tracking-wider rounded-xl transition shadow-sm border border-[#4D708E]"
          >
            Close Seating Plan
          </button>
        </div>
      </div>
    </div>
  );
};
