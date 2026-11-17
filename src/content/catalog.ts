import rawCatalog from '../../data/catalog.json';
import { catalogSchema } from './schemas';

export const catalog = catalogSchema.parse(rawCatalog);
export const definitionsById = new Map(
  catalog.definitions.map((definition) => [
    definition.definitionId,
    definition,
  ]),
);
export const printingsById = new Map(
  catalog.printings.map((printing) => [printing.printingId, printing]),
);
