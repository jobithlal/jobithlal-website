import Link from "next/link";
import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";
import { seoMetadata } from "@/lib/seo";
import { siteSettings as site } from "@/content/site";

export async function generateMetadata(): Promise<Metadata> {
  return seoMetadata("/terms", {
  title: "Terms & Conditions",
  description: "Terms governing use of the JOBITHLAL website."
  });
}

// Starting template. Project-specific terms belong in each signed proposal. Have it reviewed before launch.
export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions" updated="20 November 2026">
      <section>
        <p>
          These terms apply to your use of the {site.name} website. By using the site you agree to them. If you don&apos;t agree, please don&apos;t
          use the site.
        </p>
      </section>
      <section>
        <h2>Website content</h2>
        <p>
          Content on this site — including text, graphics, video and design — belongs to {site.name} or its clients and is shown for portfolio
          purposes. You may not copy, reuse or redistribute it without written permission.
        </p>
      </section>
      <section>
        <h2>Project work</h2>
        <p>
          Information on this website describes services in general terms and is not an offer. The scope, timeline, fees, revisions, usage rights
          and payment terms for any project are set out in a written proposal or agreement, which takes precedence over this page.
        </p>
      </section>
      <section>
        <h2>Inquiries</h2>
        <p>
          Submitting the contact form does not create a contract. Please provide accurate information so I can respond properly. See the{" "}
          <Link href="/privacy-policy">Privacy Policy</Link> for how your details are handled.
        </p>
      </section>
      <section>
        <h2>External links</h2>
        <p>This site may link to third-party websites. I&apos;m not responsible for their content or practices.</p>
      </section>
      <section>
        <h2>Liability</h2>
        <p>
          The website is provided &quot;as is&quot;. To the extent permitted by law, {site.name} is not liable for losses arising from use of the
          website.
        </p>
      </section>
      <section>
        <h2>Governing law</h2>
        <p>These terms are governed by the laws of the State of Qatar.</p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms: <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
      </section>
    </LegalPage>
  );
}
