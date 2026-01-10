import type { GroceryItem, Planogram } from "./types";

// Internal Algolia types (not exported)
interface WegmansPrice {
    unitPrice: string;
    amount: number;
    channelKey: string;
}

interface WegmansPlanogram {
    aisle: string;
    shelf: string;
    aisleSide: string;
    section: string;
}

interface WegmansCategory {
    name: string;
    key: string;
    seo: string;
}

interface WegmansCategoryNodes {
    lvl0: string;
    lvl1: string;
    lvl2: string;
    lvl3: string;
}

interface WegmansNutritionServing {
    servingSize: string;
    servingSizeUom: string;
    servingsPerContainer: string;
}

interface WegmansNutritionItem {
    name: string;
    quantity: number;
    unitOfMeasure?: string;
    percentOfDaily?: number;
}

interface WegmansNutritionData {
    general: WegmansNutritionItem[];
    vitamins: WegmansNutritionItem[];
    contains?: string;
}

interface WegmansNutrition {
    serving: WegmansNutritionServing;
    nutritions: WegmansNutritionData[];
}

interface WegmansRankingInfo {
    proximityDistance: number;
    geoDistance: number;
    geoPrecision: number;
    filters: number;
    words: number;
    userScore: number;
    nbExactWords: number;
    nbTypos: number;
    firstMatchedWord: number;
}

interface WegmansProduct {
    // Basic product info
    productID: string;
    productId: string;
    skuId: string;
    productName: string;
    productDescription: string;
    webProductDescription?: string;
    slug: string;
    objectID: string;

    // Pricing
    price_inStore?: WegmansPrice;
    price_delivery?: WegmansPrice;
    price_inStoreLoyalty?: WegmansPrice;
    price_deliveryLoyalty?: WegmansPrice;
    bottleDeposit: number;

    // Location & Availability
    planogram?: WegmansPlanogram;
    storeNumber: string;
    isSoldAtStore: boolean;
    isAvailable: boolean;
    excludeFromWeb: boolean;
    fulfilmentType: string[];
    maxQuantity: number;

    // Categories
    category: WegmansCategory[];
    categoryNodes: WegmansCategoryNodes;
    categories: {
        lvl0: string;
        lvl1: string;
        lvl2: string;
        lvl3: string;
    };
    categoryPageId: string[];
    categoryFacets: Record<string, unknown>;

    // Product details
    packSize: string;
    images: string[];
    upc: string[];
    ingredients?: string;
    instructions?: string;
    allergensAndWarnings?: string;

    // Branding
    consumerBrandName: string;
    popularTags: string[];
    filterTags: string[];
    wellnessKeys: string[];
    keywords: string[];
    productKeywords: string[];

    // Flags
    isNewItem: boolean;
    isLoyalty: boolean;
    isAlcoholItem: boolean;
    isSoldByWeight: boolean;
    isIWSProduct: boolean;
    ebtEligible: boolean;
    restrictedOTC: boolean;
    hasOffers: boolean;

    // Reviews & Ratings
    averageStarRating?: number;
    reviewCount: number;

    // Digital coupons
    digitalCouponsOfferIds: string[];
    loyaltyInstoreDiscount: unknown[];
    loyaltyDeliveryDiscount: unknown[];
    discountType: string;

    // Other
    taxCode: string;
    onlineApproxUnitWeight: number;
    onlineSellByUnit: string;
    requiredMinimumAgeToBuy: number;
    lastUpdated: string;

    // Ranking & Search
    _rankingInfo?: WegmansRankingInfo;

    // Nutrition
    nutrition?: WegmansNutrition;
}

interface WegmansSearchResponse {
    results: Array<{
        hits: WegmansProduct[];
        nbHits: number;
        page: number;
        nbPages: number;
        hitsPerPage: number;
        exhaustiveNbHits: boolean;
        exhaustiveTypo: boolean;
        exhaustiveFacetsCount: boolean;
        query: string;
        params: string;
        processingTimeMS: number;
        index?: string;
    }>;
}

const ALGOLIA_BASE_URL =
    "https://qgppr19v8v-dsn.algolia.net/1/indexes/*/queries";
