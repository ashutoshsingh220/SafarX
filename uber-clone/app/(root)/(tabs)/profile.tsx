import { useUser } from "@clerk/clerk-expo";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  CabPreference,
  FlightClass,
  TrainClass,
  TravelStyle,
  useProfileStore,
} from "@/store/profileStore";

const TRAVEL_STYLES: {
  id: TravelStyle;
  title: string;
  badge: string;
  desc: string;
}[] = [
  {
    id: "ECONOMICAL",
    title: "Economical / Budget",
    badge: "💰 Lowest Cost",
    desc: "Prefers cheapest fares, sleeper class, and shared cabs/feeders.",
  },
  {
    id: "BALANCED",
    title: "Balanced Value",
    badge: "⚖️ Best Value",
    desc: "Optimal balance of transit time, comfort, and fair price.",
  },
  {
    id: "COMFORT_LUXURY",
    title: "Comfort & Luxury",
    badge: "✨ Premium",
    desc: "Maximum comfort: 1A/2A AC trains, business flights, private sedans.",
  },
  {
    id: "FASTEST",
    title: "Fastest / Time-First",
    badge: "⚡ Quickest",
    desc: "Direct flights, high-speed rail, and express highways.",
  },
];

const TRAIN_CLASSES: {
  id: TrainClass;
  title: string;
  badge: string;
}[] = [
  { id: "SL", title: "Sleeper (SL)", badge: "₹ Lowest Fare" },
  { id: "3A", title: "3rd AC (3A/3E)", badge: "AC Value" },
  { id: "2A", title: "2nd AC (2A)", badge: "High Comfort" },
  { id: "1A", title: "1st AC / EC (1A)", badge: "Luxury Coupe" },
];

const FLIGHT_CLASSES: {
  id: FlightClass;
  title: string;
  badge: string;
}[] = [
  { id: "ECONOMY", title: "Economy Class", badge: "Standard Fare" },
  { id: "PREMIUM_ECONOMY", title: "Premium / Flexi", badge: "Extra Legroom" },
  { id: "BUSINESS", title: "Business Class", badge: "Executive Lounge" },
];

const CAB_PREFERENCES: {
  id: CabPreference;
  title: string;
  badge: string;
  desc: string;
}[] = [
  {
    id: "SHARED",
    title: "Shared Taxi / Auto / Sumo",
    badge: "Lowest Feeder Cost",
    desc: "Pocket-friendly shared local transit and mountain boleros.",
  },
  {
    id: "PRIVATE_SEDAN",
    title: "Dedicated Private Cab",
    badge: "Comfort & Privacy",
    desc: "Private sedans (Swift, Dzire, Honda City).",
  },
  {
    id: "SUV",
    title: "Spacious SUV / Innova",
    badge: "Extra Space & Mountains",
    desc: "Dedicated SUV for hill routes, extra luggage, and family comfort.",
  },
];

