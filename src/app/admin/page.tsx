'use client';

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  Users, 
  ShieldAlert, 
  Activity, 
  Database,
  ArrowUpRight,
  UserCheck,
  UserX
} from "lucide-react";
import { themeVar } from "@/theme/registry";

export default function AdminDashboard() {
  const statsData = useQuery(api.hub.overseer.getDashboardStats, {});
  const activityFeed = useQuery(api.hub.overseer.getAdminActivityFeed, { limit: 5 });
  
  const stats = [
    {
      label: "Total Users",
      value: statsData?.totalUsers ?? "...",
      icon: Users,
      trend: "Active",
      color: "text-primary",
      bg: "bg-primary/10"
    },
    {
      label: "Reports Pending",
      value: statsData?.pendingReports ?? "...",
      icon: ShieldAlert,
      trend: statsData && statsData.pendingReports > 0 ? "Action Req" : "Clean",
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    },
    {
      label: "System Health",
      value: statsData?.systemHealth ?? "...",
      icon: Activity,
      trend: "Optimal",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
    {
      label: "Database Usage",
      value: statsData?.databaseUsage ?? "...",
      icon: Database,
      trend: "Estimated",
      color: "text-secondary",
      bg: "bg-secondary/10"
    }
  ];

  return (
    <div className="space-y-12">
      {/* Welcome Section */}
      <section>
        <div className="flex flex-col gap-1">
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">
            Console <span className="text-primary italic">Overview</span>
          </h2>
          <p className="text-muted-foreground font-medium tracking-wide">Monitor and manage the Ecosystem network from the central hub.</p>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="relative group overflow-hidden bg-card/40 border border-border/50 rounded-3xl p-6 transition-all hover:bg-card/60 hover:border-border hover:-translate-y-1">
            <div className={`p-3 rounded-2xl w-fit ${stat.bg} ${stat.color} mb-4 transition-transform group-hover:scale-110`}>
              <stat.icon size={24} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60">{stat.label}</span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black tracking-tighter">{stat.value}</span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-foreground/5 ${stat.trend === 'Optimal' ? 'text-emerald-400' : 'text-primary'}`}>
                  {stat.trend}
                </span>
              </div>
            </div>
            {/* Decoration */}
            <div className={`absolute -bottom-6 -right-6 w-24 h-24 ${stat.bg} blur-[40px] rounded-full opacity-50 group-hover:opacity-80 transition-opacity`} />
          </div>
        ))}
      </section>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-8">

        {/* Placeholder for Recent Activity */}
        <section className="space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-lg font-black uppercase tracking-widest italic flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-secondary" />
                Live <span className="text-secondary">Network Feed</span>
              </h3>
              <button className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-colors flex items-center gap-2">
                View Full Logs <ArrowUpRight size={14} />
              </button>
           </div>

           <div className="space-y-3">
              {activityFeed === undefined ? (
                <div className="bg-card/40 border border-border/50 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 text-center min-h-[300px] border-dashed">
                  <Activity size={24} className="animate-pulse text-muted-foreground" />
                  <p className="font-bold text-muted-foreground/50 italic uppercase tracking-widest text-xs">Fetching Network Activity...</p>
                </div>
              ) : activityFeed.length === 0 ? (
                <div className="bg-card/40 border border-border/50 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 text-center min-h-[300px] border-dashed">
                   <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center text-muted-foreground">
                     <Activity size={24} />
                   </div>
                   <div className="flex flex-col gap-1">
                     <p className="font-bold text-muted-foreground/50 italic uppercase tracking-widest">No Recent Activity</p>
                     <p className="text-xs text-muted-foreground max-w-[280px]">As users interact with the platform, administrative logs will appear here in real-time.</p>
                   </div>
                </div>
              ) : (
                activityFeed.map((activity: any) => (
                  <div key={activity.id} className="group bg-card/40 border border-border/50 rounded-2xl p-4 flex items-center gap-4 hover:bg-card/60 transition-all">
                    <div className="p-2 rounded-lg bg-foreground/5 text-muted-foreground group-hover:text-primary transition-colors">
                      <ShieldAlert size={16} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-tight text-foreground/90">
                          {activity.action} applied to {activity.targetUser}
                        </span>
                        <span className="text-[10px] text-muted-foreground">• {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{activity.description}</p>
                    </div>
                  </div>
                ))
              )}
           </div>
        </section>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, description, color }: { icon: any, label: string, description: string, color?: string }) {
  return (
    <button className="group flex items-center gap-4 p-4 rounded-2xl bg-card/20 border border-border/50 hover:bg-card/40 hover:border-border transition-all text-left w-full">
      <div className={`p-3 rounded-xl bg-foreground/5 ${color || 'text-foreground'} group-hover:scale-110 transition-transform`}>
        <Icon size={20} />
      </div>
      <div className="flex flex-col">
        <span className={`text-sm font-black uppercase tracking-tight ${color || 'text-foreground'}`}>{label}</span>
        <span className="text-[10px] text-muted-foreground font-medium">{description}</span>
      </div>
      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity pr-2">
        <ArrowUpRight size={18} className="text-muted-foreground" />
      </div>
    </button>
  );
}
