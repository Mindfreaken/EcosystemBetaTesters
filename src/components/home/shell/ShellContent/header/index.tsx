"use client";

import React, { useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import HeaderContent, { HeaderContentProps } from "./content";
import GlowPilledButton from "@/components/ui/GlowPilledButton";
import PeopleIcon from "@mui/icons-material/People";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import Box from "@mui/material/Box";
import { useShellView } from "../viewContext";
import { useUser } from "@clerk/nextjs";
import { useGetFriendRequests } from "@/convex/friends/getFriendRequests";
import { Megaphone } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";

export default function Header(props: HeaderContentProps) {
  const { onToggleLeft, onToggleRight, headerRight: headerRightProp, title: titleProp } = props;
  const router = useRouter();
  const pathname = usePathname();
  const { setView } = useShellView();
  const { user } = useUser();
  const clerkUserId = user?.id ?? null;
  const searchParams = useSearchParams();
  const isFriendsView = (pathname?.includes("/friends") ?? false) || (searchParams?.get("view") === "friends");
  const isChatView =
    (pathname?.includes("/messages") ?? false) ||
    (pathname?.includes("/chat") ?? false) ||
    (searchParams?.get("view") === "chat");

  // Convex user for queries that require Convex IDs
  const me = useQuery(api.users.onboarding.queries.me, {});

  const title = useMemo(() => {
    const path = pathname || "/";
    if (searchParams?.get("view") === "friends") return "Friends";
    if (searchParams?.get("view") === "chat") return "Messages";
    if (path.includes("/esports")) return "Esports";
    if (path.includes("/friends")) return "Friends";
    if (path.includes("/messages") || path.includes("/chat")) return "Messages";
    if (path.includes("/tasks")) return "Tasks";
    if (path.includes("/projects")) return "Projects";
    if (path.includes("/dashboard")) return "Dashboard";
    if (path.includes("/theme")) return "Theme Studio";
    if (path.includes("/profile/edit")) return "Edit Profile";
    if (path.includes("/profile")) return "Profile";
    if (path.includes("/settings")) return "Settings";
    if (path.includes("/snaps")) return "Ecosystem Snapshot Collection";
    if (path.includes("/notes")) return "Notes";
    return "Ecosystem";
  }, [pathname, searchParams]);

  const navigateToFriends = () => {
    if (pathname?.startsWith("/home")) {
      setView("friends");
      // Sync URL param without leaving the shell
      const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
      sp.set("view", "friends");
      router.replace(`/home?${sp.toString()}`);
    } else {
      router.push("/home?view=friends");
    }
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  const navigateToChat = () => {
    if (pathname?.startsWith("/home")) {
      setView("chat");
      // Sync URL param without leaving the shell
      const sp = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
      sp.set("view", "chat");
      router.replace(`/home?${sp.toString()}`);
    } else {
      router.push("/home?view=chat");
    }
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  // Pending friend requests (received)
  const pendingRequests = useGetFriendRequests({
    clerkUserId,
    type: "received",
    status: "pending",
  });
  const friendsCount = pendingRequests?.length ?? 0;
  // Unread messages across all chats for this user
  const unreadMessagesCount =
    useQuery(
      api.chat.functions.messages.getUnreadMessageCount,
      me?._id ? { userId: me._id } : ("skip" as any)
    ) ?? 0;

  const headerRight = (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <GlowPilledButton
        onClick={navigateToFriends}
        icon={<PeopleIcon fontSize="small" />}
        label="Friends"
        style={{
          backgroundColor: "rgba(0,0,0,0.2)",
          color: "inherit",
          outline: "none",
          position: "relative",
        }}
      >
        {friendsCount > 0 && !isFriendsView && (
          <span
            style={{
              position: "absolute",
              top: -5,
              right: -5,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              fontSize: 11,
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 5px",
              color: "#fff",
              backgroundColor: "var(--primary)",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              zIndex: 2,
            }}
          >
            {friendsCount}
          </span>
        )}
      </GlowPilledButton>

      <GlowPilledButton
        onClick={navigateToChat}
        icon={<MailOutlineIcon fontSize="small" />}
        label="Messages"
        style={{
          backgroundColor: "rgba(0,0,0,0.2)",
          color: "inherit",
          outline: "none",
          position: "relative",
        }}
      >
        {unreadMessagesCount > 0 && !isChatView && (
          <span
            style={{
              position: "absolute",
              top: -5,
              right: -5,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              fontSize: 11,
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 5px",
              color: "#fff",
              backgroundColor: "var(--primary)",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              zIndex: 2,
            }}
          >
            {unreadMessagesCount}
          </span>
        )}
      </GlowPilledButton>

      {headerRightProp}
    </Box>
  );

  return (
    <HeaderContent
      onToggleLeft={onToggleLeft}
      onToggleRight={onToggleRight}
      headerRight={headerRight}
      title={titleProp ?? title}
    />
  );
}