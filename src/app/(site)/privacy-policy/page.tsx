import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";
import { pageMetadata } from "@/lib/seo";
import { siteSettings as site } from "@/content/site";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description: "How JOBITHLAL collects, uses and protects personal information submitted through this website.",
  path: "/privacy-policy",
});

// Starting template written for this site's actual data flows. Have it reviewed by a legal advisor before launch.
export default function PrivacyPage() {
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
        <p>
          This website does not currently use advertising or analytics cookies. If analytics are introduced, they will only run after you give
          consent, and this policy will be updated.
        </p>
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
