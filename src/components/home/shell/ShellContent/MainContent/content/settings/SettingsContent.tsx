"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import ContentTemplate from "../_shared/ContentTemplate";
import { useShellView } from "../../../viewContext";
import { UserProfile } from "@clerk/nextjs";
import UiButton from "@/components/ui/UiButton";
import { MuiCard } from "@/components/ui/MuiCard";
import { useMediaDeviceSelect } from "@livekit/components-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";

function ConvexMediaDeviceSelect({
  kind,
  value,
  onChange
}: {
  kind: 'audioinput' | 'videoinput' | 'audiooutput',
  value?: string | null,
  onChange: (id: string) => void
}) {
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({ kind });

  // Sync convex value down to LiveKit strictly when it changes
  React.useEffect(() => {
    if (value && value !== "" && value !== activeDeviceId) {
      setActiveMediaDevice(value).catch(console.error);
    }
  }, [value, activeDeviceId, setActiveMediaDevice]);

  // Sync LiveKit's naturally chosen default UP to Convex initially if Convex has no saved preference yet
  React.useEffect(() => {
    if (!value && activeDeviceId) {
      onChange(activeDeviceId);
    }
  }, [value, activeDeviceId, onChange]);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const defaultVal = e.target.value;
    onChange(defaultVal);
    await setActiveMediaDevice(defaultVal).catch(console.error);
  };

  return (
    <select
      value={value || activeDeviceId || ""}
      onChange={handleChange}
      className="themed-input"
      style={{
        width: '100%',
        padding: '8px',
        borderRadius: '8px',
        cursor: 'pointer'
      }}
    >
      <option value="" disabled>Select device...</option>
      {devices.map(device => (
        <option key={device.deviceId} value={device.deviceId}>
          {device.label || `Device ${device.deviceId}`}
        </option>
      ))}
    </select>
  );
}

export default function SettingsContent() {
  const { setView } = useShellView();
  const [showClerkProfile, setShowClerkProfile] = React.useState(false);

  const settings = useQuery(api.users.settings.getSettings);
  const updateSettings = useMutation(api.users.settings.updateSettings);

  const handleDeviceChange = (kind: 'audioinput' | 'videoinput' | 'audiooutput', deviceId: string) => {
    const field = kind === 'audioinput' ? 'preferredMicrophoneId'
      : kind === 'videoinput' ? 'preferredCameraId'
        : 'preferredSpeakerId';
    updateSettings({ settings: { [field]: deviceId } });
  };

  return (
    <ContentTemplate
      title="Settings"
      subtitle="Configure your experience, theme, and account preferences."
    >
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
        {/* Appearance card */}
        <MuiCard variant="interactive" sx={{ p: 2.5 }}>
          <Box sx={{ fontWeight: 700, mb: 1, color: "var(--textLight)" }}>Appearance</Box>
          <Box sx={{ color: "var(--textSecondary)", mb: 1.5 }}>
            Choose accent colors and configure your theme.
          </Box>
          <UiButton variant="primary" pill onClick={() => setView("theme")}>
            Customize Theme
          </UiButton>
        </MuiCard>

        {/* Account card */}
        <MuiCard variant="interactive" sx={{ p: 2.5 }}>
          <Box sx={{ fontWeight: 700, mb: 1, color: "var(--textLight)" }}>Account</Box>
          <Box sx={{ color: "var(--textSecondary)", mb: 1.5 }}>
            Manage profile, privacy, and connected apps.
          </Box>
          <UiButton variant="primary" pill style={{ marginRight: 12 }} onClick={() => setShowClerkProfile(true)}>
            Auth (Clerk)
          </UiButton>
          <UiButton variant="outline" pill>
            Subscriptions (Polar) — WIP
          </UiButton>
        </MuiCard>

        {/* Voice & Video settings card */}
        <MuiCard variant="interactive" sx={{ p: 2.5 }}>
          <Box sx={{ fontWeight: 700, mb: 1, color: "var(--textLight)" }}>Voice & Video</Box>
          <Box sx={{ color: "var(--textSecondary)", mb: 1.5 }}>
            Configure your microphone and camera preferences.
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: "var(--textSecondary)", display: 'block', mb: 0.5 }}>Microphone</Typography>
              <ConvexMediaDeviceSelect
                kind="audioinput"
                value={settings?.preferredMicrophoneId}
                onChange={(id) => handleDeviceChange('audioinput', id)}
              />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "var(--textSecondary)", display: 'block', mb: 0.5 }}>Camera</Typography>
              <ConvexMediaDeviceSelect
                kind="videoinput"
                value={settings?.preferredCameraId}
                onChange={(id) => handleDeviceChange('videoinput', id)}
              />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "var(--textSecondary)", display: 'block', mb: 0.5 }}>Output (Speakers)</Typography>
              <ConvexMediaDeviceSelect
                kind="audiooutput"
                value={settings?.preferredSpeakerId}
                onChange={(id) => handleDeviceChange('audiooutput', id)}
              />
            </Box>
          </Box>
        </MuiCard>
      </Box>

      {/* Clerk Account Management Modal */}
      <Dialog
        open={showClerkProfile}
        onClose={() => setShowClerkProfile(false)}
        maxWidth={false}
        PaperProps={{ sx: { backgroundColor: "transparent", boxShadow: "none", display: "grid", placeItems: "center", overflow: "visible" } }}
      >
        <DialogContent sx={{ position: "relative", p: 1, display: "grid", placeItems: "center", backgroundColor: "transparent", overflow: "visible" }}>
          <IconButton
            aria-label="Close"
            onClick={() => setShowClerkProfile(false)}
            sx={{ position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0,0,0,0.6)", color: "#fff", zIndex: 9999, boxShadow: 1 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          <Box sx={{ display: "grid", placeItems: "center" }}>
            <Box
              sx={{
                width: { xs: "calc(100vw - 2rem)", sm: "fit-content" },
                maxWidth: "min(900px, 92vw)",
                maxHeight: "80vh",
                overflow: "auto",
                backgroundColor: "transparent",
                border: "none",
                borderRadius: 0,
                p: 1,
              }}
            >
              <UserProfile
                routing="virtual"
                appearance={{
                  elements: {
                    rootBox: { background: "transparent" },
                    card: { background: "transparent", boxShadow: "none", border: "none" },
                    // Make left nav opaque (app card styling)
                    navbar: { background: "var(--card)", borderRight: "1px solid var(--card-border)" },
                    pageScrollBox: { background: "transparent" },
                    header: { background: "transparent" },
                    profileSection__avatar: { display: "none" },
                    profileSection__profile: { display: "none" },
                    profileSection__username: { display: "none" },
                  },
                }}
              />
            </Box>
          </Box>
        </DialogContent>
      </Dialog >
    </ContentTemplate >
  );
}
