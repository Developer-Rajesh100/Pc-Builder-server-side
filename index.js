const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// MIDDLEWARE
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fhk5k.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "UnAuthorized access" });
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "Forbidden access" });
        }
        req.decoded = decoded;
        next();
    });
}

//ALL API

async function run() {
    try {
        await client.connect();
        const productCollection = client.db("pcBuilder").collection("product");
        const userCollection = client.db("pcBuilder").collection("user");
        const orderCollection = client.db("pcBuilder").collection("order");

        //FETCH ALL PRODUCT

        app.get("/product", async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });

        //MAKE ADMIN

        app.get("/user", async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        });

        /////

        app.get("/admin/:email", async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === "admin";
            res.send({ admin: isAdmin });
        });

        /////////ADMIN

        app.put("/user/admin/:email", async (req, res) => {
            const email = req.params.email;
            // const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({
                email: email,
            });

            const filter = { email: email };
            const updateDoc = {
                $set: { role: "admin" },
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        //USER

        app.put("/user/:email", async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(
                filter,
                updateDoc,
                options
            );
            const token = jwt.sign(
                { email: email },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: "7d" }
            );
            res.send({ result, token });
        });

        // Product Order

        app.put("/order/:id", async (req, res) => {
            const id = req.params.id;
            const newQuantity = req.body.quantity;
            console.log(newQuantity);
            const filter = { _id: ObjectId(id) };
            const product = await productCollection.findOne(filter);
            const remainingQuantity =
                parseInt(product.availableQuantity) - parseInt(newQuantity);
            console.log(remainingQuantity);
            const updateDoc = {
                $set: {
                    availableQuantity: remainingQuantity,
                },
            };
            const result = await productCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        /////////

        app.post("/order", async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });

        //FETCH SINGLE PRODUCT

        app.get("/product/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productCollection.findOne(query);
            res.send(product);
        });

        //ADD PRODUCT

        app.post("/product", async (req, res) => {
            const newProduct = req.body;
            console.log(req.body);
            const result = await productCollection.insertOne(newProduct);
            res.send(result);
        });

        //DELETE

        app.delete("/product/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productCollection.deleteOne(query);
            res.send(product);
        });

        //ORDER DATA
    } finally {
    }
}
run().catch(console.dir);

//FOOTER////////////

app.get("/", (req, res) => {
    res.send("Server is Running");
});

app.listen(port, () => {
    console.log("Listening to Port", port);
});
