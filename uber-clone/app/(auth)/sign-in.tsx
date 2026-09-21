import { useSignIn } from "@clerk/clerk-expo";
import { Link, router } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { icons, images } from "@/constants";

const SignIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const onSignInPress = useCallback(async () => {
    if (!isLoaded) {
      router.replace("/(root)/(tabs)/home");
      return;
    }

    try {
      const isPlaceholder =
        !process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
        process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("example-clerk-key");

      if (isPlaceholder) {
        router.replace("/(root)/(tabs)/home");
        return;
      }

      const signInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/(root)/(tabs)/home");
      } else {
        console.log(JSON.stringify(signInAttempt, null, 2));
        Alert.alert(
          "Notice",
          "Log in failed. Would you like to continue as guest?",
          [
            { text: "Try Again", style: "cancel" },
            {
              text: "Continue as Guest",
              onPress: () => router.replace("/(root)/(tabs)/home"),
            },
          ]
        );
      }
    } catch (err: any) {
      console.log("Sign-in caught error:", JSON.stringify(err, null, 2));
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.message ||
        "Auth service currently in dev mode.";
      Alert.alert(
        "Sign In Notice",
        `${msg}\n\nContinue in Guest / Demo mode to explore SmartTrip AI?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue as Guest",
            onPress: () => router.replace("/(root)/(tabs)/home"),
          },
        ]
      );
    }
  }, [isLoaded, form]);

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[250px]">
          <Image source={images.signUpCar} className="z-0 w-full h-[250px]" />
          <Text className="text-2xl text-black font-JakartaSemiBold absolute bottom-5 left-5">
            Welcome 👋
          </Text>
        </View>

        <View className="p-5">
          <InputField
            label="Email"
            placeholder="Enter email"
            icon={icons.email}
            textContentType="emailAddress"
            value={form.email}
            onChangeText={(value) => setForm({ ...form, email: value })}
          />

          <InputField
            label="Password"
            placeholder="Enter password"
            icon={icons.lock}
            secureTextEntry={true}
            textContentType="password"
            value={form.password}
            onChangeText={(value) => setForm({ ...form, password: value })}
          />

          <CustomButton
            title="Sign In"
            onPress={onSignInPress}
            className="mt-6"
          />

          <CustomButton
            title="Continue as Guest (Demo Mode)"
            onPress={() => router.replace("/(root)/(tabs)/home")}
            className="mt-3 bg-neutral-200"
            textVariant="secondary"
          />

          <OAuth />

          <Link
            href="/sign-up"
            className="text-lg text-center text-general-200 mt-10"
          >
            Don't have an account?{" "}
            <Text className="text-primary-500">Sign Up</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
};

export default SignIn;
