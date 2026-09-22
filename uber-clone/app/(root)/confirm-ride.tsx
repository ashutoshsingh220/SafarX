import { router } from "expo-router";
import React, { useEffect } from "react";
import { FlatList, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import DriverCard from "@/components/DriverCard";
import RideLayout from "@/components/RideLayout";
import { useDriverStore } from "@/store";

const ConfirmRide = () => {
  const { drivers, selectedDriver, setSelectedDriver } = useDriverStore();

  // Exclude auto for cab bookings
  const cabDrivers = drivers?.filter(
    (d) => !d.title?.toLowerCase().includes("auto"),
  );
  const displayDrivers =
    cabDrivers && cabDrivers.length > 0 ? cabDrivers : drivers;

  useEffect(() => {
    if (displayDrivers && displayDrivers.length > 0) {
      const exists = displayDrivers.some((d) => d.id === selectedDriver);
      if (!selectedDriver || !exists) {
        setSelectedDriver(displayDrivers[0].id);
      }
    }
  }, [displayDrivers, selectedDriver]);

  const handleSelectRide = () => {
    if (
      (!selectedDriver ||
        !displayDrivers?.some((d) => d.id === selectedDriver)) &&
      displayDrivers &&
      displayDrivers.length > 0
    ) {
      setSelectedDriver(displayDrivers[0].id);
    }
    router.push("/(root)/book-ride");
  };

  return (
    <RideLayout title={"Choose a Rider"} snapPoints={["65%", "85%"]}>
      <FlatList
        data={displayDrivers}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <DriverCard
            item={item}
            selected={selectedDriver!}
            setSelected={() => setSelectedDriver(item.id!)}
          />
        )}
        ListFooterComponent={() => (
          <View className="mx-5 mt-6 mb-8">
            <CustomButton title="Select Ride" onPress={handleSelectRide} />
          </View>
        )}
      />
    </RideLayout>
  );
};

export default ConfirmRide;
