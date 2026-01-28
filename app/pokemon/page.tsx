'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { TopNav } from '../components/TopNav';

interface PokemonListEntry {
  name: string;
  url: string;
}

interface PokemonListResponse {
  results: PokemonListEntry[];
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

function getPokemonIdFromUrl(url: string): number {
  const matches = url.match(/\/pokemon\/(\d+)\//);
  return matches ? parseInt(matches[1], 10) : 0;
}

function getPokemonSpriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatPokemonName(name: string): string {
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

export default function PokemonListPage() {
  const [pokemonList, setPokemonList] = useState<PokemonData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadPokemon() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=10000');
        const data: PokemonListResponse = await response.json();

        const sorted = [...data.results].sort((a, b) => getPokemonIdFromUrl(a.url) - getPokemonIdFromUrl(b.url));
        setTotal(sorted.length);
        setLoading(false);

        for (const entry of sorted) {
          if (cancelled) break;
          try {
            const pokemonResponse = await fetch(entry.url);
            if (!pokemonResponse.ok) continue;
            const pokemonInfo: PokemonData = await pokemonResponse.json();

            setPokemonList((prev) => {
              if (prev.some((p) => p.id === pokemonInfo.id)) return prev;
              const updated = [...prev, pokemonInfo];
              updated.sort((a, b) => a.id - b.id);
              return updated;
            });
          } catch {
            // ignore individual failures
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load Pokemon');
        setLoading(false);
      }
    }

    loadPokemon();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = pokemonList.filter((pokemon) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return pokemon.name.toLowerCase().includes(search) || pokemon.id.toString().includes(search);
  });

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <TopNav activeTab="pokemon" />

      <div className="flex flex-1 flex-col items-center justify-start p-4 pb-8 gap-4">
        <div className="w-full max-w-4xl">
          <input
            type="text"
            placeholder="Search Pokemon by name or number..."
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
                {loading && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">Loading…</span>
                )}
              </div>

              <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filtered.map((pokemon) => {
                  const types = [...pokemon.types].sort((a, b) => a.slot - b.slot);
                  const type1 = types[0]?.type.name;
                  const type2 = types[1]?.type.name;
                  const type1Color = type1 ? getTypeColor(type1) : '';
                  const type2Color = type2 ? getTypeColor(type2) : '';

                  const borderStyle: React.CSSProperties = {};
                  if (type1Color) {
                    borderStyle.borderLeftWidth = '10px';
                    borderStyle.borderLeftColor = type1Color;
                  }
                  if (type2Color) {
                    borderStyle.borderRightWidth = '10px';
                    borderStyle.borderRightColor = type2Color;
                  }

                  return (
                    <li key={pokemon.id} className="relative">
                      <Link
                        href={`/pokemon/${pokemon.name}`}
                        className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative cursor-pointer"
                        style={borderStyle}
                      >
                        <span className="text-sm text-gray-400 dark:text-gray-500 font-mono">#{pokemon.id}</span>
                        <img
                          src={pokemon.sprites.front_default || getPokemonSpriteUrl(pokemon.id)}
                          alt={pokemon.name}
                          className="w-16 h-16 object-contain"
                        />
                        <span className="text-sm text-center text-gray-800 dark:text-gray-200">
                          {formatPokemonName(pokemon.name)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {pokemonList.length === 0 && loading && (
                <div className="text-center text-gray-600 dark:text-gray-400 mt-6">Loading Pokemon…</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

