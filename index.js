const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.POST || 5000;

// MIDDLEWARE
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fhk5k.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

//ALL API

async function run() {
    try {
        await client.connect();
        const productCollection = client.db("pcBuilder").collection("product");
        const userCollection = client.db("pcBuilder").collection("user");
        // const orderCollection = client.db("pcBuilder").collection("order");

        //FETCH ALL PRODUCT

        app.get("/product", async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
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
                { expiresIn: "1h" }
            );
            res.send({ result, token });
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

        // app.post("/order", async (req, res) => {
        //     const order = req.body;
        //     const result = await orderCollection.insertOne(order);
        //     res.send(result);
        // });
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
