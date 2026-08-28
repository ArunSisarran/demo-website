import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const CATEGORIES = ['Cocktails', 'Wine', 'Non-alcoholic', 'Seasonal'] as const;

/** The set we declare against. Anything not listed is not claimed either way. */
export const ALLERGENS = ['Nuts', 'Dairy', 'Egg', 'Gluten', 'Sulphites', 'Soy'] as const;

const drinks = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/drinks' }),
  schema: ({ image }) => z.object({
    name: z.string(),
    image: image(),
    /** Describes the drink, not the file. */
    alt: z.string(),
    category: z.enum(CATEGORIES),
    price: z.number(),
    abv: z.string().optional(),
    /** One line, sommelier voice — shown on cards and in the menu list. */
    note: z.string(),
    badges: z.array(z.string()).default([]),
    /** Serve size and method, e.g. "70ml · stirred". */
    serve: z.string(),
    /** Allergens actually present. Empty array means none of the listed set. */
    allergens: z.array(z.enum(ALLERGENS)).default([]),
    /** What's in it, in plain words. */
    ingredients: z.string(),
    /** Off the list for now — still browsable, not orderable. */
    available: z.boolean().default(true),
    /** Shown when unavailable, e.g. "Back in June". */
    availableNote: z.string().optional(),
    pairing: z.string().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(50),
  }),
});

export const collections = { drinks };
