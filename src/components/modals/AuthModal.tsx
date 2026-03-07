"use client";

import React from "react";
import { Dialog, DialogContent } from "@mui/material";
import SignUpElements from "@/components/auth/SignUpElements";
import SignInElements from "@/components/auth/SignInElements";

export type AuthMode = "signIn" | "signUp";

interface AuthModalProps {
  open: boolean;
  mode: AuthMode;
  onClose: () => void;
  // Optional redirects to keep the flow consistent with the app
  signInRedirectUrl?: string;
  signInFallbackRedirectUrl?: string;
  signUpRedirectUrl?: string;
  signUpFallbackRedirectUrl?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({
  open,
  mode,
  onClose,
  signInRedirectUrl = "/home",
  signInFallbackRedirectUrl = "/home",
  signUpRedirectUrl = "/home",
  signUpFallbackRedirectUrl = "/home",
}) => {
  // Render Elements-based flows inside an MUI Dialog
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { bgcolor: 'transparent', backgroundImage: 'none', boxShadow: 'none' } }}
    >
      <DialogContent sx={{ p: 0 }}>
        {mode === "signUp" ? (
          <SignUpElements redirectUrl={signUpRedirectUrl} />
        ) : (
          <SignInElements redirectUrl={signInRedirectUrl} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
