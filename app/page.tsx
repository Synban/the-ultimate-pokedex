'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Species {
  name: string;
  url: string;
}

interface SpeciesListResponse {
  results: Species[];
}

interface SpeciesVariety {
  is_default: boolean;
  pokemon: {
    name: string;
    url: string;
  };
}

interface SpeciesData {
  id: number;
  name: string;
  varieties: SpeciesVariety[];
}

interface PokemonData {
  id: number;
  name: string;
  sprites: {
    front_default: string | null;
  };
}

interface PokemonForm {
  id: number;
  name: string;
  sprite: string;
  isDefault: boolean;
}

interface GroupedPokemon {
  speciesId: number;
  speciesName: string;
  forms: PokemonForm[];
}

function getPokemonId(url: string): number {
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

async function loadPokemonBatch(
  speciesList: Species[],
  startSpeciesIndex: number,
  targetCount: number,
  seenPokemonNames: Set<string>
): Promise<{ groups: GroupedPokemon[]; nextSpeciesIndex: number }> {
  const groups: GroupedPokemon[] = [];
  let speciesIndex = startSpeciesIndex;
  let pokemonCount = 0;

  while (pokemonCount < targetCount && speciesIndex < speciesList.length) {
    const species = speciesList[speciesIndex];
    const speciesResponse = await fetch(species.url);
    const speciesData: SpeciesData = await speciesResponse.json();
    
    const forms: PokemonForm[] = [];
    
    // Process all varieties/forms for this species
    for (const variety of speciesData.varieties) {
      const pokemonName = variety.pokemon.name;
      
      // Skip if we've already seen this Pokemon (avoids duplicates from overflow)
      if (seenPokemonNames.has(pokemonName)) {
        continue;
      }
      
      const pokemonResponse = await fetch(variety.pokemon.url);
      const pokemonData: PokemonData = await pokemonResponse.json();
      
      forms.push({
        id: pokemonData.id,
        name: pokemonName,
        sprite: pokemonData.sprites.front_default || getPokemonSpriteUrl(pokemonData.id),
        isDefault: variety.is_default,
      });
      
      seenPokemonNames.add(pokemonName);
      pokemonCount++;
    }
    
    // Sort forms by ID within the species
    forms.sort((a, b) => a.id - b.id);
    
    if (forms.length > 0) {
      groups.push({
        speciesId: speciesData.id,
        speciesName: speciesData.name,
        forms,
      });
    }
    
    speciesIndex++;
  }
  
  // Sort groups by the lowest form ID (first form)
  groups.sort((a, b) => a.forms[0].id - b.forms[0].id);
  
  return {
    groups,
    nextSpeciesIndex: speciesIndex,
  };
}

export default function Home() {
  const [pokemonGroups, setPokemonGroups] = useState<GroupedPokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [currentSpeciesIndex, setCurrentSpeciesIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const seenPokemonNamesRef = useRef<Set<string>>(new Set());
  const observerTarget = useRef<HTMLDivElement>(null);

  // Load initial species list
  useEffect(() => {
    async function loadInitialData() {
      const response = await fetch('https://pokeapi.co/api/v2/pokemon-species?limit=10000');
      const data: SpeciesListResponse = await response.json();
      setSpeciesList(data.results);

      // Load first 100 Pokemon
      const result = await loadPokemonBatch(
        data.results,
        0,
        300,
        seenPokemonNamesRef.current
      );
      setPokemonGroups(result.groups);
      setCurrentSpeciesIndex(result.nextSpeciesIndex);
      setLoading(false);
    }

    loadInitialData();
  }, []);

  // Load more Pokemon when near bottom
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || speciesList.length === 0) return;

    setLoadingMore(true);
    const result = await loadPokemonBatch(
      speciesList,
      currentSpeciesIndex,
      300,
      seenPokemonNamesRef.current
    );

    if (result.groups.length === 0 || result.nextSpeciesIndex >= speciesList.length) {
      setHasMore(false);
    } else {
      setPokemonGroups((prev) => {
        const combined = [...prev, ...result.groups];
        // Re-sort all groups by first form ID
        combined.sort((a, b) => a.forms[0].id - b.forms[0].id);
        return combined;
      });
      setCurrentSpeciesIndex(result.nextSpeciesIndex);
    }

    setLoadingMore(false);
  }, [currentSpeciesIndex, hasMore, loadingMore, speciesList]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadMore, loadingMore]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        <div className="w-full rounded-b-2xl bg-white dark:bg-zinc-900 shadow-lg dark:shadow-zinc-800/50 p-6 flex items-center justify-center">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Full Pokemon List</h1>
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-4xl h-[800px] rounded-2xl bg-white dark:bg-zinc-900 shadow-lg dark:shadow-zinc-800/50 p-6 flex items-center justify-center">
            <span className="text-gray-600 dark:text-gray-400">Loading Pokemon...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <div className="w-full rounded-b-2xl bg-white dark:bg-zinc-900 shadow-lg dark:shadow-zinc-800/50 p-6 flex items-center justify-center">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Full Pokemon List</h1>
      </div>
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-4xl h-[800px] rounded-2xl bg-white dark:bg-zinc-900 shadow-lg dark:shadow-zinc-800/50 p-6 flex flex-col">
        <div className="overflow-y-auto flex-1">
          <ul className="space-y-2">
            {pokemonGroups.flatMap((group) =>
              group.forms.map((form) => (
                <li
                  key={form.name}
                  className="flex items-center gap-4 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span className="text-sm text-gray-400 dark:text-gray-500 font-mono w-12 text-right">
                    #{form.id}
                  </span>
                  <img
                    src={form.sprite}
                    alt={form.name}
                    className="w-12 h-12 object-contain"
                  />
                  <span className="text-lg text-gray-800 dark:text-gray-200">
                    {formatPokemonName(form.name)}
                  </span>
                </li>
              ))
            )}
          </ul>
          <div ref={observerTarget} className="h-10 flex items-center justify-center">
            {loadingMore && (
              <span className="text-sm text-gray-400 dark:text-gray-500">Loading more...</span>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
