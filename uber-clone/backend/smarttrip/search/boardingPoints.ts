/**
 * Boarding Points Data
 *
 * Key bus stops, railway stations, and airports for Mumbai and Bengaluru.
 */

import type { BoardingPoint } from "./types";

export const BOARDING_POINTS: BoardingPoint[] = [
  // === CSMT BUS STOPS ===
  { id: 1, name: "Dadar Bus Stand", city: "Mumbai", lat: 18.5018, lon: 73.8636, type: "bus_stop", address: "Swargate, Mumbai 411042" },
  { id: 2, name: "Borivali Bus Stand", city: "Mumbai", lat: 18.5308, lon: 73.8475, type: "bus_stop", address: "Shivajinagar, Mumbai 411005" },
  { id: 3, name: "Thane Bus Stop", city: "Mumbai", lat: 18.5981, lon: 73.7608, type: "bus_stop", address: "Wakad, Mumbai 411057" },
  { id: 4, name: "Hinjewadi Phase 1 Bus Stop", city: "Mumbai", lat: 18.5912, lon: 73.7389, type: "bus_stop", address: "Hinjewadi, Mumbai 411057" },
  { id: 5, name: "Mumbai Station Bus Stop", city: "Mumbai", lat: 18.5285, lon: 73.8743, type: "bus_stop", address: "Near Mumbai Railway Station, Mumbai 411001" },
  { id: 6, name: "Katraj Bus Stop", city: "Mumbai", lat: 18.4575, lon: 73.8681, type: "bus_stop", address: "Katraj, Mumbai 411046" },
  { id: 7, name: "Hadapsar Bus Stand", city: "Mumbai", lat: 18.5089, lon: 73.9260, type: "bus_stop", address: "Hadapsar, Mumbai 411028" },

  // === BANGALORE BUS STOPS ===
  { id: 10, name: "Majestic Bus Station (Kempegowda)", city: "Bengaluru", lat: 12.9772, lon: 77.5720, type: "bus_stop", address: "Majestic, Bengaluru 560009" },
  { id: 11, name: "Silk Board Bus Stop", city: "Bengaluru", lat: 12.9170, lon: 77.6228, type: "bus_stop", address: "Silk Board, Bengaluru 560076" },
  { id: 12, name: "Electronic City Bus Stop", city: "Bengaluru", lat: 12.8456, lon: 77.6603, type: "bus_stop", address: "Electronic City, Bengaluru 560100" },
  { id: 13, name: "Whitefield Bus Stop", city: "Bengaluru", lat: 12.9698, lon: 77.7500, type: "bus_stop", address: "Whitefield, Bengaluru 560066" },
  { id: 14, name: "Marathahalli Bus Stop", city: "Bengaluru", lat: 12.9563, lon: 77.7019, type: "bus_stop", address: "Marathahalli, Bengaluru 560037" },
  { id: 15, name: "Hebbal Bus Stop", city: "Bengaluru", lat: 13.0358, lon: 77.5970, type: "bus_stop", address: "Hebbal, Bengaluru 560024" },

  // === RAILWAY STATIONS ===
  { id: 20, name: "Mumbai Junction (CSMT)", city: "Mumbai", lat: 18.5285, lon: 73.8743, type: "railway_station", address: "Mumbai Junction, Mumbai 411001" },
  { id: 21, name: "Andheri Station (SNR)", city: "Mumbai", lat: 18.5340, lon: 73.8480, type: "railway_station", address: "Shivajinagar, Mumbai 411005" },
  { id: 22, name: "KSR Bengaluru City (SBC)", city: "Bengaluru", lat: 12.9784, lon: 77.5714, type: "railway_station", address: "Majestic, Bengaluru 560023" },
  { id: 23, name: "Yeshwantpur Junction (YPR)", city: "Bengaluru", lat: 13.0280, lon: 77.5350, type: "railway_station", address: "Yeshwantpur, Bengaluru 560022" },
  { id: 24, name: "Cantonment Station (BNC)", city: "Bengaluru", lat: 12.9942, lon: 77.5960, type: "railway_station", address: "Cantonment, Bengaluru 560042" },

  // === AIRPORTS ===
  { id: 30, name: "Mumbai Airport (BOM)", city: "Mumbai", lat: 18.5822, lon: 73.9197, type: "airport", address: "Lohegaon, Mumbai 411032" },
  { id: 31, name: "Kempegowda International Airport (BLR)", city: "Bengaluru", lat: 13.1986, lon: 77.7066, type: "airport", address: "Devanahalli, Bengaluru 560300" },
];

/**
 * Find the nearest boarding point to a given lat/lon.
 * Uses haversine-like simple distance (good enough for <50km).
 */
export function findNearestBoardingPoints(
  lat: number,
  lon: number,
  type?: BoardingPoint["type"],
  limit: number = 3
): BoardingPoint[] {
  let points = BOARDING_POINTS;
  if (type) {
    points = points.filter((p) => p.type === type);
  }

  return points
    .map((p) => ({
      ...p,
      _dist: Math.sqrt(
        Math.pow(p.lat - lat, 2) + Math.pow(p.lon - lon, 2)
      ),
    }))
    .sort((a, b) => a._dist - b._dist)
    .slice(0, limit)
    .map(({ _dist, ...p }) => p);
}
