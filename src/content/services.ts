import { serviceSchema, type Service } from "./schema";

const raw: Service[] = [
  {
    slug: "social-media-reels",
    enabled: true,
    order: 1,
    title: "Social Media Reel Creation",
    shortTitle: "Social Media Reels",
    subtitle: "Shoot. Edit. Graphics.",
    description:
      "From concept and filming to editing and graphics, I create attention-grabbing reels designed to engage your audience and inspire action.",
    icon: "clapperboard",
    media: { alt: "", focal: "50% 50%" },
    page: {
      eyebrow: "Social media reels",
      headline: "Reels that stop the scroll and",
      accent: "drive results.",
      subheading:
        "From the first creative idea to the final edit, I create engaging video content that helps your brand stand out.",
      intro:
        "Short-form video is where attention is won or lost in the first second. I handle the whole reel — idea, shoot, edit, graphics and sound — so every piece feels on-brand and is built for the platform it lives on.",
      features: [
        { title: "Creative planning", text: "Hooks, scripts and shot lists shaped around your goal." },
        { title: "Professional shooting", text: "On-location or studio filming with cinema-grade gear." },
        { title: "Short-form editing", text: "Pacing and structure designed for vertical feeds." },
        { title: "Captions & subtitles", text: "Readable, styled captions for sound-off viewing." },
        { title: "Animated text", text: "Kinetic titles that carry the message." },
        { title: "Motion graphics", text: "Branded graphic layers, lower thirds and callouts." },
        { title: "Colour grading", text: "A consistent, cinematic look across every post." },
        { title: "Sound design", text: "Music, effects and mixing that hold attention." },
        { title: "Platform-ready exports", text: "Correct formats for Instagram, TikTok, YouTube Shorts and more." },
      ],
      process: [
        { title: "Brief", text: "Goals, audience, platforms and references." },
        { title: "Plan", text: "Concepts, hooks and a shot list for approval." },
        { title: "Shoot & edit", text: "Filming, edit, graphics, grade and sound." },
        { title: "Deliver", text: "Review rounds, then platform-ready files." },
      ],
      faqs: [
        {
          q: "Do you handle filming, or only editing?",
          a: "Both. I can plan and shoot the footage in Doha, or edit and add graphics to footage you already have.",
        },
        {
          q: "How many reels can you produce at once?",
          a: "It depends on the shoot and the edit complexity. Single reels and monthly batches are both possible — we agree volume and timeline in the proposal.",
        },
        {
          q: "Which platforms do you deliver for?",
          a: "Instagram Reels, TikTok, YouTube Shorts, Snapchat and LinkedIn, each exported in the correct aspect ratio and specification.",
        },
        {
          q: "Do I get revisions?",
          a: "Yes. Review rounds are included and the exact number is set out in your proposal before work starts.",
        },
      ],
    },
    seo: {
      title: "Social Media Reel Creation in Doha, Qatar",
      description:
        "Scroll-stopping social media reels — concept, shooting, editing, captions, motion graphics and sound — from JOBITHLAL, a creative digital studio in Doha, Qatar.",
    },
    cta: { label: "Start a reel project", href: "/contact?service=reels" },
  },
  {
    slug: "motion-graphics",
    enabled: true,
    order: 2,
    title: "Motion Graphics",
    shortTitle: "Motion Graphics",
    subtitle: "Animation. Visual storytelling.",
    description:
      "Dynamic motion graphics that bring ideas to life, strengthen brand communication, and make every second more engaging.",
    icon: "sparkles",
    media: { alt: "", focal: "50% 50%" },
    page: {
      eyebrow: "Motion graphics",
      headline: "Bring your brand to life",
      accent: "through motion.",
      subheading:
        "Animation that explains, persuades and sticks — designed around your brand and built for every screen.",
      intro:
        "Motion turns a static idea into something people feel. I design and animate graphics that clarify complex messages, give your brand a recognisable rhythm, and make campaigns more memorable.",
      features: [
        { title: "Kinetic typography", text: "Words that move with intent and timing." },
        { title: "Logo animation", text: "Signature reveals for intros, outros and idents." },
        { title: "Promotional animations", text: "Launches, offers and events, animated." },
        { title: "Animated advertisements", text: "Ad creatives built for paid social and display." },
        { title: "Explainer graphics", text: "Clear visual explanations of products and processes." },
        { title: "Product animations", text: "Feature highlights and product storytelling." },
        { title: "Social media motion graphics", text: "Feed-ready loops, stories and templates." },
        { title: "Branded video elements", text: "Lower thirds, transitions and title systems." },
      ],
      process: [
        { title: "Brief", text: "Message, audience, length and placement." },
        { title: "Script & style", text: "Script, style frames and visual direction." },
        { title: "Animate", text: "Animation, sound and refinement." },
        { title: "Deliver", text: "Final renders in every format you need." },
      ],
      faqs: [
        {
          q: "Can you work with my existing brand guidelines?",
          a: "Yes. Animation is built on your colours, typography and logo so it feels native to your brand.",
        },
        {
          q: "Do you provide the script and voice-over?",
          a: "I can write or refine the script. Voice-over can be sourced as part of the project or supplied by you.",
        },
        {
          q: "What file formats do you deliver?",
          a: "MP4 for social and web by default, plus transparent or loopable formats where the placement needs them.",
        },
      ],
    },
    seo: {
      title: "Motion Graphics & Animation in Doha, Qatar",
      description:
        "Motion graphics, logo animation, kinetic typography, explainer and promotional animation by JOBITHLAL, a creative digital studio in Doha, Qatar.",
    },
    cta: { label: "Start a motion project", href: "/contact?service=motion" },
  },
  {
    slug: "website-development",
    enabled: true,
    order: 3,
    title: "Website Development",
    shortTitle: "Website Development",
    subtitle: "Design. Build. Launch.",
    description:
      "Modern, responsive websites designed to make a strong impression, deliver seamless experiences, and turn visitors into inquiries.",
    icon: "code",
    media: { alt: "", focal: "50% 50%" },
    page: {
      eyebrow: "Website development",
      headline: "Websites that look incredible and",
      accent: "work even better.",
      subheading:
        "Fast, responsive, beautifully designed websites built to turn visitors into inquiries.",
      intro:
        "Your website is often the first serious impression a client gets. I design and build sites that look premium, load fast, work on every device, and are easy for you to update — with technical SEO foundations built in from day one.",
      features: [
        { title: "UI/UX design", text: "Layouts and journeys designed around your goals." },
        { title: "Business websites", text: "Clear, credible sites for companies and services." },
        { title: "Portfolio websites", text: "Showcases built to present creative work." },
        { title: "Landing pages", text: "Focused pages for campaigns and launches." },
        { title: "Responsive development", text: "Crafted for phones, tablets and desktops." },
        { title: "Website animations", text: "Purposeful motion and interaction." },
        { title: "CMS integration", text: "Edit your content without touching code." },
        { title: "Contact forms", text: "Working inquiry forms with email notifications." },
        { title: "Technical SEO foundations", text: "Metadata, sitemaps, structured data and clean markup." },
        { title: "Performance optimisation", text: "Optimised images, code and Core Web Vitals." },
        { title: "Deployment & launch", text: "Domain, hosting and a careful go-live." },
      ],
      process: [
        { title: "Discover", text: "Goals, audience, content and structure." },
        { title: "Design", text: "Wireframes and visual design for review." },
        { title: "Build", text: "Development, CMS, forms and SEO setup." },
        { title: "Launch", text: "Testing, deployment and handover." },
      ],
      faqs: [
        {
          q: "Will I be able to update the website myself?",
          a: "Yes. Sites can include a content management system so you can edit text, images and projects without code.",
        },
        {
          q: "Is SEO included?",
          a: "Technical SEO foundations are included: semantic markup, metadata, sitemaps, structured data and performance. Ongoing SEO campaigns are not part of this service.",
        },
        {
          q: "Do you handle hosting and domains?",
          a: "I can set up deployment on your hosting or recommend a suitable platform, and handle the launch.",
        },
        {
          q: "How long does a website take?",
          a: "It depends on the number of pages and features. A timeline is agreed in the proposal after our first conversation.",
        },
      ],
    },
    seo: {
      title: "Website Design & Development in Doha, Qatar",
      description:
        "Modern, responsive, conversion-focused websites — UI/UX, development, CMS, technical SEO and launch — by JOBITHLAL in Doha, Qatar.",
    },
    cta: { label: "Start a website project", href: "/contact?service=website" },
  },
];

export const services = raw.map((s) => serviceSchema.parse(s));
