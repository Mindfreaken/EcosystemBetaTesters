'use client';

import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/Spinner";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { themeVar } from "@/theme/registry";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const user = useQuery(api.users.onboarding.queries.me);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/");
      return;
    }

    if (user !== undefined && user !== null) {
      if (user.role !== 'admin') {
        router.push("/home");
      }
    }
  }, [user, isAuthenticated, isAuthLoading, router]);

  // Loading state (Auth or User data)
  if (isAuthLoading || (isAuthenticated && user === undefined)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center motion-safe:animate-pulse">
           <div 
             className="w-8 h-8 rounded-lg bg-primary" 
             style={{ boxShadow: `0 0 15px ${themeVar("primary")}` }}
           />
        </div>
        <Spinner size="large" />
        <p className="text-muted-foreground text-sm font-medium tracking-wide italic">SECURE GATEWAY: VERIFYING ADMIN STATUS...</p>
      </div>
    );
  }

  // Unauthorized state (will redirect)
  if (!isAuthLoading && (!isAuthenticated || user === null || (user && user.role !== 'admin'))) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
         <div className="text-destructive font-black text-2xl tracking-[0.2em]">ACCESS DENIED</div>
         <p className="text-muted-foreground">Redirecting to safe zone...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background text-foreground font-sans selection:bg-primary/30">
      {/* Admin Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-border/5 bg-card/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-4 group cursor-default">
          <div 
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-black italic tracking-tighter transition-transform group-hover:scale-105"
            style={{ boxShadow: `0 0 20px ${themeVar("primary")}` }}
          >
            A
          </div>
          <div className="flex flex-col leading-none">
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">
              Ecosystem <span className="text-primary">Admin</span>
            </h1>
            <span className="text-[10px] font-bold tracking-[0.3em] text-secondary uppercase opacity-80 pl-1">Console</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            <Link 
              href="/admin" 
              className={`hover:text-primary transition-colors cursor-pointer border-b-2 pb-1 ${pathname === '/admin' ? 'text-primary border-primary' : 'border-transparent'}`}
            >
              Dashboard
            </Link>
            <Link 
              href="/admin/users" 
              className={`hover:text-primary transition-colors cursor-pointer border-b-2 pb-1 ${pathname.startsWith('/admin/users') ? 'text-primary border-primary' : 'border-transparent'}`}
            >
              Users
            </Link>
            <Link 
              href="/admin/reports" 
              className={`hover:text-primary transition-colors cursor-pointer border-b-2 pb-1 ${pathname === '/admin/reports' ? 'text-primary border-primary' : 'border-transparent'}`}
            >
              Reports
            </Link>
            <Link 
              href="/admin/appeals" 
              className={`hover:text-primary transition-colors cursor-pointer border-b-2 pb-1 ${pathname === '/admin/appeals' ? 'text-primary border-primary' : 'border-transparent'}`}
            >
              Appeals
            </Link>
            <button className="opacity-50 cursor-not-allowed">Logs</button>
          </nav>
          
          <div className="h-8 w-[1px] bg-border/20 mx-2" />

          {user && (
            <div className="flex items-center gap-3 bg-foreground/5 border border-border rounded-2xl px-4 py-2 hover:bg-foreground/10 transition-colors">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold leading-tight">{user.username}</span>
                <span className="text-[9px] font-black uppercase text-primary leading-none tracking-tighter">
                  {user.role === 'admin' ? "System Admin" : "Staff"}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Admin Main Body */}
      <main className="flex-1 overflow-auto relative custom-scrollbar">
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-8 py-10">
          {children}
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${themeVar("border")};
          opacity: 0.1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${themeVar("border")};
          opacity: 0.2;
        }
      `}</style>
    </div>
  );
}
