'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { TopNav } from '../../components/TopNav';

interface LocationData {
  id: number;
  name: string;
  region: {
    name: string;
    url: string;
  } | null;
  areas: Array<{
    name: string;
    url: string;
  }>;
}

interface LocationAreaData {
  id: number;
  name: string;
  pokemon_encounters: Array<{
    pokemon: {
      name: string;
      url: string;
    };
    // ... more fields exist, but we don't need them for this UI
  }>;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatLocationName(name: string): string {
  return name
    .split('-')
    .map((word) => capitalizeFirst(word))
    .join(' ');
}

export default function LocationDetail({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [areaPokemon, setAreaPokemon] = useState<Record<string, string[]>>({});
  const [areaLoading, setAreaLoading] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchLocation() {
      try {
        setLoading(true);
        setAreaPokemon({});
        setAreaLoading({});
        const response = await fetch(`https://pokeapi.co/api/v2/location/${name}`);
        if (!response.ok) {
          throw new Error('Location not found');
        }
        const data: LocationData = await response.json();
        if (cancelled) return;
        setLocation(data);
        setError(null);

        // Fetch each area's Pokemon encounters (progressively)
        for (const area of data.areas ?? []) {
          if (cancelled) break;
          try {
            setAreaLoading((prev) => ({ ...prev, [area.name]: true }));
            const areaRes = await fetch(area.url);
            if (!areaRes.ok) continue;
            const areaData: LocationAreaData = await areaRes.json();
            if (cancelled) break;

            const pokemonNames = Array.from(
              new Set((areaData.pokemon_encounters ?? []).map((p) => p.pokemon.name))
            ).sort((a, b) => a.localeCompare(b));

            setAreaPokemon((prev) => ({ ...prev, [area.name]: pokemonNames }));
          } catch {
            // ignore individual area failures
          } finally {
            if (!cancelled) setAreaLoading((prev) => ({ ...prev, [area.name]: false }));
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load location');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLocation();
    return () => {
      cancelled = true;
    };
  }, [name]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        <TopNav activeTab="locations" />
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-zinc-900 shadow-lg dark:shadow-zinc-800/50 p-6 flex items-center justify-center">
            <span className="text-gray-600 dark:text-gray-400">Loading location...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        <TopNav activeTab="locations" />
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-zinc-900 shadow-lg dark:shadow-zinc-800/50 p-6 flex flex-col items-center justify-center gap-4">
            <span className="text-gray-600 dark:text-gray-400">Error: {error || 'Location not found'}</span>
            <Link
              href="/locations"
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              Back to Locations
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <TopNav activeTab="locations" />
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-zinc-900 shadow-lg dark:shadow-zinc-800/50 p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                {formatLocationName(location.name)}
              </h1>
              <span className="text-lg text-gray-400 dark:text-gray-500 font-mono">
                ID: #{location.id}
              </span>
            </div>

            {location.region && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Region</h2>
                <p className="text-lg text-gray-800 dark:text-gray-200">
                  {formatLocationName(location.region.name)}
                </p>
              </div>
            )}

            {location.areas && location.areas.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Areas ({location.areas.length})
                </h2>
                <div className="flex flex-col gap-3">
                  {location.areas.map((area) => (
                    <div
                      key={area.name}
                      className="p-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium">{formatLocationName(area.name)}</div>
                        {areaLoading[area.name] && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">Loading Pokémon…</div>
                        )}
                      </div>

                      <div className="mt-3">
                        {areaPokemon[area.name] && areaPokemon[area.name].length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {areaPokemon[area.name].map((pokemonName) => (
                              <Link
                                key={pokemonName}
                                href={`/pokemon/${pokemonName}`}
                                className="p-2 rounded-lg bg-white/70 dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-900 transition-colors text-sm text-gray-800 dark:text-gray-200 text-center"
                              >
                                {formatLocationName(pokemonName)}
                              </Link>
                            ))}
                          </div>
                        ) : areaLoading[area.name] ? (
                          <div className="text-sm text-gray-500 dark:text-gray-400">Loading Pokémon…</div>
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400">No Pokémon listed for this area.</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
