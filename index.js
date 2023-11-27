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

    app.get('/users',async(req,res) => {
      const result = await usersDB.find().toArray();
      res.send(result);
    })

    // delete user 

    app.delete('/user/:id',async(req,res) => {
      const id = req.params.id;
      const result = await usersDB.deleteOne({_id : new ObjectId(id)})
      res.send(result);
    })

    // survey releted api 

    app.get('/surveyes',async(req,res) => {
      console.log(req.query)
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const result = await surbeyesDB.find().skip(page * size).limit(size).toArray();
      res.send(result)
    })

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


    // most voted survey 

    app.get("/mostvotesurvey",async(req,res) => {
      const result = await surbeyesDB.find({
        
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