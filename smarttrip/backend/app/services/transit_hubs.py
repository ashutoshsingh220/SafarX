"""High-Performance Transit Hubs & Multi-Tier All-India Geocoding Service.

Provides comprehensive coverage of:
1. Operational Commercial Airports across India (DGCA/AAI certified).
2. Major Indian Railways Division Junctions and Termini across all zones.
3. Central & Inter-State Bus Terminals (ISBTs) across key districts.
4. Robust Multi-Tier Geocoding engine with Nominatim and local district caching.
"""

import json
import logging
import math
import os
import urllib.parse
import urllib.request
from typing import Literal, Optional, TypedDict
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


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
# COMPREHENSIVE ALL-INDIA TRANSIT HUBS REGISTRY
# =========================================================================
INDIAN_TRANSIT_HUBS: list[HubInfo] = [
    # ---------------------------------------------------------------------
    # BIHAR & JHARKHAND & EAST
    # ---------------------------------------------------------------------
    # Airports
    {"name": "Darbhanga Airport", "code": "DBR", "city": "Darbhanga", "state": "Bihar", "hub_type": "AIRPORT", "latitude": 26.1932, "longitude": 85.9142},
    {"name": "Jay Prakash Narayan International Airport", "code": "PAT", "city": "Patna", "state": "Bihar", "hub_type": "AIRPORT", "latitude": 25.5913, "longitude": 85.0880},
    {"name": "Gaya International Airport", "code": "GAY", "city": "Gaya", "state": "Bihar", "hub_type": "AIRPORT", "latitude": 24.7441, "longitude": 84.9512},
    {"name": "Birsa Munda Airport", "code": "IXR", "city": "Ranchi", "state": "Jharkhand", "hub_type": "AIRPORT", "latitude": 23.3143, "longitude": 85.3217},
    {"name": "Deoghar Airport", "code": "DGH", "city": "Deoghar", "state": "Jharkhand", "hub_type": "AIRPORT", "latitude": 24.4447, "longitude": 86.7022},
    {"name": "Sonari Airport", "code": "IXW", "city": "Jamshedpur", "state": "Jharkhand", "hub_type": "AIRPORT", "latitude": 22.8130, "longitude": 86.1680},
    # Railway Stations
    {"name": "Darbhanga Junction", "code": "DBG", "city": "Darbhanga", "state": "Bihar", "hub_type": "RAILWAY_STATION", "latitude": 26.1524, "longitude": 85.8971},
    {"name": "Samastipur Junction", "code": "SPJ", "city": "Samastipur", "state": "Bihar", "hub_type": "RAILWAY_STATION", "latitude": 25.8617, "longitude": 85.7824},
    {"name": "Muzaffarpur Junction", "code": "MFP", "city": "Muzaffarpur", "state": "Bihar", "hub_type": "RAILWAY_STATION", "latitude": 26.1245, "longitude": 85.3887},
    {"name": "Patna Junction", "code": "PNBE", "city": "Patna", "state": "Bihar", "hub_type": "RAILWAY_STATION", "latitude": 25.6025, "longitude": 85.1376},
    {"name": "Patliputra Junction", "code": "PPTA", "city": "Patna", "state": "Bihar", "hub_type": "RAILWAY_STATION", "latitude": 25.6375, "longitude": 85.0886},
    {"name": "Danapur Railway Station", "code": "DNR", "city": "Patna", "state": "Bihar", "hub_type": "RAILWAY_STATION", "latitude": 25.6267, "longitude": 85.0442},
    {"name": "Gaya Junction", "code": "GAYA", "city": "Gaya", "state": "Bihar", "hub_type": "RAILWAY_STATION", "latitude": 24.8078, "longitude": 84.9997},
    {"name": "Barauni Junction", "code": "BJU", "city": "Barauni", "state": "Bihar", "hub_type": "RAILWAY_STATION", "latitude": 25.4744, "longitude": 85.9744},
    {"name": "Bhagalpur Junction", "code": "BGP", "city": "Bhagalpur", "state": "Bihar", "hub_type": "RAILWAY_STATION", "latitude": 25.2425, "longitude": 86.9746},
    {"name": "Katihar Junction", "code": "KIR", "city": "Katihar", "state": "Bihar", "hub_type": "RAILWAY_STATION", "latitude": 25.5392, "longitude": 87.5684},
    {"name": "Ranchi Railway Station", "code": "RNC", "city": "Ranchi", "state": "Jharkhand", "hub_type": "RAILWAY_STATION", "latitude": 23.3512, "longitude": 85.3378},
    {"name": "Tatanagar Junction", "code": "TATA", "city": "Jamshedpur", "state": "Jharkhand", "hub_type": "RAILWAY_STATION", "latitude": 22.7683, "longitude": 86.2011},
    {"name": "Dhanbad Junction", "code": "DHN", "city": "Dhanbad", "state": "Jharkhand", "hub_type": "RAILWAY_STATION", "latitude": 23.7917, "longitude": 86.4306},
    # Bus Terminals
    {"name": "Darbhanga Bus Stand (Delhi More)", "code": "DBG-BS", "city": "Darbhanga", "state": "Bihar", "hub_type": "BUS_TERMINAL", "latitude": 26.1500, "longitude": 85.9000},
    {"name": "Pataliputra ISBT Bairiya", "code": "PAT-ISBT", "city": "Patna", "state": "Bihar", "hub_type": "BUS_TERMINAL", "latitude": 25.5680, "longitude": 85.1820},
    {"name": "Muzaffarpur Bairia ISBT", "code": "MFP-ISBT", "city": "Muzaffarpur", "state": "Bihar", "hub_type": "BUS_TERMINAL", "latitude": 26.1380, "longitude": 85.3620},
    {"name": "Birsa Munda Bus Terminal Khadgarha", "code": "IXR-ISBT", "city": "Ranchi", "state": "Jharkhand", "hub_type": "BUS_TERMINAL", "latitude": 23.3680, "longitude": 85.3420},
    {"name": "Mango Bus Stand Jamshedpur", "code": "TATA-BS", "city": "Jamshedpur", "state": "Jharkhand", "hub_type": "BUS_TERMINAL", "latitude": 22.8210, "longitude": 86.2050},

    # ---------------------------------------------------------------------
    # MAHARASHTRA & MUMBAI METROPOLITAN REGION (MMR) & PUNE
    # ---------------------------------------------------------------------
    # Airports
    {"name": "Chhatrapati Shivaji Maharaj International Airport", "code": "BOM", "city": "Mumbai", "state": "Maharashtra", "hub_type": "AIRPORT", "latitude": 19.0896, "longitude": 72.8656},
    {"name": "Navi Mumbai International Airport", "code": "NMI", "city": "Navi Mumbai", "state": "Maharashtra", "hub_type": "AIRPORT", "latitude": 18.9902, "longitude": 73.0694},
    {"name": "Pune International Airport", "code": "PNQ", "city": "Pune", "state": "Maharashtra", "hub_type": "AIRPORT", "latitude": 18.5822, "longitude": 73.9197},
    {"name": "Dr. Babasaheb Ambedkar International Airport", "code": "NAG", "city": "Nagpur", "state": "Maharashtra", "hub_type": "AIRPORT", "latitude": 21.0922, "longitude": 79.0472},
    {"name": "Nashik Airport Ozar", "code": "ISK", "city": "Nashik", "state": "Maharashtra", "hub_type": "AIRPORT", "latitude": 20.1192, "longitude": 73.9136},
    {"name": "Chhatrapati Sambhajinagar Airport", "code": "IXU", "city": "Aurangabad", "state": "Maharashtra", "hub_type": "AIRPORT", "latitude": 19.8631, "longitude": 75.3981},
    {"name": "Kolhapur Airport", "code": "KLH", "city": "Kolhapur", "state": "Maharashtra", "hub_type": "AIRPORT", "latitude": 16.6644, "longitude": 74.2817},
    # Railway Stations
    {"name": "Lokmanya Tilak Terminus", "code": "LTT", "city": "Mumbai", "state": "Maharashtra", "hub_type": "RAILWAY_STATION", "latitude": 19.0698, "longitude": 72.8911},
    {"name": "Panvel Junction (Navi Mumbai)", "code": "PNVL", "city": "Navi Mumbai", "state": "Maharashtra", "hub_type": "RAILWAY_STATION", "latitude": 18.9894, "longitude": 73.1207},
    {"name": "Chhatrapati Shivaji Maharaj Terminus", "code": "CSMT", "city": "Mumbai", "state": "Maharashtra", "hub_type": "RAILWAY_STATION", "latitude": 18.9401, "longitude": 72.8354},
    {"name": "Bandra Terminus", "code": "BDTS", "city": "Mumbai", "state": "Maharashtra", "hub_type": "RAILWAY_STATION", "latitude": 19.0628, "longitude": 72.8407},
    {"name": "Mumbai Central", "code": "MMCT", "city": "Mumbai", "state": "Maharashtra", "hub_type": "RAILWAY_STATION", "latitude": 18.9696, "longitude": 72.8193},
    {"name": "Thane Railway Station", "code": "TNA", "city": "Thane", "state": "Maharashtra", "hub_type": "RAILWAY_STATION", "latitude": 19.1860, "longitude": 72.9757},
    {"name": "Kalyan Junction", "code": "KYN", "city": "Kalyan", "state": "Maharashtra", "hub_type": "RAILWAY_STATION", "latitude": 19.2364, "longitude": 73.1306},
    {"name": "Borivali Railway Station", "code": "BVI", "city": "Mumbai", "state": "Maharashtra", "hub_type": "RAILWAY_STATION", "latitude": 19.2290, "longitude": 72.8570},
    {"name": "Pune Junction", "code": "PUNE", "city": "Pune", "state": "Maharashtra", "hub_type": "RAILWAY_STATION", "latitude": 18.5284, "longitude": 73.8744},
    {"name": "Hadapsar Railway Station", "code": "HDP", "city": "Pune", "state": "Maharashtra", "hub_type": "RAILWAY_STATION", "latitude": 18.5133, "longitude": 73.9317},
    {"name": "Shivajinagar Railway Station", "code": "SVJR", "city": "Pune", "state": "Maharashtra", "hub_type": "RAILWAY_STATION", "latitude": 18.5323, "longitude": 73.8524},
    {"name": "Nagpur Junction", "code": "NGP", "city": "Nagpur", "state": "Maharashtra", "hub_type": "RAILWAY_STATION", "latitude": 21.1524, "longitude": 79.0888},
    {"name": "Nashik Road Railway Station", "code": "NK", "city": "Nashik", "state": "Maharashtra", "hub_type": "RAILWAY_STATION", "latitude": 19.9575, "longitude": 73.8347},
    # Bus Terminals
    {"name": "Vashi Highway Bus Terminal (Navi Mumbai)", "code": "NAV-VSH", "city": "Navi Mumbai", "state": "Maharashtra", "hub_type": "BUS_TERMINAL", "latitude": 19.0645, "longitude": 72.9985},
    {"name": "Nerul LP Bus Terminal (Navi Mumbai)", "code": "NAV-NRL", "city": "Navi Mumbai", "state": "Maharashtra", "hub_type": "BUS_TERMINAL", "latitude": 19.0330, "longitude": 73.0180},
    {"name": "Borivali Western Bus Stand Mumbai", "code": "MUM-BOR", "city": "Mumbai", "state": "Maharashtra", "hub_type": "BUS_TERMINAL", "latitude": 19.2290, "longitude": 72.8570},
    {"name": "Dadar Asiad TT Circle Bus Stand", "code": "MUM-DDR", "city": "Mumbai", "state": "Maharashtra", "hub_type": "BUS_TERMINAL", "latitude": 19.0178, "longitude": 72.8478},
    {"name": "Pune Swargate Bus Terminal", "code": "PUN-SGT", "city": "Pune", "state": "Maharashtra", "hub_type": "BUS_TERMINAL", "latitude": 18.5018, "longitude": 73.8586},
    {"name": "Pune Wakad Bus Stand", "code": "PUN-WKD", "city": "Pune", "state": "Maharashtra", "hub_type": "BUS_TERMINAL", "latitude": 18.5987, "longitude": 73.7628},
    {"name": "Hadapsar Gadital Bus Terminal", "code": "PUN-HDP", "city": "Pune", "state": "Maharashtra", "hub_type": "BUS_TERMINAL", "latitude": 18.5008, "longitude": 73.9355},

    # ---------------------------------------------------------------------
    # GOA
    # ---------------------------------------------------------------------
    {"name": "Goa Dabolim International Airport", "code": "GOI", "city": "Goa", "state": "Goa", "hub_type": "AIRPORT", "latitude": 15.3808, "longitude": 73.8314},
    {"name": "Manohar International Airport Mopa", "code": "GOX", "city": "Goa", "state": "Goa", "hub_type": "AIRPORT", "latitude": 15.7667, "longitude": 73.8667},
    {"name": "Madgaon Junction", "code": "MAO", "city": "Goa", "state": "Goa", "hub_type": "RAILWAY_STATION", "latitude": 15.2736, "longitude": 73.9580},
    {"name": "Vasco da Gama Railway Station", "code": "VSG", "city": "Goa", "state": "Goa", "hub_type": "RAILWAY_STATION", "latitude": 15.3982, "longitude": 73.8113},
    {"name": "Thivim Railway Station (North Goa)", "code": "THVM", "city": "Goa", "state": "Goa", "hub_type": "RAILWAY_STATION", "latitude": 15.6171, "longitude": 73.8761},
    {"name": "Panaji KTC Inter-State Bus Stand", "code": "GOA-PNJ", "city": "Goa", "state": "Goa", "hub_type": "BUS_TERMINAL", "latitude": 15.4989, "longitude": 73.8322},
    {"name": "Madgaon KTC Bus Stand", "code": "GOA-MDG", "city": "Goa", "state": "Goa", "hub_type": "BUS_TERMINAL", "latitude": 15.2833, "longitude": 73.9667},
    {"name": "Mapusa Bus Stand (North Goa)", "code": "GOA-MPS", "city": "Goa", "state": "Goa", "hub_type": "BUS_TERMINAL", "latitude": 15.5925, "longitude": 73.8136},

    # ---------------------------------------------------------------------
    # DELHI NCR & NORTHERN INDIA
    # ---------------------------------------------------------------------
    # Airports
    {"name": "Indira Gandhi International Airport", "code": "DEL", "city": "Delhi", "state": "Delhi", "hub_type": "AIRPORT", "latitude": 28.5562, "longitude": 77.1000},
    {"name": "Hindon Airport", "code": "HDO", "city": "Ghaziabad", "state": "Uttar Pradesh", "hub_type": "AIRPORT", "latitude": 28.7061, "longitude": 77.3589},
    {"name": "Shaheed Bhagat Singh International Airport", "code": "IXC", "city": "Chandigarh", "state": "Chandigarh", "hub_type": "AIRPORT", "latitude": 30.6735, "longitude": 76.7885},
    {"name": "Sri Guru Ram Dass Jee International Airport", "code": "ATQ", "city": "Amritsar", "state": "Punjab", "hub_type": "AIRPORT", "latitude": 31.7096, "longitude": 74.7973},
    {"name": "Sheikh ul-Alam International Airport", "code": "SXR", "city": "Srinagar", "state": "Jammu and Kashmir", "hub_type": "AIRPORT", "latitude": 33.9871, "longitude": 74.7742},
    {"name": "Jammu Civil Enclave", "code": "IXJ", "city": "Jammu", "state": "Jammu and Kashmir", "hub_type": "AIRPORT", "latitude": 32.6891, "longitude": 74.8374},
    # Railway Stations
    {"name": "New Delhi Railway Station", "code": "NDLS", "city": "Delhi", "state": "Delhi", "hub_type": "RAILWAY_STATION", "latitude": 28.6429, "longitude": 77.2195},
    {"name": "Hazrat Nizamuddin Railway Station", "code": "NZM", "city": "Delhi", "state": "Delhi", "hub_type": "RAILWAY_STATION", "latitude": 28.5892, "longitude": 77.2530},
    {"name": "Anand Vihar Railway Terminal", "code": "ANVT", "city": "Delhi", "state": "Delhi", "hub_type": "RAILWAY_STATION", "latitude": 28.6508, "longitude": 77.3153},
    {"name": "Old Delhi Railway Station", "code": "DLI", "city": "Delhi", "state": "Delhi", "hub_type": "RAILWAY_STATION", "latitude": 28.6617, "longitude": 77.2289},
    {"name": "Chandigarh Junction", "code": "CDG", "city": "Chandigarh", "state": "Chandigarh", "hub_type": "RAILWAY_STATION", "latitude": 30.7025, "longitude": 76.8214},
    {"name": "Amritsar Junction", "code": "ASR", "city": "Amritsar", "state": "Punjab", "hub_type": "RAILWAY_STATION", "latitude": 31.6340, "longitude": 74.8723},
    {"name": "Ludhiana Junction", "code": "LDH", "city": "Ludhiana", "state": "Punjab", "hub_type": "RAILWAY_STATION", "latitude": 30.9010, "longitude": 75.8573},
    # Bus Terminals
    {"name": "Kashmere Gate ISBT Delhi", "code": "DEL-ISBT", "city": "Delhi", "state": "Delhi", "hub_type": "BUS_TERMINAL", "latitude": 28.6675, "longitude": 77.2289},
    {"name": "Anand Vihar ISBT Delhi", "code": "DEL-ANVT", "city": "Delhi", "state": "Delhi", "hub_type": "BUS_TERMINAL", "latitude": 28.6469, "longitude": 77.3160},
    {"name": "Sarai Kale Khan ISBT Delhi", "code": "DEL-SKK", "city": "Delhi", "state": "Delhi", "hub_type": "BUS_TERMINAL", "latitude": 28.5912, "longitude": 77.2580},
    {"name": "Chandigarh ISBT Sector 43", "code": "CDG-ISBT", "city": "Chandigarh", "state": "Chandigarh", "hub_type": "BUS_TERMINAL", "latitude": 30.7180, "longitude": 76.7450},

    # ---------------------------------------------------------------------
    # UTTAR PRADESH
    # ---------------------------------------------------------------------
    # Airports
    {"name": "Chaudhary Charan Singh International Airport", "code": "LKO", "city": "Lucknow", "state": "Uttar Pradesh", "hub_type": "AIRPORT", "latitude": 26.7606, "longitude": 80.8893},
    {"name": "Lal Bahadur Shastri International Airport", "code": "VNS", "city": "Varanasi", "state": "Uttar Pradesh", "hub_type": "AIRPORT", "latitude": 25.4524, "longitude": 82.8593},
    {"name": "Mahayogi Gorakhnath Airport", "code": "GOP", "city": "Gorakhpur", "state": "Uttar Pradesh", "hub_type": "AIRPORT", "latitude": 26.7397, "longitude": 83.4497},
    {"name": "Prayagraj Airport", "code": "IXD", "city": "Prayagraj", "state": "Uttar Pradesh", "hub_type": "AIRPORT", "latitude": 25.4400, "longitude": 81.7340},
    {"name": "Maharishi Valmiki International Airport", "code": "AYJ", "city": "Ayodhya", "state": "Uttar Pradesh", "hub_type": "AIRPORT", "latitude": 26.7508, "longitude": 82.1558},
    {"name": "Kanpur Airport", "code": "KNU", "city": "Kanpur", "state": "Uttar Pradesh", "hub_type": "AIRPORT", "latitude": 26.4414, "longitude": 80.4136},
    {"name": "Agra Kheria Airport", "code": "AGR", "city": "Agra", "state": "Uttar Pradesh", "hub_type": "AIRPORT", "latitude": 27.1558, "longitude": 77.9609},
    {"name": "Bareilly Airport", "code": "BEK", "city": "Bareilly", "state": "Uttar Pradesh", "hub_type": "AIRPORT", "latitude": 28.4239, "longitude": 79.4503},
    # Railway Stations
    {"name": "Pt. Deen Dayal Upadhyaya Junction", "code": "DDU", "city": "Mughalsarai", "state": "Uttar Pradesh", "hub_type": "RAILWAY_STATION", "latitude": 25.2798, "longitude": 83.1235},
    {"name": "Varanasi Junction", "code": "BSB", "city": "Varanasi", "state": "Uttar Pradesh", "hub_type": "RAILWAY_STATION", "latitude": 25.3283, "longitude": 82.9866},
    {"name": "Lucknow Charbagh", "code": "LKO", "city": "Lucknow", "state": "Uttar Pradesh", "hub_type": "RAILWAY_STATION", "latitude": 26.8317, "longitude": 80.9234},
    {"name": "Kanpur Central", "code": "CNB", "city": "Kanpur", "state": "Uttar Pradesh", "hub_type": "RAILWAY_STATION", "latitude": 26.4542, "longitude": 80.3503},
    {"name": "Gorakhpur Junction", "code": "GKP", "city": "Gorakhpur", "state": "Uttar Pradesh", "hub_type": "RAILWAY_STATION", "latitude": 26.7606, "longitude": 83.3811},
    {"name": "Prayagraj Junction", "code": "PRYJ", "city": "Prayagraj", "state": "Uttar Pradesh", "hub_type": "RAILWAY_STATION", "latitude": 25.4484, "longitude": 81.8333},
    {"name": "Agra Cantt", "code": "AGC", "city": "Agra", "state": "Uttar Pradesh", "hub_type": "RAILWAY_STATION", "latitude": 27.1584, "longitude": 78.0081},
    {"name": "VGL Jhansi Junction", "code": "JHS", "city": "Jhansi", "state": "Uttar Pradesh", "hub_type": "RAILWAY_STATION", "latitude": 25.4484, "longitude": 78.5685},
    {"name": "Bareilly Junction", "code": "BE", "city": "Bareilly", "state": "Uttar Pradesh", "hub_type": "RAILWAY_STATION", "latitude": 28.3411, "longitude": 79.4180},
    {"name": "Moradabad Junction", "code": "MB", "city": "Moradabad", "state": "Uttar Pradesh", "hub_type": "RAILWAY_STATION", "latitude": 28.8386, "longitude": 78.7733},
    # Bus Terminals
    {"name": "Alambagh ISBT Lucknow", "code": "LKO-ISBT", "city": "Lucknow", "state": "Uttar Pradesh", "hub_type": "BUS_TERMINAL", "latitude": 26.8180, "longitude": 80.9020},
    {"name": "Varanasi Cantt Bus Station", "code": "VNS-ISBT", "city": "Varanasi", "state": "Uttar Pradesh", "hub_type": "BUS_TERMINAL", "latitude": 25.3260, "longitude": 82.9850},
    {"name": "Kanpur Jhakarkati Bus Terminal", "code": "CNB-ISBT", "city": "Kanpur", "state": "Uttar Pradesh", "hub_type": "BUS_TERMINAL", "latitude": 26.4480, "longitude": 80.3420},
    {"name": "Gorakhpur Main Bus Stand", "code": "GKP-BS", "city": "Gorakhpur", "state": "Uttar Pradesh", "hub_type": "BUS_TERMINAL", "latitude": 26.7580, "longitude": 83.3760},
    {"name": "Civil Lines Bus Station Prayagraj", "code": "PRYJ-BS", "city": "Prayagraj", "state": "Uttar Pradesh", "hub_type": "BUS_TERMINAL", "latitude": 25.4520, "longitude": 81.8360},

    # ---------------------------------------------------------------------
    # UTTARAKHAND & HILL REGION
    # ---------------------------------------------------------------------
    # Airports
    {"name": "Dehradun Jolly Grant Airport", "code": "DED", "city": "Dehradun", "state": "Uttarakhand", "hub_type": "AIRPORT", "latitude": 30.1897, "longitude": 78.1803},
    {"name": "Pantnagar Airport", "code": "PGH", "city": "Pantnagar", "state": "Uttarakhand", "hub_type": "AIRPORT", "latitude": 29.0333, "longitude": 79.4739},
    {"name": "Pithoragarh Naini Saini Airport", "code": "NNS", "city": "Pithoragarh", "state": "Uttarakhand", "hub_type": "AIRPORT", "latitude": 29.5964, "longitude": 80.2444},
    # Railway Stations
    {"name": "Haridwar Junction", "code": "HW", "city": "Haridwar", "state": "Uttarakhand", "hub_type": "RAILWAY_STATION", "latitude": 29.9463, "longitude": 78.1565},
    {"name": "Dehradun Railway Station", "code": "DDN", "city": "Dehradun", "state": "Uttarakhand", "hub_type": "RAILWAY_STATION", "latitude": 30.3180, "longitude": 78.0322},
    {"name": "Rishikesh Yog Nagari", "code": "YNRK", "city": "Rishikesh", "state": "Uttarakhand", "hub_type": "RAILWAY_STATION", "latitude": 30.0869, "longitude": 78.2882},
    {"name": "Kathgodam Railway Station", "code": "KGM", "city": "Kathgodam", "state": "Uttarakhand", "hub_type": "RAILWAY_STATION", "latitude": 29.2730, "longitude": 79.5440},
    {"name": "Tanakpur Railway Station", "code": "TPU", "city": "Tanakpur", "state": "Uttarakhand", "hub_type": "RAILWAY_STATION", "latitude": 29.0734, "longitude": 80.1118},
    # Bus Terminals
    {"name": "Dehradun ISBT", "code": "DDN-ISBT", "city": "Dehradun", "state": "Uttarakhand", "hub_type": "BUS_TERMINAL", "latitude": 30.2858, "longitude": 77.9984},
    {"name": "Haridwar ISBT", "code": "HW-ISBT", "city": "Haridwar", "state": "Uttarakhand", "hub_type": "BUS_TERMINAL", "latitude": 29.9360, "longitude": 78.1432},
    {"name": "Rishikesh ISBT Bus Stand", "code": "RKSH-ISBT", "city": "Rishikesh", "state": "Uttarakhand", "hub_type": "BUS_TERMINAL", "latitude": 30.0869, "longitude": 78.2882},
    {"name": "Haldwani ISBT Bus Terminal", "code": "HLD-ISBT", "city": "Haldwani", "state": "Uttarakhand", "hub_type": "BUS_TERMINAL", "latitude": 29.2183, "longitude": 79.5130},
    {"name": "Tanakpur Main Bus Stand", "code": "TPU-ISBT", "city": "Tanakpur", "state": "Uttarakhand", "hub_type": "BUS_TERMINAL", "latitude": 29.0734, "longitude": 80.1118},
    {"name": "Pithoragarh Main ISBT", "code": "PTH-ISBT", "city": "Pithoragarh", "state": "Uttarakhand", "hub_type": "BUS_TERMINAL", "latitude": 29.5828, "longitude": 80.2182},

    # ---------------------------------------------------------------------
    # WEST BENGAL & NORTH-EAST
    # ---------------------------------------------------------------------
    # Airports
    {"name": "Netaji Subhash Chandra Bose International Airport", "code": "CCU", "city": "Kolkata", "state": "West Bengal", "hub_type": "AIRPORT", "latitude": 22.6547, "longitude": 88.4467},
    {"name": "Bagdogra International Airport", "code": "IXB", "city": "Siliguri", "state": "West Bengal", "hub_type": "AIRPORT", "latitude": 26.6812, "longitude": 88.3286},
    {"name": "Lokpriya Gopinath Bordoloi International Airport", "code": "GAU", "city": "Guwahati", "state": "Assam", "hub_type": "AIRPORT", "latitude": 26.1061, "longitude": 91.5859},
    # Railway Stations
    {"name": "Howrah Junction", "code": "HWH", "city": "Kolkata", "state": "West Bengal", "hub_type": "RAILWAY_STATION", "latitude": 22.5839, "longitude": 88.3428},
    {"name": "Sealdah Railway Station", "code": "SDAH", "city": "Kolkata", "state": "West Bengal", "hub_type": "RAILWAY_STATION", "latitude": 22.5697, "longitude": 88.3712},
    {"name": "Kolkata Railway Station", "code": "KOAA", "city": "Kolkata", "state": "West Bengal", "hub_type": "RAILWAY_STATION", "latitude": 22.6047, "longitude": 88.3775},
    {"name": "New Jalpaiguri Junction", "code": "NJP", "city": "Siliguri", "state": "West Bengal", "hub_type": "RAILWAY_STATION", "latitude": 26.6853, "longitude": 88.4431},
    {"name": "Asansol Junction", "code": "ASN", "city": "Asansol", "state": "West Bengal", "hub_type": "RAILWAY_STATION", "latitude": 23.6872, "longitude": 86.9746},
    {"name": "Guwahati Railway Station", "code": "GHY", "city": "Guwahati", "state": "Assam", "hub_type": "RAILWAY_STATION", "latitude": 26.1822, "longitude": 91.7517},
    # Bus Terminals
    {"name": "Esplanade Central Bus Terminus", "code": "CCU-ESP", "city": "Kolkata", "state": "West Bengal", "hub_type": "BUS_TERMINAL", "latitude": 22.5645, "longitude": 88.3512},
    {"name": "Siliguri Junction Bus Stand", "code": "IXB-BS", "city": "Siliguri", "state": "West Bengal", "hub_type": "BUS_TERMINAL", "latitude": 26.7210, "longitude": 88.4230},
    {"name": "ISBT Betkuchi Guwahati", "code": "GAU-ISBT", "city": "Guwahati", "state": "Assam", "hub_type": "BUS_TERMINAL", "latitude": 26.1150, "longitude": 91.7340},

    # ---------------------------------------------------------------------
    # GUJARAT & RAJASTHAN
    # ---------------------------------------------------------------------
    # Airports
    {"name": "Sardar Vallabhbhai Patel International Airport", "code": "AMD", "city": "Ahmedabad", "state": "Gujarat", "hub_type": "AIRPORT", "latitude": 23.0772, "longitude": 72.6347},
    {"name": "Surat International Airport", "code": "STV", "city": "Surat", "state": "Gujarat", "hub_type": "AIRPORT", "latitude": 21.1141, "longitude": 72.7417},
    {"name": "Vadodara Airport", "code": "BDQ", "city": "Vadodara", "state": "Gujarat", "hub_type": "AIRPORT", "latitude": 22.3361, "longitude": 73.2264},
    {"name": "Jaipur International Airport", "code": "JAI", "city": "Jaipur", "state": "Rajasthan", "hub_type": "AIRPORT", "latitude": 26.8242, "longitude": 75.8122},
    {"name": "Jodhpur Airport", "code": "JDH", "city": "Jodhpur", "state": "Rajasthan", "hub_type": "AIRPORT", "latitude": 26.2511, "longitude": 73.0489},
    {"name": "Maharana Pratap Airport", "code": "UDR", "city": "Udaipur", "state": "Rajasthan", "hub_type": "AIRPORT", "latitude": 24.6178, "longitude": 73.8961},
    # Railway Stations
    {"name": "Ahmedabad Junction", "code": "ADI", "city": "Ahmedabad", "state": "Gujarat", "hub_type": "RAILWAY_STATION", "latitude": 23.0234, "longitude": 72.6011},
    {"name": "Surat Railway Station", "code": "ST", "city": "Surat", "state": "Gujarat", "hub_type": "RAILWAY_STATION", "latitude": 21.2045, "longitude": 72.8407},
    {"name": "Vadodara Junction", "code": "BRC", "city": "Vadodara", "state": "Gujarat", "hub_type": "RAILWAY_STATION", "latitude": 22.3108, "longitude": 73.1812},
    {"name": "Jaipur Junction", "code": "JP", "city": "Jaipur", "state": "Rajasthan", "hub_type": "RAILWAY_STATION", "latitude": 26.9200, "longitude": 75.7878},
    {"name": "Jodhpur Junction", "code": "JU", "city": "Jodhpur", "state": "Rajasthan", "hub_type": "RAILWAY_STATION", "latitude": 26.2845, "longitude": 73.0180},
    {"name": "Kota Junction", "code": "KOTA", "city": "Kota", "state": "Rajasthan", "hub_type": "RAILWAY_STATION", "latitude": 25.2138, "longitude": 75.8648},
    # Bus Terminals
    {"name": "Geeta Mandir Central Bus Terminus", "code": "AMD-GM", "city": "Ahmedabad", "state": "Gujarat", "hub_type": "BUS_TERMINAL", "latitude": 23.0140, "longitude": 72.5920},
    {"name": "Surat Central Bus Station", "code": "ST-CS", "city": "Surat", "state": "Gujarat", "hub_type": "BUS_TERMINAL", "latitude": 21.2020, "longitude": 72.8390},
    {"name": "Sindhi Camp Central Bus Stand", "code": "JAI-SC", "city": "Jaipur", "state": "Rajasthan", "hub_type": "BUS_TERMINAL", "latitude": 26.9230, "longitude": 75.7980},

    # ---------------------------------------------------------------------
    # SOUTH INDIA (KARNATAKA, TELANGANA, TAMIL NADU, KERALA, AP)
    # ---------------------------------------------------------------------
    # Airports
    {"name": "Kempegowda International Airport", "code": "BLR", "city": "Bengaluru", "state": "Karnataka", "hub_type": "AIRPORT", "latitude": 13.1986, "longitude": 77.7066},
    {"name": "Rajiv Gandhi International Airport", "code": "HYD", "city": "Hyderabad", "state": "Telangana", "hub_type": "AIRPORT", "latitude": 17.2403, "longitude": 78.4294},
    {"name": "Chennai International Airport", "code": "MAA", "city": "Chennai", "state": "Tamil Nadu", "hub_type": "AIRPORT", "latitude": 12.9941, "longitude": 80.1709},
    {"name": "Cochin International Airport", "code": "COK", "city": "Kochi", "state": "Kerala", "hub_type": "AIRPORT", "latitude": 10.1520, "longitude": 76.3920},
    {"name": "Visakhapatnam International Airport", "code": "VTZ", "city": "Visakhapatnam", "state": "Andhra Pradesh", "hub_type": "AIRPORT", "latitude": 17.7211, "longitude": 83.2244},
    # Railway Stations
    {"name": "KSR Bengaluru City Railway Station", "code": "SBC", "city": "Bengaluru", "state": "Karnataka", "hub_type": "RAILWAY_STATION", "latitude": 12.9781, "longitude": 77.5694},
    {"name": "Yesvantpur Junction", "code": "YPR", "city": "Bengaluru", "state": "Karnataka", "hub_type": "RAILWAY_STATION", "latitude": 13.0238, "longitude": 77.5503},
    {"name": "Secunderabad Junction", "code": "SC", "city": "Hyderabad", "state": "Telangana", "hub_type": "RAILWAY_STATION", "latitude": 17.4344, "longitude": 78.5018},
    {"name": "MGR Chennai Central", "code": "MAS", "city": "Chennai", "state": "Tamil Nadu", "hub_type": "RAILWAY_STATION", "latitude": 13.0827, "longitude": 80.2755},
    {"name": "Ernakulam Junction", "code": "ERS", "city": "Kochi", "state": "Kerala", "hub_type": "RAILWAY_STATION", "latitude": 9.9678, "longitude": 76.2917},
    # Bus Terminals
    {"name": "Kempegowda Majestic Bus Terminal", "code": "BLR-KSR", "city": "Bengaluru", "state": "Karnataka", "hub_type": "BUS_TERMINAL", "latitude": 12.9770, "longitude": 77.5710},
    {"name": "MGBS Mahatma Gandhi Bus Station", "code": "HYD-MGBS", "city": "Hyderabad", "state": "Telangana", "hub_type": "BUS_TERMINAL", "latitude": 17.3780, "longitude": 78.4830},
    {"name": "CMBT Koyambedu Bus Terminus", "code": "MAA-CMBT", "city": "Chennai", "state": "Tamil Nadu", "hub_type": "BUS_TERMINAL", "latitude": 13.0680, "longitude": 80.2050},
]


