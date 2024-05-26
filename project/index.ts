import express, { Router } from "express";
import { secureMiddleware, redirectLoggedIn, redirectNoAdmin } from "./secureMiddleware";
import bodyParser from "body-parser";
import session from "./session";
import bcrypt from "bcrypt"
import {
    saltRounds,
    userCollection,
    createInitialUser,
    login,
    loadProductsFromMongo,
    loadCharacteristicsFromMongo,
    loadProducts,
    loadCharacteristics,
    loadProductsToMongo,
    updateProductInMongo,
    sortProductsById,
    sortProductsByName,
    sortProductsByMaterial,
    sortProductsByStock,
    sortProductsByPrice
} from "./functions";
import { Product, Characteristics, User } from "./interface";
import { ObjectId } from "mongodb";

const app = express();
let productsLoaded = false;

app.set("port", 3000);
app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session);

app.get("/login",redirectLoggedIn, (req,res) =>{
    res.render("loginspage");
});

app.post("/login", async (req,res) => {
    const { loginUsername, loginPassword} = req.body;
    try{
        let user : User | undefined = await login(loginUsername, loginPassword);
        delete (user as any).password;
        req.session.user = user;
        res.redirect("/")
    } catch (e : any) {
        return res.redirect("/login");
    }
})

app.get("/register", (req,res) => {
    res.render("registerpage");
})

app.post("/register", async (req, res) =>{
    const { registerUsername, registerPassword} = req.body;
    const existingUser = await userCollection.findOne({
        userName: registerUsername,
    });

    try{
        if(existingUser) {
            throw new Error("Account already exists");   
        } 
        } catch  (e: any) {
            return res.redirect("/login");
    }

    const newUser: User = {
        _id: new ObjectId(),
        userName: registerUsername,
        password: await bcrypt.hash(registerPassword, saltRounds),
        role: "USER",
    };

    await userCollection.insertOne(newUser);

    try {
        let user: User |undefined = await login(registerUsername, registerPassword);
        delete (user as any).password;
        req.session.user = user;
        res.redirect("/");
    } catch (e : any) {
        return res.redirect("/login");
    };
});

app.get("/logout", async(req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

app.get('/',secureMiddleware, async (req, res) => {
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

        res.render('index', { products: filteredProducts, sortField, sortDirection, filterName, user: req.session.user });
    } catch (error : any) {
        console.log(error.message);
        res.redirect("/login");
    }
});

app.get('/product/edit/:id',secureMiddleware, redirectNoAdmin, async (req, res) => {
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

app.post('/product/edit/:id',secureMiddleware, redirectNoAdmin, async (req, res) => {
    
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

app.get('/product/details/:id',secureMiddleware, async (req, res) => {
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

app.get('/characteristics',secureMiddleware, async (req, res) => {
    try {
        const allProducts= await loadProductsFromMongo();
        res.render('characteristics', {products: allProducts });
    } catch (error : any) {
        console.log(error.message);
    }
});

app.get('/characteristics/:id',secureMiddleware, async (req, res) => {
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

app.listen(app.get("port"), async() => {
    try{
        await createInitialUser();
        console.log("Server started listening on port " + app.get("port"));
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
});
