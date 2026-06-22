import "dotenv/config";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
const openRouterApiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const onetUsername = process.env.EXPO_PUBLIC_ONET_USERNAME;
const onetPassword = process.env.EXPO_PUBLIC_ONET_PASSWORD;

/** @type {import('expo/config').ExpoConfig} */
export default ({ config }) => ({
  ...config,
  name: "Future Trace",
  slug: "future-trace-mobile",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  splash: {
    backgroundColor: "#0B0D17",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.futuretrace.mobile",
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#0B0D17",
    },
    package: "com.futuretrace.mobile",
  },
  extra: {
    supabaseUrl,
    supabaseAnonKey,
    openrouterApiKey: openRouterApiKey,
    onetUsername,
    onetPassword,
  },
});
