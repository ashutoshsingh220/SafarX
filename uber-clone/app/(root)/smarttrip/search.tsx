import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSmartTripStore } from "../../../src/features/smarttrip/store/smartTripStore";
import { planMultimodalJourney } from "../../../src/features/smarttrip/lib/api";
import { router } from "expo-router";

export default function TravelSearchScreen() {
  const { multimodalPlans, setMultimodalPlans, setSelectedPlan } = useSmartTripStore();
  const [origin, setOrigin] = useState("Symbiosis Institute of Technology, Lavale, Pune");
  const [destination, setDestination] = useState("Har Ki Pauri, Haridwar");
  const [feederMode, setFeederMode] = useState<"AUTO" | "CAB">("AUTO");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!origin.trim() || !destination.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      // Default coordinates for SIT Pune and Har Ki Pauri
      const results = await planMultimodalJourney({
        origin_name: origin.trim(),
        origin_lat: 18.5362,
        origin_lon: 73.7297,
        destination_name: destination.trim(),
        destination_lat: 29.9567,
        destination_lon: 78.1700,
        feeder_mode: feederMode,
      });
      setMultimodalPlans(results);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan);
    router.push("/(root)/smarttrip/bundle");
  };

  const getBadgeStyle = (badge?: string) => {
    switch (badge) {
      case "CHEAPEST":
        return { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300", label: "🟢 CHEAPEST" };
      case "FASTEST":
        return { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300", label: "⚡ FASTEST" };
      case "BEST_VALUE":
        return { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300", label: "⚖️ BEST VALUE" };
      case "DIRECT_CAB":
        return { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300", label: "🚗 DIRECT CAB" };
      default:
        return { bg: "bg-neutral-100", text: "text-neutral-700", border: "border-neutral-300", label: badge || "OPTION" };
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-100">
      <View className="flex-row items-center p-4 bg-white shadow-sm border-b border-neutral-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-JakartaBold">Door-to-Door Travel Planner</Text>
          <Text className="text-xs font-Jakarta text-gray-500">First-Mile Feeder + Intercity + Last-Mile</Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
        <View className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200 mb-5">
          <Text className="text-xs font-JakartaBold text-gray-400 uppercase mb-1">ORIGIN (FIRST MILE)</Text>
          <TextInput
            value={origin}
            onChangeText={setOrigin}
            className="bg-neutral-100 p-3 rounded-xl font-JakartaMedium text-sm mb-3 border border-neutral-200"
            placeholder="Enter starting address (e.g. SIT Lavale, Pune)"
          />

          <Text className="text-xs font-JakartaBold text-gray-400 uppercase mb-1">DESTINATION (LAST MILE)</Text>
          <TextInput
            value={destination}
            onChangeText={setDestination}
            className="bg-neutral-100 p-3 rounded-xl font-JakartaMedium text-sm mb-3 border border-neutral-200"
            placeholder="Enter destination (e.g. Har Ki Pauri, Haridwar)"
          />

          <Text className="text-xs font-JakartaBold text-gray-400 uppercase mb-1">PREFERRED FEEDER (LOCAL TRANSFER)</Text>
          <View className="flex-row gap-x-2 mb-4">
            <TouchableOpacity
              onPress={() => setFeederMode("AUTO")}
              className={`flex-1 p-2.5 rounded-xl border items-center ${
                feederMode === "AUTO" ? "bg-primary-50 border-primary-500" : "bg-neutral-100 border-neutral-200"
              }`}
            >
              <Text className={`font-JakartaBold text-xs ${feederMode === "AUTO" ? "text-primary-500" : "text-gray-600"}`}>
                🛺 Auto-rickshaw (₹15/km)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFeederMode("CAB")}
              className={`flex-1 p-2.5 rounded-xl border items-center ${
                feederMode === "CAB" ? "bg-primary-50 border-primary-500" : "bg-neutral-100 border-neutral-200"
              }`}
            >
              <Text className={`font-JakartaBold text-xs ${feederMode === "CAB" ? "text-primary-500" : "text-gray-600"}`}>
                🚕 Cab / Sedan (₹22/km)
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleSearch}
            disabled={isSearching}
            className="bg-primary-500 p-4 rounded-full items-center shadow-sm"
          >
            {isSearching ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-white font-JakartaBold text-base">Compare All Travel Options</Text>
            )}
          </TouchableOpacity>
        </View>

        {hasSearched && (
          <View className="mb-8">
            <Text className="text-lg font-JakartaBold mb-3">Compared Travel Options</Text>
            {multimodalPlans.length === 0 && !isSearching && (
              <Text className="text-gray-500 font-Jakarta">No journeys found. Please check connection.</Text>
            )}

            {multimodalPlans.map((plan: any) => {
              const badgeStyle = getBadgeStyle(plan.badge);
              const totalHours = Math.floor(plan.total_duration_minutes / 60);
              const totalMins = plan.total_duration_minutes % 60;

              return (
                <View
                  key={plan.plan_id}
                  className="bg-white p-4 rounded-2xl mb-4 border border-neutral-200 shadow-sm"
                >
                  <View className="flex-row justify-between items-center mb-2">
                    <View className={`px-2.5 py-1 rounded-full border ${badgeStyle.bg} ${badgeStyle.border}`}>
                      <Text className={`text-xs font-JakartaBold ${badgeStyle.text}`}>{badgeStyle.label}</Text>
                    </View>
                    <Text className="font-JakartaBold text-2xl text-primary-500">₹{plan.total_fare}</Text>
                  </View>

                  <Text className="font-JakartaBold text-base text-black mb-1">
                    {plan.primary_mode === "TRAIN" && "🚆 Train Multimodal Route"}
                    {plan.primary_mode === "FLIGHT" && "✈️ Express Flight Route"}
                    {plan.primary_mode === "BUS" && "🚌 AC Sleeper Bus Route"}
                    {plan.primary_mode === "DIRECT_CAB" && "🚗 Direct Outstation Cab"}
                  </Text>
                  <Text className="font-Jakarta text-xs text-gray-500 mb-3">{plan.summary}</Text>

                  {/* 3 Legs Detailed Breakdown */}
                  {plan.legs && plan.legs.length > 0 && (
                    <View className="bg-neutral-50 p-3 rounded-xl mb-3 border border-neutral-200/60">
                      {plan.legs.map((leg: any, idx: number) => (
                        <View key={idx} className="flex-row items-center justify-between py-1 border-b border-neutral-200/40 last:border-b-0">
                          <View className="flex-1 mr-2">
                            <Text className="text-xs font-JakartaBold text-gray-700">
                              {leg.leg_type === "FIRST_MILE" && "1️⃣ First-Mile: "}
                              {leg.leg_type === "LONG_HAUL" && "2️⃣ Long-Haul: "}
                              {leg.leg_type === "LAST_MILE" && "3️⃣ Last-Mile: "}
                              <Text className="font-JakartaMedium text-gray-500">{leg.origin} → {leg.destination}</Text>
                            </Text>
                            <Text className="text-[11px] font-Jakarta text-gray-400">{leg.operator} • {leg.distance_km} km</Text>
                          </View>
                          <Text className="text-xs font-JakartaBold text-gray-800">₹{leg.fare}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View className="flex-row justify-between items-center pt-2 border-t border-neutral-100">
                    <Text className="text-xs font-Jakarta text-gray-500">
                      ⏱️ Total: {totalHours > 0 ? `${totalHours}h ` : ""}{totalMins}m • {plan.total_distance_km} km
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleSelectPlan(plan)}
                      className="bg-primary-500 px-4 py-2 rounded-full"
                    >
                      <Text className="text-white font-JakartaBold text-xs">Book Bundle →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

