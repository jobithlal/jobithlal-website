import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="container-x flex min-h-[80svh] flex-col justify-center pt-32">
      <p className="eyebrow">Error 404</p>
      <h1 className="display-xl mt-6">
        Lost the <span className="text-accent-fg">scroll.</span>
      </h1>
      <p className="lead mt-6 max-w-lg">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/">Back to home</ButtonLink>
        <ButtonLink href="/work" variant="ghost" icon="play">
          Explore my work
        </ButtonLink>
      </div>
    </section>
  );
}
