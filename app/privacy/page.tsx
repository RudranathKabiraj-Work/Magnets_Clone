import type { Metadata } from "next";
import { LegalFooter, LegalHeader } from "@/layout/legal";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Magnets Privacy Policy.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://magnets.so/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-brand-soft text-ink-900">
      <LegalHeader />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase text-ink-500">Legal</p>
        <h1 className="mt-2 text-3xl font-black text-ink-950 sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink-500">Effective July 20, 2026</p>
        <article className="prose-magnets mt-10 space-y-8 text-[15px] leading-7 text-ink-700">
          <p>
            This Policy explains how Magnets handles personal data when you use our service. It applies to Magnets account holders
            and to people who submit a form on a page created with Magnets.
          </p>
          <LegalSection title="1. The short version">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>We collect the information needed to host pages, deliver emails, run selected integrations, and keep the service secure.</li>
              <li>We do not sell personal data, use it for advertising, or use it to train AI models.</li>
              <li>Signup data belongs to the account holder whose page collected it.</li>
              <li>Secrets such as API keys and webhook URLs are encrypted at rest when stored by Magnets.</li>
              <li>Custom domains and custom sender domains are optional. A page can be hosted and sent from Magnets by default.</li>
            </ul>
          </LegalSection>
          <LegalSection title="2. Your role and our role">
            <p>
              For account data, Magnets is the controller. For signup data collected through a page created by an account holder,
              the account holder is normally the controller and Magnets acts as a processor on that account holder&apos;s behalf.
              The account holder is responsible for their privacy notice, lawful basis, permissions, and the content of messages
              they send to their audience.
            </p>
          </LegalSection>
          <LegalSection title="3. Information we collect from account holders">
            <p>When you create or use an account, we may process:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Your name, email address, authentication details, and account timestamps. Passwords are stored as hashes, not plaintext.</li>
              <li>Your chosen Magnets username, custom-domain settings, brand settings, sender settings, and page configuration.</li>
              <li>The copy, images, resource links, email content, and follow-up sequences you create.</li>
              <li>
                Integration settings and credentials you choose to add, including email, newsletter, calendar, Slack, Pipedrive, and
                Zapier connections.
              </li>
              <li>
                Technical and security information, including IP address information used for abuse prevention and rate limiting,
                request metadata, and error logs.
              </li>
            </ul>
          </LegalSection>
          <LegalSection title="4. Information collected from page visitors and subscribers">
            <p>
              When a person submits a Magnets form, we process the name and email address they provide, the page they signed up on,
              and the submission time. When a follow-up sequence is enabled, we also keep the information needed to track whether
              that sequence is active, completed, stopped, or failed for that email address.
            </p>
            <p>
              Page analytics use a random browser-tab session identifier to count visits and visible-page engagement without
              analytics cookies or raw IP addresses. For successful signups, we may also record whether that signup explicitly
              started a configured post-signup video or completed a configured quiz. These outcome timestamps are used only to
              provide aggregate performance reporting to the account holder.
            </p>
            <p>
              Forms can appear on a Magnets-hosted URL or an account holder&apos;s custom domain. The host does not change which
              account owns the signup data.
            </p>
          </LegalSection>
          <LegalSection title="5. How we use information">
            <p>We use information to:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Provide, secure, and improve the service, including account authentication and abuse prevention.</li>
              <li>Host and serve lead-magnet pages, uploaded images, and the resource email requested by a subscriber.</li>
              <li>Run follow-up email sequences configured by an account holder and honour a recipient&apos;s request to stop those follow-ups.</li>
              <li>
                Stop a configured follow-up sequence when a connected calendar provider reports that the same person booked a call,
                if the account holder has enabled that option.
              </li>
              <li>
                Send signup data to the optional integrations selected by the account holder, such as Beehiiv, Substack, Kit, Slack,
                Pipedrive, or Zapier.
              </li>
              <li>Send account holders product updates and important service notices. You can unsubscribe from product marketing emails without deleting your account.</li>
              <li>Respond to support requests and enforce our Terms.</li>
            </ul>
          </LegalSection>
          <LegalSection title="6. Email delivery and integrations">
            <p>
              Magnets can deliver resource emails from a Magnets-managed sender address. An account holder may instead use a sender
              address on a domain they have verified. Email delivery is provided through Resend. We only use an account
              holder&apos;s own sender address after its domain has been verified for that account&apos;s sending setup.
            </p>
            <p>
              Optional integrations are activated by the account holder. Depending on what they connect, signup information may be
              sent to Beehiiv, Substack, or Kit for newsletter subscription, Slack for a notification, Pipedrive to create or update
              a person, Zapier to trigger an account holder&apos;s automation, or Calendly or Cal.com to stop an enabled follow-up
              sequence after a booking. Each third party processes information under its own terms and privacy notice.
            </p>
          </LegalSection>
          <LegalSection title="7. Service providers and disclosures">
            <p>We use service providers to operate Magnets. Depending on which features are used, these include:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>Vercel</strong> for application hosting, content delivery, and file storage.</li>
              <li><strong>Neon</strong> for hosted database and authentication infrastructure.</li>
              <li><strong>Resend</strong> for email delivery and follow-up automation.</li>
              <li>
                <strong>Beehiiv, Substack, Kit, Slack, Pipedrive, Zapier, Calendly, and Cal.com</strong> when an account holder
                elects to connect those services.
              </li>
            </ul>
            <p>
              We may also disclose information where required by law, to protect the rights and safety of Magnets and others, or in
              connection with a reorganisation, merger, or sale of the service.
            </p>
          </LegalSection>
          <LegalSection title="8. Retention and deletion">
            <p>
              We retain account data while an account is active. Deleting an account removes the active account record and its
              associated Magnets pages, signup records, and follow-up records from our application database. Copies may remain in
              provider backups for a limited period under their normal backup-retention processes. We may retain limited information
              where necessary for legal obligations, security, dispute resolution, or enforcement.
            </p>
          </LegalSection>
          <LegalSection title="9. Security">
            <p>
              We use reasonable technical and organisational measures to protect information, including HTTPS in transit, password
              hashing, encrypted storage for supported integration secrets, access controls, and rate limiting. No service can
              guarantee absolute security. If a security incident requires notice, we will provide it as required by applicable law.
            </p>
          </LegalSection>
          <LegalSection title="10. Your choices and rights">
            <p>
              Depending on where you live, you may have rights to access, correct, delete, restrict, object to, or receive a copy of
              your personal data. Account holders can update much of their account information in the dashboard. To make a request,
              email{" "}
              <a className="text-ink-900 underline-offset-4 hover:underline" href="mailto:hello@magnets.so">
                hello@magnets.so
              </a>
              .
            </p>
            <p>
              If you submitted your details through an account holder&apos;s page, contact that account holder first. They control
              the purpose of that collection and any messages sent to you. You can also use the stop link in an eligible follow-up
              email to stop that sequence.
            </p>
          </LegalSection>
          <LegalSection title="11. International transfers">
            <p>
              Magnets and our providers may process information in countries other than your own, including the United States. Where
              required, we rely on appropriate safeguards for international transfers.
            </p>
          </LegalSection>
          <LegalSection title="12. Children">
            <p>
              Magnets is not intended for children under 16, and we do not knowingly collect personal information from children
              under 16. Contact us if you believe this has happened.
            </p>
          </LegalSection>
          <LegalSection title="13. Changes and contact">
            <p>
              We may update this Policy as Magnets changes. For material changes, we will provide reasonable notice before they take
              effect. Questions can be sent to{" "}
              <a className="text-ink-900 underline-offset-4 hover:underline" href="mailto:hello@magnets.so">
                hello@magnets.so
              </a>
              .
            </p>
          </LegalSection>
        </article>
        <div className="mt-12 border-t border-ink-200 pt-6 text-sm text-ink-500">
          <p>
            Questions? Email{" "}
            <a className="text-ink-900 underline-offset-4 hover:underline" href="mailto:hello@magnets.so">
              hello@magnets.so
            </a>
            .
          </p>
        </div>
      </div>
      <LegalFooter />
    </main>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-ink-950">{title}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}