interface PingPongTable {
    id: string;
    name: string;
    description: string;
    lifespan: number;
    inStock: boolean;
    producedOn: string;
    imageUrl: string;
    color: string;
    approved: string[];
    characteristics: {
        id: string;
        Material: string;
        Weight: number;
        amountInStock: number;
    };
}
