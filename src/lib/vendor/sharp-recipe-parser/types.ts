/**
 * TypeScript type definitions for sharp-recipe-parser
 */

export interface AlternativeQuantity {
    quantity: number;
    unit: string;
    unitText: string;
    minQuantity: number;
    maxQuantity: number;
}

export interface IngredientParseResult {
    quantity: number;
    quantityText: string;
    minQuantity: number;
    maxQuantity: number;
    unit: string;
    unitText: string;
    ingredient: string;
    extra: string;
    alternativeQuantities: AlternativeQuantity[];
}

