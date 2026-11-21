import { SiteChrome } from "@/components/layout/SiteChrome";
import NotFoundContent from "./(site)/not-found";

/** Unmatched URLs render outside the (site) group, so wrap the 404 in the site chrome here. */
export default function RootNotFound() {
  return (
    <SiteChrome>
      <NotFoundContent />
    </SiteChrome>
  );
}
