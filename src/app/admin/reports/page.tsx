'use client';

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ShieldAlert, User, MessageSquare, CheckCircle, XCircle, AlertTriangle, Hammer } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { themeVar } from "@/theme/registry";

function TargetUserHistory({ targetUserId }: { targetUserId: string }) {
    const history = useQuery(api.hub.overseer.getUserHistory, { userId: targetUserId as any });

    if (history === undefined) {
        return (
            <div className="flex justify-center p-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" 
                     style={{ borderTopColor: 'transparent', borderLeftColor: themeVar("primary"), borderRightColor: themeVar("primary"), borderBottomColor: themeVar("primary") }} />
            </div>
        );
    }

    if (history.length === 0) {
        return null;
    }

    return (
        <div className="mt-2 flex flex-col gap-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prior Action History</h3>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {history.map((entry, i) => (
                    <div key={i} className={`p-3 rounded-xl bg-card/40 border border-border/50 border-l-[3px] ${entry.type === 'action' ? 'border-l-orange-500' : 'border-l-blue-500'}`}>
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-foreground">{entry.title}</span>
                            <span className="text-[9px] text-muted-foreground">{new Date(entry.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[10px] text-foreground/70 italic leading-relaxed">{entry.reason}</p>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-[9px] text-muted-foreground">{entry.type === 'action' ? 'Admin Action' : 'Resolved Report'}</span>
                            <span className="text-[9px] font-bold text-primary">By: {entry.moderator}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function AdminReportsPage() {
  const reports = useQuery(api.hub.overseer.getReportFeed, {});
  const resolveReport = useMutation(api.hub.overseer.resolveReportDirectly);
  const { toast } = useToast();
  
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolvingReasons, setResolvingReasons] = useState<Record<string, string>>({});

  const handleResolve = async (reportId: any, action: "none" | "warn" | "suspend" | "ban" | "false_report" | "false_report_no_penalty") => {
    setResolvingId(reportId);
    try {
      const reason = resolvingReasons[reportId];
      await resolveReport({ reportId, action, reason });
      // Clear reason on success
      setResolvingReasons(prev => {
        const next = { ...prev };
        delete next[reportId];
        return next;
      });
      toast({
        title: "Report Resolved",
        description: "The moderation action has been applied.",
      });
    } catch (error) {
      console.error("Failed to resolve report:", error);
      toast({
        title: "Resolution Failed",
        description: "Error resolving report. Check console.",
        variant: "destructive",
      });
    } finally {
      setResolvingId(null);
    }
  };

  if (reports === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black tracking-tight uppercase italic flex items-center gap-3">
          <ShieldAlert className="text-primary w-8 h-8" />
          Pending <span className="text-primary">Reports</span>
        </h2>
        <p className="text-muted-foreground font-medium">Review and resolve community-flagged content.</p>
      </div>

      <div className="grid gap-4">
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card/40 border border-dashed border-border/50 rounded-3xl gap-4">
            <CheckCircle className="w-12 h-12 text-emerald-500/50" />
            <p className="text-muted-foreground font-bold italic tracking-wide uppercase">Clean air! No reports pending.</p>
          </div>
        ) : (
          reports.map((report) => (
            <div 
              key={report._id}
              className={`bg-card/40 border border-border/50 rounded-2xl overflow-hidden hover:border-primary/30 transition-all group ${resolvingId === report._id ? 'opacity-50 pointer-events-none grayscale' : ''}`}
            >
              <div className="flex flex-col md:flex-row">
                {/* Meta Section */}
                <div className="md:w-64 p-6 bg-card/80 border-r border-border/50 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                      {report.type === 'message' ? <MessageSquare size={16} /> : <User size={16} />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                      {report.type} Report
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Reporters ({report.reporters?.length || 1})</p>
                    <div className="max-h-24 overflow-y-auto space-y-2">
                      {(report.reporters || [report.reporter]).map((rep: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                          <p className="text-xs font-bold truncate">{rep?.username || "Anonymous"}</p>
                          {rep?.socialScore !== undefined && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-foreground/5 border border-border/50 w-fit">
                              <div className={`w-1.5 h-1.5 rounded-full ${rep.socialScore > 5000 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              <span className="text-[9px] font-black">{rep.socialScore} SC</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Target User</p>
                    <p className="text-xs font-bold truncate text-primary">{report.targetUser?.username || "Unknown"}</p>
                    {report.targetUser?.socialScore !== undefined && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-foreground/5 border border-border/50 w-fit">
                        <div className={`w-1.5 h-1.5 rounded-full ${report.targetUser.socialScore > 5000 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="text-[9px] font-black">{report.targetUser.socialScore} SC</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 text-[9px] font-mono text-muted-foreground uppercase">
                    {new Date(report.timestamp).toLocaleString()}
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-6 flex flex-col gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-bold text-amber-500 flex items-center gap-1">
                      <AlertTriangle size={10} /> Reason: {report.reason}
                    </p>
                    <div className="bg-foreground/5 rounded-xl p-4 border border-border/10">
                      <p className="text-sm font-medium leading-relaxed italic text-foreground/90">
                        "{report.content}"
                      </p>
                    </div>
                  </div>

                  {/* Target User History */}
                  {report.targetUser?._id && <TargetUserHistory targetUserId={report.targetUser._id} />}

                  {/* Resolution Input */}
                    <div className="mt-4 px-4 py-3 bg-white/[0.02] border border-white/5 rounded-xl">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Administrative Reason (Optional)</label>
                      <input 
                        type="text"
                        placeholder="Specify the reason for this action..."
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-primary/50 transition-colors italic text-white"
                        value={resolvingReasons[report._id] || ""}
                        onChange={(e) => setResolvingReasons({ ...resolvingReasons, [report._id]: e.target.value })}
                      />
                    </div>

                    <div className="mt-auto pt-4 flex flex-wrap gap-2">
                    <button 
                      className="px-4 py-2 rounded-xl bg-foreground/5 border border-border/10 text-[10px] font-black uppercase tracking-wider hover:bg-foreground/10 transition-colors flex items-center gap-2 group/btn"
                      onClick={() => handleResolve(report._id, "none")}
                      disabled={resolvingId !== null}
                    >
                      <XCircle size={12} className="text-muted-foreground group-hover/btn:text-foreground" />
                      <div className="flex flex-col items-start leading-none">
                        <span>Dismiss</span>
                        <span className="text-[8px] opacity-40 lowercase font-normal italic">0 impact</span>
                      </div>
                    </button>

                    <button 
                      className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-wider hover:bg-amber-500/20 transition-colors flex items-center gap-2 group/btn"
                      onClick={() => handleResolve(report._id, "false_report")}
                      disabled={resolvingId !== null}
                    >
                      <ShieldAlert size={12} className="text-amber-500/50 group-hover/btn:text-amber-500" />
                      <div className="flex flex-col items-start leading-none">
                        <span>False Report</span>
                        <span className="text-[8px] opacity-60 lowercase font-normal italic">-500 SC to Reporter</span>
                      </div>
                    </button>

                    <button 
                      className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-wider hover:bg-amber-500/20 transition-colors flex items-center gap-2 group/btn"
                      onClick={() => handleResolve(report._id, "false_report_no_penalty")}
                      disabled={resolvingId !== null}
                    >
                      <ShieldAlert size={12} className="text-amber-500/50 group-hover/btn:text-amber-500" />
                      <div className="flex flex-col items-start leading-none">
                        <span>False Report</span>
                        <span className="text-[8px] opacity-60 lowercase font-normal italic">0 impact to Reporter</span>
                      </div>
                    </button>

                    <div className="w-px h-8 bg-border/20 mx-1 self-center" />

                    <button 
                      className="px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-wider hover:bg-orange-500/20 transition-colors flex items-center gap-2"
                      onClick={() => handleResolve(report._id, "warn")}
                      disabled={resolvingId !== null}
                    >
                      <AlertTriangle size={12} />
                      <div className="flex flex-col items-start leading-none">
                        <span>Warn Target</span>
                        <span className="text-[8px] opacity-60 lowercase font-normal italic">-250 SC</span>
                      </div>
                    </button>
                    <button 
                      className="px-4 py-2 rounded-xl bg-orange-600/10 border border-orange-600/20 text-orange-600 text-[10px] font-black uppercase tracking-wider hover:bg-orange-600/20 transition-colors flex items-center gap-2"
                      onClick={() => handleResolve(report._id, "suspend")}
                      disabled={resolvingId !== null}
                    >
                      <Hammer size={12} />
                      <div className="flex flex-col items-start leading-none">
                        <span>Suspend Target</span>
                        <span className="text-[8px] opacity-60 lowercase font-normal italic">-1000 SC</span>
                      </div>
                    </button>
                    <button 
                      className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-wider hover:bg-red-500/20 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                      onClick={() => handleResolve(report._id, "ban")}
                      disabled={resolvingId !== null}
                    >
                      <ShieldAlert size={12} />
                      <div className="flex flex-col items-start leading-none">
                        <span>PERMABAN</span>
                        <span className="text-[8px] opacity-60 lowercase font-normal italic">-10000 SC</span>
                      </div>
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
