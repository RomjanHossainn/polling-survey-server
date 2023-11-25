const express = require('express');

const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
const cors = require('cors');

app.use(cors())
app.use(express.json())

app.get('/',(req,res) => {
    res.send('The server home route running')
})




const { MongoClient, ServerApiVersion } = require("mongodb");
const uri =
  `mongodb+srv://${process.env.USER_NAME}:${process.env.PASS}@cluster0.lh60fv2.mongodb.net/?retryWrites=true&w=majority`;



// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();


    // database 

    const usersDB = client.db('surveyDB').collection('users')

    // user releted api 

    app.post('/users',async(req,res) => {
      const user = req.body;
      const result = await usersDB.insertOne(user);
      res.send(result);
    })
 

    
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.listen(port,() => {
    console.log('server is running.')
})