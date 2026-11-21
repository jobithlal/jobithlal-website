import { siteSettingsSchema, heroSchema, tickerSchema, homeSchema } from "./schema";

/**
 * Seed content — copy taken verbatim from the JOBITHLAL brief.
 * Phase 5 moves these values into the database; the schemas stay the same.
 */

export const siteSettings = siteSettingsSchema.parse({
  name: "JOBITHLAL",
  logoText: "JOBITHLAL",
  logoSubtitle: "Creative Digital Studio",
  tagline: "Creative content. Motion design. Digital experiences.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.jobithlal.com",
  email: "jobithlal@gmail.com",
  whatsapp: "+97477350438",
  location: "Doha, Qatar",
  experienceYears: 16,
  // Profile URLs are intentionally empty: they are entered in the admin, never invented.
  socials: [
    { platform: "Instagram" },
    { platform: "LinkedIn" },
    { platform: "YouTube" },
    { platform: "Vimeo" },
    { platform: "Behance" },
  ],
  showDemoProjects: true,
});

export const hero = heroSchema.parse({
  eyebrow: "Your creative partner for digital growth",
  lines: ["Stop the scroll.", "Make an impact.", "Drive results."],
  accentLine: 2,
  description:
    "I create high-impact social media reels, engaging motion graphics, and modern, conversion-focused websites that help brands stand out, connect with their audience, and inspire action.",
  primaryCta: { label: "What are you waiting for?", href: "/contact" },
  secondaryCta: { label: "Explore my work", href: "/#work" },
  media: { alt: "", focal: "60% 50%" },
  autoplay: true,
  loop: true,
  muted: true,
  mediaOpacity: 0.85,
  overlayStrength: 0.85,
});

export const ticker = tickerSchema.parse({
  enabled: true,
  items: ["Social Media Reels", "Motion Graphics", "Website Development"],
  durationSeconds: 28,
  direction: "left",
});

export const home = homeSchema.parse({
  services: {
    eyebrow: "What I do",
    heading: "Everything your brand needs to stand out online.",
    description:
      "Whether you need content that stops the scroll, visuals that tell your story, or a website that converts visitors into customers, I've got you covered.",
  },
  difference: {
    eyebrow: "The difference",
    headingLines: ["Good design gets noticed.", "Strategic creativity"],
    accent: "gets results.",
    body: "With over 16 years of experience in creative media and digital production, I combine visual storytelling, design, and technology to create content and digital experiences built around your business goals.",
    portrait: { alt: "Portrait of Jobith Lal", focal: "50% 30%" },
    values: [
      {
        title: "Built with purpose",
        text: "Every project starts with your brand, audience, and business goals.",
        icon: "target",
      },
      {
        title: "End-to-end execution",
        text: "From concept to final delivery, the creative process works together.",
        icon: "layers",
      },
      {
        title: "Creative meets technology",
        text: "Modern production techniques, intelligent workflows, and digital innovation.",
        icon: "cpu",
      },
      {
        title: "Focused on impact",
        text: "Content that engages, visuals that communicate, and websites designed to convert.",
        icon: "zap",
      },
    ],
    // Only the experience figure is verified (it comes from the brief). Add more in the admin.
    stats: [{ value: "16+", label: "Years in creative media & digital production", verified: true }],
  },
  work: {
    eyebrow: "Selected work",
    heading: "See what's possible.",
    description:
      "Explore selected projects across social media reels, motion graphics, and website development, and see how creative ideas come to life.",
  },
  process: {
    eyebrow: "The process",
    heading: "From idea to impact.",
    steps: [
      {
        title: "Let's talk",
        text: "We discuss your vision, goals, audience, and project requirements.",
        icon: "message",
      },
      {
        title: "Create the plan",
        text: "I develop a creative direction and a clear approach tailored to your project.",
        icon: "target",
      },
      {
        title: "Make it happen",
        text: "From filming and animation to design and development, your ideas come to life.",
        icon: "zap",
      },
      {
        title: "Launch confidently",
        text: "Receive polished, ready-to-use content or a fully functional website.",
        icon: "send",
      },
    ],
  },
  finalCta: {
    heading: "What are you waiting for?",
    lead: "You've seen what's possible. Now it's time to make it happen.",
    body: "Whether it's a reel that stops the scroll, motion graphics that bring your brand to life, or a website that turns visitors into customers, your next big idea deserves to become something real.",
    cta: { label: "Start a project", href: "/contact" },
  },
  contact: {
    heading: "Have a project in mind?",
    accent: "Let's talk.",
    description:
      "Tell me what you're looking for, and let's explore how to turn your idea into something that delivers.",
  },
});
