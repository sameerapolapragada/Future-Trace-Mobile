import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../../lib/shared/theme";
import { DisruptionRadarScreen } from "../screens/DisruptionRadarScreen";
import { DeleteDataScreen } from "../screens/DeleteDataScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { LegalWebViewScreen } from "../screens/LegalWebViewScreen";
import { ScanHistoryScreen } from "../screens/ScanHistoryScreen";
import { ScanFormScreen } from "../screens/ScanFormScreen";
import { ScanLoadingScreen } from "../screens/ScanLoadingScreen";
import { ScanResultsScreen } from "../screens/ScanResultsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { WaitlistScreen } from "../screens/WaitlistScreen";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import type { MainTabParamList, RootStackParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Scan" component={ScanFormScreen} />
      <Tab.Screen name="Radar" component={DisruptionRadarScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator({ showWelcome }: { showWelcome: boolean }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
      initialRouteName={showWelcome ? "Welcome" : "MainTabs"}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="ScanLoading"
        component={ScanLoadingScreen}
        options={{ title: "Analyzing…", headerBackVisible: false }}
      />
      <Stack.Screen name="ScanResults" component={ScanResultsScreen} options={{ title: "Scan Results" }} />
      <Stack.Screen name="ScanHistory" component={ScanHistoryScreen} options={{ title: "Scan History" }} />
      <Stack.Screen
        name="LegalWebView"
        component={LegalWebViewScreen}
        options={({ route }) => ({ title: route.params.title })}
      />
      <Stack.Screen name="DeleteData" component={DeleteDataScreen} options={{ title: "Delete My Local Data" }} />
      <Stack.Screen name="Waitlist" component={WaitlistScreen} options={{ title: "Career X-Ray — Early Access" }} />
    </Stack.Navigator>
  );
}
