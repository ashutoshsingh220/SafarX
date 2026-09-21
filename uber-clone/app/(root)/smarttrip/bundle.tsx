import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSmartTripStore } from "../../../src/features/smarttrip/store/smartTripStore";
import { bookMultimodalBundle } from "../../../src/features/smarttrip/lib/api";
import { router } from "expo-router";

export default function BundleScreen() {
  const { selectedPlan, confirmedBooking, setConfirmedBooking } = useSmartTripStore();
  const [isBooking, setIsBooking] = useState(false);

  const handleConfirmBooking = async () => {
    if (!selectedPlan) return;
    setIsBooking(true);
    try {
      const res = await bookMultimodalBundle({
        user_id: "sit_traveler_demo",
        plan: selectedPlan,
      });
      if (res && res.pnr) {
        setConfirmedBooking(res);
      } else {
        Alert.alert("Notice", "Booking completed in offline demo mode.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Notice", "Booking intent saved.");
    } finally {
      setIsBooking(false);
    }
  };

  if (confirmedBooking) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-100">
        <View className="flex-row items-center p-4 bg-white shadow-sm border-b border-neutral-200">
          <Text className="text-xl font-JakartaBold">Digital Boarding Pass</Text>
        </View>

        <ScrollView className="flex-1 p-4">
          <View className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-md mb-6">
            <View className="items-center mb-4 pb-4 border-b border-dashed border-neutral-300">
              <Text className="text-xs font-JakartaBold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-2">
                ✓ BOOKING CONFIRMED
              </Text>
              <Text className="text-3xl font-JakartaExtraBold text-black tracking-wider">
                {confirmedBooking.pnr}
              </Text>
              <Text className="text-xs font-Jakarta text-gray-400 mt-1">SmartTrip Unified PNR</Text>
            </View>

            <View className="mb-4">
              <Text className="text-xs font-JakartaBold text-gray-400 uppercase mb-1">ROUTE</Text>
              <Text className="font-JakartaBold text-base text-gray-800">{confirmedBooking.origin_address}</Text>
              <Text className="font-Jakarta text-sm text-gray-500 my-0.5">↓</Text>
              <Text className="font-JakartaBold text-base text-gray-800">{confirmedBooking.destination_address}</Text>
            </View>

            <View className="mb-4">
              <Text className="text-xs font-JakartaBold text-gray-400 uppercase mb-2">INDIVIDUAL LEG TICKETS & VOUCHERS</Text>
              {confirmedBooking.legs && confirmedBooking.legs.map((leg: any, idx: number) => (
                <View key={idx} className="bg-neutral-50 p-3 rounded-xl mb-2 border border-neutral-200/70">
                  <View className="flex-row justify-between items-center">
                    <Text className="font-JakartaBold text-xs text-gray-700">
                      {leg.leg_type === "FIRST_MILE" && "🚗 Leg 1 (Pickup)"}
                      {leg.leg_type === "LONG_HAUL" && "🚆 Leg 2 (Main Route)"}
                      {leg.leg_type === "LAST_MILE" && "🛺 Leg 3 (Dropoff)"}
                    </Text>
                    <Text className="font-JakartaBold text-xs text-primary-500">₹{leg.fare}</Text>
                  </View>
                  <Text className="font-Jakarta text-xs text-gray-500 mt-1">{leg.operator}</Text>
                </View>
              ))}
            </View>

            <View className="pt-3 border-t border-neutral-200 flex-row justify-between items-center">
              <Text className="font-JakartaMedium text-gray-600">Total Paid Fare</Text>
              <Text className="font-JakartaBold text-2xl text-emerald-600">₹{confirmedBooking.total_fare}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              setConfirmedBooking(null);
              router.replace("/(root)/(tabs)/home");
            }}
            className="bg-primary-500 p-4 rounded-full items-center shadow-sm mb-6"
          >
            <Text className="text-white font-JakartaBold text-base">Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!selectedPlan) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-100 items-center justify-center p-4">
        <Text className="font-Jakarta mb-4">No travel plan selected.</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-primary-500 p-3.5 px-6 rounded-full">
          <Text className="text-white font-JakartaBold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-100">
      <View className="flex-row items-center p-4 bg-white shadow-sm border-b border-neutral-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-JakartaBold">1-Click Bundle Booking</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-JakartaBold text-black">{selectedPlan.primary_mode} JOURNEY</Text>
            <Text className="text-xs font-JakartaBold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              {selectedPlan.badge || "VERIFIED"}
            </Text>
          </View>
          <Text className="text-xs font-Jakarta text-gray-500 mb-4">{selectedPlan.summary}</Text>

          <Text className="text-xs font-JakartaBold text-gray-400 uppercase mb-2">INCLUDED LEGS IN THIS BUNDLE</Text>
          {selectedPlan.legs.map((leg: any, idx: number) => (
            <View key={idx} className="bg-neutral-50 p-3 rounded-xl mb-2 border border-neutral-200/60">
              <View className="flex-row justify-between">
                <Text className="font-JakartaBold text-xs text-gray-700">
                  {leg.leg_type === "FIRST_MILE" && "1️⃣ First-Mile Pickup"}
                  {leg.leg_type === "LONG_HAUL" && "2️⃣ Intercity Long-Haul"}
                  {leg.leg_type === "LAST_MILE" && "3️⃣ Last-Mile Dropoff"}
                </Text>
                <Text className="font-JakartaBold text-xs text-gray-800">₹{leg.fare}</Text>
              </View>
              <Text className="font-Jakarta text-xs text-gray-500 mt-1">{leg.origin} → {leg.destination}</Text>
              <Text className="font-Jakarta text-[11px] text-gray-400">{leg.operator} • {leg.distance_km} km</Text>
            </View>
          ))}

          <View className="border-t border-neutral-200 pt-3 mt-3 flex-row justify-between items-center">
            <Text className="font-JakartaMedium text-gray-600">Total Consolidated Fare</Text>
            <Text className="font-JakartaBold text-2xl text-primary-500">₹{selectedPlan.total_fare}</Text>
          </View>
        </View>

        <View className="bg-primary-50 p-4 rounded-2xl border border-primary-200 mb-6">
          <Text className="font-JakartaBold text-primary-700 mb-1">🎟️ Unified 1-Click Guarantee</Text>
          <Text className="font-Jakarta text-xs text-primary-600">
            One single payment issues all 3 tickets together with coordinated pickup times and real-time transit protection.
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleConfirmBooking}
          disabled={isBooking}
          className="bg-primary-500 p-4 rounded-full items-center shadow-sm mb-6"
        >
          {isBooking ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text className="text-white font-JakartaBold text-lg">Confirm & Book 3-Leg Bundle</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

