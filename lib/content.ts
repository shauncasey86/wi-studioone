import { z } from "zod";

/**
 * Zod schemas for the SiteSettings JSON columns (CLAUDE.md §6). `content` holds
 * all scalar copy; `bacs`, `contact` and `map` are the other JSON columns. These
 * validate on read and write — unknown fields are rejected (.strict()).
 *
 * Rich string fields use the *italic* / **bold** convention (see lib/richtext).
 */

const ctaSchema = z
  .object({
    label: z.string(),
    target: z.string(),
    cur: z.string().optional(),
  })
  .strict();

export const contentSchema = z
  .object({
    meta: z
      .object({
        title: z.string(),
        description: z.string(),
        canonical: z.string(),
        ogTitle: z.string(),
        ogDescription: z.string(),
        ogImage: z.string(),
        ogImageAlt: z.string(),
        twitterTitle: z.string(),
        twitterDescription: z.string(),
        themeColor: z.string(),
      })
      .strict(),
    brand: z.object({ lead: z.string(), mark: z.string() }).strict(),
    hero: z
      .object({
        titleLines: z.array(z.string()), // rich
        sub: z.string(),
        price: z
          .object({ amount: z.string(), unit: z.string(), fine: z.string() })
          .strict(),
        cta: ctaSchema,
      })
      .strict(),
    manifesto: z
      .object({
        cnum: z.string(),
        clede: z.string(),
        pullWords: z.array(z.string()), // each token rich; drives the reveal
      })
      .strict(),
    days: z
      .object({ cnum: z.string(), title: z.string(), lede: z.string() })
      .strict(),
    roomStatement: z.object({ line: z.string() }).strict(), // rich
    how: z
      .object({ cnum: z.string(), title: z.string(), lede: z.string() })
      .strict(),
    diary: z
      .object({ cnum: z.string(), title: z.string(), lede: z.string() })
      .strict(),
    practical: z
      .object({
        cnum: z.string(),
        title: z.string(),
        lede: z.string(),
        roomFactsLabel: z.string(),
        docket: z
          .object({ header: z.string(), status: z.string(), sign: z.string() })
          .strict(),
        rates: z.object({ header: z.string(), note: z.string() }).strict(), // note rich
      })
      .strict(),
    cta: z.object({ headline: z.string(), button: ctaSchema }).strict(), // headline rich
    footer: z
      .object({ lede: z.string(), bottom: z.array(z.string()) })
      .strict(),
  })
  .strict();

export const bacsSchema = z
  .object({
    accountName: z.string(),
    sortCode: z.string(),
    accountNo: z.string(),
    referencePrefix: z.string(),
    demo: z.boolean(),
  })
  .strict();

export const contactSchema = z
  .object({
    email: z.string(),
    phone: z.string(),
    replies: z.string(),
  })
  .strict();

export const mapSchema = z
  .object({
    lat: z.number(),
    lng: z.number(),
    zoom: z.number(),
    tagLabel: z.string(),
    coordsText: z.string(),
    openMapsUrl: z.string(),
    embedSrc: z.string(),
  })
  .strict();

export type SiteContent = z.infer<typeof contentSchema>;
export type Bacs = z.infer<typeof bacsSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type SiteMap = z.infer<typeof mapSchema>;
