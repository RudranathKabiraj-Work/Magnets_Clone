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
import { MagnetsMark } from "@/components/brand";

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
    <main className="overflow-hidden bg-brand-soft text-ink-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />

      <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-12 sm:px-8 sm:pt-20 lg:px-10 lg:pb-28">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-0 h-[29rem] vercel-dot-bg opacity-25" />
        <Reveal className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 shadow-sm">
            <SparklesIcon className="h-3.5 w-3.5 text-brand-orange" />
            Lead capture without the setup tax
          </div>
          <h1 className="mx-auto mt-7 max-w-4xl text-5xl font-semibold leading-[1.02] text-ink-950 sm:text-6xl lg:text-7xl">
            Build lead magnets that turn attention into conversations
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-ink-600 sm:text-xl">
            Create the page. Capture the email. Deliver the resource. Follow up while the problem is still top of mind.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-ink-950 px-5 text-base font-semibold text-white transition hover:bg-brand-orange hover:text-ink-950"
              href="/register"
            >
              Build your first page <ArrowRightIcon className="h-4 w-4" />
            </a>
            <a
              className="inline-flex h-12 items-center justify-center rounded-md border border-ink-200 bg-white px-5 text-base font-semibold text-ink-800 transition hover:border-ink-300 hover:bg-ink-50"
              href="#how-it-works"
            >
              See how it works
            </a>
          </div>
          <p className="mt-4 text-sm text-ink-500">No domain or sender setup required to start.</p>
        </Reveal>
        <HeroDashboard />
      </section>

      <section className="border-y border-ink-200 bg-white" id="features">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <Reveal>
              <p className="text-sm font-medium text-brand-coral">Built for what happens next</p>
              <h2 className="mt-4 text-4xl font-semibold leading-[1.08] sm:text-5xl">
                A lead magnet is only useful if it creates the next conversation.
              </h2>
              <p className="mt-5 max-w-md text-lg leading-8 text-ink-600">
                LeadMagnets handles the boring handoff between interest and action, so you can focus on making an offer worth taking.
              </p>
            </Reveal>
            <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
              {features.map((f, index) => (
                <Reveal key={f.title} delay={index * 0.08}>
                  <div className="border-t border-ink-200 pt-5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-soft text-brand-coral">
                      <f.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold text-ink-950">{f.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink-600">{f.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ink-950 py-20 text-white sm:py-28" id="how-it-works">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <Reveal className="max-w-2xl">
            <p className="text-sm font-medium text-brand-orange">Simple by default</p>
            <h2 className="mt-4 text-4xl font-semibold leading-[1.08] sm:text-5xl">
              Three steps between your idea and a new lead.
            </h2>
          </Reveal>
          <div className="mt-12 grid divide-y divide-white/15 border-y border-white/15 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            <Reveal delay={0} className="min-w-0 py-8 sm:py-10 lg:pl-0 lg:pr-12">
              <span className="font-mono text-sm text-brand-orange">{steps[0].number}</span>
              <h3 className="mt-6 text-2xl font-semibold">{steps[0].title}</h3>
              <p className="mt-3 max-w-xs text-sm leading-6 text-white/65">{steps[0].body}</p>
            </Reveal>
            <Reveal delay={0.1} className="min-w-0 py-8 sm:py-10 lg:px-12">
              <span className="font-mono text-sm text-brand-orange">{steps[1].number}</span>
              <h3 className="mt-6 text-2xl font-semibold">{steps[1].title}</h3>
              <p className="mt-3 max-w-xs text-sm leading-6 text-white/65">{steps[1].body}</p>
            </Reveal>
            <Reveal delay={0.2} className="min-w-0 py-8 sm:py-10 lg:pl-12 lg:pr-0">
              <span className="font-mono text-sm text-brand-orange">{steps[2].number}</span>
              <h3 className="mt-6 text-2xl font-semibold">{steps[2].title}</h3>
              <p className="mt-3 max-w-xs text-sm leading-6 text-white/65">{steps[2].body}</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-brand-soft py-20 sm:py-28" id="integrations">
        <div className="mx-auto grid max-w-7xl items-start gap-12 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:px-10">
          <Reveal>
            <p className="text-sm font-medium text-brand-coral">Use your stack when you need it</p>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.08] sm:text-5xl">
              Start with a page. Add complexity only when it earns its place.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-ink-600">
              Get live on LeadMagnets first. Add your domain, calendar, newsletter, Slack, or CRM only when it helps you close the loop.
            </p>
            <div className="mt-8 grid gap-3">
              <div className="flex gap-3 text-sm leading-6 text-ink-700">
                <CircleCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />
                <span>Publish on a LeadMagnets URL before you buy, connect, or configure anything else.</span>
              </div>
              <div className="flex gap-3 text-sm leading-6 text-ink-700">
                <CircleCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />
                <span>Send the resource immediately from LeadMagnets, then switch to your own verified sender when you want to.</span>
              </div>
              <div className="flex gap-3 text-sm leading-6 text-ink-700">
                <CircleCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />
                <span>Keep each lead connected to the right follow-up and integrations.</span>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="border border-ink-200 bg-white p-6 shadow-[0_24px_50px_-40px_rgba(17,17,17,0.35)] sm:p-8">
              <div className="flex items-center justify-between border-b border-ink-100 pb-5">
                <div>
                  <p className="text-xs font-medium text-ink-500">One signup</p>
                  <p className="mt-1 text-lg font-semibold">From page to pipeline</p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-soft text-brand-coral">
                  <EarthIcon className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-6 space-y-3">
                {pipeline.map((label, i) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-950 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-ink-800">{label}</span>
                    {i < pipeline.length - 1 ? <span className="h-px flex-1 bg-ink-200" /> : <CheckIcon className="ml-auto h-4 w-4 text-brand-orange" />}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-ink-200 bg-white px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
        <Reveal className="mx-auto max-w-4xl">
          <p className="text-sm font-medium text-brand-coral">Before you start</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.08] sm:text-5xl">The useful answers.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {faqs.map((faq) => (
              <article key={faq.question} className="border border-ink-200 bg-brand-soft p-5">
                <h3 className="text-base font-semibold text-ink-950">{faq.question}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-600">{faq.answer}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="border-t border-ink-200 bg-white px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <Reveal className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <MagnetsMark size="h-14 w-14" />
          <h2 className="mt-6 text-4xl font-semibold leading-[1.08] sm:text-5xl">
            Make the thing people are happy to give their email for
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-8 text-ink-600">
            Build the page, share the link, and let LeadMagnets handle the first response every time someone opts in.
          </p>
          <a
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-md bg-ink-950 px-5 text-base font-semibold text-white transition hover:bg-brand-orange hover:text-ink-950"
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