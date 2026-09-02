"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, FolderOpen, Users, Sliders, Palette, User, CircleHelp, Menu, X, Search, ChevronRight, HelpCircle, Sun, Moon, Bug, Lightbulb, LogOut, BookOpen, Gift, Compass, Send, GitFork, Calendar, Settings, Globe, Mail, Share2, Cpu, Slack, Zap, Link as LinkIcon, BarChart3, PlayCircle, CheckCircle2, ArrowLeft, Sparkles, Rocket, ExternalLink, ListChecks } from "lucide-react";
import { useState, useEffect } from "react";
import ThemeToggle from "@/components/theme-toggle";
import BrandLogo from "@/components/brand";
import type { Account } from "@/lib/data";

const mobileNav = [
  { href: "/dashboard/leadmagnets", label: "Lead magnets", icon: FileText },
  { href: "/dashboard/hostresources", label: "Hosted resources", icon: FolderOpen },
  { href: "/dashboard/signups", label: "Signups", icon: Users },
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
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dark, setDark] = useState(false);
  const [showCreateMagnetModal, setShowCreateMagnetModal] = useState(false);
  const [createMagnetName, setCreateMagnetName] = useState("");

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
    } catch (_) { }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUserEmail");
      localStorage.removeItem("currentUserAccount");
    }
    router.push("/login");
  };

  const helpTopics = {
    learn: {
      title: "LEARN",
      count: "4 topics",
      items: [
        { text: "What is a lead magnet?", icon: "BookOpen" },
        { text: "Why use a lead magnet?", icon: "Gift" },
        { text: "How do they work?", icon: "Sliders" },
        { text: "What works best?", icon: "Lightbulb" },
      ],
    },
    build: {
      title: "BUILD",
      count: "7 topics",
      items: [
        { text: "Create your first lead magnet", icon: "Compass" },
        { text: "Edit and publish a magnet", icon: "FileText" },
        { text: "Hosted resources", icon: "FolderOpen" },
        { text: "Brand colours and logo", icon: "Palette" },
        { text: "Delivery emails", icon: "Send" },
        { text: "Follow-up sequences", icon: "GitFork" },
        { text: "After-signup experience", icon: "Calendar" },
      ],
    },
    setup: {
      title: "SET UP",
      count: "4 topics",
      items: [
        { text: "Workspace setup", icon: "Settings" },
        { text: "Custom domains", icon: "Globe" },
        { text: "Send from my email", icon: "Mail" },
        { text: "Legal links", icon: "BookOpen" },
      ],
    },
    connections: {
      title: "CONNECTIONS",
      count: "6 topics",
      items: [
        { text: "Beehiiv and Substack", icon: "Share2" },
        { text: "Connect Kit", icon: "Cpu" },
        { text: "Connect Slack", icon: "Slack" },
        { text: "Connect Zapier", icon: "Zap" },
        { text: "Connect Pipedrive", icon: "Link" },
        { text: "Connect a calendar", icon: "Calendar" },
      ],
    },
    manage: {
      title: "MANAGE",
      count: "4 topics",
      items: [
        { text: "Manage signups", icon: "Users" },
        { text: "Analytics and A/B tests", icon: "BarChart3" },
        { text: "Account settings", icon: "User" },
        { text: "Video walkthrough", icon: "PlayCircle" },
      ],
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
    ? allTopicsList.filter((item) => item.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="dashboard-canvas flex min-h-screen">
      {/* Click outside to close profile menu */}
      {showProfileMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
      )}

      <aside className="shadow-sm hidden h-screen w-[14.5rem] shrink-0 flex-col border-r border-[#e4e4e7] bg-white text-zinc-600 sticky top-0 md:flex z-40 dark:border-white/10 dark:bg-[#18181B] dark:text-[#9B9085]">
        <div className="flex h-12 shrink-0 items-center border-b border-[#e4e4e7] px-4 dark:border-white/10">
          <Link href="/dashboard/setup" aria-label="Workspace setup">
            <BrandLogo height="h-5" width="w-[7.5rem]" />
          </Link>
        </div>
        <nav className="mt-4 flex-1 space-y-1.5 px-3" aria-label="Dashboard">
          {mobileNav.map((item, idx) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const isDividerAfter = idx === 2; // Divider after Signups

            const linkClass = `group flex items-center gap-1.5 rounded-md pl-2 pr-3 py-2 text-sm font-medium transition ${active
              ? "bg-[#FFF0EA] text-[#1c1c1f] font-semibold dark:bg-[#FE6F34]/15 dark:text-white"
              : "text-[#666666] hover:bg-zinc-100 hover:text-black dark:text-[#9B9085] dark:hover:bg-[#25252a] dark:hover:text-white"
              }`;

            if (item.isModal) {
              return (
                <div key={item.href}>
                  <button
                    onClick={() => setShowHelp(true)}
                    className="group flex w-full items-center gap-1.5 rounded-md pl-2 pr-3 py-2 text-sm font-medium transition text-[#666666] hover:bg-zinc-100 hover:text-black dark:text-[#9B9085] dark:hover:bg-[#25252a] dark:hover:text-white"
                  >
                    <item.icon className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-[#FE6F34] dark:text-white" : "text-[#888888] group-hover:text-black dark:text-[#9B9085] dark:group-hover:text-white"}`} aria-hidden="true" />
                    {item.label}
                  </button>
                  {isDividerAfter && <div className="my-3 border-t border-[#e4e4e7] dark:border-white/10" />}
                </div>
              );
            }

            return (
              <div key={item.href}>
                <Link href={item.href} className={linkClass}>
                  <item.icon className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-[#FE6F34] dark:text-white" : "text-[#888888] group-hover:text-black dark:text-[#9B9085] dark:group-hover:text-white"}`} aria-hidden="true" />
                  {item.label}
                </Link>
                {isDividerAfter && <div className="my-3 border-t border-[#e4e4e7] dark:border-white/10" />}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-[#e4e4e7] px-2.5 py-2 dark:border-white/10">
          <div className="relative">
            {/* Profile Popover Menu */}
            {showProfileMenu && (
              <div className="absolute bottom-full mb-2 left-0 w-52 rounded-xl border border-[#e4e4e7] bg-white p-1.5 shadow-2xl z-50 text-zinc-900 flex flex-col gap-0.5 animate-in fade-in slide-in-from-bottom-2 duration-150 dark:border-[#2e2e38] dark:bg-[#1a1a1e] dark:text-white">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-black transition w-full dark:text-ink-300 dark:hover:bg-[#26262B] dark:hover:text-white"
                >
                  {dark ? (
                    <>
                      <Sun className="h-4 w-4 text-[#888888] dark:text-[#9B9085]" /> Light mode
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 text-[#888888] dark:text-[#9B9085]" /> Dark mode
                    </>
                  )}
                </button>
                <a
                  href="mailto:hello@magnets.so?subject=Bug%20Report"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-black transition w-full dark:text-ink-300 dark:hover:bg-[#26262B] dark:hover:text-white"
                >
                  <Bug className="h-4 w-4 text-[#888888] dark:text-[#9B9085]" /> Report a bug
                </a>
                <a
                  href="mailto:hello@magnets.so?subject=Feature%20Request"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-black transition w-full dark:text-ink-300 dark:hover:bg-[#26262B] dark:hover:text-white"
                >
                  <Lightbulb className="h-4 w-4 text-[#888888] dark:text-[#9B9085]" /> Request a feature
                </a>
                <div className="border-t border-[#e4e4e7] my-1 dark:border-white/10" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 transition w-full dark:text-red-400 dark:hover:bg-[#26262B]"
                >
                  <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" /> Logout
                </button>
              </div>
            )}

            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`flex items-center gap-2.5 px-2 py-1.5 w-full text-left rounded-lg transition-colors cursor-pointer ${showProfileMenu ? "bg-zinc-100 dark:bg-[#26262B]" : "hover:bg-zinc-100 dark:hover:bg-[#26262B]"
                }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-white dark:bg-[#121214]" suppressHydrationWarning>
                {mounted
                  ? (account.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || account.name.charAt(0))
                  : (account.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "RK")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-zinc-900 leading-tight dark:text-white" suppressHydrationWarning>{account.name}</p>
                <p className="truncate text-[10px] text-zinc-500 leading-tight mt-0.5 dark:text-[#9B9085]" suppressHydrationWarning>{account.email}</p>
              </div>
            </button>
          </div>
        </div>
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setMenuOpen(false)}>
          <div
            className="flex h-full w-72 flex-col bg-[#18181B] border-r border-white/10 p-4 text-[#9B9085]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
              <Link href="/dashboard/setup" aria-label="Workspace setup" onClick={() => setMenuOpen(false)}>
                <BrandLogo height="h-6" width="w-[8.5rem]" />
              </Link>
              <button
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-[#9B9085] hover:bg-[#1C1613] hover:text-white transition"
                onClick={() => setMenuOpen(false)}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <nav className="space-y-1.5" aria-label="Dashboard">
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
                      className="flex w-full items-center gap-1.5 rounded-md pl-2 pr-3 py-2 text-sm font-medium transition text-[#9B9085] hover:bg-[#FE6F34]/8 hover:text-white"
                    >
                      <item.icon className="h-4 w-4 shrink-0 text-[#9B9085]" aria-hidden="true" />
                      {item.label}
                    </button>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-1.5 rounded-md pl-2 pr-3 py-2 text-sm font-medium transition ${active
                      ? "bg-[#FE6F34]/15 text-white font-semibold"
                      : "text-[#9B9085] hover:bg-[#FE6F34]/8 hover:text-white"
                      }`}
                  >
                    <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-[#9B9085]"}`} aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-[#FAFAFA] dark:bg-[#0E0E10]">
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
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FE6F34] text-sm font-bold text-white transition active:scale-95 cursor-pointer"
              >
                {account.name.charAt(0).toUpperCase()}
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 top-10 w-52 rounded-xl border border-[#2e2e38] bg-[#1a1a1e] p-1.5 shadow-2xl z-50 text-white flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-semibold hover:bg-[#26262B] hover:text-white transition w-full"
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
                  <a
                    href="mailto:hello@magnets.so?subject=Bug%20Report"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-semibold hover:bg-[#26262B] hover:text-white transition w-full"
                  >
                    <Bug className="h-4 w-4 text-[#9B9085]" /> Report a bug
                  </a>
                  <a
                    href="mailto:hello@magnets.so?subject=Feature%20Request"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-semibold hover:bg-[#26262B] hover:text-white transition w-full"
                  >
                    <Lightbulb className="h-4 w-4 text-[#9B9085]" /> Request a feature
                  </a>
                  <div className="border-t border-white/10 my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-semibold text-red-400 hover:bg-[#26262B] transition w-full"
                  >
                    <LogOut className="h-4 w-4 text-red-400" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1 bg-[#FAFAF8] dark:bg-[#0E0E10]">{children}</main>
      </div>



      {/* Help Centre Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-3 md:p-4 transition-all duration-200"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="relative w-full max-w-4xl h-[94vh] max-h-[96vh] rounded-2xl border border-[#E5E3DD] bg-white text-zinc-900 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 dark:border-[#2e2e38] dark:bg-[#18181c] dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E5E3DD] dark:border-[#2e2e38] px-6 py-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FE6F34] text-black shadow-sm">
                  <ListChecks className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Help centre</h3>
                  <p className="text-[11px] text-zinc-500 dark:text-[#9B9085] mt-0.5">Learn the basics or find your next step.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowHelp(false);
                  setSelectedTopic(null);
                }}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:text-[#9B9085] dark:hover:bg-[#25252b] dark:hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Sub-header navigation when inside a topic */}
            {selectedTopic && (
              <div className="flex items-center justify-between border-b border-[#E5E3DD] dark:border-[#2e2e38] bg-transparent px-6 py-2.5">
                <button
                  onClick={() => setSelectedTopic(null)}
                  className="flex items-center gap-2.5 rounded-lg bg-transparent px-4 py-2 ml-6 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-[#d4c8bc] dark:hover:bg-[#282830] dark:hover:text-white transition-all"
                >
                  <ArrowLeft className="h-4 w-4 text-[#9B9085]" />
                  <span>All help topics</span>
                </button>
                <span className="text-xs font-bold uppercase tracking-wider text-[#666675] mr-4">LEARN</span>
              </div>
            )}

            {/* Modal Scroll Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6" data-lenis-prevent>
              {selectedTopic === "Video walkthrough" ? (
                <div className="max-w-[42rem] mx-auto space-y-6 py-2">
                  {/* Header: WATCH THE FULL FLOW */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#9B9085] uppercase tracking-wider">WATCH THE FULL FLOW</p>
                      <h2 className="text-2xl font-bold text-white leading-tight mt-1">Platform walkthrough</h2>
                    </div>

                    <a
                      href="https://www.loom.com/share/ebb8dded5142439d8a97e338a49cb104"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-medium text-[#9B9085] hover:text-white transition-colors"
                    >
                      <span>Open in Loom</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  {/* Video Mockup Player Container */}
                  <div className="relative overflow-hidden rounded-2xl border border-[#2e2e38] bg-[#161619] shadow-2xl flex flex-col">
                    {/* Embedded Video Viewport */}
                    <div className="relative h-[320px] max-h-[350px] w-full bg-[#18181c] overflow-hidden flex flex-col justify-between group">
                      <iframe
                        src="https://www.loom.com/embed/ebb8dded5142439d8a97e338a49cb104"
                        title="Platform Walkthrough"
                        className="h-full w-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />

                      {/* Floating Emojis over Scrubber Bar */}
                      <div className="absolute bottom-3 left-4 z-10 text-base pointer-events-none">❤️🔥</div>
                      <div className="absolute bottom-3 left-[45%] z-10 text-xl pointer-events-none">🔥🔥</div>
                      <div className="absolute bottom-3 right-6 z-10 flex items-center justify-center h-5 w-5 rounded bg-[#2e2e38] text-[10px] font-bold text-white border border-[#444452] pointer-events-none">
                        3
                      </div>
                    </div>

                    {/* Loom Bottom Reaction Bar */}
                    <div className="flex items-center justify-between px-5 py-3 bg-[#1c1c22] border-t border-[#2e2e38]">
                      <button className="text-[#9B9085] hover:text-white transition">
                        <span className="text-sm">▼</span>
                      </button>

                      {/* Emoji Reactions Row */}
                      <div className="flex items-center gap-3 text-lg">
                        <button className="hover:scale-125 transition">❤️</button>
                        <button className="hover:scale-125 transition">👍</button>
                        <button className="hover:scale-125 transition">🔥</button>
                        <button className="hover:scale-125 transition">👏</button>
                        <button className="hover:scale-125 transition">🙌</button>
                        <button className="hover:scale-125 transition">👀</button>
                        <button className="text-xs text-[#9B9085] hover:text-white font-bold bg-[#282832] p-1.5 rounded-lg border border-[#3f3f4c]">
                          +😃
                        </button>
                      </div>

                      {/* Comment Button */}
                      <button className="flex items-center gap-1.5 rounded-xl border border-[#3f3f4c] bg-[#222228] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2e2e38] transition cursor-pointer">
                        <span>+</span>
                        <span>Comment</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : selectedTopic === "Account settings" ? (
                <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                  {/* Header: IDENTITY AND SECURITY */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#222228] border border-[#2e2e38] text-[#FE6F34]">
                        <Settings className="h-5.5 w-5.5" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#9B9085] uppercase tracking-wider">IDENTITY AND SECURITY</p>
                        <h2 className="text-xl font-bold text-white leading-tight">What can I change in Account settings?</h2>
                      </div>
                    </div>
                  </div>

                  {/* 2 Column Cards: Your name vs Password */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Your name Card */}
                    <div className="rounded-2xl border border-[#33333e] bg-[#201f24] p-5 space-y-2.5 text-left">
                      <h4 className="text-base font-bold text-white">Your name</h4>
                      <p className="text-sm text-[#9B9085] leading-relaxed">
                        Update the name shown on your Magnets account. Your sign-in email is read-only here.
                      </p>
                    </div>

                    {/* Password Card */}
                    <div className="rounded-2xl border border-[#33333e] bg-[#201f24] p-5 space-y-2.5 text-left">
                      <h4 className="text-base font-bold text-white">Password</h4>
                      <p className="text-sm text-[#9B9085] leading-relaxed">
                        Confirm your current password, then choose a different password with at least 8 characters.
                      </p>
                    </div>
                  </div>

                  {/* Reddish Notice Card: Account deletion is permanent */}
                  <div className="rounded-2xl border border-[#452b23] bg-[#221a18] px-5 py-4 text-left space-y-1.5">
                    <h4 className="text-sm font-bold text-[#f87171]">Account deletion is permanent</h4>
                    <p className="text-xs text-[#9B9085] leading-relaxed">
                      Deleting the account removes its lead magnets, signups, integrations, and attached custom domains. There is no recovery. Magnets asks for your password and the word DELETE before it can continue.
                    </p>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="pt-2 text-left">
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setShowHelp(false)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#FE6F34] px-4 py-2.5 text-sm font-semibold text-[#18181b] hover:bg-[#ff7b43] transition-all cursor-pointer shadow-sm"
                    >
                      <span>Open Account settings</span>
                      <span className="text-base font-bold">→</span>
                    </Link>
                  </div>
                </div>
              ) : selectedTopic === "Analytics and A/B tests" ? (
                <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                  {/* Header: MEASURE RESULTS */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#222228] border border-[#2e2e38] text-[#FE6F34]">
                        <BarChart3 className="h-5.5 w-5.5" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#9B9085] uppercase tracking-wider">MEASURE RESULTS</p>
                        <h2 className="text-xl font-bold text-white leading-tight">How do analytics and A/B tests work?</h2>
                      </div>
                    </div>
                  </div>

                  {/* 2 Column Cards: Analytics vs A/B testing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Analytics Card */}
                    <div className="rounded-2xl border border-[#33333e] bg-[#201f24] p-5 space-y-3 text-left">
                      <h4 className="text-base font-bold text-white">Analytics</h4>
                      <p className="text-sm text-[#9B9085] leading-relaxed">
                        Open a lead magnet and choose Analytics to see total signups, unique people, tracked visits and conversions, conversion rate, engagement, and results from the after-signup experience. Total signups include repeat requests. Conversion rate uses only signups matched to a tracked visit.
                      </p>
                    </div>

                    {/* A/B testing Card */}
                    <div className="rounded-2xl border border-[#33333e] bg-[#201f24] p-5 space-y-3 text-left">
                      <h4 className="text-base font-bold text-white">A/B testing</h4>
                      <p className="text-sm text-[#9B9085] leading-relaxed">
                        Test a different title or image against the current page. Magnets splits new visitors between the versions and keeps each visitor on the same version.
                      </p>
                    </div>
                  </div>

                  {/* 4 Numbered Steps */}
                  <div className="pt-2 space-y-6">
                    {/* Step 1 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        1
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Create a second version</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Open the landing-page editor and find Test title and image.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        2
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Start the comparison</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Change the title, image, or both, then start the test.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        3
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Watch the results</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Review each version's visits and conversion rate in Analytics.
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        4
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Use the winner</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          After 7 days, once every version has at least 25 visitors, Magnets selects by conversion rate and applies the winner automatically.
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="pt-2 text-left">
                      <Link
                        href="/dashboard/leadmagnets"
                        onClick={() => setShowHelp(false)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#FE6F34] px-4 py-2.5 text-sm font-semibold text-[#18181b] hover:bg-[#ff7b43] transition-all cursor-pointer shadow-sm"
                      >
                        <span>Open Lead magnets</span>
                        <span className="text-base font-bold">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : selectedTopic === "Manage signups" ? (
                <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                  {/* Header: LEAD MANAGEMENT */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#222228] border border-[#2e2e38] text-[#FE6F34]">
                        <Users className="h-5.5 w-5.5" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#9B9085] uppercase tracking-wider">LEAD MANAGEMENT</p>
                        <h2 className="text-xl font-bold text-white leading-tight">How do I manage signups?</h2>
                      </div>
                    </div>

                    <p className="text-sm text-[#d4c8bc] leading-relaxed">
                      The Signups area contains everyone who has requested one of your lead magnets.
                    </p>
                  </div>

                  {/* 2x2 Grid of 4 Feature Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                    {/* Review */}
                    <div className="rounded-2xl border border-[#33333e] bg-[#201f24] p-4 space-y-1.5 text-left">
                      <h4 className="text-base font-bold text-white">Review</h4>
                      <p className="text-sm text-[#9B9085] leading-relaxed">
                        See which lead magnet someone requested and the status of their follow-up sequence.
                      </p>
                    </div>

                    {/* Add or import */}
                    <div className="rounded-2xl border border-[#33333e] bg-[#201f24] p-4 space-y-1.5 text-left">
                      <h4 className="text-base font-bold text-white">Add or import</h4>
                      <p className="text-sm text-[#9B9085] leading-relaxed">
                        Add one person manually or import up to 5,000 rows from a CSV file.
                      </p>
                    </div>

                    {/* Export */}
                    <div className="rounded-2xl border border-[#33333e] bg-[#201f24] p-4 space-y-1.5 text-left">
                      <h4 className="text-base font-bold text-white">Export</h4>
                      <p className="text-sm text-[#9B9085] leading-relaxed">
                        Download the current signup list as a CSV file.
                      </p>
                    </div>

                    {/* Control follow-up */}
                    <div className="rounded-2xl border border-[#33333e] bg-[#201f24] p-4 space-y-1.5 text-left">
                      <h4 className="text-base font-bold text-white">Control follow-up</h4>
                      <p className="text-sm text-[#9B9085] leading-relaxed">
                        Start a missing sequence or stop an active sequence for an individual signup.
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="pt-2 text-left">
                    <Link
                      href="/dashboard/signups"
                      onClick={() => setShowHelp(false)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#FE6F34] px-4 py-2.5 text-sm font-semibold text-[#18181b] hover:bg-[#ff7b43] transition-all cursor-pointer shadow-sm"
                    >
                      <span>Open Signups</span>
                      <span className="text-base font-bold">→</span>
                    </Link>
                  </div>
                </div>
              ) : selectedTopic === "Connect a calendar" ? (
                <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                  {/* Header: SEQUENCE CONTROLS */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#222228] border border-[#2e2e38] text-[#FE6F34]">
                        <Calendar className="h-5.5 w-5.5" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#9B9085] uppercase tracking-wider">SEQUENCE CONTROLS</p>
                        <h2 className="text-xl font-bold text-white leading-tight">How do I connect a calendar?</h2>
                      </div>
                    </div>

                    <p className="text-sm text-[#d4c8bc] leading-relaxed">
                      Stop sending sales follow-up after a lead has already booked. Magnets can stop an eligible sequence when the booking email matches the signup and that lead magnet has the option enabled. Your sender setup must be ready first.
                    </p>
                  </div>

                  {/* 4 Numbered Steps */}
                  <div className="pt-2 space-y-6">
                    {/* Step 1 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        1
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Open Calendar settings</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Open Workspace setup, Optional connections, then Calendar.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        2
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Add the provider credential</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          For Calendly, create a personal access token under Integrations, API and Webhooks. For Cal.com, create an API key.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        3
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Finish the connection</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Connect the account. Calendly requires a paid plan that supports webhooks. Magnets configures the booking webhook for you.
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        4
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Enable it per lead magnet</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          In each lead magnet's Sequence tab, turn on the option to stop the sequence when a booking is received.
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="pt-2 text-left">
                      <Link
                        href="/dashboard/setup#connections-section"
                        onClick={() => setShowHelp(false)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#FE6F34] px-4 py-2.5 text-sm font-semibold text-[#18181b] hover:bg-[#ff7b43] transition-all cursor-pointer shadow-sm"
                      >
                        <span>Open Calendar connection</span>
                        <span className="text-base font-bold">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : selectedTopic === "Connect Zapier" ? (
                <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                  {/* Header: AUTOMATIONS */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#222228] border border-[#2e2e38] text-[#FE6F34]">
                        <svg className="h-5.5 w-5.5 fill-[#FE6F34]" viewBox="0 0 24 24">
                          <path d="M12 2a4 4 0 0 0-4 4v3.5a.5.5 0 0 0 .5.5H12a4 4 0 0 0 4-4V2z" />
                          <path d="M2 16a4 4 0 0 0 4 4h3.5a.5.5 0 0 0 .5-.5V16a4 4 0 0 0-4-4H2z" />
                          <path d="M16 22a4 4 0 0 0 4-4v-3.5a.5.5 0 0 0-.5-.5H16a4 4 0 0 0-4 4V22z" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#9B9085] uppercase tracking-wider">AUTOMATIONS</p>
                        <h2 className="text-xl font-bold text-white leading-tight">How do I connect Zapier?</h2>
                      </div>
                    </div>

                    <p className="text-sm text-[#d4c8bc] leading-relaxed">
                      Use each signup to start another workflow, such as adding a database row, creating a task, or notifying another tool.
                    </p>
                  </div>

                  {/* 4 Numbered Steps */}
                  <div className="pt-2 space-y-6">
                    {/* Step 1 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        1
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Create the trigger</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Create a Zap and choose Webhooks by Zapier as the trigger.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        2
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Copy the Catch Hook URL</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Choose Catch Hook, open the Test tab, then copy the unique webhook URL.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        3
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Add it to Magnets</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Open Workspace setup, Optional connections, then Zapier. Paste the URL into Magnets.
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        4
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Test and map the fields</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Choose Send test in Magnets. Return to Zapier, choose Test trigger, then map the sample fields into your next action.
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="pt-2 text-left">
                      <Link
                        href="/dashboard/setup#connections-section"
                        onClick={() => setShowHelp(false)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#FE6F34] px-4 py-2.5 text-sm font-semibold text-[#18181b] hover:bg-[#ff7b43] transition-all cursor-pointer shadow-sm"
                      >
                        <span>Open Zapier connection</span>
                        <span className="text-base font-bold">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : selectedTopic === "Connect Kit" ? (
                <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                  {/* Header: AUDIENCE SYNC */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#222228] border border-[#2e2e38] text-[#FE6F34]">
                        <Mail className="h-5.5 w-5.5" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#9B9085] uppercase tracking-wider">AUDIENCE SYNC</p>
                        <h2 className="text-xl font-bold text-white leading-tight">How do I connect Kit?</h2>
                      </div>
                    </div>

                    <p className="text-sm text-[#d4c8bc] leading-relaxed">
                      Add each new signup to Kit automatically and tag them with the lead magnet they requested. Open Workspace setup, expand Optional connections, then open Kit under Automations.
                    </p>
                  </div>

                  {/* 3 Numbered Steps */}
                  <div className="pt-2 space-y-6">
                    {/* Step 1 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        1
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Start the connection</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Choose Connect Kit. Magnets sends you to Kit's secure authorization screen.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        2
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Approve in Kit</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Sign in to Kit if needed, choose the account, and approve access.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        3
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Check the connection</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Return to Magnets and confirm that the connected account name is shown.
                        </p>
                      </div>
                    </div>

                    {/* Dark Info Box */}
                    <div className="rounded-2xl border border-[#2e2e38] bg-[#1c1c22] p-5 text-left">
                      <p className="text-xs text-[#9B9085] leading-relaxed">
                        New signups are added or updated by email and receive a tag identifying the lead magnet they requested.
                      </p>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="pt-2 text-left">
                      <Link
                        href="/dashboard/setup#connections-section"
                        onClick={() => setShowHelp(false)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#FE6F34] px-4 py-2.5 text-sm font-semibold text-[#18181b] hover:bg-[#ff7b43] transition-all cursor-pointer shadow-sm"
                      >
                        <span>Open Kit connection</span>
                        <span className="text-base font-bold">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : selectedTopic === "Connect Pipedrive" ? (
                <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                  {/* Header: CRM SYNC */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#222228] border border-[#2e2e38] text-[#FE6F34]">
                        <LinkIcon className="h-5.5 w-5.5" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#9B9085] uppercase tracking-wider">CRM SYNC</p>
                        <h2 className="text-xl font-bold text-white leading-tight">How do I connect Pipedrive?</h2>
                      </div>
                    </div>

                    <p className="text-sm text-[#d4c8bc] leading-relaxed">
                      Keep new contacts in your CRM without entering the same name and email by hand.
                    </p>
                  </div>

                  {/* 4 Numbered Steps */}
                  <div className="pt-2 space-y-6">
                    {/* Step 1 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        1
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Find your API token</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          In Pipedrive, open Personal preferences, then API.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        2
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Copy the token safely</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Copy the token. Treat it like a password and do not share it anywhere else.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        3
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Add it to Magnets</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          In Magnets, open Workspace setup, Optional connections, then Pipedrive. Paste the token.
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        4
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Test the connection</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Choose Test connection and wait for the connected confirmation.
                        </p>
                      </div>
                    </div>

                    {/* Dark Info Box */}
                    <div className="rounded-2xl border border-[#2e2e38] bg-[#1c1c22] p-5 text-left">
                      <p className="text-xs text-[#9B9085] leading-relaxed">
                        Each signup creates or updates a Pipedrive person. Existing people are matched by email.
                      </p>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="pt-2 text-left">
                      <Link
                        href="/dashboard/setup#connections-section"
                        onClick={() => setShowHelp(false)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#FE6F34] px-4 py-2.5 text-sm font-semibold text-[#18181b] hover:bg-[#ff7b43] transition-all cursor-pointer shadow-sm"
                      >
                        <span>Open Pipedrive connection</span>
                        <span className="text-base font-bold">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : selectedTopic === "Connect Slack" ? (
                <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                  {/* Header: SIGNUP NOTIFICATIONS */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#222228] border border-[#2e2e38] text-[#FE6F34]">
                        <Slack className="h-5.5 w-5.5" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#9B9085] uppercase tracking-wider">SIGNUP NOTIFICATIONS</p>
                        <h2 className="text-xl font-bold text-white leading-tight">How do I connect Slack?</h2>
                      </div>
                    </div>

                    <p className="text-sm text-[#d4c8bc] leading-relaxed">
                      Send a useful signup alert to the right channel so your team can see interest as it happens.
                    </p>
                  </div>

                  {/* 4 Numbered Steps */}
                  <div className="pt-2 space-y-6">
                    {/* Step 1 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        1
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Create an incoming webhook</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Create a Slack app, turn on Incoming Webhooks, then choose Add New Webhook to Workspace.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        2
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Copy the webhook URL</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Choose the channel, authorise the app, and copy the hooks.slack.com URL. Treat this URL like a password.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        3
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Paste it into Magnets</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          In Magnets, open Workspace setup, Optional connections, then Slack. Paste the URL into the webhook field.
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        4
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Test the connection</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Choose Send test and confirm the message arrives in the selected channel.
                        </p>
                      </div>
                    </div>

                    {/* Dark Info Box */}
                    <div className="rounded-2xl border border-[#2e2e38] bg-[#1c1c22] p-5 text-left">
                      <p className="text-xs text-[#9B9085] leading-relaxed">
                        Slack receives the signup name, email, lead magnet title, and public page link.
                      </p>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="pt-2 text-left">
                      <Link
                        href="/dashboard/setup#connections-section"
                        onClick={() => setShowHelp(false)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#FE6F34] px-4 py-2.5 text-sm font-semibold text-[#18181b] hover:bg-[#ff7b43] transition-all cursor-pointer shadow-sm"
                      >
                        <span>Open Slack connection</span>
                        <span className="text-base font-bold">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : selectedTopic === "Beehiiv and Substack" || selectedTopic === "Manage signups" ? (
                <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                  {/* Header: AUDIENCE SYNC */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#222228] border border-[#2e2e38] text-[#FE6F34]">
                        <Share2 className="h-5.5 w-5.5" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#9B9085] uppercase tracking-wider">AUDIENCE SYNC</p>
                        <h2 className="text-xl font-bold text-white leading-tight">How do I connect Beehiiv or Substack?</h2>
                      </div>
                    </div>

                    <p className="text-sm text-[#d4c8bc] leading-relaxed">
                      Send new signups straight to the newsletter you already use, without exporting and importing a list by hand. Open Workspace setup, expand Optional connections, then open Newsletter under Audience sync.
                    </p>

                    <p className="text-sm text-[#d4c8bc] leading-relaxed">
                      Every signup remains saved in Magnets. Make it clear on the signup page if requesting the resource also adds someone to your newsletter.
                    </p>
                  </div>

                  {/* 2 Column Cards: Beehiiv vs Substack */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Beehiiv Card */}
                    <div className="rounded-2xl border border-[#33333e] bg-[#201f24] p-5 space-y-3.5 text-left">
                      <h4 className="text-base font-bold text-white">Beehiiv</h4>
                      <ol className="space-y-3 text-sm text-[#9B9085] leading-relaxed">
                        <li>
                          <strong className="text-white font-bold">1.</strong> In Beehiiv, open Settings, Workspace Settings, then API.
                        </li>
                        <li>
                          <strong className="text-white font-bold">2.</strong> Copy the API V2 publication ID for the publication you want.
                        </li>
                        <li>
                          <strong className="text-white font-bold">3.</strong> Create an API key and copy it when shown. Beehiiv only shows the key once.
                        </li>
                        <li>
                          <strong className="text-white font-bold">4.</strong> Paste both values into Magnets. They save when you leave each field.
                        </li>
                      </ol>
                      <p className="text-xs text-[#666675] leading-relaxed pt-1">
                        Beehiiv restricts API access to workspace owners and admins and may ask for identity verification.
                      </p>
                    </div>

                    {/* Substack Card */}
                    <div className="rounded-2xl border border-[#33333e] bg-[#201f24] p-5 space-y-3.5 text-left">
                      <h4 className="text-base font-bold text-white">Substack</h4>
                      <ol className="space-y-3 text-sm text-[#9B9085] leading-relaxed">
                        <li>
                          <strong className="text-white font-bold">1.</strong> Find your publication subdomain.
                        </li>
                        <li>
                          <strong className="text-white font-bold">2.</strong> Enter only the first part, such as myletter.
                        </li>
                        <li>
                          <strong className="text-white font-bold">3.</strong> Do not enter myletter.substack.com.
                        </li>
                      </ol>
                    </div>
                  </div>

                  {/* Disclaimer Text */}
                  <p className="text-xs text-[#71717a] leading-relaxed pt-1 text-left">
                    Substack does not provide a documented public subscriber API for this connection. It uses Substack's public signup flow and may stop working if that flow changes.
                  </p>

                  {/* Bottom Action Button */}
                  <div className="pt-2 text-left">
                    <Link
                      href="/dashboard/setup#connections-section"
                      onClick={() => setShowHelp(false)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#FE6F34] px-4 py-2.5 text-sm font-semibold text-[#18181b] hover:bg-[#ff7b43] transition-all cursor-pointer shadow-sm"
                    >
                      <span>Open newsletter connections</span>
                      <span className="text-base font-bold">→</span>
                    </Link>
                  </div>
                </div>
              ) : selectedTopic === "Legal links" ? (
                <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                  {/* Header: PUBLIC PAGE FOOTER */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#222228] border border-[#2e2e38] text-[#FE6F34]">
                        <BookOpen className="h-5.5 w-5.5" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#9B9085] uppercase tracking-wider">PUBLIC PAGE FOOTER</p>
                        <h2 className="text-xl font-bold text-white leading-tight">How do I add legal links?</h2>
                      </div>
                    </div>

                    <p className="text-sm text-[#d4c8bc] leading-relaxed">
                      Add links to your own privacy policy and terms so visitors can understand how your business handles their information and the rules that apply to your offer.
                    </p>
                  </div>

                  {/* 4 Numbered Steps */}
                  <div className="pt-2 space-y-6">
                    {/* Step 1 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        1
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Open the legal settings</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Open Workspace setup and expand Legal links.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        2
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Add your privacy policy</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Paste the full public URL for your privacy policy, beginning with https://.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        3
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Add your terms</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Add a full public URL for your terms if you use them.
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        4
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Check the public page</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Open a page preview and check both links. They open in a new tab from every public lead magnet footer.
                        </p>
                      </div>
                    </div>

                    {/* Dark Yellowish-Brown Warning Card: Magnets does not write these policies for you */}
                    <div className="rounded-2xl border border-[#4d4022] bg-[#221e16] p-5 text-left space-y-1.5">
                      <h4 className="text-sm font-bold text-[#fbbf24]">Magnets does not write these policies for you</h4>
                      <p className="text-xs text-[#9B9085] leading-relaxed">
                        The right wording depends on your business, location, audience, and the services you use. Get appropriate legal advice if you are unsure what your policies need to cover. Leaving a field blank hides that custom link.
                      </p>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="pt-2 text-left">
                      <Link
                        href="/dashboard/setup"
                        onClick={() => setShowHelp(false)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#FE6F34] px-4 py-2.5 text-sm font-semibold text-[#18181b] hover:bg-[#ff7b43] transition-all cursor-pointer shadow-sm"
                      >
                        <span>Open Legal links</span>
                        <span className="text-base font-bold">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : selectedTopic === "Send from my email" ? (
                <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                  {/* Header: EMAIL DELIVERY */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#222228] border border-[#2e2e38] text-[#FE6F34]">
                        <Mail className="h-5.5 w-5.5" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#9B9085] uppercase tracking-wider">EMAIL DELIVERY</p>
                        <h2 className="text-xl font-bold text-white leading-tight">How do I send from my own email?</h2>
                      </div>
                    </div>
                  </div>

                  {/* Dark Reddish-Chocolate Notice Card: This is optional */}
                  <div className="rounded-2xl border border-[#452b23] bg-[#221a18] px-5 py-4 space-y-1.5 text-left">
                    <h3 className="text-sm font-bold text-white">
                      This is optional
                    </h3>
                    <p className="text-sm text-[#9B9085] leading-relaxed">
                      If Magnets sending is already connected, you can publish and deliver a resource without setting up your own sender domain. Using a recognisable From address can make the email feel more consistent with your brand.
                    </p>
                  </div>

                  {/* 4 Numbered Steps */}
                  <div className="pt-1 space-y-6">
                    {/* Step 1 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        1
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Add your domain</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          In Workspace setup, add the root domain you own. You do not have to publish your pages on that domain.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        2
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Choose the From address</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Open Optional connections, then Your sender domain. Choose a sending subdomain and the address you want people to see.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        3
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Add the sending records</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Add the exact DNS records shown by Magnets wherever your domain's DNS is managed.
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        4
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Verify the sender</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Return to Magnets and run the verification check. Use the address only after it shows as verified.
                        </p>
                      </div>
                    </div>

                    {/* Dark Info Card */}
                    <div className="rounded-2xl border border-[#2e2e38] bg-[#1c1c22] p-5 text-left">
                      <p className="text-xs text-[#9B9085] leading-relaxed">
                        Magnets uses a sending subdomain so its email reputation is separated from your main website. Copy every DNS record exactly as shown. Verification is often quick, but DNS changes can take up to 72 hours to appear.
                      </p>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="pt-1 text-left">
                      <Link
                        href="/dashboard/setup"
                        onClick={() => setShowHelp(false)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#FE6F34] px-4 py-2.5 text-sm font-semibold text-[#18181b] hover:bg-[#ff7b43] transition-all cursor-pointer shadow-sm"
                      >
                        <span>Open email setup</span>
                        <span className="text-base font-bold">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : selectedTopic === "Custom domains" ? (
                <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                  {/* Header: OPTIONAL SETUP */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#222228] border border-[#2e2e38] text-[#FE6F34]">
                        <Globe className="h-5.5 w-5.5" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#9B9085] uppercase tracking-wider">OPTIONAL SETUP</p>
                        <h2 className="text-xl font-bold text-white leading-tight">Use your own domain</h2>
                      </div>
                    </div>
                  </div>

                  {/* Dark Reddish-Chocolate Top Notice Card: You can skip this completely */}
                  <div className="rounded-2xl border border-[#452b23] bg-[#221a18] px-5 py-4 space-y-1.5 text-left">
                    <h3 className="text-sm font-bold text-white">
                      You can skip this completely.
                    </h3>
                    <p className="text-sm text-[#9B9085] leading-relaxed">
                      Every published lead magnet can use its included magnets.so link. A custom domain gives you a recognisable branded address, but it is not required to create, publish, deliver, or collect signups.
                    </p>
                  </div>

                  {/* 3 Numbered Steps */}
                  <div className="pt-1 space-y-6">
                    {/* Step 1 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        1
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Choose your address</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Use the root domain you already own, such as example.com, then choose a page subdomain such as get.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        2
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Prove you own the domain</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Magnets gives you a TXT record. Add it wherever your DNS is managed, then click Check ownership.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        3
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Point the subdomain to Magnets</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Add the CNAME record shown in Magnets and connect the subdomain. DNS changes can take a little while to appear.
                        </p>
                      </div>
                    </div>

                    {/* Divider & Bottom Action Button */}
                    <div className="pt-4 border-t border-[#2e2e38]">
                      <Link
                        href="/dashboard/setup"
                        onClick={() => setShowHelp(false)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#FE6F34] px-4 py-2.5 text-sm font-semibold text-[#18181b] hover:bg-[#ff7b43] transition-all cursor-pointer shadow-sm"
                      >
                        <span>Open custom-domain setup</span>
                        <span className="text-base font-bold">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : selectedTopic === "Workspace setup" ? (
                <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                  {/* Header: YOUR ACCOUNT FOUNDATIONS */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#222228] border border-[#2e2e38] text-[#FE6F34]">
                        <Settings className="h-5.5 w-5.5" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#9B9085] uppercase tracking-wider">YOUR ACCOUNT FOUNDATIONS</p>
                        <h2 className="text-xl font-bold text-white leading-tight">What belongs in Workspace setup?</h2>
                      </div>
                    </div>

                    <p className="text-sm text-[#d4c8bc] leading-relaxed">
                      Workspace setup controls where your pages live, where emails come from, and which other tools receive new signups. You do not need to connect every option before creating a lead magnet.
                    </p>
                  </div>

                  {/* 5 Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                    {/* Magnets URL */}
                    <div className="rounded-2xl border border-[#33333e] bg-[#201f24] p-4 space-y-1.5 text-left">
                      <h4 className="text-base font-bold text-white">Magnets URL</h4>
                      <p className="text-sm text-[#9B9085] leading-relaxed">
                        Choose the included magnets.so address used by your published pages.
                      </p>
                    </div>

                    {/* Custom domain */}
                    <div className="rounded-2xl border border-[#33333e] bg-[#201f24] p-4 space-y-1.5 text-left">
                      <h4 className="text-base font-bold text-white">Custom domain</h4>
                      <p className="text-sm text-[#9B9085] leading-relaxed">
                        Optionally use a branded page address on a domain you own.
                      </p>
                    </div>

                    {/* Email and scheduling */}
                    <div className="rounded-2xl border border-[#33333e] bg-[#201f24] p-4 space-y-1.5 text-left">
                      <h4 className="text-base font-bold text-white">Email and scheduling</h4>
                      <p className="text-sm text-[#9B9085] leading-relaxed">
                        Optionally use your own sender domain or stop a sequence when someone books.
                      </p>
                    </div>

                    {/* Connections */}
                    <div className="rounded-2xl border border-[#33333e] bg-[#201f24] p-4 space-y-1.5 text-left">
                      <h4 className="text-base font-bold text-white">Connections</h4>
                      <p className="text-sm text-[#9B9085] leading-relaxed">
                        Optionally send signups to a newsletter, Slack, Zapier, Kit, or Pipedrive.
                      </p>
                    </div>

                    {/* Legal links */}
                    <div className="rounded-2xl border border-[#33333e] bg-[#201f24] p-4 space-y-1.5 text-left">
                      <h4 className="text-base font-bold text-white">Legal links</h4>
                      <p className="text-sm text-[#9B9085] leading-relaxed">
                        Add your privacy policy and terms to the footer of every public lead magnet page.
                      </p>
                    </div>
                  </div>

                  {/* Warm Reddish-Chocolate Tip Card */}
                  <div className="rounded-2xl border border-[#452b23] bg-[#221a18] px-5 py-4 text-left">
                    <p className="text-sm text-[#9B9085] leading-relaxed">
                      Start with your Magnets URL. Add a custom domain and integrations only when they support the way you want to publish, deliver, or follow up.
                    </p>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="pt-1 text-left">
                    <Link
                      href="/dashboard/setup"
                      onClick={() => setShowHelp(false)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#FE6F34] px-4 py-2.5 text-sm font-semibold text-[#18181b] hover:bg-[#ff7b43] transition-all cursor-pointer shadow-sm"
                    >
                      <span>Open Workspace setup</span>
                      <span className="text-base font-bold">→</span>
                    </Link>
                  </div>
                </div>
              ) : selectedTopic === "Delivery emails" ? (
                <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                  {/* Header: DELIVER THE PROMISE */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#222228] border border-[#2e2e38] text-[#FE6F34]">
                        <Send className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#9B9085] uppercase tracking-wider">DELIVER THE PROMISE</p>
                        <h2 className="text-xl font-bold text-white leading-tight">How do delivery emails work?</h2>
                      </div>
                    </div>

                    <p className="text-sm text-[#d4c8bc] leading-relaxed">
                      The delivery email is sent immediately after a successful signup. It should make the promised resource easy to find and remind the reader why it is useful.
                    </p>
                  </div>

                  {/* Warm Reddish-Brown Tinted Card: Bring your own resource link */}
                  <div className="rounded-2xl border border-[#452b23] bg-[#221a18] px-5 py-4 space-y-1.5 text-left">
                    <h3 className="text-base font-bold text-white text-left">
                      Bring your own resource link
                    </h3>
                    <p className="text-sm text-[#9B9085] leading-relaxed text-left">
                      Create the resource yourself, then paste its full download or access link into this email. For files, you can upload the resource under Hosted resources and use the unique link Magnets gives you.
                    </p>
                  </div>

                  {/* 4 Numbered Steps */}
                  <div className="pt-2 space-y-6">
                    {/* Step 1 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        1
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Open the email editor</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Open a lead magnet and choose the Delivery email tab.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        2
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Set the inbox details</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Write a clear subject and preview line so the reader recognises what they requested.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        3
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Make access obvious</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Add a short welcome and a prominent link to the promised file or resource.
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        4
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Preview before sending</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Use Preview to check the exact email before publishing the lead magnet.
                        </p>
                      </div>
                    </div>

                    {/* Dark Info Card: Delivery content and sender setup are different */}
                    <div className="rounded-2xl border border-[#2e2e38] bg-[#1c1c22] p-5 space-y-1.5">
                      <h4 className="text-sm font-bold text-white">Delivery content and sender setup are different</h4>
                      <p className="text-xs text-[#9B9085] leading-relaxed">
                        The Delivery email tab controls what the email says. Your sender setup controls the From name and address. You can edit the email without connecting your own sender domain.
                      </p>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="pt-2">
                      <Link
                        href="/dashboard/leadmagnets"
                        onClick={() => setShowHelp(false)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#FE6F34] px-4 py-2.5 text-sm font-semibold text-[#18181b] hover:bg-[#ff7b43] transition-all cursor-pointer shadow-sm"
                      >
                        <span>Open Lead magnets</span>
                        <span className="text-base font-bold">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : selectedTopic === "Brand colours and logo" ? (
                <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                  {/* Header: PAGE APPEARANCE */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#222228] border border-[#2e2e38] text-[#FE6F34]">
                        <Palette className="h-5.5 w-5.5" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#9B9085] uppercase tracking-wider">PAGE APPEARANCE</p>
                        <h2 className="text-xl font-bold text-white leading-tight">How do I update my brand colours?</h2>
                      </div>
                    </div>

                    <p className="text-sm text-[#d4c8bc] leading-relaxed">
                      Brand settings apply to every public lead magnet and to the editor preview.
                    </p>
                  </div>

                  {/* 4 Numbered Steps */}
                  <div className="pt-2 space-y-6">
                    {/* Step 1 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        1
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Open your brand settings</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Open Brand from the dashboard sidebar.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        2
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Set the identity and colour</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Add your business name, upload a logo, and choose the primary colour used across your pages.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        3
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Choose the page style</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Choose light or dark page appearance and adjust the highlight intensity.
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        4
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Preview and save</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Check the preview, then choose Save brand.
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="pt-2">
                      <Link
                        href="/dashboard/brand"
                        onClick={() => setShowHelp(false)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#FE6F34] px-4 py-2.5 text-sm font-semibold text-[#18181b] hover:bg-[#ff7b43] transition-all cursor-pointer shadow-sm"
                      >
                        <span>Open Brand settings</span>
                        <span className="text-base font-bold">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : selectedTopic === "Hosted resources" ? (
                <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                  {/* Header: FILES AND DOWNLOADS */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#222228] border border-[#2e2e38] text-[#FE6F34]">
                        <FolderOpen className="h-5.5 w-5.5" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#9B9085] uppercase tracking-wider">FILES AND DOWNLOADS</p>
                        <h2 className="text-xl font-bold text-white leading-tight">How do I host a resource?</h2>
                      </div>
                    </div>

                    <p className="text-sm text-[#d4c8bc] leading-relaxed">
                      Hosted resources give you a stable download link for a PDF, image, ZIP file, or other supported resource. The file is private in storage. Only someone with its unique link can download it.
                    </p>
                  </div>

                  {/* 3 Numbered Steps */}
                  <div className="pt-2 space-y-6">
                    {/* Step 1 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        1
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Upload the file</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Open Hosted resources from the sidebar and choose Upload resource.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        2
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Name the resource</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Give it a clear name. This is the name shown in your resource library.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        3
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Add it to the Delivery email</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Copy its unique link, then paste it into the Delivery email for the lead magnet that should send it.
                        </p>
                      </div>
                    </div>

                    {/* Dark Warning Card: Deleting a resource revokes its link */}
                    <div className="rounded-2xl border border-[#2e2e38] bg-[#1c1c22] p-5 space-y-1.5">
                      <h4 className="text-sm font-bold text-white">Deleting a resource revokes its link</h4>
                      <p className="text-xs text-[#9B9085] leading-relaxed">
                        Anyone using the old link will lose access immediately, so update any lead magnets that still use it.
                      </p>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="pt-2">
                      <Link
                        href="/dashboard/hostresources"
                        onClick={() => setShowHelp(false)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#FE6F34] px-4 py-2.5 text-sm font-semibold text-[#18181b] hover:bg-[#ff7b43] transition-all cursor-pointer shadow-sm"
                      >
                        <span>Open Hosted resources</span>
                        <span className="text-base font-bold">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : selectedTopic === "Edit and publish a magnet" ? (
                <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                  {/* Header: BUILD THE FULL JOURNEY */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#222228] border border-[#2e2e38] text-[#FE6F34]">
                        <FileText className="h-5.5 w-5.5" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#9B9085] uppercase tracking-wider">BUILD THE FULL JOURNEY</p>
                        <h2 className="text-xl font-bold text-white leading-tight">How do I edit and publish a lead magnet?</h2>
                      </div>
                    </div>

                    <p className="text-sm text-[#d4c8bc] leading-relaxed">
                      Each lead magnet has one editor for the page people visit, the email that delivers the resource, any follow-up emails, and what happens after signup. Changes save automatically while you work.
                    </p>
                  </div>

                  {/* 2x2 Grid of 4 Editor Component Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                    {/* Landing page */}
                    <div className="rounded-2xl border border-[#33333e] bg-[#201f24] p-5 space-y-2">
                      <h4 className="text-base font-bold text-white">Landing page</h4>
                      <p className="text-sm text-[#9B9085] leading-relaxed">
                        Write the promise, explain the value, add an image, and choose the details the form should collect.
                      </p>
                    </div>

                    {/* Delivery email */}
                    <div className="rounded-2xl border border-[#33333e] bg-[#201f24] p-5 space-y-2">
                      <h4 className="text-base font-bold text-white">Delivery email</h4>
                      <p className="text-sm text-[#9B9085] leading-relaxed">
                        Set the subject, preview text, and message that sends the promised resource.
                      </p>
                    </div>

                    {/* Sequence */}
                    <div className="rounded-2xl border border-[#33333e] bg-[#201f24] p-5 space-y-2">
                      <h4 className="text-base font-bold text-white">Sequence</h4>
                      <p className="text-sm text-[#9B9085] leading-relaxed">
                        Add optional follow-up emails and choose the delay before each one.
                      </p>
                    </div>

                    {/* After signup */}
                    <div className="rounded-2xl border border-[#33333e] bg-[#201f24] p-5 space-y-2">
                      <h4 className="text-base font-bold text-white">After signup</h4>
                      <p className="text-sm text-[#9B9085] leading-relaxed">
                        Show a confirmation, redirect to another URL, or create a custom next-step page.
                      </p>
                    </div>
                  </div>

                  {/* 4 Numbered Steps */}
                  <div className="pt-3 space-y-6">
                    {/* Step 1 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        1
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Preview the experience</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Use Preview to check the real page or email before sharing it.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        2
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Get help with the copy</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Use the writing copilot for copy ideas or revisions, then review the changes before applying them.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        3
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Publish when ready</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Change the status to Published when the page is ready. Draft pages are not available to visitors.
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        4
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Share the page</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Copy the public link or download its QR code from the page actions, then share it with your audience.
                        </p>
                      </div>
                    </div>

                    {/* Dark Red Warning Card */}
                    <div className="rounded-2xl border border-[#4d2226] bg-[#221617] p-5">
                      <p className="text-xs text-[#f87171] leading-relaxed">
                        Deleting a lead magnet removes its public page and cannot be undone. Signups already collected remain in your Signups area.
                      </p>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="pt-2">
                      <Link
                        href="/dashboard/leadmagnets"
                        onClick={() => setShowHelp(false)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#FE6F34] px-4 py-2.5 text-sm font-semibold text-[#18181b] hover:bg-[#ff7b43] transition-all cursor-pointer shadow-sm"
                      >
                        <span>Open Lead magnets</span>
                        <span className="text-base font-bold">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : selectedTopic === "Create your first lead magnet" ? (
                <div className="max-w-[43rem] mx-auto space-y-4 py-2">
                  {/* Top Card: Build a direct path from interest to your email list */}
                  <div className="rounded-2xl border border-[#6e3e30] bg-[#18181c] bg-[radial-gradient(ellipse_160%_200%_at_left_center,#562c1e_0%,#341d17_28%,#1d1719_55%,#18181c_100%)] p-6 space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#4a2e26] bg-[#221614] px-3.5 py-1 text-[11px] font-bold tracking-wider text-[#FE6F34] uppercase">
                      <Rocket className="h-3.5 w-3.5 text-[#FE6F34]" />
                      <span>YOUR FIRST LAUNCH</span>
                    </div>

                    <h2 className="text-xl font-bold text-white leading-tight">
                      Build a direct path from interest to your email list
                    </h2>

                    <p className="text-sm text-[#9B9085] leading-relaxed">
                      Magnets builds the signup, delivery, and follow-up journey. You create the actual resource people receive, then add its download or access link to the Delivery email.
                    </p>
                  </div>

                  {/* Bottom Card: Create the resource before you publish */}
                  <div className="rounded-2xl border border-[#6e3e30] bg-[#201816] p-6 space-y-2.5">
                    <h3 className="text-base font-bold text-white">
                      Create the resource before you publish
                    </h3>
                    <p className="text-sm text-[#9B9085] leading-relaxed">
                      Make the PDF, template, video, email course, AI tool, or other useful resource yourself. Magnets does not generate the finished resource for you. It gives that resource a page, captures the signup, emails the link, and manages what happens next.
                    </p>
                  </div>

                  {/* 4-Step Action Steps Section */}
                  <div className="pt-3 space-y-6">
                    {/* Step 1 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        1
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Create the actual resource</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Pick one small problem and make the PDF, template, video, course, tool, or other resource that solves it.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        2
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Get an accessible link</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Upload a file under Hosted resources and copy its unique link, or use a public share link from wherever the resource is hosted.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        3
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Paste the link into the Delivery email</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Open the Delivery email tab and add a prominent linked button or line of text so subscribers can open or download the resource.
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-xs font-bold text-[#1c1c1e] mt-0.5">
                        4
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">Complete and publish the journey</h4>
                        <p className="text-xs text-[#9B9085] leading-relaxed">
                          Finish the Landing page, optional Sequence, and After signup tabs. Preview everything, publish the page, and share its public link.
                        </p>
                      </div>
                    </div>

                    {/* Divider & Action Buttons */}
                    <div className="pt-5 border-t border-[#2e2e38] flex items-center gap-3">
                      <button
                        onClick={() => {
                          setShowHelp(false);
                          setShowCreateMagnetModal(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#FE6F34] px-4 py-2.5 text-sm font-semibold text-[#18181b] hover:bg-[#ff7b43] transition-all cursor-pointer shadow-sm"
                      >
                        <span>Create a lead magnet</span>
                        <span className="text-base font-bold">→</span>
                      </button>

                      <Link
                        href="/dashboard/setup"
                        onClick={() => setShowHelp(false)}
                        className="inline-flex items-center rounded-xl border border-[#2e2e38] bg-[#222228] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2c2c34] transition-all cursor-pointer"
                      >
                        Set up a custom domain
                      </Link>
                    </div>
                  </div>
                </div>
              ) : selectedTopic === "What works best?" ? (
                <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#222228] border border-[#2e2e38] text-[#FE6F34]">
                      <Sparkles className="h-5.5 w-5.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#9B9085] uppercase tracking-wider">QUALITY BEATS SIZE</p>
                      <h2 className="text-lg font-bold text-white leading-tight">What lead magnets work best?</h2>
                    </div>
                  </div>

                  <p className="text-sm text-[#d4c8bc] leading-relaxed">
                    There is no single format that wins for every audience. The strongest option is the one that solves one specific problem, is easy to use, and naturally connects to what you help people do next. A concise checklist can be more valuable than a long ebook if it gets someone to a result.
                  </p>

                  {/* 2-column Grid of Lead Magnet Format Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                    {/* Checklist */}
                    <div className="rounded-2xl border border-[#2e2e38] bg-[#18181c] p-3.5 sm:p-4 space-y-2.5">
                      <div className="flex items-center gap-2 text-[#FE6F34]">
                        <FileText className="h-4 w-4" />
                        <h4 className="text-sm font-bold text-white">Checklist</h4>
                      </div>
                      <p className="text-xs text-[#9B9085] leading-relaxed">
                        A repeatable process with clear steps
                      </p>
                      <div className="rounded-xl bg-[#222227] p-2.5 text-xs text-[#d4c8bc] font-medium border border-[#2e2e38]">
                        <span className="font-semibold text-white">Example:</span> The 12-point landing-page launch checklist
                      </div>
                    </div>

                    {/* Template */}
                    <div className="rounded-2xl border border-[#2e2e38] bg-[#18181c] p-3.5 sm:p-4 space-y-2.5">
                      <div className="flex items-center gap-2 text-[#FE6F34]">
                        <FileText className="h-4 w-4" />
                        <h4 className="text-sm font-bold text-white">Template</h4>
                      </div>
                      <p className="text-xs text-[#9B9085] leading-relaxed">
                        Saving someone time on a task they already do
                      </p>
                      <div className="rounded-xl bg-[#222227] p-2.5 text-xs text-[#d4c8bc] font-medium border border-[#2e2e38]">
                        <span className="font-semibold text-white">Example:</span> A client onboarding email template pack
                      </div>
                    </div>

                    {/* Short guide */}
                    <div className="rounded-2xl border border-[#2e2e38] bg-[#18181c] p-3.5 sm:p-4 space-y-2.5">
                      <div className="flex items-center gap-2 text-[#FE6F34]">
                        <FileText className="h-4 w-4" />
                        <h4 className="text-sm font-bold text-white">Short guide</h4>
                      </div>
                      <p className="text-xs text-[#9B9085] leading-relaxed">
                        Explaining a narrow problem or decision
                      </p>
                      <div className="rounded-xl bg-[#222227] p-2.5 text-xs text-[#d4c8bc] font-medium border border-[#2e2e38]">
                        <span className="font-semibold text-white">Example:</span> A practical guide to pricing your first workshop
                      </div>
                    </div>

                    {/* Scorecard or quiz */}
                    <div className="rounded-2xl border border-[#2e2e38] bg-[#18181c] p-3.5 sm:p-4 space-y-2.5">
                      <div className="flex items-center gap-2 text-[#FE6F34]">
                        <FileText className="h-4 w-4" />
                        <h4 className="text-sm font-bold text-white">Scorecard or quiz</h4>
                      </div>
                      <p className="text-xs text-[#9B9085] leading-relaxed">
                        Helping someone understand their current position
                      </p>
                      <div className="rounded-xl bg-[#222227] p-2.5 text-xs text-[#d4c8bc] font-medium border border-[#2e2e38]">
                        <span className="font-semibold text-white">Example:</span> How ready is your business to hire?
                      </div>
                    </div>

                    {/* Swipe file */}
                    <div className="rounded-2xl border border-[#2e2e38] bg-[#18181c] p-3.5 sm:p-4 space-y-2.5">
                      <div className="flex items-center gap-2 text-[#FE6F34]">
                        <FileText className="h-4 w-4" />
                        <h4 className="text-sm font-bold text-white">Swipe file</h4>
                      </div>
                      <p className="text-xs text-[#9B9085] leading-relaxed">
                        Giving proven examples people can adapt
                      </p>
                      <div className="rounded-xl bg-[#222227] p-2.5 text-xs text-[#d4c8bc] font-medium border border-[#2e2e38]">
                        <span className="font-semibold text-white">Example:</span> 25 welcome-email subject lines
                      </div>
                    </div>

                    {/* Calculator */}
                    <div className="rounded-2xl border border-[#2e2e38] bg-[#18181c] p-3.5 sm:p-4 space-y-2.5">
                      <div className="flex items-center gap-2 text-[#FE6F34]">
                        <FileText className="h-4 w-4" />
                        <h4 className="text-sm font-bold text-white">Calculator</h4>
                      </div>
                      <p className="text-xs text-[#9B9085] leading-relaxed">
                        Turning complicated inputs into a useful answer
                      </p>
                      <div className="rounded-xl bg-[#222227] p-2.5 text-xs text-[#d4c8bc] font-medium border border-[#2e2e38]">
                        <span className="font-semibold text-white">Example:</span> Your freelance day-rate calculator
                      </div>
                    </div>

                    {/* Interactive AI artefact */}
                    <div className="rounded-2xl border border-[#2e2e38] bg-[#18181c] p-3.5 sm:p-4 space-y-2.5">
                      <div className="flex items-center gap-2 text-[#FE6F34]">
                        <FileText className="h-4 w-4" />
                        <h4 className="text-sm font-bold text-white">Interactive AI artefact</h4>
                      </div>
                      <p className="text-xs text-[#9B9085] leading-relaxed">
                        Creating a useful personalised result from someone's answers
                      </p>
                      <div className="rounded-xl bg-[#222227] p-2.5 text-xs text-[#d4c8bc] font-medium border border-[#2e2e38]">
                        <span className="font-semibold text-white">Example:</span> A positioning statement or campaign brief generator
                      </div>
                    </div>

                    {/* Five-day email course */}
                    <div className="rounded-2xl border border-[#2e2e38] bg-[#18181c] p-3.5 sm:p-4 space-y-2.5">
                      <div className="flex items-center gap-2 text-[#FE6F34]">
                        <FileText className="h-4 w-4" />
                        <h4 className="text-sm font-bold text-white">Five-day email course</h4>
                      </div>
                      <p className="text-xs text-[#9B9085] leading-relaxed">
                        Teaching a practical process in small, useful daily steps
                      </p>
                      <div className="rounded-xl bg-[#222227] p-2.5 text-xs text-[#d4c8bc] font-medium border border-[#2e2e38]">
                        <span className="font-semibold text-white">Example:</span> Build your first client referral system in five days
                      </div>
                    </div>
                  </div>

                  {/* Dark Green Banner: A strong idea should pass four checks */}
                  <div className="rounded-2xl border border-[#22543d] bg-[#122e20] p-5 space-y-3">
                    <h4 className="text-sm font-bold text-[#6ee7b7]">A strong idea should pass four checks</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-semibold text-[#6ee7b7]">
                      <p>One clear audience and problem</p>
                      <p>A specific, benefit-led title</p>
                      <p>A result they can use quickly</p>
                      <p>A natural link to your paid offer</p>
                    </div>
                  </div>

                  {/* Bottom 2 Advice Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Make an AI artefact genuinely useful */}
                    <div className="rounded-2xl border border-[#2e2e38] bg-[#18181c] p-4 space-y-2">
                      <h4 className="text-sm font-bold text-white">Make an AI artefact genuinely useful</h4>
                      <p className="text-xs text-[#9B9085] leading-relaxed">
                        Ask only for the information needed to create a specific output. Give the visitor something they can use immediately, not a generic block of generated text.
                      </p>
                    </div>

                    {/* Build trust before making the offer */}
                    <div className="rounded-2xl border border-[#2e2e38] bg-[#18181c] p-4 space-y-2">
                      <h4 className="text-sm font-bold text-white">Build trust before making the offer</h4>
                      <p className="text-xs text-[#9B9085] leading-relaxed">
                        In a five-day course, deliver one clear win each day. On the final day, introduce a relevant paid next step that helps the reader continue the progress they have already made.
                      </p>
                    </div>
                  </div>
                </div>
              ) : selectedTopic === "How do they work?" ? (
                <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#222228] border border-[#2e2e38] text-[#FE6F34]">
                      <Sliders className="h-5.5 w-5.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#9B9085] uppercase tracking-wider">FROM VISITOR TO SUBSCRIBER</p>
                      <h2 className="text-lg font-bold text-white leading-tight">How do lead magnets work?</h2>
                    </div>
                  </div>

                  <p className="text-sm text-[#d4c8bc] leading-relaxed">
                    The resource, page, delivery, and follow-up work together as one simple flow.
                  </p>

                  {/* 6-step flow */}
                  <div className="space-y-5 pt-1">
                    {/* Step 1 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-[#1c1c1e] text-xs font-semibold mt-0.5">
                        1
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white">Make the resource</h4>
                        <p className="text-sm text-[#9B9085] leading-relaxed mt-0.5">
                          Create the actual PDF, template, video, course, tool, or other resource people will receive.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-[#1c1c1e] text-xs font-semibold mt-0.5">
                        2
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white">Add it to the journey</h4>
                        <p className="text-sm text-[#9B9085] leading-relaxed mt-0.5">
                          Give the resource an accessible link and paste that link into the Delivery email in Magnets.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-[#1c1c1e] text-xs font-semibold mt-0.5">
                        3
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white">Promote the page</h4>
                        <p className="text-sm text-[#9B9085] leading-relaxed mt-0.5">
                          Publish the page and share its link in the places your audience already pays attention.
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-[#1c1c1e] text-xs font-semibold mt-0.5">
                        4
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white">They sign up</h4>
                        <p className="text-sm text-[#9B9085] leading-relaxed mt-0.5">
                          A visitor sees the promise and enters their details to request the resource.
                        </p>
                      </div>
                    </div>

                    {/* Step 5 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-[#1c1c1e] text-xs font-semibold mt-0.5">
                        5
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white">They get the promised value</h4>
                        <p className="text-sm text-[#9B9085] leading-relaxed mt-0.5">
                          Magnets emails the resource link immediately and records the signup for you.
                        </p>
                      </div>
                    </div>

                    {/* Step 6 */}
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F4F0] text-[#1c1c1e] text-xs font-semibold mt-0.5">
                        6
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white">Continue the conversation</h4>
                        <p className="text-sm text-[#9B9085] leading-relaxed mt-0.5">
                          Relevant follow-up can help them use the resource, answer the next question, or introduce your offer.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Tip Card */}
                  <div className="rounded-2xl border border-[#2e2e38] bg-[#222227] p-4 text-sm text-[#9B9085] leading-relaxed mt-4">
                    Publishing is only the start. Put the link in your website, social profiles, posts, newsletter, podcast notes, or anywhere else the right people already find you.
                  </div>
                </div>
              ) : selectedTopic === "Why use a lead magnet?" ? (
                <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#222228] border border-[#2e2e38] text-[#FE6F34]">
                      <CheckCircle2 className="h-5.5 w-5.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#9B9085] uppercase tracking-wider">GIVE VALUE FIRST</p>
                      <h2 className="text-lg font-bold text-white leading-tight">Why use a lead magnet?</h2>
                    </div>
                  </div>

                  <p className="text-sm text-[#d4c8bc] leading-relaxed">
                    Most people will not buy or book the first time they find you. A lead magnet asks for a much smaller commitment, so useful attention does not have to disappear when they leave the page.
                  </p>

                  {/* 2x2 Grid of Benefit Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Capture interest */}
                    <div className="rounded-2xl border border-[#2e2e38] bg-[#222227] p-3.5 sm:p-4 space-y-1.5">
                      <div className="flex items-center gap-2 text-[#34d399]">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <h4 className="text-sm font-semibold text-white">Capture interest</h4>
                      <p className="text-xs text-[#9B9085] leading-relaxed">
                        Give someone a reason to join your audience before they are ready to buy.
                      </p>
                    </div>

                    {/* Attract better-fit leads */}
                    <div className="rounded-2xl border border-[#2e2e38] bg-[#222227] p-3.5 sm:p-4 space-y-1.5">
                      <div className="flex items-center gap-2 text-[#34d399]">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <h4 className="text-sm font-semibold text-white">Attract better-fit leads</h4>
                      <p className="text-xs text-[#9B9085] leading-relaxed">
                        A focused resource appeals to people who already care about the problem you solve.
                      </p>
                    </div>

                    {/* Prove your expertise */}
                    <div className="rounded-2xl border border-[#2e2e38] bg-[#222227] p-3.5 sm:p-4 space-y-1.5">
                      <div className="flex items-center gap-2 text-[#34d399]">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <h4 className="text-sm font-semibold text-white">Prove your expertise</h4>
                      <p className="text-xs text-[#9B9085] leading-relaxed">
                        A genuinely useful result lets people experience the quality of your thinking.
                      </p>
                    </div>

                    {/* Create an automatic next step */}
                    <div className="rounded-2xl border border-[#2e2e38] bg-[#222227] p-3.5 sm:p-4 space-y-1.5">
                      <div className="flex items-center gap-2 text-[#34d399]">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <h4 className="text-sm font-semibold text-white">Create an automatic next step</h4>
                      <p className="text-xs text-[#9B9085] leading-relaxed">
                        Deliver the resource immediately, then send relevant follow-up without doing it by hand.
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[#9B9085] leading-relaxed pt-1">
                    The subject of the resource also tells you something useful about intent. Someone who requests a pricing template, for example, has shown you the problem they are trying to solve.
                  </p>
                </div>
              ) : selectedTopic === "What is a lead magnet?" ? (
                <div className="max-w-[43rem] mx-auto space-y-6 py-2">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#222228] border border-[#2e2e38] text-[#FE6F34]">
                      <Gift className="h-5.5 w-5.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#9B9085] uppercase tracking-wider">THE SIMPLE DEFINITION</p>
                      <h2 className="text-lg font-bold text-white leading-tight">What is a lead magnet?</h2>
                    </div>
                  </div>

                  <p className="text-sm text-[#d4c8bc] leading-relaxed">
                    A lead magnet is a useful resource or experience offered in exchange for contact information, usually an email address. It gives a potential customer a quick win around a problem you solve, and gives you a relevant reason to follow up with them.
                  </p>

                  <div className="rounded-2xl border border-[#2e2e38] bg-[#222227] p-5 space-y-2">
                    <h4 className="text-sm font-semibold text-white">Think of it as a useful preview</h4>
                    <p className="text-xs text-[#9B9085] leading-relaxed">
                      A bookkeeper might offer a month-end checklist. The checklist solves a real problem now, demonstrates how the bookkeeper can help, and creates a natural path to a future conversation about managing the reader's finances.
                    </p>
                  </div>
                </div>
              ) : selectedTopic ? (
                <div className="max-w-2xl mx-auto py-8 text-center space-y-4">
                  <h3 className="text-xl font-bold text-white">{selectedTopic}</h3>
                  <p className="text-sm text-[#9B9085]">Detailed guide and steps for this topic will be available here soon.</p>
                  <button
                    onClick={() => setSelectedTopic(null)}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#222227] px-4 py-2 text-xs font-semibold text-white border border-[#2e2e38] hover:bg-[#282830] transition-colors"
                  >
                    Back to topics
                  </button>
                </div>
              ) : (
                <>
                  {/* What do you need help with? Title */}
                  {!searchQuery && (
                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white">What do you need help with?</h2>
                      <p className="text-xs text-zinc-700 dark:text-[#9B9085] mt-1">Choose a topic for a clear answer and the exact steps to follow.</p>
                    </div>
                  )}

                  {/* Modal Search Bar */}
                  <div className="relative flex items-center rounded-xl border border-[#E5E3DD] bg-white dark:border-[#2e2e38] dark:bg-[#141417] px-3.5 focus-within:border-[#FE6F34] mb-2 transition-colors shadow-sm dark:shadow-none">
                    <Search className="h-4 w-4 text-zinc-400 dark:text-[#9B9085] mr-2 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search topics, integrations, or setup"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent py-2.5 text-xs text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 dark:placeholder-[#71717a] focus:ring-0"
                    />
                  </div>

                  {searchQuery ? (
                    <div>
                      <p className="text-xs font-bold text-[#9B9085] uppercase tracking-wider mb-3">Search Results</p>
                      {filteredTopics.length === 0 ? (
                        <p className="text-xs text-[#9B9085] py-6 text-center">No topics match your search query.</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-2">
                          {filteredTopics.map((topic) => (
                            <button
                              key={topic.text}
                              onClick={() => setSelectedTopic(topic.text)}
                              className="flex items-center justify-between rounded-lg bg-[#222227] border border-[#2e2e38] hover:bg-[#282830] p-3.5 text-left text-xs font-semibold text-white transition-colors"
                            >
                              <span className="text-xs font-semibold text-white">{topic.text}</span>
                              <ChevronRight className="h-3.5 w-3.5 text-[#FE6F34]" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                      {/* Left Column (LEARN, SET UP, MANAGE) */}
                      <div className="space-y-3.5">
                        {/* LEARN */}
                        <div className="rounded-2xl border border-[#E5E3DD] bg-[#F7F5F0] dark:border-[#2e2e38] dark:bg-[#222227] p-3.5 sm:p-4">
                          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider mb-3">
                            <span>{helpTopics.learn.title}</span>
                            <span>{helpTopics.learn.count}</span>
                          </div>
                          <div className="space-y-2">
                            {helpTopics.learn.items.map((topic) => (
                              <button
                                key={topic.text}
                                onClick={() => setSelectedTopic(topic.text)}
                                className="group flex w-full items-center justify-between rounded-2xl bg-white border border-[#E5E3DD] hover:bg-[#F5F3ED] dark:bg-[#161619] dark:border-[#3f3f4c] dark:hover:bg-[#222227] dark:hover:border-[#525266] p-3.5 text-left text-sm font-semibold text-zinc-800 dark:text-[#d4c8bc] transition-all shadow-sm dark:shadow-none"
                              >
                                <div className="flex items-center gap-3.5">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5F3EE] border border-[#E5E3DD] text-zinc-700 dark:bg-[#222228] dark:border-[#2e2e38] dark:text-[#9B9085] group-hover:bg-[#FE6F34]/15 group-hover:border-[#FE6F34]/40 group-hover:text-[#FE6F34] transition-all">
                                    {topic.icon === "BookOpen" && <BookOpen className="h-3.5 w-3.5" />}
                                    {topic.icon === "Gift" && <Gift className="h-3.5 w-3.5" />}
                                    {topic.icon === "Sliders" && <Sliders className="h-3.5 w-3.5" />}
                                    {topic.icon === "Lightbulb" && <Lightbulb className="h-3.5 w-3.5" />}
                                  </span>
                                  <span>{topic.text}</span>
                                </div>
                                <ChevronRight className="h-3.5 w-3.5 text-[#71717a]" />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* SET UP */}
                        <div className="rounded-2xl border border-[#E5E3DD] bg-[#F7F5F0] dark:border-[#2e2e38] dark:bg-[#222227] p-3.5 sm:p-4">
                          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider mb-3">
                            <span>{helpTopics.setup.title}</span>
                            <span>{helpTopics.setup.count}</span>
                          </div>
                          <div className="space-y-2">
                            {helpTopics.setup.items.map((topic) => (
                              <button
                                key={topic.text}
                                onClick={() => setSelectedTopic(topic.text)}
                                className="group flex w-full items-center justify-between rounded-2xl bg-white border border-[#E5E3DD] hover:bg-[#F5F3ED] dark:bg-[#161619] dark:border-[#3f3f4c] dark:hover:bg-[#222227] dark:hover:border-[#525266] p-3.5 text-left text-sm font-semibold text-zinc-800 dark:text-[#d4c8bc] transition-all shadow-sm dark:shadow-none"
                              >
                                <div className="flex items-center gap-3.5">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5F3EE] border border-[#E5E3DD] text-zinc-700 dark:bg-[#222228] dark:border-[#2e2e38] dark:text-[#9B9085] group-hover:bg-[#FE6F34]/15 group-hover:border-[#FE6F34]/40 group-hover:text-[#FE6F34] transition-all">
                                    {topic.icon === "Settings" && <Settings className="h-3.5 w-3.5" />}
                                    {topic.icon === "Globe" && <Globe className="h-3.5 w-3.5" />}
                                    {topic.icon === "Mail" && <Mail className="h-3.5 w-3.5" />}
                                    {topic.icon === "BookOpen" && <BookOpen className="h-3.5 w-3.5" />}
                                  </span>
                                  <span>{topic.text}</span>
                                </div>
                                <ChevronRight className="h-3.5 w-3.5 text-[#71717a]" />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* MANAGE */}
                        <div className="rounded-2xl border border-[#E5E3DD] bg-[#F7F5F0] dark:border-[#2e2e38] dark:bg-[#222227] p-3.5 sm:p-4">
                          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider mb-3">
                            <span>{helpTopics.manage.title}</span>
                            <span>{helpTopics.manage.count}</span>
                          </div>
                          <div className="space-y-2">
                            {helpTopics.manage.items.map((topic) => (
                              <button
                                key={topic.text}
                                onClick={() => setSelectedTopic(topic.text)}
                                className="group flex w-full items-center justify-between rounded-2xl bg-white border border-[#E5E3DD] hover:bg-[#F5F3ED] dark:bg-[#161619] dark:border-[#3f3f4c] dark:hover:bg-[#222227] dark:hover:border-[#525266] p-3.5 text-left text-sm font-semibold text-zinc-800 dark:text-[#d4c8bc] transition-all shadow-sm dark:shadow-none"
                              >
                                <div className="flex items-center gap-3.5">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5F3EE] border border-[#E5E3DD] text-zinc-700 dark:bg-[#222228] dark:border-[#2e2e38] dark:text-[#9B9085] group-hover:bg-[#FE6F34]/15 group-hover:border-[#FE6F34]/40 group-hover:text-[#FE6F34] transition-all">
                                    {topic.icon === "Users" && <Users className="h-3.5 w-3.5" />}
                                    {topic.icon === "BarChart3" && <BarChart3 className="h-3.5 w-3.5" />}
                                    {topic.icon === "User" && <User className="h-3.5 w-3.5" />}
                                    {topic.icon === "PlayCircle" && <PlayCircle className="h-3.5 w-3.5" />}
                                  </span>
                                  <span>{topic.text}</span>
                                </div>
                                <ChevronRight className="h-3.5 w-3.5 text-[#71717a]" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Column (BUILD, CONNECTIONS) */}
                      <div className="space-y-3.5">
                        {/* BUILD */}
                        <div className="rounded-2xl border border-[#E5E3DD] bg-[#F7F5F0] dark:border-[#2e2e38] dark:bg-[#222227] p-3.5 sm:p-4">
                          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider mb-3">
                            <span>{helpTopics.build.title}</span>
                            <span>{helpTopics.build.count}</span>
                          </div>
                          <div className="space-y-2">
                            {helpTopics.build.items.map((topic) => (
                              <button
                                key={topic.text}
                                onClick={() => setSelectedTopic(topic.text)}
                                className="group flex w-full items-center justify-between rounded-2xl bg-white border border-[#E5E3DD] hover:bg-[#F5F3ED] dark:bg-[#161619] dark:border-[#3f3f4c] dark:hover:bg-[#222227] dark:hover:border-[#525266] p-3.5 text-left text-sm font-semibold text-zinc-800 dark:text-[#d4c8bc] transition-all shadow-sm dark:shadow-none"
                              >
                                <div className="flex items-center gap-3.5">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5F3EE] border border-[#E5E3DD] text-zinc-700 dark:bg-[#222228] dark:border-[#2e2e38] dark:text-[#9B9085] group-hover:bg-[#FE6F34]/15 group-hover:border-[#FE6F34]/40 group-hover:text-[#FE6F34] transition-all">
                                    {topic.icon === "Compass" && <Compass className="h-3.5 w-3.5" />}
                                    {topic.icon === "FileText" && <FileText className="h-3.5 w-3.5" />}
                                    {topic.icon === "FolderOpen" && <FolderOpen className="h-3.5 w-3.5" />}
                                    {topic.icon === "Palette" && <Palette className="h-3.5 w-3.5" />}
                                    {topic.icon === "Send" && <Send className="h-3.5 w-3.5" />}
                                    {topic.icon === "GitFork" && <GitFork className="h-3.5 w-3.5" />}
                                    {topic.icon === "Calendar" && <Calendar className="h-3.5 w-3.5" />}
                                  </span>
                                  <span>{topic.text}</span>
                                </div>
                                <ChevronRight className="h-3.5 w-3.5 text-[#71717a]" />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* CONNECTIONS */}
                        <div className="rounded-2xl border border-[#E5E3DD] bg-[#F7F5F0] dark:border-[#2e2e38] dark:bg-[#222227] p-3.5 sm:p-4">
                          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 dark:text-[#9B9085] uppercase tracking-wider mb-3">
                            <span>{helpTopics.connections.title}</span>
                            <span>{helpTopics.connections.count}</span>
                          </div>
                          <div className="space-y-2">
                            {helpTopics.connections.items.map((topic) => (
                              <button
                                key={topic.text}
                                onClick={() => setSelectedTopic(topic.text)}
                                className="group flex w-full items-center justify-between rounded-2xl bg-white border border-[#E5E3DD] hover:bg-[#F5F3ED] dark:bg-[#161619] dark:border-[#3f3f4c] dark:hover:bg-[#222227] dark:hover:border-[#525266] p-3.5 text-left text-sm font-semibold text-zinc-800 dark:text-[#d4c8bc] transition-all shadow-sm dark:shadow-none"
                              >
                                <div className="flex items-center gap-3.5">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5F3EE] border border-[#E5E3DD] text-zinc-700 dark:bg-[#222228] dark:border-[#2e2e38] dark:text-[#9B9085] group-hover:bg-[#FE6F34]/15 group-hover:border-[#FE6F34]/40 group-hover:text-[#FE6F34] transition-all">
                                    {topic.icon === "Share2" && <Share2 className="h-3.5 w-3.5" />}
                                    {topic.icon === "Cpu" && <Cpu className="h-3.5 w-3.5" />}
                                    {topic.icon === "Slack" && <Slack className="h-3.5 w-3.5" />}
                                    {topic.icon === "Zap" && (
                                      <svg className="h-3.5 w-3.5 fill-[#9B9085] group-hover:fill-[#FE6F34] transition-all" viewBox="0 0 24 24">
                                        <path d="M12 2a4 4 0 0 0-4 4v3.5a.5.5 0 0 0 .5.5H12a4 4 0 0 0 4-4V2z" />
                                        <path d="M2 16a4 4 0 0 0 4 4h3.5a.5.5 0 0 0 .5-.5V16a4 4 0 0 0-4-4H2z" />
                                        <path d="M16 22a4 4 0 0 0 4 4v-3.5a.5.5 0 0 0-.5-.5H16a4 4 0 0 0-4 4V22z" />
                                      </svg>
                                    )}
                                    {topic.icon === "Link" && <LinkIcon className="h-3.5 w-3.5" />}
                                    {topic.icon === "Calendar" && <Calendar className="h-3.5 w-3.5" />}
                                  </span>
                                  <span>{topic.text}</span>
                                </div>
                                <ChevronRight className="h-3.5 w-3.5 text-[#71717a]" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 'Create a magnet' Popup Modal Overlay triggered from DashboardShell */}
      {showCreateMagnetModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-all duration-200"
          onClick={() => setShowCreateMagnetModal(false)}
        >
          <div
            className="relative w-full max-w-[460px] rounded-2xl border border-[#2e2e38] bg-[#18181c] p-6 text-white shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Create a magnet</h3>
                <p className="text-xs text-[#9B9085] mt-1">Name the page and choose its URL.</p>
              </div>
              <button
                onClick={() => setShowCreateMagnetModal(false)}
                className="rounded-lg p-1 text-[#9B9085] hover:bg-[#25252b] hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const cleanSlug = createMagnetName
                  .toLowerCase()
                  .trim()
                  .replace(/[^a-z0-9\s-]/g, "")
                  .replace(/\s+/g, "-") || "untitled-page";
                const newId = `page-${Date.now()}`;

                try {
                  const { loadPages, savePages } = require("@/lib/store");
                  const currentPages = loadPages();
                  const newPage = {
                    id: newId,
                    name: createMagnetName.trim() || "Untitled Page",
                    slug: cleanSlug,
                    status: "draft",
                    headline: createMagnetName.trim() || "Untitled Page",
                    subheadline: "Enter your email to get instant access.",
                    buttonText: "Get instant access",
                    accent: "#FE6F34",
                    views: 0,
                    signups: 0,
                    updatedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                    deliveryEmail: {
                      subject: "Your resource is inside",
                      previewText: "Here is your link",
                      body: "Thanks for signing up!",
                      linkText: "Access resource",
                      linkUrl: "",
                    },
                  };
                  savePages([newPage, ...currentPages]);
                } catch (_) { }

                setShowCreateMagnetModal(false);
                setCreateMagnetName("");
                router.push(`/dashboard/leadmagnets/${newId}`);
              }}
              className="space-y-4"
            >
              {/* Page Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-800 dark:text-[#d4c8bc]">Page name</label>
                <input
                  type="text"
                  autoFocus
                  value={createMagnetName}
                  onChange={(e) => setCreateMagnetName(e.target.value)}
                  placeholder="AI Pipeline Playbook"
                  className="w-full rounded-xl border border-zinc-200 dark:border-[#2e2e38] bg-zinc-50 dark:bg-[#121214] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-[#52525b] outline-none focus:ring-1 focus:ring-[#FE6F34] transition-all"
                  required
                />
              </div>

              {/* URL Slug */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#d4c8bc]">URL slug</label>
                <div className="flex items-center rounded-xl border border-[#2e2e38] bg-[#121214] px-3.5 py-2.5 text-xs text-[#9B9085]">
                  <span className="text-[#666675] shrink-0 mr-1.5">/</span>
                  <span className="font-mono text-[#d4c8bc] truncate">
                    {createMagnetName
                      .toLowerCase()
                      .trim()
                      .replace(/[^a-z0-9\s-]/g, "")
                      .replace(/\s+/g, "-") || "untitled-page"}
                  </span>
                </div>
                <p className="text-[11px] text-[#666675]">The path of the page. Lowercase, digits, and hyphens only.</p>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateMagnetModal(false)}
                  className="rounded-xl border border-[#2e2e38] bg-[#222228] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2c2c34] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-[#FE6F34] px-4 py-2 text-xs font-bold text-black hover:bg-[#ff7d47] transition-all cursor-pointer shadow-sm"
                >
                  <span>+</span>
                  <span>Create page</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}