import express from "express";
import { Product } from "./interface";

const app = express();
let allProducts: Product[] = [];


async function loadProducts(): Promise<Product[]> {
    try {
        const loadProduct = await fetch("https://raw.githubusercontent.com/ThomasVanTiggelenAP/project/main/project/products.json");
        allProducts = await loadProduct.json();;
        return allProducts;
    } catch (error) {
        console.error("Cannot read products.json!")
        return [];
    };
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

function sortProductsByStock(products: Product[], ascending: boolean): Product[]{
    return products.sort((a, b) => {
        return ascending ? (a.inStock ? -1 : 1) : (b.inStock ? -1 : 1);
    });
}

function sortProductsByPrice(products: Product[], ascending: boolean): Product[]{
    return products.sort((a, b) =>{
        const priceA = a.characteristics.price;
        const priceB = b.characteristics.price;
        return ascending ? priceA - priceB : priceB - priceA;
    });
}

app.set("port", 3000);
app.set("view engine", "ejs");

app.use(express.static("public"));

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
        if (sortField === 'inStock') {
            allProducts = sortProductsByStock(allProducts, sortDirection === 'asc');
        }
        if (sortField === 'price') {
            allProducts = sortProductsByPrice(allProducts, sortDirection === 'asc');
        }
        res.render('index', { products: allProducts, sortField, sortDirection, filterName });
    } catch (error : any) {
        console.log(error.message);
    }
});

app.get('/product/details/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const product = allProducts.find(product => product.id === productId);

        if (product) {
            res.render('details', { products: [product] });
        } else {
            res.status(404).send('Product not found');
        }
    } catch (error : any) {
        console.log(error.message);
    }
});

app.get('/characteristics', async (req, res) => {
    try {
        let allProducts: Product[] = await loadProducts();
        res.render('characteristics', {products: allProducts });
    } catch (error : any) {
        console.log(error.message);
    }
});

app.get('/characteristics/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const product = allProducts.find(product => product.id === productId);

        if (product) {
            res.render('char-details', { product });
        }else {
            res.status(404).send('Product not found');
        }
    }catch (error : any) {
        console.log(error.message);
    }
});

app.listen(app.get("port"), () => {
    console.log("Server started listening on port " + app.get("port"));
});
