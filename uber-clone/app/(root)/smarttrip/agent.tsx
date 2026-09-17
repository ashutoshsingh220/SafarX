import React, { useEffect, useRef } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSmartTripStore } from "../../../src/features/smarttrip/store/smartTripStore";
import { sendAgentMessage } from "../../../src/features/smarttrip/lib/api";
import { router } from "expo-router";

export default function AgentScreen() {
  const { agentMessages, addAgentMessage, isAgentThinking, setIsAgentThinking } = useSmartTripStore();
  const [inputText, setInputText] = React.useState("");
  const scrollViewRef = useRef<ScrollView>(null);

  // Initialize with greeting if empty
  useEffect(() => {
    if (agentMessages.length === 0) {
      addAgentMessage({
        id: "init",
        role: "assistant",
        content: "Hi there! 👋 I'm your SmartTrip Assistant. Where would you like to go?",
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
      // Build history from current messages for multi-turn context
      const history = agentMessages
        .filter(m => m.role === "user" || m.role === "assistant")
        .map(m => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
          content: m.content,
        }));

      // Send to backend API with history
      const res = await sendAgentMessage({ message: userMsg, history });
      
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
    <SafeAreaView className="flex-1 bg-general-500">
      <View className="flex-row items-center p-4 bg-white shadow-sm shadow-neutral-300">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-JakartaSemiBold">SmartTrip Agent</Text>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        className="flex-1 p-4"
      >
        {agentMessages.map((msg) => (
          <View 
            key={msg.id} 
            className={`mb-4 max-w-[80%] p-3 rounded-2xl ${
              msg.role === "user" 
                ? "bg-primary-500 self-end rounded-tr-none" 
                : "bg-white border border-neutral-200 self-start rounded-tl-none"
            }`}
          >
            <Text className={`font-Jakarta ${msg.role === "user" ? "text-white" : "text-black"}`}>
              {msg.content}
            </Text>
          </View>
        ))}
        {isAgentThinking && (
          <View className="bg-white border border-neutral-200 self-start p-3 rounded-2xl rounded-tl-none mb-4 flex-row items-center">
            <ActivityIndicator size="small" color="#0286FF" />
            <Text className="font-Jakarta ml-2 text-gray-500">Thinking...</Text>
          </View>
        )}
        <View className="h-10" />
      </ScrollView>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View className="p-4 bg-white border-t border-neutral-200 flex-row items-center">
          <TextInput
            className="flex-1 bg-neutral-100 p-3 rounded-full font-Jakarta"
            placeholder="Ask anything (e.g., 'Find cheap buses to Mumbai')"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity 
            onPress={handleSend}
            disabled={!inputText.trim() || isAgentThinking}
            className={`ml-3 w-12 h-12 rounded-full items-center justify-center ${
              !inputText.trim() || isAgentThinking ? "bg-neutral-300" : "bg-primary-500"
            }`}
          >
            <Text className="text-white text-xl">↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
