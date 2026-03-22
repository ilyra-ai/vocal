import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Mic2, LayoutDashboard, History, User, MessageSquare, Music } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Painel", href: "/" },
    { icon: Mic2, label: "Estúdio", href: "/studio" },
    { icon: History, label: "Sessões", href: "/sessions" },
    { icon: User, label: "Perfil", href: "/profile" },
    { icon: MessageSquare, label: "Coach IA", href: "/chat" },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-sidebar-border bg-sidebar flex flex-col shrink-0 relative z-20">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <Music className="w-6 h-6 text-primary mr-3" />
          <span className="font-display font-bold text-xl tracking-tight text-white">
            Vocal<span className="text-primary">Coach</span>
          </span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5 mr-3 transition-transform", isActive ? "scale-110" : "group-hover:scale-110")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center p-3 rounded-xl bg-sidebar-accent/50">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 mr-3 overflow-hidden">
              <img src={`${import.meta.env.BASE_URL}images/avatar-placeholder.png`} alt="Usuário" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Artista Vocal</p>
              <p className="text-xs text-sidebar-foreground/60">Plano Pro</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-96 bg-primary/5 blur-[120px] pointer-events-none -z-10 rounded-full mix-blend-screen translate-y-[-50%]" />
        
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
