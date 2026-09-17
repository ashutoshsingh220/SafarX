import { searchBuses } from "../../../backend/smarttrip/search/buses";
import { searchTrains } from "../../../backend/smarttrip/search/trains";
import { searchFlights } from "../../../backend/smarttrip/search/flights";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Normalize in case Geoapify sends "Mumbai, Maharashtra, India"
    if (body.originCity) {
      body.originCity = body.originCity.split(',')[0].trim();
    }
    if (body.destCity) {
      body.destCity = body.destCity.split(',')[0].trim();
    }
    
    const buses = searchBuses(body);
    const trains = searchTrains(body);
    const flights = searchFlights(body);
    
    const all = [...buses, ...trains, ...flights].sort((a: any, b: any) => {
       // Simple mock sorting: flights first, then trains, then buses (by speed roughly)
       if (a.mode === 'flight' && b.mode !== 'flight') return -1;
       if (a.mode !== 'flight' && b.mode === 'flight') return 1;
       return a.durationHrs - b.durationHrs;
    });

    return Response.json({ data: all });
  } catch (error: any) {
    console.error("Search API Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
