export type RoleKey = "top" | "jungle" | "mid" | "bot" | "sup";

export function getRoleIconPath(role: RoleKey) {
  switch (role) {
    case "top":
      return "/league/roles/role_top.svg";
    case "jungle":
      return "/league/roles/role_jungle.svg";
    case "mid":
      return "/league/roles/role_middle.svg";
    case "bot":
      return "/league/roles/role_bottom.svg";
    case "sup":
      return "/league/roles/role_support.svg";
  }
}
