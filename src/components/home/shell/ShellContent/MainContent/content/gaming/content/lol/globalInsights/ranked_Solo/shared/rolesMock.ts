import { RoleKey } from "../general_overview/utils";

// Champion pools per role. Use lowercase ids; UI helpers handle casing to assets.
export const ROLE_CHAMP_POOLS: Record<RoleKey, string[]> = {
  top: [
    "aatrox",
    "fiora",
    "darius",
    "garen",
    "camille",
    "malphite",
    "ornn",
    "jax",
    "renekton",
    "riven",
    "nasus",
    "gnar",
    "illaoI".toLowerCase(),
  ],
  jungle: [
    "leesin",
    "vi",
    "amumu",
    "ekko",
    "evelynn",
    "kayn",
    "jarvaniv",
    "khazix",
    "masteryi",
    "viego",
    "udyr",
    "sejuani",
    "zac",
  ],
  mid: [
    "ahri",
    "yasuo",
    "yone",
    "lux",
    "syndra",
    "vex",
    "orianna",
    "viktor",
    "zed",
    "leblanc",
    "anivia",
    "zoe",
  ],
  bot: [
    "caitlyn",
    "ashe",
    "vayne",
    "jinx",
    "lucian",
    "ezreal",
    "aphelios",
    "draven",
    "samira",
    "varus",
    "kogmaw",
    "xayah",
  ],
  sup: [
    "nami",
    "thresh",
    "leona",
    "braum",
    "lulu",
    "sona",
    "morgana",
    "rell",
    "taric",
    "alistar",
    "nautilus",
    "renata",
  ],
};

// Roles Overview cards mock, kept in sync with the pools above
export const ROLES_OVERVIEW_MOCK: Array<{
  key: RoleKey;
  roleLabel: string;
  champ: { name: string; img: string };
  win: number;
  kda: number;
  gpm: number;
  dpm: number;
}> = [
  {
    key: "top",
    roleLabel: "Top",
    champ: { name: "Aatrox", img: "/league/champions/Aatrox.png" },
    win: 56,
    kda: 3.1,
    gpm: 410,
    dpm: 540,
  },
  {
    key: "jungle",
    roleLabel: "Jungle",
    champ: { name: "Lee Sin", img: "/league/champions/LeeSin.png" },
    win: 58,
    kda: 3.8,
    gpm: 392,
    dpm: 450,
  },
  {
    key: "mid",
    roleLabel: "Mid",
    champ: { name: "Ahri", img: "/league/champions/Ahri.png" },
    win: 55,
    kda: 3.4,
    gpm: 452,
    dpm: 625,
  },
  {
    key: "bot",
    roleLabel: "Bot",
    champ: { name: "Caitlyn", img: "/league/champions/Caitlyn.png" },
    win: 60,
    kda: 3.2,
    gpm: 518,
    dpm: 615,
  },
  {
    key: "sup",
    roleLabel: "Support",
    champ: { name: "Nami", img: "/league/champions/Nami.png" },
    win: 57,
    kda: 4.6,
    gpm: 305,
    dpm: 295,
  },
];

export function getChampPoolForRole(role?: RoleKey | "all"): string[] {
  if (!role || role === "all") {
    // Merge all pools
    const set = new Set<string>();
    (Object.keys(ROLE_CHAMP_POOLS) as RoleKey[]).forEach((rk) => {
      ROLE_CHAMP_POOLS[rk].forEach((c) => set.add(c));
    });
    return Array.from(set);
  }
  return ROLE_CHAMP_POOLS[role] ?? [];
}

// Role-specific stat multipliers to shape mock distributions
export const ROLE_STAT_MULTIPLIERS: Record<RoleKey, {
  csPerMin: number;
  gpm: number;
  dpm: number;
  vision: number;
  objDmg: number;
  winBias?: number; // additive probability delta for wins in trend/mock gen (e.g., 0.02 = +2%)
}> = {
  top:    { csPerMin: 1.05, gpm: 1.00, dpm: 0.95, vision: 0.90, objDmg: 1.10, winBias: 0.00 },
  jungle: { csPerMin: 0.85, gpm: 0.95, dpm: 0.90, vision: 1.15, objDmg: 1.25, winBias: 0.02 },
  mid:    { csPerMin: 1.00, gpm: 1.05, dpm: 1.10, vision: 1.00, objDmg: 0.95, winBias: 0.00 },
  bot:    { csPerMin: 1.10, gpm: 1.15, dpm: 1.10, vision: 0.90, objDmg: 0.90, winBias: 0.01 },
  sup:    { csPerMin: 0.60, gpm: 0.80, dpm: 0.70, vision: 1.40, objDmg: 0.70, winBias: -0.01 },
};


