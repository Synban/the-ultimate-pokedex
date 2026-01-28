'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { TopNav } from '../../components/TopNav';

interface NamedAPIResource {
  name: string;
  url: string;
}

interface GenerationData {
  id: number;
  name: string;
  main_region: NamedAPIResource;
  pokemon_species: NamedAPIResource[];
}

interface PokemonData {
  id: number;
  name: string;
  sprites: {
    front_default: string | null;
  };
  types: Array<{
    slot: number;
    type: {
      name: string;
      url: string;
    };
  }>;
}

function getSpeciesIdFromUrl(url: string): number {
  const matches = url.match(/\/pokemon-species\/(\d+)\//);
  return matches ? parseInt(matches[1], 10) : 0;
}

function getPokemonSpriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
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

export default function GenerationDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const [gen, setGen] = useState<GenerationData | null>(null);
  const [pokemon, setPokemon] = useState<PokemonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        setPokemon([]);

        const res = await fetch(`https://pokeapi.co/api/v2/generation/${name}`);
        if (!res.ok) throw new Error('Generation not found');
        const genData: GenerationData = await res.json();

        if (cancelled) return;
        setGen(genData);
        setLoading(false);

        const sortedSpecies = [...genData.pokemon_species].sort(
          (a, b) => getSpeciesIdFromUrl(a.url) - getSpeciesIdFromUrl(b.url)
        );

        for (const species of sortedSpecies) {
          if (cancelled) break;
          try {
            const pRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${species.name}`);
            if (!pRes.ok) continue;
            const pData: PokemonData = await pRes.json();
            if (cancelled) break;
            setPokemon((prev) => {
              if (prev.some((p) => p.id === pData.id)) return prev;
              const updated = [...prev, pData];
              updated.sort((a, b) => a.id - b.id);
              return updated;
            });
          } catch {
            // ignore individual failures
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load generation');
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [name]);

  const filtered = pokemon.filter((p) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(s) || p.id.toString().includes(s);
  });

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <TopNav activeTab="generations" />

      <div className="flex flex-1 flex-col items-center justify-start p-4 pb-8 gap-4">
        <div className="w-full max-w-4xl">
          <input
            type="text"
            placeholder="Search Pokemon in this generation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 rounded-lg bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 shadow-lg dark:shadow-zinc-800/50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>

        <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-zinc-900 shadow-lg dark:shadow-zinc-800/50 p-6">
          {loading ? (
            <div className="text-center text-gray-600 dark:text-gray-400">Loading generation…</div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="text-gray-600 dark:text-gray-400">Error: {error}</div>
              <Link
                href="/generations"
                className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
              >
                Back to Generations
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {gen ? formatName(gen.name) : 'Generation'}
                  </span>
                  {gen?.main_region && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Primary region: {formatName(gen.main_region.name)}
                    </span>
                  )}
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Loaded {pokemon.length} / {gen?.pokemon_species.length ?? '...'}
                  </span>
                </div>

                <Link
                  href="/generations"
                  className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
                >
                  Change generation
                </Link>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filtered.map((p) => {
                  const types = [...p.types].sort((a, b) => a.slot - b.slot);
                  const type1 = types[0]?.type.name;
                  const type2 = types[1]?.type.name;
                  const borderStyle: React.CSSProperties = {};
                  if (type1) {
                    borderStyle.borderLeftWidth = '10px';
                    borderStyle.borderLeftColor = getTypeColor(type1);
                  }
                  if (type2) {
                    borderStyle.borderRightWidth = '10px';
                    borderStyle.borderRightColor = getTypeColor(type2);
                  }

                  return (
                    <li key={p.id}>
                      <Link
                        href={`/pokemon/${p.name}`}
                        className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        style={borderStyle}
                      >
                        <span className="text-sm text-gray-400 dark:text-gray-500 font-mono">#{p.id}</span>
                        <img
                          src={p.sprites.front_default || getPokemonSpriteUrl(p.id)}
                          alt={p.name}
                          className="w-16 h-16 object-contain"
                        />
                        <span className="text-sm text-center text-gray-800 dark:text-gray-200">
                          {formatName(p.name)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

