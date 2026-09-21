import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSmartTripStore } from "../../../src/features/smarttrip/store/smartTripStore";
import { router } from "expo-router";

export default function BundleScreen() {
  const { selectedTransport } = useSmartTripStore();

  const handleCheckout = () => {
    Alert.alert("Checkout Success", "Booking intent created! Order details sent to backend.");
  };

  if (!selectedTransport) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-100 items-center justify-center p-4">
        <Text className="font-Jakarta mb-4">No transport selected.</Text>
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
        <Text className="text-xl font-JakartaBold">Journey Pricing & Bundle</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm mb-4">
          <Text className="text-lg font-JakartaBold mb-1">{selectedTransport.title}</Text>
          <Text className="text-sm font-Jakarta text-gray-500 mb-3">{selectedTransport.provider}</Text>
          
          <View className="border-t border-neutral-200 pt-3 mt-2 flex-row justify-between items-center">
            <Text className="font-JakartaMedium text-gray-600">Total Bundle Fare</Text>
            <Text className="font-JakartaBold text-2xl text-primary-500">₹{selectedTransport.price}</Text>
          </View>
        </View>

        <View className="bg-primary-50 p-4 rounded-2xl border border-primary-200 mb-6">
          <Text className="font-JakartaBold text-primary-700 mb-1">✨ S1-S5 Cross-Subsidy Applied</Text>
          <Text className="font-Jakarta text-sm text-primary-600">
            Last-mile feeder ride is cross-subsidized from the intercity bus commission!
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleCheckout}
          className="bg-primary-500 p-4 rounded-full items-center shadow-sm"
        >
          <Text className="text-white font-JakartaBold text-lg">Confirm & Book Journey</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
