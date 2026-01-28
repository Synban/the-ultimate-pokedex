'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { TopNav } from '../components/TopNav';

interface GenerationListEntry {
  name: string;
  url: string;
}

interface GenerationListResponse {
  results: GenerationListEntry[];
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

export default function GenerationsPage() {
  const [gens, setGens] = useState<GenerationListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('https://pokeapi.co/api/v2/generation?limit=100');
        if (!res.ok) throw new Error('Failed to load generations');
        const data: GenerationListResponse = await res.json();
        if (!cancelled) setGens(data.results);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load generations');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <TopNav activeTab="generations" />

      <div className="flex flex-1 flex-col items-center justify-start p-4 pb-8 gap-4">
        <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-zinc-900 shadow-lg dark:shadow-zinc-800/50 p-6">
          {loading ? (
            <div className="text-center text-gray-600 dark:text-gray-400">Loading generations…</div>
          ) : error ? (
            <div className="text-center text-gray-600 dark:text-gray-400">Error: {error}</div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {gens.map((g) => (
                <li key={g.name}>
                  <Link
                    href={`/generations/${g.name}`}
                    className="block p-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-center text-gray-800 dark:text-gray-200"
                  >
                    {formatName(g.name)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

