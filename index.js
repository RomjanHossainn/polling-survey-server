const express = require('express');

const app = express();
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE);
const port = process.env.PORT || 5000;
const cors = require('cors');
const jwt = require('jsonwebtoken');



app.use(cors())
app.use(express.json())

app.get('/',(req,res) => {
    res.send('The server home route running')
})


const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const surbeyesDB = client.db('surveyDB').collection('surveys');
    const surveyVoteChecking = client.db("surveyDB").collection('impreetion');
    const adminFeedBackDB = client.db("surveyDB").collection('adminFeedBacks');


    // token middleware 

    const veryfyToken = (req,res,next) => {

      if(!req.headers.authorization){
        return res.status(401).send({message : 'forbidden access beta shor'})
      }

      const token = req.headers.authorization.split(' ')[1];

      jwt.verify(token,process.env.JWT_SECRET,(err,decoded) => {
        if(err){
          console.log(err)
          return res.status(401).send({message : 'forbiden access'})
        }
        req.decoded = decoded;
        next()

      })

    }

    // jwt releted api 

    app.post('/jwt',async(req,res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      res.send({token})
    })

    // user releted api 

    app.post('/users',async(req,res) => {

      const user = req.body;
      const email = user.email;
      const query = {email : email}
      const findUser = await usersDB.findOne(query);

      if(findUser){
        return res.send({message : 'already ache'})
      }
      const result = await usersDB.insertOne(user);
      res.send(result);

    })

    app.get("/users", veryfyToken,async (req, res) => {
      const result = await usersDB.find().toArray();
      res.send(result);
    });

    // delete user 

    app.delete("/user/:id",async (req, res) => {
      const id = req.params.id;
      const result = await usersDB.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // set user role  

    app.post('/user/role/:id',async(req,res) => {
      const roleValue = req.body.roleValue;
      const id = req.params.id
      const filter = {_id : new ObjectId(id)}
      const updateDog = {
        $set : {
          role : roleValue
        }
      }

      const reuslt = await usersDB.updateOne(filter,updateDog);
      res.send(reuslt);

    })

    // get userrole 

    app.get('/user/role',veryfyToken,async(req,res) => {

      if (req.query.email !== req.decoded.email) {
        return res.status(403).send({ message: "anauthorize" });
      }


      const email = req.query.email;
      const query = {email : email};
      const result = await usersDB.findOne(query);
      if(result?.role === 'admin'){
        res.send({userRole : 'admin'})
      }else if(result?.role === 'surveyor'){
        res.send({userRole : 'surveyor'})
      }else if(result?.role === 'pro_user'){
        res.send({userRole : 'pro_user'})
      }else{
        res.send({userRole : 'user'})
      }
    })

    // survey releted api 

    app.post('/surveys',async(req,res) => {
      const data = req.body;
      const result = await surbeyesDB.insertOne(data)
      res.send(result)
    })

    app.get('/surveyes',async(req,res) => {

      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const result = await surbeyesDB
        .find({ status : 'publish'})
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result)
    })

    // my posted survey get 

    app.get("/mypostedsurvey",veryfyToken,async(req,res) => {

      if(req.query.email !== req.decoded.email){
        return res.status(403).send({message : 'unauthorize'})
      }
      const email = req.query.email;
      const result = await surbeyesDB.find({email : email}).toArray()
      res.send(result);
    });

    app.get("/surveyCount",async(req,res) => {
      const surveyCount = await surbeyesDB.estimatedDocumentCount();
      res.send({surveyCount})
    });

    // survey deatils 
    app.get("/surveyedetails/:id",async(req,res) => {
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await surbeyesDB.findOne(query);
      res.send(result);
    });

    // surveyStatus 

    app.patch("/surveystatus/:id",veryfyToken,async(req,res) => {
      const id = req.params.id;
      const filter = {_id : new ObjectId(id)}
      const updateDog = {
        $set : {
          status : 'unpublish'
        }
      }

      const result = await surbeyesDB.updateOne(filter,updateDog);
      res.send(result);

    });

    app.post("/admin/feedback/message",veryfyToken,async(req,res) => {
      const data = req.body;
      const result = await adminFeedBackDB.insertOne(data)
      res.send(result);
    });

    // get adminfeadbaclk

    app.get("/adminfeadback",veryfyToken,async(req,res) => {

      if(req.query.email !== req.decoded.email){
        return res.status(403).send({message : "aunauthorize"})
      }

      const id = req.query.id;
      const email = req.query.email;
      const result = await adminFeedBackDB.findOne({surveyId : id,email : email })
      res.send(result);
    });


    // user feadback 

    app.get("/usersfeadback",veryfyToken,async(req,res) => {

      if(req.query.email !== req.decoded.email){
        return res.status(401).send({message : 'aunauthorize'})
      }

      const {id,email} = req.query;
      
      const result = await surveyVoteChecking.findOne({surveyId : id,email : email})
      res.send(result);
    });

    // most voted survey 

    app.get("/mostvotesurvey",async(req,res) => {
      const result = await surbeyesDB.find({
      status : 'publish'  
      }).sort({vote : -1}).limit(6).toArray();
      res.send(result);
    });




    // like and dislike 

    app.patch('/likeincreement',async(req,res) => {

      const voteChecker = req.body;

      const findVoteCheck = await surveyVoteChecking.findOne({
        surveyId: voteChecker.surveyId,
        userId: voteChecker.userId,
        impretion : voteChecker.impretion,
      });

      if (findVoteCheck) {
        return res.send({ message: "likeAllreadyExist" });
      }
     
      const id = req.query.id;
      const filter = {_id : new ObjectId(id)}
      const find = await surbeyesDB.findOne(filter);
      const updateDog = {
        $set : {
          likeCount : find.likeCount + 1
        }
      }
      const result = await surbeyesDB.updateOne(filter,updateDog);
      res.send(result);

    })

    
    app.patch('/dislike',async(req,res) => {

      const voteChecker = req.body;

      const findVoteCheck = await surveyVoteChecking.findOne({
        surveyId: voteChecker.surveyId,
        userId: voteChecker.userId,
        impretion : voteChecker.impretion
      });

      if (findVoteCheck) {
        return res.send({ message: "dislikeAllreadyExist" });
      }

      const id = req.query.id;
      const filter = { _id: new ObjectId(id) };
      const find = await surbeyesDB.findOne(filter);
      const updateDog = {
        $set: {
          dislikeCount: find.dislikeCount + 1,
        },
      };
      const result = await surbeyesDB.updateOne(filter, updateDog);
      res.send(result);
    })

    app.patch("/vote", async (req, res) => {

      const voteChecker = req.body;

      const findVoteCheck = await surveyVoteChecking.findOne({
        surveyId : voteChecker.surveyId,userId : voteChecker.userId,
        impretion : voteChecker.impretion
      });

      if(findVoteCheck){
        return res.send({message : 'voteAllreadyExist'})
      }

      const id = req.query.id;
      const filter = { _id: new ObjectId(id) };
      const find = await surbeyesDB.findOne(filter);
      const updateDog = {
        $set: {
          vote: find.vote + 1,
        },
      };
      const result = await surbeyesDB.updateOne(filter, updateDog);
      res.send(result);
    });

    // vote checkkin

    app.post('/voteduser',async(req,res) => {

      const findExist = await surveyVoteChecking.findOne({
        surveyId: req.body.surveyId,
        userId: req.body.userId,
        impretion : req.body.impretion,
      });

     

      if(findExist){
        return res.send({message : "AlreadyExist"})
      }
      const result = await surveyVoteChecking.insertOne(req.body);
      res.send(result)

    })


    // payment releted api

    app.post('/create-payment-intent',async(req,res) => {
      const { price } = req.body;
      const amountTk = parseInt(price * 100)

      try{
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountTk,
          currency: "usd",
          payment_method_type: ["card"],
          automatic_payment_methods: {
            enabled: true,
          },
        });

        res.send({
        clientSecret: paymentIntent.client_secret,
        });
      }catch(erorr) {
        console.log(erorr)
      }

    })



    // ans post 

    // app.post("/answer",async(req,res) => {
    //   const data = req.body;

    // });
    
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