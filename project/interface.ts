export interface Product {
    id: string;
    name: string;
    description: string;
    lifespan: number;
    inStock: boolean;
    producedOn: string;
    imageUrl: string;
    color: string;
    approved: string[];
    characteristics: Characteristics;
}

export interface Characteristics {
    id: string;
    Material: string;
    Weight: number;
    amountInStock: number;
    price: number;
}
