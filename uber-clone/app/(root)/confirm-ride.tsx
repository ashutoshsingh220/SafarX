import { router } from "expo-router";
import React, { useEffect } from "react";
import { FlatList, Text, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import DriverCard from "@/components/DriverCard";
import RideLayout from "@/components/RideLayout";
import { useDriverStore, useLocationStore, useProfileStore } from "@/store";

const ConfirmRide = () => {
  const { drivers, selectedDriver, setSelectedDriver } = useDriverStore();
  const {
    userLatitude,
    userLongitude,
    destinationLatitude,
    destinationLongitude,
  } = useLocationStore();
  const profileStore = useProfileStore();

  useEffect(() => {
    profileStore.loadProfile();
  }, []);

  // Determine real-time trip distance
  const effectiveUserLat = userLatitude || 18.5412;
  const effectiveUserLon = userLongitude || 73.7275;
  const destLat = destinationLatitude || 18.5412;
  const destLon = destinationLongitude || 73.7275;

  let distanceKm = 15;
  const storeDistance = drivers?.find((d) => d.distance_km)?.distance_km;
  if (storeDistance && storeDistance > 0) {
    distanceKm = storeDistance;
  } else if (destinationLatitude && destinationLongitude) {
    const R = 6371;
    const dLat = ((destLat - effectiveUserLat) * Math.PI) / 180;
    const dLon = ((destLon - effectiveUserLon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((effectiveUserLat * Math.PI) / 180) *
        Math.cos((destLat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distanceKm = Math.round(R * c * 1.25 * 10) / 10;
  }

  // Auto rickshaw rule:
  // - If distance is more than 40 km: no auto rickshaw shown.
  // - If distance is less than or equal to 40 km: UberAuto is shown with ₹18/km rate.
  const isAutoAllowed = distanceKm <= 40;

  let displayDrivers = [...(drivers || [])];

  if (isAutoAllowed) {
    const hasAuto = displayDrivers.some((d) =>
      d.title?.toLowerCase().includes("auto"),
    );
    if (!hasAuto) {
      displayDrivers.push({
        id: 3,
        first_name: "Suresh",
        last_name: "Patil",
        title: "Suresh Patil (UberAuto)",
        profile_image_url:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
        car_image_url: "https://img.icons8.com/color/512/auto-rickshaw.png",
        car_seats: 3,
        rating: 4.78,
        latitude: effectiveUserLat + 0.001,
        longitude: effectiveUserLon - 0.004,
        time: Math.round(10 + distanceKm * 2.2),
        price: Math.round(30 + distanceKm * 18).toLocaleString("en-IN"),
        rate_per_km: 18,
        distance_km: distanceKm,
      });
    }
  } else {
    // Distance > 40 km: remove any auto rickshaw option
    displayDrivers = displayDrivers.filter(
      (d) => !d.title?.toLowerCase().includes("auto"),
    );
  }

  // Ensure all drivers have updated real-time distance-based pricing
  displayDrivers = displayDrivers.map((driver) => {
    let perKm = 22;
    let baseFare = 50;
    if (driver.title?.toLowerCase().includes("premier")) {
      perKm = 30;
      baseFare = 100;
    } else if (driver.title?.toLowerCase().includes("auto")) {
      perKm = 18;
      baseFare = 30;
    }
    const realTimePrice = Math.round(baseFare + distanceKm * perKm).toLocaleString("en-IN");
    return {
      ...driver,
      price: realTimePrice,
      rate_per_km: perKm,
      distance_km: distanceKm,
    };
  });

  // Calculate recommendation based on user's profile preferences
  const getRecommendation = (driver: any) => {
    const title = (driver.title || "").toLowerCase();
    const isPremier = title.includes("premier");
    const isAuto = title.includes("auto");
    const isUberGo = !isPremier && !isAuto;

    if (profileStore.travelStyle === "COMFORT_LUXURY") {
      if (isPremier) {
        return {
          isRecommended: true,
          reason: "Matches your Luxury profile (Executive Sedan & maximum comfort)",
        };
      }
    } else if (profileStore.travelStyle === "ECONOMICAL" || profileStore.cabPreference === "SHARED") {
      if (isAutoAllowed && isAuto) {
        return {
          isRecommended: true,
          reason: "Matches your Economical profile (Lowest fare @ ₹18/km)",
        };
      } else if (isUberGo) {
        return {
          isRecommended: true,
          reason: "Matches your Economical profile (Budget Sedan @ ₹22/km)",
        };
      }
    } else {
      // BALANCED or FASTEST
      if (isUberGo) {
        return {
          isRecommended: true,
          reason: "Matches your Balanced Value profile (Optimal price & speed)",
        };
      }
    }

    return { isRecommended: false, reason: "" };
  };

  useEffect(() => {
    if (displayDrivers && displayDrivers.length > 0) {
      // Find recommended driver
      const recommended = displayDrivers.find((d) => getRecommendation(d).isRecommended);
      const exists = displayDrivers.some((d) => d.id === selectedDriver);
      if (!selectedDriver || !exists) {
        setSelectedDriver(recommended ? recommended.id : displayDrivers[0].id);
      }
    }
  }, [displayDrivers, selectedDriver, profileStore.travelStyle, profileStore.cabPreference]);

  const handleSelectRide = () => {
    if (
      (!selectedDriver ||
        !displayDrivers?.some((d) => d.id === selectedDriver)) &&
      displayDrivers &&
      displayDrivers.length > 0
    ) {
      const recommended = displayDrivers.find((d) => getRecommendation(d).isRecommended);
      setSelectedDriver(recommended ? recommended.id : displayDrivers[0].id);
    }
    router.push("/(root)/book-ride");
  };

  return (
    <RideLayout title={"Choose a Rider"} snapPoints={["65%", "85%"]}>
      <FlatList
        data={displayDrivers}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={() => (
          <View className="bg-primary-50 border border-primary-200/80 rounded-2xl p-3 mb-3 mx-1">
            <View className="flex-row items-center gap-1.5 mb-1">
              <Text className="text-sm">🤖</Text>
              <Text className="text-xs font-JakartaBold text-primary-800">
                AI Recommendation for {profileStore.firstName}
              </Text>
              <View className="bg-primary-500 px-2 py-0.5 rounded-full ml-auto">
                <Text className="text-[10px] font-JakartaBold text-white">
                  {profileStore.travelStyle}
                </Text>
              </View>
            </View>
            <Text className="text-[11px] font-JakartaMedium text-primary-700 leading-4">
              Because of your {profileStore.travelStyle.toLowerCase().replace("_", " ")} preference, the best matching ride is highlighted below. All other options remain fully selectable.
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const { isRecommended, reason } = getRecommendation(item);
          return (
            <DriverCard
              item={item}
              selected={selectedDriver!}
              setSelected={() => setSelectedDriver(item.id!)}
              isRecommended={isRecommended}
              recommendationReason={reason}
            />
          );
        }}
        ListFooterComponent={() => (
          <View className="mx-5 mt-4 mb-8">
            <CustomButton title="Select Ride" onPress={handleSelectRide} />
          </View>
        )}
      />
    </RideLayout>
  );
};

export default ConfirmRide;
