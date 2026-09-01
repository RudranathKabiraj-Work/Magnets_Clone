"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, FolderOpen, Users, Sliders, Palette, User, CircleHelp, Menu, X, Search, ChevronRight, HelpCircle, Sun, Moon, Bug, Lightbulb, LogOut, BookOpen, Gift, Compass, Send, GitFork, Calendar, Settings, Globe, Mail, Share2, Cpu, Slack, Zap, Link as LinkIcon, BarChart3, PlayCircle, CheckCircle2 } from "lucide-react";
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
        { text: "What works best", icon: "Lightbulb" },
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
          <Link href="/" aria-label="Magnets home">
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
              className={`flex items-center gap-2.5 px-2 py-1.5 w-full text-left rounded-lg transition-colors cursor-pointer ${
                showProfileMenu ? "bg-zinc-100 dark:bg-[#26262B]" : "hover:bg-zinc-100 dark:hover:bg-[#26262B]"
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-white dark:bg-[#121214]">
                {account.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || account.name.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-zinc-900 leading-tight dark:text-white">{account.name}</p>
                <p className="truncate text-[10px] text-zinc-500 leading-tight mt-0.5 dark:text-[#9B9085]">{account.email}</p>
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
              <BrandLogo height="h-6" width="w-[8.5rem]" />
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
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Help Centre Modal */}
      {showHelp && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 md:p-4 transition-all duration-200"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="relative w-full max-w-4xl h-[94vh] max-h-[96vh] rounded-2xl border border-[#2e2e38] bg-[#1a1a1e] text-white shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#2e2e38] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FE6F34] text-white shadow-sm">
                  <Sliders className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Help centre</h3>
                  <p className="text-[11px] text-[#9B9085] mt-0.5">Learn the basics or find your next step.</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="rounded-lg p-1.5 text-[#9B9085] hover:bg-[#25252b] hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6" data-lenis-prevent>
              {/* What do you need help with? Title */}
              {!searchQuery && (
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-white">What do you need help with?</h2>
                  <p className="text-xs text-[#9B9085] mt-1">Choose a topic for a clear answer and the exact steps to follow.</p>
                </div>
              )}

              {/* Modal Search Bar */}
              <div className="relative flex items-center rounded-lg border border-[#2e2e38] bg-[#141417] px-3.5 focus-within:border-[#FE6F34] mb-2 transition-colors">
                <Search className="h-4 w-4 text-[#9B9085] mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search topics, integrations, or setup"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent py-2.5 text-xs text-white outline-none placeholder-[#71717a] focus:ring-0"
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
                          onClick={() => alert(`Showing details for: ${topic.text}`)}
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
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Left Column (LEARN, SET UP, MANAGE) */}
                  <div className="space-y-6">
                    {/* LEARN */}
                    <div className="rounded-2xl border border-[#2e2e38] bg-[#222227] p-5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#9B9085] uppercase tracking-wider mb-3">
                        <span>{helpTopics.learn.title}</span>
                        <span>{helpTopics.learn.count}</span>
                      </div>
                      <div className="space-y-2">
                        {helpTopics.learn.items.map((topic) => (
                          <button
                            key={topic.text}
                            onClick={() => alert(`Help topic: ${topic.text}`)}
                            className="flex w-full items-center justify-between rounded-lg bg-[#161619] border border-[#2b2b34] hover:bg-[#1b1b20] hover:border-[#383844] px-3.5 py-2.5 text-left text-xs font-semibold text-white transition-all"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#222228] border border-[#2e2e38] text-[#9B9085]">
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
                    <div className="rounded-2xl border border-[#2e2e38] bg-[#222227] p-5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#9B9085] uppercase tracking-wider mb-3">
                        <span>{helpTopics.setup.title}</span>
                        <span>{helpTopics.setup.count}</span>
                      </div>
                      <div className="space-y-2">
                        {helpTopics.setup.items.map((topic) => (
                          <button
                            key={topic.text}
                            onClick={() => alert(`Help topic: ${topic.text}`)}
                            className="flex w-full items-center justify-between rounded-lg bg-[#161619] border border-[#2b2b34] hover:bg-[#1b1b20] hover:border-[#383844] px-3.5 py-2.5 text-left text-xs font-semibold text-white transition-all"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#222228] border border-[#2e2e38] text-[#9B9085]">
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
                    <div className="rounded-2xl border border-[#2e2e38] bg-[#222227] p-5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#9B9085] uppercase tracking-wider mb-3">
                        <span>{helpTopics.manage.title}</span>
                        <span>{helpTopics.manage.count}</span>
                      </div>
                      <div className="space-y-2">
                        {helpTopics.manage.items.map((topic) => (
                          <button
                            key={topic.text}
                            onClick={() => alert(`Help topic: ${topic.text}`)}
                            className="flex w-full items-center justify-between rounded-lg bg-[#161619] border border-[#2b2b34] hover:bg-[#1b1b20] hover:border-[#383844] px-3.5 py-2.5 text-left text-xs font-semibold text-white transition-all"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#222228] border border-[#2e2e38] text-[#9B9085]">
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
                  <div className="space-y-6">
                    {/* BUILD */}
                    <div className="rounded-2xl border border-[#2e2e38] bg-[#222227] p-5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#9B9085] uppercase tracking-wider mb-3">
                        <span>{helpTopics.build.title}</span>
                        <span>{helpTopics.build.count}</span>
                      </div>
                      <div className="space-y-2">
                        {helpTopics.build.items.map((topic) => (
                          <button
                            key={topic.text}
                            onClick={() => alert(`Help topic: ${topic.text}`)}
                            className="flex w-full items-center justify-between rounded-lg bg-[#161619] border border-[#2b2b34] hover:bg-[#1b1b20] hover:border-[#383844] px-3.5 py-2.5 text-left text-xs font-semibold text-white transition-all"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#222228] border border-[#2e2e38] text-[#9B9085]">
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
                    <div className="rounded-2xl border border-[#2e2e38] bg-[#222227] p-5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#9B9085] uppercase tracking-wider mb-3">
                        <span>{helpTopics.connections.title}</span>
                        <span>{helpTopics.connections.count}</span>
                      </div>
                      <div className="space-y-2">
                        {helpTopics.connections.items.map((topic) => (
                          <button
                            key={topic.text}
                            onClick={() => alert(`Help topic: ${topic.text}`)}
                            className="flex w-full items-center justify-between rounded-lg bg-[#161619] border border-[#2b2b34] hover:bg-[#1b1b20] hover:border-[#383844] px-3.5 py-2.5 text-left text-xs font-semibold text-white transition-all"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#222228] border border-[#2e2e38] text-[#9B9085]">
                                {topic.icon === "Share2" && <Share2 className="h-3.5 w-3.5" />}
                                {topic.icon === "Cpu" && <Cpu className="h-3.5 w-3.5" />}
                                {topic.icon === "Slack" && <Slack className="h-3.5 w-3.5" />}
                                {topic.icon === "Zap" && <Zap className="h-3.5 w-3.5" />}
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
            </div>
          </div>
        </div>
      )}

      {/* Help Centre Modal */}
      {showHelp && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 md:p-4 transition-all duration-200"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="relative w-full max-w-4xl h-[94vh] max-h-[96vh] rounded-2xl border border-[#2e2e38] bg-[#1a1a1e] text-white shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#2e2e38] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FE6F34] text-white shadow-sm">
                  <Sliders className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Help centre</h3>
                  <p className="text-[11px] text-[#9B9085] mt-0.5">Learn the basics or find your next step.</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="rounded-lg p-1.5 text-[#9B9085] hover:bg-[#25252b] hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6" data-lenis-prevent>
              {/* What do you need help with? Title */}
              {!searchQuery && (
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-white">What do you need help with?</h2>
                  <p className="text-xs text-[#9B9085] mt-1">Choose a topic for a clear answer and the exact steps to follow.</p>
                </div>
              )}

              {/* Modal Search Bar */}
              <div className="relative flex items-center rounded-lg border border-[#2e2e38] bg-[#141417] px-3.5 focus-within:border-[#FE6F34] mb-2 transition-colors">
                <Search className="h-4 w-4 text-[#9B9085] mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search topics, integrations, or setup"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent py-2.5 text-xs text-white outline-none placeholder-[#71717a] focus:ring-0"
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
                          onClick={() => alert(`Showing details for: ${topic.text}`)}
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
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Left Column (LEARN, SET UP, MANAGE) */}
                  <div className="space-y-6">
                    {/* LEARN */}
                    <div className="rounded-xl border border-[#2e2e38] bg-[#222227] p-5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#9B9085] uppercase tracking-wider mb-3">
                        <span>{helpTopics.learn.title}</span>
                        <span>{helpTopics.learn.count}</span>
                      </div>
                      <div className="space-y-2">
                        {helpTopics.learn.items.map((topic) => (
                          <button
                            key={topic.text}
                            onClick={() => alert(`Help topic: ${topic.text}`)}
                            className="flex w-full items-center justify-between rounded-lg bg-[#161619] border border-[#2b2b34] hover:bg-[#1b1b20] hover:border-[#383844] px-3.5 py-2.5 text-left text-xs font-semibold text-white transition-all"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#222228] border border-[#2e2e38] text-[#9B9085]">
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
                    <div className="rounded-xl border border-[#2e2e38] bg-[#222227] p-5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#9B9085] uppercase tracking-wider mb-3">
                        <span>{helpTopics.setup.title}</span>
                        <span>{helpTopics.setup.count}</span>
                      </div>
                      <div className="space-y-2">
                        {helpTopics.setup.items.map((topic) => (
                          <button
                            key={topic.text}
                            onClick={() => alert(`Help topic: ${topic.text}`)}
                            className="flex w-full items-center justify-between rounded-lg bg-[#161619] border border-[#2b2b34] hover:bg-[#1b1b20] hover:border-[#383844] px-3.5 py-2.5 text-left text-xs font-semibold text-white transition-all"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#222228] border border-[#2e2e38] text-[#9B9085]">
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
                    <div className="rounded-xl border border-[#2e2e38] bg-[#222227] p-5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#9B9085] uppercase tracking-wider mb-3">
                        <span>{helpTopics.manage.title}</span>
                        <span>{helpTopics.manage.count}</span>
                      </div>
                      <div className="space-y-2">
                        {helpTopics.manage.items.map((topic) => (
                          <button
                            key={topic.text}
                            onClick={() => alert(`Help topic: ${topic.text}`)}
                            className="flex w-full items-center justify-between rounded-lg bg-[#161619] border border-[#2b2b34] hover:bg-[#1b1b20] hover:border-[#383844] px-3.5 py-2.5 text-left text-xs font-semibold text-white transition-all"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#222228] border border-[#2e2e38] text-[#9B9085]">
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
                  <div className="space-y-6">
                    {/* BUILD */}
                    <div className="rounded-xl border border-[#2e2e38] bg-[#222227] p-5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#9B9085] uppercase tracking-wider mb-3">
                        <span>{helpTopics.build.title}</span>
                        <span>{helpTopics.build.count}</span>
                      </div>
                      <div className="space-y-2">
                        {helpTopics.build.items.map((topic) => (
                          <button
                            key={topic.text}
                            onClick={() => alert(`Help topic: ${topic.text}`)}
                            className="flex w-full items-center justify-between rounded-lg bg-[#161619] border border-[#2b2b34] hover:bg-[#1b1b20] hover:border-[#383844] px-3.5 py-2.5 text-left text-xs font-semibold text-white transition-all"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#222228] border border-[#2e2e38] text-[#9B9085]">
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
                    <div className="rounded-xl border border-[#2e2e38] bg-[#222227] p-5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#9B9085] uppercase tracking-wider mb-3">
                        <span>{helpTopics.connections.title}</span>
                        <span>{helpTopics.connections.count}</span>
                      </div>
                      <div className="space-y-2">
                        {helpTopics.connections.items.map((topic) => (
                          <button
                            key={topic.text}
                            onClick={() => alert(`Help topic: ${topic.text}`)}
                            className="flex w-full items-center justify-between rounded-lg bg-[#161619] border border-[#2b2b34] hover:bg-[#1b1b20] hover:border-[#383844] px-3.5 py-2.5 text-left text-xs font-semibold text-white transition-all"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#222228] border border-[#2e2e38] text-[#9B9085]">
                                {topic.icon === "Share2" && <Share2 className="h-3.5 w-3.5" />}
                                {topic.icon === "Cpu" && <Cpu className="h-3.5 w-3.5" />}
                                {topic.icon === "Slack" && <Slack className="h-3.5 w-3.5" />}
                                {topic.icon === "Zap" && <Zap className="h-3.5 w-3.5" />}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}