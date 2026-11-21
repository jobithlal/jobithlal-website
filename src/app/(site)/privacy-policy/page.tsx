import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";
import { seoMetadata } from "@/lib/seo";
import { siteSettings as site } from "@/content/site";
import { getAnalyticsSettings } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  return seoMetadata("/privacy-policy", {
  title: "Privacy Policy",
  description: "How JOBITHLAL collects, uses and protects personal information submitted through this website."
  });
}

// Starting template written for this site's actual data flows. Have it reviewed by a legal advisor before launch.
export default async function PrivacyPage() {
  const analytics = await getAnalyticsSettings();
  const ga = analytics.enabled && Boolean(analytics.ga4MeasurementId);
  return (
    <LegalPage title="Privacy Policy" updated="20 November 2026">
      <section>
        <p>
          This policy explains how {site.name} (&quot;I&quot;, &quot;me&quot;), operated by Jobith Lal in {site.location}, handles personal
          information when you use {site.url.replace(/^https?:\/\//, "")}.
        </p>
      </section>
      <section>
        <h2>Information I collect</h2>
        <ul>
          <li>
            <strong>Inquiry details</strong> you submit through the contact form: name, email address, the service you&apos;re interested in, project
            details, and optionally your company, phone/WhatsApp number, budget range and timeline.
          </li>
          <li>
            <strong>Messages</strong> you send directly by email or WhatsApp.
          </li>
          <li>
            <strong>Technical data</strong> such as IP address, used briefly to protect the contact form from spam and abuse.
          </li>
        </ul>
      </section>
      <section>
        <h2>How I use it</h2>
        <ul>
          <li>To reply to your inquiry and discuss, quote for and deliver your project.</li>
          <li>To protect the website and its forms against spam and misuse.</li>
        </ul>
        <p>I do not sell your information or use it for unrelated marketing.</p>
      </section>
      <section>
        <h2>Service providers</h2>
        <p>
          Inquiries are delivered by a transactional email provider and the website is hosted by a cloud hosting provider. They process data only
          to provide those services.
        </p>
      </section>
      <section>
        <h2>Cookies and analytics</h2>
        {ga ? (
          <>
            <p>
              With your permission, this site uses <strong>Google Analytics 4</strong> to understand how visitors use it — for example which pages are
              viewed, how people arrive, and whether the contact form is used. It sets first-party cookies (named <code>_ga</code> and{" "}
              <code>_ga_*</code>) and Google processes the data on my behalf.{" "}
              {analytics.requireConsent
                ? "Nothing is loaded until you choose “Accept analytics” in the cookie banner; if you decline, no analytics cookies are set."
                : "Analytics runs on page load."}{" "}
              No advertising or remarketing features are used.
            </p>
            {analytics.requireConsent && <p>You can change your choice at any time using “Cookie settings” in the footer.</p>}
          </>
        ) : (
          <p>This website does not currently use analytics or advertising cookies.</p>
        )}
      </section>
      <section>
        <h2>Retention</h2>
        <p>Inquiry details are kept only as long as needed to respond and manage any resulting project, then deleted.</p>
      </section>
      <section>
        <h2>Your choices</h2>
        <p>
          You can ask to access, correct or delete the personal information I hold about you by emailing{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
      </section>
    </LegalPage>
  );
}
