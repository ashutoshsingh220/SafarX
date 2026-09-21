import * as SecureStore from "expo-secure-store";
import * as Linking from "expo-linking";

export const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      return item;
    } catch (error) {
      console.error("SecureStore get token error: ", error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error("SecureStore save token error: ", err);
      return;
    }
  },
};

export const googleOAuth = async (startOAuthFlow: any) => {
  try {
    const { createdSessionId, setActive, signUp, signIn } = await startOAuthFlow({
      redirectUrl: Linking.createURL("/(root)/(tabs)/home", { scheme: "myapp" }),
    });

    if (createdSessionId) {
      if (setActive) {
        await setActive({ session: createdSessionId });
      }
      return {
        success: true,
        code: "success",
        message: "Successfully authenticated with Google",
      };
    }

    return {
      success: false,
      code: "failed",
      message: "An error occurred while logging in with Google",
    };
  } catch (err: any) {
    console.error("OAuth Error:", err);
    return {
      success: false,
      code: err.code || "error",
      message: err.message || "OAuth login failed",
    };
  }
};
