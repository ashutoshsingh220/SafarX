import { useUser } from "@clerk/clerk-expo";
import { useAuth } from "@clerk/clerk-expo";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import GoogleTextInput from "@/components/GoogleTextInput";
import Map from "@/components/Map";
import RideCard from "@/components/RideCard";
import { icons, images } from "@/constants";
import { useFetch } from "@/lib/fetch";
import { useLocationStore } from "@/store";
import { Ride } from "@/types/type";

const Home = () => {
  const { user } = useUser();
  const { signOut } = useAuth();

  const { setUserLocation, setDestinationLocation, clearDestinationLocation } =
    useLocationStore();

  // Clear lingering destination when user returns/focuses Home
  useFocusEffect(
    useCallback(() => {
      clearDestinationLocation();
    }, [clearDestinationLocation])
  );

  const handleSignOut = () => {
    try {
      if (signOut) signOut();
    } catch (e) {
      console.log("Sign out notice:", e);
    }
    router.replace("/(auth)/sign-in");
  };

  const [hasPermission, setHasPermission] = useState<boolean>(false);

  const {
    data: recentRides,
    loading,
    error,
  } = useFetch<Ride[]>(user?.id ? `/(api)/ride/${user.id}` : "");

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    let isMounted = true;

    const updateLocationWithCoords = async (latitude: number, longitude: number) => {
      // Don't override if coords are default Mountain View emulator unless user is actually there
      if (Math.abs(latitude - 37.422) < 0.1 && Math.abs(longitude - (-122.084)) < 0.1) {
        return;
      }

      let addressText = "Current Location";
      try {
        const address = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (address && address.length > 0) {
          const item = address[0];
          const parts = [item.name, item.street, item.subregion || item.city, item.region].filter(Boolean);
          const unique = Array.from(new Set(parts));
          addressText = unique.join(", ") || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }
      } catch (e) {
        addressText = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }

      if (isMounted) {
        setUserLocation({
          latitude,
          longitude,
          address: addressText,
        });
      }
    };

    (async () => {
      // Set initial fallback location to Pune SIT
      setUserLocation({
        latitude: 18.5412,
        longitude: 73.7275,
        address: "Symbiosis Institute of Technology, Lavale, Pune",
      });

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setHasPermission(false);
          return;
        }
        setHasPermission(true);

        // 1. Instantly read last known cached location (instant, no timeout)
        try {
          const lastKnown = await Location.getLastKnownPositionAsync({});
          if (lastKnown?.coords && isMounted) {
            await updateLocationWithCoords(lastKnown.coords.latitude, lastKnown.coords.longitude);
          }
        } catch (cachedErr) {
          console.log("Cached location notice:", cachedErr);
        }

        // 2. Fetch fresh balanced GPS position
        try {
          const current = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (current?.coords && isMounted) {
            await updateLocationWithCoords(current.coords.latitude, current.coords.longitude);
          }
        } catch (posErr) {
          console.log("Fresh GPS lookup notice:", posErr);
        }

        // 3. Continuously track live location changes as the user moves
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 4000,
            distanceInterval: 10,
          },
          (loc) => {
            if (loc?.coords && isMounted) {
              updateLocationWithCoords(loc.coords.latitude, loc.coords.longitude);
            }
          }
        );
      } catch (err) {
        console.log("GPS Location notice:", err);
      }
    })();

    return () => {
      isMounted = false;
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const handleDestinationPress = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    setDestinationLocation(location);

    router.push({
      pathname: "/(root)/explore-place" as any,
      params: {
        name: location.address.split(",")[0] || location.address,
        address: location.address,
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
      },
    });
  };

  return (
    <SafeAreaView className="bg-general-500">
      <FlatList
        data={recentRides?.slice(0, 5)}
        renderItem={({ item }) => <RideCard ride={item} />}
        keyExtractor={(item, index) => index.toString()}
        className="px-5"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: 100,
        }}
        ListEmptyComponent={() => (
          <View className="flex flex-col items-center justify-center">
            {!loading ? (
              <>
                <Image
                  source={images.noResult}
                  className="w-40 h-40"
                  alt="No recent rides found"
                  resizeMode="contain"
                />
                <Text className="text-sm">No recent rides found</Text>
              </>
            ) : (
              <ActivityIndicator size="small" color="#000" />
            )}
          </View>
        )}
        ListHeaderComponent={
          <>
            <View className="flex flex-row items-center justify-between my-5">
              <Text className="text-2xl font-JakartaExtraBold">
                Welcome {user?.firstName || "Traveler"} 👋
              </Text>
              <TouchableOpacity
                onPress={handleSignOut}
                className="justify-center items-center w-10 h-10 rounded-full bg-white"
              >
                <Image source={icons.out} className="w-4 h-4" />
              </TouchableOpacity>
            </View>

            <GoogleTextInput
              icon={icons.search}
              initialLocation="Where do you want to go?"
              initialValue=""
              containerStyle="bg-white shadow-md shadow-neutral-300"
              handlePress={handleDestinationPress}
            />

            <>
              <Text className="text-xl font-JakartaBold mt-5 mb-3">
                Your current location
              </Text>
              <View className="flex flex-row items-center bg-transparent h-[300px]">
                <Map currentLocationOnly={true} />
              </View>
            </>

            <Text className="text-xl font-JakartaBold mt-5 mb-3">
              Recent Rides
            </Text>
          </>
        }
      />
    </SafeAreaView>
  );
};

export default Home;
