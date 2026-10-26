"""High-Performance Transit Hubs & Multi-Tier All-India Geocoding Service.

Provides exhaustive coverage across ALL 28 States and 8 Union Territories of India:
1. Commercial DGCA/AAI Airports and UDAN Regional Airstrips.
2. Indian Railways Division Junctions, Termini & Hill Foothill Railheads.
3. Central & Inter-State Bus Terminals (ISBTs) across key districts.
4. Google Maps Geocoding & Android Header Secured Pinpoint Location Resolver.
5. Universal Reachability Radar: accurately explains nearest railheads, airports,
   exact road distances, feeder modes (Sumo/Cab/Auto) and door-to-door fares.
"""

import json
import logging
import math
import os
import urllib.parse
import urllib.request
from typing import Literal, Optional, TypedDict
from dotenv import load_dotenv

# Ensure environment variables are loaded across any execution context
_backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
for _env_path in [
    os.path.join(_backend_dir, ".env"),
    os.path.join(_backend_dir, "..", "uber-clone", ".env"),
]:
    if os.path.exists(_env_path):
        load_dotenv(_env_path, override=False)

load_dotenv()
logger = logging.getLogger(__name__)

GOOGLE_API_HEADERS = {
    "User-Agent": "SafarX/3.0",
    "X-Android-Package": "com.ashukharayat.uberclone",
    "X-Android-Cert": "9E013D154716FFBD112ECA1E2C178CBFB0023848",
}

