import {
  ArrowRightIcon,
  CheckIcon,
  CircleCheckIcon,
  EarthIcon,
  FileTextIcon,
  MailIcon,
  SendIcon,
  SparklesIcon,
  UsersIcon,
} from "@/components/icons";
import SiteFooter from "@/layout/site-footer";
import SiteHeader from "@/layout/site-header";
import Reveal from "@/components/reveal";
import HeroDashboard from "@/components/hero-dashboard";
import BrandLogo, { MagnetsMark, GeminiLogo } from "@/components/brand";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://leadmagnets.so/#organization",
      name: "LeadMagnets",
      url: "https://leadmagnets.so",
      logo: { "@type": "ImageObject", url: "https://leadmagnets.so/brand/magnets-mark-dark.png" },
    },
    {
      "@type": "WebSite",
      "@id": "https://leadmagnets.so/#website",
      name: "LeadMagnets",
      url: "https://leadmagnets.so",
      publisher: { "@id": "https://leadmagnets.so/#organization" },
      inLanguage: "en",
    },
    {
      "@type": "WebPage",
      "@id": "https://leadmagnets.so/#webpage",
      name: "Lead Magnet Builder for Landing Pages and Email Capture",
      description: "Create lead magnet landing pages, capture emails, deliver resources instantly, and follow up automatically.",
      url: "https://leadmagnets.so",
      isPartOf: { "@id": "https://leadmagnets.so/#website" },
      about: { "@id": "https://leadmagnets.so/#software" },
      inLanguage: "en",
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://leadmagnets.so/#software",
      name: "LeadMagnets",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://leadmagnets.so",
      description: "A lead magnet builder for landing pages, email capture, resource delivery, and follow-up email sequences.",
      provider: { "@id": "https://leadmagnets.so/#organization" },
      featureList: [
        "Lead magnet landing pages",
        "Email capture forms",
        "Instant resource delivery",
        "Follow-up email sequences",
        "Custom domains",
        "Beehiiv, Kit, Slack, Pipedrive, and Zapier integrations",
      ],
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Can I publish before I have a domain?",
          acceptedAnswer: { "@type": "Answer", text: "Yes. Choose a LeadMagnets username and publish on your LeadMagnets URL. A custom domain is optional." },
        },
        {
          "@type": "Question",
          name: "Will LeadMagnets send the resource email for me?",
          acceptedAnswer: { "@type": "Answer", text: "Yes. LeadMagnets can send the resource email from its verified sender address. You can add your own sender domain later." },
        },
        {
          "@type": "Question",
          name: "Can I follow up with new signups?",
          acceptedAnswer: { "@type": "Answer", text: "Yes. Add a sequence, choose the timing for each email, and stop it automatically when someone books a call." },
        },
      ],
    },
  ],
};

const features = [
  {
    icon: FileTextIcon,
    title: "Make the offer clear",
    body: "Put the problem, the promise, and the resource on one focused page people understand in seconds.",
  },
  {
    icon: MailIcon,
    title: "Deliver it immediately",
    body: "The resource email goes out as soon as someone signs up, so there is no manual sending or chasing.",
  },
  {
    icon: SendIcon,
    title: "Follow up while it matters",
    body: "Add a sequence, control the delays, and stop it when someone books a call.",
  },
  {
    icon: UsersIcon,
    title: "Send leads where work happens",
    body: "Keep signups in LeadMagnets or send them to Beehiiv, Kit, Slack, Pipedrive, Zapier, and your existing workflow.",
  },
];

const steps = [
  { number: "01", title: "Make the offer", body: "Show the problem, the promise, and exactly what people get." },
  { number: "02", title: "Share one link", body: "Publish on LeadMagnets now. Connect your own domain when it is worth doing." },
  { number: "03", title: "Turn interest into action", body: "Deliver the resource, follow up, and route each lead into your stack." },
];

const pipeline = [
  "LeadMagnets page",
  "Instant delivery",
  "Follow-up sequence",
  "Beehiiv, Kit, Slack, Pipedrive, or Zapier",
];

