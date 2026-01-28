'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { TopNav } from '../components/TopNav';

interface LocationListEntry {
  name: string;
  url: string;
}

interface LocationListResponse {
  results: LocationListEntry[];
}

interface LocationData {
  id: number;
  name: string;
  region: {
    name: string;
    url: string;
  } | null;
}

function getLocationIdFromUrl(url: string): number {
  const matches = url.match(/\/location\/(\d+)\//);
  return matches ? parseInt(matches[1], 10) : 0;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatName(name: string): string {
  return name
    .split('-')
    .map((word) => capitalizeFirst(word))
    .join(' ');
}

export default function LocationsListPage() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadLocations() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('https://pokeapi.co/api/v2/location?limit=1000');
        const data: LocationListResponse = await response.json();

        const sorted = [...data.results].sort((a, b) => getLocationIdFromUrl(a.url) - getLocationIdFromUrl(b.url));
        setTotal(sorted.length);
        setLoading(false);

        for (const entry of sorted) {
          if (cancelled) break;
          try {
            const locationResponse = await fetch(entry.url);
            if (!locationResponse.ok) continue;
            const locationInfo: LocationData = await locationResponse.json();

            setLocations((prev) => {
              if (prev.some((l) => l.id === locationInfo.id)) return prev;
              const updated = [...prev, locationInfo];
              updated.sort((a, b) => a.id - b.id);
              return updated;
            });
          } catch {
            // ignore individual failures
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load locations');
        setLoading(false);
      }
    }

    loadLocations();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = locations.filter((loc) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    const name = loc.name.toLowerCase();
    const region = loc.region?.name?.toLowerCase() ?? '';
    return name.includes(s) || region.includes(s);
  });

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <TopNav activeTab="locations" />

      <div className="flex flex-1 flex-col items-center justify-start p-4 pb-8 gap-4">
        <div className="w-full max-w-4xl">
          <input
            type="text"
            placeholder="Search locations by name or region..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 rounded-lg bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 shadow-lg dark:shadow-zinc-800/50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>

        <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-zinc-900 shadow-lg dark:shadow-zinc-800/50 p-6">
          {error ? (
            <div className="text-center text-gray-600 dark:text-gray-400">Error: {error}</div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {filtered.length} / {total || '...'}
                </span>
                {loading && <span className="text-sm text-gray-500 dark:text-gray-400">Loading…</span>}
              </div>

              <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filtered.map((loc) => (
                  <li key={loc.id} className="relative">
                    <Link
                      href={`/locations/${loc.name}`}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <span className="text-sm text-center text-gray-800 dark:text-gray-200">
                        {formatName(loc.name)}
                      </span>
                      {loc.region && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatName(loc.region.name)}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>

              {locations.length === 0 && loading && (
                <div className="text-center text-gray-600 dark:text-gray-400 mt-6">Loading locations…</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