const ALGOLIA_API_KEY = "9a10b1401634e9a6e55161c3a60c200d";
const ALGOLIA_APP_ID = "QGPPR19V8V";
const ALGOLIA_AGENT =
    "Algolia%20for%20JavaScript%20(5.37.0)%3B%20Search%20(5.37.0)%3B%20Browser%3B%20instantsearch.js%20(4.80.0)%3B%20react%20(19.2.0-canary-97cdd5d3-20250710)%3B%20react-instantsearch%20(7.16.3)%3B%20react-instantsearch-core%20(7.16.3)%3B%20next.js%20(15.4.10)%3B%20JS%20Helper%20(3.26.0)";

const DEFAULT_USER_TOKEN = "anonymous-49b3eb1a-89cb-4cca-80ac-1d2ccee8c1dc";
const DEFAULT_STORE_NUMBER = "156";

interface SearchOptions {
    query: string;
    storeNumber?: string;
    userToken?: string;
}

/**
 * Convert WegmansProduct from Algolia to GroceryItem
 */
function convertToGroceryItem(product: WegmansProduct): GroceryItem {
    // Default planogram if missing
    const defaultPlanogram: Planogram = {
        aisle: "Unknown",
        shelf: "Unknown",
        aisleSide: "Unknown",
        section: "Unknown",
    };

    const planogram: Planogram = product.planogram
        ? {
            aisle: product.planogram.aisle,
            shelf: product.planogram.shelf,
            aisleSide: product.planogram.aisleSide,
            section: product.planogram.section,
        }
        : defaultPlanogram;

    // Generate href from productId (similar to backend format)
    const href = `https://www.wegmans.com/shop/product/${product.slug}`;

    // Get price from inStore price, fallback to delivery price
    const price =
        product.price_inStore?.amount ??
        product.price_delivery?.amount ??
        0;

    return {
        planogram,
        href,
        store: "wegmans",
        images: product.images,
        // TODO: Add proper nutrition type later
        nutrition: product.nutrition ?? null,
        name: product.productName,
        price,
        size: product.packSize,
        objectID: product.objectID, // Store objectID for reliable lookups
    };
}

/**
 * Search Wegmans products using Algolia and return as GroceryItem[]
 */
