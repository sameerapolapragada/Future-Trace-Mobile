import AsyncStorage from "@react-native-async-storage/async-storage";
import { createOnetCacheAdapter } from "../../lib/shared/onet/cache";

const ONET_CACHE_PREFIX = "ft_onet_cache:";

/** Device cache for O*NET occupation snapshots — swappable for Supabase later. */
export const onetDeviceCache = createOnetCacheAdapter(
  (key) => AsyncStorage.getItem(`${ONET_CACHE_PREFIX}${key}`),
  (key, value) => AsyncStorage.setItem(`${ONET_CACHE_PREFIX}${key}`, value)
);
