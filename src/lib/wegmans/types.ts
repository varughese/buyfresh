// Public types for GroceryItem

export interface Planogram {
    aisle: string;
    shelf: string;
    aisleSide: string;
    section: string;
}

export interface GroceryItem {
    planogram: Planogram;
    href: string;
    store: "wegmans";
    images: string[];
    // TODO: Add proper nutrition type later
    nutrition: unknown;
    name: string;
    price: number;
    size: string;
}
