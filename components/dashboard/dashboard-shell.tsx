"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, FolderOpen, Users, Sliders, Palette, User, CircleHelp, Menu, X, Search, ChevronRight, HelpCircle, Sun, Moon, Bug, Lightbulb, LogOut, BookOpen, Gift, Compass, Send, GitFork, Calendar, Settings, Globe, Mail, Share2, Cpu, Slack, Zap, Link as LinkIcon, BarChart3, PlayCircle, CheckCircle2, ArrowLeft, Sparkles, Rocket } from "lucide-react";
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
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
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
              className={`flex items-center gap-2.5 px-2 py-1.5 w-full text-left rounded-lg transition-colors cursor-pointer ${showProfileMenu ? "bg-zinc-100 dark:bg-[#26262B]" : "hover:bg-zinc-100 dark:hover:bg-[#26262B]"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-3 md:p-4 transition-all duration-200"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="relative w-full max-w-4xl h-[94vh] max-h-[96vh] rounded-2xl border border-[#2e2e38] bg-[#18181c] text-white shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#2e2e38] px-6 py-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FE6F34] text-white shadow-sm">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Help centre</h3>
                  <p className="text-[11px] text-[#9B9085] mt-0.5">Learn the basics or find your next step.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowHelp(false);
                  setSelectedTopic(null);
                }}
                className="rounded-lg p-1.5 text-[#9B9085] hover:bg-[#25252b] hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Sub-header navigation when inside a topic */}
            {selectedTopic && (
              <div className="flex items-center justify-between border-b border-[#2e2e38] bg-transparent px-6 py-2.5">
                <button
                  onClick={() => setSelectedTopic(null)}
                  className="flex items-center gap-2.5 rounded-lg bg-transparent px-4 py-2 ml-6 text-sm font-semibold text-[#d4c8bc] hover:bg-[#282830] hover:text-white transition-all"
                >
                  <ArrowLeft className="h-4 w-4 text-[#9B9085]" />
                  <span>All help topics</span>
                </button>
                <span className="text-xs font-bold uppercase tracking-wider text-[#666675] mr-4">LEARN</span>
              </div>
            )}

            {/* Modal Scroll Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6" data-lenis-prevent>
              {selectedTopic === "Create your first lead magnet" ? (
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
                      <Link
                        href="/dashboard/pages/new"
                        onClick={() => setShowHelp(false)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#FE6F34] px-4 py-2.5 text-sm font-semibold text-[#18181b] hover:bg-[#ff7b43] transition-all cursor-pointer shadow-sm"
                      >
                        <span>Create a lead magnet</span>
                        <span className="text-base font-bold">→</span>
                      </Link>

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
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold text-[#9B9085] uppercase tracking-wider">QUALITY BEATS SIZE</p>
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
                      <Sliders className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold text-[#9B9085] uppercase tracking-wider">FROM VISITOR TO SUBSCRIBER</p>
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
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold text-[#9B9085] uppercase tracking-wider">GIVE VALUE FIRST</p>
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
                      <Gift className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold text-[#9B9085] uppercase tracking-wider">THE SIMPLE DEFINITION</p>
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
                        <div className="rounded-2xl border border-[#2e2e38] bg-[#222227] p-3.5 sm:p-4">
                          <div className="flex items-center justify-between text-[10px] font-bold text-[#9B9085] uppercase tracking-wider mb-3">
                            <span>{helpTopics.learn.title}</span>
                            <span>{helpTopics.learn.count}</span>
                          </div>
                          <div className="space-y-2">
                            {helpTopics.learn.items.map((topic) => (
                              <button
                                key={topic.text}
                                onClick={() => setSelectedTopic(topic.text)}
                                className="group flex w-full items-center justify-between rounded-2xl bg-[#161619] border border-[#3f3f4c] hover:bg-[#222227] hover:border-[#525266] p-3.5 text-left text-sm font-semibold text-[#d4c8bc] transition-all"
                              >
                                <div className="flex items-center gap-3.5">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#222228] border border-[#2e2e38] text-[#9B9085] group-hover:bg-[#FE6F34]/15 group-hover:border-[#FE6F34]/40 group-hover:text-[#FE6F34] transition-all">
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
                        <div className="rounded-2xl border border-[#2e2e38] bg-[#222227] p-3.5 sm:p-4">
                          <div className="flex items-center justify-between text-[10px] font-bold text-[#9B9085] uppercase tracking-wider mb-3">
                            <span>{helpTopics.setup.title}</span>
                            <span>{helpTopics.setup.count}</span>
                          </div>
                          <div className="space-y-2">
                            {helpTopics.setup.items.map((topic) => (
                              <button
                                key={topic.text}
                                onClick={() => setSelectedTopic(topic.text)}
                                className="group flex w-full items-center justify-between rounded-2xl bg-[#161619] border border-[#3f3f4c] hover:bg-[#222227] hover:border-[#525266] p-3.5 text-left text-sm font-semibold text-[#d4c8bc] transition-all"
                              >
                                <div className="flex items-center gap-3.5">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#222228] border border-[#2e2e38] text-[#9B9085] group-hover:bg-[#FE6F34]/15 group-hover:border-[#FE6F34]/40 group-hover:text-[#FE6F34] transition-all">
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
                        <div className="rounded-2xl border border-[#2e2e38] bg-[#222227] p-3.5 sm:p-4">
                          <div className="flex items-center justify-between text-[10px] font-bold text-[#9B9085] uppercase tracking-wider mb-3">
                            <span>{helpTopics.manage.title}</span>
                            <span>{helpTopics.manage.count}</span>
                          </div>
                          <div className="space-y-2">
                            {helpTopics.manage.items.map((topic) => (
                              <button
                                key={topic.text}
                                onClick={() => setSelectedTopic(topic.text)}
                                className="group flex w-full items-center justify-between rounded-2xl bg-[#161619] border border-[#3f3f4c] hover:bg-[#222227] hover:border-[#525266] p-3.5 text-left text-sm font-semibold text-[#d4c8bc] transition-all"
                              >
                                <div className="flex items-center gap-3.5">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#222228] border border-[#2e2e38] text-[#9B9085] group-hover:bg-[#FE6F34]/15 group-hover:border-[#FE6F34]/40 group-hover:text-[#FE6F34] transition-all">
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
                        <div className="rounded-2xl border border-[#2e2e38] bg-[#222227] p-3.5 sm:p-4">
                          <div className="flex items-center justify-between text-[10px] font-bold text-[#9B9085] uppercase tracking-wider mb-3">
                            <span>{helpTopics.build.title}</span>
                            <span>{helpTopics.build.count}</span>
                          </div>
                          <div className="space-y-2">
                            {helpTopics.build.items.map((topic) => (
                              <button
                                key={topic.text}
                                onClick={() => setSelectedTopic(topic.text)}
                                className="group flex w-full items-center justify-between rounded-2xl bg-[#161619] border border-[#3f3f4c] hover:bg-[#222227] hover:border-[#525266] p-3.5 text-left text-sm font-semibold text-[#d4c8bc] transition-all"
                              >
                                <div className="flex items-center gap-3.5">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#222228] border border-[#2e2e38] text-[#9B9085] group-hover:bg-[#FE6F34]/15 group-hover:border-[#FE6F34]/40 group-hover:text-[#FE6F34] transition-all">
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
                        <div className="rounded-2xl border border-[#2e2e38] bg-[#222227] p-3.5 sm:p-4">
                          <div className="flex items-center justify-between text-[10px] font-bold text-[#9B9085] uppercase tracking-wider mb-3">
                            <span>{helpTopics.connections.title}</span>
                            <span>{helpTopics.connections.count}</span>
                          </div>
                          <div className="space-y-2">
                            {helpTopics.connections.items.map((topic) => (
                              <button
                                key={topic.text}
                                onClick={() => setSelectedTopic(topic.text)}
                                className="group flex w-full items-center justify-between rounded-2xl bg-[#161619] border border-[#3f3f4c] hover:bg-[#222227] hover:border-[#525266] p-3.5 text-left text-sm font-semibold text-[#d4c8bc] transition-all"
                              >
                                <div className="flex items-center gap-3.5">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#222228] border border-[#2e2e38] text-[#9B9085] group-hover:bg-[#FE6F34]/15 group-hover:border-[#FE6F34]/40 group-hover:text-[#FE6F34] transition-all">
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}