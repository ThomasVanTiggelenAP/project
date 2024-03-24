import express from "express";
import * as fs from 'fs';
import { Product } from "./interface";

const app = express();
let allProducts: Product[] = [];


async function loadProducts(): Promise<Product[]> {
    try {
        const loadProduct = await fetch("https://raw.githubusercontent.com/ThomasVanTiggelenAP/project/main/project/products.json");
        allProducts = await loadProduct.json();;
        return allProducts;
    } catch (error) {
        console.error("Can't read products.json:")
        return [];
    }
}

function sortProductsById(products: Product[], ascending: boolean): Product[] {
    return products.sort((a, b) => {
        const idA = a.id.toUpperCase();
        const idB = b.id.toUpperCase();
        return ascending ? idA.localeCompare(idB) : idB.localeCompare(idA);
    });
}

function sortProductsByName(products: Product[], ascending: boolean): Product[]{
    return products.sort((a, b) => {
        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();
        return ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
}

function sortProductsByMaterial(products: Product[], ascending: boolean): Product[]{
    return products.sort((a, b) => {
        const materialA = a.characteristics.material.toUpperCase();
        const materialB = b.characteristics.material.toUpperCase();
        return ascending ? materialA.localeCompare(materialB) : materialB.localeCompare(materialA);
    });
}

app.set("port", 3000);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

app.set('layout', './layouts/main');
app.set("view engine", "ejs");


app.get('/', async (req, res) => {
    try {
        let allProducts: Product[] = await loadProducts();
        const sortField = req.query.sortField || 'id';
        const sortDirection = req.query.sortDirection || 'asc';
        const filterName = req.query.filterName ? String(req.query.filterName).toLowerCase() : '';
        allProducts = allProducts.filter(product => product.name.toLowerCase().includes(filterName));

        if (sortField === 'id') {
            allProducts = sortProductsById(allProducts, sortDirection === 'asc');
        }
        if (sortField === 'name') {
            allProducts = sortProductsByName(allProducts, sortDirection === 'asc');
        }
        if (sortField === 'material') {
            allProducts = sortProductsByMaterial(allProducts, sortDirection === 'asc');
        }
        res.render('index', { products: allProducts, sortField, sortDirection, filterName });
    } catch (error) {
        console.error("Error loading products:", error);
        res.status(500).send("Error loading products");
    }
});

app.get('/product/details/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const product = allProducts.find(product => product.id === productId);

        if (product) {
            res.render('details', { products: [product] }); // Opgelet: het is belangrijk om products als een array door te geven, zelfs als het slechts één product is
        } else {
            res.status(404).send('Product not found');
        }
    } catch (error) {
        console.error("Error fetching product details:", error);
        res.status(500).send("Error fetching product details");
    }
});

app.listen(app.get("port"), () => {
    console.log("Server started listening on port " + app.get("port"));
});