const Profile = () => {
  const { user } = useUser();
  const profileStore = useProfileStore();

  const [firstName, setFirstName] = useState(profileStore.firstName);
  const [lastName, setLastName] = useState(profileStore.lastName);
  const [email, setEmail] = useState(profileStore.email);
  const [phone, setPhone] = useState(profileStore.phone);
  const [travelStyle, setTravelStyle] = useState<TravelStyle>(profileStore.travelStyle);
  const [trainClass, setTrainClass] = useState<TrainClass>(profileStore.trainClass);
  const [flightClass, setFlightClass] = useState<FlightClass>(profileStore.flightClass);
  const [cabPreference, setCabPreference] = useState<CabPreference>(profileStore.cabPreference);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    profileStore.loadProfile().then(() => {
      const current = useProfileStore.getState();
      setFirstName(current.firstName || user?.firstName || "Ashutosh");
      setLastName(current.lastName || user?.lastName || "Singh");
      setEmail(current.email || user?.primaryEmailAddress?.emailAddress || "ashutosh.singh@safarx.app");
      setPhone(current.phone || user?.primaryPhoneNumber?.phoneNumber || "+91 98765 43210");
      setTravelStyle(current.travelStyle || "BALANCED");
      setTrainClass(current.trainClass || "3A");
      setFlightClass(current.flightClass || "ECONOMY");
      setCabPreference(current.cabPreference || "PRIVATE_SEDAN");
    });
  }, []);

  const handleSave = async () => {
    if (!firstName.trim()) {
      Alert.alert("Validation Error", "Please provide a first name.");
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    try {
      await profileStore.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        travelStyle,
        trainClass,
        flightClass,
        cabPreference,
      });

      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      setSaving(false);
      Alert.alert("Error", "Could not save profile preferences.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-100" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between my-4">
            <View>
              <Text className="text-2xl font-JakartaBold text-neutral-900">
                My Profile
              </Text>
              <Text className="text-sm font-JakartaMedium text-neutral-500 mt-0.5">
                Personal details & travel preferences
              </Text>
            </View>
            <View className="bg-primary-100 px-3 py-1.5 rounded-full border border-primary-200">
              <Text className="text-xs font-JakartaBold text-primary-700">
                Preferences
              </Text>
            </View>
          </View>

          {/* User Avatar Card */}
          <View className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200/80 mb-4 flex-row items-center">
            <Image
              source={{
                uri:
                  user?.externalAccounts?.[0]?.imageUrl ??
                  user?.imageUrl ??
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400",
              }}
              className="w-16 h-16 rounded-full border-2 border-primary-500"
            />
            <View className="ml-4 flex-1">
              <Text className="text-lg font-JakartaBold text-neutral-900" numberOfLines={1}>
                {firstName} {lastName}
              </Text>
              <Text className="text-xs font-JakartaMedium text-neutral-500" numberOfLines={1}>
                {email}
              </Text>
              <View className="flex-row items-center mt-1.5">
                <View className="bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Text className="text-[11px] font-JakartaSemiBold text-emerald-700">
                    Active Traveler
                  </Text>
                </View>
                <Text className="text-xs font-JakartaMedium text-neutral-400 ml-2">
                  All-India Reachable
                </Text>
              </View>
            </View>
          </View>

          {/* Section 1: Personal Details */}
          <View className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200/80 mb-4">
            <View className="flex-row items-center mb-3">
              <Ionicons name="person-circle-outline" size={20} color="#0286FF" />
              <Text className="text-base font-JakartaBold text-neutral-900 ml-2">
                Personal Information
              </Text>
            </View>

            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-xs font-JakartaSemiBold text-neutral-600 mb-1">
                  First Name
                </Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter first name"
                  placeholderTextColor="#9CA3AF"
                  className="bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 font-JakartaMedium text-neutral-900 text-sm"
                />
              </View>

              <View className="flex-1">
                <Text className="text-xs font-JakartaSemiBold text-neutral-600 mb-1">
                  Last Name
                </Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter last name"
                  placeholderTextColor="#9CA3AF"
                  className="bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 font-JakartaMedium text-neutral-900 text-sm"
                />
              </View>
            </View>

            <View className="mb-3">
              <Text className="text-xs font-JakartaSemiBold text-neutral-600 mb-1">
                Email Address
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 font-JakartaMedium text-neutral-900 text-sm"
              />
            </View>

            <View>
              <Text className="text-xs font-JakartaSemiBold text-neutral-600 mb-1">
                Phone Number
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 98765 43210"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                className="bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 font-JakartaMedium text-neutral-900 text-sm"
              />
            </View>
          </View>

          {/* Section 2: Travel Philosophy & Budget */}
          <View className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200/80 mb-4">
            <View className="flex-row items-center mb-1">
              <Ionicons name="wallet-outline" size={20} color="#0286FF" />
              <Text className="text-base font-JakartaBold text-neutral-900 ml-2">
                Travel Philosophy & Budget
              </Text>
            </View>
            <Text className="text-xs font-JakartaRegular text-neutral-500 mb-3 ml-7">
              Choose whether you prioritize minimum expense, balanced value, or luxury.
            </Text>

            <View className="flex-col gap-2.5">
              {TRAVEL_STYLES.map((item) => {
                const isSelected = travelStyle === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setTravelStyle(item.id)}
                    activeOpacity={0.7}
                    className={`p-3 rounded-xl border flex-row items-center justify-between ${
                      isSelected
                        ? "bg-primary-50 border-primary-500"
                        : "bg-neutral-50 border-neutral-200"
                    }`}
                  >
                    <View className="flex-1 pr-2">
                      <View className="flex-row items-center gap-2">
                        <Text
                          className={`text-sm font-JakartaBold ${
                            isSelected ? "text-primary-700" : "text-neutral-800"
                          }`}
                        >
                          {item.title}
                        </Text>
                        <View
                          className={`px-2 py-0.5 rounded-full ${
                            isSelected ? "bg-primary-200" : "bg-neutral-200"
                          }`}
                        >
                          <Text
                            className={`text-[10px] font-JakartaSemiBold ${
                              isSelected ? "text-primary-800" : "text-neutral-600"
                            }`}
                          >
                            {item.badge}
                          </Text>
                        </View>
                      </View>
                      <Text
                        className={`text-xs font-JakartaMedium mt-1 ${
                          isSelected ? "text-primary-600" : "text-neutral-500"
                        }`}
                      >
                        {item.desc}
                      </Text>
                    </View>
                    <Ionicons
                      name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                      size={20}
                      color={isSelected ? "#0286FF" : "#CBD5E1"}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section 3: Train Class Preference */}
          <View className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200/80 mb-4">
            <View className="flex-row items-center mb-1">
              <Ionicons name="train-outline" size={20} color="#0286FF" />
              <Text className="text-base font-JakartaBold text-neutral-900 ml-2">
                Preferred Train Class
              </Text>
            </View>
            <Text className="text-xs font-JakartaRegular text-neutral-500 mb-3 ml-7">
              Automatically prioritizes this coach class when suggesting train options.
            </Text>

            <View className="flex-row flex-wrap gap-2">
              {TRAIN_CLASSES.map((item) => {
                const isSelected = trainClass === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setTrainClass(item.id)}
                    activeOpacity={0.7}
                    className={`flex-1 min-w-[46%] p-3 rounded-xl border ${
                      isSelected
                        ? "bg-primary-50 border-primary-500"
                        : "bg-neutral-50 border-neutral-200"
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text
                        className={`text-xs font-JakartaBold ${
                          isSelected ? "text-primary-700" : "text-neutral-800"
                        }`}
                      >
                        {item.title}
                      </Text>
                      <Ionicons
                        name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                        size={16}
                        color={isSelected ? "#0286FF" : "#CBD5E1"}
                      />
                    </View>
                    <Text
                      className={`text-[11px] font-JakartaMedium mt-1 ${
                        isSelected ? "text-primary-600" : "text-neutral-500"
                      }`}
                    >
                      {item.badge}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section 4: Flight Class Preference */}
          <View className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200/80 mb-4">
            <View className="flex-row items-center mb-1">
              <Ionicons name="airplane-outline" size={20} color="#0286FF" />
              <Text className="text-base font-JakartaBold text-neutral-900 ml-2">
                Preferred Flight Cabin
              </Text>
            </View>
            <Text className="text-xs font-JakartaRegular text-neutral-500 mb-3 ml-7">
              Selects this fare class when presenting domestic flight options.
            </Text>

            <View className="flex-col gap-2">
              {FLIGHT_CLASSES.map((item) => {
                const isSelected = flightClass === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setFlightClass(item.id)}
                    activeOpacity={0.7}
                    className={`p-3 rounded-xl border flex-row items-center justify-between ${
                      isSelected
                        ? "bg-primary-50 border-primary-500"
                        : "bg-neutral-50 border-neutral-200"
                    }`}
                  >
                    <View>
                      <Text
                        className={`text-sm font-JakartaBold ${
                          isSelected ? "text-primary-700" : "text-neutral-800"
                        }`}
                      >
                        {item.title}
                      </Text>
                      <Text
                        className={`text-xs font-JakartaMedium mt-0.5 ${
                          isSelected ? "text-primary-600" : "text-neutral-500"
                        }`}
                      >
                        {item.badge}
                      </Text>
                    </View>
                    <Ionicons
                      name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                      size={18}
                      color={isSelected ? "#0286FF" : "#CBD5E1"}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section 5: Feeder / Cab Preference */}
          <View className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200/80 mb-4">
            <View className="flex-row items-center mb-1">
              <Ionicons name="car-outline" size={20} color="#0286FF" />
              <Text className="text-base font-JakartaBold text-neutral-900 ml-2">
                First & Last-Mile Feeder
              </Text>
            </View>
            <Text className="text-xs font-JakartaRegular text-neutral-500 mb-3 ml-7">
              How you reach the nearest railway station or airport from your location.
            </Text>

            <View className="flex-col gap-2">
              {CAB_PREFERENCES.map((item) => {
                const isSelected = cabPreference === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setCabPreference(item.id)}
                    activeOpacity={0.7}
                    className={`p-3 rounded-xl border flex-row items-center justify-between ${
                      isSelected
                        ? "bg-primary-50 border-primary-500"
                        : "bg-neutral-50 border-neutral-200"
                    }`}
                  >
                    <View className="flex-1 pr-2">
                      <View className="flex-row items-center gap-2">
                        <Text
                          className={`text-sm font-JakartaBold ${
                            isSelected ? "text-primary-700" : "text-neutral-800"
                          }`}
                        >
                          {item.title}
                        </Text>
                      </View>
                      <Text
                        className={`text-xs font-JakartaMedium mt-0.5 ${
                          isSelected ? "text-primary-600" : "text-neutral-500"
                        }`}
                      >
                        {item.desc}
                      </Text>
                    </View>
                    <Ionicons
                      name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                      size={18}
                      color={isSelected ? "#0286FF" : "#CBD5E1"}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Success Banner */}
          {saveSuccess && (
            <View className="bg-emerald-500/10 border border-emerald-500 rounded-xl p-3 mb-3 flex-row items-center">
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text className="text-xs font-JakartaBold text-emerald-700 ml-2">
                Travel preferences saved successfully!
              </Text>
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
            className="w-full bg-primary-500 py-3.5 rounded-full items-center justify-center flex-row shadow-sm shadow-primary-500/30"
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                <Text className="text-white font-JakartaBold text-base ml-2">
                  Save Travel Preferences
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Profile;
