/**
 * Mock Location Data
 * Client App - Location Selection Modal
 *
 * Mock data for Phase 1 development.
 * Will be replaced with real API calls in Phase 2.
 */

import type { Location } from '@rentascooter/shared';

/**
 * Mock previous locations - user's recent destinations
 */
export const mockPreviousLocations: Location[] = [
  {
    latitude: 14.6937,
    longitude: -17.4441,
    address: '123 Avenue Bourguiba, Dakar',
    name: 'Home',
  },
  {
    latitude: 14.7167,
    longitude: -17.4677,
    address: "Place de l'Indépendance, Plateau, Dakar",
    name: 'Downtown Office',
  },
  {
    latitude: 14.6928,
    longitude: -17.4467,
    address: 'Marché Sandaga, Médina, Dakar',
    name: 'Sandaga Market',
  },
  {
    latitude: 14.7461,
    longitude: -17.4894,
    address: 'Université Cheikh Anta Diop, Fann, Dakar',
    name: 'UCAD',
  },
  {
    latitude: 14.7392,
    longitude: -17.4922,
    address: 'Corniche Ouest, Fann, Dakar',
    name: 'Corniche Beach',
  },
];

/**
 * Mock search results - locations matching search query
 */
export const mockSearchResults: Location[] = [
  {
    latitude: 14.6928,
    longitude: -17.4467,
    address: 'Marché Sandaga, Médina, Dakar',
    name: 'Sandaga Market',
  },
  {
    latitude: 14.7167,
    longitude: -17.4677,
    address: "Place de l'Indépendance, Plateau, Dakar",
    name: "Place de l'Indépendance",
  },
  {
    latitude: 14.6937,
    longitude: -17.4441,
    address: 'Avenue Pompidou, Plateau, Dakar',
    name: 'Pompidou Avenue',
  },
  {
    latitude: 14.7461,
    longitude: -17.4894,
    address: 'Université Cheikh Anta Diop, Fann, Dakar',
    name: 'UCAD University',
  },
  {
    latitude: 14.7392,
    longitude: -17.4922,
    address: 'Corniche Ouest, Fann, Dakar',
    name: 'Corniche Ouest',
  },
  {
    latitude: 14.6959,
    longitude: -17.4472,
    address: 'Marché Kermel, Plateau, Dakar',
    name: 'Kermel Market',
  },
  {
    latitude: 14.6753,
    longitude: -17.4381,
    address: 'Gare Routière Pompiers, Dakar',
    name: 'Pompiers Bus Station',
  },
  {
    latitude: 14.7644,
    longitude: -17.3701,
    address: 'Aéroport International Blaise Diagne, Diass',
    name: 'AIBD Airport',
  },
  {
    latitude: 14.7119,
    longitude: -17.4647,
    address: 'Cathédrale du Souvenir Africain, Plateau, Dakar',
    name: 'African Memorial Cathedral',
  },
  {
    latitude: 14.6892,
    longitude: -17.4511,
    address: 'Marché HLM, Dakar',
    name: 'HLM Market',
  },
];