# =========================================================================
# ALL-INDIA LOCALITY & DISTRICT COORDINATES (Expanded Coverage)
# =========================================================================
KNOWN_LOCALITY_COORDINATES: dict[str, tuple[float, float]] = {
    # Bihar Districts & Cities
    "darbhanga": (26.1542, 85.8918),
    "patna": (25.5941, 85.1376),
    "muzaffarpur": (26.1209, 85.3647),
    "gaya": (24.7955, 85.0002),
    "bhagalpur": (25.2425, 86.9842),
    "samastipur": (25.8560, 85.7868),
    "purnia": (25.7771, 87.4753),
    "begusarai": (25.4182, 86.1272),
    "katihar": (25.5414, 87.5719),
    "munger": (25.3757, 86.4744),
    "saharsa": (25.8835, 86.6006),
    "chhapra": (25.7811, 84.7543),
    "motihari": (26.6470, 84.9089),
    "bettiah": (26.8024, 84.5028),
    "sasaram": (24.9528, 84.0315),
    "arrah": (25.5541, 84.6667),
    "buxar": (25.5647, 83.9777),
    "madhubani": (26.3533, 86.0718),
    "sitamarhi": (26.5976, 85.4897),
    "kishanganj": (26.0768, 87.9429),

    # Jharkhand
    "ranchi": (23.3441, 85.3096),
    "jamshedpur": (22.8046, 86.2029),
    "tatanagar": (22.7683, 86.2011),
    "dhanbad": (23.7957, 86.4304),
    "bokaro": (23.6693, 86.1511),
    "deoghar": (24.4826, 86.7001),
    "hazaribagh": (23.9937, 85.3637),

    # Maharashtra MMR, Pune & Suburbs
    "mumbai": (19.0760, 72.8777),
    "navi mumbai": (19.0330, 73.0297),
    "vashi": (19.0771, 72.9986),
    "nerul": (19.0330, 73.0180),
    "belapur": (19.0180, 73.0400),
    "kharghar": (19.0473, 73.0699),
    "panvel": (18.9894, 73.1207),
    "thane": (19.2183, 72.9781),
    "kalyan": (19.2403, 73.1305),
    "dombivli": (19.2184, 73.0867),
    "borivali": (19.2290, 72.8570),
    "andheri": (19.1136, 72.8697),
    "bandra": (19.0596, 72.8295),
    "dadar": (19.0178, 72.8478),
    "kurla": (19.0726, 72.8845),
    "pune": (18.5204, 73.8567),
    "hadapsar": (18.5089, 73.9259),
    "mahalunge": (18.5670, 73.7430),
    "hinjewadi": (18.5913, 73.7389),
    "wakad": (18.5987, 73.7628),
    "baner": (18.5590, 73.7868),
    "kothrud": (18.5074, 73.8077),
    "swargate": (18.5018, 73.8586),
    "viman nagar": (18.5679, 73.9143),
    "magarpatta": (18.5158, 73.9272),
    "kharadi": (18.5514, 73.9350),
    "pimpri": (18.6298, 73.7997),
    "chinchwad": (18.6279, 73.7831),
    "nagpur": (21.1458, 79.0882),
    "nashik": (19.9975, 73.7898),
    "aurangabad": (19.8762, 75.3433),
    "chhatrapati sambhajinagar": (19.8762, 75.3433),
    "kolhapur": (16.7050, 74.2433),
    "solapur": (17.6599, 75.9064),

    # Goa
    "goa": (15.2993, 74.1240),
    "panaji": (15.4909, 73.8278),
    "madgaon": (15.2832, 73.9862),
    "margao": (15.2832, 73.9862),
    "vasco": (15.3982, 73.8113),
    "mapusa": (15.5937, 73.8142),
    "calangute": (15.5439, 73.7553),
    "baga": (15.5553, 73.7517),
    "candolim": (15.5173, 73.7629),
    "anjuna": (15.5841, 73.7437),
    "colva": (15.2789, 73.9144),

    # Delhi NCR
    "delhi": (28.6139, 77.2090),
    "new delhi": (28.6139, 77.2090),
    "noida": (28.5355, 77.3910),
    "gurugram": (28.4595, 77.0266),
    "gurgaon": (28.4595, 77.0266),
    "ghaziabad": (28.6692, 77.4538),
    "faridabad": (28.4089, 77.3178),

    # Uttar Pradesh
    "lucknow": (26.8467, 80.9462),
    "kanpur": (26.4499, 80.3319),
    "varanasi": (25.3176, 82.9739),
    "prayagraj": (25.4358, 81.8463),
    "allahabad": (25.4358, 81.8463),
    "agra": (27.1767, 78.0081),
    "gorakhpur": (26.7606, 83.3732),
    "ayodhya": (26.7922, 82.1998),
    "bareilly": (28.3670, 79.4304),
    "aligarh": (27.8974, 78.0880),
    "moradabad": (28.8350, 78.7760),
    "meerut": (28.9845, 77.7064),
    "mathura": (27.4924, 77.6737),
    "jhansi": (25.4484, 78.5685),

    # Uttarakhand
    "dehradun": (30.3165, 78.0322),
    "haridwar": (29.9463, 78.1565),
    "rishikesh": (30.0869, 78.2882),
    "haldwani": (29.2183, 79.5130),
    "kathgodam": (29.2730, 79.5440),
    "tanakpur": (29.0734, 80.1118),
    "pithoragarh": (29.5828, 80.2182),
    "nainital": (29.3919, 79.4542),
    "almora": (29.5971, 79.6591),
    "pantnagar": (29.0333, 79.4739),

    # West Bengal
    "kolkata": (22.5726, 88.3639),
    "howrah": (22.5958, 88.2636),
    "siliguri": (26.7271, 88.3953),
    "asansol": (23.6739, 86.9524),
    "durgapur": (23.5204, 87.3119),

    # Gujarat & Rajasthan
    "ahmedabad": (23.0225, 72.5714),
    "surat": (21.1702, 72.8311),
    "vadodara": (22.3072, 73.1812),
    "rajkot": (22.3039, 70.8022),
    "jaipur": (26.9124, 75.7873),
    "jodhpur": (26.2389, 73.0243),
    "udaipur": (24.5854, 73.7125),
    "kota": (25.2138, 75.8648),

    # South India
    "bengaluru": (12.9716, 77.5946),
    "bangalore": (12.9716, 77.5946),
    "hyderabad": (17.3850, 78.4867),
    "chennai": (13.0827, 80.2707),
    "kochi": (9.9312, 76.2673),
    "thiruvananthapuram": (8.5241, 76.9366),
    "visakhapatnam": (17.6868, 83.2185),
    "vijayawada": (16.5062, 80.6480),
    "chandigarh": (30.7333, 76.7794),
    "amritsar": (31.6340, 74.8723),
    "guwahati": (26.1445, 91.7362),
    "bhopal": (23.2599, 77.4126),
    "indore": (22.7196, 75.8577),
}


