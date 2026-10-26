import React, { useEffect, useRef } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSmartTripStore } from "../../../src/features/smarttrip/store/smartTripStore";
import { sendAgentMessage } from "../../../src/features/smarttrip/lib/api";
import { useProfileStore } from "../../../store/profileStore";
import { router } from "expo-router";

export default function AgentScreen() {
  const { agentMessages, addAgentMessage, isAgentThinking, setIsAgentThinking } = useSmartTripStore();
  const [inputText, setInputText] = React.useState("");
  const scrollViewRef = useRef<ScrollView>(null);
  const profileStore = useProfileStore();

  useEffect(() => {
    profileStore.loadProfile();
    if (agentMessages.length === 0) {
      addAgentMessage({
        id: "init",
        role: "assistant",
        content: `Hi ${profileStore.firstName || "there"}! 👋 I'm your SafarX AI Orchestration Assistant, tuned for your ${profileStore.travelStyle} travel profile. Where would you like to travel across India?`,
        timestamp: Date.now(),
      });
    }
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setInputText("");
    
    addAgentMessage({
      id: Date.now().toString(),
      role: "user",
      content: userMsg,
      timestamp: Date.now(),
    });

    setIsAgentThinking(true);

    try {
      const history = agentMessages
        .filter(m => m.role === "user" || m.role === "assistant")
        .map(m => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
          content: m.content,
        }));

      const res = await sendAgentMessage({
        message: userMsg,
        history,
        userPreferences: {
          firstName: profileStore.firstName,
          lastName: profileStore.lastName,
          travelStyle: profileStore.travelStyle,
          trainClass: profileStore.trainClass,
          flightClass: profileStore.flightClass,
          cabPreference: profileStore.cabPreference,
        },
      });
      
      addAgentMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: res.reply,
        timestamp: Date.now(),
      });
      
    } catch (err) {
      addAgentMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: "Sorry, I ran into a network error. Please try again.",
        timestamp: Date.now(),
      });
    } finally {
      setIsAgentThinking(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-100">
      <View className="flex-row items-center p-4 bg-white shadow-sm border-b border-neutral-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-JakartaBold">SafarX Assistant</Text>
          <Text className="text-xs font-JakartaMedium text-neutral-500">
            {profileStore.firstName} &bull; {profileStore.travelStyle} ({profileStore.trainClass})
          </Text>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        className="flex-1 p-4"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {agentMessages.map((msg) => (
          <View 
            key={msg.id}
            className={`mb-4 max-w-[85%] rounded-2xl p-4 ${
              msg.role === "user" 
                ? "bg-primary-500 self-end rounded-tr-none shadow-sm" 
                : "bg-white self-start rounded-tl-none border border-neutral-200 shadow-sm"
            }`}
          >
            <Text className={`font-Jakarta text-base leading-6 ${
              msg.role === "user" ? "text-white font-JakartaMedium" : "text-neutral-800"
            }`}>
              {msg.content}
            </Text>
          </View>
        ))}

        {isAgentThinking && (
          <View className="flex-row items-center bg-white self-start rounded-2xl rounded-tl-none border border-neutral-200 p-4 mb-4 shadow-sm">
            <ActivityIndicator color="#0286FF" size="small" />
            <Text className="ml-3 font-JakartaMedium text-neutral-500">Orchestrating route options...</Text>
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <View className="p-4 bg-white border-t border-neutral-200 flex-row items-center gap-2">
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask anything, e.g. 'I want to travel to Dehradun'..."
            className="flex-1 bg-neutral-100 rounded-full px-4 py-3 font-Jakarta text-base"
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity 
            onPress={handleSend}
            disabled={isAgentThinking || !inputText.trim()}
            className={`w-12 h-12 rounded-full items-center justify-center ${
              !inputText.trim() || isAgentThinking ? "bg-neutral-300" : "bg-primary-500"
            }`}
          >
            <Text className="text-white text-lg">↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
