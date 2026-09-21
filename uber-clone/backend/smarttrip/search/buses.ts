/**
 * Mock Bus Search Service
 *
 * 40+ realistic Mumbai → Bengaluru bus options across operators.
 */

import type { BusOption, SearchQuery } from "./types";
import { BOARDING_POINTS } from "./boardingPoints";

const mumbaiSwargate = BOARDING_POINTS.find((p) => p.id === 1)!;
const mumbaiShivajinagar = BOARDING_POINTS.find((p) => p.id === 2)!;
const mumbaiWakad = BOARDING_POINTS.find((p) => p.id === 3)!;
const mumbaiHinjewadi = BOARDING_POINTS.find((p) => p.id === 4)!;
const mumbaiStation = BOARDING_POINTS.find((p) => p.id === 5)!;
const mumbaiKatraj = BOARDING_POINTS.find((p) => p.id === 6)!;
const mumbaiHadapsar = BOARDING_POINTS.find((p) => p.id === 7)!;
const blrMajestic = BOARDING_POINTS.find((p) => p.id === 10)!;
const blrSilkBoard = BOARDING_POINTS.find((p) => p.id === 11)!;
const blrEC = BOARDING_POINTS.find((p) => p.id === 12)!;
const blrWhitefield = BOARDING_POINTS.find((p) => p.id === 13)!;
const blrMarathahalli = BOARDING_POINTS.find((p) => p.id === 14)!;
const blrHebbal = BOARDING_POINTS.find((p) => p.id === 15)!;

