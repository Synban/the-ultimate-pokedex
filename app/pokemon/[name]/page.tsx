'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface PokemonData {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  sprites: {
    front_default: string | null;
    back_default: string | null;
    front_shiny: string | null;
    back_shiny: string | null;
  };
  types: Array<{
    slot: number;
    type: {
      name: string;
      url: string;
    };
  }>;
  stats: Array<{
    base_stat: number;
    effort: number;
    stat: {
      name: string;
      url: string;
    };
  }>;
  abilities: Array<{
    ability: {
      name: string;
      url: string;
    };
    is_hidden: boolean;
    slot: number;
  }>;
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

function formatStatName(statName: string): string {
  const statMap: Record<string, string> = {
    'hp': 'HP',
    'attack': 'Attack',
    'defense': 'Defense',
    'special-attack': 'Sp. Attack',
    'special-defense': 'Sp. Defense',
    'speed': 'Speed',
  };
  return statMap[statName] || capitalizeFirst(statName);
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

export default function PokemonDetail({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const [pokemon, setPokemon] = useState<PokemonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPokemon() {
      try {
        setLoading(true);
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
        if (!response.ok) {
          throw new Error('Pokemon not found');
        }
        const data: PokemonData = await response.json();
        setPokemon(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Pokemon');
      } finally {
        setLoading(false);
      }
    }

    fetchPokemon();
  }, [name]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
        <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-zinc-900 shadow-lg dark:shadow-zinc-800/50 p-6 flex items-center justify-center">
          <span className="text-gray-600 dark:text-gray-400">Loading Pokemon...</span>
        </div>
      </div>
    );
  }

  if (error || !pokemon) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
        <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-zinc-900 shadow-lg dark:shadow-zinc-800/50 p-6 flex flex-col items-center justify-center gap-4">
          <span className="text-gray-600 dark:text-gray-400">Error: {error || 'Pokemon not found'}</span>
          <Link
            href="/"
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            Back to Pokemon List
          </Link>
        </div>
      </div>
    );
  }

  const types = pokemon.types.sort((a, b) => a.slot - b.slot);
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
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black p-4">
      <div className="flex justify-center mb-4">
        <Link
          href="/"
          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
        >
          ← Back to Pokemon List
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div
          className="w-full max-w-4xl rounded-2xl bg-white dark:bg-zinc-900 shadow-lg dark:shadow-zinc-800/50 p-6 flex flex-col gap-6"
          style={borderStyle}
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="flex flex-col items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                {formatPokemonName(pokemon.name)}
              </h1>
              <span className="text-lg text-gray-400 dark:text-gray-500 font-mono">
                #{pokemon.id}
              </span>
              <div className="flex gap-2">
                <img
                  src={pokemon.sprites.front_default || getPokemonSpriteUrl(pokemon.id)}
                  alt={`${pokemon.name} front`}
                  className="w-32 h-32 object-contain"
                />
                {pokemon.sprites.back_default && (
                  <img
                    src={pokemon.sprites.back_default}
                    alt={`${pokemon.name} back`}
                    className="w-32 h-32 object-contain"
                  />
                )}
              </div>
              {pokemon.sprites.front_shiny && (
                <div className="flex gap-2">
                  <img
                    src={pokemon.sprites.front_shiny}
                    alt={`${pokemon.name} shiny front`}
                    className="w-32 h-32 object-contain"
                  />
                  {pokemon.sprites.back_shiny && (
                    <img
                      src={pokemon.sprites.back_shiny}
                      alt={`${pokemon.name} shiny back`}
                      className="w-32 h-32 object-contain"
                    />
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Types</h2>
                <div className="flex gap-2">
                  {types.map((type) => (
                    <span
                      key={type.type.name}
                      className="px-4 py-2 rounded-lg text-white font-medium"
                      style={{ backgroundColor: getTypeColor(type.type.name) }}
                    >
                      {formatPokemonName(type.type.name)}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Basic Info</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Height</span>
                    <p className="text-lg text-gray-800 dark:text-gray-200">{(pokemon.height / 10).toFixed(1)} m</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Weight</span>
                    <p className="text-lg text-gray-800 dark:text-gray-200">{(pokemon.weight / 10).toFixed(1)} kg</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Base Experience</span>
                    <p className="text-lg text-gray-800 dark:text-gray-200">{pokemon.base_experience}</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Abilities</h2>
                <div className="flex flex-col gap-2">
                  {pokemon.abilities.map((ability) => (
                    <div key={ability.ability.name} className="flex items-center gap-2">
                      <span className="text-gray-800 dark:text-gray-200">
                        {formatPokemonName(ability.ability.name)}
                      </span>
                      {ability.is_hidden && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">(Hidden)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Base Stats</h2>
                <div className="flex flex-col gap-2">
                  {pokemon.stats.map((stat) => (
                    <div key={stat.stat.name} className="flex items-center gap-4">
                      <span className="w-24 text-sm text-gray-700 dark:text-gray-300">
                        {formatStatName(stat.stat.name)}:
                      </span>
                      <div className="flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 dark:bg-blue-600 rounded-full transition-all"
                          style={{ width: `${Math.min((stat.base_stat / 255) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="w-12 text-sm text-gray-800 dark:text-gray-200 text-right">
                        {stat.base_stat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
