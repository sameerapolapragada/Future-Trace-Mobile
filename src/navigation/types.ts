export type RootStackParamList = {
  Welcome: undefined;
  MainTabs: import("@react-navigation/native").NavigatorScreenParams<MainTabParamList> | undefined;
  ScanLoading: undefined;
  ScanReviewRole: undefined;
  ScanRoleConfirm: undefined;
  ScanRoleNeedsInfo: undefined;
  ScanResults: { scanId: string };
  ScanHistory: undefined;
  LegalWebView: { title: string; html: string; returnTab?: keyof MainTabParamList };
  DeleteData: { returnTab?: keyof MainTabParamList } | undefined;
  Waitlist: undefined;
  RoleDisruptionAnalysis: { scanId: string; focus: "current" | "target" };
  CareerTransition: undefined;
  AdminUnknownRoles: undefined;
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
