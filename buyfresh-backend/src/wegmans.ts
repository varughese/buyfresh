import { GroceryItem, GroceryStore } from './grocery';

export interface Welcome {
	adProviderMetadata: AdProviderMetadata;
	available_context_types: unknown[];
	href: string;
	initial_search_term: string;
	item_count: number;
	items: Item[];
	onLoadBeacon: null;
	placements: unknown[];
	primary_search_term: string;
	recall_strategies_applied: string[];
	search_provider: string;
	snrid: string;
	session_token: string;
}

export type AdProviderMetadata = object;

export interface Item {
	_links: null;
	additional_images: unknown[];
	aisle: string;
	alcohol_retailer_id: null;
	availability: Availability;
	availability_message: null;
	availability_status: boolean;
	average_weight: null;
	base_price: number;
	base_quantity: number;
	brand_name: string;
	categories: Category[];
	display_uom: DisplayUom;
	ext_data: EXTData;
	ext_id: string;
	fulfillment_inventory_area_id: string;
	fulfillment_retailer_id: string;
	fulfillment_retailer_store_id: string;
	fulfillment_store_number: string;
	fulfillment_types: FulfillmentType[];
	href: string;
	ic_item_id: string;
	ic_product_id: string;
	id: string;
	images: Images;
	is_alcoholic: boolean;
	loyalty_end_date: Date | null;
	loyalty_price: number | null;
	loyalty_quantity: number | null;
	message_code: null;
	modified: string;
	name: string;
	offers: null;
	order_by_weight: boolean;
	ordering_parameters: OrderingParameters;
	price_alert: null;
	product_config: null;
	product_rating: ProductRating;
	product_type: ProductType;
	promo_tag: null | string;
	promo_tag_percentage: PromoTagPercentage | null;
	reco_rating: number;
	sale_end_date: null;
	sale_price: null;
	sale_quantity: null;
	search_result: SearchResult;
	size_string: string;
	snrid: string;
	source: null;
	source_id: null;
	sponsored: boolean;
	status: boolean;
	tags: Tag[];
	uom_price: UomPrice;
	usa_snap_eligible: boolean;
	user_rating: null;
}

export interface Availability {
	source: Source;
	stock_level: number;
}

export type Source = 'DEF/ETL';

export interface Category {
	id: string;
	name: string;
}

export type DisplayUom = 'ea';

export interface EXTData {
	retailer_reference_code: string;
}

export type FulfillmentType = 'instore' | 'pickup' | 'delivery';

export interface Images {
	tile: Tile;
}

export interface Tile {
	large: string;
	medium: string;
	small: string;
}

export interface OrderingParameters {
	increment: number;
	max: number;
	min: number;
}

export interface ProductRating {
	average_rating: number;
	user_count: number;
}

export type ProductType = 'product';

export type PromoTagPercentage = 'Save 34%' | 'Save 23%' | 'Save 10%';

export interface SearchResult {
	result_set: number;
	score: null;
}

export type Tag =
	| '_internal_any_gluten_free'
	| 'gluten_free'
	| 'lactose_free'
	| 'low_sodium'
	| 'organic'
	| 'wegmans_brand'
	| 'national_brand_gluten_free'
	| 'family_pack'
	| 'low_calorie'
	| 'low_fat'
	| 'no_tags'
	| 'vegan'
	| 'kosher';

export interface UomPrice {
	price: number;
	uom: Uom;
}

export type Uom = 'fl oz' | 'oz';

const WEGMANS_BASE_URL = 'https://shop.wegmans.com';

interface SessionResponse {
	session_token: string;
}

export class WegmansStore implements GroceryStore {
	private cookie: string | null = null;

	constructor(private readonly kv: KVNamespace) {}

	private async getCookie(store: string): Promise<string> {
		// TODO: Add store selection to interface.
		// You can do unauthed request to https://shop.wegmans.com/api/v2/stores. Save cookies per store
		const stores = {
			'Astor Pl': 115,
		} as Record<string, number>;

		if (this.cookie) return this.cookie;

		// Try to get cached cookie from KV
		const cachedCookie = await this.kv.get('wegmans_cookie');
		if (cachedCookie) {
			this.cookie = cachedCookie;
			return cachedCookie;
		}

		// Step 1: Get the authorization token
		const cookieJson = {
			binary: 'web-ecom',
			binary_version: '2.25.122',
			is_retina: false,
			os_version: 'Win32',
			pixel_density: '2.0',
			push_token: '',
			screen_height: 1080,
			screen_width: 1920,
		};

		const sessionResponse = await fetch(`${WEGMANS_BASE_URL}/api/v2/user_sessions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
			},
			body: JSON.stringify(cookieJson),
		});

		const sessionData: SessionResponse = await sessionResponse.json();
		if (!sessionData.session_token) {
			throw new Error('Failed to get session token');
		}

		// Step 2: Get the API key using the authorization token
		const userResponse = await fetch(`${WEGMANS_BASE_URL}/api/v2/users`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${sessionData.session_token}`,
			},
		});

		const cookies = userResponse.headers.get('set-cookie');
		if (!cookies) throw new Error('Failed to get cookies');

		// This PATCH request will update the cookie to change the cookie for a given store
		const storeId = stores[store] || 115;
		await fetch('https://shop.wegmans.com/api/v2/user', {
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
				cookie: cookies,
			},
			body: JSON.stringify({ store_id: storeId, has_changed_store: true }),
			method: 'PATCH',
		});

		const sessionCookie = cookies.split(';').find((cookie) => cookie.trim().startsWith('session-prd-weg='));
		if (!sessionCookie) throw new Error('Failed to get session cookie');

		const cookie = sessionCookie.trim();
		this.cookie = cookie;

		// Cache the cookie in KV with a TTL of 23 hours (Wegmans sessions typically last 24 hours)
		await this.kv.put('wegmans_cookie', cookie, { expirationTtl: 82800 });
		console.log('Got cookie. Saved to KV');

		return cookie;
	}

	private async searchWithRetry(query: string, retries = 1): Promise<GroceryItem[]> {
		const searchURL = `${WEGMANS_BASE_URL}/api/v2/store_products?fulfillment_type=pickup&ads_enabled=false&ads_pagination_improvements=true&limit=10&offset=0&page=1&prophetScorer=frecency&sort=rank&allow_autocorrect=true&search_is_autocomplete=true&search_provider=ic&search_term=${query}%20organic&secondary_results=true&unified_search_shadow_test_enabled=false`;

		try {
			const cookie = await this.getCookie('Astor Pl');
			const response = await fetch(searchURL, {
				headers: {
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
					Cookie: cookie,
					'Api-Version': '2024-01-30',
				},
			});

			const data = (await response.json()) as Welcome;

			return data.items.map((item) => {
				const groceryItem: GroceryItem = {
					aisle: item.aisle,
					href: 'https://shop.wegmans.com/product/' + item.id,
					store: 'wegmans',
					image: item.images.tile.large,
					name: item.name,
					price: item.base_price,
					size: item.size_string,
				};
				return groceryItem;
			});
		} catch (error) {
			if (retries > 0) {
				this.cookie = null; // Reset cookie on failure
				return this.searchWithRetry(query, retries - 1);
			}
			throw error;
		}
	}

	async search(query: string): Promise<GroceryItem[]> {
		return this.searchWithRetry(query);
	}
}
