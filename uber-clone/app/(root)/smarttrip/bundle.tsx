import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSmartTripStore } from "../../../src/features/smarttrip/store/smartTripStore";
import { router } from "expo-router";

export default function BundleScreen() {
  const { selectedTransport, currentBundle } = useSmartTripStore();

  const handleCheckout = () => {
    Alert.alert("Checkout", "Routing to Stripe Payment Sheet...");
    // Integration with Stripe goes here
  };

  if (!selectedTransport) {
    return (
      <SafeAreaView className="flex-1 bg-general-500 items-center justify-center p-4">
        <Text className="font-Jakarta mb-4">No transport selected.</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-primary-500 p-3 rounded-full">
          <Text className="text-white font-Jakarta">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <View className="flex-row items-center p-4 bg-white shadow-sm shadow-neutral-300">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-JakartaSemiBold">Your Bundle</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Main Transport */}
        <View className="bg-white p-5 rounded-2xl shadow-sm shadow-neutral-200 mb-4 border border-neutral-100">
          <Text className="font-JakartaBold text-lg mb-2 text-primary-500">
            1. Intercity {selectedTransport.mode === 'bus' ? 'Bus' : selectedTransport.mode === 'train' ? 'Train' : 'Flight'}
          </Text>
          <Text className="font-JakartaSemiBold text-base">
            {selectedTransport.mode === 'bus' ? selectedTransport.operator : 
             selectedTransport.mode === 'flight' ? selectedTransport.airline : 
             selectedTransport.trainName}
          </Text>
          <View className="flex-row justify-between mt-2">
            <Text className="font-Jakarta text-gray-600">{selectedTransport.departureTime}</Text>
            <Text className="font-Jakarta text-gray-600">{selectedTransport.arrivalTime}</Text>
          </View>
        </View>

        {/* Last Mile Ride (Mocked for UI visualization, actual engine populates currentBundle) */}
        <View className="bg-white p-5 rounded-2xl shadow-sm shadow-neutral-200 mb-4 border border-neutral-100">
          <Text className="font-JakartaBold text-lg mb-2 text-primary-500">2. Last-Mile Ride</Text>
          <Text className="font-Jakarta">Pickup: Near your location</Text>
          <Text className="font-Jakarta">Drop: Boarding Point</Text>
          <Text className="font-Jakarta text-gray-500 text-xs mt-1">Est. 15 mins</Text>
        </View>

        {/* Pricing Breakdown */}
        <View className="bg-white p-5 rounded-2xl shadow-sm shadow-neutral-200 mb-8 border border-neutral-100">
          <Text className="font-JakartaBold text-lg mb-4">Pricing Breakdown</Text>
          
          <View className="flex-row justify-between mb-2">
            <Text className="font-Jakarta">Base Fare</Text>
            <Text className="font-Jakarta">₹{selectedTransport.mode === 'train' ? selectedTransport.classes?.[0]?.fareInr : selectedTransport.fareInr}</Text>
          </View>
          
          <View className="flex-row justify-between mb-2">
            <Text className="font-Jakarta">Ride Fare</Text>
            <Text className="font-Jakarta">₹150</Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="font-Jakarta text-green-600">Bundle Discount (Cross-Subsidy)</Text>
            <Text className="font-Jakarta text-green-600">- ₹50</Text>
          </View>

          <View className="h-[1px] bg-neutral-200 my-3" />

          <View className="flex-row justify-between items-center">
            <Text className="font-JakartaBold text-xl">Total Door-to-Door</Text>
            <Text className="font-JakartaBold text-xl text-primary-500">
              ₹{((selectedTransport.mode === 'train' ? selectedTransport.classes?.[0]?.fareInr : selectedTransport.fareInr) || 0) + 100}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleCheckout}
          className="bg-primary-500 p-4 rounded-xl items-center shadow-md shadow-neutral-300"
        >
          <Text className="text-white font-JakartaSemiBold text-lg">Proceed to Pay</Text>
        </TouchableOpacity>
        
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
