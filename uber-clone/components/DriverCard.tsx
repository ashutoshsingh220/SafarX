import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

import { icons } from "@/constants";
import { formatTime } from "@/lib/utils";
import { DriverCardProps } from "@/types/type";

const DriverCard = ({
  item,
  selected,
  setSelected,
  isRecommended,
  recommendationReason,
}: DriverCardProps) => {
  const isSelected = selected === item.id;

  return (
    <TouchableOpacity
      onPress={setSelected}
      className={`${
        isSelected
          ? "bg-general-600 border-2 border-primary-500 shadow-md"
          : isRecommended
          ? "bg-blue-50/40 border border-primary-300"
          : "bg-white border border-neutral-200/80"
      } py-3.5 px-3.5 rounded-2xl mb-3 shadow-sm`}
    >
      {/* Personalized AI Recommendation Pill */}
      {isRecommended && (
        <View className="bg-primary-500/10 border border-primary-500/30 px-2.5 py-0.5 rounded-full mb-2 self-start flex-row items-center">
          <Text className="text-[10px] font-JakartaBold text-primary-700">
            ⭐ {recommendationReason || "Recommended for your profile"}
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-between">
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
          <View className="flex flex-row items-center justify-start mb-1 flex-wrap">
            <Text className="text-base font-JakartaBold text-neutral-900 mr-2">
              {item.title}
            </Text>

            <View className="flex flex-row items-center space-x-1">
              <Image source={icons.star} className="w-3.5 h-3.5" />
              <Text className="text-xs font-JakartaSemiBold text-neutral-700">
                {item.rating || 4.8}
              </Text>
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

          <View className="flex flex-row items-center justify-start flex-wrap">
            <Text className="text-xs font-JakartaRegular text-neutral-600">
              {formatTime(item.time!)}
            </Text>

            <Text className="text-xs font-JakartaRegular text-neutral-400 mx-1.5">
              •
            </Text>

            <Text className="text-xs font-JakartaRegular text-neutral-600">
              {item.car_seats} seats
            </Text>

            {item.distance_km ? (
              <>
                <Text className="text-xs font-JakartaRegular text-neutral-400 mx-1.5">
                  •
                </Text>
                <Text className="text-xs font-JakartaRegular text-neutral-600">
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
      </View>
    </TouchableOpacity>
  );
};

export default DriverCard;
