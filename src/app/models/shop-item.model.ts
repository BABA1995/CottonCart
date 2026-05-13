export interface ShopItem {
  id?: string;
  shopId: string;

  // ── Basic ──────────────────────────────────────────────────────────────────
  name:        string;
  category:    string;      // see ITEM_CATEGORIES keys
  description: string;
  images:      string[];    // Firebase Storage download URLs (up to 3)

  // ── Pricing ────────────────────────────────────────────────────────────────
  price: number;            // selling price ₹
  mrp?:  number;            // MRP – shown as strikethrough

  // ── Size ───────────────────────────────────────────────────────────────────
  sizeLabel: string;        // e.g. "72×108 inches", "King", "Standard"

  // ── Fabric ─────────────────────────────────────────────────────────────────
  fabricType:       string;   // Cotton, Polyester, Blended, Silk Cotton…
  fabricGsm?:       number;   // grams per sq-metre (sheets / covers)
  threadCount?:     number;   // for premium bed sheets
  fabricMetersUsed?: number;  // metres of fabric consumed in making

  // ── Filling (pillows, mattresses, quilts, bed covers) ─────────────────────
  hasFilling:    boolean;
  cottonType?:   string;   // 'pure' | 'mixed' | 'fiber'
  fillWeightKg?: number;

  // ── Extras ─────────────────────────────────────────────────────────────────
  color?:            string;  // "White", "Off-white", "Blue Floral"
  careInstructions?: string;  // "Machine wash cold, do not bleach"
  tags:              string[];

  // ── Inventory ──────────────────────────────────────────────────────────────
  stockCount: number;   // units available
  isActive:   boolean;  // visible to customers

  createdAt:  any;
  updatedAt?: any;
}

// ── Categories ───────────────────────────────────────────────────────────────

export interface ItemCategory {
  key:        string;
  label:      string;
  icon:       string;
  hasFilling: boolean;   // show filling section in form?
}

export const ITEM_CATEGORIES: ItemCategory[] = [
  { key: 'mattress',          label: 'Mattress',          icon: 'bed-outline',           hasFilling: true  },
  { key: 'pillow',            label: 'Pillow',            icon: 'ellipse-outline',       hasFilling: true  },
  { key: 'pillow_cover',      label: 'Pillow Cover',      icon: 'tablet-portrait-outline', hasFilling: false },
  { key: 'bed_sheet',         label: 'Bed Sheet',         icon: 'documents-outline',     hasFilling: false },
  { key: 'bed_cover',         label: 'Bed Cover',         icon: 'color-palette-outline', hasFilling: true  },
  { key: 'quilt',             label: 'Quilt / Razai',     icon: 'snow-outline',          hasFilling: true  },
  { key: 'mattress_protector',label: 'Mattress Protector',icon: 'shield-outline',        hasFilling: false },
  { key: 'ready_bed',         label: 'Ready-made Bed',    icon: 'home-outline',          hasFilling: false },
  { key: 'other',             label: 'Other',             icon: 'grid-outline',          hasFilling: false },
];

export const CATEGORY_MAP: Record<string, ItemCategory> =
  ITEM_CATEGORIES.reduce((acc, c) => { acc[c.key] = c; return acc; }, {} as Record<string, ItemCategory>);

export const COTTON_OPTIONS = [
  { key: 'pure',  label: 'Pure White Cotton',  badge: 'Premium'  },
  { key: 'mixed', label: 'Mixed White Cotton', badge: 'Standard' },
  { key: 'fiber', label: 'Fiber Fill',         badge: 'Lite'     },
];

export const FABRIC_TYPES = [
  'Cotton', 'Pure Cotton', 'Polyester', 'Poly-Cotton Blend',
  'Silk Cotton', 'Microfiber', 'Bamboo', 'Linen', 'Flannel', 'Other'
];
