import * as readline from 'readline-sync';
import { Product } from "./interface";

async function loadProducts(): Promise<Product[]> {
    try {
        const loadProduct = await fetch("https://raw.githubusercontent.com/ThomasVanTiggelenAP/project/main/project/products.json");
        const products = await loadProduct.json();;
        return products;
    } catch (error) {
        console.error("Can't read products.json:")
        return [];
    }
}

async function consoleApp() {
    let allProducts: Product[] = await loadProducts();
    let menu: string[] = [" View all data", " Filter by ID", " Exit"];
    let stopProgram: boolean = true;
    do {
        console.log(`Welcome to the JSON data viewer!\n`);
        let choice : number = readline.keyInSelect(menu, "Please enter your choice: ", {cancel: false});
        console.log();
        if (choice == 0) {
            for (let i = 0; i < allProducts.length; i++) {
                const productList = allProducts[i];
                console.log(`- ${productList.name} (${productList.id})`);
            }
            console.log();
        }
        if (choice === 1) {
            const id: string = readline.question("Please enter the ID you want to filter by: ");
            const filterList: Product[] = allProducts.filter((element) => element.id == id);
            const filter: Product = filterList[0];
                if (filter) {
                console.log();
                console.log(`- ${filter.name} (${filter.id})`);
                console.log(`- Description: ${filter.description}`);
                console.log(`- Lifespan: ${filter.lifespan}`);
                console.log(`- In stock: ${filter.inStock}`);
                console.log(`- Produced on: ${filter.producedOn}`);
                console.log(`- Image URL: ${filter.imageUrl}`);
                console.log(`- Color: ${filter.color}`);
                console.log(`- Approved: ${filter.approved}`);
                console.log(`- Characteristics:`);
                console.log(`    - ID: ${filter.characteristics.id}`);
                console.log(`    - Material: ${filter.characteristics.Material}`);
                console.log(`    - Weight: ${filter.characteristics.Weight}`);
                console.log(`    - Amount in stock: ${filter.characteristics.amountInStock}`);
                console.log(`    - Price: ${filter.characteristics.price}`);
                console.log();
            } else {
                console.log(`No product found with this Id!`);
            }
        }
        if (choice == 2) {
            stopProgram = false;
        }
    } while (stopProgram);
}
consoleApp();

