'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearSessionCookie } from '@/app/actions/auth';
import { ROLE_NAMES, canManageTeam } from '@/lib/permissions';
import type { EventChoice } from '@/lib/platformEvents';
import { EventAccessProvider, type MyEventAccess } from './eventAccess';
import { EventSwitcher } from './EventSwitcher';
import { auth } from '@/lib/firebase/client';
import { LayoutDashboard, Users, Gift, LogOut, Key, ClipboardList, Image as ImageIcon, Menu, X, UsersRound, PanelsTopLeft, CalendarRange, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

// The admin chrome (sidebar, mobile header) around every admin page. The
// server layout (layout.tsx) hands it the current event, the role in it and
// the account's events for the switcher; it re-renders on router.refresh()
// (sign-in, sign-out, the events list's actions) and on every full load
// (switching events goes through /admin/open/<eventId>).
export function AdminShell({ access, events, children }: { access: MyEventAccess | null; events: EventChoice[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isLoginPage = pathname === '/admin/login';

  // If on login page, don't show the layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await auth.signOut();
    await clearSessionCookie();
    router.refresh();
    router.push('/admin/login');
  };

  // The event's pages only when there is an event to show.
  const navItems = [
    { name: 'All Events', href: '/admin', icon: CalendarRange },
    ...(access
      ? [
          { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'Invites', href: '/admin/invites', icon: Key },
          { name: 'Guests', href: '/admin/guests', icon: Users },
          { name: 'Gifts', href: '/admin/gifts', icon: Gift },
          { name: 'Registry', href: '/admin/registry', icon: ClipboardList },
          { name: 'Content', href: '/admin/content', icon: ImageIcon },
          { name: 'Visual Builder', href: '/admin/builder', icon: PanelsTopLeft },
          ...(canManageTeam(access)
            ? [{ name: 'Team', href: '/admin/team', icon: UsersRound }, { name: 'Settings', href: '/admin/settings', icon: Settings }]
            : []),
        ]
      : []),
  ];

  return (
    <div className="h-screen overflow-hidden bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 flex transition-colors duration-200">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 
        flex flex-col transition-transform duration-300 ease-in-out h-screen
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-zinc-800 shrink-0">
          <span className="text-lg font-bold text-gray-900 dark:text-zinc-100">Admin Portal</span>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 -mr-2 text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {access && <EventSwitcher current={access.eventId} events={events} onNavigate={() => setIsMobileMenuOpen(false)} />}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                    : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-zinc-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        {access && (
          <p className="px-7 pt-3 text-xs text-gray-500 dark:text-zinc-400 truncate border-t border-gray-200 dark:border-zinc-800" title={access.email ?? undefined}>
            {ROLE_NAMES[access.role]}{access.email ? ` · ${access.email}` : ''}
          </p>
        )}
        <div className={`p-4 flex justify-between items-center gap-2 shrink-0 ${access ? '' : 'border-t border-gray-200 dark:border-zinc-800'}`}>
          <button
            onClick={handleLogout}
            className="flex flex-1 items-center gap-3 px-3 py-2 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* Mobile Header */}
        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between px-4 md:hidden transition-colors duration-200 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-lg font-bold text-gray-900 dark:text-zinc-100">Admin Portal</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={handleLogout} className="p-2 text-gray-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto w-full pb-24 md:pb-8">
            <EventAccessProvider value={access}>{children}</EventAccessProvider>
          </div>
        </div>
      </main>

    </div>
  );
}
