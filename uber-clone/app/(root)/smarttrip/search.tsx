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
    <SafeAreaView className="flex-1 bg-general-500">
      <View className="flex-row items-center p-4 bg-white shadow-sm shadow-neutral-300 z-50">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-JakartaSemiBold">Search Travel</Text>
      </View>

      <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
        <View className="bg-white p-5 rounded-2xl shadow-sm shadow-neutral-300 mb-6 z-40">
          <Text className="font-JakartaSemiBold text-lg mb-4">Where to?</Text>
          
          <GeoapifyTextInput
            placeholder="Origin City (e.g. Mumbai)"
            value={searchForm.origin}
            onChangeText={(text) => setSearchForm({ origin: text })}
            onSelectPlace={(lat, lon) => setSearchForm({ originLat: lat, originLon: lon })}
          />

          <GeoapifyTextInput
            placeholder="Destination City (e.g. Bengaluru)"
            value={searchForm.destination}
            onChangeText={(text) => setSearchForm({ destination: text })}
            onSelectPlace={(lat, lon) => setSearchForm({ destLat: lat, destLon: lon })}
          />

          <TouchableOpacity 
            onPress={handleSearch}
            disabled={isSearching}
            className="bg-primary-500 p-4 rounded-xl items-center mt-2"
          >
            {isSearching ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-JakartaSemiBold text-lg">Search Options</Text>
            )}
          </TouchableOpacity>
        </View>

        {searchResults.length > 0 && (
          <View>
            <Text className="font-JakartaSemiBold text-lg mb-4">Available Options</Text>
            {searchResults.map((item, idx) => (
              <TouchableOpacity 
                key={`${item.mode}-${item.id}-${idx}`}
                onPress={() => handleSelectTransport(item)}
                className="bg-white p-4 rounded-xl shadow-sm shadow-neutral-200 mb-4 border border-neutral-100"
              >
                <View className="flex-row justify-between items-center mb-2">
                  <View className="bg-general-100 px-3 py-1 rounded-full">
                    <Text className="font-Jakarta uppercase text-xs text-primary-500">{item.mode}</Text>
                  </View>
                  <Text className="font-JakartaBold text-lg text-green-600">
                    ₹{item.mode === 'train' ? item.classes?.[0]?.fareInr : item.fareInr}
                  </Text>
                </View>

                <Text className="font-JakartaSemiBold text-base">
                  {item.mode === 'bus' ? item.operator : 
                   item.mode === 'flight' ? item.airline : 
                   item.trainName}
                </Text>

                <View className="flex-row justify-between mt-3">
                  <View>
                    <Text className="font-JakartaBold">{item.departureTime}</Text>
                    <Text className="font-Jakarta text-gray-500 text-xs">
                      {item.mode === 'bus' ? item.originStop.city : 
                       item.mode === 'flight' ? item.originAirport.city : 
                       item.originStation.city}
                    </Text>
                  </View>
                  
                  <View className="items-center justify-center px-4">
                    <Text className="text-gray-400 font-Jakarta text-xs">{item.durationHrs}h</Text>
                    <View className="h-[1px] w-16 bg-gray-300 my-1" />
                  </View>

                  <View className="items-end">
                    <Text className="font-JakartaBold">{item.arrivalTime}</Text>
                    <Text className="font-Jakarta text-gray-500 text-xs">
                      {item.mode === 'bus' ? item.destStop.city : 
                       item.mode === 'flight' ? item.destAirport.city : 
                       item.destStation.city}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {hasSearched && !isSearching && searchResults.length === 0 && (
          <View className="bg-white p-6 rounded-2xl shadow-sm shadow-neutral-200 mb-6 items-center">
            <Text className="text-4xl mb-4">📭</Text>
            <Text className="font-JakartaSemiBold text-lg text-center mb-2">No routes found</Text>
            <Text className="font-Jakarta text-center text-gray-500">
              We currently only support travel between Mumbai and Bengaluru in this demo. Try searching for those cities!
            </Text>
          </View>
        )}
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
