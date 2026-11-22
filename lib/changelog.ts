import type changes from "@/messages/de/pages/changelog.json";

export interface ChangelogEntry {
  version: string;
  date: string;       // ISO date string
  changes: { type: "feature" | "fix"; message: keyof typeof changes }[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "2.0.0",
    date: "2026-05-10",
    changes: [
      { type: "feature", message: "v2_0_0_1" },
      { type: "feature", message: "v2_0_0_2" },
      { type: "feature", message: "v2_0_0_3" },
    ],
  },
  {
    version: "1.9.0",
    date: "2026-05-10",
    changes: [
      { type: "feature", message: "v1_9_0_1" },
      { type: "feature", message: "v1_9_0_2" },
      { type: "feature", message: "v1_9_0_3" },
      { type: "feature", message: "v1_9_0_4" },
    ],
  },
  {
    version: "1.8.0",
    date: "2026-05-10",
    changes: [
      { type: "feature", message: "v1_8_0_1" },
      { type: "feature", message: "v1_8_0_2" },
      { type: "feature", message: "v1_8_0_3" },
      { type: "feature", message: "v1_8_0_4" },
    ],
  },
  {
    version: "1.7.0",
    date: "2026-05-10",
    changes: [
      { type: "feature", message: "v1_7_0_1" },
      { type: "feature", message: "v1_7_0_2" },
      { type: "feature", message: "v1_7_0_3" },
      { type: "feature", message: "v1_7_0_4" },
      { type: "feature", message: "v1_7_0_5" },
    ],
  },
  {
    version: "1.6.0",
    date: "2026-05-10",
    changes: [
      { type: "feature", message: "v1_6_0_1" },
      { type: "feature", message: "v1_6_0_2" },
      { type: "feature", message: "v1_6_0_3" },
      { type: "feature", message: "v1_6_0_4" },
      { type: "feature", message: "v1_6_0_5" },
      { type: "fix",     message: "v1_6_0_6" },
      { type: "fix",     message: "v1_6_0_7" },
    ],
  },
  {
    version: "1.5.0",
    date: "2026-05-09",
    changes: [
      { type: "feature", message: "v1_5_0_1" },
      { type: "feature", message: "v1_5_0_2" },
      { type: "feature", message: "v1_5_0_3" },
      { type: "feature", message: "v1_5_0_4" },
      { type: "feature", message: "v1_5_0_5" },
      { type: "feature", message: "v1_5_0_6" },
      { type: "fix",     message: "v1_5_0_7" },
      { type: "fix",     message: "v1_5_0_8" },
    ],
  },
  {
    version: "1.4.0",
    date: "2026-05-08",
    changes: [
      { type: "feature", message: "v1_4_0_1" },
      { type: "feature", message: "v1_4_0_2" },
      { type: "feature", message: "v1_4_0_3" },
      { type: "feature", message: "v1_4_0_4" },
      { type: "feature", message: "v1_4_0_5" },
      { type: "feature", message: "v1_4_0_6" },
      { type: "feature", message: "v1_4_0_7" },
      { type: "feature", message: "v1_4_0_8" },
      { type: "feature", message: "v1_4_0_9" },
      { type: "fix",     message: "v1_4_0_10" },
      { type: "fix",     message: "v1_4_0_11" },
      { type: "fix",     message: "v1_4_0_12" },
    ],
  },
  {
    version: "1.3.0",
    date: "2026-05-07",
    changes: [
      { type: "feature", message: "v1_3_0_1" },
      { type: "feature", message: "v1_3_0_2" },
      { type: "feature", message: "v1_3_0_3" },
      { type: "feature", message: "v1_3_0_4" },
      { type: "fix",     message: "v1_3_0_5" },
      { type: "fix",     message: "v1_3_0_6" },
    ],
  },
  {
    version: "1.2.0",
    date: "2026-05-06",
    changes: [
      { type: "feature", message: "v1_2_0_1" },
      { type: "feature", message: "v1_2_0_2" },
      { type: "feature", message: "v1_2_0_3" },
      { type: "feature", message: "v1_2_0_4" },
      { type: "feature", message: "v1_2_0_5" },
      { type: "feature", message: "v1_2_0_6" },
      { type: "feature", message: "v1_2_0_7" },
      { type: "feature", message: "v1_2_0_8" },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-05-01",
    changes: [
      { type: "feature", message: "v1_1_0_1" },
      { type: "feature", message: "v1_1_0_2" },
      { type: "feature", message: "v1_1_0_3" },
      { type: "feature", message: "v1_1_0_4" },
      { type: "feature", message: "v1_1_0_5" },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-04-15",
    changes: [
      { type: "feature", message: "v1_0_0_1" },
      { type: "feature", message: "v1_0_0_2" },
      { type: "feature", message: "v1_0_0_3" },
      { type: "feature", message: "v1_0_0_4" },
      { type: "feature", message: "v1_0_0_5" },
    ],
  },
];
