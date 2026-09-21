import { create } from "zustand";
import type {
  TransportResult,
  BundleQuote,
  AgentMessage,
  SearchFormData,
} from "../types/smarttrip";

interface SmartTripState {
  searchForm: SearchFormData;
  searchResults: TransportResult[];
  isSearching: boolean;
  setSearchForm: (form: Partial<SearchFormData>) => void;
  setSearchResults: (results: TransportResult[]) => void;
  setIsSearching: (loading: boolean) => void;

  selectedTransport: TransportResult | null;
  currentBundle: BundleQuote | null;
  setSelectedTransport: (option: TransportResult | null) => void;
  setCurrentBundle: (bundle: BundleQuote | null) => void;

  agentMessages: AgentMessage[];
  isAgentThinking: boolean;
  addAgentMessage: (message: AgentMessage) => void;
  setAgentMessages: (messages: AgentMessage[]) => void;
  setIsAgentThinking: (thinking: boolean) => void;
  clearAgentMessages: () => void;

  resetAll: () => void;
}

const initialSearchForm: SearchFormData = {
  origin: "",
  destination: "",
  date: new Date().toISOString().split("T")[0],
  passengers: 1,
};

export const useSmartTripStore = create<SmartTripState>((set) => ({
  searchForm: { ...initialSearchForm },
  searchResults: [],
  isSearching: false,
  setSearchForm: (form) =>
    set((state) => ({
      searchForm: { ...state.searchForm, ...form },
    })),
  setSearchResults: (results) => set({ searchResults: results }),
  setIsSearching: (loading) => set({ isSearching: loading }),

  selectedTransport: null,
  currentBundle: null,
  setSelectedTransport: (option) => set({ selectedTransport: option }),
  setCurrentBundle: (bundle) => set({ currentBundle: bundle }),

  agentMessages: [],
  isAgentThinking: false,
  addAgentMessage: (message) =>
    set((state) => ({
      agentMessages: [...state.agentMessages, message],
    })),
  setAgentMessages: (messages) => set({ agentMessages: messages }),
  setIsAgentThinking: (thinking) => set({ isAgentThinking: thinking }),
  clearAgentMessages: () => set({ agentMessages: [] }),

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
