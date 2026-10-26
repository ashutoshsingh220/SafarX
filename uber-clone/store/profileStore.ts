import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

export type TravelStyle = "ECONOMICAL" | "BALANCED" | "COMFORT_LUXURY" | "FASTEST";
export type TrainClass = "SL" | "3A" | "2A" | "1A";
export type FlightClass = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS";
export type CabPreference = "SHARED" | "PRIVATE_SEDAN" | "SUV";

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  travelStyle: TravelStyle;
  trainClass: TrainClass;
  flightClass: FlightClass;
  cabPreference: CabPreference;
}

interface ProfileStore extends UserProfile {
  isLoaded: boolean;
  setFirstName: (firstName: string) => void;
  setLastName: (lastName: string) => void;
  setEmail: (email: string) => void;
  setPhone: (phone: string) => void;
  setTravelStyle: (travelStyle: TravelStyle) => void;
  setTrainClass: (trainClass: TrainClass) => void;
  setFlightClass: (flightClass: FlightClass) => void;
  setCabPreference: (cabPreference: CabPreference) => void;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  loadProfile: () => Promise<void>;
}

const STORAGE_KEY = "safarx_user_profile_data_v1";

const DEFAULT_PROFILE: UserProfile = {
  firstName: "Ashutosh",
  lastName: "Singh",
  email: "ashutosh.singh@safarx.app",
  phone: "+91 98765 43210",
  travelStyle: "BALANCED",
  trainClass: "3A",
  flightClass: "ECONOMY",
  cabPreference: "PRIVATE_SEDAN",
};

export const useProfileStore = create<ProfileStore>((set, get) => ({
  ...DEFAULT_PROFILE,
  isLoaded: false,

  setFirstName: (firstName: string) => set({ firstName }),
  setLastName: (lastName: string) => set({ lastName }),
  setEmail: (email: string) => set({ email }),
  setPhone: (phone: string) => set({ phone }),
  setTravelStyle: (travelStyle: TravelStyle) => set({ travelStyle }),
  setTrainClass: (trainClass: TrainClass) => set({ trainClass }),
  setFlightClass: (flightClass: FlightClass) => set({ flightClass }),
  setCabPreference: (cabPreference: CabPreference) => set({ cabPreference }),

  updateProfile: async (updated: Partial<UserProfile>) => {
    set((state) => ({ ...state, ...updated }));
    try {
      const current = get();
      const dataToSave: UserProfile = {
        firstName: current.firstName,
        lastName: current.lastName,
        email: current.email,
        phone: current.phone,
        travelStyle: current.travelStyle,
        trainClass: current.trainClass,
        flightClass: current.flightClass,
        cabPreference: current.cabPreference,
      };
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (err) {
      console.warn("Failed to persist user profile to SecureStore:", err);
    }
  },

  loadProfile: async () => {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<UserProfile>;
        set({
          firstName: parsed.firstName || DEFAULT_PROFILE.firstName,
          lastName: parsed.lastName || DEFAULT_PROFILE.lastName,
          email: parsed.email || DEFAULT_PROFILE.email,
          phone: parsed.phone || DEFAULT_PROFILE.phone,
          travelStyle: parsed.travelStyle || DEFAULT_PROFILE.travelStyle,
          trainClass: parsed.trainClass || DEFAULT_PROFILE.trainClass,
          flightClass: parsed.flightClass || DEFAULT_PROFILE.flightClass,
          cabPreference: parsed.cabPreference || DEFAULT_PROFILE.cabPreference,
          isLoaded: true,
        });
        return;
      }
    } catch (err) {
      console.warn("Error reading profile from SecureStore:", err);
    }
    set({ isLoaded: true });
  },
}));
