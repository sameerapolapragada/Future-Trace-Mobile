/** O*NET occupation snapshot used by the exposure scoring engine. */
export type OnetOccupation = {
  code: string;
  title: string;
  description: string;
  tasks: string[];
  skills: string[];
  workActivities: string[];
  alternateTitles: string[];
};

export type OnetMatchResult = {
  occupation: OnetOccupation;
  matchScore: number;
  matchedVia: "local_index" | "api" | "cache";
};

export type OnetClientConfig = {
  /** O*NET Web Services username (optional — local index used when absent). */
  username?: string;
  /** O*NET Web Services password (optional). */
  password?: string;
  cache?: OnetCache;
};

export type OnetCache = {
  get(key: string): Promise<OnetOccupation | null>;
  set(key: string, occupation: OnetOccupation): Promise<void>;
};
