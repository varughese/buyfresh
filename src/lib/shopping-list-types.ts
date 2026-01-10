/**
 * Types for shopping list items stored in the database
 */

export interface ShoppingListItem {
  slug: string; // Keep for backward compatibility
  objectID?: string; // Algolia objectID for reliable lookups
  ingredient: string;
  amount?: string;
}
