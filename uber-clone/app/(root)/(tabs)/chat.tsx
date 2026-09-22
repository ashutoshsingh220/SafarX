import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { askTravelAgent, ChatMessage } from "@/lib/agent";
import { useDriverStore, useLocationStore } from "@/store";

const QUICK_PROMPTS = [
  "💰 Compare UberGo vs Premier rates",
  "🚦 Fastest route & traffic conditions",
  "🚗 Who is my driver & car details?",
  "✈️ Best travel options to Haldwani / Uttarakhand",
];

const Chat = () => {
  const {
    userAddress,
    userLatitude,
    userLongitude,
    destinationAddress,
    destinationLatitude,
    destinationLongitude,
  } = useLocationStore();

  const { drivers, selectedDriver } = useDriverStore();

  const flatListRef = useRef<FlatList>(null);

  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "agent",
      text: `👋 **Welcome to Smart Trip AI!**\n\nI am connected to your live trip in Pune & Uttarakhand.\n\n• **Pickup**: ${userAddress || "Symbiosis Institute of Technology, Lavale, Pune"}\n• **Destination**: ${destinationAddress || "Select destination or ask me"}\n• **Verified Rates**: UberGo @ ₹22/km | UberPremier @ ₹30/km\n\nAsk me about rates, fastest traffic routes, driver info, or flight/train connections!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const activeContext = {
    userAddress,
    userLatitude,
    userLongitude,
    destinationAddress,
    destinationLatitude,
    destinationLongitude,
    selectedDriver,
    drivers,
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      // Build conversation history for API
      const conversationHistory = [...messages, userMsg].map((m) => ({
        role: (m.sender === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.text,
      }));

      const reply = await askTravelAgent(conversationHistory, activeContext);

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: "I couldn't process your request right now. Please check your internet or retry.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages, loading]);

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === "user";

    return (
      <View
        className={`flex-row my-2 px-3 ${
          isUser ? "justify-end" : "justify-start"
        }`}
      >
        {!isUser && (
          <View className="w-8 h-8 rounded-full bg-primary-500 items-center justify-center mr-2 mt-1 shadow-sm">
            <Ionicons name="sparkles" size={16} color="#FFFFFF" />
          </View>
        )}

        <View
          className={`max-w-[82%] px-4 py-3 rounded-2xl shadow-sm ${
            isUser
              ? "bg-[#0286FF] rounded-tr-none text-white"
              : "bg-neutral-100 border border-neutral-200 rounded-tl-none"
          }`}
        >
          <Text
            className={`text-sm leading-5 font-JakartaRegular ${
              isUser ? "text-white font-JakartaMedium" : "text-neutral-800"
            }`}
          >
            {item.text}
          </Text>
          <Text
            className={`text-[10px] mt-1.5 self-end ${
              isUser ? "text-blue-100" : "text-neutral-400"
            }`}
          >
            {item.timestamp}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Top Header */}
      <View className="px-4 py-3 border-b border-neutral-200 bg-white shadow-sm flex-row items-center justify-between">
        <View className="flex-row items-center space-x-2">
          <View className="w-9 h-9 rounded-full bg-[#0286FF]/10 items-center justify-center">
            <Ionicons name="sparkles" size={20} color="#0286FF" />
          </View>
          <View>
            <Text className="text-lg font-JakartaBold text-neutral-900">
              Smart Trip AI
            </Text>
            <View className="flex-row items-center space-x-1">
              <View className="w-2 h-2 rounded-full bg-emerald-500" />
              <Text className="text-[11px] font-JakartaMedium text-emerald-600">
                Connected • Grok Ultra-Fast
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {
            setMessages([
              {
                id: "welcome-reset",
                sender: "agent",
                text: `🔄 **Chat reset.**\n\nActive context:\n• Pickup: ${userAddress || "Symbiosis Institute of Technology, Pune"}\n• Destination: ${destinationAddress || "Not set"}\n\nHow can I help you right now?`,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
            ]);
          }}
          className="p-2 rounded-full bg-neutral-100"
        >
          <Ionicons name="refresh-outline" size={18} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Pinned Trip Context Pill */}
      <View className="bg-neutral-50 px-4 py-2 border-b border-neutral-200 flex-row items-center justify-between">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center space-x-1">
            <Ionicons name="navigate-circle" size={14} color="#0286FF" />
            <Text
              numberOfLines={1}
              className="text-xs font-JakartaSemiBold text-neutral-700"
            >
              {userAddress ? userAddress.split(",")[0] : "Symbiosis Inst. of Tech, Pune"}
            </Text>
            <Text className="text-xs text-neutral-400">➔</Text>
            <Ionicons name="location" size={14} color="#EF4444" />
            <Text
              numberOfLines={1}
              className="text-xs font-JakartaSemiBold text-neutral-700 flex-1"
            >
              {destinationAddress ? destinationAddress.split(",")[0] : "Set Destination"}
            </Text>
          </View>
        </View>

        <View className="bg-blue-100 px-2 py-0.5 rounded-full">
          <Text className="text-[10px] font-JakartaBold text-[#0286FF]">
            ₹22-₹30/km
          </Text>
        </View>
      </View>

      {/* Messages List */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={{ paddingVertical: 10, flexGrow: 1 }}
          ListFooterComponent={
            loading ? (
              <View className="flex-row items-center space-x-2 px-4 py-2 bg-neutral-100 self-start ml-4 my-2 rounded-2xl border border-neutral-200">
                <ActivityIndicator size="small" color="#0286FF" />
                <Text className="text-xs font-JakartaMedium text-neutral-600">
                  AI is analyzing route & traffic...
                </Text>
              </View>
            ) : null
          }
        />

        {/* Quick Suggestion Chips */}
        <View className="py-2 px-3 border-t border-neutral-100 bg-white">
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={QUICK_PROMPTS}
            keyExtractor={(item, idx) => `chip-${idx}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSendMessage(item)}
                disabled={loading}
                className="bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 border border-neutral-200 px-3 py-1.5 rounded-full mr-2"
              >
                <Text className="text-xs font-JakartaMedium text-neutral-700">
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Input Bar */}
        <View className="flex-row items-center px-3 pt-2 pb-24 border-t border-neutral-200 bg-white">
          <TextInput
            className="flex-1 bg-neutral-100 border border-neutral-300 rounded-full px-4 py-2.5 text-sm font-JakartaRegular text-neutral-800 mr-2"
            placeholder="Ask about rides, fares, traffic..."
            placeholderTextColor="#9CA3AF"
            value={inputMessage}
            onChangeText={setInputMessage}
            onSubmitEditing={() => handleSendMessage()}
            returnKeyType="send"
            multiline={false}
          />

          <TouchableOpacity
            onPress={() => handleSendMessage()}
            disabled={!inputMessage.trim() || loading}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              inputMessage.trim() && !loading
                ? "bg-[#0286FF]"
                : "bg-neutral-300"
            }`}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Chat;
