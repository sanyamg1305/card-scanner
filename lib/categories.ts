export interface CeramicCategoryGroup {
  groupName: string;
  categories: string[];
}

export const CERAMIC_TILE_CATEGORIES: CeramicCategoryGroup[] = [
  {
    groupName: 'Tile Types & Finishes',
    categories: [
      'GVT / PGVT (Glazed Vitrified)',
      'Porcelain Tiles',
      'Ceramic Wall Tiles',
      'Ceramic Floor Tiles',
      'Large Format Slabs / Countertops',
      'Full Body Vitrified',
      'Double Charge Vitrified',
      'Outdoor & Parking Pavers',
      'Subway & Mosaic Tiles',
      'High Gloss / Carving / Matte Finishes',
    ],
  },
  {
    groupName: 'Allied Products & Sanitary',
    categories: [
      'Sanitaryware (Toilets & Basins)',
      'Bath Fittings & Faucets',
      'Kitchen Sinks & Quartz Slabs',
      'Tile Adhesives & Grouts',
      'Epoxy & Waterproofing Chemicals',
    ],
  },
  {
    groupName: 'Industry & Supply Chain',
    categories: [
      'Raw Materials (Clays, Frits & Glazes)',
      'Digital Inks & Ceramic Colors',
      'Tile Machinery & Pressing Equipment',
      'Digital Printing & Roller Spares',
      'Display Stands & Packaging',
    ],
  },
  {
    groupName: 'Business / Trade Role',
    categories: [
      'Tile Manufacturer / Factory',
      'Wholesaler / Stockist',
      'Distributor / Dealer',
      'Retail Showroom Owner',
      'Tile Exporter / Importer',
      'Architect & Interior Designer',
      'Builder / Contractor / Developer',
      'OEM / Private Brand Buyer',
    ],
  },
];

export const ALL_CERAMIC_CATEGORIES: string[] = CERAMIC_TILE_CATEGORIES.flatMap(
  (g) => g.categories
);

// Quick preset chips for rapid selection in exhibition booths
export const QUICK_TILE_CATEGORIES: string[] = [
  'GVT / PGVT',
  'Porcelain Tiles',
  'Ceramic Wall Tiles',
  'Large Slabs',
  'Sanitaryware',
  'Tile Adhesives',
  'Manufacturer',
  'Distributor',
  'Exporter / Importer',
  'Architect / Builder',
];
