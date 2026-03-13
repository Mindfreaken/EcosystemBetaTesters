import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { Plus, X, Calendar as CalendarIcon, Clock, Info, Edit2, Trash2, Megaphone } from "lucide-react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Switch from "@mui/material/Switch";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Id, Doc } from "convex/_generated/dataModel";
import { themeVar } from "@/theme/registry";

interface ScheduleManagerProps {
    spaceId: string;
}

export default function ScheduleManager({ spaceId }: ScheduleManagerProps) {
    const sId = spaceId as Id<"spaces">;
    const events = useQuery(api.spaces.schedule.getEvents, { spaceId: sId });
    const createEvent = useMutation(api.spaces.schedule.createEvent);
    const updateEvent = useMutation(api.spaces.schedule.updateEvent);
    const deleteEvent = useMutation(api.spaces.schedule.deleteEvent);

    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [editingEventId, setEditingEventId] = React.useState<Id<"spaceEvents"> | null>(null);

    // Form state
    const [title, setTitle] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [startTime, setStartTime] = React.useState("");
    const [endTime, setEndTime] = React.useState("");
    const [showInAnnouncements, setShowInAnnouncements] = React.useState(true);
    const [eventToDelete, setEventToDelete] = React.useState<Id<"spaceEvents"> | null>(null);

    // Helpers to convert format for input type="datetime-local"
    const formatDateTimeForInput = (timestamp: number) => {
        const date = new Date(timestamp);
        // datetime-local expects YYYY-MM-DDThh:mm string in local time
        const pad = (n: number) => n.toString().padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const handleOpenCreate = () => {
        setTitle("");
        setDescription("");

        const now = new Date();
        now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15);
        setStartTime(formatDateTimeForInput(now.getTime()));

        const end = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later
        setEndTime(formatDateTimeForInput(end.getTime()));

        setShowInAnnouncements(true);
        setEditingEventId(null);
        setIsCreateOpen(true);
    };

    const handleOpenEdit = (event: Doc<"spaceEvents">) => {
        setTitle(event.title);
        setDescription(event.description || "");
        setStartTime(formatDateTimeForInput(event.startTime));
        setEndTime(formatDateTimeForInput(event.endTime));
        setEditingEventId(event._id);
        setIsCreateOpen(true);
    };

    const handleSave = async () => {
        if (!title.trim() || !startTime || !endTime) return;

        const startTimestamp = new Date(startTime).getTime();
        const endTimestamp = new Date(endTime).getTime();

        if (editingEventId) {
            await updateEvent({
                eventId: editingEventId,
                spaceId: sId,
                title,
                description: description || undefined,
                startTime: startTimestamp,
                endTime: endTimestamp,
            });
        } else {
            await createEvent({
                spaceId: sId,
                title,
                description: description || undefined,
                startTime: startTimestamp,
                endTime: endTimestamp,
                showInAnnouncements,
            });
        }

        setIsCreateOpen(false);
    };

    const handleDelete = async () => {
        if (eventToDelete) {
            await deleteEvent({ spaceId: sId, eventId: eventToDelete });
            setEventToDelete(null);
        }
    };

    const renderToggle = (label: string, value: boolean, onChange: () => void) => (
        <Box
            onClick={onChange}
            sx={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                p: 2, borderRadius: 3,
                bgcolor: "rgba(0,0,0,0.15)",
                border: `1px solid ${value ? `color-mix(in oklab, ${themeVar("primary")}, transparent 70%)` : "rgba(255,255,255,0.05)"}`,
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": {
                    bgcolor: "rgba(0,0,0,0.25)",
                    borderColor: value ? themeVar("primary") : "rgba(255,255,255,0.15)",
                }
            }}
        >
            <Typography variant="body2" sx={{ color: themeVar("foreground"), fontWeight: 600 }}>{label}</Typography>
            <Box
                sx={{
                    width: 44, height: 24, borderRadius: 12,
                    bgcolor: value ? themeVar("primary") : "rgba(255,255,255,0.1)",
                    position: "relative",
                    transition: "background-color 0.3s ease"
                }}
            >
                <Box
                    sx={{
                        width: 18, height: 18, borderRadius: "50%",
                        bgcolor: "white",
                        position: "absolute", top: 3,
                        left: value ? 23 : 3,
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }}
                />
            </Box>
        </Box>
    );

    return (
        <Box sx={{ maxWidth: 800 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeVar("mutedForeground") }}>SCHEDULE / EVENTS</Typography>
                <Button
                    size="small"
                    startIcon={<Plus size={14} />}
                    onClick={handleOpenCreate}
                    sx={{ color: themeVar("primary"), fontWeight: 700, textTransform: "none" }}
                >
                    Add Event
                </Button>
            </Box>

            <Box sx={{ p: 4, borderRadius: 3, bgcolor: `color-mix(in oklab, ${themeVar("muted")}, transparent 50%)`, border: `1px solid ${themeVar("border")}` }}>
                {events === undefined ? (
                    <Typography sx={{ color: themeVar("mutedForeground"), textAlign: "center" }}>Loading schedule...</Typography>
                ) : events.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                        <CalendarIcon size={48} style={{ color: "rgba(255,255,255,0.1)", marginBottom: 16 }} />
                        <Typography sx={{ color: themeVar("mutedForeground"), display: "block" }}>No upcoming events.</Typography>
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {events.map(event => {
                            const startDate = new Date(event.startTime);
                            const endDate = new Date(event.endTime);

                            const now = Date.now();
                            const isPast = now > event.endTime;

                            const dateStr = startDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                            const timeStr = `${startDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} - ${endDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;

                            return (
                                <Box key={event._id} sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(0,0,0,0.2)", border: `1px solid ${themeVar("border")}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", opacity: isPast ? 0.6 : 1 }}>
                                    <Box>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                            <Typography sx={{ fontWeight: 800, color: themeVar("foreground"), fontSize: "1.1rem" }}>{event.title}</Typography>
                                            {isPast && (
                                                <Box sx={{ px: 1, py: 0.25, borderRadius: 1, bgcolor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                                                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 900 }}>FINISHED</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1, color: themeVar("mutedForeground") }}>
                                            <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                <CalendarIcon size={14} /> {dateStr}
                                            </Typography>
                                            <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                <Clock size={14} /> {timeStr}
                                            </Typography>
                                        </Box>
                                        {event.description && (
                                            <Typography variant="body2" sx={{ color: themeVar("mutedForeground"), mt: 1, display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                                                <Info size={14} style={{ marginTop: 2, flexShrink: 0 }} /> {event.description}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Box sx={{ display: "flex", gap: 0.5 }}>
                                        <IconButton size="small" onClick={() => handleOpenEdit(event)} sx={{ color: themeVar("mutedForeground"), "&:hover": { color: themeVar("foreground") } }}>
                                            <Edit2 size={16} />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => setEventToDelete(event._id)} sx={{ color: themeVar("destructive"), "&:hover": { bgcolor: "rgba(255,0,0,0.1)" } }}>
                                            <Trash2 size={16} />
                                        </IconButton>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Stack>
                )}
            </Box>

            <Dialog 
                open={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
                fullWidth 
                maxWidth="xs"
                slotProps={{
                    backdrop: {
                        sx: {
                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                            backdropFilter: 'blur(4px)',
                        }
                    }
                }}
                PaperProps={{
                    sx: {
                        bgcolor: `color-mix(in oklab, ${themeVar("background")}, transparent 20%)`,
                        backdropFilter: "blur(12px)",
                        borderRadius: "9px",
                        border: `1px solid ${themeVar("border")}`,
                        backgroundImage: "none",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                        width: "100%",
                        maxWidth: 450
                    }
                }}
            >
                <DialogTitle 
                    sx={{ 
                        fontWeight: 900, 
                        color: themeVar("foreground"),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        pb: 1
                    }}
                >
                    {editingEventId ? "Edit Event" : "Create Event"}
                    <IconButton
                        size="small"
                        onClick={() => setIsCreateOpen(false)}
                        sx={{
                            color: themeVar("mutedForeground"),
                            "&:hover": { color: themeVar("foreground"), background: "transparent" },
                        }}
                    >
                        <X size={18} />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ py: 1 }}>
                        <TextField
                            label="Event Title"
                            fullWidth
                            size="small"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            variant="outlined"
                            InputLabelProps={{ 
                                shrink: true,
                                sx: { color: themeVar("foreground"), fontWeight: 700, "&.Mui-focused": { color: themeVar("primary") } }
                            }}
                            InputProps={{ 
                                sx: { 
                                    color: themeVar("foreground"),
                                    bgcolor: "rgba(0,0,0,0.3)",
                                    borderRadius: 2,
                                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: themeVar("primary"), borderWidth: 2 }
                                } 
                            }}
                        />
                        <TextField
                            label="Description (Optional)"
                            fullWidth
                            multiline
                            rows={3}
                            size="small"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            variant="outlined"
                            InputLabelProps={{ 
                                shrink: true,
                                sx: { color: themeVar("foreground"), fontWeight: 700, "&.Mui-focused": { color: themeVar("primary") } }
                            }}
                            InputProps={{ 
                                sx: { 
                                    color: themeVar("foreground"),
                                    bgcolor: "rgba(0,0,0,0.3)",
                                    borderRadius: 2,
                                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: themeVar("primary"), borderWidth: 2 }
                                } 
                            }}
                        />
                        <Stack direction="row" spacing={2}>
                            <TextField
                                label="Start Time (Local)"
                                type="datetime-local"
                                fullWidth
                                size="small"
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                                variant="outlined"
                                InputLabelProps={{ 
                                    shrink: true, 
                                    sx: { 
                                        color: themeVar("foreground"), fontWeight: 700, "&.Mui-focused": { color: themeVar("primary") }
                                    } 
                                }}
                                InputProps={{ 
                                    sx: { 
                                        color: themeVar("foreground"),
                                        bgcolor: "rgba(0,0,0,0.3)",
                                        borderRadius: 2,
                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: themeVar("primary"), borderWidth: 2 },
                                        "& [type='datetime-local']::-webkit-calendar-picker-indicator": { filter: "invert(1)" }
                                    } 
                                }}
                            />
                            <TextField
                                label="End Time (Local)"
                                type="datetime-local"
                                fullWidth
                                size="small"
                                value={endTime}
                                onChange={e => setEndTime(e.target.value)}
                                variant="outlined"
                                InputLabelProps={{ 
                                    shrink: true, 
                                    sx: { 
                                        color: themeVar("foreground"), fontWeight: 700, "&.Mui-focused": { color: themeVar("primary") }
                                    } 
                                }}
                                InputProps={{ 
                                    sx: { 
                                        color: themeVar("foreground"),
                                        bgcolor: "rgba(0,0,0,0.3)",
                                        borderRadius: 2,
                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: themeVar("primary"), borderWidth: 2 },
                                        "& [type='datetime-local']::-webkit-calendar-picker-indicator": { filter: "invert(1)" }
                                    } 
                                }}
                            />
                        </Stack>
                        {renderToggle("Announce in #announcements", showInAnnouncements, () => setShowInAnnouncements(!showInAnnouncements))}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
                    <Button 
                        onClick={() => setIsCreateOpen(false)} 
                        sx={{ 
                            color: themeVar("mutedForeground"),
                            fontWeight: 700,
                            textTransform: "none",
                            "&:hover": { color: themeVar("foreground"), bgcolor: "transparent" },
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        variant="contained" 
                        disabled={!title.trim() || !startTime || !endTime} 
                        sx={{ 
                            bgcolor: themeVar("primary"),
                            color: "white",
                            fontWeight: 900,
                            textTransform: "none",
                            px: 3,
                            borderRadius: 2,
                            "&:hover": {
                                bgcolor: themeVar("primary"),
                                filter: "brightness(1.1)",
                            },
                            "&:disabled": {
                                bgcolor: themeVar("border"),
                                color: themeVar("mutedForeground"),
                            }
                        }}
                    >
                        {editingEventId ? "Save Changes" : "Create Event"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={Boolean(eventToDelete)}
                onClose={() => setEventToDelete(null)}
                PaperProps={{ sx: { bgcolor: themeVar("muted"), color: themeVar("foreground"), backgroundImage: "none", border: `1px solid ${themeVar("border")}`, borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 900 }}>Delete Event?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: themeVar("mutedForeground") }}>
                        Are you sure you want to delete this scheduled event? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setEventToDelete(null)} sx={{ color: themeVar("mutedForeground"), fontWeight: 700 }}>Cancel</Button>
                    <Button
                        onClick={handleDelete}
                        variant="contained"
                        color="error"
                        sx={{ fontWeight: 800, px: 3, borderRadius: 2 }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}


