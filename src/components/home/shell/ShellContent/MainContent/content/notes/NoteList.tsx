"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import StarIcon from "@mui/icons-material/Star";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../../../../../../../convex/_generated/api";
import { themeVar } from "@/theme/registry";

interface NoteListProps {
  selectedNoteId: import("../../../../../../../../convex/_generated/dataModel").Id<"notes"> | null;
  onSelectNote: (id: import("../../../../../../../../convex/_generated/dataModel").Id<"notes">) => void;
  onCreateNote: () => void;
}

export default function NoteList({ selectedNoteId, onSelectNote, onCreateNote }: NoteListProps) {
  const { user } = useUser();
  const rawNotes = useQuery(api.notes.getNotes, user ? { userId: user.id } : "skip");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Sort notes: pinned first, then by date (already sorted by date from backend)
  const notes = React.useMemo(() => {
    if (!rawNotes) return rawNotes;
    
    let filtered = rawNotes;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = rawNotes.filter(n => 
        n.title.toLowerCase().includes(q) || 
        n.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    return [...filtered].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0; // maintain original date order
    });
  }, [rawNotes, searchQuery]);

  return (
    <Box sx={{ width: 280, borderRight: `1px solid ${themeVar("border")}`, display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${themeVar("border")}` }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: themeVar("foreground") }}>
          My Notes
        </Typography>
        <IconButton size="small" onClick={onCreateNote} sx={{ color: themeVar("primary") }} aria-label="Create Note">
          <AddIcon />
        </IconButton>
      </Box>
      <Box sx={{ p: 2, borderBottom: `1px solid ${themeVar("border")}` }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by title or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          inputProps={{ "aria-label": "Search notes" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: themeVar("foreground"), opacity: 0.7 }} />
              </InputAdornment>
            ),
            sx: { 
              fontSize: "0.85rem", 
              backgroundColor: "rgba(255,255,255,0.08)", 
              borderRadius: "6px",
              border: `1px solid ${themeVar("border")}`,
              color: themeVar("foreground"),
              "& .MuiInputBase-input": {
                color: themeVar("foreground"),
                py: "8px",
              },
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.12)",
                borderColor: themeVar("primary"),
              },
              "&.Mui-focused": {
                backgroundColor: "rgba(255,255,255,0.15)",
                borderColor: themeVar("primary"),
                boxShadow: `0 0 0 2px ${themeVar("primary")}33`,
              },
              "& .MuiInputBase-input::placeholder": {
                color: themeVar("foreground"),
                opacity: 0.5,
              }
            }
          }}
        />
      </Box>

      <List sx={{ flex: 1, overflowY: "auto", p: 0 }}>
        {notes === undefined && (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: themeVar("mutedForeground") }}>Loading...</Typography>
          </Box>
        )}
        
        {notes?.length === 0 && (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: themeVar("mutedForeground") }}>No notes yet.</Typography>
          </Box>
        )}

        {notes?.map((note) => (
          <ListItemButton
            key={note._id}
            selected={selectedNoteId === note._id}
            onClick={() => onSelectNote(note._id)}
            sx={{
              display: "flex",
              alignItems: "flex-start",
              borderBottom: `1px solid ${themeVar("border")}`,
              "&.Mui-selected": {
                backgroundColor: themeVar("primary"),
                color: themeVar("primaryForeground"),
                "&:hover": {
                  backgroundColor: themeVar("primary"),
                }
              }
            }}
          >
            <ListItemText
              primary={note.title || "Untitled"}
              primaryTypographyProps={{
                variant: "body2",
                fontWeight: selectedNoteId === note._id ? 600 : 400,
                noWrap: true,
              }}
              secondary={new Date(note.updatedAt).toLocaleDateString()}
              secondaryTypographyProps={{
                variant: "caption",
                color: selectedNoteId === note._id ? themeVar("primaryForeground") : themeVar("mutedForeground"),
                sx: { opacity: 0.8 }
              }}
            />
            {note.isPinned && (
              <StarIcon sx={{ fontSize: 14, ml: 1, color: selectedNoteId === note._id ? themeVar("primaryForeground") : themeVar("primary"), opacity: 0.8 }} aria-label="Pinned note" />
            )}
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
