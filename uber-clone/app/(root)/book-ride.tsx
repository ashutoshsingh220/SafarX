import { useUser } from "@clerk/clerk-expo";
import { StripeProvider } from "@stripe/stripe-react-native";
import { Image, Text, View } from "react-native";

import Payment from "@/components/Payment";
import RideLayout from "@/components/RideLayout";
import { icons } from "@/constants";
import { formatTime } from "@/lib/utils";
import { useDriverStore, useLocationStore } from "@/store";

const BookRide = () => {
  const { user } = useUser();
  const { userAddress, destinationAddress } = useLocationStore();
  const { drivers, selectedDriver } = useDriverStore();

  const driverDetails =
    drivers?.find((driver) => +driver.id === selectedDriver) ||
    drivers?.[0] || {
      id: 1,
      title: "Rahul Sharma (UberGo)",
      rating: 4.85,
      car_seats: 4,
      time: 25,
      price: "350",
      profile_image_url:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
      car_image_url: "https://img.icons8.com/color/512/car--v1.png",
      rate_per_km: 22,
    };

  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      merchantIdentifier="merchant.com.uber"
      urlScheme="myapp"
    >
      <RideLayout title="Book Ride">
        <>
          <Text className="text-xl font-JakartaSemiBold mb-2">
            Ride Information
          </Text>

          <View className="flex flex-col w-full items-center justify-center mt-4">
            {driverDetails?.profile_image_url ? (
              <Image
                source={{ uri: driverDetails.profile_image_url }}
                className="w-24 h-24 rounded-full border-2 border-primary-500 shadow-md"
              />
            ) : (
              <View className="w-24 h-24 rounded-full bg-neutral-200 items-center justify-center">
                <Image source={icons.person} className="w-12 h-12" />
              </View>
            )}

            <View className="flex flex-row items-center justify-center mt-3 space-x-2">
              <Text className="text-lg font-JakartaBold">
                {driverDetails?.title}
              </Text>

              <View className="flex flex-row items-center space-x-0.5 ml-2">
                <Image
                  source={icons.star}
                  className="w-4 h-4"
                  resizeMode="contain"
                />
                <Text className="text-sm font-JakartaRegular">
                  {driverDetails?.rating || 4.8}
                </Text>
              </View>
            </View>

            {/* Mention rate per km as requested */}
            <View className="mt-1">
              <Text className="text-xs font-JakartaSemiBold text-neutral-500">
                Rate: ₹{driverDetails?.rate_per_km || (driverDetails?.title?.includes("Premier") ? 30 : 22)}/km
              </Text>
            </View>
          </View>

          <View className="flex flex-col w-full items-start justify-center py-3 px-5 rounded-3xl bg-general-600 mt-4">
            <View className="flex flex-row items-center justify-between w-full border-b border-white py-3">
              <Text className="text-lg font-JakartaRegular">Ride Price</Text>
              <View className="items-end">
                <Text className="text-lg font-JakartaBold text-[#0CC25F]">
                  ₹{driverDetails?.price}
                </Text>
                <Text className="text-[11px] font-JakartaMedium text-neutral-500">
                  (₹{driverDetails?.rate_per_km || (driverDetails?.title?.includes("Premier") ? 30 : 22)}/km rate)
                </Text>
              </View>
            </View>

            <View className="flex flex-row items-center justify-between w-full border-b border-white py-3">
              <Text className="text-lg font-JakartaRegular">Pickup Time</Text>
              <Text className="text-lg font-JakartaRegular">
                {formatTime(driverDetails?.time!)}
              </Text>
            </View>

            <View className="flex flex-row items-center justify-between w-full py-3">
              <Text className="text-lg font-JakartaRegular">Car Seats</Text>
              <Text className="text-lg font-JakartaRegular">
                {driverDetails?.car_seats}
              </Text>
            </View>
          </View>

          <View className="flex flex-col w-full items-start justify-center mt-5">
            <View className="flex flex-row items-center justify-start mt-3 border-t border-b border-general-700 w-full py-3">
              <Image source={icons.to} className="w-6 h-6" />
              <Text className="text-lg font-JakartaRegular ml-2">
                {userAddress}
              </Text>
            </View>

            <View className="flex flex-row items-center justify-start border-b border-general-700 w-full py-3">
              <Image source={icons.point} className="w-6 h-6" />
              <Text className="text-lg font-JakartaRegular ml-2">
                {destinationAddress}
              </Text>
            </View>
          </View>

          <Payment
            fullName={user?.fullName!}
            email={user?.emailAddresses[0].emailAddress!}
            amount={driverDetails?.price!}
            driverId={driverDetails?.id}
            rideTime={driverDetails?.time!}
          />
        </>
      </RideLayout>
    </StripeProvider>
  );
};

export default BookRide;
