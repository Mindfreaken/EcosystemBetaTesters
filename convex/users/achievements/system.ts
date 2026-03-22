import { AchievementFields } from "./types";

export const SYSTEM_ACHIEVEMENTS: AchievementFields[] = [
  {
    name: "Community Member",
    description: "Joined the community",
    category: "Community",
    imageUrl: "/achievements/community_member_joined_achievement.png",
    rarity: "common",
  },
  {
    name: "Early Adopter",
    description: "One of the first 2,000 members to join",
    category: "Community",
    imageUrl: "/achievements/early_adopter_sticker.png",
    rarity: "mythic",
    maxUsers: 2000,
  },
  {
    name: "Identity Established",
    description: "Completed all profile sections",
    category: "Profile",
    imageUrl: "/achievements/compass.svg",
    rarity: "uncommon",
  },
  {
    name: "Friendly",
    description: "Made your first friend connection",
    category: "Social",
    imageUrl: "/achievements/handshake.svg",
    rarity: "common",
  },
  {
    name: "Pioneer",
    description: "Among the first explorers of the platform",
    category: "System",
    imageUrl: "/achievements/rocket-launch.svg",
    rarity: "epic",
    maxUsers: 500,
  },
];
