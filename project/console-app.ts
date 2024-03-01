import * as readline from 'readline-sync';
import * as fs from 'fs';
import { Product } from "./interface";

let menu: string[] = [" View all data", " Filter by ID", " Exit"];
let stopProgram: boolean = true;

function loadProducts(): Product[] {
    try {
        const loadProduct = fs.readFileSync("products.json", "utf8");
        const products: Product[] = JSON.parse(loadProduct);
        return products;
    } catch (error) {
        console.error("Can't read products.json:")
        return [];
    }
}

function filterById(id: string): Product | null {
    const products: Product[] = loadProducts();
    for (let i = 0; i < products.length; i++) {
        if (products[i].id === id) {
            return products[i];
        }
    }
    return null;
}

do {
    console.log(`Welcome to the JSON data viewer!\n`);
    menu.forEach((option, index) => console.log(`${index + 1}. ${option}`));

    let question = readline.question(`\nPlease enter your choice: `)
    let choice: number = parseInt(question);
    console.log();
    if (choice == 1) {
        const productNameAndId: Product[] = loadProducts();
        for (let i = 0; i < productNameAndId.length; i++) {
            const productList = productNameAndId[i];
            console.log(`- ${productList.name} (${productList.id})`);
        }
        console.log();
    }
    if (choice === 2) {
        const id: string = readline.question("Please enter the ID you want to filter by: ");
        const filteredProduct: Product | null = filterById(id);
        if (filteredProduct) {
            console.log(`- ${filteredProduct.name} (${filteredProduct.id})`);
            console.log(`  - Description: ${filteredProduct.description}`);
            console.log(`  - Lifespan: ${filteredProduct.lifespan}`);
            console.log(`  - In Stock: ${filteredProduct.inStock}`);
            console.log(`  - Produced On: ${filteredProduct.producedOn}`);
            console.log(`  - Image URL: ${filteredProduct.imageUrl}`);
            console.log(`  - Color: ${filteredProduct.color}`);
            console.log(`  - Approved: ${filteredProduct.approved}`);
            console.log(`  - Characteristics:`);
            console.log(`    - ID: ${filteredProduct.characteristics.id}`);
            console.log(`    - Material: ${filteredProduct.characteristics.Material}`);
            console.log(`    - Weight: ${filteredProduct.characteristics.Weight}`);
            console.log(`    - Amount in Stock: ${filteredProduct.characteristics.amountInStock}`);
            console.log(`    - Price: ${filteredProduct.characteristics.price}`);
        } else {
            console.log(`No product found with ID ${id}`);
        }
    }
    if (choice == 3) {
        stopProgram = false;
    }
} while (stopProgram);