const faqs = [
  {
    question: "Can I publish before I have a domain?",
    answer: "Yes. Choose a LeadMagnets username and publish on your LeadMagnets URL. A custom domain is optional.",
  },
  {
    question: "Will LeadMagnets send the resource email for me?",
    answer: "Yes. LeadMagnets can send the resource email from its verified sender address. You can add your own sender domain later.",
  },
  {
    question: "Can I follow up with new signups?",
    answer: "Yes. Add a sequence, choose the timing for each email, and stop it automatically when someone books a call.",
  },
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#F0F7FF] dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Section 1: Hero Section (#0a0a0a in dark mode, matching Simple by default section) */}
      <section className="relative bg-[#F0F7FF] dark:bg-[#0a0a0a]">
        <SiteHeader />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-0 h-[29rem] vercel-dot-bg opacity-25 dark:opacity-10" />
        <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-12 sm:px-8 sm:pt-20 lg:px-10 lg:pb-28">
          <Reveal className="relative z-10 mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0066B2]/20 dark:border-white/10 bg-white dark:bg-[#191919] px-3.5 py-1.5 text-xs font-semibold text-[#0066B2] dark:text-[#38BDF8] shadow-sm">
              <SparklesIcon className="h-3.5 w-3.5 text-[#0066B2] dark:text-[#38BDF8]" />
              Lead capture without the setup tax
            </div>
            <h1 className="mx-auto mt-7 max-w-4xl text-5xl font-black leading-[1.02] text-zinc-900 dark:text-white sm:text-6xl lg:text-7xl tracking-tight">
              Build lead magnets that turn attention into conversations
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400 sm:text-xl font-normal">
              Create the page. Capture the email. Deliver the resource. Follow up while the problem is still top of mind.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3.5 sm:flex-row">
              <a
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0066B2] hover:bg-[#005799] px-6 text-base font-bold text-white shadow-lg transition-all active:scale-98"
                href="/register"
              >
                Build your first page <ArrowRightIcon className="h-4 w-4" />
              </a>
              <a
                className="inline-flex h-12 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#191919] px-6 text-base font-bold text-zinc-700 dark:text-zinc-200 shadow-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
                href="#how-it-works"
              >
                See how it works
              </a>
            </div>
            <p className="mt-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">No domain or sender setup required to start.</p>
          </Reveal>
          <HeroDashboard />
        </div>
      </section>

      {/* Section 2: Features (#191919 in dark mode) */}
      <section className="border-y border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#191919]" id="features">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0066B2] dark:text-[#38BDF8]">Built for what happens next</p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold leading-[1.1] text-zinc-900 dark:text-white tracking-tight">
                A lead magnet is only useful if it creates the next conversation.
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                LeadMagnets handles the boring handoff between interest and action, so you can focus on making an offer worth taking.
              </p>
            </Reveal>
            <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
              {features.map((f, index) => (
                <Reveal key={f.title} delay={index * 0.08}>
                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] dark:bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8]">
                      <f.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-white">{f.title}</h3>
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{f.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: How It Works (#0a0a0a in dark mode) */}
      <section className="bg-[#F0F7FF] dark:bg-[#0a0a0a] py-20 sm:py-28 border-b border-zinc-200/80 dark:border-zinc-800/80" id="how-it-works">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <Reveal className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-[#0066B2] dark:text-[#38BDF8]">Simple by default</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold leading-[1.1] text-zinc-900 dark:text-white tracking-tight">
              Three steps between your idea and a new lead.
            </h2>
          </Reveal>
          <div className="mt-12 grid divide-y divide-zinc-200 dark:divide-white/10 border-y border-zinc-200 dark:border-white/10 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            <Reveal delay={0} className="min-w-0 py-8 sm:py-10 lg:pl-0 lg:pr-12">
              <span className="font-mono text-xs font-bold text-[#0066B2] dark:text-[#38BDF8]">{steps[0].number}</span>
              <h3 className="mt-4 text-xl font-bold text-zinc-900 dark:text-white">{steps[0].title}</h3>
              <p className="mt-2.5 max-w-xs text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{steps[0].body}</p>
            </Reveal>
            <Reveal delay={0.1} className="min-w-0 py-8 sm:py-10 lg:px-12">
              <span className="font-mono text-xs font-bold text-[#0066B2] dark:text-[#38BDF8]">{steps[1].number}</span>
              <h3 className="mt-4 text-xl font-bold text-zinc-900 dark:text-white">{steps[1].title}</h3>
              <p className="mt-2.5 max-w-xs text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{steps[1].body}</p>
            </Reveal>
            <Reveal delay={0.2} className="min-w-0 py-8 sm:py-10 lg:pl-12 lg:pr-0">
              <span className="font-mono text-xs font-bold text-[#0066B2] dark:text-[#38BDF8]">{steps[2].number}</span>
              <h3 className="mt-4 text-xl font-bold text-zinc-900 dark:text-white">{steps[2].title}</h3>
              <p className="mt-2.5 max-w-xs text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{steps[2].body}</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Section 4: Integrations (#191919 in dark mode) */}
      <section className="bg-white dark:bg-[#191919] py-20 sm:py-28 border-b border-zinc-200/80 dark:border-zinc-800/80" id="integrations">
        <div className="mx-auto grid max-w-7xl items-start gap-12 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:px-10">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0066B2] dark:text-[#38BDF8]">Use your stack when you need it</p>
            <h2 className="mt-3 max-w-xl text-3xl sm:text-4xl font-extrabold leading-[1.1] text-zinc-900 dark:text-white tracking-tight">
              Start with a page. Add complexity only when it earns its place.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              Get live on LeadMagnets first. Add your domain, calendar, newsletter, Slack, or CRM only when it helps you close the loop.
            </p>
            <div className="mt-8 grid gap-3.5">
              <div className="flex gap-3 text-xs sm:text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                <CircleCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#0066B2] dark:text-[#38BDF8]" />
                <span>Publish on a LeadMagnets URL before you buy, connect, or configure anything else.</span>
              </div>
              <div className="flex gap-3 text-xs sm:text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                <CircleCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#0066B2] dark:text-[#38BDF8]" />
                <span>Send the resource immediately from LeadMagnets, then switch to your own verified sender when you want to.</span>
              </div>
              <div className="flex gap-3 text-xs sm:text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                <CircleCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#0066B2] dark:text-[#38BDF8]" />
                <span>Keep each lead connected to the right follow-up and integrations.</span>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a] p-6 shadow-xl sm:p-8">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-5">
                <div>
                  <p className="text-xs font-bold text-zinc-400">ONE SIGNUP</p>
                  <p className="mt-1 text-base font-extrabold text-zinc-900 dark:text-white">From page to pipeline</p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF6FF] dark:bg-[#0066B2]/20 text-[#0066B2] dark:text-[#38BDF8]">
                  <EarthIcon className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-6 space-y-3.5">
                {pipeline.map((label, i) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0066B2] text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</span>
                    {i < pipeline.length - 1 ? <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" /> : <CheckIcon className="ml-auto h-4 w-4 text-[#0066B2] dark:text-[#38BDF8]" />}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Section 5: FAQ (#0a0a0a in dark mode) */}
      <section className="border-b border-zinc-200/80 dark:border-zinc-800 bg-[#F0F7FF] dark:bg-[#0a0a0a] px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
        <Reveal className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-wider text-[#0066B2] dark:text-[#38BDF8]">Before you start</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold leading-[1.1] text-zinc-900 dark:text-white tracking-tight">The useful answers.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {faqs.map((faq) => (
              <article key={faq.question} className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-[#191919] p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">{faq.question}</h3>
                <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{faq.answer}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Section 6: CTA (#191919 in dark mode) */}
      <section className="bg-white dark:bg-[#191919] px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <Reveal className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <GeminiLogo size="h-14 sm:h-16 w-auto" />
          <h2 className="mt-6 text-3xl sm:text-5xl font-extrabold leading-[1.08] text-zinc-900 dark:text-white tracking-tight">
            Make the thing people are happy to give their email for
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Build the page, share the link, and let LeadMagnets handle the first response every time someone opts in.
          </p>
          <a
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-[#0066B2] hover:bg-[#005799] px-6 text-base font-bold text-white shadow-lg transition-all active:scale-98"
            href="/register"
          >
            Start free <ArrowRightIcon className="h-4 w-4" />
          </a>
        </Reveal>
      </section>

      <SiteFooter />
    </main>
  );
}