import { ObjectId } from "mongodb";

export interface Product {
    _id?: ObjectId;
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
    material: string;
    weight: number;
    amountInStock: number;
    price: number;
}

export interface User {
    _id?: ObjectId;
    userName: string;
    password: string;
    role: "ADMIN" | "USER";
}