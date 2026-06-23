export type RootStackParamList = {
  Welcome: undefined;
  MainTabs: import("@react-navigation/native").NavigatorScreenParams<MainTabParamList> | undefined;
  ScanLoading: undefined;
  ScanResults: { scanId: string };
  ScanHistory: undefined;
  LegalWebView: { title: string; html: string };
  DeleteData: undefined;
  Waitlist: undefined;
  RoleDisruptionAnalysis: { scanId: string; focus: "current" | "target" };
};

export type MainTabParamList = {
  Home: undefined;
  Scan: undefined;
  Radar: undefined;
  Settings: undefined;
};

export type ScanStackParamList = {
  ScanForm: undefined;
};
