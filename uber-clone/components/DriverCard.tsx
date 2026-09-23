import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

import { icons } from "@/constants";
import { formatTime } from "@/lib/utils";
import { DriverCardProps } from "@/types/type";

const DriverCard = ({ item, selected, setSelected }: DriverCardProps) => {
  return (
    <TouchableOpacity
      onPress={setSelected}
      className={`${
        selected === item.id ? "bg-general-600 border-2 border-primary-500" : "bg-white"
      } flex flex-row items-center justify-between py-4 px-3 rounded-xl mb-2.5 shadow-sm`}
    >
      {item.profile_image_url ? (
        <Image
          source={{ uri: item.profile_image_url }}
          className="w-14 h-14 rounded-full"
        />
      ) : (
        <View className="w-14 h-14 rounded-full bg-neutral-200 items-center justify-center">
          <Image source={icons.person} className="w-8 h-8" />
        </View>
      )}

      <View className="flex-1 flex flex-col items-start justify-center mx-3">
        <View className="flex flex-row items-center justify-start mb-1">
          <Text className="text-base font-JakartaBold">{item.title}</Text>

          <View className="flex flex-row items-center space-x-1 ml-2">
            <Image source={icons.star} className="w-3.5 h-3.5" />
            <Text className="text-xs font-JakartaRegular">{item.rating || 4}</Text>
          </View>
        </View>

        {/* Rate per kilometer and total fare */}
        <View className="flex flex-row items-center mb-1">
          <View className="bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mr-2">
            <Text className="text-xs font-JakartaBold text-emerald-700">
              ₹{item.rate_per_km || (item.title?.includes("Premier") ? 30 : item.title?.includes("Auto") ? 18 : 22)}/km
            </Text>
          </View>
          <Text className="text-sm font-JakartaBold text-emerald-600">
            ₹{item.price}
          </Text>
        </View>

        <View className="flex flex-row items-center justify-start">
          <Text className="text-xs font-JakartaRegular text-general-800">
            {formatTime(item.time!)}
          </Text>

          <Text className="text-xs font-JakartaRegular text-general-800 mx-1.5">
            •
          </Text>

          <Text className="text-xs font-JakartaRegular text-general-800">
            {item.car_seats} seats
          </Text>

          {item.distance_km ? (
            <>
              <Text className="text-xs font-JakartaRegular text-general-800 mx-1.5">
                •
              </Text>
              <Text className="text-xs font-JakartaRegular text-general-800">
                {typeof item.distance_km === "number" ? item.distance_km.toLocaleString("en-IN") : item.distance_km} km
              </Text>
            </>
          ) : null}
        </View>
      </View>

      {item.car_image_url ? (
        <Image
          source={{ uri: item.car_image_url }}
          className="h-12 w-12"
          resizeMode="contain"
        />
      ) : null}
    </TouchableOpacity>
  );
};

export default DriverCard;