class HubInfo(TypedDict):
    name: str
    code: str
    city: str
    state: str
    hub_type: str
    latitude: float
    longitude: float


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two GPS coordinates in kilometers."""
    radius_km = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    return radius_km * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# =========================================================================
# COMPREHENSIVE ALL-INDIA TRANSIT HUBS REGISTRY (28 STATES & 8 UTS)
# =========================================================================
INDIAN_TRANSIT_HUBS: list[HubInfo] = [
    {
        "name": "Darbhanga Airport",
        "code": "DBR",
        "city": "Darbhanga",
        "state": "Bihar",
        "hub_type": "AIRPORT",
        "latitude": 26.1932,
        "longitude": 85.9142
    },
    {
        "name": "Jay Prakash Narayan International Airport",
        "code": "PAT",
        "city": "Patna",
        "state": "Bihar",
        "hub_type": "AIRPORT",
        "latitude": 25.5913,
        "longitude": 85.088
    },
    {
        "name": "Gaya International Airport",
        "code": "GAY",
        "city": "Gaya",
        "state": "Bihar",
        "hub_type": "AIRPORT",
        "latitude": 24.7441,
        "longitude": 84.9512
    },
    {
        "name": "Birsa Munda Airport",
        "code": "IXR",
        "city": "Ranchi",
        "state": "Jharkhand",
        "hub_type": "AIRPORT",
        "latitude": 23.3143,
        "longitude": 85.3217
    },
    {
        "name": "Deoghar Airport",
        "code": "DGH",
        "city": "Deoghar",
        "state": "Jharkhand",
        "hub_type": "AIRPORT",
        "latitude": 24.4447,
        "longitude": 86.7022
    },
    {
        "name": "Sonari Airport",
        "code": "IXW",
        "city": "Jamshedpur",
        "state": "Jharkhand",
        "hub_type": "AIRPORT",
        "latitude": 22.813,
        "longitude": 86.168
    },
    {
        "name": "Darbhanga Junction",
        "code": "DBG",
        "city": "Darbhanga",
        "state": "Bihar",
        "hub_type": "RAILWAY_STATION",
        "latitude": 26.1524,
        "longitude": 85.8971
    },
    {
        "name": "Samastipur Junction",
        "code": "SPJ",
        "city": "Samastipur",
        "state": "Bihar",
        "hub_type": "RAILWAY_STATION",
        "latitude": 25.8617,
        "longitude": 85.7824
    },
    {
        "name": "Muzaffarpur Junction",
        "code": "MFP",
        "city": "Muzaffarpur",
        "state": "Bihar",
        "hub_type": "RAILWAY_STATION",
        "latitude": 26.1245,
        "longitude": 85.3887
    },
    {
        "name": "Patna Junction",
        "code": "PNBE",
        "city": "Patna",
        "state": "Bihar",
        "hub_type": "RAILWAY_STATION",
        "latitude": 25.6025,
        "longitude": 85.1376
    },
    {
        "name": "Patliputra Junction",
        "code": "PPTA",
        "city": "Patna",
        "state": "Bihar",
        "hub_type": "RAILWAY_STATION",
        "latitude": 25.6375,
        "longitude": 85.0886
    },
    {
        "name": "Danapur Railway Station",
        "code": "DNR",
        "city": "Patna",
        "state": "Bihar",
        "hub_type": "RAILWAY_STATION",
        "latitude": 25.6267,
        "longitude": 85.0442
    },
    {
        "name": "Gaya Junction",
        "code": "GAYA",
        "city": "Gaya",
        "state": "Bihar",
        "hub_type": "RAILWAY_STATION",
        "latitude": 24.8078,
        "longitude": 84.9997
    },
    {
        "name": "Barauni Junction",
        "code": "BJU",
        "city": "Barauni",
        "state": "Bihar",
        "hub_type": "RAILWAY_STATION",
        "latitude": 25.4744,
        "longitude": 85.9744
    },
    {
        "name": "Bhagalpur Junction",
        "code": "BGP",
        "city": "Bhagalpur",
        "state": "Bihar",
        "hub_type": "RAILWAY_STATION",
        "latitude": 25.2425,
        "longitude": 86.9746
    },
    {
        "name": "Katihar Junction",
        "code": "KIR",
        "city": "Katihar",
        "state": "Bihar",
        "hub_type": "RAILWAY_STATION",
        "latitude": 25.5392,
        "longitude": 87.5684
    },
    {
        "name": "Ranchi Railway Station",
        "code": "RNC",
        "city": "Ranchi",
        "state": "Jharkhand",
        "hub_type": "RAILWAY_STATION",
        "latitude": 23.3512,
        "longitude": 85.3378
    },
    {
        "name": "Tatanagar Junction",
        "code": "TATA",
        "city": "Jamshedpur",
        "state": "Jharkhand",
        "hub_type": "RAILWAY_STATION",
        "latitude": 22.7683,
        "longitude": 86.2011
    },
    {
        "name": "Dhanbad Junction",
        "code": "DHN",
        "city": "Dhanbad",
        "state": "Jharkhand",
        "hub_type": "RAILWAY_STATION",
        "latitude": 23.7917,
        "longitude": 86.4306
    },
    {
        "name": "Darbhanga Bus Stand (Delhi More)",
        "code": "DBG-BS",
        "city": "Darbhanga",
        "state": "Bihar",
        "hub_type": "BUS_TERMINAL",
        "latitude": 26.15,
        "longitude": 85.9
    },
    {
        "name": "Pataliputra ISBT Bairiya",
        "code": "PAT-ISBT",
        "city": "Patna",
        "state": "Bihar",
        "hub_type": "BUS_TERMINAL",
        "latitude": 25.568,
        "longitude": 85.182
    },
    {
        "name": "Muzaffarpur Bairia ISBT",
        "code": "MFP-ISBT",
        "city": "Muzaffarpur",
        "state": "Bihar",
        "hub_type": "BUS_TERMINAL",
        "latitude": 26.138,
        "longitude": 85.362
    },
    {
        "name": "Birsa Munda Bus Terminal Khadgarha",
        "code": "IXR-ISBT",
        "city": "Ranchi",
        "state": "Jharkhand",
        "hub_type": "BUS_TERMINAL",
        "latitude": 23.368,
        "longitude": 85.342
    },
    {
        "name": "Mango Bus Stand Jamshedpur",
        "code": "TATA-BS",
        "city": "Jamshedpur",
        "state": "Jharkhand",
        "hub_type": "BUS_TERMINAL",
        "latitude": 22.821,
        "longitude": 86.205
    },
    {
        "name": "Chhatrapati Shivaji Maharaj International Airport",
        "code": "BOM",
        "city": "Mumbai",
        "state": "Maharashtra",
        "hub_type": "AIRPORT",
        "latitude": 19.0896,
        "longitude": 72.8656
    },
    {
        "name": "Navi Mumbai International Airport",
        "code": "NMI",
        "city": "Navi Mumbai",
        "state": "Maharashtra",
        "hub_type": "AIRPORT",
        "latitude": 18.9902,
        "longitude": 73.0694
    },
    {
        "name": "Pune International Airport",
        "code": "PNQ",
        "city": "Pune",
        "state": "Maharashtra",
        "hub_type": "AIRPORT",
        "latitude": 18.5822,
        "longitude": 73.9197
    },
    {
        "name": "Dr. Babasaheb Ambedkar International Airport",
        "code": "NAG",
        "city": "Nagpur",
        "state": "Maharashtra",
        "hub_type": "AIRPORT",
        "latitude": 21.0922,
        "longitude": 79.0472
    },
    {
        "name": "Nashik Airport Ozar",
        "code": "ISK",
        "city": "Nashik",
        "state": "Maharashtra",
        "hub_type": "AIRPORT",
        "latitude": 20.1192,
        "longitude": 73.9136
    },
    {
        "name": "Chhatrapati Sambhajinagar Airport",
        "code": "IXU",
        "city": "Aurangabad",
        "state": "Maharashtra",
        "hub_type": "AIRPORT",
        "latitude": 19.8631,
        "longitude": 75.3981
    },
    {
        "name": "Kolhapur Airport",
        "code": "KLH",
        "city": "Kolhapur",
        "state": "Maharashtra",
        "hub_type": "AIRPORT",
        "latitude": 16.6644,
        "longitude": 74.2817
    },
    {
        "name": "Lokmanya Tilak Terminus",
        "code": "LTT",
        "city": "Mumbai",
        "state": "Maharashtra",
        "hub_type": "RAILWAY_STATION",
        "latitude": 19.0698,
        "longitude": 72.8911
    },
    {
        "name": "Panvel Junction (Navi Mumbai)",
        "code": "PNVL",
        "city": "Navi Mumbai",
        "state": "Maharashtra",
        "hub_type": "RAILWAY_STATION",
        "latitude": 18.9894,
        "longitude": 73.1207
    },
    {
        "name": "Chhatrapati Shivaji Maharaj Terminus",
        "code": "CSMT",
        "city": "Mumbai",
        "state": "Maharashtra",
        "hub_type": "RAILWAY_STATION",
        "latitude": 18.9401,
        "longitude": 72.8354
    },
    {
        "name": "Bandra Terminus",
        "code": "BDTS",
        "city": "Mumbai",
        "state": "Maharashtra",
        "hub_type": "RAILWAY_STATION",
        "latitude": 19.0628,
        "longitude": 72.8407
    },
    {
        "name": "Mumbai Central",
        "code": "MMCT",
        "city": "Mumbai",
        "state": "Maharashtra",
        "hub_type": "RAILWAY_STATION",
        "latitude": 18.9696,
        "longitude": 72.8193
    },
    {
        "name": "Thane Railway Station",
        "code": "TNA",
        "city": "Thane",
        "state": "Maharashtra",
        "hub_type": "RAILWAY_STATION",
        "latitude": 19.186,
        "longitude": 72.9757
    },
    {
        "name": "Kalyan Junction",
        "code": "KYN",
        "city": "Kalyan",
        "state": "Maharashtra",
        "hub_type": "RAILWAY_STATION",
        "latitude": 19.2364,
        "longitude": 73.1306
    },
    {
        "name": "Borivali Railway Station",
        "code": "BVI",
        "city": "Mumbai",
        "state": "Maharashtra",
        "hub_type": "RAILWAY_STATION",
        "latitude": 19.229,
        "longitude": 72.857
    },
    {
        "name": "Pune Junction",
        "code": "PUNE",
        "city": "Pune",
        "state": "Maharashtra",
        "hub_type": "RAILWAY_STATION",
        "latitude": 18.5284,
        "longitude": 73.8744
    },
    {
        "name": "Hadapsar Railway Station",
        "code": "HDP",
        "city": "Pune",
        "state": "Maharashtra",
        "hub_type": "SUBURBAN_STATION",
        "latitude": 18.5133,
        "longitude": 73.9317
    },
    {
        "name": "Shivajinagar Railway Station",
        "code": "SVJR",
        "city": "Pune",
        "state": "Maharashtra",
        "hub_type": "SUBURBAN_STATION",
        "latitude": 18.5323,
        "longitude": 73.8524
    },
    {
        "name": "Nagpur Junction",
        "code": "NGP",
        "city": "Nagpur",
        "state": "Maharashtra",
        "hub_type": "RAILWAY_STATION",
        "latitude": 21.1524,
        "longitude": 79.0888
    },
    {
        "name": "Nashik Road Railway Station",
        "code": "NK",
        "city": "Nashik",
        "state": "Maharashtra",
        "hub_type": "RAILWAY_STATION",
        "latitude": 19.9575,
        "longitude": 73.8347
    },
    {
        "name": "Vashi Highway Bus Terminal (Navi Mumbai)",
        "code": "NAV-VSH",
        "city": "Navi Mumbai",
        "state": "Maharashtra",
        "hub_type": "BUS_TERMINAL",
        "latitude": 19.0645,
        "longitude": 72.9985
    },
    {
        "name": "Nerul LP Bus Terminal (Navi Mumbai)",
        "code": "NAV-NRL",
        "city": "Navi Mumbai",
        "state": "Maharashtra",
        "hub_type": "BUS_TERMINAL",
        "latitude": 19.033,
        "longitude": 73.018
    },
    {
        "name": "Borivali Western Bus Stand Mumbai",
        "code": "MUM-BOR",
        "city": "Mumbai",
        "state": "Maharashtra",
        "hub_type": "BUS_TERMINAL",
        "latitude": 19.229,
        "longitude": 72.857
    },
    {
        "name": "Dadar Asiad TT Circle Bus Stand",
        "code": "MUM-DDR",
        "city": "Mumbai",
        "state": "Maharashtra",
        "hub_type": "BUS_TERMINAL",
        "latitude": 19.0178,
        "longitude": 72.8478
    },
    {
        "name": "Pune Swargate Bus Terminal",
        "code": "PUN-SGT",
        "city": "Pune",
        "state": "Maharashtra",
        "hub_type": "BUS_TERMINAL",
        "latitude": 18.5018,
        "longitude": 73.8586
    },
    {
        "name": "Pune Wakad Bus Stand",
        "code": "PUN-WKD",
        "city": "Pune",
        "state": "Maharashtra",
        "hub_type": "BUS_TERMINAL",
        "latitude": 18.5987,
        "longitude": 73.7628
    },
    {
        "name": "Hadapsar Gadital Bus Terminal",
        "code": "PUN-HDP",
        "city": "Pune",
        "state": "Maharashtra",
        "hub_type": "BUS_TERMINAL",
        "latitude": 18.5008,
        "longitude": 73.9355
    },
    {
        "name": "Goa Dabolim International Airport",
        "code": "GOI",
        "city": "Goa",
        "state": "Goa",
        "hub_type": "AIRPORT",
        "latitude": 15.3808,
        "longitude": 73.8314
    },
    {
        "name": "Manohar International Airport Mopa",
        "code": "GOX",
        "city": "Goa",
        "state": "Goa",
        "hub_type": "AIRPORT",
        "latitude": 15.7667,
        "longitude": 73.8667
    },
    {
        "name": "Madgaon Junction",
        "code": "MAO",
        "city": "Goa",
        "state": "Goa",
        "hub_type": "RAILWAY_STATION",
        "latitude": 15.2736,
        "longitude": 73.958
    },
    {
        "name": "Vasco da Gama Railway Station",
        "code": "VSG",
        "city": "Goa",
        "state": "Goa",
        "hub_type": "RAILWAY_STATION",
        "latitude": 15.3982,
        "longitude": 73.8113
    },
    {
        "name": "Thivim Railway Station (North Goa)",
        "code": "THVM",
        "city": "Goa",
        "state": "Goa",
        "hub_type": "RAILWAY_STATION",
        "latitude": 15.6171,
        "longitude": 73.8761
    },
    {
        "name": "Panaji KTC Inter-State Bus Stand",
        "code": "GOA-PNJ",
        "city": "Goa",
        "state": "Goa",
        "hub_type": "BUS_TERMINAL",
        "latitude": 15.4989,
        "longitude": 73.8322
    },
    {
        "name": "Madgaon KTC Bus Stand",
        "code": "GOA-MDG",
        "city": "Goa",
        "state": "Goa",
        "hub_type": "BUS_TERMINAL",
        "latitude": 15.2833,
        "longitude": 73.9667
    },
    {
        "name": "Mapusa Bus Stand (North Goa)",
        "code": "GOA-MPS",
        "city": "Goa",
        "state": "Goa",
        "hub_type": "BUS_TERMINAL",
        "latitude": 15.5925,
        "longitude": 73.8136
    },
    {
        "name": "Indira Gandhi International Airport",
        "code": "DEL",
        "city": "Delhi",
        "state": "Delhi",
        "hub_type": "AIRPORT",
        "latitude": 28.5562,
        "longitude": 77.1
    },
    {
        "name": "Hindon Airport",
        "code": "HDO",
        "city": "Ghaziabad",
        "state": "Uttar Pradesh",
        "hub_type": "AIRPORT",
        "latitude": 28.7061,
        "longitude": 77.3589
    },
    {
        "name": "Shaheed Bhagat Singh International Airport",
        "code": "IXC",
        "city": "Chandigarh",
        "state": "Chandigarh",
        "hub_type": "AIRPORT",
        "latitude": 30.6735,
        "longitude": 76.7885
    },
    {
        "name": "Sri Guru Ram Dass Jee International Airport",
        "code": "ATQ",
        "city": "Amritsar",
        "state": "Punjab",
        "hub_type": "AIRPORT",
        "latitude": 31.7096,
        "longitude": 74.7973
    },
    {
        "name": "Sheikh ul-Alam International Airport",
        "code": "SXR",
        "city": "Srinagar",
        "state": "Jammu and Kashmir",
        "hub_type": "AIRPORT",
        "latitude": 33.9871,
        "longitude": 74.7742
    },
    {
        "name": "Jammu Civil Enclave",
        "code": "IXJ",
        "city": "Jammu",
        "state": "Jammu and Kashmir",
        "hub_type": "AIRPORT",
        "latitude": 32.6891,
        "longitude": 74.8374
    },
    {
        "name": "New Delhi Railway Station",
        "code": "NDLS",
        "city": "Delhi",
        "state": "Delhi",
        "hub_type": "RAILWAY_STATION",
        "latitude": 28.6429,
        "longitude": 77.2195
    },
    {
        "name": "Hazrat Nizamuddin Railway Station",
        "code": "NZM",
        "city": "Delhi",
        "state": "Delhi",
        "hub_type": "RAILWAY_STATION",
        "latitude": 28.5892,
        "longitude": 77.253
    },
    {
        "name": "Anand Vihar Railway Terminal",
        "code": "ANVT",
        "city": "Delhi",
        "state": "Delhi",
        "hub_type": "RAILWAY_STATION",
        "latitude": 28.6508,
        "longitude": 77.3153
    },
    {
        "name": "Old Delhi Railway Station",
        "code": "DLI",
        "city": "Delhi",
        "state": "Delhi",
        "hub_type": "RAILWAY_STATION",
        "latitude": 28.6617,
        "longitude": 77.2289
    },
    {
        "name": "Chandigarh Junction",
        "code": "CDG",
        "city": "Chandigarh",
        "state": "Chandigarh",
        "hub_type": "RAILWAY_STATION",
        "latitude": 30.7025,
        "longitude": 76.8214
    },
    {
        "name": "Amritsar Junction",
        "code": "ASR",
        "city": "Amritsar",
        "state": "Punjab",
        "hub_type": "RAILWAY_STATION",
        "latitude": 31.634,
        "longitude": 74.8723
    },
    {
        "name": "Ludhiana Junction",
        "code": "LDH",
        "city": "Ludhiana",
        "state": "Punjab",
        "hub_type": "RAILWAY_STATION",
        "latitude": 30.901,
        "longitude": 75.8573
    },
    {
        "name": "Kashmere Gate ISBT Delhi",
        "code": "DEL-ISBT",
        "city": "Delhi",
        "state": "Delhi",
        "hub_type": "BUS_TERMINAL",
        "latitude": 28.6675,
        "longitude": 77.2289
    },
    {
        "name": "Anand Vihar ISBT Delhi",
        "code": "DEL-ANVT",
        "city": "Delhi",
        "state": "Delhi",
        "hub_type": "BUS_TERMINAL",
        "latitude": 28.6469,
        "longitude": 77.316
    },
    {
        "name": "Sarai Kale Khan ISBT Delhi",
        "code": "DEL-SKK",
        "city": "Delhi",
        "state": "Delhi",
        "hub_type": "BUS_TERMINAL",
        "latitude": 28.5912,
        "longitude": 77.258
    },
    {
        "name": "Chandigarh ISBT Sector 43",
        "code": "CDG-ISBT",
        "city": "Chandigarh",
        "state": "Chandigarh",
        "hub_type": "BUS_TERMINAL",
        "latitude": 30.718,
        "longitude": 76.745
    },
    {
        "name": "Chaudhary Charan Singh International Airport",
        "code": "LKO",
        "city": "Lucknow",
        "state": "Uttar Pradesh",
        "hub_type": "AIRPORT",
        "latitude": 26.7606,
        "longitude": 80.8893
    },
    {
        "name": "Lal Bahadur Shastri International Airport",
        "code": "VNS",
        "city": "Varanasi",
        "state": "Uttar Pradesh",
        "hub_type": "AIRPORT",
        "latitude": 25.4524,
        "longitude": 82.8593
    },
    {
        "name": "Mahayogi Gorakhnath Airport",
        "code": "GOP",
        "city": "Gorakhpur",
        "state": "Uttar Pradesh",
        "hub_type": "AIRPORT",
        "latitude": 26.7397,
        "longitude": 83.4497
    },
    {
        "name": "Prayagraj Airport",
        "code": "IXD",
        "city": "Prayagraj",
        "state": "Uttar Pradesh",
        "hub_type": "AIRPORT",
        "latitude": 25.44,
        "longitude": 81.734
    },
    {
        "name": "Maharishi Valmiki International Airport",
        "code": "AYJ",
        "city": "Ayodhya",
        "state": "Uttar Pradesh",
        "hub_type": "AIRPORT",
        "latitude": 26.7508,
        "longitude": 82.1558
    },
    {
        "name": "Kanpur Airport",
        "code": "KNU",
        "city": "Kanpur",
        "state": "Uttar Pradesh",
        "hub_type": "AIRPORT",
        "latitude": 26.4414,
        "longitude": 80.4136
    },
    {
        "name": "Agra Kheria Airport",
        "code": "AGR",
        "city": "Agra",
        "state": "Uttar Pradesh",
        "hub_type": "AIRPORT",
        "latitude": 27.1558,
        "longitude": 77.9609
    },
    {
        "name": "Bareilly Airport",
        "code": "BEK",
        "city": "Bareilly",
        "state": "Uttar Pradesh",
        "hub_type": "AIRPORT",
        "latitude": 28.4239,
        "longitude": 79.4503
    },
    {
        "name": "Pt. Deen Dayal Upadhyaya Junction",
        "code": "DDU",
        "city": "Mughalsarai",
        "state": "Uttar Pradesh",
        "hub_type": "RAILWAY_STATION",
        "latitude": 25.2798,
        "longitude": 83.1235
    },
    {
        "name": "Varanasi Junction",
        "code": "BSB",
        "city": "Varanasi",
        "state": "Uttar Pradesh",
        "hub_type": "RAILWAY_STATION",
        "latitude": 25.3283,
        "longitude": 82.9866
    },
    {
        "name": "Lucknow Charbagh",
        "code": "LKO",
        "city": "Lucknow",
        "state": "Uttar Pradesh",
        "hub_type": "RAILWAY_STATION",
        "latitude": 26.8317,
        "longitude": 80.9234
    },
    {
        "name": "Kanpur Central",
        "code": "CNB",
        "city": "Kanpur",
        "state": "Uttar Pradesh",
        "hub_type": "RAILWAY_STATION",
        "latitude": 26.4542,
        "longitude": 80.3503
    },
    {
        "name": "Gorakhpur Junction",
        "code": "GKP",
        "city": "Gorakhpur",
        "state": "Uttar Pradesh",
        "hub_type": "RAILWAY_STATION",
        "latitude": 26.7606,
        "longitude": 83.3811
    },
    {
        "name": "Prayagraj Junction",
        "code": "PRYJ",
        "city": "Prayagraj",
        "state": "Uttar Pradesh",
        "hub_type": "RAILWAY_STATION",
        "latitude": 25.4484,
        "longitude": 81.8333
    },
    {
        "name": "Agra Cantt",
        "code": "AGC",
        "city": "Agra",
        "state": "Uttar Pradesh",
        "hub_type": "RAILWAY_STATION",
        "latitude": 27.1584,
        "longitude": 78.0081
    },
    {
        "name": "VGL Jhansi Junction",
        "code": "JHS",
        "city": "Jhansi",
        "state": "Uttar Pradesh",
        "hub_type": "RAILWAY_STATION",
        "latitude": 25.4484,
        "longitude": 78.5685
    },
    {
        "name": "Bareilly Junction",
        "code": "BE",
        "city": "Bareilly",
        "state": "Uttar Pradesh",
        "hub_type": "RAILWAY_STATION",
        "latitude": 28.3411,
        "longitude": 79.418
    },
    {
        "name": "Moradabad Junction",
        "code": "MB",
        "city": "Moradabad",
        "state": "Uttar Pradesh",
        "hub_type": "RAILWAY_STATION",
        "latitude": 28.8386,
        "longitude": 78.7733
    },
    {
        "name": "Alambagh ISBT Lucknow",
        "code": "LKO-ISBT",
        "city": "Lucknow",
        "state": "Uttar Pradesh",
        "hub_type": "BUS_TERMINAL",
        "latitude": 26.818,
        "longitude": 80.902
    },
    {
        "name": "Varanasi Cantt Bus Station",
        "code": "VNS-ISBT",
        "city": "Varanasi",
        "state": "Uttar Pradesh",
        "hub_type": "BUS_TERMINAL",
        "latitude": 25.326,
        "longitude": 82.985
    },
    {
        "name": "Kanpur Jhakarkati Bus Terminal",
        "code": "CNB-ISBT",
        "city": "Kanpur",
        "state": "Uttar Pradesh",
        "hub_type": "BUS_TERMINAL",
        "latitude": 26.448,
        "longitude": 80.342
    },
    {
        "name": "Gorakhpur Main Bus Stand",
        "code": "GKP-BS",
        "city": "Gorakhpur",
        "state": "Uttar Pradesh",
        "hub_type": "BUS_TERMINAL",
        "latitude": 26.758,
        "longitude": 83.376
    },
    {
        "name": "Civil Lines Bus Station Prayagraj",
        "code": "PRYJ-BS",
        "city": "Prayagraj",
        "state": "Uttar Pradesh",
        "hub_type": "BUS_TERMINAL",
        "latitude": 25.452,
        "longitude": 81.836
    },
    {
        "name": "Dehradun Jolly Grant Airport",
        "code": "DED",
        "city": "Dehradun",
        "state": "Uttarakhand",
        "hub_type": "AIRPORT",
        "latitude": 30.1897,
        "longitude": 78.1803
    },
    {
        "name": "Pantnagar Airport",
        "code": "PGH",
        "city": "Pantnagar",
        "state": "Uttarakhand",
        "hub_type": "AIRPORT",
        "latitude": 29.0333,
        "longitude": 79.4739
    },
    {
        "name": "Pithoragarh Naini Saini Airport",
        "code": "NNS",
        "city": "Pithoragarh",
        "state": "Uttarakhand",
        "hub_type": "AIRPORT",
        "latitude": 29.5964,
        "longitude": 80.2444
    },
    {
        "name": "Haridwar Junction",
        "code": "HW",
        "city": "Haridwar",
        "state": "Uttarakhand",
        "hub_type": "RAILWAY_STATION",
        "latitude": 29.9463,
        "longitude": 78.1565
    },
    {
        "name": "Dehradun Railway Station",
        "code": "DDN",
        "city": "Dehradun",
        "state": "Uttarakhand",
        "hub_type": "RAILWAY_STATION",
        "latitude": 30.318,
        "longitude": 78.0322
    },
    {
        "name": "Rishikesh Yog Nagari",
        "code": "YNRK",
        "city": "Rishikesh",
        "state": "Uttarakhand",
        "hub_type": "RAILWAY_STATION",
        "latitude": 30.0869,
        "longitude": 78.2882
    },
    {
        "name": "Kathgodam Railway Station",
        "code": "KGM",
        "city": "Kathgodam",
        "state": "Uttarakhand",
        "hub_type": "RAILWAY_STATION",
        "latitude": 29.273,
        "longitude": 79.544
    },
    {
        "name": "Tanakpur Railway Station",
        "code": "TPU",
        "city": "Tanakpur",
        "state": "Uttarakhand",
        "hub_type": "RAILWAY_STATION",
        "latitude": 29.0734,
        "longitude": 80.1118
    },
    {
        "name": "Dehradun ISBT",
        "code": "DDN-ISBT",
        "city": "Dehradun",
        "state": "Uttarakhand",
        "hub_type": "BUS_TERMINAL",
        "latitude": 30.2858,
        "longitude": 77.9984
    },
    {
        "name": "Haridwar ISBT",
        "code": "HW-ISBT",
        "city": "Haridwar",
        "state": "Uttarakhand",
        "hub_type": "BUS_TERMINAL",
        "latitude": 29.936,
        "longitude": 78.1432
    },
    {
        "name": "Rishikesh ISBT Bus Stand",
        "code": "RKSH-ISBT",
        "city": "Rishikesh",
        "state": "Uttarakhand",
        "hub_type": "BUS_TERMINAL",
        "latitude": 30.0869,
        "longitude": 78.2882
    },
    {
        "name": "Haldwani ISBT Bus Terminal",
        "code": "HLD-ISBT",
        "city": "Haldwani",
        "state": "Uttarakhand",
        "hub_type": "BUS_TERMINAL",
        "latitude": 29.2183,
        "longitude": 79.513
    },
    {
        "name": "Tanakpur Main Bus Stand",
        "code": "TPU-ISBT",
        "city": "Tanakpur",
        "state": "Uttarakhand",
        "hub_type": "BUS_TERMINAL",
        "latitude": 29.0734,
        "longitude": 80.1118
    },
    {
        "name": "Pithoragarh Main ISBT",
        "code": "PTH-ISBT",
        "city": "Pithoragarh",
        "state": "Uttarakhand",
        "hub_type": "BUS_TERMINAL",
        "latitude": 29.5828,
        "longitude": 80.2182
    },
    {
        "name": "Netaji Subhash Chandra Bose International Airport",
        "code": "CCU",
        "city": "Kolkata",
        "state": "West Bengal",
        "hub_type": "AIRPORT",
        "latitude": 22.6547,
        "longitude": 88.4467
    },
    {
        "name": "Bagdogra International Airport",
        "code": "IXB",
        "city": "Siliguri",
        "state": "West Bengal",
        "hub_type": "AIRPORT",
        "latitude": 26.6812,
        "longitude": 88.3286
    },
    {
        "name": "Lokpriya Gopinath Bordoloi International Airport",
        "code": "GAU",
        "city": "Guwahati",
        "state": "Assam",
        "hub_type": "AIRPORT",
        "latitude": 26.1061,
        "longitude": 91.5859
    },
    {
        "name": "Howrah Junction",
        "code": "HWH",
        "city": "Kolkata",
        "state": "West Bengal",
        "hub_type": "RAILWAY_STATION",
        "latitude": 22.5839,
        "longitude": 88.3428
    },
    {
        "name": "Sealdah Railway Station",
        "code": "SDAH",
        "city": "Kolkata",
        "state": "West Bengal",
        "hub_type": "RAILWAY_STATION",
        "latitude": 22.5697,
        "longitude": 88.3712
    },
    {
        "name": "Kolkata Railway Station",
        "code": "KOAA",
        "city": "Kolkata",
        "state": "West Bengal",
        "hub_type": "RAILWAY_STATION",
        "latitude": 22.6047,
        "longitude": 88.3775
    },
    {
        "name": "New Jalpaiguri Junction",
        "code": "NJP",
        "city": "Siliguri",
        "state": "West Bengal",
        "hub_type": "RAILWAY_STATION",
        "latitude": 26.6853,
        "longitude": 88.4431
    },
    {
        "name": "Asansol Junction",
        "code": "ASN",
        "city": "Asansol",
        "state": "West Bengal",
        "hub_type": "RAILWAY_STATION",
        "latitude": 23.6872,
        "longitude": 86.9746
    },
    {
        "name": "Guwahati Railway Station",
        "code": "GHY",
        "city": "Guwahati",
        "state": "Assam",
        "hub_type": "RAILWAY_STATION",
        "latitude": 26.1822,
        "longitude": 91.7517
    },
    {
        "name": "Esplanade Central Bus Terminus",
        "code": "CCU-ESP",
        "city": "Kolkata",
        "state": "West Bengal",
        "hub_type": "BUS_TERMINAL",
        "latitude": 22.5645,
        "longitude": 88.3512
    },
    {
        "name": "Siliguri Junction Bus Stand",
        "code": "IXB-BS",
        "city": "Siliguri",
        "state": "West Bengal",
        "hub_type": "BUS_TERMINAL",
        "latitude": 26.721,
        "longitude": 88.423
    },
    {
        "name": "ISBT Betkuchi Guwahati",
        "code": "GAU-ISBT",
        "city": "Guwahati",
        "state": "Assam",
        "hub_type": "BUS_TERMINAL",
        "latitude": 26.115,
        "longitude": 91.734
    },
    {
        "name": "Sardar Vallabhbhai Patel International Airport",
        "code": "AMD",
        "city": "Ahmedabad",
        "state": "Gujarat",
        "hub_type": "AIRPORT",
        "latitude": 23.0772,
        "longitude": 72.6347
    },
    {
        "name": "Surat International Airport",
        "code": "STV",
        "city": "Surat",
        "state": "Gujarat",
        "hub_type": "AIRPORT",
        "latitude": 21.1141,
        "longitude": 72.7417
    },
    {
        "name": "Vadodara Airport",
        "code": "BDQ",
        "city": "Vadodara",
        "state": "Gujarat",
        "hub_type": "AIRPORT",
        "latitude": 22.3361,
        "longitude": 73.2264
    },
    {
        "name": "Jaipur International Airport",
        "code": "JAI",
        "city": "Jaipur",
        "state": "Rajasthan",
        "hub_type": "AIRPORT",
        "latitude": 26.8242,
        "longitude": 75.8122
    },
    {
        "name": "Jodhpur Airport",
        "code": "JDH",
        "city": "Jodhpur",
        "state": "Rajasthan",
        "hub_type": "AIRPORT",
        "latitude": 26.2511,
        "longitude": 73.0489
    },
    {
        "name": "Maharana Pratap Airport",
        "code": "UDR",
        "city": "Udaipur",
        "state": "Rajasthan",
        "hub_type": "AIRPORT",
        "latitude": 24.6178,
        "longitude": 73.8961
    },
    {
        "name": "Gandhinagar Capital Railway Station",
        "code": "GNC",
        "city": "Gandhinagar",
        "state": "Gujarat",
        "hub_type": "RAILWAY_STATION",
        "latitude": 23.2345,
        "longitude": 72.6394
    },
    {
        "name": "Ahmedabad Junction",
        "code": "ADI",
        "city": "Ahmedabad",
        "state": "Gujarat",
        "hub_type": "RAILWAY_STATION",
        "latitude": 23.0234,
        "longitude": 72.6011
    },
    {
        "name": "Surat Railway Station",
        "code": "ST",
        "city": "Surat",
        "state": "Gujarat",
        "hub_type": "RAILWAY_STATION",
        "latitude": 21.2045,
        "longitude": 72.8407
    },
    {
        "name": "Vadodara Junction",
        "code": "BRC",
        "city": "Vadodara",
        "state": "Gujarat",
        "hub_type": "RAILWAY_STATION",
        "latitude": 22.3108,
        "longitude": 73.1812
    },
    {
        "name": "Jaipur Junction",
        "code": "JP",
        "city": "Jaipur",
        "state": "Rajasthan",
        "hub_type": "RAILWAY_STATION",
        "latitude": 26.92,
        "longitude": 75.7878
    },
    {
        "name": "Jodhpur Junction",
        "code": "JU",
        "city": "Jodhpur",
        "state": "Rajasthan",
        "hub_type": "RAILWAY_STATION",
        "latitude": 26.2845,
        "longitude": 73.018
    },
    {
        "name": "Kota Junction",
        "code": "KOTA",
        "city": "Kota",
        "state": "Rajasthan",
        "hub_type": "RAILWAY_STATION",
        "latitude": 25.2138,
        "longitude": 75.8648
    },
    {
        "name": "Gandhinagar Central Bus Stand (GSRTC)",
        "code": "GND-GSRTC",
        "city": "Gandhinagar",
        "state": "Gujarat",
        "hub_type": "BUS_TERMINAL",
        "latitude": 23.2185,
        "longitude": 72.645
    },
    {
        "name": "Geeta Mandir Central Bus Terminus",
        "code": "AMD-GM",
        "city": "Ahmedabad",
        "state": "Gujarat",
        "hub_type": "BUS_TERMINAL",
        "latitude": 23.014,
        "longitude": 72.592
    },
    {
        "name": "Surat Central Bus Station",
        "code": "ST-CS",
        "city": "Surat",
        "state": "Gujarat",
        "hub_type": "BUS_TERMINAL",
        "latitude": 21.202,
        "longitude": 72.839
    },
    {
        "name": "Sindhi Camp Central Bus Stand",
        "code": "JAI-SC",
        "city": "Jaipur",
        "state": "Rajasthan",
        "hub_type": "BUS_TERMINAL",
        "latitude": 26.923,
        "longitude": 75.798
    },
    {
        "name": "Kempegowda International Airport",
        "code": "BLR",
        "city": "Bengaluru",
        "state": "Karnataka",
        "hub_type": "AIRPORT",
        "latitude": 13.1986,
        "longitude": 77.7066
    },
    {
        "name": "Rajiv Gandhi International Airport",
        "code": "HYD",
        "city": "Hyderabad",
        "state": "Telangana",
        "hub_type": "AIRPORT",
        "latitude": 17.2403,
        "longitude": 78.4294
    },
    {
        "name": "Chennai International Airport",
        "code": "MAA",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "hub_type": "AIRPORT",
        "latitude": 12.9941,
        "longitude": 80.1709
    },
    {
        "name": "Cochin International Airport",
        "code": "COK",
        "city": "Kochi",
        "state": "Kerala",
        "hub_type": "AIRPORT",
        "latitude": 10.152,
        "longitude": 76.392
    },
    {
        "name": "Visakhapatnam International Airport",
        "code": "VTZ",
        "city": "Visakhapatnam",
        "state": "Andhra Pradesh",
        "hub_type": "AIRPORT",
        "latitude": 17.7211,
        "longitude": 83.2244
    },
    {
        "name": "KSR Bengaluru City Railway Station",
        "code": "SBC",
        "city": "Bengaluru",
        "state": "Karnataka",
        "hub_type": "RAILWAY_STATION",
        "latitude": 12.9781,
        "longitude": 77.5694
    },
    {
        "name": "Yesvantpur Junction",
        "code": "YPR",
        "city": "Bengaluru",
        "state": "Karnataka",
        "hub_type": "RAILWAY_STATION",
        "latitude": 13.0238,
        "longitude": 77.5503
    },
    {
        "name": "Secunderabad Junction",
        "code": "SC",
        "city": "Hyderabad",
        "state": "Telangana",
        "hub_type": "RAILWAY_STATION",
        "latitude": 17.4344,
        "longitude": 78.5018
    },
    {
        "name": "MGR Chennai Central",
        "code": "MAS",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "hub_type": "RAILWAY_STATION",
        "latitude": 13.0827,
        "longitude": 80.2755
    },
    {
        "name": "Ernakulam Junction",
        "code": "ERS",
        "city": "Kochi",
        "state": "Kerala",
        "hub_type": "RAILWAY_STATION",
        "latitude": 9.9678,
        "longitude": 76.2917
    },
    {
        "name": "Kempegowda Majestic Bus Terminal",
        "code": "BLR-KSR",
        "city": "Bengaluru",
        "state": "Karnataka",
        "hub_type": "BUS_TERMINAL",
        "latitude": 12.977,
        "longitude": 77.571
    },
    {
        "name": "MGBS Mahatma Gandhi Bus Station",
        "code": "HYD-MGBS",
        "city": "Hyderabad",
        "state": "Telangana",
        "hub_type": "BUS_TERMINAL",
        "latitude": 17.378,
        "longitude": 78.483
    },
    {
        "name": "CMBT Koyambedu Bus Terminus",
        "code": "MAA-CMBT",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "hub_type": "BUS_TERMINAL",
        "latitude": 13.068,
        "longitude": 80.205
    },
    {
        "name": "Naharlagun Railway Station",
        "code": "NHLN",
        "city": "Naharlagun",
        "state": "Arunachal Pradesh",
        "hub_type": "RAILWAY_STATION",
        "latitude": 27.1064,
        "longitude": 93.6946
    },
    {
        "name": "Murkeongselek Railway Station",
        "code": "MZS",
        "city": "Pasighat",
        "state": "Arunachal Pradesh",
        "hub_type": "RAILWAY_STATION",
        "latitude": 27.834,
        "longitude": 95.23
    },
    {
        "name": "Donyi Polo Airport Itanagar",
        "code": "HGI",
        "city": "Itanagar",
        "state": "Arunachal Pradesh",
        "hub_type": "AIRPORT",
        "latitude": 26.96,
        "longitude": 93.64
    },
    {
        "name": "Pasighat Airport",
        "code": "RUH",
        "city": "Pasighat",
        "state": "Arunachal Pradesh",
        "hub_type": "AIRPORT",
        "latitude": 28.0667,
        "longitude": 95.3333
    },
    {
        "name": "Itanagar Central ISBT",
        "code": "ITA-ISBT",
        "city": "Itanagar",
        "state": "Arunachal Pradesh",
        "hub_type": "BUS_TERMINAL",
        "latitude": 27.0844,
        "longitude": 93.6053
    },
    {
        "name": "Swami Vivekananda Airport Raipur",
        "code": "RPR",
        "city": "Raipur",
        "state": "Chhattisgarh",
        "hub_type": "AIRPORT",
        "latitude": 21.1804,
        "longitude": 81.7388
    },
    {
        "name": "Bilaspur Airport Chakarbhatha",
        "code": "PAB",
        "city": "Bilaspur",
        "state": "Chhattisgarh",
        "hub_type": "AIRPORT",
        "latitude": 21.988,
        "longitude": 82.111
    },
    {
        "name": "Raipur Junction",
        "code": "R",
        "city": "Raipur",
        "state": "Chhattisgarh",
        "hub_type": "RAILWAY_STATION",
        "latitude": 21.2584,
        "longitude": 81.63
    },
    {
        "name": "Bilaspur Junction",
        "code": "BSP",
        "city": "Bilaspur",
        "state": "Chhattisgarh",
        "hub_type": "RAILWAY_STATION",
        "latitude": 22.08,
        "longitude": 82.16
    },
    {
        "name": "Durg Junction",
        "code": "DURG",
        "city": "Durg",
        "state": "Chhattisgarh",
        "hub_type": "RAILWAY_STATION",
        "latitude": 21.1904,
        "longitude": 81.2849
    },
    {
        "name": "Sri Balaji Inter-State Bus Terminal Raipur",
        "code": "RPR-ISBT",
        "city": "Raipur",
        "state": "Chhattisgarh",
        "hub_type": "BUS_TERMINAL",
        "latitude": 21.24,
        "longitude": 81.6
    },
    {
        "name": "Hisar Airport",
        "code": "HSS",
        "city": "Hisar",
        "state": "Haryana",
        "hub_type": "AIRPORT",
        "latitude": 29.1788,
        "longitude": 75.7538
    },
    {
        "name": "Ambala Cantt Junction",
        "code": "UMB",
        "city": "Ambala",
        "state": "Haryana",
        "hub_type": "RAILWAY_STATION",
        "latitude": 30.3448,
        "longitude": 76.8398
    },
    {
        "name": "Panipat Junction",
        "code": "PNP",
        "city": "Panipat",
        "state": "Haryana",
        "hub_type": "RAILWAY_STATION",
        "latitude": 29.3909,
        "longitude": 76.9635
    },
    {
        "name": "Rohtak Junction",
        "code": "ROK",
        "city": "Rohtak",
        "state": "Haryana",
        "hub_type": "RAILWAY_STATION",
        "latitude": 28.8955,
        "longitude": 76.6066
    },
    {
        "name": "Faridabad Railway Station",
        "code": "FBD",
        "city": "Faridabad",
        "state": "Haryana",
        "hub_type": "RAILWAY_STATION",
        "latitude": 28.4069,
        "longitude": 77.315
    },
    {
        "name": "Gurugram ISBT",
        "code": "GGN-ISBT",
        "city": "Gurugram",
        "state": "Haryana",
        "hub_type": "BUS_TERMINAL",
        "latitude": 28.4595,
        "longitude": 77.0266
    },
    {
        "name": "Kullu-Manali Airport Bhuntar",
        "code": "KUU",
        "city": "Kullu",
        "state": "Himachal Pradesh",
        "hub_type": "AIRPORT",
        "latitude": 31.8767,
        "longitude": 77.1542
    },
    {
        "name": "Kangra Airport Gaggal (Dharamshala)",
        "code": "DHM",
        "city": "Dharamshala",
        "state": "Himachal Pradesh",
        "hub_type": "AIRPORT",
        "latitude": 32.1651,
        "longitude": 76.2634
    },
    {
        "name": "Shimla Airport Jubbarhatti",
        "code": "SLV",
        "city": "Shimla",
        "state": "Himachal Pradesh",
        "hub_type": "AIRPORT",
        "latitude": 31.0818,
        "longitude": 77.0682
    },
    {
        "name": "Kalka Railway Station (Broad-Gauge Gateway)",
        "code": "KLK",
        "city": "Kalka",
        "state": "Himachal Pradesh",
        "hub_type": "RAILWAY_STATION",
        "latitude": 30.8354,
        "longitude": 76.9352
    },
    {
        "name": "Una Himachal Railway Station",
        "code": "UHL",
        "city": "Una",
        "state": "Himachal Pradesh",
        "hub_type": "RAILWAY_STATION",
        "latitude": 31.4684,
        "longitude": 76.2713
    },
    {
        "name": "Pathankot Junction (Kangra & Chamba Gateway)",
        "code": "PTK",
        "city": "Pathankot",
        "state": "Punjab",
        "hub_type": "RAILWAY_STATION",
        "latitude": 32.268,
        "longitude": 75.652
    },
    {
        "name": "Shimla ISBT Tutikandi",
        "code": "SML-ISBT",
        "city": "Shimla",
        "state": "Himachal Pradesh",
        "hub_type": "BUS_TERMINAL",
        "latitude": 31.096,
        "longitude": 77.156
    },
    {
        "name": "Dharamshala Inter-State Bus Stand",
        "code": "DHM-ISBT",
        "city": "Dharamshala",
        "state": "Himachal Pradesh",
        "hub_type": "BUS_TERMINAL",
        "latitude": 32.219,
        "longitude": 76.3234
    },
    {
        "name": "Manali HRTC Bus Terminal",
        "code": "MNL-ISBT",
        "city": "Manali",
        "state": "Himachal Pradesh",
        "hub_type": "BUS_TERMINAL",
        "latitude": 32.2396,
        "longitude": 77.1887
    },
    {
        "name": "Raja Bhoj Airport Bhopal",
        "code": "BHO",
        "city": "Bhopal",
        "state": "Madhya Pradesh",
        "hub_type": "AIRPORT",
        "latitude": 23.2875,
        "longitude": 77.3378
    },
    {
        "name": "Devi Ahilyabai Holkar International Airport Indore",
        "code": "IDR",
        "city": "Indore",
        "state": "Madhya Pradesh",
        "hub_type": "AIRPORT",
        "latitude": 22.7217,
        "longitude": 75.8011
    },
    {
        "name": "Gwalior Airport Rajmata Vijaya Raje Scindia",
        "code": "GWL-AIR",
        "city": "Gwalior",
        "state": "Madhya Pradesh",
        "hub_type": "AIRPORT",
        "latitude": 26.2936,
        "longitude": 78.2278
    },
    {
        "name": "Jabalpur Airport Dumna",
        "code": "JLR",
        "city": "Jabalpur",
        "state": "Madhya Pradesh",
        "hub_type": "AIRPORT",
        "latitude": 23.1778,
        "longitude": 80.0522
    },
    {
        "name": "Bhopal Junction",
        "code": "BPL",
        "city": "Bhopal",
        "state": "Madhya Pradesh",
        "hub_type": "RAILWAY_STATION",
        "latitude": 23.2687,
        "longitude": 77.4143
    },
    {
        "name": "Rani Kamalapati Railway Station",
        "code": "RKMP",
        "city": "Bhopal",
        "state": "Madhya Pradesh",
        "hub_type": "RAILWAY_STATION",
        "latitude": 23.2052,
        "longitude": 77.4378
    },
    {
        "name": "Indore Junction",
        "code": "INDB",
        "city": "Indore",
        "state": "Madhya Pradesh",
        "hub_type": "RAILWAY_STATION",
        "latitude": 22.7177,
        "longitude": 75.8682
    },
    {
        "name": "Gwalior Junction",
        "code": "GWL",
        "city": "Gwalior",
        "state": "Madhya Pradesh",
        "hub_type": "RAILWAY_STATION",
        "latitude": 26.2166,
        "longitude": 78.1888
    },
    {
        "name": "Jabalpur Junction",
        "code": "JBP",
        "city": "Jabalpur",
        "state": "Madhya Pradesh",
        "hub_type": "RAILWAY_STATION",
        "latitude": 23.161,
        "longitude": 79.9547
    },
    {
        "name": "Ujjain Junction",
        "code": "UJN",
        "city": "Ujjain",
        "state": "Madhya Pradesh",
        "hub_type": "RAILWAY_STATION",
        "latitude": 23.1815,
        "longitude": 75.7772
    },
    {
        "name": "Habibganj ISBT Bhopal",
        "code": "BPL-ISBT",
        "city": "Bhopal",
        "state": "Madhya Pradesh",
        "hub_type": "BUS_TERMINAL",
        "latitude": 23.21,
        "longitude": 77.44
    },
    {
        "name": "Sarwate Bus Stand Indore",
        "code": "IDR-ISBT",
        "city": "Indore",
        "state": "Madhya Pradesh",
        "hub_type": "BUS_TERMINAL",
        "latitude": 22.715,
        "longitude": 75.865
    },
    {
        "name": "Bir Tikendrajit International Airport Imphal",
        "code": "IMF",
        "city": "Imphal",
        "state": "Manipur",
        "hub_type": "AIRPORT",
        "latitude": 24.76,
        "longitude": 93.8967
    },
    {
        "name": "Jiribam Railway Station",
        "code": "JRM",
        "city": "Jiribam",
        "state": "Manipur",
        "hub_type": "RAILWAY_STATION",
        "latitude": 24.8028,
        "longitude": 93.1239
    },
    {
        "name": "Imphal ISBT Khuman Lampak",
        "code": "IMF-ISBT",
        "city": "Imphal",
        "state": "Manipur",
        "hub_type": "BUS_TERMINAL",
        "latitude": 24.818,
        "longitude": 93.945
    },
    {
        "name": "Shillong Airport Umroi",
        "code": "SHL",
        "city": "Shillong",
        "state": "Meghalaya",
        "hub_type": "AIRPORT",
        "latitude": 25.7036,
        "longitude": 91.9786
    },
    {
        "name": "Mendipathar Railway Station",
        "code": "MNDP",
        "city": "Mendipathar",
        "state": "Meghalaya",
        "hub_type": "RAILWAY_STATION",
        "latitude": 25.9231,
        "longitude": 90.6272
    },
    {
        "name": "Shillong ISBT Mawiong",
        "code": "SHL-ISBT",
        "city": "Shillong",
        "state": "Meghalaya",
        "hub_type": "BUS_TERMINAL",
        "latitude": 25.62,
        "longitude": 91.89
    },
    {
        "name": "Lengpui Airport Aizawl",
        "code": "AJL",
        "city": "Aizawl",
        "state": "Mizoram",
        "hub_type": "AIRPORT",
        "latitude": 23.8407,
        "longitude": 92.6192
    },
    {
        "name": "Bairabi Railway Station",
        "code": "BHRB",
        "city": "Bairabi",
        "state": "Mizoram",
        "hub_type": "RAILWAY_STATION",
        "latitude": 24.1867,
        "longitude": 92.5358
    },
    {
        "name": "Silchar Railway Station (Mizoram Rail Gateway)",
        "code": "SCL",
        "city": "Silchar",
        "state": "Assam",
        "hub_type": "RAILWAY_STATION",
        "latitude": 24.8236,
        "longitude": 92.7978
    },
    {
        "name": "Aizawl ISBT Chawlhhmun",
        "code": "AJL-ISBT",
        "city": "Aizawl",
        "state": "Mizoram",
        "hub_type": "BUS_TERMINAL",
        "latitude": 23.73,
        "longitude": 92.69
    },
    {
        "name": "Dimapur Airport",
        "code": "DMU",
        "city": "Dimapur",
        "state": "Nagaland",
        "hub_type": "AIRPORT",
        "latitude": 25.8839,
        "longitude": 93.7711
    },
    {
        "name": "Dimapur Railway Station",
        "code": "DMV",
        "city": "Dimapur",
        "state": "Nagaland",
        "hub_type": "RAILWAY_STATION",
        "latitude": 25.91,
        "longitude": 93.7275
    },
    {
        "name": "Kohima ISBT",
        "code": "KOH-ISBT",
        "city": "Kohima",
        "state": "Nagaland",
        "hub_type": "BUS_TERMINAL",
        "latitude": 25.675,
        "longitude": 94.108
    },
    {
        "name": "Biju Patnaik International Airport",
        "code": "BBI",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "hub_type": "AIRPORT",
        "latitude": 20.2444,
        "longitude": 85.8178
    },
    {
        "name": "Veer Surendra Sai Airport Jharsuguda",
        "code": "JRG",
        "city": "Jharsuguda",
        "state": "Odisha",
        "hub_type": "AIRPORT",
        "latitude": 21.9142,
        "longitude": 84.0506
    },
    {
        "name": "Bhubaneswar Railway Station",
        "code": "BBS",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "hub_type": "RAILWAY_STATION",
        "latitude": 20.2666,
        "longitude": 85.8436
    },
    {
        "name": "Puri Railway Station",
        "code": "PURI",
        "city": "Puri",
        "state": "Odisha",
        "hub_type": "RAILWAY_STATION",
        "latitude": 19.8135,
        "longitude": 85.8312
    },
    {
        "name": "Cuttack Junction",
        "code": "CTC",
        "city": "Cuttack",
        "state": "Odisha",
        "hub_type": "RAILWAY_STATION",
        "latitude": 20.4631,
        "longitude": 85.8929
    },
    {
        "name": "Rourkela Junction",
        "code": "ROU",
        "city": "Rourkela",
        "state": "Odisha",
        "hub_type": "RAILWAY_STATION",
        "latitude": 22.226,
        "longitude": 84.86
    },
    {
        "name": "Baramunda ISBT Bhubaneswar",
        "code": "BBS-ISBT",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "hub_type": "BUS_TERMINAL",
        "latitude": 20.276,
        "longitude": 85.794
    },
    {
        "name": "Pakyong Airport Gangtok",
        "code": "PYG",
        "city": "Gangtok",
        "state": "Sikkim",
        "hub_type": "AIRPORT",
        "latitude": 27.2272,
        "longitude": 88.5881
    },
    {
        "name": "Gangtok SNT Bus Terminus",
        "code": "GTK-SNT",
        "city": "Gangtok",
        "state": "Sikkim",
        "hub_type": "BUS_TERMINAL",
        "latitude": 27.3314,
        "longitude": 88.6138
    },
    {
        "name": "Maharaja Bir Bikram Airport Agartala",
        "code": "IXA",
        "city": "Agartala",
        "state": "Tripura",
        "hub_type": "AIRPORT",
        "latitude": 23.8869,
        "longitude": 91.2405
    },
    {
        "name": "Agartala Railway Station",
        "code": "AGTL",
        "city": "Agartala",
        "state": "Tripura",
        "hub_type": "RAILWAY_STATION",
        "latitude": 23.7917,
        "longitude": 91.2778
    },
    {
        "name": "Agartala ISBT Chandrapur",
        "code": "AGTL-ISBT",
        "city": "Agartala",
        "state": "Tripura",
        "hub_type": "BUS_TERMINAL",
        "latitude": 23.834,
        "longitude": 91.298
    },
    {
        "name": "Veer Savarkar International Airport Port Blair",
        "code": "IXZ",
        "city": "Port Blair",
        "state": "Andaman and Nicobar Islands",
        "hub_type": "AIRPORT",
        "latitude": 11.6412,
        "longitude": 92.7297
    },
    {
        "name": "Port Blair Central Bus Terminus",
        "code": "IXZ-BUS",
        "city": "Port Blair",
        "state": "Andaman and Nicobar Islands",
        "hub_type": "BUS_TERMINAL",
        "latitude": 11.6667,
        "longitude": 92.74
    },
    {
        "name": "Diu Airport",
        "code": "DIU",
        "city": "Diu",
        "state": "Dadra and Nagar Haveli and Daman and Diu",
        "hub_type": "AIRPORT",
        "latitude": 20.7133,
        "longitude": 70.9217
    },
    {
        "name": "Vapi Railway Station (Daman & Silvassa Railhead)",
        "code": "VAPI",
        "city": "Vapi",
        "state": "Gujarat",
        "hub_type": "RAILWAY_STATION",
        "latitude": 20.3714,
        "longitude": 72.9094
    },
    {
        "name": "Daman Central Bus Stand",
        "code": "DMN-BUS",
        "city": "Daman",
        "state": "Dadra and Nagar Haveli and Daman and Diu",
        "hub_type": "BUS_TERMINAL",
        "latitude": 20.417,
        "longitude": 72.833
    },
    {
        "name": "Silvassa Bus Stand",
        "code": "SLV-BUS",
        "city": "Silvassa",
        "state": "Dadra and Nagar Haveli and Daman and Diu",
        "hub_type": "BUS_TERMINAL",
        "latitude": 20.276,
        "longitude": 73.008
    },
    {
        "name": "Kushok Bakula Rimpochee Airport Leh",
        "code": "IXL",
        "city": "Leh",
        "state": "Ladakh",
        "hub_type": "AIRPORT",
        "latitude": 34.1359,
        "longitude": 77.5465
    },
    {
        "name": "Kargil Airport",
        "code": "KGI",
        "city": "Kargil",
        "state": "Ladakh",
        "hub_type": "AIRPORT",
        "latitude": 34.52,
        "longitude": 76.155
    },
    {
        "name": "Jammu Tawi Railway Station (Ladakh Railhead)",
        "code": "JAT",
        "city": "Jammu",
        "state": "Jammu and Kashmir",
        "hub_type": "RAILWAY_STATION",
        "latitude": 32.7058,
        "longitude": 74.8778
    },
    {
        "name": "Leh New Bus Stand Choglamsar Road",
        "code": "LEH-ISBT",
        "city": "Leh",
        "state": "Ladakh",
        "hub_type": "BUS_TERMINAL",
        "latitude": 34.148,
        "longitude": 77.575
    },
    {
        "name": "Agatti Airport",
        "code": "AGX",
        "city": "Agatti",
        "state": "Lakshadweep",
        "hub_type": "AIRPORT",
        "latitude": 10.8242,
        "longitude": 72.1761
    },
    {
        "name": "Agatti Island Boat Jetty",
        "code": "AGX-JET",
        "city": "Agatti",
        "state": "Lakshadweep",
        "hub_type": "BUS_TERMINAL",
        "latitude": 10.85,
        "longitude": 72.19
    },
    {
        "name": "Puducherry Airport",
        "code": "PNY",
        "city": "Puducherry",
        "state": "Puducherry",
        "hub_type": "AIRPORT",
        "latitude": 11.9686,
        "longitude": 79.8117
    },
    {
        "name": "Puducherry Railway Station",
        "code": "PDY",
        "city": "Puducherry",
        "state": "Puducherry",
        "hub_type": "RAILWAY_STATION",
        "latitude": 11.9284,
        "longitude": 79.829
    },
    {
        "name": "Puducherry New Bus Stand",
        "code": "PDY-ISBT",
        "city": "Puducherry",
        "state": "Puducherry",
        "hub_type": "BUS_TERMINAL",
        "latitude": 11.936,
        "longitude": 79.814
    },
    {
        "name": "Jaisalmer Railway Station",
        "code": "JSM",
        "city": "Jaisalmer",
        "state": "Rajasthan",
        "hub_type": "RAILWAY_STATION",
        "latitude": 26.9157,
        "longitude": 70.9083
    },
    {
        "name": "Jaisalmer Airport",
        "code": "JSA",
        "city": "Jaisalmer",
        "state": "Rajasthan",
        "hub_type": "AIRPORT",
        "latitude": 26.8887,
        "longitude": 70.8644
    },
    {
        "name": "Barmer Railway Station",
        "code": "BME",
        "city": "Barmer",
        "state": "Rajasthan",
        "hub_type": "RAILWAY_STATION",
        "latitude": 25.7533,
        "longitude": 71.3967
    },
    {
        "name": "Bikaner Junction",
        "code": "BKN",
        "city": "Bikaner",
        "state": "Rajasthan",
        "hub_type": "RAILWAY_STATION",
        "latitude": 28.0167,
        "longitude": 73.3119
    },
    {
        "name": "Bikaner Nal Airport",
        "code": "BKB",
        "city": "Bikaner",
        "state": "Rajasthan",
        "hub_type": "AIRPORT",
        "latitude": 28.07,
        "longitude": 73.206
    },
    {
        "name": "Kotdwar Railway Station (Pauri Garhwal Railhead)",
        "code": "KTW",
        "city": "Kotdwar",
        "state": "Uttarakhand",
        "hub_type": "RAILWAY_STATION",
        "latitude": 29.746,
        "longitude": 78.528
    },
    {
        "name": "Ramnagar Railway Station (Jim Corbett Gateway)",
        "code": "RMR",
        "city": "Ramnagar",
        "state": "Uttarakhand",
        "hub_type": "RAILWAY_STATION",
        "latitude": 29.3934,
        "longitude": 79.1264
    }
]


# =========================================================================
# ALL-INDIA LOCALITY & DISTRICT COORDINATES
# =========================================================================
KNOWN_LOCALITY_COORDINATES: dict[str, tuple[float, float]] = {
    "darbhanga": [
        26.1542,
        85.8918
    ],
    "patna": [
        25.5941,
        85.1376
    ],
    "muzaffarpur": [
        26.1209,
        85.3647
    ],
    "gaya": [
        24.7955,
        85.0002
    ],
    "bhagalpur": [
        25.2425,
        86.9842
    ],
    "samastipur": [
        25.856,
        85.7868
    ],
    "purnia": [
        25.7771,
        87.4753
    ],
    "begusarai": [
        25.4182,
        86.1272
    ],
    "katihar": [
        25.5414,
        87.5719
    ],
    "munger": [
        25.3757,
        86.4744
    ],
    "saharsa": [
        25.8835,
        86.6006
    ],
    "chhapra": [
        25.7811,
        84.7543
    ],
    "motihari": [
        26.647,
        84.9089
    ],
    "bettiah": [
        26.8024,
        84.5028
    ],
    "sasaram": [
        24.9528,
        84.0315
    ],
    "arrah": [
        25.5541,
        84.6667
    ],
    "buxar": [
        25.5647,
        83.9777
    ],
    "madhubani": [
        26.3533,
        86.0718
    ],
    "sitamarhi": [
        26.5976,
        85.4897
    ],
    "kishanganj": [
        26.0768,
        87.9429
    ],
    "ranchi": [
        23.3441,
        85.3096
    ],
    "jamshedpur": [
        22.8046,
        86.2029
    ],
    "tatanagar": [
        22.7683,
        86.2011
    ],
    "dhanbad": [
        23.7957,
        86.4304
    ],
    "bokaro": [
        23.6693,
        86.1511
    ],
    "deoghar": [
        24.4826,
        86.7001
    ],
    "hazaribagh": [
        23.9937,
        85.3637
    ],
    "mumbai": [
        19.076,
        72.8777
    ],
    "navi mumbai": [
        19.033,
        73.0297
    ],
    "vashi": [
        19.0771,
        72.9986
    ],
    "nerul": [
        19.033,
        73.018
    ],
    "belapur": [
        19.018,
        73.04
    ],
    "kharghar": [
        19.0473,
        73.0699
    ],
    "panvel": [
        18.9894,
        73.1207
    ],
    "thane": [
        19.2183,
        72.9781
    ],
    "kalyan": [
        19.2403,
        73.1305
    ],
    "dombivli": [
        19.2184,
        73.0867
    ],
    "borivali": [
        19.229,
        72.857
    ],
    "andheri": [
        19.1136,
        72.8697
    ],
    "bandra": [
        19.0596,
        72.8295
    ],
    "dadar": [
        19.0178,
        72.8478
    ],
    "kurla": [
        19.0726,
        72.8845
    ],
    "pune": [
        18.5204,
        73.8567
    ],
    "hadapsar": [
        18.5089,
        73.9259
    ],
    "mahalunge": [
        18.567,
        73.743
    ],
    "hinjewadi": [
        18.5913,
        73.7389
    ],
    "wakad": [
        18.5987,
        73.7628
    ],
    "baner": [
        18.559,
        73.7868
    ],
    "kothrud": [
        18.5074,
        73.8077
    ],
    "swargate": [
        18.5018,
        73.8586
    ],
    "viman nagar": [
        18.5679,
        73.9143
    ],
    "magarpatta": [
        18.5158,
        73.9272
    ],
    "kharadi": [
        18.5514,
        73.935
    ],
    "pimpri": [
        18.6298,
        73.7997
    ],
    "chinchwad": [
        18.6279,
        73.7831
    ],
    "nagpur": [
        21.1458,
        79.0882
    ],
    "nashik": [
        19.9975,
        73.7898
    ],
    "aurangabad": [
        19.8762,
        75.3433
    ],
    "chhatrapati sambhajinagar": [
        19.8762,
        75.3433
    ],
    "kolhapur": [
        16.705,
        74.2433
    ],
    "solapur": [
        17.6599,
        75.9064
    ],
    "goa": [
        15.2993,
        74.124
    ],
    "panaji": [
        15.4909,
        73.8278
    ],
    "madgaon": [
        15.2832,
        73.9862
    ],
    "margao": [
        15.2832,
        73.9862
    ],
    "vasco": [
        15.3982,
        73.8113
    ],
    "mapusa": [
        15.5937,
        73.8142
    ],
    "calangute": [
        15.5439,
        73.7553
    ],
    "baga": [
        15.5553,
        73.7517
    ],
    "candolim": [
        15.5173,
        73.7629
    ],
    "anjuna": [
        15.5841,
        73.7437
    ],
    "colva": [
        15.2789,
        73.9144
    ],
    "delhi": [
        28.6139,
        77.209
    ],
    "new delhi": [
        28.6139,
        77.209
    ],
    "noida": [
        28.5355,
        77.391
    ],
    "gurugram": [
        28.4595,
        77.0266
    ],
    "gurgaon": [
        28.4595,
        77.0266
    ],
    "ghaziabad": [
        28.6692,
        77.4538
    ],
    "faridabad": [
        28.4089,
        77.3178
    ],
    "lucknow": [
        26.8467,
        80.9462
    ],
    "kanpur": [
        26.4499,
        80.3319
    ],
    "varanasi": [
        25.3176,
        82.9739
    ],
    "prayagraj": [
        25.4358,
        81.8463
    ],
    "allahabad": [
        25.4358,
        81.8463
    ],
    "agra": [
        27.1767,
        78.0081
    ],
    "gorakhpur": [
        26.7606,
        83.3732
    ],
    "ayodhya": [
        26.7922,
        82.1998
    ],
    "bareilly": [
        28.367,
        79.4304
    ],
    "aligarh": [
        27.8974,
        78.088
    ],
    "moradabad": [
        28.835,
        78.776
    ],
    "meerut": [
        28.9845,
        77.7064
    ],
    "mathura": [
        27.4924,
        77.6737
    ],
    "jhansi": [
        25.4484,
        78.5685
    ],
    "dehradun": [
        30.3165,
        78.0322
    ],
    "haridwar": [
        29.9463,
        78.1565
    ],
    "rishikesh": [
        30.0869,
        78.2882
    ],
    "haldwani": [
        29.2183,
        79.513
    ],
    "kathgodam": [
        29.273,
        79.544
    ],
    "tanakpur": [
        29.0734,
        80.1118
    ],
    "pithoragarh": [
        29.5828,
        80.2182
    ],
    "nainital": [
        29.3919,
        79.4542
    ],
    "almora": [
        29.5971,
        79.6591
    ],
    "pantnagar": [
        29.0333,
        79.4739
    ],
    "kolkata": [
        22.5726,
        88.3639
    ],
    "howrah": [
        22.5958,
        88.2636
    ],
    "siliguri": [
        26.7271,
        88.3953
    ],
    "asansol": [
        23.6739,
        86.9524
    ],
    "durgapur": [
        23.5204,
        87.3119
    ],
    "gandhinagar": [
        23.2156,
        72.6369
    ],
    "ahmedabad": [
        23.0225,
        72.5714
    ],
    "surat": [
        21.1702,
        72.8311
    ],
    "vadodara": [
        22.3072,
        73.1812
    ],
    "rajkot": [
        22.3039,
        70.8022
    ],
    "jaipur": [
        26.9124,
        75.7873
    ],
    "jodhpur": [
        26.2389,
        73.0243
    ],
    "udaipur": [
        24.5854,
        73.7125
    ],
    "kota": [
        25.2138,
        75.8648
    ],
    "bengaluru": [
        12.9716,
        77.5946
    ],
    "bangalore": [
        12.9716,
        77.5946
    ],
    "hyderabad": [
        17.385,
        78.4867
    ],
    "chennai": [
        13.0827,
        80.2707
    ],
    "kochi": [
        9.9312,
        76.2673
    ],
    "thiruvananthapuram": [
        8.5241,
        76.9366
    ],
    "visakhapatnam": [
        17.6868,
        83.2185
    ],
    "vijayawada": [
        16.5062,
        80.648
    ],
    "chandigarh": [
        30.7333,
        76.7794
    ],
    "amritsar": [
        31.634,
        74.8723
    ],
    "guwahati": [
        26.1445,
        91.7362
    ],
    "bhopal": [
        23.2599,
        77.4126
    ],
    "indore": [
        22.7196,
        75.8577
    ]
}


# =========================================================================
# AIRPORT CODES MAPPING
# =========================================================================
CITY_AIRPORT_CODES: dict[str, str] = {
    "darbhanga": "DBR",
    "patna": "PAT",
    "gaya": "GAY",
    "muzaffarpur": "DBR",
    "samastipur": "DBR",
    "ranchi": "IXR",
    "jamshedpur": "IXW",
    "tatanagar": "IXW",
    "deoghar": "DGH",
    "mumbai": "BOM",
    "navi mumbai": "BOM",
    "thane": "BOM",
    "pune": "PNQ",
    "hadapsar": "PNQ",
    "mahalunge": "PNQ",
    "nagpur": "NAG",
    "nashik": "ISK",
    "aurangabad": "IXU",
    "chhatrapati sambhajinagar": "IXU",
    "goa": "GOI",
    "madgaon": "GOI",
    "panaji": "GOI",
    "delhi": "DEL",
    "new delhi": "DEL",
    "noida": "DEL",
    "gurgaon": "DEL",
    "gurugram": "DEL",
    "lucknow": "LKO",
    "varanasi": "VNS",
    "gorakhpur": "GOP",
    "prayagraj": "IXD",
    "ayodhya": "AYJ",
    "kanpur": "KNU",
    "agra": "AGR",
    "dehradun": "DED",
    "haridwar": "DED",
    "rishikesh": "DED",
    "pantnagar": "PGH",
    "pithoragarh": "NNS",
    "kolkata": "CCU",
    "siliguri": "IXB",
    "guwahati": "GAU",
    "bengaluru": "BLR",
    "bangalore": "BLR",
    "hyderabad": "HYD",
    "chennai": "MAA",
    "kochi": "COK",
    "visakhapatnam": "VTZ",
    "gandhinagar": "AMD",
    "ahmedabad": "AMD",
    "surat": "STV",
    "jaipur": "JAI",
    "jodhpur": "JDH",
    "udaipur": "UDR",
    "chandigarh": "IXC",
    "amritsar": "ATQ",
    "bhopal": "BHO",
    "indore": "IDR"
}

HILL_STATES = {
    "Uttarakhand", "Himachal Pradesh", "Jammu and Kashmir", "Ladakh",
    "Sikkim", "Arunachal Pradesh", "Meghalaya", "Nagaland", "Manipur",
    "Mizoram", "Tripura"
}

HILL_DISTRICTS = [
    "chamoli", "rudraprayag", "tehri", "uttarkashi", "pithoragarh", "bageshwar",
    "almora", "nainital", "champawat", "pauri", "shimla", "kullu", "mandi",
    "kinnaur", "lahsul", "spiti", "chamba", "kangra", "leh", "kargil",
    "darjeeling", "kalimpong", "nilgiris", "wayanad", "idukki", "kodagu", "chikkamagaluru"
]

# In-memory geocode cache to prevent redundant queries
_GEOCODE_CACHE: dict[str, tuple[float, float]] = {}
_GOOGLE_GEOCODE_CACHE: dict[str, dict] = {}
_DIRECTIONS_ROAD_CACHE: dict[str, tuple[float, int]] = {}


def geocode_with_google_maps(address: str) -> Optional[dict]:
    """Geocode an address in India using Google Maps Geocoding API with caching and Android Application headers."""
    clean = address.strip()
    if not clean:
        return None
    if clean.lower() in _GOOGLE_GEOCODE_CACHE:
        return _GOOGLE_GEOCODE_CACHE[clean.lower()]

    api_key = os.getenv("GOOGLE_MAPS_API_KEY") or os.getenv("EXPO_PUBLIC_GOOGLE_API_KEY")
    if not api_key:
        return None

    try:
        norm_query = clean if "india" in clean.lower() else f"{clean}, India"
        encoded = urllib.parse.quote(norm_query)
        url = f"https://maps.googleapis.com/maps/api/geocode/json?address={encoded}&key={api_key}&region=in"
        req = urllib.request.Request(url, headers=GOOGLE_API_HEADERS)
        with urllib.request.urlopen(req, timeout=4.5) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        if data.get("status") == "OK" and data.get("results"):
            res = data["results"][0]
            geom = res.get("geometry", {}).get("location", {})
            lat = float(geom.get("lat"))
            lon = float(geom.get("lng"))
            addr_comps = res.get("address_components", [])
            city = None
            district = None
            state = None
            for comp in addr_comps:
                types = comp.get("types", [])
                if "locality" in types and not city:
                    city = comp.get("long_name")
                elif "administrative_area_level_2" in types and not district:
                    district = comp.get("long_name")
                elif "administrative_area_level_1" in types and not state:
                    state = comp.get("long_name")

            result = {
                "lat": lat,
                "lon": lon,
                "formatted_address": res.get("formatted_address", clean),
                "city": city or district or clean,
                "district": district or city,
                "state": state or "India",
            }
            _GOOGLE_GEOCODE_CACHE[clean.lower()] = result
            logger.info(f"Google Maps Geocode '{address}' -> ({lat}, {lon}) [{result['city']}, {result['state']}]")
            return result
    except Exception as exc:
        logger.warning(f"Google Maps geocode failed for '{address}': {exc}")

    return None


def query_google_driving_road(start_lat: float, start_lon: float, end_lat: float, end_lon: float) -> Optional[tuple[float, int]]:
    """Query Google Directions API for authentic driving distance (km) and duration (mins)."""
    key_str = f"{round(start_lat, 4)},{round(start_lon, 4)}->{round(end_lat, 4)},{round(end_lon, 4)}"
    if key_str in _DIRECTIONS_ROAD_CACHE:
        return _DIRECTIONS_ROAD_CACHE[key_str]
    api_key = os.getenv("GOOGLE_MAPS_API_KEY") or os.getenv("EXPO_PUBLIC_GOOGLE_API_KEY")
    if not api_key:
        return None
    try:
        url = f"https://maps.googleapis.com/maps/api/directions/json?origin={start_lat},{start_lon}&destination={end_lat},{end_lon}&mode=driving&key={api_key}"
        req = urllib.request.Request(url, headers=GOOGLE_API_HEADERS)
        with urllib.request.urlopen(req, timeout=3.5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("status") == "OK" and data.get("routes"):
                leg = data["routes"][0]["legs"][0]
                dist_km = round(leg["distance"]["value"] / 1000.0, 1)
                dur_mins = max(5, int(leg["duration"]["value"] / 60))
                _DIRECTIONS_ROAD_CACHE[key_str] = (dist_km, dur_mins)
                return (dist_km, dur_mins)
    except Exception:
        pass
    return None


def resolve_city_coordinates(name: str, fallback_lat: float = 0.0, fallback_lon: float = 0.0) -> tuple[float, float]:
    """Resolve ANY arbitrary Indian city, town, locality or village string to genuine GPS coordinates."""
    if not name:
        return fallback_lat, fallback_lon

    clean = name.lower().strip()
    if clean in _GEOCODE_CACHE:
        return _GEOCODE_CACHE[clean]

    # Tier 0: Live Google Maps Geocoding API with Android headers
    g_res = geocode_with_google_maps(name)
    if g_res:
        coords = (g_res["lat"], g_res["lon"])
        _GEOCODE_CACHE[clean] = coords
        return coords

    # Tier 1: Check comma-separated tokens
    tokens = [t.strip() for t in clean.replace("-", " ").split(",") if t.strip()]
    for token in tokens:
        if token in KNOWN_LOCALITY_COORDINATES:
            _GEOCODE_CACHE[clean] = KNOWN_LOCALITY_COORDINATES[token]
            return KNOWN_LOCALITY_COORDINATES[token]
        for word in token.split():
            if word in KNOWN_LOCALITY_COORDINATES:
                _GEOCODE_CACHE[clean] = KNOWN_LOCALITY_COORDINATES[word]
                return KNOWN_LOCALITY_COORDINATES[word]

    # Tier 2: Sub-string search in order of specific locality length
    sorted_keys = sorted(KNOWN_LOCALITY_COORDINATES.keys(), key=lambda k: len(k), reverse=True)
    for key in sorted_keys:
        if key in clean:
            _GEOCODE_CACHE[clean] = KNOWN_LOCALITY_COORDINATES[key]
            return KNOWN_LOCALITY_COORDINATES[key]

    # Tier 3: Caller provided valid non-default GPS coordinates
    if fallback_lat and fallback_lon and 8.0 <= fallback_lat <= 37.5 and 68.0 <= fallback_lon <= 97.5:
        is_rishikesh_dummy = abs(fallback_lat - 30.0869) < 0.01 and "rishikesh" not in clean
        is_delhi_dummy = abs(fallback_lat - 28.6139) < 0.01 and "delhi" not in clean
        if not (is_rishikesh_dummy or is_delhi_dummy):
            _GEOCODE_CACHE[clean] = (fallback_lat, fallback_lon)
            return fallback_lat, fallback_lon

    # Tier 4: Live OpenStreetMap Nominatim request
    try:
        query_text = name.strip()
        norm_query = query_text if "india" in query_text.lower() else f"{query_text}, India"
        encoded_query = urllib.parse.quote(norm_query)
        url = f"https://nominatim.openstreetmap.org/search?q={encoded_query}&format=json&limit=1&countrycodes=in"
        req = urllib.request.Request(url, headers={"User-Agent": "SafarX/3.0"})
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data and len(data) > 0:
                lat = float(data[0]["lat"])
                lon = float(data[0]["lon"])
                logger.info(f"Nominatim resolved '{name}' -> ({lat}, {lon})")
                _GEOCODE_CACHE[clean] = (lat, lon)
                return lat, lon
    except Exception as exc:
        logger.debug(f"Nominatim geocode failed for '{name}': {exc}")

    return fallback_lat, fallback_lon


def find_candidate_hubs_sorted(
    lat: float,
    lon: float,
    hub_type: Literal["RAILWAY_STATION", "AIRPORT", "BUS_TERMINAL"],
    limit: int = 4,
) -> list[tuple[HubInfo, float]]:
    """Find the top-N closest transit hubs of given type to coordinates, sorted by distance."""
    candidates = [h for h in INDIAN_TRANSIT_HUBS if h["hub_type"] == hub_type]
    if not candidates:
        raise ValueError(f"No transit hubs registered for type {hub_type}")

    scored = []
    for hub in candidates:
        dist = haversine_km(lat, lon, hub["latitude"], hub["longitude"])
        scored.append((hub, round(dist, 2)))

    scored.sort(key=lambda x: x[1])
    return scored[:limit]


def find_nearest_hub(
    lat: float,
    lon: float,
    hub_type: Literal["RAILWAY_STATION", "AIRPORT", "BUS_TERMINAL"],
) -> tuple[HubInfo, float]:
    """Find the single closest transit hub of given type to coordinates."""
    candidates = find_candidate_hubs_sorted(lat, lon, hub_type, limit=1)
    return candidates[0]


def resolve_locality_context(name: str, lat: float = 0.0, lon: float = 0.0) -> dict:
    """Resolve ANY locality, village, township, or district across all 28 states & 8 UTs of India.
    Identifies: parent city, district, state, terrain, direct rail access, nearest operational railhead,
    nearest commercial airport, road feeder distance, mode, travel duration, and realistic tariffs.
    """
    clean = name.strip()
    c_lower = clean.lower()

    # 1. Resolve coordinates & geocoding components
    g_res = geocode_with_google_maps(clean)
    if g_res:
        res_lat = g_res["lat"]
        res_lon = g_res["lon"]
        state = g_res.get("state") or "India"
        district = g_res.get("district") or g_res.get("city") or clean
        city = g_res.get("city") or district or clean
    else:
        res_lat, res_lon = resolve_city_coordinates(clean, fallback_lat=lat, fallback_lon=lon)
        state = "India"
        district = clean.split(",")[0].strip().title()
        city = district

    # 2. Check well-known metro localities (Pune, Mumbai, Delhi, Bengaluru)
    pune_localities = [
        "viman nagar", "lohegaon", "kalyani nagar", "koregaon park", "yerwada",
        "wadgaon sheri", "kharadi", "hadapsar", "magarpatta", "fatima nagar",
        "wanowrie", "kondhwa", "camp", "swargate", "shivajinagar", "deccan",
        "kothrud", "karve nagar", "warje", "bavdhan", "baner", "balewadi",
        "aundh", "pashan", "hinjawadi", "hinjewadi", "wakad", "pimple",
        "pimpri", "chinchwad", "nigdi", "akurdi", "bhosari", "moshi",
        "ravet", "tathawade", "punawale", "mahalunge", "dhanori"
    ]
    if any(loc in c_lower for loc in pune_localities) or (c_lower == "pune"):
        matched_loc = next((loc.title() for loc in pune_localities if loc in c_lower), "Pune")
        return {
            "clean_name": matched_loc,
            "parent_city": "Pune",
            "district": "Pune",
            "state": "Maharashtra",
            "is_hill": False,
            "is_island": False,
            "is_remote": False,
            "is_kumaon": False,
            "is_garhwal": False,
            "train_reachable_direct": True,
            "rail_station": "Pune Junction (PUNE)",
            "rail_code": "PUNE",
            "rail_dist_km": 8.5,
            "rail_reachability_text": "Direct broad-gauge connectivity via Pune Junction (PUNE).",
            "airport": "Pune International Airport (PNQ)",
            "airport_code": "PNQ",
            "airport_dist_km": 6.2,
            "airport_reachability_text": "Immediate air connectivity via Pune Airport (PNQ).",
            "bus_terminal": "Pune Swargate Bus Terminal",
            "bus_dist_km": 9.0,
            "local_feeder_point": f"{matched_loc} Feeder Stop / Pune Station",
            "feeder_mode": "AUTO",
            "feeder_operator": "Uber Auto / Local Auto",
            "feeder_fare": 95.0,
            "feeder_duration_minutes": 22,
            "feeder_summary": f"Local Auto • 8.5 km • 22 mins • ₹95",
            "lat": res_lat,
            "lon": res_lon,
        }

    mumbai_localities = [
        "andheri", "bandra", "borivali", "dadar", "kurla", "powai", "juhu",
        "colaba", "malad", "kandivali", "goregaon", "jogeshwari", "santacruz",
        "vile parle", "ghatkopar", "mulund", "chembur", "sion", "churchgate",
        "marine lines", "grant road", "mumbai central", "lower parel", "worli",
        "navi mumbai", "vashi", "nerul", "belapur", "kharghar", "panvel",
        "airoli", "ghansoli", "kopar khairane", "sanpada", "seawoods", "ulwe",
        "thane", "kalyan", "dombivli"
    ]
    if any(loc in c_lower for loc in mumbai_localities) or (c_lower == "mumbai"):
        matched_loc = next((loc.title() for loc in mumbai_localities if loc in c_lower), "Mumbai")
        is_navi = any(n in c_lower for n in ["navi mumbai", "panvel", "vashi", "nerul", "belapur", "kharghar"])
        rail = "Panvel Junction (PNVL)" if is_navi else "Chhatrapati Shivaji Maharaj Terminus (CSMT)"
        r_code = "PNVL" if is_navi else "CSMT"
        return {
            "clean_name": matched_loc,
            "parent_city": "Navi Mumbai" if is_navi else "Mumbai",
            "district": "Mumbai Suburban",
            "state": "Maharashtra",
            "is_hill": False,
            "is_island": False,
            "is_remote": False,
            "is_kumaon": False,
            "is_garhwal": False,
            "train_reachable_direct": True,
            "rail_station": rail,
            "rail_code": r_code,
            "rail_dist_km": 12.0,
            "rail_reachability_text": f"Direct broad-gauge connectivity via {rail}.",
            "airport": "Chhatrapati Shivaji Maharaj International Airport (BOM)",
            "airport_code": "BOM",
            "airport_dist_km": 9.5,
            "airport_reachability_text": "Immediate air connectivity via Mumbai Airport (BOM).",
            "bus_terminal": "Vashi Highway Bus Terminal" if is_navi else "Borivali / Dadar Asiad Bus Stand",
            "bus_dist_km": 10.0,
            "local_feeder_point": f"{matched_loc} Feeder Stop",
            "feeder_mode": "CAB",
            "feeder_operator": "UberGo AC Cab",
            "feeder_fare": 210.0,
            "feeder_duration_minutes": 30,
            "feeder_summary": f"UberGo Cab • 12.0 km • 30 mins • ₹210",
            "lat": res_lat,
            "lon": res_lon,
        }

    # 3. Terrain and Geographical Analysis for ALL other places across India
    is_hill_state = state in HILL_STATES
    is_hill_dist = any(d in (district or "").lower() for d in HILL_DISTRICTS) or any(d in c_lower for d in HILL_DISTRICTS)
    is_hill = is_hill_state or is_hill_dist
    is_island = state in ["Andaman and Nicobar Islands", "Lakshadweep"] or "island" in c_lower
    is_remote = is_hill or is_island or any(r in c_lower for r in ["jaisalmer", "barmer", "bikaner", "kutch", "spiti", "ladakh", "nubra", "khuri", "mana", "daringbadi", "ziro"])

    is_kumaon = "uttarakhand" in state.lower() and any(k in (c_lower + " " + (district or "").lower()) for k in ["pithoragarh", "almora", "nainital", "bageshwar", "champawat", "lohaghat", "dharchula", "munsiyari", "didihat", "ranikhet", "bhimtal"])
    is_garhwal = "uttarakhand" in state.lower() and any(g in (c_lower + " " + (district or "").lower()) for g in ["chamoli", "rudraprayag", "tehri", "uttarkashi", "joshimath", "badrinath", "kedarnath", "auli", "mussoorie", "dhanaulti", "mana"])

    # 4. Nearest Hubs Search from Comprehensive Registry
    r_hub, straight_r_km = find_nearest_hub(res_lat, res_lon, "RAILWAY_STATION")
    a_hub, straight_a_km = find_nearest_hub(res_lat, res_lon, "AIRPORT")
    b_hub, straight_b_km = find_nearest_hub(res_lat, res_lon, "BUS_TERMINAL")

    # Query Google Directions driving road for genuine road distance and driving duration
    road_info = query_google_driving_road(res_lat, res_lon, r_hub["latitude"], r_hub["longitude"])
    if road_info:
        road_r_km, road_dur = road_info
    else:
        road_winding_factor = 1.65 if is_hill else (1.40 if is_remote else 1.25)
        road_r_km = max(1.0, round(straight_r_km * road_winding_factor, 1))
        speed = 24.0 if is_hill else (38.0 if is_remote else 45.0)
        road_dur = max(15, int(road_r_km / speed * 60))

    road_air_info = query_google_driving_road(res_lat, res_lon, a_hub["latitude"], a_hub["longitude"])
    if road_air_info:
        road_a_km, _ = road_air_info
    else:
        road_a_km = max(1.0, round(straight_a_km * (1.65 if is_hill else 1.25), 1))

    road_b_km = max(1.0, round(straight_b_km * (1.35 if is_hill else 1.20), 1))

    clean_place_name = clean.split(",")[0].strip().title()
    train_reachable_direct = (road_r_km <= 15.0 and not is_island and not is_hill)

    # 5. Precise Reachability Narratives
    if train_reachable_direct:
        rail_text = f"Directly reachable via {r_hub['name']} ({r_hub['code']}), located {road_r_km} km away."
    elif is_island:
        rail_text = f"{clean_place_name} (Island Territory) has no railway network. Broad-gauge train is reachable from mainland port railhead at {r_hub['name']} ({r_hub['code']})."
    elif is_hill:
        rail_text = f"{clean_place_name} has no direct railway line due to high-altitude Himalayan mountain terrain. Train is reachable till {r_hub['name']} ({r_hub['code']}), located {road_r_km} km away via mountain road."
    elif is_remote:
        rail_text = f"{clean_place_name} has no direct railway line. Nearest broad-gauge railhead is {r_hub['name']} ({r_hub['code']}), located {road_r_km} km away."
    else:
        rail_text = f"{clean_place_name} has no direct railway station. Train is reachable till {r_hub['name']} ({r_hub['code']}), located {road_r_km} km away."

    if is_island:
        air_text = f"Island commercial airport connectivity via {a_hub['name']} ({a_hub['code']}), located {road_a_km} km away."
    elif road_a_km <= 25.0:
        air_text = f"Immediate air access via {a_hub['name']} ({a_hub['code']}) [{road_a_km} km away]."
    else:
        air_text = f"Commercial flights reach till {a_hub['name']} ({a_hub['code']}), located {road_a_km} km away."

    # 6. Realistic Feeder Calculation
    if is_hill or road_r_km > 25.0:
        feeder_mode = "CAB"
        feeder_op = "Mountain Feeder Taxi / Shared Sumo 4x4" if is_hill else "Regional Feeder Cab"
        feeder_dur = road_dur
        feeder_fare = max(150.0, round(road_r_km * (2.6 if is_hill else 1.9), 0))
    else:
        feeder_mode = "AUTO"
        feeder_op = "Local Auto / 3-Wheeler"
        feeder_dur = max(8, road_dur)
        feeder_fare = max(30.0, round(30.0 + max(0.0, road_r_km - 1.5) * 15.0, 0))

    feeder_summary = f"{feeder_op} ({feeder_mode}) • {road_r_km} km • {feeder_dur} mins • ₹{feeder_fare}"

    return {
        "clean_name": clean_place_name,
        "parent_city": city or r_hub["city"],
        "district": district or city or r_hub["city"],
        "state": state if state != "India" else r_hub["state"],
        "is_hill": is_hill,
        "is_island": is_island,
        "is_remote": is_remote,
        "is_kumaon": is_kumaon,
        "is_garhwal": is_garhwal,
        "train_reachable_direct": train_reachable_direct,
        "rail_station": f"{r_hub['name']} ({r_hub['code']})",
        "rail_code": r_hub["code"],
        "rail_dist_km": road_r_km,
        "rail_reachability_text": rail_text,
        "airport": f"{a_hub['name']} ({a_hub['code']})",
        "airport_code": a_hub["code"],
        "airport_dist_km": road_a_km,
        "airport_reachability_text": air_text,
        "bus_terminal": b_hub["name"],
        "bus_dist_km": road_b_km,
        "local_feeder_point": f"{clean_place_name} Feeder Point",
        "feeder_mode": feeder_mode,
        "feeder_operator": feeder_op,
        "feeder_fare": feeder_fare,
        "feeder_duration_minutes": feeder_dur,
        "feeder_summary": feeder_summary,
        "lat": res_lat,
        "lon": res_lon,
    }
