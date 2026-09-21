/**
 * Mock Train Search Service
 *
 * 6 realistic Mumbai → Bengaluru trains.
 */

import type { TrainOption, SearchQuery } from "./types";
import { BOARDING_POINTS } from "./boardingPoints";

const mumbaiJn = BOARDING_POINTS.find((p) => p.id === 20)!;
const sbc = BOARDING_POINTS.find((p) => p.id === 22)!;
const ypr = BOARDING_POINTS.find((p) => p.id === 23)!;

const MOCK_TRAINS: TrainOption[] = [
  {
    id: 201,
    trainNumber: "12627",
    trainName: "Karnataka Express",
    originStation: mumbaiJn,
    destStation: sbc,
    departureTime: "21:15",
    arrivalTime: "16:40",
    durationHrs: 19.4,
    classes: [
      { code: "SL", name: "Sleeper", fareInr: 475, availableSeats: 120 },
      { code: "3A", name: "AC 3 Tier", fareInr: 1250, availableSeats: 45 },
      { code: "2A", name: "AC 2 Tier", fareInr: 1780, availableSeats: 20 },
      { code: "1A", name: "AC First Class", fareInr: 3050, availableSeats: 8 },
    ],
    mode: "train",
  },
  {
    id: 202,
    trainNumber: "11023",
    trainName: "Sahyadri Express",
    originStation: mumbaiJn,
    destStation: sbc,
    departureTime: "16:45",
    arrivalTime: "14:30",
    durationHrs: 21.75,
    classes: [
      { code: "SL", name: "Sleeper", fareInr: 440, availableSeats: 90 },
      { code: "3A", name: "AC 3 Tier", fareInr: 1180, availableSeats: 30 },
      { code: "2A", name: "AC 2 Tier", fareInr: 1690, availableSeats: 15 },
    ],
    mode: "train",
  },
  {
    id: 203,
    trainNumber: "16529",
    trainName: "Udyan Express",
    originStation: mumbaiJn,
    destStation: sbc,
    departureTime: "08:25",
    arrivalTime: "05:00",
    durationHrs: 20.58,
    classes: [
      { code: "SL", name: "Sleeper", fareInr: 460, availableSeats: 100 },
      { code: "3A", name: "AC 3 Tier", fareInr: 1220, availableSeats: 35 },
      { code: "2A", name: "AC 2 Tier", fareInr: 1740, availableSeats: 18 },
      { code: "1A", name: "AC First Class", fareInr: 2980, availableSeats: 6 },
    ],
    mode: "train",
  },
  {
    id: 204,
    trainNumber: "22691",
    trainName: "Rajya Rani Express",
    originStation: mumbaiJn,
    destStation: ypr,
    departureTime: "23:00",
    arrivalTime: "14:45",
    durationHrs: 15.75,
    classes: [
      { code: "SL", name: "Sleeper", fareInr: 490, availableSeats: 80 },
      { code: "3A", name: "AC 3 Tier", fareInr: 1300, availableSeats: 40 },
      { code: "2A", name: "AC 2 Tier", fareInr: 1850, availableSeats: 16 },
    ],
    mode: "train",
  },
  {
    id: 205,
    trainNumber: "12163",
    trainName: "Superfast Express",
    originStation: mumbaiJn,
    destStation: sbc,
    departureTime: "15:30",
    arrivalTime: "08:15",
    durationHrs: 16.75,
    classes: [
      { code: "CC", name: "AC Chair Car", fareInr: 850, availableSeats: 60 },
      { code: "3A", name: "AC 3 Tier", fareInr: 1280, availableSeats: 35 },
      { code: "2A", name: "AC 2 Tier", fareInr: 1820, availableSeats: 18 },
    ],
    mode: "train",
  },
  {
    id: 206,
    trainNumber: "20649",
    trainName: "Vande Bharat Express",
    originStation: mumbaiJn,
    destStation: sbc,
    departureTime: "06:00",
    arrivalTime: "15:30",
    durationHrs: 9.5,
    classes: [
      { code: "CC", name: "AC Chair Car", fareInr: 1450, availableSeats: 100 },
      { code: "EC", name: "Executive Class", fareInr: 2800, availableSeats: 30 },
    ],
    mode: "train",
  },
];

/**
 * Search for trains between two cities.
 */
export function searchTrains(query: SearchQuery): TrainOption[] {
  const originNorm = query.originCity.toLowerCase().trim();
  const destNorm = query.destCity.toLowerCase().trim();

  return MOCK_TRAINS.filter(
    (train) =>
      train.originStation.city.toLowerCase() === originNorm &&
      train.destStation.city.toLowerCase() === destNorm
  ).sort((a, b) => a.durationHrs - b.durationHrs);
}

/**
 * Get a train by ID.
 */
export function getTrainById(id: number): TrainOption | undefined {
  return MOCK_TRAINS.find((train) => train.id === id);
}
