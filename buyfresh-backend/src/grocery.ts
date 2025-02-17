export interface GroceryItem {
	aisle: string;
	href: string;
	image: string;
	name: string;
	price: number;
	size: string;
}

export interface GroceryStore {
	search(query: string): Promise<GroceryItem[]>;
}
