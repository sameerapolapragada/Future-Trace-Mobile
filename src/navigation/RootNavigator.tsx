import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { colors, spacing } from "../../lib/shared/theme";
import { CareerTransitionScreen } from "../screens/CareerTransitionScreen";
import { DisruptionRadarScreen } from "../screens/DisruptionRadarScreen";
import { DeleteDataScreen } from "../screens/DeleteDataScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { LegalWebViewScreen } from "../screens/LegalWebViewScreen";
import { ScanHistoryScreen } from "../screens/ScanHistoryScreen";
import { ScanLoadingScreen } from "../screens/ScanLoadingScreen";
import { ScanCurrentRoleScreen } from "../screens/ScanCurrentRoleScreen";
import { ScanContextScreen } from "../screens/ScanContextScreen";
import { NextRolesIntroScreen } from "../screens/NextRolesIntroScreen";
import { ScanReviewRoleScreen } from "../screens/ScanReviewRoleScreen";
import { ScanRoleConfirmScreen } from "../screens/ScanRoleConfirmScreen";
import { ScanRoleNeedsInfoScreen } from "../screens/ScanRoleNeedsInfoScreen";
import { AdminUnknownRolesScreen } from "../screens/AdminUnknownRolesScreen";
import { ScanResultsScreen } from "../screens/ScanResultsScreen";
import { NextRoleDetailScreen } from "../screens/NextRoleDetailScreen";
import { RoleDisruptionAnalysisScreen } from "../screens/RoleDisruptionAnalysisScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { WaitlistScreen } from "../screens/WaitlistScreen";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import {
  HomeTabIcon,
  ProfileTabIcon,
  ScanTabIcon,
  TransitionTabIcon,
  tabIconColor,
} from "./TabBarIcons";
import type { MainTabParamList, RootStackParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabIconWrap({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <View style={[tabStyles.iconWrap, active && tabStyles.iconWrapActive]}>{children}</View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: tabStyles.label,
        tabBarItemStyle: tabStyles.item,
        tabBarStyle: tabStyles.bar,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ focused, color }) => (
            <TabIconWrap active={focused}>
              <HomeTabIcon active={focused} color={tabIconColor(focused)} />
            </TabIconWrap>
          ),
        }}
      />
      <Tab.Screen
        name="Scan"
        component={NextRolesIntroScreen}
        options={{
          tabBarLabel: "Next Roles",
          tabBarIcon: ({ focused }) => (
            <TabIconWrap active={focused}>
              <ScanTabIcon active={focused} color={tabIconColor(focused)} />
            </TabIconWrap>
          ),
        }}
      />
      <Tab.Screen
        name="Radar"
        component={DisruptionRadarScreen}
        options={{
          tabBarLabel: "Transition",
          tabBarIcon: ({ focused }) => (
            <TabIconWrap active={focused}>
              <TransitionTabIcon active={focused} color={tabIconColor(focused)} />
            </TabIconWrap>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: "Settings",
          tabBarIcon: ({ focused }) => (
            <TabIconWrap active={focused}>
              <ProfileTabIcon active={focused} color={tabIconColor(focused)} />
            </TabIconWrap>
          ),
        }}
      />
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
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: colors.background },
      }}
      initialRouteName={showWelcome ? "Welcome" : "MainTabs"}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false, headerBackTitle: "Back" }}
      />
      <Stack.Screen
        name="ScanLoading"
        component={ScanLoadingScreen}
        options={{ title: "Analyzing…", headerBackVisible: false }}
      />
      <Stack.Screen
        name="ScanReviewRole"
        component={ScanReviewRoleScreen}
        options={{ title: "Review Role", headerShown: false }}
      />
      <Stack.Screen
        name="ScanRoleConfirm"
        component={ScanRoleConfirmScreen}
        options={{ title: "Confirm Role", headerShown: false }}
      />
      <Stack.Screen
        name="ScanRoleNeedsInfo"
        component={ScanRoleNeedsInfoScreen}
        options={{ title: "Role Match", headerShown: false }}
      />
      <Stack.Screen
        name="ScanResults"
        component={ScanResultsScreen}
        options={{ title: "Your Results", headerShown: false }}
      />
      <Stack.Screen
        name="NextRoleDetail"
        component={NextRoleDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ScanHistory"
        component={ScanHistoryScreen}
        options={{ title: "Scan History", headerShown: false }}
      />
      <Stack.Screen
        name="LegalWebView"
        component={LegalWebViewScreen}
        options={({ route }) => ({ title: route.params.title })}
      />
      <Stack.Screen
        name="RoleDisruptionAnalysis"
        component={RoleDisruptionAnalysisScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CareerTransition"
        component={CareerTransitionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="DeleteData" component={DeleteDataScreen} options={{ title: "Delete My Local Data" }} />
      <Stack.Screen name="Waitlist" component={WaitlistScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="NextRolesIntro"
        component={NextRolesIntroScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ScanCurrentRole"
        component={ScanCurrentRoleScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ScanContext"
        component={ScanContextScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminUnknownRoles"
        component={AdminUnknownRolesScreen}
        options={{ title: "Unknown Roles", presentation: "modal" }}
      />
    </Stack.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
  item: {
    paddingTop: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.2,
    marginTop: 2,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: `${colors.accent}1A`,
  },
});
