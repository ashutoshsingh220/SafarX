<div align="center">
  <img src="docs/logo/safarx_logo.png" width="180" alt="SafarX Logo" />
  <h1>SafarX</h1>
  <h3>Next-Generation Multimodal Door-to-Door Travel Assistant & Autonomous Transit Engine</h3>
  <p>Seamlessly uniting Indian Railways, live commercial flights, intercity bus networks, outstation cabs, and first/last-mile feeder connections into a single unified journey with Google Maps intelligence and Groq LLaMA 3.3 AI conversational reasoning.</p>
</div>

<div align="center">

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React Native](https://img.shields.io/badge/React%20Native-Expo%2051-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev/)
[![Groq Cloud](https://img.shields.io/badge/Groq%20Cloud-LLaMA%203.3-F55036?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com/)
[![Google Maps](https://img.shields.io/badge/Google%20Maps-Geocoding%20%26%20Directions-4285F4?style=for-the-badge&logo=googlemaps&logoColor=white)](https://developers.google.com/maps)
[![SerpApi](https://img.shields.io/badge/SerpApi-Live%20Google%20Flights-00C49F?style=for-the-badge&logo=googleflights&logoColor=white)](https://serpapi.com/)
[![RapidAPI](https://img.shields.io/badge/RapidAPI-IRCTC%20Railways-0055FF?style=for-the-badge&logo=rapidapi&logoColor=white)](https://rapidapi.com/)
[![Clerk](https://img.shields.io/badge/Clerk-Authentication-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)](https://clerk.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgis.net/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

---

## 📱 Live Mobile Interface Showcase

<div align="center">
  <p><em>Real-time screenshots captured from the live Android emulator build (Pixel 8)</em></p>
</div>

### Part 1: All-India Multimodal Transit Corridors

| 🚆 Indian Railways Corridors | ✈️ Live Commercial Flights | 🚌 Intercity Express Buses | 🚖 Outstation Private Cabs |
| :---: | :---: | :---: | :---: |
| <img src="docs/screenshots/05_trains_corridor.png" width="220" alt="Indian Railways Corridors" /> | <img src="docs/screenshots/06_flights_live.png" width="220" alt="Live Commercial Flights" /> | <img src="docs/screenshots/07_buses_intercity.png" width="220" alt="Intercity Express Buses" /> | <img src="docs/screenshots/08_cabs_outstation.png" width="220" alt="Outstation Cabs" /> |
| **Direct Trunk Rail**<br/>• IRCTC-calibrated live train schedules<br/>• Pawan & Goa Express corridors<br/>• Multi-class tariffs (3A, 2A, Sleeper)<br/>• Real-time RAC/WL probability | **Live Google Flights**<br/>• Live commercial airline rates (IndiGo, Akasa)<br/>• Non-stop & connecting flight detection<br/>• Real-time INR fare tiers (Saver, Flexi)<br/>• Baggage & seat inclusion filters | **Regional Bus Networks**<br/>• Multi-axle Volvo & BharatBenz sleepers<br/>• Doorstep pickup & ISBT dropoffs<br/>• Upper/Lower sleeper seat selection<br/>• Real road highway durations | **Door-to-Door Private Cabs**<br/>• Zero-transfer non-stop journeys<br/>• AC Sedan & Premier SUV options<br/>• Live Google Directions road telemetry<br/>• Includes toll, fuel & driver allowances |

### Part 2: Dynamic Door-to-Door Stitching & Digital Boarding Pass

| 📍 1-Click Multimodal Bundle Review | 🎟️ Verified Digital Boarding Pass | 🗺️ Google Maps Navigation & Routing |
| :---: | :---: | :---: |
| <img src="docs/screenshots/09_bundle_review.png" width="240" alt="Bundle Review" /> | <img src="docs/screenshots/10_digital_ticket.png" width="240" alt="Digital Boarding Pass" /> | <img src="docs/screenshots/02_place_explorer_directions.png" width="240" alt="Google Maps Routing" /> |
| **Synchronized 3-Leg Journey**<br/>1️⃣ **First-Mile**: Auto/Cab doorstep pickup<br/>2️⃣ **Long-Haul**: Selected Train/Flight/Bus ticket<br/>3️⃣ **Last-Mile**: Auto/Cab drop to destination<br/>• Transparent combined pricing breakdown | **Single All-in-One PNR**<br/>• Scannable secure QR code<br/>• Unified multimodal travel itinerary<br/>• Real-time journey countdown<br/>• Emergency SOS & 1-tap support | **Google Directions Telemetry**<br/>• Live route polyline rendering<br/>• Sub-meter GPS positioning<br/>• Dynamic distance & duration calculations<br/>• Live driver & feeder tracking |

---

## 📌 Problem Statement & Engineering Solution

Intercity travel in India has historically suffered from extreme fragmentation:
1. **First-Mile Disconnect**: Commuters must guess local auto/cab fares and buffer times to reach railway stations or airports.
2. **Disconnected Modes**: Searching flights, trains, and buses requires toggling between 4+ different apps with inconsistent schedules.
3. **Hardcoded Corridors**: Conventional apps fail or recommend bizarre detours (e.g. routing Goa to Pune via Delhi) when direct routes aren't easily indexed.
4. **Last-Mile Abandonment**: Deboarding at unfamiliar junctions leaves travelers stranded without pre-booked reliable local transport.

**SafarX solves this end-to-end** through an autonomous multimodal engine that fuses **Google Maps Geocoding & Directions API**, **SerpApi Google Flights telemetry**, **Indian Railways direct trunk junctions**, and **Decoupled Multi-Hub Nearest-Neighbor (k-NN) Expanding Fallback Loops**.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph MobileClient["📱 Mobile Client (React Native / Expo 51)"]
        SearchUI["Multimodal Search Screen<br/>(Train, Flight, Bus, Cab)"]
        MapEngine["Google Maps Native Polyline & Marker Engine"]
        AgentChat["Groq LLaMA 3.3 AI Travel Assistant"]
        StitchView["Dynamic 3-Leg Stitching Sheet"]
    end

    subgraph APIGateway["⚡ FastAPI High-Performance Gateway (:8000)"]
        Router["Async FastAPI Router & CORS"]
        GeocodeCache["Google Geocode In-Memory Cache"]
        DirectionsCache["Google Directions In-Memory Cache"]
        SerpApiCache["SerpApi Live Flights Cache"]
    end

    subgraph SpatialBrain["🗺️ Geospatial Intelligence & Fallback Engine"]
        GoogleGeo["Google Maps Geocoding API<br/>(Sub-km Coordinate Resolution)"]
        GoogleDir["Google Maps Directions API<br/>(Real Highway Distance & ETAs)"]
        HubRegistry["Certified Transit Hubs Registry<br/>(AAI Airports, IRCTC Junctions, ISBTs)"]
        KNN["Decoupled Multi-Hub k-NN Engine<br/>(Expanding Radial Rings R1 → R2 → R3)"]
    end

    subgraph TransitServices["🚆 Live Transit Inventory & Aggregation"]
        SerpApi["SerpApi Google Flights Engine<br/>(IndiGo, Akasa, Air India)"]
        RapidAPI["RapidAPI IRCTC Live Engine<br/>(Pawan Exp, Goa Exp, Rajdhani)"]
        BusEngine["InterCity Express Bus Service<br/>(Zingbus, IntrCity, VRL)"]
        CabEngine["Outstation Direct Cab Engine<br/>(Sedan & Premier SUV)"]
    end

    subgraph Database["🗄️ Persistence & Telemetry Layer"]
        PostgreSQL[("PostgreSQL 15 + PostGIS<br/>Spatial Storage")]
        RedisCache[("Redis 7 In-Memory Cache")]
    end

    SearchUI -->|HTTP / JSON| Router
    MapEngine -->|Directions Request| Router
    AgentChat -->|Function Calling| Router

    Router --> GeocodeCache
    Router --> DirectionsCache
    Router --> SerpApiCache

    GeocodeCache --> GoogleGeo
    DirectionsCache --> GoogleDir
    Router --> HubRegistry
    HubRegistry --> KNN

    KNN -->|Mode: Flight| SerpApi
    KNN -->|Mode: Train| RapidAPI
    KNN -->|Mode: Bus| BusEngine
    KNN -->|Mode: Cab| CabEngine

    Router --> PostgreSQL
    Router --> RedisCache
```

---

## 🧠 Key Technical Highlights

### 1. Decoupled Multi-Hub Nearest-Neighbor (k-NN) Expanding Fallbacks
* **Complete Mode Independence**: Unavailability or connection requirements in one mode (e.g. no direct commercial flight to a smaller town) **NEVER** alters or distorts other modes. Trains and Buses remain 100% direct at their local terminals.
* **Expanding Radial Rings (Ring 1 → Ring 2 → Ring 3)**:
  * **Flights**: Checks candidate airport pairs (Origin Airport × Destination Airport). If Ring 1 (local airstrip) has no active commercial flights, it automatically expands to Ring 2 (regional commercial airport), stitching an airport feeder cab for the remaining road distance.
  * **Trains**: Checks candidate railway junctions (Origin Station × Destination Station). For example, traveling from **Goa to Hadapsar, Pune** matches Madgaon Junction to Hadapsar Railway Station directly on the **Goa Express (12779)**.
  * **Buses**: Connects closest authentic ISBT terminals (e.g. Nerul LP / Vashi Bus Terminal → Darbhanga Bus Stand Delhi More).
  * **Cabs**: Point-to-point road trip calculated directly via Google Directions API.

```mermaid
flowchart LR
    Origin["User Origin<br/>(e.g., Hadapsar, Pune)"] --> GGeo["Google Maps Geocoding API"]
    GGeo --> Coords["Exact GPS Coordinates<br/>(18.5089° N, 73.9259° E)"]
    
    Coords --> Ring1["Ring 1: Immediate Hubs<br/>(< 25 km)"]
    Ring1 -->|Train Found| DirectRail["Pune / Hadapsar Rail Station<br/>(Direct Train)"]
    Ring1 -->|Airport Found| LocalAir["Pune Airport (PNQ)<br/>(Live Flight)"]
    
    Coords -.->|If No Commercial Flight| Ring2["Ring 2: Regional Gateways<br/>(25 - 150 km)"]
    Ring2 --> RegAir["Mumbai Airport (BOM)<br/>(+ Airport Feeder Cab)"]
```

### 2. Google Maps Primary Geographic Brain
* **Universal Resolution**: Any Indian address, town, or railway station name is resolved to GPS coordinates via Google Geocoding API with memory caching.
* **Live Highway Telemetry**: Driving distances, traffic conditions, and driving durations are derived directly from Google Directions API (`mode=driving`), replacing theoretical straight-line approximations.

### 3. Dynamic Door-to-Door 3-Leg Journey Stitching
Rather than requiring travelers to manually book multiple disconnected tickets, SafarX automatically links three distinct journey legs into a synchronized, single-ticket itinerary:

* 🚗 **Leg 1 (First-Mile Feeder)**: Doorstep pickup via local cab/auto to the departure railway station, airport, or bus terminal.
* 🚆 / ✈️ / 🚌 **Leg 2 (Long-Haul Trunk)**: Intercity express journey via Indian Railways, commercial flight, or intercity sleeper bus.
* 🚕 **Leg 3 (Last-Mile Feeder)**: Pre-arranged local cab/auto connection from arrival junction to final destination.

#### 📊 Unified Cost & Duration Calculation

| Metric | Formula Breakdown | Description |
| :--- | :--- | :--- |
| **Total Fare** | `First-Mile Cab Fare + Intercity Ticket Fare + Last-Mile Cab Fare` | Transparent combined pricing with zero hidden surcharges |
| **Total Duration** | `First-Mile Transfer + Intercity Travel Time + Last-Mile Dropoff` | Complete doorstep-to-doorstep journey duration with realistic buffer times |

All three legs are bundled into a single checkout flow, providing travelers with a guaranteed all-in-one digital boarding pass with a scannable QR code.

---

## 💻 Tech Stack & Used APIs

| Domain | Used APIs & Technologies | Implementation / Purpose |
| :--- | :--- | :--- |
| **Mobile Client** | React Native, Expo 51, TypeScript, NativeWind | Cross-platform passenger mobile interface |
| **Backend Framework** | FastAPI (Python 3.11+), Uvicorn, Pydantic v2 | High-performance async REST API & routing engine |
| **AI Conversational Engine** | **Groq Cloud API** (`LLaMA 3.3 70B Versatile`) | Ultra-fast sub-second LLM inference assistant for intelligent travel planning and queries |
| **Mapping & Navigation** | **Google Maps Platform** (Maps SDK, Places API, Directions API, Geocoding) | Native vector map rendering, address autocomplete, live route polylines & real road telemetry |
| **Flight Telemetry** | **SerpApi** (Google Flights Engine) | Real-time commercial domestic flight schedules, airlines & live INR pricing |
| **Railways Connectivity** | **RapidAPI IRCTC / Indian Railways Engine** | Direct train schedules, trunk corridor matching & multi-class tariffs |
| **User Authentication** | **Clerk** (`@clerk/clerk-expo`) | User registration, social login, secure session management |
| **Payment Processing** | **Stripe** (`@stripe/stripe-react-native`) | In-app secure payment gateway & checkout |
| **Data & Cache Layer** | **PostgreSQL 15**, **Redis 7** | Spatial data persistence & in-memory caching |
| **DevOps & Containers** | Docker, Docker Compose, ADB Reverse TCP Forwarding | Local containerization and Android USB/emulator debugging |

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
* **Python 3.11+** installed
* **Node.js 18+** and `npm` / `npx` installed
* **Android Studio & Emulator** (or physical Android device with USB debugging)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/ashutoshsingh220/SafarX.git
cd SafarX
```

---

### Step 2: Backend Configuration & Startup

1. **Navigate to the backend directory and set up a virtual environment**:
   ```bash
   cd safarx/backend
   python -m venv venv
   
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**:
   Copy the provided `.env.example` template:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and provide your API keys:
   ```ini
   # Google Maps Platform (Geocoding & Directions)
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

   # Groq Cloud AI Engine (LLaMA 3.3 Fast Inference)
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=llama-3.3-70b-versatile

   # Google Flights Telemetry (SerpApi)
   SERPAPI_API_KEY=your_serpapi_api_key_here

   # Indian Railways Live Engine (RapidAPI IRCTC)
   RAPIDAPI_KEY=your_rapidapi_key_here
   ```

4. **Start the FastAPI backend server**:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   > Backend will be live at `http://127.0.0.1:8000`. Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

---

### Step 3: Mobile App Setup (React Native / Expo)

1. **Open a new terminal and enable port forwarding to the Android device**:
   ```bash
   adb reverse tcp:8000 tcp:8000
   ```

2. **Navigate to the mobile directory and install packages**:
   ```bash
   cd ../../uber-clone
   npm install
   ```

3. **Configure Mobile Environment Variables**:
   Copy the provided `.env.example` template:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and configure your API keys:
   ```ini
   # Clerk Authentication
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

   # Google Maps Platform
   EXPO_PUBLIC_PLACES_API_KEY=your_google_places_api_key
   EXPO_PUBLIC_DIRECTIONS_API_KEY=your_google_directions_api_key

   # Groq Cloud AI Engine
   EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key
   EXPO_PUBLIC_GROQ_MODEL=llama-3.3-70b-versatile

   # Stripe Payments
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

   # Backend API Base URL
   EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
   ```

4. **Launch the Expo Metro Bundler**:
   ```bash
   npx expo start -c
   ```
   > Press **`a`** in the terminal to launch the application directly on your running Android emulator.

---

## 🔒 Security & Credential Protection

> [!IMPORTANT]
> This repository strictly adheres to industry security best practices:
> - **Zero Key Leaks**: Live API keys (`.env` files, `.key`, `.pem`, credentials) are strictly excluded from git tracking via comprehensive `.gitignore` rules.
> - **Public Template Files**: Only sanitized `.env.example` templates with empty placeholders are tracked in version control.
> - **Safe Local Fallbacks**: If external API keys are omitted, the backend automatically transitions to calibrated simulation models, ensuring no unhandled crashes.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <b>Built with ❤️ by Ashutosh Singh</b><br/>
  <i>Engineered for seamless, reliable, and intelligent transit across India.</i>
</div>
