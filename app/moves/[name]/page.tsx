'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { TopNav } from '../../components/TopNav';

interface MoveData {
  id: number;
  name: string;
  accuracy: number | null;
  effect_chance: number | null;
  pp: number | null;
  priority: number;
  power: number | null;
  type: {
    name: string;
    url: string;
  };
  damage_class: {
    name: string;
    url: string;
  } | null;
  learned_by_pokemon: Array<{
    name: string;
    url: string;
  }>;
  effect_entries: Array<{
    effect: string;
    language: {
      name: string;
      url: string;
    };
    short_effect?: string;
  }>;
  flavor_text_entries: Array<{
    flavor_text: string;
    language: {
      name: string;
      url: string;
    };
    version_group: {
      name: string;
      url: string;
    };
  }>;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatMoveName(name: string): string {
  return name
    .split('-')
    .map((word) => capitalizeFirst(word))
    .join(' ');
}

function getTypeColor(typeName: string): string {
  const colors: Record<string, string> = {
    normal: '#A8A878',
    fire: '#F08030',
    water: '#6890F0',
    electric: '#F8D030',
    grass: '#78C850',
    ice: '#98D8D8',
    fighting: '#C03028',
    poison: '#A040A0',
    ground: '#E0C068',
    flying: '#A890F0',
    psychic: '#F85888',
    bug: '#A8B820',
    rock: '#B8A038',
    ghost: '#705898',
    dragon: '#7038F8',
    dark: '#705848',
    steel: '#B8B8D0',
    fairy: '#EE99AC',
  };
  return colors[typeName.toLowerCase()] || '#68A090';
}

export default function MoveDetail({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const [move, setMove] = useState<MoveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchMove() {
      try {
        setLoading(true);
        const response = await fetch(`https://pokeapi.co/api/v2/move/${name}`);
        if (!response.ok) throw new Error('Move not found');
        const data: MoveData = await response.json();
        if (!cancelled) {
          setMove(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load move');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchMove();
    return () => {
      cancelled = true;
    };
  }, [name]);

  const typeColor = move ? getTypeColor(move.type.name) : '#68A090';
  const borderStyle: React.CSSProperties = {
    borderLeftWidth: '10px',
    borderLeftColor: typeColor,
  };

  const englishEffect = move?.effect_entries.find((e) => e.language.name === 'en');
  const englishFlavorTexts = (move?.flavor_text_entries ?? []).filter((f) => f.language.name === 'en');
  const learnedBy = (move?.learned_by_pokemon ?? []).map((p) => p.name).sort((a, b) => a.localeCompare(b));

  const flavorByVersionGroup = englishFlavorTexts.reduce<Record<string, string[]>>((acc, entry) => {
    const vg = entry.version_group.name;
    const cleaned = entry.flavor_text.replace(/\f/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    if (!acc[vg]) acc[vg] = [];
    if (!acc[vg].includes(cleaned)) acc[vg].push(cleaned);
    return acc;
  }, {});
  const versionGroups = Object.keys(flavorByVersionGroup).sort((a, b) => a.localeCompare(b));

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <TopNav activeTab="moves" />

      <div className="flex flex-1 items-center justify-center p-4">
        <div
          className="w-full max-w-4xl rounded-2xl bg-white dark:bg-zinc-900 shadow-lg dark:shadow-zinc-800/50 p-6 flex flex-col gap-6"
          style={borderStyle}
        >
          {loading ? (
            <div className="text-center text-gray-600 dark:text-gray-400">Loading move…</div>
          ) : error || !move ? (
            <div className="flex flex-col items-center justify-center gap-4">
              <span className="text-gray-600 dark:text-gray-400">Error: {error || 'Move not found'}</span>
              <Link
                href="/moves"
                className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
              >
                Back to Moves
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                  {formatMoveName(move.name)}
                </h1>
                <span className="text-lg text-gray-400 dark:text-gray-500 font-mono">ID: #{move.id}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Type</span>
                  <div className="mt-1">
                    <span className="px-3 py-1 rounded-lg text-white font-medium text-sm" style={{ backgroundColor: typeColor }}>
                      {formatMoveName(move.type.name)}
                    </span>
                  </div>
                </div>
                {move.damage_class && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Category</span>
                    <p className="text-lg text-gray-800 dark:text-gray-200 mt-1">{formatMoveName(move.damage_class.name)}</p>
                  </div>
                )}
                {move.power !== null && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Power</span>
                    <p className="text-lg text-gray-800 dark:text-gray-200 mt-1">{move.power}</p>
                  </div>
                )}
                {move.accuracy !== null && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Accuracy</span>
                    <p className="text-lg text-gray-800 dark:text-gray-200 mt-1">{move.accuracy}%</p>
                  </div>
                )}
                {move.pp !== null && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">PP</span>
                    <p className="text-lg text-gray-800 dark:text-gray-200 mt-1">{move.pp}</p>
                  </div>
                )}
                {move.priority !== 0 && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Priority</span>
                    <p className="text-lg text-gray-800 dark:text-gray-200 mt-1">{move.priority}</p>
                  </div>
                )}
              </div>

              {englishEffect && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Effect</h2>
                  <p className="text-gray-800 dark:text-gray-200">{englishEffect.short_effect || englishEffect.effect}</p>
                </div>
              )}

              {englishFlavorTexts.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Flavor Text (by game/version)
                  </h2>
                  <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
                    {versionGroups.map((vg) => (
                      <div key={vg} className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                          {formatMoveName(vg)}
                        </div>
                        <div className="flex flex-col gap-2">
                          {flavorByVersionGroup[vg].map((txt, idx) => (
                            <div key={`${vg}-${idx}`} className="text-sm text-gray-800 dark:text-gray-200">
                              {txt}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {learnedBy.length > 0 && (
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Pokemon that can learn this move ({learnedBy.length})
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-96 overflow-y-auto pr-1">
                    {learnedBy.map((pokemonName) => (
                      <Link
                        key={pokemonName}
                        href={`/pokemon/${pokemonName}`}
                        className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm text-gray-800 dark:text-gray-200 text-center"
                      >
                        {formatMoveName(pokemonName)}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

