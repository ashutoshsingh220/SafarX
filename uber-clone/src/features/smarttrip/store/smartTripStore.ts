/**
 * SmartTrip Zustand Store
 *
 * Isolated state management for SmartTrip AI features.
 * Does NOT modify the existing useLocationStore or useDriverStore.
 */

import { create } from "zustand";
import type {
  TransportResult,
  BundleQuote,
  AgentMessage,
  SearchFormData,
} from "../types/smarttrip";

interface SmartTripState {
  // Search
  searchForm: SearchFormData;
  searchResults: TransportResult[];
  isSearching: boolean;
  setSearchForm: (form: Partial<SearchFormData>) => void;
  setSearchResults: (results: TransportResult[]) => void;
  setIsSearching: (loading: boolean) => void;

  // Bundle
  selectedTransport: TransportResult | null;
  currentBundle: BundleQuote | null;
  setSelectedTransport: (option: TransportResult | null) => void;
  setCurrentBundle: (bundle: BundleQuote | null) => void;

  // Agent
  agentMessages: AgentMessage[];
  isAgentThinking: boolean;
  addAgentMessage: (message: AgentMessage) => void;
  setAgentMessages: (messages: AgentMessage[]) => void;
  setIsAgentThinking: (thinking: boolean) => void;
  clearAgentMessages: () => void;

  // Reset
  resetAll: () => void;
}

const initialSearchForm: SearchFormData = {
  origin: "",
  destination: "",
  date: new Date().toISOString().split("T")[0],
  passengers: 1,
};

export const useSmartTripStore = create<SmartTripState>((set) => ({
  // Search
  searchForm: { ...initialSearchForm },
  searchResults: [],
  isSearching: false,
  setSearchForm: (form) =>
    set((state) => ({
      searchForm: { ...state.searchForm, ...form },
    })),
  setSearchResults: (results) => set({ searchResults: results }),
  setIsSearching: (loading) => set({ isSearching: loading }),

  // Bundle
  selectedTransport: null,
  currentBundle: null,
  setSelectedTransport: (option) => set({ selectedTransport: option }),
  setCurrentBundle: (bundle) => set({ currentBundle: bundle }),

  // Agent
  agentMessages: [],
  isAgentThinking: false,
  addAgentMessage: (message) =>
    set((state) => ({
      agentMessages: [...state.agentMessages, message],
    })),
  setAgentMessages: (messages) => set({ agentMessages: messages }),
  setIsAgentThinking: (thinking) => set({ isAgentThinking: thinking }),
  clearAgentMessages: () => set({ agentMessages: [] }),

  // Reset
  resetAll: () =>
    set({
      searchForm: { ...initialSearchForm },
      searchResults: [],
      isSearching: false,
      selectedTransport: null,
      currentBundle: null,
      agentMessages: [],
      isAgentThinking: false,
    }),
}));
