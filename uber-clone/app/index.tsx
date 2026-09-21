import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";

const Page = () => {
  const { isSignedIn, isLoaded } = useAuth();

  return <Redirect href="/(root)/(tabs)/home" />;
};

export default Page;
