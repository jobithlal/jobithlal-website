const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Qatar" });
export const formatPostDate = (iso: string) => fmt.format(new Date(iso));
export const readingLabel = (min: number) => `${min} min read`;
