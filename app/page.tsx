'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Pokemon {
  name: string;
  url: string;
}

interface PokemonListResponse {
  results: Pokemon[];
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

interface Location {
  name: string;
  url: string;
}

interface LocationListResponse {
  results: Location[];
}

interface LocationData {
  id: number;
  name: string;
  region: {
    name: string;
    url: string;
  } | null;
}

interface Move {
  name: string;
  url: string;
}

interface MoveListResponse {
  results: Move[];
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

function getPokemonId(url: string): number {
  const matches = url.match(/\/pokemon\/(\d+)\//);
  return matches ? parseInt(matches[1], 10) : 0;
}

function getLocationId(url: string): number {
  const matches = url.match(/\/location\/(\d+)\//);
  return matches ? parseInt(matches[1], 10) : 0;
}

function getMoveId(url: string): number {
  const matches = url.match(/\/move\/(\d+)\//);
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

export default function Home() {
  const [activeTab, setActiveTab] = useState<'pokemon' | 'locations' | 'moves'>('pokemon');
  const [pokemonList, setPokemonList] = useState<PokemonData[]>([]);
  const [locationList, setLocationList] = useState<LocationData[]>([]);
  const [moveList, setMoveList] = useState<MoveData[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [moveLoading, setMoveLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load Pokemon progressively
  useEffect(() => {
    // Only load if the list is empty
    if (pokemonList.length > 0) return;

    async function loadAllData() {
      const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=10000');
      const data: PokemonListResponse = await response.json();
      
      // Sort URLs by Pokemon ID for better progressive display
      const sortedUrls = data.results.sort((a, b) => {
        const idA = getPokemonId(a.url);
        const idB = getPokemonId(b.url);
        return idA - idB;
      });
      
      setLoading(false); // Allow interactivity as soon as we start loading
      
      // Load Pokemon progressively
      for (const pokemon of sortedUrls) {
        const pokemonResponse = await fetch(pokemon.url);
        const pokemonInfo: PokemonData = await pokemonResponse.json();
        
        // Add each Pokemon as it loads, maintaining sorted order and avoiding duplicates
        setPokemonList((prev) => {
          // Check if this Pokemon already exists
          if (prev.some((p) => p.id === pokemonInfo.id || p.name === pokemonInfo.name)) {
            return prev;
          }
          const updated = [...prev, pokemonInfo];
          return updated.sort((a, b) => a.id - b.id);
        });
      }
    }

    loadAllData();
  }, [pokemonList.length]);

  // Load Locations progressively when tab is activated
  useEffect(() => {
    if (activeTab === 'locations' && locationList.length === 0 && !locationLoading) {
      async function loadLocations() {
        setLocationLoading(true);
        const response = await fetch('https://pokeapi.co/api/v2/location?limit=1000');
        const data: LocationListResponse = await response.json();
        
        // Sort URLs by Location ID for better progressive display
        const sortedUrls = data.results.sort((a, b) => {
          const idA = getLocationId(a.url);
          const idB = getLocationId(b.url);
          return idA - idB;
        });
        
        // Load Locations progressively
        for (const location of sortedUrls) {
          const locationResponse = await fetch(location.url);
          const locationInfo: LocationData = await locationResponse.json();
          
          // Add each location as it loads, maintaining sorted order
          setLocationList((prev) => {
            const updated = [...prev, locationInfo];
            return updated.sort((a, b) => a.id - b.id);
          });
        }
        setLocationLoading(false);
      }

      loadLocations();
    }
  }, [activeTab, locationList.length, locationLoading]);

  // Load Moves progressively when tab is activated
  useEffect(() => {
    if (activeTab === 'moves' && moveList.length === 0 && !moveLoading) {
      async function loadMoves() {
        setMoveLoading(true);
        const response = await fetch('https://pokeapi.co/api/v2/move?limit=10000');
        const data: MoveListResponse = await response.json();
        
        // Sort URLs by Move ID for better progressive display
        const sortedUrls = data.results.sort((a, b) => {
          const idA = getMoveId(a.url);
          const idB = getMoveId(b.url);
          return idA - idB;
        });
        
        // Load Moves progressively
        for (const move of sortedUrls) {
          const moveResponse = await fetch(move.url);
          const moveInfo: MoveData = await moveResponse.json();
          
          // Add each move as it loads, maintaining sorted order
          setMoveList((prev) => {
            const updated = [...prev, moveInfo];
            return updated.sort((a, b) => a.id - b.id);
          });
        }
        setMoveLoading(false);
      }

      loadMoves();
    }
  }, [activeTab, moveList.length, moveLoading]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        <div className="w-full rounded-b-2xl bg-white dark:bg-zinc-900 shadow-lg dark:shadow-zinc-800/50 p-6 flex flex-col items-center justify-center gap-2">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Full Pokemon List</h1>
          <h2 className="text-sm text-gray-500 dark:text-gray-400">Generated by <a href="https://pokeapi.co/" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">PokeAPI</a></h2>
        </div>
        <div className="flex flex-1 flex-col items-center justify-start p-4 pb-8 gap-4">
          <div className="w-full max-w-4xl">
            <div className="flex gap-2 mb-4">
              <button
                disabled
                className="flex-1 px-4 py-2 rounded-lg font-medium bg-zinc-200 dark:bg-zinc-800 text-gray-500 dark:text-gray-500 cursor-not-allowed opacity-50"
              >
                Pokemon
              </button>
              <button
                disabled
                className="flex-1 px-4 py-2 rounded-lg font-medium bg-zinc-200 dark:bg-zinc-800 text-gray-500 dark:text-gray-500 cursor-not-allowed opacity-50"
              >
                Locations
              </button>
              <button
                disabled
                className="flex-1 px-4 py-2 rounded-lg font-medium bg-zinc-200 dark:bg-zinc-800 text-gray-500 dark:text-gray-500 cursor-not-allowed opacity-50"
              >
                Moves
              </button>
            </div>
            <input
              type="text"
              placeholder="Search Pokemon..."
              value=""
              disabled
              className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 opacity-50 cursor-not-allowed"
            />
          </div>
          <div className="w-full max-w-4xl h-[800px] rounded-2xl bg-white dark:bg-zinc-900 shadow-lg dark:shadow-zinc-800/50 p-6 flex items-center justify-center">
            <span className="text-gray-600 dark:text-gray-400">Loading Pokemon...</span>
          </div>
        </div>
        <div className="flex justify-center pb-6">
          <Link 
            href="/about"
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            About
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <div className="w-full rounded-b-2xl bg-white dark:bg-zinc-900 shadow-lg dark:shadow-zinc-800/50 p-6 flex flex-col items-center justify-center gap-2">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Full Pokemon List</h1>
        <h2 className="text-sm text-gray-500 dark:text-gray-400">Generated by <a href="https://pokeapi.co/" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">PokeAPI</a></h2>
      </div>
      <div className="flex flex-1 flex-col items-center justify-start p-4 pb-8 gap-4">
        <div className="w-full max-w-4xl">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('pokemon')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'pokemon'
                  ? 'bg-blue-500 text-white dark:bg-blue-600'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              Pokemon
            </button>
            <button
              onClick={() => setActiveTab('locations')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'locations'
                  ? 'bg-blue-500 text-white dark:bg-blue-600'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              Locations
            </button>
            <button
              onClick={() => setActiveTab('moves')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'moves'
                  ? 'bg-blue-500 text-white dark:bg-blue-600'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              Moves
            </button>
          </div>
          <input
            type="text"
            placeholder={
              activeTab === 'pokemon' 
                ? 'Search Pokemon...' 
                : activeTab === 'locations' 
                ? 'Search Locations...' 
                : 'Search Moves...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
          />
        </div>
        <div className="w-full max-w-4xl h-[800px] rounded-2xl bg-white dark:bg-zinc-900 shadow-lg dark:shadow-zinc-800/50 p-6 flex flex-col">
          <div className="overflow-y-auto flex-1">
            {activeTab === 'pokemon' ? (
              <ul className="grid grid-cols-3 gap-4">
                {pokemonList
                  .filter((pokemon) => {
                    if (!searchTerm) return true;
                    const search = searchTerm.toLowerCase();
                    const pokemonName = pokemon.name.toLowerCase();
                    return pokemonName.includes(search) || pokemon.id.toString().includes(search);
                  })
                  .map((pokemon) => {
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
                      <li key={pokemon.id} className="relative">
                        <Link
                          href={`/pokemon/${pokemon.name}`}
                          className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative cursor-pointer"
                          style={borderStyle}
                        >
                          <span className="text-sm text-gray-400 dark:text-gray-500 font-mono">
                            #{pokemon.id}
                          </span>
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
            ) : activeTab === 'locations' ? (
              <ul className="grid grid-cols-3 gap-4">
                {locationList
                  .filter((location) => {
                    if (!searchTerm) return true;
                    const search = searchTerm.toLowerCase();
                    const locationName = location.name.toLowerCase();
                    const regionName = location.region?.name.toLowerCase() || '';
                    return locationName.includes(search) || regionName.includes(search) || location.id.toString().includes(search);
                  })
                  .map((location) => (
                    <li
                      key={location.name}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <span className="text-sm text-center text-gray-800 dark:text-gray-200 font-medium">
                        {formatPokemonName(location.name)}
                      </span>
                      {location.region && (
                        <span className="text-xs text-center text-gray-500 dark:text-gray-400">
                          {formatPokemonName(location.region.name)}
                        </span>
                      )}
                    </li>
                  ))}
                {locationLoading && locationList.length === 0 && (
                  <li className="col-span-3 text-center text-gray-600 dark:text-gray-400 py-8">
                    Loading locations...
                  </li>
                )}
              </ul>
            ) : (
              <ul className="grid grid-cols-3 gap-4">
                {moveList
                  .filter((move) => {
                    if (!searchTerm) return true;
                    const search = searchTerm.toLowerCase();
                    const moveName = move.name.toLowerCase();
                    const moveType = move.type?.name.toLowerCase() || '';
                    const damageClass = move.damage_class?.name.toLowerCase() || '';
                    return moveName.includes(search) || moveType.includes(search) || damageClass.includes(search);
                  })
                  .map((move) => {
                    const moveTypeColor = move.type ? getTypeColor(move.type.name) : '';
                    const borderStyle: React.CSSProperties = {};
                    if (moveTypeColor) {
                      borderStyle.borderLeftWidth = '10px';
                      borderStyle.borderLeftColor = moveTypeColor;
                    }
                    
                    return (
                      <li
                        key={move.name}
                        className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative"
                        style={borderStyle}
                      >
                        <span className="text-sm text-center text-gray-800 dark:text-gray-200 font-medium">
                          {formatPokemonName(move.name)}
                        </span>
                        {move.damage_class && (
                          <span className="text-xs text-center text-gray-400 dark:text-gray-500">
                            {formatPokemonName(move.damage_class.name)}
                          </span>
                        )}
                      </li>
                    );
                  })}
                {moveLoading && moveList.length === 0 && (
                  <li className="col-span-3 text-center text-gray-600 dark:text-gray-400 py-8">
                    Loading moves...
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-center pb-6">
        <Link 
          href="/about"
          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
        >
          About
        </Link>
      </div>
    </div>
  );
}