# Primary city to certified IATA airport code
CITY_AIRPORT_CODES: dict[str, str] = {
    # Bihar
    "darbhanga": "DBR",
    "patna": "PAT",
    "gaya": "GAY",
    "muzaffarpur": "DBR",
    "samastipur": "DBR",
    # Jharkhand
    "ranchi": "IXR",
    "jamshedpur": "IXW",
    "tatanagar": "IXW",
    "deoghar": "DGH",
    # Maharashtra
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
    # Goa
    "goa": "GOI",
    "madgaon": "GOI",
    "panaji": "GOI",
    # Delhi NCR
    "delhi": "DEL",
    "new delhi": "DEL",
    "noida": "DEL",
    "gurgaon": "DEL",
    "gurugram": "DEL",
    # UP
    "lucknow": "LKO",
    "varanasi": "VNS",
    "gorakhpur": "GOP",
    "prayagraj": "IXD",
    "ayodhya": "AYJ",
    "kanpur": "KNU",
    "agra": "AGR",
    # Uttarakhand
    "dehradun": "DED",
    "haridwar": "DED",
    "rishikesh": "DED",
    "pantnagar": "PGH",
    "pithoragarh": "NNS",
    # Bengal & NE
    "kolkata": "CCU",
    "siliguri": "IXB",
    "guwahati": "GAU",
    # South
    "bengaluru": "BLR",
    "bangalore": "BLR",
    "hyderabad": "HYD",
    "chennai": "MAA",
    "kochi": "COK",
    "visakhapatnam": "VTZ",
    # Gujarat & Rajasthan
    "ahmedabad": "AMD",
    "surat": "STV",
    "jaipur": "JAI",
    "jodhpur": "JDH",
    "udaipur": "UDR",
    "chandigarh": "IXC",
    "amritsar": "ATQ",
    "bhopal": "BHO",
    "indore": "IDR",
}

