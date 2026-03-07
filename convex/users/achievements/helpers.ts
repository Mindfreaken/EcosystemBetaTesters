// Helper functions for achievements
export function determineRarity(category: string): "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic" {
  switch (category) {
    case "Community":
      return "common";
    case "Profile":
      return "uncommon";
    case "Social":
      return "rare";
    case "System":
      return "epic";
    default:
      return "common";
  }
}

export function extractMaxUsers(requirementsJson: string): number | undefined {
  try {
    const requirements = JSON.parse(requirementsJson);
    if (requirements.type === "join_position" && requirements.maxPosition) {
      return requirements.maxPosition;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function isLimitedEdition(requirementsJson: string): boolean {
  try {
    const requirements = JSON.parse(requirementsJson);
    return requirements.type === "join_position" || requirements.limited === true;
  } catch {
    return false;
  }
}
