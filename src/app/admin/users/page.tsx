'use client';

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import {
  Users,
  Search,
  ShieldCheck,
  ShieldAlert,
  History,
  UserX,
  UserCheck,
  Ban,
  X,
  Zap,
  RotateCcw,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { themeVar } from "@/theme/registry";

export default function UsersManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<{ id: any, username: string } | null>(null);
  const users = useQuery(api.hub.overseer.listUsers, { searchQuery: searchQuery || undefined });
  const syncUserStatus = useMutation(api.hub.overseer.syncUserStatus);
  const warnUser = useMutation(api.hub.overseer.warnUser);

  const [warnUserTarget, setWarnUserTarget] = useState<{ id: any, username: string } | null>(null);
  const [warnReason, setWarnReason] = useState("");
  const [isWarning, setIsWarning] = useState(false);
  const { toast } = useToast();

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <section>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-4xl font-black tracking-tighter uppercase italic">
              User <span className="text-primary italic">Intelligence</span>
            </h2>
            <p className="text-muted-foreground font-medium tracking-wide">Audit and moderate platform users from the master registry.</p>
          </div>

          <div className="relative group w-full md:w-80">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-foreground/5 border border-border/50 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-primary/50 focus:bg-foreground/10 transition-all font-medium placeholder:text-muted-foreground/40"
            />
          </div>
        </div>
      </section>

      {/* Users Table */}
      <section className="bg-card/40 border border-border/50 rounded-[2.5rem] overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/10 bg-card/60">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">User Entity</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Reputation</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Authorization</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10 font-medium">
              {users === undefined ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Users size={32} className="text-muted-foreground animate-pulse" />
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground italic">Fetching encrypted user records...</p>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center text-muted-foreground">
                        <UserX size={32} />
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground italic">No biological signatures found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isRedacted = user.isBanned || user.suspensionStatus === 'suspensionStageActive';
                  const isRestricted = !isRedacted && (
                    user.suspensionStatus === 'suspensionStage1' ||
                    user.suspensionStatus === 'suspensionStageProfileUpdate' ||
                    user.suspensionStatus === 'suspensionStageAppeal' ||
                    user.suspensionStatus === 'suspensionStageAppealDenied'
                  );
                  const isStable = !isRedacted && !isRestricted;

                  return (
                    <tr key={user._id} className="group hover:bg-foreground/5 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-foreground/5 border border-border/50 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-110 transition-transform">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Users size={18} className="text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground uppercase tracking-tight line-clamp-1">{user.displayName || user.username}</span>
                            <span className="text-[10px] text-muted-foreground font-medium tracking-wide italic">@{user.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center items-center gap-2">
                          <Zap size={14} className={(user as any).socialScore < 9000 ? "text-amber-500" : "text-emerald-500"} />
                          <span className="text-sm font-black tabular-nums">{(user as any).socialScore}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center">
                          {user.overseeradmin ? (
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                              <ShieldCheck size={12} /> Overseer
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/5 border border-border/50 text-muted-foreground/60 text-[10px] font-black uppercase tracking-widest">
                              Citizen
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center">
                          <div className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isRedacted
                                ? "bg-destructive/10 border-destructive/20 text-destructive"
                                : isRestricted
                                  ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                            }`}>
                            {isRedacted ? <Ban size={12} /> : <UserCheck size={12} />}
                            {isRedacted ? "REDACTED" : isRestricted ? "RESTRICTED" : "STABLE"}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-end gap-2">
                           <ActionIcon
                            icon={ShieldAlert}
                            onClick={() => setWarnUserTarget({ id: user._id, username: user.username! })}
                            color="text-yellow-500"
                            label="Warn User"
                          />
                          <ActionIcon
                            icon={UserX}
                            onClick={() => { }}
                            color="text-destructive"
                            label="Suspend"
                          />
                          <ActionIcon
                            icon={RefreshCw}
                            onClick={() => syncUserStatus({ userId: user._id })}
                            label="Sync Status"
                          />
                          <ActionIcon
                            icon={History}
                            onClick={() => setSelectedUser({ id: user._id, username: user.username! })}
                            label="View Audit Logs"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Audit Logs Modal */}
      {selectedUser && (
        <UserLogsModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
        />
      )}

       {/* Warn Reason Modal */}
      {warnUserTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => !isWarning && setWarnUserTarget(null)} />
          <div className="relative w-full max-w-md bg-card border border-border/50 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-border/50 bg-card/60 flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-xl font-black tracking-tighter uppercase italic">
                  Issue <span className="text-yellow-500 italic">Warning</span>
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Target: @{warnUserTarget.username}</p>
              </div>
              <button onClick={() => !isWarning && setWarnUserTarget(null)} className="p-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-muted-foreground transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Violation Reason</label>
                <textarea
                  autoFocus
                  value={warnReason}
                  onChange={(e) => setWarnReason(e.target.value)}
                  placeholder="Reason for warning... (e.g. Toxicity, Spam)"
                  className="w-full bg-foreground/5 border border-border/50 rounded-xl p-4 text-sm outline-none focus:border-yellow-500/50 transition-all min-h-[120px] resize-none"
                />
              </div>
              <button
                disabled={!warnReason.trim() || isWarning}
                onClick={async () => {
                  setIsWarning(true);
                  try {
                    await warnUser({ userId: warnUserTarget.id, reason: warnReason });
                    toast({
                      title: "Warning Issued",
                      description: `Issued a formal warning to ${warnUserTarget.username}.`,
                    });
                  } catch (e) {
                    console.error(e);
                    toast({
                      title: "Action Failed",
                      description: "Failed to issue warning.",
                      variant: "destructive",
                    });
                  } finally {
                    setIsWarning(false);
                  }
                }}
                className="w-full py-4 bg-yellow-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-yellow-500/20"
              >
                {isWarning ? "Issuing..." : "Confirm Warning"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserLogsModal({ user, onClose }: { user: { id: any, username: string }, onClose: () => void }) {
  const logs = useQuery(api.hub.overseer.getUserLogs, { userId: user.id });
  const reverseAction = useMutation(api.hub.overseer.reverseAction);
  const [reversingId, setReversingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleReverse = async (logId: any) => {
    if (confirmingId !== logId) {
      setConfirmingId(logId);
      setTimeout(() => setConfirmingId(null), 3000);
      return;
    }
    
    setReversingId(logId);
    setConfirmingId(null);
    try {
      await reverseAction({ logId });
      toast({
        title: "Action Reversed",
        description: "The moderation action has been successfully undone.",
      });
    } catch (error) {
      console.error("Failed to reverse action:", error);
      toast({
        title: "Reverse Failed",
        description: "Failed to reverse action. See console.",
        variant: "destructive",
      });
    } finally {
      setReversingId(null);
    }
  };

  return (
     <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/60 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-card border border-border/50 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-border/50 bg-card/60 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-xl font-black tracking-tighter uppercase italic">
              Audit <span className="text-primary italic">Signature</span>
            </h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Security log for @{user.username}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {logs === undefined ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <ShieldAlert size={32} className="text-primary animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">Decrypting historical data...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
              <ShieldCheck size={48} className="text-muted-foreground" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">No security incidents recorded.</p>
            </div>
          ) : (
             <div className="space-y-4">
              {logs.map((log) => (
                <div key={log._id} className="group bg-card/40 border border-border/50 rounded-2xl p-4 flex gap-4 hover:bg-card/60 transition-all">
                  <div className="p-3 rounded-xl bg-foreground/5 text-primary group-hover:scale-110 transition-transform flex-shrink-0 self-start">
                    <ShieldAlert size={18} />
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-foreground/90 truncate mr-2">
                        {log.action}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed italic border-l-2 border-border/50 pl-3 my-1">
                      "{log.reason}"
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                        Authorized by <span className="text-foreground/80">@{log.adminName}</span>
                      </span>
                    </div>
                  </div>
                  {/* Reverse Action Button */}
                  <button
                    onClick={() => handleReverse(log._id)}
                    disabled={reversingId === log._id}
                    title="Reverse this action"
                    className={`self-center p-2 rounded-lg transition-all ${
                        confirmingId === log._id 
                        ? 'bg-orange-500 text-black font-bold' 
                        : 'bg-foreground/5 text-muted-foreground hover:bg-primary/20 hover:text-primary'
                      } disabled:opacity-50 disabled:cursor-not-allowed group/rev`}
                  >
                    {reversingId === log._id ? (
                      <RotateCcw size={14} className="animate-spin" />
                    ) : confirmingId === log._id ? (
                      <span className="text-[10px]">REVERSE?</span>
                    ) : (
                      <RotateCcw size={14} className="group-hover/rev:-rotate-90 transition-transform" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-8 py-4 bg-card/60 border-t border-border/10 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Close Feed
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionIcon({ icon: Icon, onClick, active, color, label }: { icon: any, onClick: () => void, active?: boolean, color?: string, label: string }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-2.5 rounded-xl border transition-all ${active
          ? `${color} bg-white/10 border-white/20 scale-105`
          : `text-muted-foreground bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 hover:text-white`
        }`}
    >
      <Icon size={16} />
    </button>
  );
}
