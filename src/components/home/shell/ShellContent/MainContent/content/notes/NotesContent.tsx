"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ContentTemplate from "../_shared/ContentTemplate";
import { themeVar } from "@/theme/registry";
import NoteList from "./NoteList";
import NoteEditor from "./NoteEditor";
import { useMutation } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import type { Id } from "../../../../../../../../convex/_generated/dataModel";

export default function NotesContent() {
  const [selectedNoteId, setSelectedNoteId] = useState<Id<"notes"> | null>(null);
  const { user } = useUser();
  const createNote = useMutation(api.notes.createNote);

  const handleCreateNote = async () => {
    if (!user) return;
    const newNoteId = await createNote({
      userId: user.id,
      title: "",
      content: "",
    });
    setSelectedNoteId(newNoteId);
  };

  return (
    <Box sx={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <NoteList
        selectedNoteId={selectedNoteId}
        onSelectNote={setSelectedNoteId}
        onCreateNote={handleCreateNote}
      />
      <Box sx={{ flex: 1, backgroundColor: themeVar("background"), position: "relative" }}>
        {selectedNoteId ? (
          <NoteEditor
            key={selectedNoteId} // force remount if needed, but not strictly necessary here as we handle it in useEffect
            noteId={selectedNoteId}
            onDeleted={() => setSelectedNoteId(null)}
          />
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2, color: themeVar("foreground"), textShadow: `0 0 12px color-mix(in oklab, ${themeVar("primary")}, transparent 70%)` }}>
              Select a Note
            </Typography>
            <Typography variant="body1" sx={{ color: themeVar("mutedForeground") }}>
              Or click the + button to create a new one.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
