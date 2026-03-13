import React from "react";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import type { FriendFilterType } from "@/convex/friends/types";
import UiButton from "@/components/ui/UiButton";

export interface FriendFilter {
  id: FriendFilterType;
  label: string;
  icon?: React.ReactNode;
}

interface FriendsHeaderProps {
  currentFilter: FriendFilterType;
  setCurrentFilter: (filter: FriendFilterType) => void;
  unreadRequestsCount: number;
  filters: FriendFilter[];
  onAddFriend?: () => void;
  onShowFriendCode?: () => void;
}

const FriendsHeader: React.FC<FriendsHeaderProps> = ({
  currentFilter,
  setCurrentFilter,
  unreadRequestsCount,
  filters,
  onAddFriend,
  onShowFriendCode,
}) => {
  return (
    <div
      className="flex items-center justify-between border-b px-6 py-2.5"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--muted)",
      }}
    >
      {/* Left: Friend Code */}
      <div>
        <UiButton
          type="button"
          variant="outline"
          size="sm"
          pill
          onClick={onShowFriendCode}
          startIcon={<QrCode2Icon fontSize="small" />}
        >
          Friend Code
        </UiButton>
      </div>

      {/* Center: Filters */}
      <div className="flex gap-2">
        {filters.map((filter) => {
          const isActive = filter.id === currentFilter;
          const isPending = filter.id === "pending";
          return (
            <UiButton
              key={filter.id}
              type="button"
              size="sm"
              pill
              variant={isActive ? "primary" : "outline"}
              onClick={() => setCurrentFilter(filter.id)}
              startIcon={filter.icon as React.ReactNode}
              className="relative"
            >
              {filter.label}
              {isPending && unreadRequestsCount > 0 && (
                <span
                  className="absolute -right-2 -top-2 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold"
                  style={{ backgroundColor: "var(--danger)", color: "#fff" }}
                >
                  {unreadRequestsCount}
                </span>
              )}
            </UiButton>
          );
        })}
      </div>

      {/* Right: Add Friend */}
      <div>
        <UiButton
          type="button"
          variant="outline"
          size="sm"
          pill
          onClick={onAddFriend}
          startIcon={<PersonAddIcon fontSize="small" />}
        >
          Add Friend
        </UiButton>
      </div>
    </div>
  );
};

export default FriendsHeader;


