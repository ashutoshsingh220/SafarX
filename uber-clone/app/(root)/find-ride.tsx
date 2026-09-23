import { router } from "expo-router";
import { Text, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import GoogleTextInput from "@/components/GoogleTextInput";
import RideLayout from "@/components/RideLayout";
import { icons } from "@/constants";
import { useLocationStore } from "@/store";

const FindRide = () => {
  const {
    userAddress,
    destinationAddress,
    setDestinationLocation,
    setUserLocation,
    clearDestinationLocation,
  } = useLocationStore();

  return (
    <RideLayout title="Ride">
      <View className="my-3" style={{ zIndex: 20 }}>
        <Text className="text-lg font-JakartaSemiBold mb-3">From</Text>

        <GoogleTextInput
          icon={icons.target}
          initialLocation={userAddress || "Current location"}
          initialValue={userAddress || ""}
          containerStyle="bg-neutral-100"
          textInputBackgroundColor="#f5f5f5"
          handlePress={(location) => setUserLocation(location)}
          onClear={() =>
            setUserLocation({
              latitude: 18.5412,
              longitude: 73.7275,
              address: "",
            })
          }
        />
      </View>

      <View className="my-3" style={{ zIndex: 10 }}>
        <Text className="text-lg font-JakartaSemiBold mb-3">To</Text>

        <GoogleTextInput
          icon={icons.map}
          initialLocation="Where to?"
          initialValue={destinationAddress || ""}
          containerStyle="bg-neutral-100"
          textInputBackgroundColor="transparent"
          handlePress={(location) => setDestinationLocation(location)}
          onClear={() => clearDestinationLocation()}
        />
      </View>

      <CustomButton
        title="Find Now"
        onPress={() => router.push(`/(root)/confirm-ride`)}
        className="mt-5"
      />
    </RideLayout>
  );
};

export default FindRide;
