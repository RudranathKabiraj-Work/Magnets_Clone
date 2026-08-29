"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, FolderOpen, Users, Sliders, Palette, User, CircleHelp, Menu, X, Search, ChevronRight, HelpCircle, Sun, Moon, Bug, Lightbulb, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import ThemeToggle from "@/components/theme-toggle";
import BrandLogo from "@/components/brand";
import type { Account } from "@/lib/data";

const mobileNav = [
  { href: "/dashboard/pages", label: "Lead magnets", icon: FileText },
  { href: "/dashboard/resources", label: "Hosted resources", icon: FolderOpen },
  { href: "/dashboard/leads", label: "Signups", icon: Users },
  { href: "/dashboard/setup", label: "Workspace setup", icon: Sliders },
  { href: "/dashboard/brand", label: "Brand", icon: Palette },
  { href: "/dashboard/settings", label: "Account", icon: User },
  { href: "/dashboard/help", label: "Help", icon: CircleHelp, isModal: true },
];

export default function DashboardShell({
  account,
  title,
  children,
}: {
  account: Account;
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(typeof document !== "undefined" && document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    document.documentElement.style.colorScheme = next ? "dark" : "light";
    try {
      localStorage.setItem("magnets-theme", next ? "dark" : "light");
    } catch (_) {}
  };

  const handleLogout = () => {
    router.push("/login");
  };

  const helpTopics = {
    learn: {
      title: "LEARN",
      count: "4 topics",
      items: ["What is a lead magnet?", "Why use a lead magnet?", "How do they work?", "What works best"],
    },
    build: {
      title: "BUILD",
      count: "7 topics",
      items: [
        "Create your first lead magnet",
        "Edit and publish a magnet",
        "Hosted resources",
        "Brand colours and logo",
        "Delivery emails",
        "Follow-up sequences",
        "After-signup experience",
      ],
    },
    setup: {
      title: "SET UP",
      count: "4 topics",
      items: ["Workspace setup", "Custom domains", "Send from my email", "Legal links"],
    },
    connections: {
      title: "CONNECTIONS",
      count: "6 topics",
      items: [
        "Beehiiv and Substack",
        "Connect Kit",
        "Connect Slack",
        "Connect Zapier",
        "Connect Pipedrive",
        "Connect a calendar",
      ],
    },
    manage: {
      title: "MANAGE",
      count: "4 topics",
      items: ["Manage signups", "Analytics and A/B tests", "Account settings", "Video walkthrough"],
    },
  };

  const allTopicsList = [
    ...helpTopics.learn.items,
    ...helpTopics.build.items,
    ...helpTopics.setup.items,
    ...helpTopics.connections.items,
    ...helpTopics.manage.items,
  ];

  const filteredTopics = searchQuery
    ? allTopicsList.filter((item) => item.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="dashboard-canvas flex min-h-screen">
      {/* Click outside to close profile menu */}
      {showProfileMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
      )}

      <aside className="shadow-sm hidden h-screen w-60 shrink-0 flex-col border-r border-[#1B1B1F] bg-[#0E0E10] text-[#9B9085] sticky top-0 md:flex z-40">
        <div className="flex h-12 shrink-0 items-center border-b border-[#1B1B1F] px-4 dark">
          <Link href="/" aria-label="Magnets home">
            <BrandLogo height="h-7" width="w-40" />
          </Link>
        </div>
        <nav className="mt-4 flex-1 space-y-1.5 px-3" aria-label="Dashboard">
          {mobileNav.map((item, idx) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const isDividerAfter = idx === 2; // Divider after Signups

            const linkClass = `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-[#221B17] text-white font-semibold"
                : "text-[#9B9085] hover:bg-[#1C1613] hover:text-white"
            }`;

            if (item.isModal) {
              return (
                <div key={item.href}>
                  <button
                    onClick={() => setShowHelp(true)}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition text-[#9B9085] hover:bg-[#1C1613] hover:text-white"
                  >
                    <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-[#9B9085]"}`} aria-hidden="true" />
                    {item.label}
                  </button>
                  {isDividerAfter && <div className="my-3 border-t border-[#1B1B1F]" />}
                </div>
              );
            }

            return (
              <div key={item.href}>
                <Link href={item.href} className={linkClass}>
                  <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-[#9B9085]"}`} aria-hidden="true" />
                  {item.label}
                </Link>
                {isDividerAfter && <div className="my-3 border-t border-[#1B1B1F]" />}
              </div>
            );
          })}
        </nav>
        <div className="relative border-t border-[#1B1B1F] px-3 py-4">
          {/* Profile Popover Menu */}
          {showProfileMenu && (
            <div className="absolute bottom-16 left-3 w-52 rounded-lg border border-[#1B1B1F] bg-[#121214] p-1 shadow-lg z-50 text-white flex flex-col gap-0.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-semibold text-ink-300 hover:bg-[#1B1B1F] hover:text-white transition w-full"
              >
                {dark ? (
                  <>
                    <Sun className="h-4 w-4 text-[#9B9085]" /> Light mode
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 text-[#9B9085]" /> Dark mode
                  </>
                )}
              </button>
              <button
                onClick={() => alert("Redirecting to bug report page...")}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-semibold text-ink-300 hover:bg-[#1B1B1F] hover:text-white transition w-full"
              >
                <Bug className="h-4 w-4 text-[#9B9085]" /> Report a bug
              </button>
              <button
                onClick={() => alert("Redirecting to feature request page...")}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-semibold text-ink-300 hover:bg-[#1B1B1F] hover:text-white transition w-full"
              >
                <Lightbulb className="h-4 w-4 text-[#9B9085]" /> Request a feature
              </button>
              <div className="border-t border-[#1B1B1F] my-1" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-semibold text-red-400 hover:bg-[#1B1B1F] transition w-full"
              >
                <LogOut className="h-4 w-4 text-red-400" /> Logout
              </button>
            </div>
          )}

          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 px-1 py-1 w-full text-left rounded-md hover:bg-[#121214] transition cursor-pointer"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#18181B] text-xs font-semibold text-white">
              {account.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || account.name.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{account.name}</p>
              <p className="truncate text-[10px] text-[#9B9085]">{account.email}</p>
            </div>
          </button>
        </div>
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-ink-950/40 backdrop-blur-sm md:hidden" onClick={() => setMenuOpen(false)}>
          <div
            className="dashboard-chrome flex h-full w-72 flex-col bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <BrandLogo height="h-7" width="w-40" />
              <button
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-ink-200 text-ink-700"
                onClick={() => setMenuOpen(false)}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <nav className="space-y-1" aria-label="Dashboard">
              {mobileNav.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                if (item.isModal) {
                  return (
                    <button
                      key={item.href}
                      onClick={() => {
                        setMenuOpen(false);
                        setShowHelp(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition text-ink-700 hover:bg-ink-100 hover:text-ink-950"
                    >
                      <item.icon className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                      {item.label}
                    </button>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-ink-950 text-white"
                        : "text-ink-700 hover:bg-ink-100 hover:text-ink-950"
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="dashboard-chrome sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between border-b border-ink-200 bg-white px-4 sm:px-6 md:hidden">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-ink-200 text-ink-700 md:hidden"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>
            <h1 className="text-sm font-semibold text-ink-950 sm:text-base">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelp(true)}
              className="flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-medium text-ink-600 transition hover:text-ink-950"
            >
              <CircleHelp className="h-4 w-4" aria-hidden="true" />
              Help
            </button>
            <ThemeToggle />
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange text-sm font-bold text-white">
              {account.name.charAt(0)}
            </span>
          </div>
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Help Centre Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" onClick={() => setShowHelp(false)}>
          <div
            className="relative w-full max-w-3xl rounded-xl border border-ink-800 bg-ink-950 text-white shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-ink-800/80 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded bg-brand-orange text-white">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Help centre</h3>
                  <p className="text-[11px] text-ink-400 mt-0.5">Learn the basics or find your next step.</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="rounded-lg p-1 text-ink-400 hover:bg-ink-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-5 border-b border-ink-800/80 bg-ink-900/40">
              <div className="relative flex items-center rounded-md border border-ink-800 bg-ink-950 px-3 focus-within:border-ink-700">
                <Search className="h-4 w-4 text-ink-500 mr-2" />
                <input
                  type="text"
                  placeholder="Search topics, integrations, or setup"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent py-2 text-xs text-white outline-none placeholder-ink-600 focus:ring-0"
                />
              </div>
            </div>

            {/* Modal Scroll Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {searchQuery ? (
                <div>
                  <p className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-3">Search Results</p>
                  {filteredTopics.length === 0 ? (
                    <p className="text-xs text-ink-500 py-4 text-center">No topics match your search query.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {filteredTopics.map((topic) => (
                        <button
                          key={topic}
                          onClick={() => alert(`Showing details for: ${topic}`)}
                          className="flex items-center justify-between rounded-lg bg-ink-900/50 hover:bg-ink-800/60 p-3 text-left transition"
                        >
                          <span className="text-xs font-medium text-ink-200">{topic}</span>
                          <ChevronRight className="h-3 w-3 text-ink-500" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Left Column (LEARN, SET UP, MANAGE) */}
                  <div className="space-y-6">
                    {/* LEARN */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-ink-500 uppercase tracking-wider mb-2.5">
                        <span>{helpTopics.learn.title}</span>
                        <span>{helpTopics.learn.count}</span>
                      </div>
                      <div className="space-y-1.5">
                        {helpTopics.learn.items.map((topic) => (
                          <button
                            key={topic}
                            onClick={() => alert(`Help topic: ${topic}`)}
                            className="flex w-full items-center justify-between rounded-lg bg-ink-900/40 hover:bg-ink-800/50 p-2.5 text-left text-xs font-medium text-ink-300 transition"
                          >
                            <span>{topic}</span>
                            <ChevronRight className="h-3.5 w-3.5 text-ink-600" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* SET UP */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-ink-500 uppercase tracking-wider mb-2.5">
                        <span>{helpTopics.setup.title}</span>
                        <span>{helpTopics.setup.count}</span>
                      </div>
                      <div className="space-y-1.5">
                        {helpTopics.setup.items.map((topic) => (
                          <button
                            key={topic}
                            onClick={() => alert(`Help topic: ${topic}`)}
                            className="flex w-full items-center justify-between rounded-lg bg-ink-900/40 hover:bg-ink-800/50 p-2.5 text-left text-xs font-medium text-ink-300 transition"
                          >
                            <span>{topic}</span>
                            <ChevronRight className="h-3.5 w-3.5 text-ink-600" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* MANAGE */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-ink-500 uppercase tracking-wider mb-2.5">
                        <span>{helpTopics.manage.title}</span>
                        <span>{helpTopics.manage.count}</span>
                      </div>
                      <div className="space-y-1.5">
                        {helpTopics.manage.items.map((topic) => (
                          <button
                            key={topic}
                            onClick={() => alert(`Help topic: ${topic}`)}
                            className="flex w-full items-center justify-between rounded-lg bg-ink-900/40 hover:bg-ink-800/50 p-2.5 text-left text-xs font-medium text-ink-300 transition"
                          >
                            <span>{topic}</span>
                            <ChevronRight className="h-3.5 w-3.5 text-ink-600" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column (BUILD, CONNECTIONS) */}
                  <div className="space-y-6">
                    {/* BUILD */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-ink-500 uppercase tracking-wider mb-2.5">
                        <span>{helpTopics.build.title}</span>
                        <span>{helpTopics.build.count}</span>
                      </div>
                      <div className="space-y-1.5">
                        {helpTopics.build.items.map((topic) => (
                          <button
                            key={topic}
                            onClick={() => alert(`Help topic: ${topic}`)}
                            className="flex w-full items-center justify-between rounded-lg bg-ink-900/40 hover:bg-ink-800/50 p-2.5 text-left text-xs font-medium text-ink-300 transition"
                          >
                            <span>{topic}</span>
                            <ChevronRight className="h-3.5 w-3.5 text-ink-600" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* CONNECTIONS */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-ink-500 uppercase tracking-wider mb-2.5">
                        <span>{helpTopics.connections.title}</span>
                        <span>{helpTopics.connections.count}</span>
                      </div>
                      <div className="space-y-1.5">
                        {helpTopics.connections.items.map((topic) => (
                          <button
                            key={topic}
                            onClick={() => alert(`Help topic: ${topic}`)}
                            className="flex w-full items-center justify-between rounded-lg bg-ink-900/40 hover:bg-ink-800/50 p-2.5 text-left text-xs font-medium text-ink-300 transition"
                          >
                            <span>{topic}</span>
                            <ChevronRight className="h-3.5 w-3.5 text-ink-600" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}