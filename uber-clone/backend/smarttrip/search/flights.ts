/**
 * Mock Flight Search Service
 *
 * Realistic Mumbai (PNQ) → Bengaluru (BLR) flights.
 * In production, swap with Amadeus Test API calls.
 */

import type { FlightOption, SearchQuery } from "./types";
import { BOARDING_POINTS } from "./boardingPoints";

const pnq = BOARDING_POINTS.find((p) => p.id === 30)!;
const blr = BOARDING_POINTS.find((p) => p.id === 31)!;

const MOCK_FLIGHTS: FlightOption[] = [
  {
    id: 301,
    airline: "IndiGo",
    flightNumber: "6E 2145",
    originAirport: pnq,
    destAirport: blr,
    departureTime: "06:15",
    arrivalTime: "07:45",
    durationHrs: 1.5,
    fareInr: 3200,
    cabinClass: "economy",
    mode: "flight",
  },
  {
    id: 302,
    airline: "IndiGo",
    flightNumber: "6E 6789",
    originAirport: pnq,
    destAirport: blr,
    departureTime: "14:30",
    arrivalTime: "16:00",
    durationHrs: 1.5,
    fareInr: 3800,
    cabinClass: "economy",
    mode: "flight",
  },
  {
    id: 303,
    airline: "Air India",
    flightNumber: "AI 651",
    originAirport: pnq,
    destAirport: blr,
    departureTime: "09:00",
    arrivalTime: "10:35",
    durationHrs: 1.58,
    fareInr: 4500,
    cabinClass: "economy",
    mode: "flight",
  },
  {
    id: 304,
    airline: "Air India",
    flightNumber: "AI 653",
    originAirport: pnq,
    destAirport: blr,
    departureTime: "18:00",
    arrivalTime: "19:35",
    durationHrs: 1.58,
    fareInr: 5200,
    cabinClass: "premium_economy",
    mode: "flight",
  },
  {
    id: 305,
    airline: "SpiceJet",
    flightNumber: "SG 3456",
    originAirport: pnq,
    destAirport: blr,
    departureTime: "11:30",
    arrivalTime: "13:00",
    durationHrs: 1.5,
    fareInr: 2900,
    cabinClass: "economy",
    mode: "flight",
  },
  {
    id: 306,
    airline: "Vistara",
    flightNumber: "UK 847",
    originAirport: pnq,
    destAirport: blr,
    departureTime: "07:45",
    arrivalTime: "09:15",
    durationHrs: 1.5,
    fareInr: 5800,
    cabinClass: "premium_economy",
    mode: "flight",
  },
  {
    id: 307,
    airline: "Vistara",
    flightNumber: "UK 849",
    originAirport: pnq,
    destAirport: blr,
    departureTime: "16:00",
    arrivalTime: "17:30",
    durationHrs: 1.5,
    fareInr: 9500,
    cabinClass: "business",
    mode: "flight",
  },
  {
    id: 308,
    airline: "Akasa Air",
    flightNumber: "QP 1234",
    originAirport: pnq,
    destAirport: blr,
    departureTime: "12:00",
    arrivalTime: "13:30",
    durationHrs: 1.5,
    fareInr: 2750,
    cabinClass: "economy",
    mode: "flight",
  },
];

/**
 * Search for flights between two cities.
 */
export function searchFlights(query: SearchQuery): FlightOption[] {
  const originNorm = query.originCity.toLowerCase().trim();
  const destNorm = query.destCity.toLowerCase().trim();

  return MOCK_FLIGHTS.filter(
    (flight) =>
      flight.originAirport.city.toLowerCase() === originNorm &&
      flight.destAirport.city.toLowerCase() === destNorm
  ).sort((a, b) => a.fareInr - b.fareInr);
}

/**
 * Get a flight by ID.
 */
export function getFlightById(id: number): FlightOption | undefined {
  return MOCK_FLIGHTS.find((flight) => flight.id === id);
}
