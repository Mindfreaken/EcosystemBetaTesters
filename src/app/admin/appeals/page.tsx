'use client';

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { 
  Scale, 
  CheckCircle, 
  XCircle, 
  User, 
  Clock, 
  MessageSquare,
  AlertOctagon,
  ShieldCheck
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { themeVar } from "@/theme/registry";

export default function AdminAppealsPage() {
  const appeals = useQuery(api.hub.overseer.getPendingAppeals, {});
  const resolveAppeal = useMutation(api.hub.overseer.resolveAppeal);
  const { toast } = useToast();
  
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const handleResolve = async (appealId: any, decision: "approved" | "denied") => {
    setResolvingId(appealId);
    try {
      await resolveAppeal({ 
        appealId, 
        decision, 
        adminNote: adminNotes[appealId] || undefined 
      });
      toast({
        title: "Appeal Resolved",
        description: `The appeal has been ${decision}.`,
      });
    } catch (error) {
      console.error("Failed to resolve appeal:", error);
      toast({
        title: "Resolution Failed",
        description: "Error resolving appeal. Check console.",
        variant: "destructive",
      });
    } finally {
      setResolvingId(null);
    }
  };

  if (appeals === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" 
             style={{ borderTopColor: 'transparent', borderLeftColor: themeVar("primary"), borderRightColor: themeVar("primary"), borderBottomColor: themeVar("primary") }} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black tracking-tight uppercase italic flex items-center gap-3">
          <Scale className="text-secondary w-8 h-8" />
          User <span className="text-secondary">Appeals</span>
        </h2>
        <p className="text-muted-foreground font-medium">Review and adjudicate moderation dispute requests.</p>
      </div>

      <div className="grid gap-6">
        {appeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card/40 border border-dashed border-border/50 rounded-3xl gap-4">
            <ShieldCheck className="w-12 h-12 text-emerald-500/50" />
            <p className="text-muted-foreground font-bold italic tracking-wide uppercase">All clear! No pending appeals.</p>
          </div>
        ) : (
          appeals.map((appeal) => (
            <div 
              key={appeal._id}
              className={`bg-card/40 border border-border/50 rounded-2xl overflow-hidden hover:border-secondary/30 transition-all group ${resolvingId === appeal._id ? 'opacity-50 pointer-events-none grayscale' : ''}`}
            >
              <div className="flex flex-col lg:flex-row">
                {/* User Info & Original Action */}
                <div className="lg:w-72 p-6 bg-card/80 border-r border-border/50 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-foreground/5 border border-border/50">
                      {appeal.avatarUrl ? (
                        <img src={appeal.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <User size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold truncate text-foreground">@{appeal.username}</span>
                      <span className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Defendant</span>
                    </div>
                  </div>

                  <div className="space-y-2 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                    <div className="flex items-center gap-2">
                       <AlertOctagon size={12} className="text-red-500" />
                       <span className="text-[10px] font-black uppercase text-red-500">Original Action</span>
                    </div>
                    <p className="text-xs font-bold text-foreground/90 uppercase tracking-tight">{appeal.originalAction}</p>
                    <p className="text-[10px] text-muted-foreground italic border-l border-border/10 pl-2 leading-relaxed">
                      "{appeal.originalReason}"
                    </p>
                  </div>

                  <div className="mt-auto flex items-center gap-2 text-[10px] font-mono text-muted-foreground uppercase">
                    <Clock size={10} /> {new Date(appeal.createdAt).toLocaleString()}
                  </div>
                </div>

                {/* Appeal Content */}
                <div className="flex-1 p-6 flex flex-col gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={14} className="text-secondary" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Defense Statement</span>
                    </div>
                    <div className="bg-foreground/5 rounded-2xl p-5 border border-border/50 min-h-[100px]">
                      <p className="text-sm font-medium leading-relaxed italic text-foreground/90">
                        "{appeal.reason}"
                      </p>
                    </div>
                  </div>

                  {/* Administrative Notes */}
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Overseer Notes</label>
                     <textarea 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-secondary/50 transition-colors italic min-h-[80px]"
                        placeholder="Provide reasoning for your decision..."
                        value={adminNotes[appeal._id] || ""}
                        onChange={(e) => setAdminNotes({ ...adminNotes, [appeal._id]: e.target.value })}
                     />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/10">
                    <button 
                      onClick={() => handleResolve(appeal._id, "denied")}
                      disabled={resolvingId !== null}
                      className="px-6 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center gap-2"
                    >
                      <XCircle size={14} /> Deny Appeal
                    </button>
                    <button 
                      onClick={() => handleResolve(appeal._id, "approved")}
                      disabled={resolvingId !== null}
                      className="px-6 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                    >
                      <CheckCircle size={14} /> Approve & Reverse
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
