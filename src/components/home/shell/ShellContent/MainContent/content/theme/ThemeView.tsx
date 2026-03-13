"use client";

import React from "react";
import ContentTemplate from "../_shared/ContentTemplate";
import ThemeContent from "./content/ThemeContent";

export default function ThemeView() {
  return (
    <ContentTemplate
      title="Themes"
      subtitle="Browse, preview, vote, and apply themes. Void Dark variants included."
      maxWidth={1200}
    >
      <ThemeContent />
    </ContentTemplate>
  );
}