const MOCK_BUSES: BusOption[] = [
  // === VRL Travels ===
  { id: 101, operator: "VRL Travels", busType: "sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiSwargate, destStop: blrMajestic, departureTime: "18:00", arrivalTime: "06:00", durationHrs: 12, fareInr: 850, availableSeats: 22, amenities: ["blanket", "water", "charging"], rating: 4.2, mode: "bus" },
  { id: 102, operator: "VRL Travels", busType: "ac-sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiSwargate, destStop: blrMajestic, departureTime: "20:00", arrivalTime: "07:30", durationHrs: 11.5, fareInr: 1200, availableSeats: 18, amenities: ["ac", "blanket", "water", "charging", "wifi"], rating: 4.5, mode: "bus" },
  { id: 103, operator: "VRL Travels", busType: "semi-sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiShivajinagar, destStop: blrHebbal, departureTime: "21:00", arrivalTime: "08:30", durationHrs: 11.5, fareInr: 750, availableSeats: 30, amenities: ["water", "charging"], rating: 4.0, mode: "bus" },

  // === SRS Travels ===
  { id: 104, operator: "SRS Travels", busType: "ac-sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiSwargate, destStop: blrMajestic, departureTime: "19:30", arrivalTime: "07:00", durationHrs: 11.5, fareInr: 1100, availableSeats: 20, amenities: ["ac", "blanket", "water", "charging"], rating: 4.3, mode: "bus" },
  { id: 105, operator: "SRS Travels", busType: "sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiKatraj, destStop: blrSilkBoard, departureTime: "22:00", arrivalTime: "09:00", durationHrs: 11, fareInr: 800, availableSeats: 25, amenities: ["blanket", "water"], rating: 4.1, mode: "bus" },
  { id: 106, operator: "SRS Travels", busType: "seater", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiSwargate, destStop: blrMajestic, departureTime: "17:00", arrivalTime: "05:30", durationHrs: 12.5, fareInr: 600, availableSeats: 35, amenities: ["water"], rating: 3.8, mode: "bus" },

  // === Neeta Travels ===
  { id: 107, operator: "Neeta Travels", busType: "ac-sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiWakad, destStop: blrMajestic, departureTime: "20:30", arrivalTime: "07:30", durationHrs: 11, fareInr: 1300, availableSeats: 15, amenities: ["ac", "blanket", "water", "charging", "wifi", "snacks"], rating: 4.6, mode: "bus" },
  { id: 108, operator: "Neeta Travels", busType: "sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiHinjewadi, destStop: blrWhitefield, departureTime: "19:00", arrivalTime: "06:30", durationHrs: 11.5, fareInr: 900, availableSeats: 20, amenities: ["blanket", "water", "charging"], rating: 4.3, mode: "bus" },
  { id: 109, operator: "Neeta Travels", busType: "semi-sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiSwargate, destStop: blrEC, departureTime: "21:30", arrivalTime: "09:00", durationHrs: 11.5, fareInr: 780, availableSeats: 28, amenities: ["water", "charging"], rating: 4.1, mode: "bus" },

  // === Paulo Travels ===
  { id: 110, operator: "Paulo Travels", busType: "ac-sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiSwargate, destStop: blrMajestic, departureTime: "18:30", arrivalTime: "05:30", durationHrs: 11, fareInr: 1400, availableSeats: 12, amenities: ["ac", "blanket", "water", "charging", "wifi", "snacks", "entertainment"], rating: 4.7, mode: "bus" },
  { id: 111, operator: "Paulo Travels", busType: "sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiStation, destStop: blrMajestic, departureTime: "20:00", arrivalTime: "07:00", durationHrs: 11, fareInr: 950, availableSeats: 18, amenities: ["blanket", "water", "charging"], rating: 4.4, mode: "bus" },

  // === Konduskar Travels ===
  { id: 112, operator: "Konduskar Travels", busType: "semi-sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiSwargate, destStop: blrMajestic, departureTime: "17:30", arrivalTime: "06:00", durationHrs: 12.5, fareInr: 700, availableSeats: 32, amenities: ["water"], rating: 3.9, mode: "bus" },
  { id: 113, operator: "Konduskar Travels", busType: "sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiHadapsar, destStop: blrMarathahalli, departureTime: "19:00", arrivalTime: "06:30", durationHrs: 11.5, fareInr: 820, availableSeats: 24, amenities: ["blanket", "water"], rating: 4.0, mode: "bus" },

  // === MSRTC (Maharashtra State) ===
  { id: 114, operator: "MSRTC Shivneri", busType: "seater", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiSwargate, destStop: blrMajestic, departureTime: "16:00", arrivalTime: "05:00", durationHrs: 13, fareInr: 550, availableSeats: 40, amenities: ["water"], rating: 3.5, mode: "bus" },
  { id: 115, operator: "MSRTC Shivneri", busType: "semi-sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiSwargate, destStop: blrMajestic, departureTime: "18:00", arrivalTime: "06:30", durationHrs: 12.5, fareInr: 650, availableSeats: 35, amenities: ["water", "charging"], rating: 3.7, mode: "bus" },

  // === KSRTC (Karnataka State) ===
  { id: 116, operator: "KSRTC Airavat", busType: "ac-sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiSwargate, destStop: blrMajestic, departureTime: "19:00", arrivalTime: "06:00", durationHrs: 11, fareInr: 1050, availableSeats: 20, amenities: ["ac", "blanket", "water", "charging"], rating: 4.4, mode: "bus" },
  { id: 117, operator: "KSRTC Airavat", busType: "semi-sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiSwargate, destStop: blrMajestic, departureTime: "20:30", arrivalTime: "08:00", durationHrs: 11.5, fareInr: 800, availableSeats: 30, amenities: ["ac", "water"], rating: 4.2, mode: "bus" },
  { id: 118, operator: "KSRTC Rajahamsa", busType: "seater", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiSwargate, destStop: blrMajestic, departureTime: "15:00", arrivalTime: "04:00", durationHrs: 13, fareInr: 500, availableSeats: 42, amenities: ["water"], rating: 3.6, mode: "bus" },

  // === Hubballi-Dharwad Road Transport ===
  { id: 119, operator: "NWKRTC", busType: "seater", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiSwargate, destStop: blrMajestic, departureTime: "14:00", arrivalTime: "03:30", durationHrs: 13.5, fareInr: 480, availableSeats: 44, amenities: [], rating: 3.3, mode: "bus" },

  // === Orange Travels ===
  { id: 120, operator: "Orange Travels", busType: "ac-sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiShivajinagar, destStop: blrMajestic, departureTime: "21:00", arrivalTime: "08:00", durationHrs: 11, fareInr: 1150, availableSeats: 16, amenities: ["ac", "blanket", "water", "charging", "wifi"], rating: 4.4, mode: "bus" },
  { id: 121, operator: "Orange Travels", busType: "sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiKatraj, destStop: blrSilkBoard, departureTime: "19:30", arrivalTime: "07:00", durationHrs: 11.5, fareInr: 880, availableSeats: 22, amenities: ["blanket", "water", "charging"], rating: 4.2, mode: "bus" },

  // === Jabbar Travels ===
  { id: 122, operator: "Jabbar Travels", busType: "sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiSwargate, destStop: blrMajestic, departureTime: "22:00", arrivalTime: "09:30", durationHrs: 11.5, fareInr: 830, availableSeats: 20, amenities: ["blanket", "water"], rating: 4.0, mode: "bus" },
  { id: 123, operator: "Jabbar Travels", busType: "semi-sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiSwargate, destStop: blrEC, departureTime: "20:00", arrivalTime: "07:30", durationHrs: 11.5, fareInr: 720, availableSeats: 28, amenities: ["water"], rating: 3.9, mode: "bus" },

  // === Greenline Travels ===
  { id: 124, operator: "Greenline Travels", busType: "ac-sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiWakad, destStop: blrWhitefield, departureTime: "20:00", arrivalTime: "06:30", durationHrs: 10.5, fareInr: 1350, availableSeats: 14, amenities: ["ac", "blanket", "water", "charging", "wifi", "snacks"], rating: 4.6, mode: "bus" },
  { id: 125, operator: "Greenline Travels", busType: "sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiSwargate, destStop: blrMajestic, departureTime: "18:30", arrivalTime: "06:00", durationHrs: 11.5, fareInr: 920, availableSeats: 20, amenities: ["blanket", "water", "charging"], rating: 4.3, mode: "bus" },

  // === Sugama Travels ===
  { id: 126, operator: "Sugama Travels", busType: "ac-sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiStation, destStop: blrMajestic, departureTime: "19:00", arrivalTime: "06:00", durationHrs: 11, fareInr: 1100, availableSeats: 18, amenities: ["ac", "blanket", "water", "charging"], rating: 4.3, mode: "bus" },
  { id: 127, operator: "Sugama Travels", busType: "sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiSwargate, destStop: blrHebbal, departureTime: "21:00", arrivalTime: "08:00", durationHrs: 11, fareInr: 870, availableSeats: 22, amenities: ["blanket", "water"], rating: 4.1, mode: "bus" },

  // === Humsafar ===
  { id: 128, operator: "Humsafar", busType: "ac-sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiHinjewadi, destStop: blrEC, departureTime: "19:30", arrivalTime: "06:30", durationHrs: 11, fareInr: 1250, availableSeats: 16, amenities: ["ac", "blanket", "water", "charging", "wifi"], rating: 4.5, mode: "bus" },

  // === Prasanna Purple ===
  { id: 129, operator: "Prasanna Purple", busType: "ac-sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiSwargate, destStop: blrMajestic, departureTime: "17:00", arrivalTime: "04:30", durationHrs: 11.5, fareInr: 1050, availableSeats: 20, amenities: ["ac", "blanket", "water", "charging"], rating: 4.2, mode: "bus" },
  { id: 130, operator: "Prasanna Purple", busType: "semi-sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiShivajinagar, destStop: blrMajestic, departureTime: "22:00", arrivalTime: "09:30", durationHrs: 11.5, fareInr: 750, availableSeats: 30, amenities: ["water", "charging"], rating: 4.0, mode: "bus" },

  // === Shree Ganesh Travels ===
  { id: 131, operator: "Shree Ganesh Travels", busType: "sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiSwargate, destStop: blrMajestic, departureTime: "20:30", arrivalTime: "08:00", durationHrs: 11.5, fareInr: 800, availableSeats: 24, amenities: ["blanket", "water"], rating: 3.9, mode: "bus" },
  { id: 132, operator: "Shree Ganesh Travels", busType: "seater", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiSwargate, destStop: blrMajestic, departureTime: "16:30", arrivalTime: "05:30", durationHrs: 13, fareInr: 580, availableSeats: 38, amenities: ["water"], rating: 3.6, mode: "bus" },

  // === Kaveri Travels ===
  { id: 133, operator: "Kaveri Travels", busType: "ac-sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiSwargate, destStop: blrSilkBoard, departureTime: "18:00", arrivalTime: "05:30", durationHrs: 11.5, fareInr: 1180, availableSeats: 16, amenities: ["ac", "blanket", "water", "charging", "wifi"], rating: 4.5, mode: "bus" },
  { id: 134, operator: "Kaveri Travels", busType: "sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiHadapsar, destStop: blrMarathahalli, departureTime: "20:00", arrivalTime: "07:00", durationHrs: 11, fareInr: 860, availableSeats: 20, amenities: ["blanket", "water", "charging"], rating: 4.2, mode: "bus" },

  // === Sai Anjana Travels ===
  { id: 135, operator: "Sai Anjana Travels", busType: "semi-sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiSwargate, destStop: blrMajestic, departureTime: "19:00", arrivalTime: "07:00", durationHrs: 12, fareInr: 700, availableSeats: 32, amenities: ["water"], rating: 3.7, mode: "bus" },
  { id: 136, operator: "Sai Anjana Travels", busType: "sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiKatraj, destStop: blrMajestic, departureTime: "21:30", arrivalTime: "09:00", durationHrs: 11.5, fareInr: 780, availableSeats: 26, amenities: ["blanket", "water"], rating: 3.8, mode: "bus" },

  // === National Travels ===
  { id: 137, operator: "National Travels", busType: "ac-sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiWakad, destStop: blrMajestic, departureTime: "19:00", arrivalTime: "06:00", durationHrs: 11, fareInr: 1200, availableSeats: 14, amenities: ["ac", "blanket", "water", "charging", "wifi"], rating: 4.4, mode: "bus" },
  { id: 138, operator: "National Travels", busType: "sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiSwargate, destStop: blrEC, departureTime: "22:30", arrivalTime: "10:00", durationHrs: 11.5, fareInr: 850, availableSeats: 22, amenities: ["blanket", "water"], rating: 4.1, mode: "bus" },

  // === Durgamba Motors ===
  { id: 139, operator: "Durgamba Motors", busType: "seater", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiSwargate, destStop: blrMajestic, departureTime: "15:30", arrivalTime: "04:30", durationHrs: 13, fareInr: 520, availableSeats: 40, amenities: ["water"], rating: 3.5, mode: "bus" },
  { id: 140, operator: "Durgamba Motors", busType: "semi-sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiSwargate, destStop: blrMajestic, departureTime: "18:00", arrivalTime: "06:30", durationHrs: 12.5, fareInr: 680, availableSeats: 34, amenities: ["water", "charging"], rating: 3.7, mode: "bus" },

  // === Sharma Transports ===
  { id: 141, operator: "Sharma Transports", busType: "sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiShivajinagar, destStop: blrWhitefield, departureTime: "20:00", arrivalTime: "07:30", durationHrs: 11.5, fareInr: 890, availableSeats: 20, amenities: ["blanket", "water", "charging"], rating: 4.2, mode: "bus" },
  { id: 142, operator: "Sharma Transports", busType: "ac-sleeper", originCity: "Mumbai", destCity: "Bengaluru", originStop: mumbaiHinjewadi, destStop: blrMajestic, departureTime: "21:00", arrivalTime: "07:30", durationHrs: 10.5, fareInr: 1320, availableSeats: 12, amenities: ["ac", "blanket", "water", "charging", "wifi", "snacks"], rating: 4.6, mode: "bus" },
];

/**
 * Search for buses between two cities on a given date.
 * Currently returns mock data; ready to swap for a real DB query.
 */
export function searchBuses(query: SearchQuery): BusOption[] {
  const originNorm = query.originCity.toLowerCase().trim();
  const destNorm = query.destCity.toLowerCase().trim();

  return MOCK_BUSES.filter(
    (bus) =>
      bus.originCity.toLowerCase() === originNorm &&
      bus.destCity.toLowerCase() === destNorm
  ).sort((a, b) => a.fareInr - b.fareInr);
}

/**
 * Get a bus by ID.
 */
export function getBusById(id: number): BusOption | undefined {
  return MOCK_BUSES.find((bus) => bus.id === id);
}
