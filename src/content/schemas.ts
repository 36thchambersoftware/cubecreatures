import { z } from 'zod';

export const identifierSchema = z.string().regex(/^[a-z0-9][a-z0-9_-]*$/);
export const imageKeySchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9_-]*\.(png|jpe?g|webp|avif)$/);
export const sourceSchema = z.strictObject({
  url: z.url(),
  locator: z.string().min(1),
  retrievedAt: z.iso.datetime().optional(),
});

export const cardTypeSchema = z.enum([
  'creature',
  'upgrade',
  'action',
  'reaction',
]);
export const noopEffectSchema = z.strictObject({
  kind: z.literal('noop'),
  verified: z.literal(false),
});

export const cardDefinitionSchema = z
  .strictObject({
    definitionId: identifierSchema,
    name: z.string().min(1),
    type: cardTypeSchema.optional(),
    attack: z.number().int().nonnegative().optional(),
    health: z.number().int().positive().optional(),
    power: z
      .strictObject({
        text: z.string().min(1),
        effect: noopEffectSchema,
      })
      .optional(),
    text: z.string().min(1).optional(),
    effect: noopEffectSchema.optional(),
    upgradeKind: z.enum(['weapon', 'armor']).optional(),
    bonus: z
      .strictObject({
        text: z.string().min(1).optional(),
        attack: z.number().int().optional(),
        health: z.number().int().optional(),
      })
      .optional(),
    verified: z.boolean(),
    source: sourceSchema.optional(),
  })
  .superRefine((card, context) => {
    if (!card.verified) return;
    if (card.effect || card.power?.effect) {
      context.addIssue({
        code: 'custom',
        message:
          'No-op effects are unverified placeholders; gameplay must remain verified false until supported effects exist.',
      });
    }
    if (!card.source || !card.type) {
      context.addIssue({
        code: 'custom',
        message:
          'Verified definitions require source evidence and a card type.',
      });
    }
    if (
      card.type === 'creature' &&
      (card.attack === undefined || card.health === undefined)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Verified creatures require source-backed attack and health.',
      });
    }
    if (
      card.type === 'upgrade' &&
      (!card.upgradeKind || !card.bonus || Object.keys(card.bonus).length === 0)
    ) {
      context.addIssue({
        code: 'custom',
        message:
          'Verified upgrades require source-backed upgradeKind and bonus.',
      });
    }
    if (
      (card.type === 'action' || card.type === 'reaction') &&
      (!card.text || !card.effect)
    ) {
      context.addIssue({
        code: 'custom',
        message:
          'Verified actions and reactions require source-backed text and supported effects.',
      });
    }
  });

export const cardPrintingSchema = z
  .strictObject({
    printingId: identifierSchema,
    definitionId: identifierSchema,
    setId: identifierSchema,
    category: z.enum(['main', 'cube-rare', 'limited']),
    number: z.string().min(1),
    rarity: z
      .enum([
        'common',
        'uncommon',
        'rare',
        'ultra-rare',
        'limited',
        'cube-rare',
      ])
      .optional(),
    artist: z.string().min(1).optional(),
    provenance: z.string().min(1).optional(),
    art: z.strictObject({
      imageKey: imageKeySchema.optional(),
      imageUrl: z
        .url()
        .refine(
          (value) => new URL(value).protocol === 'https:',
          'Images require HTTPS.',
        )
        .optional(),
    }),
    starterQty: z.number().int().nonnegative().optional(),
    starterFoil: z.boolean().optional(),
    verified: z.boolean(),
    source: sourceSchema.optional(),
  })
  .superRefine((printing, context) => {
    if (printing.verified && !printing.source) {
      context.addIssue({
        code: 'custom',
        message: 'Verified printings require source evidence.',
      });
    }
  });

export const catalogSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    definitions: z.array(cardDefinitionSchema),
    printings: z.array(cardPrintingSchema),
  })
  .superRefine((catalog, context) => {
    for (const field of ['definitions', 'printings'] as const) {
      const ids = new Set<string>();
      catalog[field].forEach((item, index) => {
        const id =
          'definitionId' in item && !('printingId' in item)
            ? item.definitionId
            : (item as { printingId: string }).printingId;
        if (ids.has(id))
          context.addIssue({
            code: 'custom',
            path: [field, index],
            message: 'Duplicate ID.',
          });
        ids.add(id);
      });
    }
    const definitionIds = new Set(
      catalog.definitions.map((card) => card.definitionId),
    );
    catalog.printings.forEach((printing, index) => {
      if (!definitionIds.has(printing.definitionId)) {
        context.addIssue({
          code: 'custom',
          path: ['printings', index, 'definitionId'],
          message: 'Unknown definition reference.',
        });
      }
    });
  });

export type CardDefinition = z.infer<typeof cardDefinitionSchema>;
export type CardPrinting = z.infer<typeof cardPrintingSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