export async function searchWegmans(
    options: SearchOptions
): Promise<GroceryItem[]> {
    const {
        query,
        storeNumber = DEFAULT_STORE_NUMBER,
        userToken = DEFAULT_USER_TOKEN,
    } = options;

    if (!query.trim()) {
        throw new Error("Search query cannot be empty");
    }

    const requestBody = {
        requests: [
            {
                indexName: "products",
                analytics: true,
                analyticsTags: [
                    "product-search",
                    "organic",
                    `store-${storeNumber}`,
                    "fulfillment-instore",
                    "anonymous",
                ],
                attributesToHighlight: [],
                clickAnalytics: true,
                enableABTest: true,
                enableRules: true,
                extensions: {
                    queryCategorization: {},
                },
                facets: ["*"],
                filters: `storeNumber:${storeNumber} AND fulfilmentType:instore AND excludeFromWeb:false AND isSoldAtStore:true`,
                getRankingInfo: true,
                highlightPostTag: "__/ais-highlight__",
                highlightPreTag: "__ais-highlight__",
                maxValuesPerFacet: 1001,
                page: 0,
                query: query,
                responseFields: [
                    "exhaustive",
                    "exhaustiveFacetsCount",
                    "exhaustiveNbHits",
                    "exhaustiveTypo",
                    "hits",
                    "facets",
                    "facets_stats",
                    "hitsPerPage",
                    "index",
                    "nbHits",
                    "nbPages",
                    "page",
                    "processingTimeMS",
                    "query",
                ],
                ruleContexts: [
                    "product-search",
                    "organic",
                    `store-${storeNumber}`,
                    "fulfillment-instore",
                    "anonymous",
                ],
                userToken: userToken,
            },
            {
                indexName: "products",
                analytics: true,
                analyticsTags: ["product-search", "boosted"],
                attributesToHighlight: [],
                clickAnalytics: true,
                disableNeuralSearch: true,
                enableABTest: false,
                enableRules: true,
                extensions: {
                    queryCategorization: {
                        enableAutoFiltering: false,
                    },
                },
                facets: ["*"],
                filters: `storeNumber:${storeNumber} AND fulfilmentType:instore AND excludeFromWeb:false AND isSoldAtStore:true`,
                getRankingInfo: true,
                highlightPostTag: "__/ais-highlight__",
                highlightPreTag: "__ais-highlight__",
                hitsPerPage: 30,
                maxValuesPerFacet: 1001,
                page: 0,
                query: query,
                responseFields: [
                    "exhaustive",
                    "exhaustiveFacetsCount",
                    "exhaustiveNbHits",
                    "exhaustiveTypo",
                    "hits",
                    "facets",
                    "facets_stats",
                    "hitsPerPage",
                    "index",
                    "nbHits",
                    "nbPages",
                    "page",
                    "processingTimeMS",
                    "query",
                ],
                ruleContexts: ["boosted"],
                userToken: userToken,
            },
            {
                indexName: "products",
                analytics: true,
                analyticsTags: [
                    "product-search",
                    "boosted-new-items",
                ],
                attributesToHighlight: [],
                clickAnalytics: true,
                disableNeuralSearch: true,
                enableABTest: true,
                enableRules: true,
                extensions: {
                    queryCategorization: {},
                },
                facets: ["*"],
                filters: `storeNumber:${storeNumber} AND fulfilmentType:instore AND excludeFromWeb:false AND isSoldAtStore:true AND isNewItem:true`,
                getRankingInfo: true,
                highlightPostTag: "__/ais-highlight__",
                highlightPreTag: "__ais-highlight__",
                hitsPerPage: 30,
                maxValuesPerFacet: 1001,
                page: 0,
                query: query,
                responseFields: [
                    "exhaustive",
                    "exhaustiveFacetsCount",
                    "exhaustiveNbHits",
                    "exhaustiveTypo",
                    "hits",
                    "facets",
                    "facets_stats",
                    "hitsPerPage",
                    "index",
                    "nbHits",
                    "nbPages",
                    "page",
                    "processingTimeMS",
                    "query",
                ],
                ruleContexts: ["boosted-new-items"],
                userToken: userToken,
            },
            {
                indexName: "products",
                analytics: true,
                analyticsTags: [
                    "product-search",
                    "boosted-wegmans-items",
                ],
                attributesToHighlight: [],
                clickAnalytics: true,
                disableNeuralSearch: true,
                enableABTest: false,
                enableRules: true,
                extensions: {
                    queryCategorization: {
                        enableAutoFiltering: false,
                    },
                },
                facets: ["*"],
                filters: `storeNumber:${storeNumber} AND fulfilmentType:instore AND excludeFromWeb:false AND isSoldAtStore:true AND (consumerBrandName:Wegmans OR popularTags:"Wegmans Brand")`,
                getRankingInfo: true,
                highlightPostTag: "__/ais-highlight__",
                highlightPreTag: "__ais-highlight__",
                hitsPerPage: 30,
                maxValuesPerFacet: 1001,
                page: 0,
                query: query,
                responseFields: [
                    "exhaustive",
                    "exhaustiveFacetsCount",
                    "exhaustiveNbHits",
                    "exhaustiveTypo",
                    "hits",
                    "facets",
                    "facets_stats",
                    "hitsPerPage",
                    "index",
                    "nbHits",
                    "nbPages",
                    "page",
                    "processingTimeMS",
                    "query",
                ],
                ruleContexts: ["boosted-wegmans-items"],
                userToken: userToken,
            },
        ],
    };

    const url = `${ALGOLIA_BASE_URL}?x-algolia-agent=${ALGOLIA_AGENT}&x-algolia-api-key=${ALGOLIA_API_KEY}&x-algolia-application-id=${ALGOLIA_APP_ID}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            accept: "application/json",
            "content-type": "application/json",
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: WegmansSearchResponse = await response.json();

    // Get hits from the first result (organic search)
    // Combine with other results if needed, but for now just use the first one
    const allHits = data.results[0]?.hits ?? [];

    // Convert to GroceryItem[]
    return allHits.map(convertToGroceryItem);
}

interface FetchBySlugsOptions {
    slugs: string[];
    objectIDs?: string[]; // Optional objectIDs for more reliable lookups
    storeNumber?: string;
    userToken?: string;
}

/**
 * Fetch Wegmans products by their slugs using Algolia search
 * 
 * Since Algolia may not support filtering by slug directly, we search for each slug
 * individually and match by exact slug to ensure we get the right products.
 */
export async function fetchProductsBySlugs(
    options: FetchBySlugsOptions
): Promise<GroceryItem[]> {
    const {
        slugs,
        objectIDs,
        storeNumber = DEFAULT_STORE_NUMBER,
        userToken = DEFAULT_USER_TOKEN,
    } = options;

    if (slugs.length === 0) {
        return [];
    }

    // If we have objectIDs, use them for direct filtering (much more reliable)
    if (objectIDs && objectIDs.length > 0 && objectIDs.length === slugs.length) {
        const objectIDFilter = objectIDs.filter(Boolean).map((id) => `objectID:"${id}"`).join(" OR ");

        const requestBody = {
            requests: [
                {
                    indexName: "products",
                    analytics: false,
                    attributesToHighlight: [],
                    facets: ["*"],
                    filters: `storeNumber:${storeNumber} AND fulfilmentType:instore AND excludeFromWeb:false AND isSoldAtStore:true AND (${objectIDFilter})`,
                    hitsPerPage: 1000,
                    page: 0,
                    query: "",
                    responseFields: [
                        "hits",
                        "hitsPerPage",
                        "nbHits",
                        "page",
                    ],
                    userToken: userToken,
                },
            ],
        };

        const url = `${ALGOLIA_BASE_URL}?x-algolia-agent=${ALGOLIA_AGENT}&x-algolia-api-key=${ALGOLIA_API_KEY}&x-algolia-application-id=${ALGOLIA_APP_ID}`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    accept: "application/json",
                    "content-type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: WegmansSearchResponse = await response.json();
            const allHits = data.results[0]?.hits ?? [];

            // Create a map of objectID -> product for efficient lookup
            const objectIDToProduct = new Map<string, WegmansProduct>();
            allHits.forEach((product) => {
                objectIDToProduct.set(product.objectID, product);
            });

            // Return products in the same order as requested, matching by objectID
            return objectIDs
                .map((objectID) => {
                    const product = objectID ? objectIDToProduct.get(objectID) : null;
                    return product ? convertToGroceryItem(product) : null;
                })
                .filter((item): item is GroceryItem => item !== null);
        } catch (error) {
            console.error("Error fetching by objectID, falling back to slug search:", error);
            // Fall through to slug-based search
        }
    }

    // Search for each slug individually and combine results
    // Use exact phrase matching by wrapping slug in quotes for better precision
    const searchPromises = slugs.map(async (slug) => {
        // Try exact phrase match first (slug in quotes)
        const exactQuery = `"${slug}"`;

        const requestBody = {
            requests: [
                {
                    indexName: "products",
                    analytics: false,
                    attributesToHighlight: [],
                    facets: ["*"],
                    filters: `storeNumber:${storeNumber} AND fulfilmentType:instore AND excludeFromWeb:false AND isSoldAtStore:true`,
                    hitsPerPage: 50, // Increase to get more results to search through
                    page: 0,
                    query: exactQuery, // Search with exact phrase
                    responseFields: [
                        "hits",
                        "hitsPerPage",
                        "nbHits",
                        "page",
                    ],
                    userToken: userToken,
                },
            ],
        };

        const url = `${ALGOLIA_BASE_URL}?x-algolia-agent=${ALGOLIA_AGENT}&x-algolia-api-key=${ALGOLIA_API_KEY}&x-algolia-application-id=${ALGOLIA_APP_ID}`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    accept: "application/json",
                    "content-type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                console.warn(`Failed to search for slug ${slug}: ${response.status}`);
                return null;
            }

            const data: WegmansSearchResponse = await response.json();
            const hits = data.results[0]?.hits ?? [];

            // Find exact match by slug (search might return similar results)
            // Also try URL-decoding the slug in case it's encoded
            const decodedSlug = decodeURIComponent(slug);
            let exactMatch = hits.find((product) => product.slug === slug || product.slug === decodedSlug);

            // If still not found, try case-insensitive match
            if (!exactMatch) {
                exactMatch = hits.find((product) =>
                    product.slug.toLowerCase() === slug.toLowerCase() ||
                    product.slug.toLowerCase() === decodedSlug.toLowerCase()
                );
            }

            if (!exactMatch && hits.length > 0) {
                // Log for debugging - see what we got vs what we wanted
                console.warn(`Slug "${slug}" not found in ${hits.length} results. First result slug: "${hits[0]?.slug}"`);
            }

            return exactMatch ? convertToGroceryItem(exactMatch) : null;
        } catch (error) {
            console.error(`Error searching for slug ${slug}:`, error);
            return null;
        }
    });

    // Wait for all searches to complete
    const results = await Promise.all(searchPromises);

    // Return products in the same order as requested slugs, filtering out nulls
    return results.filter((item): item is GroceryItem => item !== null);
}