# In-memory geocode cache to prevent redundant queries
_GEOCODE_CACHE: dict[str, tuple[float, float]] = {}
_GOOGLE_GEOCODE_CACHE: dict[str, dict] = {}


def geocode_with_google_maps(address: str) -> Optional[dict]:
    """Geocode an address in India using Google Maps Geocoding API with caching."""
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
        req = urllib.request.Request(url, headers={"User-Agent": "SmartTrip/3.0"})
        with urllib.request.urlopen(req, timeout=4.0) as resp:
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
                if "locality" in types:
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


def resolve_city_coordinates(name: str, fallback_lat: float = 0.0, fallback_lon: float = 0.0) -> tuple[float, float]:
    """Resolve ANY arbitrary Indian city, town, locality or district string to genuine GPS coordinates.
    
    Multi-tier strategy:
    0. Google Maps Geocoding API (Primary Live Intelligence)
    1. Check memory cache.
    2. Exact locality dictionary lookup.
    3. Comma-separated token match.
    4. Substring search across all 150+ major Indian localities.
    5. Fallback coordinates if valid and non-dummy.
    6. Live OpenStreetMap Nominatim request with clean query string and timeout.
    7. State-level intelligent regional fallback.
    """
    if not name:
        return fallback_lat, fallback_lon

    clean = name.lower().strip()
    if clean in _GEOCODE_CACHE:
        return _GEOCODE_CACHE[clean]

    # Tier 0: Live Google Maps Geocoding API (Primary Geographic Brain)
    g_res = geocode_with_google_maps(name)
    if g_res:
        coords = (g_res["lat"], g_res["lon"])
        _GEOCODE_CACHE[clean] = coords
        return coords

    # Tier 1: Check comma-separated tokens (highest specificity first)
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

    # Tier 3: If caller provided valid non-default GPS coordinates (not 0.0 and not default dummy)
    if fallback_lat and fallback_lon and 8.0 <= fallback_lat <= 37.0 and 68.0 <= fallback_lon <= 97.0:
        is_rishikesh_dummy = abs(fallback_lat - 30.0869) < 0.01 and "rishikesh" not in clean
        is_delhi_dummy = abs(fallback_lat - 28.6139) < 0.01 and "delhi" not in clean
        if not (is_rishikesh_dummy or is_delhi_dummy):
            _GEOCODE_CACHE[clean] = (fallback_lat, fallback_lon)
            return fallback_lat, fallback_lon

    # Tier 4: Live OpenStreetMap Nominatim request (clean query format)
    try:
        # Strip trailing India to avoid 'City, State, India, India' query bugs
        query_text = name.strip()
        if "india" in query_text.lower():
            # Already has India in the string
            norm_query = query_text
        else:
            norm_query = f"{query_text}, India"

        encoded_query = urllib.parse.quote(norm_query)
        url = f"https://nominatim.openstreetmap.org/search?q={encoded_query}&format=json&limit=1&countrycodes=in"
        req = urllib.request.Request(url, headers={"User-Agent": "SmartTrip-App/3.0"})
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

    # Tier 5: Safe state-level fallbacks across Indian states
    state_fallbacks = [
        ("bihar", (25.5941, 85.1376)),          # Patna
        ("jharkhand", (23.3441, 85.3096)),      # Ranchi
        ("bengal", (22.5726, 88.3639)),         # Kolkata
        ("kolkata", (22.5726, 88.3639)),
        ("uttar pradesh", (26.8467, 80.9462)),  # Lucknow
        ("uttarakhand", (30.3165, 78.0322)),    # Dehradun
        ("kumaon", (29.2730, 79.5440)),         # Kathgodam
        ("maharashtra", (19.0760, 72.8777)),    # Mumbai
        ("mumbai", (19.0760, 72.8777)),
        ("pune", (18.5204, 73.8567)),
        ("goa", (15.2993, 74.1240)),
        ("delhi", (28.6139, 77.2090)),
        ("gujarat", (23.0225, 72.5714)),        # Ahmedabad
        ("rajasthan", (26.9124, 75.7873)),      # Jaipur
        ("karnataka", (12.9716, 77.5946)),      # Bengaluru
        ("tamil nadu", (13.0827, 80.2707)),     # Chennai
        ("telangana", (17.3850, 78.4867)),      # Hyderabad
        ("kerala", (9.9312, 76.2673)),          # Kochi
        ("punjab", (31.6340, 74.8723)),         # Amritsar
        ("haryana", (30.7333, 76.7794)),        # Chandigarh
        ("assam", (26.1445, 91.7362)),          # Guwahati
        ("odisha", (20.2444, 85.8178)),         # Bhubaneswar
        ("madhya pradesh", (23.2599, 77.4126)), # Bhopal
    ]

    for state_name, coords in state_fallbacks:
        if state_name in clean:
            _GEOCODE_CACHE[clean] = coords
            return coords

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
