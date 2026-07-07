import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainTabParamList, RootStackParamList } from "./types";

export function navigateBackToTab(
  navigation: NativeStackNavigationProp<RootStackParamList>,
  returnTab?: keyof MainTabParamList
): void {
  if (returnTab) {
    navigation.navigate("MainTabs", { screen: returnTab });
    return;
  }
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }
  navigation.navigate("MainTabs");
}
