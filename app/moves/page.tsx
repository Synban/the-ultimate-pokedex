'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { TopNav } from '../components/TopNav';

interface MoveListEntry {
  name: string;
  url: string;
}

interface MoveListResponse {
  results: MoveListEntry[];
}

interface MoveData {
  id: number;
  name: string;
  type: {
    name: string;
    url: string;
  };
  damage_class: {
    name: string;
    url: string;
  } | null;
}

function getMoveIdFromUrl(url: string): number {
  const matches = url.match(/\/move\/(\d+)\//);
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

export default function MovesListPage() {
  const [moves, setMoves] = useState<MoveData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadMoves() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('https://pokeapi.co/api/v2/move?limit=10000');
        const data: MoveListResponse = await response.json();

        const sorted = [...data.results].sort((a, b) => getMoveIdFromUrl(a.url) - getMoveIdFromUrl(b.url));
        setTotal(sorted.length);
        setLoading(false);

        for (const entry of sorted) {
          if (cancelled) break;
          try {
            const moveResponse = await fetch(entry.url);
            if (!moveResponse.ok) continue;
            const moveInfo: MoveData = await moveResponse.json();

            setMoves((prev) => {
              if (prev.some((m) => m.id === moveInfo.id)) return prev;
              const updated = [...prev, moveInfo];
              updated.sort((a, b) => a.id - b.id);
              return updated;
            });
          } catch {
            // ignore individual failures
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load moves');
        setLoading(false);
      }
    }

    loadMoves();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = moves.filter((move) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    const name = move.name.toLowerCase();
    const damage = move.damage_class?.name?.toLowerCase() ?? '';
    return name.includes(s) || damage.includes(s);
  });

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <TopNav activeTab="moves" />

      <div className="flex flex-1 flex-col items-center justify-start p-4 pb-8 gap-4">
        <div className="w-full max-w-4xl">
          <input
            type="text"
            placeholder="Search moves by name or category..."
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

              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filtered.map((move) => {
                  const borderStyle: React.CSSProperties = {
                    borderLeftWidth: '10px',
                    borderLeftColor: getTypeColor(move.type.name),
                  };
                  return (
                    <li key={move.id} className="relative">
                      <Link
                        href={`/moves/${move.name}`}
                        className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        style={borderStyle}
                      >
                        <span className="text-sm text-center text-gray-800 dark:text-gray-200">
                          {formatName(move.name)}
                        </span>
                        {move.damage_class && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatName(move.damage_class.name)}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {moves.length === 0 && loading && (
                <div className="text-center text-gray-600 dark:text-gray-400 mt-6">Loading moves…</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

