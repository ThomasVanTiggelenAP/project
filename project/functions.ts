import express from "express";
import { Characteristics, Product, User } from "./interface";
import { MongoClient, Collection} from "mongodb";
import bodyParser from "body-parser";
import bcrypt from "bcrypt"
import dotenv from "dotenv";
dotenv.config();

export const MONGODB_URI = "mongodb+srv://thomasvt:thomas2004@firstcluster.uub1uux.mongodb.net/?retryWrites=true&w=majority&appName=FirstCluster";
const client = new MongoClient(MONGODB_URI);
export const userCollection = client.db("Project").collection<User>("users");
export const saltRounds : number = 10;

export async function createInitialUser(){
    if (await userCollection.countDocuments() > 0){
        return;
    }
    let username : string | undefined = process.env.ADMIN_USERNAME;
    let password : string | undefined = process.env.ADMIN_PASSWORD;
    if (username === undefined || password === undefined){
        throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD must be set in environment");
    }
    await userCollection.insertOne({
        userName: username,
        password: await bcrypt.hash(password, saltRounds),
        role: "ADMIN"
    });
}

export async function login(username: string, password: string) {
    if (username === "" || password === "") {
        throw new Error("Username and password required");
    }
    let user : User | null = await userCollection.findOne<User>({userName: username});
    if (user){
        if (await bcrypt.compare(password, user.password!)){
            return user;
        } else {
            throw new Error("Password incorrect");
        }
    } else {
        throw new Error("User not found")
    }
}

export async function loadProductsFromMongo(): Promise<Product[]>{
    const client = new MongoClient(MONGODB_URI);
    try{
        await client.connect();
        let collection = client.db("Project").collection<Product>("products");
        let allProducts = await collection.find({}).toArray();
        return allProducts;
    } catch (error){
        console.error("Cannot load data from mongo!");
        return [];
    } finally {
        await client.close();
    }
}

export async function loadCharacteristicsFromMongo(): Promise<Characteristics[]>{
    const client = new MongoClient(MONGODB_URI);
    try{
        await client.connect();;
        let collection = client.db("Project").collection<Characteristics>("characteristics");
        let allChars = await collection.find({}).toArray();
        return allChars;
    } catch (error){
        console.error("Cannot load data from mongo!");
        return [];
    } finally {
        await client.close();
    }
}

export async function loadProducts(): Promise<Product[]> {
    try {
        const loadProduct = await fetch("https://raw.githubusercontent.com/ThomasVanTiggelenAP/project/main/project/products.json");
        return loadProduct.json();
    } catch (error) {
        console.error("Cannot read products.json!")
        return [];
    };
}

export async function loadCharacteristics(): Promise<Characteristics[]> {
    try {
        const loadChars = await fetch("https://raw.githubusercontent.com/ThomasVanTiggelenAP/project/main/project/characteristics.json");
        return loadChars.json();
    } catch (error) {
        console.error("Cannot read characteristics.json!")
        return [];
    };
}

export async function loadProductsToMongo(allProducts: Product[], allChars: Characteristics[]): Promise<void>{
    const client = new MongoClient(MONGODB_URI);
    try{
        await client.connect();
        console.log("Connected to the database");
        let collection = client.db("Project").collection<Product>("products");
        let charCollection = client.db("Project").collection<Characteristics>("characteristics");
        if (await collection.countDocuments() === 0){
            await collection.insertMany(allProducts);
        }
        if (await charCollection.countDocuments() === 0){
            await charCollection.insertMany(allChars);
        }
        
    } catch (error) {
        console.error("Cannot load product to mongo!");
    } finally {
        await client.close();
    }
}

export async function updateProductInMongo(productId: string, updatedProduct:Product, updatedChar:Characteristics): Promise<void> {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        let collection = client.db("Project").collection<Product>("products");
        await collection.updateOne({ id: productId }, { $set:{name: updatedProduct.name, inStock: updatedProduct.inStock, lifespan: updatedProduct.lifespan, characteristics: updatedChar}});
    } catch (error) {
        console.error("Cannot update product in mongo!", error);
    } finally {
        await client.close();
    }
}

export function sortProductsById(products: Product[], ascending: boolean): Product[] {
    return products.sort((a, b) => {
        const idA = a.id.toUpperCase();
        const idB = b.id.toUpperCase();
        return ascending ? idA.localeCompare(idB) : idB.localeCompare(idA);
    });
}

export function sortProductsByName(products: Product[], ascending: boolean): Product[]{
    return products.sort((a, b) => {
        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();
        return ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
}

export function sortProductsByMaterial(products: Product[], ascending: boolean): Product[]{
    return products.sort((a, b) => {
        const materialA = a.characteristics.material.toUpperCase();
        const materialB = b.characteristics.material.toUpperCase();
        return ascending ? materialA.localeCompare(materialB) : materialB.localeCompare(materialA);
    });
}

export function sortProductsByStock(products: Product[], ascending: boolean): Product[]{
    return products.sort((a, b) => {
        return ascending ? (a.inStock ? -1 : 1) : (b.inStock ? -1 : 1);
    });
}

export function sortProductsByPrice(products: Product[], ascending: boolean): Product[]{
    return products.sort((a, b) =>{
        const priceA = a.characteristics.price;
        const priceB = b.characteristics.price;
        return ascending ? priceA - priceB : priceB - priceA;
    });
}