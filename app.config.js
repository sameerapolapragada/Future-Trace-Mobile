import "dotenv/config";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

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
  },
});
