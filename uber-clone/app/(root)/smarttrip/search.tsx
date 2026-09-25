import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSmartTripStore } from "../../../src/features/smarttrip/store/smartTripStore";
import {
  fetchCorridorInventory,
  stitchDoorToDoorPlan,
} from "../../../src/features/smarttrip/lib/api";
import { GooglePlacesAutocompleteInput } from "../../../src/features/smarttrip/components/GooglePlacesAutocompleteInput";
import { DatePickerModal } from "../../../src/features/smarttrip/components/DatePickerModal";
import { router, useLocalSearchParams } from "expo-router";
import {
  CorridorInventory,
  TrainInventoryItem,
  BusInventoryItem,
  FlightInventoryItem,
  DirectCabInventoryItem,
  TransitClassOption,
} from "../../../src/features/smarttrip/types/smarttrip";

const QUICK_DATES = [
  { label: "Today", date: "25-Sep-2026" },
  { label: "Tomorrow", date: "26-Sep-2026" },
  { label: "Thu, 15 Oct", date: "15-Oct-2026" },
  { label: "Mon, 05 Oct (Tejas/Rajdhani)", date: "05-Oct-2026" },
  { label: "Wed, 07 Oct", date: "07-Oct-2026" },
];

export default function TravelSearchScreen() {
  const { setSelectedPlan } = useSmartTripStore();
  const params = useLocalSearchParams<{ origin?: string; destination?: string; date?: string }>();

  const [origin, setOrigin] = useState(params.origin ? String(params.origin) : "");
  const [destination, setDestination] = useState(params.destination ? String(params.destination) : "");
  const [originCoords, setOriginCoords] = useState<{ lat?: number; lon?: number }>({});
  const [destinationCoords, setDestinationCoords] = useState<{ lat?: number; lon?: number }>({});

  const [travelDate, setTravelDate] = useState(params.date ? String(params.date) : "15-Oct-2026");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [feederMode, setFeederMode] = useState<"AUTO" | "CAB">("AUTO");

  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [inventory, setInventory] = useState<CorridorInventory | null>(null);
  const [activeTab, setActiveTab] = useState<"TRAIN" | "BUS" | "FLIGHT" | "DIRECT_CAB">("TRAIN");

  // Selection & Dynamic Stitching State
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);
  const [selectedClassKey, setSelectedClassKey] = useState<string | null>(null);
  const [stitchedPlan, setStitchedPlan] = useState<any | null>(null);
  const [isStitching, setIsStitching] = useState(false);

  // Only auto-search on initial mount if BOTH origin and destination were passed
  useEffect(() => {
    if (origin.trim() && destination.trim()) {
      handleSearch();
    }
  }, []);

  const handleSearch = async (dateOverride?: string, customOrigin?: string, customDest?: string) => {
    const origVal = (customOrigin !== undefined ? customOrigin : origin).trim();
    const destVal = (customDest !== undefined ? customDest : destination).trim();

    if (!origVal || !destVal) {
      setSearchError("Please enter both Starting Point and Destination.");
      return;
    }

    setSearchError(null);
    const chosenDate = dateOverride || travelDate;
    setIsSearching(true);
    setSelectedItemKey(null);
    setSelectedClassKey(null);
    setStitchedPlan(null);

    try {
      const data = await fetchCorridorInventory({
        origin_name: origVal,
        origin_lat: originCoords.lat ?? 0.0,
        origin_lon: originCoords.lon ?? 0.0,
        destination_name: destVal,
        destination_lat: destinationCoords.lat ?? 0.0,
        destination_lon: destinationCoords.lon ?? 0.0,
        travel_date: chosenDate,
      });
      setInventory(data);

      // Auto-select first train 3A class to show instant door-to-door preview
      if (data && data.trains && data.trains.length > 0) {
        const firstTrain = data.trains[0];
        const prefClass = firstTrain.classes?.find((c: any) => c.class_code === "3A") || firstTrain.classes?.[0];
        if (prefClass) {
          handleSelectTrainClass(firstTrain, prefClass, data);
        }
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectTrainClass = async (
    train: TrainInventoryItem,
    cls: TransitClassOption,
    invData?: CorridorInventory
  ) => {
    setSelectedItemKey(train.train_number);
    setSelectedClassKey(cls.class_code);
    setIsStitching(true);

    try {
      const plan = await stitchDoorToDoorPlan({
        origin_name: origin.trim(),
        origin_lat: originCoords.lat ?? 0.0,
        origin_lon: originCoords.lon ?? 0.0,
        destination_name: destination.trim(),
        destination_lat: destinationCoords.lat ?? 0.0,
        destination_lon: destinationCoords.lon ?? 0.0,
        feeder_mode: feederMode,
        selected_mode: "TRAIN",
        selected_item_id: train.train_number,
        selected_item_name: `${train.train_name} (${train.train_number})`,
        selected_class: cls.class_code,
        selected_fare: cls.fare,
        departure_hub_name: train.departure_station,
        arrival_hub_name: train.arrival_station,
      });
      setStitchedPlan(plan);
    } catch (err) {
      console.error("Stitching error:", err);
    } finally {
      setIsStitching(false);
    }
  };

  const handleSelectBus = async (bus: BusInventoryItem, seatType: any) => {
    setSelectedItemKey(bus.bus_id);
    setSelectedClassKey(seatType.type);
    setIsStitching(true);

    try {
      const plan = await stitchDoorToDoorPlan({
        origin_name: origin.trim(),
        origin_lat: originCoords.lat ?? 0.0,
        origin_lon: originCoords.lon ?? 0.0,
        destination_name: destination.trim(),
        destination_lat: destinationCoords.lat ?? 0.0,
        destination_lon: destinationCoords.lon ?? 0.0,
        feeder_mode: feederMode,
        selected_mode: "BUS",
        selected_item_id: bus.bus_id,
        selected_item_name: bus.operator_name,
        selected_class: seatType.type,
        selected_fare: seatType.fare,
        departure_hub_name: bus.boarding_point,
        arrival_hub_name: bus.dropping_point,
      });
      setStitchedPlan(plan);
    } catch (err) {
      console.error("Bus stitching error:", err);
    } finally {
      setIsStitching(false);
    }
  };

  const handleSelectFlight = async (flight: FlightInventoryItem, fareClass: any) => {
    setSelectedItemKey(flight.flight_number);
    setSelectedClassKey(fareClass.class);
    setIsStitching(true);

    try {
      const plan = await stitchDoorToDoorPlan({
        origin_name: origin.trim(),
        origin_lat: originCoords.lat ?? 0.0,
        origin_lon: originCoords.lon ?? 0.0,
        destination_name: destination.trim(),
        destination_lat: destinationCoords.lat ?? 0.0,
        destination_lon: destinationCoords.lon ?? 0.0,
        feeder_mode: feederMode,
        selected_mode: "FLIGHT",
        selected_item_id: flight.flight_number,
        selected_item_name: `${flight.airline} (${flight.flight_number})`,
        selected_class: fareClass.class,
        selected_fare: fareClass.fare,
        departure_hub_name: flight.departure_airport,
        arrival_hub_name: flight.arrival_airport,
      });
      setStitchedPlan(plan);
    } catch (err) {
      console.error("Flight stitching error:", err);
    } finally {
      setIsStitching(false);
    }
  };

  const handleSelectDirectCab = async (cab: DirectCabInventoryItem) => {
    setSelectedItemKey(cab.cab_id);
    setSelectedClassKey(cab.vehicle_type);
    setIsStitching(true);

    try {
      const plan = await stitchDoorToDoorPlan({
        origin_name: origin.trim(),
        origin_lat: originCoords.lat ?? 0.0,
        origin_lon: originCoords.lon ?? 0.0,
        destination_name: destination.trim(),
        destination_lat: destinationCoords.lat ?? 0.0,
        destination_lon: destinationCoords.lon ?? 0.0,
        selected_mode: "DIRECT_CAB",
        selected_item_id: cab.cab_id,
        selected_item_name: cab.operator,
        selected_class: cab.vehicle_type,
        selected_fare: cab.fare,
        departure_hub_name: origin.trim(),
        arrival_hub_name: destination.trim(),
      });
      setStitchedPlan(plan);
    } catch (err) {
      console.error("Cab stitching error:", err);
    } finally {
      setIsStitching(false);
    }
  };


  const handleProceedToBooking = () => {
    if (!stitchedPlan) return;
    setSelectedPlan(stitchedPlan);
    router.push("/(root)/smarttrip/bundle" as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-100" edges={["top"]}>
      {/* Top Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-neutral-200 justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 mr-2.5 bg-neutral-100 rounded-full"
          >
            <Text className="text-base font-JakartaBold">←</Text>
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-JakartaBold text-neutral-900">
              SafarX Multimodal Transit
            </Text>
            <Text className="text-[11px] font-Jakarta text-neutral-500">
              IRCTC Trains • AC Buses • Flights • Outstation Cabs
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => handleSearch()}
          className="p-2 bg-primary-50 rounded-full"
        >
          <Text className="text-primary-500 font-JakartaBold text-xs">🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" keyboardShouldPersistTaps="always">
        {/* Search Parameters Accordion / Block */}
        <View className="bg-white p-4 border-b border-neutral-200 shadow-sm">
          {/* Origin & Destination */}
          <View className="flex-row items-center mb-3">
            <View
              className="items-center mr-3"
              style={{ height: 106, justifyContent: "space-between", paddingVertical: 18 }}
            >
              <View className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-emerald-200" />
              <View className="w-0.5 flex-1 bg-neutral-300 my-1" />
              <View className="w-3.5 h-3.5 rounded-sm bg-neutral-800" />
            </View>

            <View className="flex-1">
              <GooglePlacesAutocompleteInput
                placeholder="Starting Point (e.g. Pune SIT)"
                initialValue={origin}
                icon=""
                zIndex={50}
                containerClassName="relative mb-2.5"
                onSelectPlace={(place) => {
                  setOrigin(place.address);
                  if (place.latitude && place.longitude) {
                    setOriginCoords({ lat: place.latitude, lon: place.longitude });
                  }
                }}
                onChangeText={setOrigin}
              />

              <GooglePlacesAutocompleteInput
                placeholder="Destination (e.g. New Delhi, Ahmedabad)"
                initialValue={destination}
                icon=""
                zIndex={40}
                containerClassName="relative"
                onSelectPlace={(place) => {
                  setDestination(place.address);
                  if (place.latitude && place.longitude) {
                    setDestinationCoords({ lat: place.latitude, lon: place.longitude });
                  }
                }}
                onChangeText={setDestination}
              />
            </View>
          </View>

          {/* Prominent Search Action Button */}
          <TouchableOpacity
            onPress={() => handleSearch()}
            disabled={isSearching}
            className="bg-primary-500 py-3 rounded-xl items-center justify-center mb-2.5 shadow-sm active:bg-primary-600 flex-row"
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white font-JakartaBold text-sm tracking-wide">
                🔍 Search Available Routes
              </Text>
            )}
          </TouchableOpacity>

          {/* Search Validation Message */}
          {searchError && (
            <View className="bg-red-50 border border-red-200 p-2.5 rounded-xl mb-3">
              <Text className="text-xs font-JakartaBold text-red-600 text-center">
                ⚠️ {searchError}
              </Text>
            </View>
          )}

          {/* Travel Date Selector */}
          <View className="mb-3">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-[11px] font-JakartaBold text-neutral-400 uppercase tracking-wider">
                📅 TRAVEL DATE: {travelDate}
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="flex-row items-center bg-primary-50 px-2 py-0.5 rounded-md"
              >
                <Text className="text-xs font-JakartaBold text-primary-600">
                  🗓️ Pick Other Date
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {/* Custom Date Bubble if not in QUICK_DATES */}
              {!QUICK_DATES.some((d) => d.date === travelDate) && (
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="px-3 py-1.5 rounded-full mr-2 border bg-primary-500 border-primary-500 flex-row items-center"
                >
                  <Text className="text-xs font-JakartaBold text-white">
                    🗓️ {travelDate}
                  </Text>
                </TouchableOpacity>
              )}

              {QUICK_DATES.map((item) => (
                <TouchableOpacity
                  key={item.date}
                  onPress={() => {
                    setTravelDate(item.date);
                    handleSearch(item.date);
                  }}
                  className={`px-3 py-1.5 rounded-full mr-2 border ${
                    travelDate === item.date
                      ? "bg-primary-500 border-primary-500"
                      : "bg-neutral-100 border-neutral-200"
                  }`}
                >
                  <Text
                    className={`text-xs font-JakartaMedium ${
                      travelDate === item.date ? "text-white font-JakartaBold" : "text-neutral-700"
                    }`}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="px-3 py-1.5 rounded-full mr-2 border bg-neutral-100 border-dashed border-neutral-300 flex-row items-center"
              >
                <Text className="text-xs font-JakartaBold text-neutral-600">
                  + More Dates 🗓️
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Feeder Mode Preference */}
          <View className="flex-row items-center justify-between pt-2 border-t border-neutral-100">
            <View>
              <Text className="text-[11px] font-JakartaBold text-neutral-400 uppercase">
                FIRST & LAST MILE FEEDER
              </Text>
              <Text className="text-xs text-neutral-600 font-Jakarta">
                {feederMode === "AUTO" ? "🛺 Auto-rickshaw (₹15/km)" : "🚕 AC Cab (₹22/km)"}
              </Text>
            </View>
            <View className="flex-row bg-neutral-100 p-1 rounded-xl border border-neutral-200">
              <TouchableOpacity
                onPress={() => setFeederMode("AUTO")}
                className={`px-3 py-1 rounded-lg ${
                  feederMode === "AUTO" ? "bg-white shadow-sm" : ""
                }`}
              >
                <Text
                  className={`text-xs font-JakartaBold ${
                    feederMode === "AUTO" ? "text-primary-500" : "text-neutral-500"
                  }`}
                >
                  Auto
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFeederMode("CAB")}
                className={`px-3 py-1 rounded-lg ${
                  feederMode === "CAB" ? "bg-white shadow-sm" : ""
                }`}
              >
                <Text
                  className={`text-xs font-JakartaBold ${
                    feederMode === "CAB" ? "text-primary-500" : "text-neutral-500"
                  }`}
                >
                  Cab
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* IRCTC-Style Corridor Banner */}
        {inventory && (
          <View className="bg-gradient-to-r from-orange-500 to-amber-600 bg-amber-600 px-4 py-2.5 flex-row items-center justify-between">
            <View className="flex-1 mr-2">
              <Text className="text-white font-JakartaBold text-xs uppercase" numberOfLines={1}>
                {inventory.corridor_title}
              </Text>
              <Text className="text-amber-100 text-[10px] font-JakartaMedium">
                {inventory.travel_date} [LIVE TIMETABLE]
              </Text>
            </View>
            <View className="flex-row items-center space-x-1.5 shrink-0">
              <View className="bg-white/20 px-2 py-0.5 rounded">
                <Text className="text-white text-[10px] font-JakartaBold">General</Text>
              </View>
            </View>
          </View>
        )}

        {/* 4 Mode Tabs Row */}
        <View className="flex-row bg-white border-b border-neutral-200">
          <TouchableOpacity
            onPress={() => setActiveTab("TRAIN")}
            className={`flex-1 py-3 items-center border-b-2 ${
              activeTab === "TRAIN" ? "border-primary-500 bg-primary-50/20" : "border-transparent"
            }`}
          >
            <Text className="text-lg">🚆</Text>
            <Text
              numberOfLines={1}
              className={`text-xs font-JakartaBold mt-0.5 ${
                activeTab === "TRAIN" ? "text-primary-500" : "text-neutral-600"
              }`}
            >
              Trains ({inventory?.trains?.length || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("BUS")}
            className={`flex-1 py-3 items-center border-b-2 ${
              activeTab === "BUS" ? "border-primary-500 bg-primary-50/20" : "border-transparent"
            }`}
          >
            <Text className="text-lg">🚌</Text>
            <Text
              numberOfLines={1}
              className={`text-xs font-JakartaBold mt-0.5 ${
                activeTab === "BUS" ? "text-primary-500" : "text-neutral-600"
              }`}
            >
              Buses ({inventory?.buses?.length || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("FLIGHT")}
            className={`flex-1 py-3 items-center border-b-2 ${
              activeTab === "FLIGHT" ? "border-primary-500 bg-primary-50/20" : "border-transparent"
            }`}
          >
            <Text className="text-lg">✈️</Text>
            <Text
              numberOfLines={1}
              className={`text-xs font-JakartaBold mt-0.5 ${
                activeTab === "FLIGHT" ? "text-primary-500" : "text-neutral-600"
              }`}
            >
              Flights ({inventory?.flights?.length || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("DIRECT_CAB")}
            className={`flex-1 py-3 items-center border-b-2 ${
              activeTab === "DIRECT_CAB"
                ? "border-primary-500 bg-primary-50/20"
                : "border-transparent"
            }`}
          >
            <Text className="text-lg">🚗</Text>
            <Text
              numberOfLines={1}
              className={`text-xs font-JakartaBold mt-0.5 ${
                activeTab === "DIRECT_CAB" ? "text-primary-500" : "text-neutral-600"
              }`}
            >
              Cabs ({inventory?.cabs?.length || 0})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading Spinner */}
        {isSearching && (
          <View className="p-8 items-center justify-center">
            <ActivityIndicator size="large" color="#0286FF" />
            <Text className="font-JakartaMedium text-sm text-neutral-500 mt-2">
              Querying real-time timetable & seat availability...
            </Text>
          </View>
        )}

        {/* Empty State / Welcome Guide when no search performed yet */}
        {!isSearching && !inventory && (
          <View className="p-5 items-center justify-center mt-2">
            <View className="w-14 h-14 rounded-full bg-primary-50 items-center justify-center mb-3">
              <Text className="text-2xl">🧭</Text>
            </View>
            <Text className="text-base font-JakartaBold text-neutral-800 text-center mb-1">
              Plan Your Intercity & Door-to-Door Trip
            </Text>
            <Text className="text-xs font-Jakarta text-neutral-500 text-center mb-5 leading-5 px-3">
              Enter your starting point & destination, pick your date, and tap &ldquo;Search Available Routes&rdquo; to view real-time IRCTC trains, luxury buses, flights, and direct outstation cabs.
            </Text>

            <View className="w-full bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-sm">
              <Text className="text-[11px] font-JakartaBold text-neutral-600 mb-2 uppercase tracking-wider">
                ⚡ Quick Popular Routes
              </Text>
              <View className="flex-col gap-1.5">
                {[
                  { from: "Pune", to: "Rishikesh", desc: "Train + Mountain Feeder (Connecting)" },
                  { from: "Nagpur", to: "Pithoragarh", desc: "Long-haul Rail + Mountain Highway" },
                  { from: "Pune", to: "New Delhi", desc: "Direct Goa Express / Duronto" },
                  { from: "Mumbai", to: "New Delhi", desc: "Tejas Rajdhani Express (Direct)" },
                ].map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      setOrigin(item.from);
                      setDestination(item.to);
                      handleSearch(travelDate, item.from, item.to);
                    }}
                    className="bg-neutral-50 border border-neutral-200/80 rounded-xl px-3 py-2 flex-row items-center justify-between"
                  >
                    <View className="flex-1 mr-2">
                      <Text className="text-xs font-JakartaBold text-neutral-900">
                        {item.from} ➔ {item.to}
                      </Text>
                      <Text className="text-[10px] font-Jakarta text-neutral-500">
                        {item.desc}
                      </Text>
                    </View>
                    <Text className="text-primary-500 font-JakartaBold text-xs">Search →</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB 1: TRAINS (IRCTC Screen Replica)                              */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === "TRAIN" && !isSearching && inventory && (
          <View className="p-3">
            {/* If no direct trains, render authentic IRCTC notice & smart connecting route banner */}
            {inventory.has_direct_trains === false && (
              <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-3.5 shadow-sm">
                <View className="flex-row items-center mb-1.5">
                  <Text className="text-lg mr-2">⚠️</Text>
                  <Text className="text-sm font-JakartaExtraBold text-amber-900">
                    No Direct Trains on this Corridor
                  </Text>
                </View>
                <Text className="text-xs font-JakartaMedium text-amber-800 leading-4">
                  {inventory.connecting_train_note || "IRCTC reports no direct trains on this route."}
                </Text>

                {inventory.connecting_itinerary && (
                  <View className="mt-3 pt-2.5 border-t border-amber-200/80">
                    <Text className="text-[11px] font-JakartaBold text-amber-900 uppercase tracking-wider mb-1">
                      💡 Smart Connecting Itinerary (Via Delhi):
                    </Text>
                    <Text className="text-xs font-Jakarta text-neutral-800">
                      1️⃣ {inventory.connecting_itinerary.leg1}
                    </Text>
                    <Text className="text-xs font-Jakarta text-neutral-800 mt-1">
                      2️⃣ {inventory.connecting_itinerary.leg2}
                    </Text>
                    <View className="mt-2 bg-white/80 p-2 rounded-lg">
                      <Text className="text-[11px] font-JakartaBold text-emerald-700">
                        ⚡ {inventory.connecting_itinerary.recommendation}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {inventory.trains.map((train) => {
              const isTrainSelected = selectedItemKey === train.train_number;

              return (
                <View
                  key={train.train_number}
                  className={`bg-white rounded-2xl mb-3 border overflow-hidden shadow-sm ${
                    isTrainSelected ? "border-primary-500 ring-2 ring-primary-200" : "border-neutral-200"
                  }`}
                >
                  {/* Purple top accent notch matching IRCTC UI */}
                  <View className="h-1.5 bg-purple-700 w-full" />

                  <View className="p-3.5">
                    {/* Train Title & Number */}
                    <View className="flex-row justify-between items-center mb-2.5">
                      <View className="flex-1 mr-2">
                        <Text className="text-base font-JakartaExtraBold text-neutral-900 tracking-wide" numberOfLines={1} ellipsizeMode="tail">
                          {train.train_name} ({train.train_number})
                        </Text>
                      </View>
                      <Text className="text-xs text-neutral-400 shrink-0">📍 Track</Text>
                    </View>

                    {/* Schedule Row */}
                    <View className="flex-row justify-between items-center mb-3">
                      {/* Departure */}
                      <View className="w-[32%] pr-1">
                        <Text className="text-xl font-JakartaBold text-neutral-900">
                          {train.departure_time}
                        </Text>
                        <Text className="text-xs font-JakartaMedium text-neutral-700 mt-0.5" numberOfLines={1} ellipsizeMode="tail">
                          {train.departure_station}
                        </Text>
                        <Text className="text-[10px] font-Jakarta text-neutral-400 mt-0.5" numberOfLines={1}>
                          {train.departure_date}
                        </Text>
                      </View>

                      {/* Duration & Days */}
                      <View className="items-center flex-1 px-1">
                        <Text className="text-xs font-JakartaMedium text-neutral-500 text-center" numberOfLines={1}>
                          — {train.duration_str} —
                        </Text>
                        <View className="flex-row items-center space-x-1 mt-1">
                          {train.running_days.map((dayLetter, dIdx) => (
                            <Text
                              key={dIdx}
                              className={`text-[11px] font-JakartaBold px-0.5 ${
                                train.active_days[dIdx]
                                  ? "text-neutral-900"
                                  : "text-red-400 line-through"
                              }`}
                            >
                              {dayLetter}
                            </Text>
                          ))}
                        </View>
                      </View>

                      {/* Arrival */}
                      <View className="w-[32%] pl-1 items-end">
                        <Text className="text-xl font-JakartaBold text-neutral-900">
                          {train.arrival_time}
                        </Text>
                        <Text className="text-xs font-JakartaMedium text-neutral-700 mt-0.5 text-right" numberOfLines={1} ellipsizeMode="tail">
                          {train.arrival_station}
                        </Text>
                        <Text className="text-[10px] font-Jakarta text-neutral-400 mt-0.5 text-right" numberOfLines={1}>
                          {train.arrival_date}
                        </Text>
                      </View>
                    </View>

                    {/* Coach Class Chips Row (3A, 2A, 1A, 3E, SL, 2S) */}
                    <View className="pt-2 border-t border-neutral-100">
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {train.classes.map((cls) => {
                          const isClassSelected =
                            isTrainSelected && selectedClassKey === cls.class_code;

                          return (
                            <TouchableOpacity
                              key={cls.class_code}
                              onPress={() => handleSelectTrainClass(train, cls, inventory)}
                              className={`px-3 py-2 rounded-xl mr-2 border min-w-[84px] items-center ${
                                isClassSelected
                                  ? "bg-primary-50 border-primary-500 shadow-sm"
                                  : "bg-neutral-50 border-neutral-200"
                              }`}
                            >
                              <Text
                                className={`text-xs font-JakartaBold ${
                                  isClassSelected ? "text-primary-600" : "text-neutral-800"
                                }`}
                              >
                                {cls.class_code}
                              </Text>

                              <Text
                                className={`text-[10px] font-JakartaBold my-0.5 ${
                                  cls.status.startsWith("AVAILABLE")
                                    ? "text-emerald-600"
                                    : cls.status.startsWith("RAC")
                                    ? "text-amber-600"
                                    : "text-red-600"
                                }`}
                              >
                                {cls.status}
                              </Text>

                              <Text className="text-xs font-JakartaBold text-neutral-900">
                                ₹{cls.fare}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB 2: BUSES                                                      */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === "BUS" && !isSearching && inventory && (
          <View className="p-3">
            {inventory.buses.map((bus) => {
              const isBusSelected = selectedItemKey === bus.bus_id;

              return (
                <View
                  key={bus.bus_id}
                  className={`bg-white rounded-2xl mb-3 p-4 border shadow-sm ${
                    isBusSelected ? "border-primary-500 ring-2 ring-primary-200" : "border-neutral-200"
                  }`}
                >
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-1 mr-2">
                      <Text className="text-base font-JakartaBold text-neutral-900">
                        {bus.operator_name}
                      </Text>
                      <Text className="text-xs text-neutral-500 font-Jakarta">{bus.bus_type}</Text>
                    </View>
                    <View className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <Text className="text-[10px] font-JakartaBold text-emerald-700">
                        {bus.available_seats} Seats Left
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center my-2 py-2 border-y border-neutral-100">
                    <View className="flex-1 pr-1">
                      <Text className="text-lg font-JakartaBold text-neutral-900">{bus.departure_time}</Text>
                      <Text className="text-xs text-neutral-500 font-JakartaMedium" numberOfLines={1} ellipsizeMode="tail">{bus.boarding_point}</Text>
                    </View>
                    <View className="px-2 items-center shrink-0">
                      <Text className="text-xs text-neutral-400 font-Jakarta">⏱️ {bus.duration_str}</Text>
                    </View>
                    <View className="flex-1 pl-1 items-end">
                      <Text className="text-lg font-JakartaBold text-neutral-900">{bus.arrival_time}</Text>
                      <Text className="text-xs text-neutral-500 font-JakartaMedium text-right" numberOfLines={1} ellipsizeMode="tail">{bus.dropping_point}</Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2 mt-1">
                    {bus.seat_types.map((st) => (
                      <TouchableOpacity
                        key={st.type}
                        onPress={() => handleSelectBus(bus, st)}
                        className={`flex-1 p-2 rounded-xl border items-center ${
                          isBusSelected && selectedClassKey === st.type
                            ? "bg-primary-50 border-primary-500"
                            : "bg-neutral-50 border-neutral-200"
                        }`}
                      >
                        <Text className="text-xs font-JakartaBold text-neutral-800">{st.type}</Text>
                        <Text className="text-xs font-JakartaExtraBold text-primary-500 mt-0.5">
                          ₹{st.fare}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB 3: FLIGHTS                                                    */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === "FLIGHT" && !isSearching && inventory && (
          <View className="p-3">
            {/* Flight Fare Tiers Explanation Card */}
            <View className="bg-sky-50 border border-sky-200 rounded-2xl p-3.5 mb-3">
              <Text className="text-xs font-JakartaBold text-sky-900 mb-1">
                ℹ️ Domestic Flight Fare Tiers:
              </Text>
              <Text className="text-[11px] font-Jakarta text-sky-800 leading-4">
                • <Text className="font-JakartaBold">Saver</Text>: Standard economy fare with 15 kg check-in baggage. Most economical for fixed schedules.
              </Text>
              <Text className="text-[11px] font-Jakarta text-sky-800 leading-4 mt-1">
                • <Text className="font-JakartaBold">Flexi Plus</Text>: Premium bundle with free seat selection (including front row / extra legroom) and zero/reduced date change penalty fees.
              </Text>
            </View>

            {inventory.flights.map((flight) => {
              const isFlightSelected = selectedItemKey === flight.flight_number;

              return (
                <View
                  key={flight.flight_number}
                  className={`bg-white rounded-2xl mb-3 p-4 border shadow-sm ${
                    isFlightSelected ? "border-primary-500 ring-2 ring-primary-200" : "border-neutral-200"
                  }`}
                >
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-1 mr-2">
                      <Text className="text-base font-JakartaBold text-neutral-900" numberOfLines={1} ellipsizeMode="tail">
                        {flight.airline} ({flight.flight_number})
                      </Text>
                      <Text className="text-[11px] text-blue-600 font-JakartaBold">
                        ⚡ {flight.duration_str}
                      </Text>
                    </View>
                    <Text className="text-xs font-Jakarta text-neutral-400 shrink-0">Cabin 7kg + Check-in</Text>
                  </View>

                  <View className="flex-row justify-between items-center my-2 py-2 border-y border-neutral-100">
                    <View className="flex-1 pr-1">
                      <Text className="text-lg font-JakartaBold text-neutral-900">{flight.departure_time}</Text>
                      <Text className="text-xs text-neutral-500 font-JakartaMedium" numberOfLines={1} ellipsizeMode="tail">
                        {flight.departure_airport}
                      </Text>
                    </View>
                    <View className="px-2 items-center shrink-0">
                      <Text className="text-xs text-neutral-400">✈️ ➔</Text>
                    </View>
                    <View className="flex-1 pl-1 items-end">
                      <Text className="text-lg font-JakartaBold text-neutral-900">{flight.arrival_time}</Text>
                      <Text className="text-xs text-neutral-500 font-JakartaMedium text-right" numberOfLines={1} ellipsizeMode="tail">
                        {flight.arrival_airport}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2 mt-1">
                    {flight.fare_classes.map((fc) => (
                      <TouchableOpacity
                        key={fc.class}
                        onPress={() => handleSelectFlight(flight, fc)}
                        className={`flex-1 p-2 rounded-xl border items-center ${
                          isFlightSelected && selectedClassKey === fc.class
                            ? "bg-primary-50 border-primary-500"
                            : "bg-neutral-50 border-neutral-200"
                        }`}
                      >
                        <Text className="text-xs font-JakartaBold text-neutral-800">{fc.class}</Text>
                        <Text className="text-xs font-JakartaExtraBold text-primary-500 mt-0.5">
                          ₹{fc.fare}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB 4: DIRECT OUTSTATION CAB (Door-to-Door Single Vehicle)         */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === "DIRECT_CAB" && !isSearching && inventory && (
          <View className="p-3">
            {inventory.cabs.map((cab) => {
              const isCabSelected = selectedItemKey === cab.cab_id;

              return (
                <View
                  key={cab.cab_id}
                  className={`bg-white rounded-2xl mb-3 p-4 border shadow-sm ${
                    isCabSelected ? "border-primary-500 ring-2 ring-primary-200" : "border-neutral-200"
                  }`}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 mr-2">
                      <View className="flex-row items-center space-x-1.5 mb-1">
                        <View className="bg-purple-100 px-2 py-0.5 rounded-full">
                          <Text className="text-[10px] font-JakartaBold text-purple-700">
                            ZERO TRANSFERS
                          </Text>
                        </View>
                        <Text className="text-xs text-neutral-500 font-Jakarta">
                          {cab.distance_km} km
                        </Text>
                      </View>
                      <Text className="text-base font-JakartaBold text-neutral-900">
                        {cab.vehicle_type}
                      </Text>
                      <Text className="text-xs text-neutral-500">{cab.operator}</Text>
                    </View>
                    <Text className="text-xl font-JakartaExtraBold text-primary-500">
                      ₹{cab.fare}
                    </Text>
                  </View>

                  <View className="bg-neutral-50 p-2.5 rounded-xl mb-3 border border-neutral-100">
                    {cab.benefits.map((b, bIdx) => (
                      <Text key={bIdx} className="text-xs text-neutral-700 font-Jakarta py-0.5">
                        ✓ {b}
                      </Text>
                    ))}
                  </View>

                  <TouchableOpacity
                    onPress={() => handleSelectDirectCab(cab)}
                    className="bg-primary-500 py-3 rounded-full items-center"
                  >
                    <Text className="text-white font-JakartaBold text-sm">
                      Select Direct Outstation Cab →
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <View className="h-60" />
      </ScrollView>

      {/* ----------------------------------------------------------------- */}
      {/* DYNAMIC DOOR-TO-DOOR STITCHING FLOATING PANEL                     */}
      {/* ----------------------------------------------------------------- */}
      {stitchedPlan && (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 shadow-2xl rounded-t-3xl">
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-1 mr-2">
              <Text className="text-[10px] font-JakartaBold text-primary-500 uppercase tracking-wider">
                🌟 COMPLETE DOOR-TO-DOOR ITINERARY
              </Text>
              <Text className="text-base font-JakartaBold text-neutral-900" numberOfLines={1}>
                {stitchedPlan.primary_mode === "TRAIN" && "Train + First/Last Mile"}
                {stitchedPlan.primary_mode === "BUS" && "Bus + Feeder Transfer"}
                {stitchedPlan.primary_mode === "FLIGHT" && "Flight + Airport Cabs"}
                {stitchedPlan.primary_mode === "DIRECT_CAB" && "Direct Outstation Cab"}
              </Text>
            </View>
            <View className="items-end shrink-0">
              <Text className="text-2xl font-JakartaExtraBold text-emerald-600">
                ₹{stitchedPlan.total_fare}
              </Text>
              <Text className="text-[10px] font-Jakarta text-neutral-400">Total Bundled Price</Text>
            </View>
          </View>

          {/* 3 Legs Mini Breakdown */}
          {stitchedPlan.legs && stitchedPlan.legs.length > 1 && (
            <View className="bg-neutral-50 p-2.5 rounded-xl mb-3 border border-neutral-200/60">
              <View className="flex-row justify-between items-center py-0.5">
                <Text className="text-xs text-neutral-600 font-Jakarta flex-1 mr-2" numberOfLines={1} ellipsizeMode="tail">
                  1️⃣ Pickup ({stitchedPlan.legs[0].operator})
                </Text>
                <Text className="text-xs font-JakartaBold text-neutral-800 shrink-0">
                  ₹{stitchedPlan.legs[0].fare}
                </Text>
              </View>
              <View className="flex-row justify-between items-center py-0.5">
                <Text className="text-xs text-neutral-600 font-Jakarta flex-1 mr-2" numberOfLines={1} ellipsizeMode="tail">
                  2️⃣ Main ({stitchedPlan.legs[1].operator})
                </Text>
                <Text className="text-xs font-JakartaBold text-primary-600 shrink-0">
                  ₹{stitchedPlan.legs[1].fare}
                </Text>
              </View>
              <View className="flex-row justify-between items-center py-0.5">
                <Text className="text-xs text-neutral-600 font-Jakarta flex-1 mr-2" numberOfLines={1} ellipsizeMode="tail">
                  3️⃣ Dropoff ({stitchedPlan.legs[2].operator})
                </Text>
                <Text className="text-xs font-JakartaBold text-neutral-800 shrink-0">
                  ₹{stitchedPlan.legs[2].fare}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            onPress={handleProceedToBooking}
            className="bg-primary-500 py-3.5 rounded-full items-center shadow-md flex-row justify-center space-x-2"
          >
            {isStitching ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text className="text-white font-JakartaBold text-base">
                  Book Door-to-Door Journey
                </Text>
                <Text className="text-white/90 font-JakartaBold text-base">
                  (₹{stitchedPlan.total_fare}) →
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Interactive Calendar Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        selectedDateStr={travelDate}
        onClose={() => setShowDatePicker(false)}
        onSelectDate={(newDate) => {
          setTravelDate(newDate);
          handleSearch(newDate);
        }}
      />
    </SafeAreaView>
  );
}
