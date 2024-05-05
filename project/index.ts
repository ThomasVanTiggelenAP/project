import express from "express";
import { Characteristics, Product } from "./interface";
import { MongoClient, Collection} from "mongodb";
import bodyParser from "body-parser";


const uri = "mongodb+srv://thomasvt:thomas2004@firstcluster.uub1uux.mongodb.net/?retryWrites=true&w=majority&appName=FirstCluster";
const app = express();
let productsLoaded = false;

async function loadProductsFromMongo(): Promise<Product[]>{
    const client = new MongoClient(uri);
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

async function loadCharacteristicsFromMongo(): Promise<Characteristics[]>{
    const client = new MongoClient(uri);
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

async function loadProducts(): Promise<Product[]> {
    try {
        const loadProduct = await fetch("https://raw.githubusercontent.com/ThomasVanTiggelenAP/project/main/project/products.json");
        return loadProduct.json();
    } catch (error) {
        console.error("Cannot read products.json!")
        return [];
    };
}

async function loadCharacteristics(): Promise<Characteristics[]> {
    try {
        const loadChars = await fetch("https://raw.githubusercontent.com/ThomasVanTiggelenAP/project/main/project/characteristics.json");
        return loadChars.json();
    } catch (error) {
        console.error("Cannot read characteristics.json!")
        return [];
    };
}

async function loadProductsToMongo(allProducts: Product[], allChars: Characteristics[]): Promise<void>{
    const client = new MongoClient(uri);
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

async function updateProductInMongo(productId: string, updatedProduct:Product, updatedChar:Characteristics): Promise<void> {
    const client = new MongoClient(uri);
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
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
    try {
        let allProducts: Product[];
        let allChars: Characteristics[];
        if (!productsLoaded) {
            allProducts = await loadProductsFromMongo();
            allChars = await loadCharacteristicsFromMongo();
            if (allProducts.length === 0 || allChars.length === 0) {
                allProducts = await loadProducts();
                allChars = await loadCharacteristics();
                await loadProductsToMongo(allProducts, allChars);
                allProducts = await loadProductsFromMongo();
                allChars = await loadCharacteristicsFromMongo()
                console.log("Data was not found in database so database filled with api data!");
                await loadProductsToMongo(allProducts,allChars);
            } else {
                console.log("Data found in mongo!");
            }
            productsLoaded = true;
        } else {
            allProducts = await loadProductsFromMongo();
            allChars = await loadCharacteristicsFromMongo();
        }

        const { sortField = 'id', sortDirection = 'asc', filterName = '' } = req.query;

        let filteredProducts = allProducts;
        if (filterName) {
            filteredProducts = filteredProducts.filter(product => product.name.toLowerCase().includes(filterName.toString().toLowerCase()));
        }

        switch (sortField) {
            case 'id':
                filteredProducts = sortProductsById(filteredProducts, sortDirection === 'asc');
                break;
            case 'name':
                filteredProducts = sortProductsByName(filteredProducts, sortDirection === 'asc');
                break;
            case 'material':
                filteredProducts = sortProductsByMaterial(filteredProducts, sortDirection === 'asc');
                break;
            case 'inStock':
                filteredProducts = sortProductsByStock(filteredProducts, sortDirection === 'asc');
                break;
            case 'price':
                filteredProducts = sortProductsByPrice(filteredProducts, sortDirection === 'asc');
                break;
            default:
                break;
        }

        res.render('index', { products: filteredProducts, sortField, sortDirection, filterName });
    } catch (error : any) {
        console.log(error.message);
    }
});

app.get('/product/edit/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const allProducts = await loadProductsFromMongo();
        const allChars = await loadCharacteristicsFromMongo();
        const product = allProducts.find(product => product.id === productId);

        if (product) {
            res.render('edit-product', { product: product, characteristics: allChars });
        } else {
            res.status(404).send('Product not found');
        }
    } catch (error) {
        console.error("Page not found");
    }
});

app.post('/product/edit/:id', async (req, res) => {
    
        const allProducts = await loadProductsFromMongo();
        const allChar = await loadCharacteristicsFromMongo();
        const productId = req.params.id;
        const product = allProducts.find(e=> e.id === productId);
        const {name,description, lifespan, characteristics} = req.body;
        const foundChar = allChar.find(e=> e.id === characteristics);
        if (!product){
            return res.render("404");
        }
        const updatedProduct: Product = {
            id: productId,
            name: name,
            description: description,
            lifespan: lifespan,
            inStock: product.inStock,
            producedOn: product.producedOn,
            imageUrl: product.imageUrl,
            color: product.color,
            approved: product.approved,
            characteristics: foundChar!
        };

        await updateProductInMongo(productId,updatedProduct, updatedProduct.characteristics );
        res.redirect('/');
});

app.get('/product/details/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const allProducts= await loadProductsFromMongo();
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
        const allProducts= await loadProductsFromMongo();
        res.render('characteristics', {products: allProducts });
    } catch (error : any) {
        console.log(error.message);
    }
});

app.get('/characteristics/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const allProducts = await loadProductsFromMongo();
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
