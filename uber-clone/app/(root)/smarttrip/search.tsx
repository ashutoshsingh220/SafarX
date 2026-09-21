import React from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GeoapifyTextInput } from "../../../src/features/smarttrip/components/GeoapifyTextInput";
import { useSmartTripStore } from "../../../src/features/smarttrip/store/smartTripStore";
import { searchTransport } from "../../../src/features/smarttrip/lib/api";
import { router } from "expo-router";

export default function TravelSearchScreen() {
  const { searchForm, setSearchForm, searchResults, setSearchResults, isSearching, setIsSearching, setSelectedTransport } = useSmartTripStore();
  const [hasSearched, setHasSearched] = React.useState(false);

  const handleSearch = async () => {
    if (!searchForm.origin || !searchForm.destination) return;
    
    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await searchTransport(searchForm);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectTransport = (item: any) => {
    setSelectedTransport(item);
    router.push("/(root)/smarttrip/bundle");
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-100">
      <View className="flex-row items-center p-4 bg-white shadow-sm border-b border-neutral-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-JakartaBold">Multimodal Travel Search</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200 mb-6">
          <Text className="text-sm font-JakartaMedium text-gray-500 mb-2">ORIGIN</Text>
          <GeoapifyTextInput
            initialLocation={searchForm.origin}
            handlePress={(location) => setSearchForm({ origin: location.address })}
            containerStyle="mb-4"
          />

          <Text className="text-sm font-JakartaMedium text-gray-500 mb-2">DESTINATION</Text>
          <GeoapifyTextInput
            initialLocation={searchForm.destination}
            handlePress={(location) => setSearchForm({ destination: location.address })}
            containerStyle="mb-4"
          />

          <TouchableOpacity
            onPress={handleSearch}
            disabled={isSearching}
            className="bg-primary-500 p-4 rounded-full items-center mt-2 shadow-sm"
          >
            {isSearching ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-white font-JakartaBold text-lg">Search Journeys</Text>
            )}
          </TouchableOpacity>
        </View>

        {hasSearched && (
          <View>
            <Text className="text-lg font-JakartaBold mb-3">Available Journeys</Text>
            {searchResults.length === 0 && !isSearching && (
              <Text className="text-gray-500 font-Jakarta">No journeys found. Try searching Pune to Bangalore.</Text>
            )}
            {searchResults.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleSelectTransport(item)}
                className="bg-white p-4 rounded-2xl mb-3 border border-neutral-200 shadow-sm flex-row items-center justify-between"
              >
                <View className="flex-1 mr-3">
                  <Text className="font-JakartaBold text-base text-black mb-1">{item.title}</Text>
                  <Text className="font-Jakarta text-sm text-gray-500">{item.provider} • {item.duration}</Text>
                </View>
                <View className="items-end">
                  <Text className="font-JakartaBold text-lg text-primary-500">₹{item.price}</Text>
                  <Text className="text-xs text-gray-400 font-Jakarta">Select →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
