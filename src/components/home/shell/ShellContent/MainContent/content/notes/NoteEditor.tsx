"use client";

import React, { useState, useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { themeVar } from "@/theme/registry";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css"; // Import Quill styles

// Dynamically import react-quill-new to avoid SSR issues
const ReactQuill = dynamic(async () => {
  const mod = await import("react-quill-new");
  const RQ = mod.default as any;
  return function ForwardedQuill(props: any) {
    return <RQ {...props} />;
  };
}, { ssr: false });

interface NoteEditorProps {
  noteId: import("../../../../../../../../convex/_generated/dataModel").Id<"notes">;
  onDeleted: () => void;
}

export default function NoteEditor({ noteId, onDeleted }: NoteEditorProps) {
  const note = useQuery(api.notes.getNote, { noteId });
  const updateNote = useMutation(api.notes.updateNote);
  const deleteNote = useMutation(api.notes.deleteNote);

  const [localTitle, setLocalTitle] = useState("");
  const [localContent, setLocalContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (note) {
      setLocalTitle(note.title);
      setLocalContent(note.content);
    }
    
    // Add tooltips to the rich text toolbar format buttons
    const tooltipTimer = setTimeout(() => {
      document.querySelectorAll(".ql-toolbar button").forEach((btn) => {
        const cls = btn.className;
        const button = btn as HTMLButtonElement;
        if (cls.includes("ql-bold")) btn.setAttribute("title", "Bold");
        if (cls.includes("ql-italic")) btn.setAttribute("title", "Italic");
        if (cls.includes("ql-underline")) btn.setAttribute("title", "Underline");
        if (cls.includes("ql-link")) btn.setAttribute("title", "Link");
        if (cls.includes("ql-list") && button.value === "ordered") btn.setAttribute("title", "Numbered List");
        if (cls.includes("ql-list") && button.value === "bullet") btn.setAttribute("title", "Bulleted List");
        if (cls.includes("ql-clean")) btn.setAttribute("title", "Remove Formatting");
      });
      document.querySelectorAll(".ql-toolbar span.ql-header.ql-picker").forEach((picker) => {
        picker.setAttribute("title", "Text Style");
      });
    }, 500);

    return () => clearTimeout(tooltipTimer);
  }, [note?._id]);
  
  // Clear any pending saves when unmounting
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setLocalTitle(newTitle);
    scheduleSave(newTitle, localContent);
  };

  const handleContentChange = (value: string) => {
    setLocalContent(value);
    scheduleSave(localTitle, value);
  };

  const scheduleSave = (title: string, content: string) => {
    setSaveStatus("saving");
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      await updateNote({ noteId, title, content });
      setSaveStatus("saved");
    }, 1000);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    await deleteNote({ noteId });
    setDeleteDialogOpen(false);
    onDeleted();
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  const handlePinToggle = () => {
    if (!note) return;
    updateNote({ noteId, isPinned: !note.isPinned });
  };

  const handleTagsBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const tagsArray = e.target.value.split(",").map(t => t.trim()).filter(Boolean);
    updateNote({ noteId, tags: tagsArray });
  };

  if (note === undefined) {
    return <Box sx={{ p: 4, color: themeVar("mutedForeground") }}>Loading...</Box>;
  }

  if (note === null) {
    return <Box sx={{ p: 4, color: themeVar("mutedForeground") }}>Note not found.</Box>;
  }

  const plainTextForCount = localContent.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
  const wordCount = plainTextForCount ? plainTextForCount.split(/\s+/).length : 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
      <Box sx={{ p: 1.5, px: 3, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${themeVar("border")}`, backgroundColor: "rgba(0,0,0,0.1)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          <Typography variant="caption" sx={{ color: saveStatus === "saving" ? themeVar("primary") : themeVar("mutedForeground"), fontWeight: 600 }}>
             {saveStatus === "saving" ? "Saving..." : "Saved"}
          </Typography>
          <Typography variant="caption" sx={{ color: themeVar("mutedForeground") }}>
             Last edited {new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
          <Typography variant="caption" sx={{ color: themeVar("mutedForeground") }}>
             {wordCount} words
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton size="small" onClick={handlePinToggle} sx={{ color: note.isPinned ? themeVar("primary") : themeVar("mutedForeground") }} title={note.isPinned ? "Unpin Note" : "Pin Note"} aria-label={note.isPinned ? "Unpin Note" : "Pin Note"}>
            {note.isPinned ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
          </IconButton>
          <IconButton size="small" onClick={handleDeleteClick} sx={{ color: themeVar("destructive") }} title="Delete Note" aria-label="Delete Note">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      
      {/* Search/Header styling for the note body */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 4, py: 3, display: "flex", flexDirection: "column", gap: 1 }}>
        <TextField
          value={localTitle}
          onChange={handleTitleChange}
          placeholder="Note Title"
          variant="standard"
          autoFocus
          inputProps={{ "aria-label": "Note Title" }}
           InputProps={{
            disableUnderline: true,
            sx: {
              fontSize: "2.5rem",
              fontWeight: 800,
              color: themeVar("foreground"),
              lineHeight: 1.2,
            }
          }}
        />
        <TextField
          defaultValue={note.tags?.join(", ") || ""}
          onBlur={handleTagsBlur}
          placeholder="Add tags (comma separated)..."
          variant="standard"
          inputProps={{ "aria-label": "Note Tags" }}
          InputProps={{
            disableUnderline: true,
            sx: {
              fontSize: "0.85rem",
              color: themeVar("primary"),
              mb: 2,
              fontWeight: 600,
            }
          }}
        />
        <Box 
          sx={{ 
            flex: 1, 
            display: "flex", 
            flexDirection: "column",
            "& .quill": { height: "100%", display: "flex", flexDirection: "column" },
            "& .ql-container": { flex: 1, overflowY: "auto", border: "none !important", fontSize: "1rem", color: themeVar("foreground"), fontFamily: "inherit" },
            "& .ql-editor": { p: 0 },
            "& .ql-editor.ql-blank::before": { color: themeVar("mutedForeground"), fontStyle: "normal", left: 0 },
            "& .ql-toolbar": { border: `1px solid ${themeVar("border")} !important`, borderLeft: "none !important", borderRight: "none !important", backgroundColor: "rgba(255,255,255,0.05)" },
            "& .ql-stroke": { stroke: themeVar("foreground") },
            "& .ql-fill": { fill: themeVar("foreground") },
            "& .ql-picker": { color: themeVar("foreground") },
            "& .ql-snow .ql-picker-options": { backgroundColor: themeVar("background"), borderColor: themeVar("border") },
            "& .ql-snow .ql-picker-item": { color: themeVar("foreground") },
            "& .ql-snow .ql-picker-item:hover, & .ql-snow .ql-picker-item.ql-selected": { color: themeVar("primary") },
            "& .ql-snow .ql-picker-label": { color: themeVar("foreground") },
            "& .ql-snow.ql-toolbar button:hover .ql-stroke, & .ql-snow .ql-toolbar button:hover .ql-stroke, & .ql-snow.ql-toolbar button:focus .ql-stroke, & .ql-snow .ql-toolbar button:focus .ql-stroke, & .ql-snow.ql-toolbar button.ql-active .ql-stroke, & .ql-snow .ql-toolbar button.ql-active .ql-stroke, & .ql-snow.ql-toolbar .ql-picker-label:hover .ql-stroke, & .ql-snow .ql-toolbar .ql-picker-label:hover .ql-stroke, & .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke, & .ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-stroke, & .ql-snow.ql-toolbar .ql-picker-item:hover .ql-stroke, & .ql-snow .ql-toolbar .ql-picker-item:hover .ql-stroke, & .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-stroke, & .ql-snow .ql-toolbar .ql-picker-item.ql-selected .ql-stroke, & .ql-snow.ql-toolbar button:hover .ql-stroke-miter, & .ql-snow .ql-toolbar button:hover .ql-stroke-miter, & .ql-snow.ql-toolbar button:focus .ql-stroke-miter, & .ql-snow .ql-toolbar button:focus .ql-stroke-miter, & .ql-snow.ql-toolbar button.ql-active .ql-stroke-miter, & .ql-snow .ql-toolbar button.ql-active .ql-stroke-miter, & .ql-snow.ql-toolbar .ql-picker-label:hover .ql-stroke-miter, & .ql-snow .ql-toolbar .ql-picker-label:hover .ql-stroke-miter, & .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke-miter, & .ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-stroke-miter, & .ql-snow.ql-toolbar .ql-picker-item:hover .ql-stroke-miter, & .ql-snow .ql-toolbar .ql-picker-item:hover .ql-stroke-miter, & .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-stroke-miter, & .ql-snow .ql-toolbar .ql-picker-item.ql-selected .ql-stroke-miter": { stroke: themeVar("primary") },
            "& .ql-snow.ql-toolbar button:hover .ql-fill, & .ql-snow .ql-toolbar button:hover .ql-fill, & .ql-snow.ql-toolbar button:focus .ql-fill, & .ql-snow .ql-toolbar button:focus .ql-fill, & .ql-snow.ql-toolbar button.ql-active .ql-fill, & .ql-snow .ql-toolbar button.ql-active .ql-fill, & .ql-snow.ql-toolbar .ql-picker-label:hover .ql-fill, & .ql-snow .ql-toolbar .ql-picker-label:hover .ql-fill, & .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-fill, & .ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-fill, & .ql-snow.ql-toolbar .ql-picker-item:hover .ql-fill, & .ql-snow .ql-toolbar .ql-picker-item:hover .ql-fill, & .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-fill, & .ql-snow .ql-toolbar .ql-picker-item.ql-selected .ql-fill": { fill: themeVar("primary") },
          }}
        >
          <ReactQuill 
            theme="snow" 
            value={localContent} 
            onChange={handleContentChange} 
            placeholder="Start writing..."
          />
        </Box>
      </Box>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        PaperProps={{
          sx: {
            backgroundColor: themeVar("background"),
            border: `1px solid ${themeVar("border")}`,
            backgroundImage: "none",
            borderRadius: "12px",
            minWidth: "320px"
          }
        }}
      >
        <DialogTitle sx={{ color: themeVar("foreground"), fontWeight: 700 }}>
          Delete Note?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: themeVar("mutedForeground") }}>
            This will permanently remove your note. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={handleCloseDeleteDialog} sx={{ color: themeVar("foreground") }}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            variant="contained" 
            sx={{ 
              backgroundColor: themeVar("destructive"), 
              color: "#fff",
              "&:hover": {
                backgroundColor: themeVar("destructive"),
                opacity: 0.9
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
