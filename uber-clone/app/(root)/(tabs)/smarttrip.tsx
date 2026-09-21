import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

export default function SmartTripTabScreen() {
  return (
    <SafeAreaView className="flex-1 bg-neutral-100 p-4">
      <ScrollView className="flex-1">
        <Text className="text-3xl font-JakartaBold mb-2">SmartTrip AI</Text>
        <Text className="text-gray-500 font-Jakarta mb-6">
          Next-generation door-to-door travel assistant & AI companion.
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/(root)/smarttrip/agent")}
          className="bg-primary-500 p-5 rounded-2xl mb-4 shadow-sm flex-row items-center justify-between"
        >
          <View className="flex-1 mr-3">
            <Text className="text-white font-JakartaBold text-xl mb-1">🤖 AI Conversational Agent</Text>
            <Text className="text-white/80 font-Jakarta text-sm">
              Chat naturally to find & book door-to-door trips using Gemini 2.0 Flash.
            </Text>
          </View>
          <Text className="text-white text-2xl font-JakartaBold">→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(root)/smarttrip/search")}
          className="bg-white p-5 rounded-2xl mb-4 border border-neutral-200 shadow-sm flex-row items-center justify-between"
        >
          <View className="flex-1 mr-3">
            <Text className="text-black font-JakartaBold text-xl mb-1">🗺️ Multimodal Search</Text>
            <Text className="text-gray-500 font-Jakarta text-sm">
              Compare feeder shuttles, intercity buses, trains, and flights.
            </Text>
          </View>
          <Text className="text-primary-500 text-2xl font-JakartaBold">→</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
