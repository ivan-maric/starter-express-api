require('dotenv').config();

const express = require('express');
const cors = require('cors');
const util = require('util'); //za fino formatiran ispis u log...

const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());

// parse application/json, basically parse incoming Request Object as a JSON Object
app.use(express.json());
// parse incoming Request Object if object, with nested objects, or generally any type.
app.use(express.urlencoded({ extended: true }));

app.get('/cities', async (req, res) => {
  try {
    await client.connect();

    //const page = req.url.searchParams.get('page') || 1;
    //const per_page = req.url.searchParams.get('per_page') || 10;

    const page = req.query.page || 1;
    const per_page = req.query.per_page || 2;

    // console.log(Object.keys(req)); //req.query je najverovatnije page ...

    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );

    const myDb = client.db('test');
    const myCollection = myDb.collection('books');
    const numDoc = await myCollection.countDocuments();
    const total_pages = Math.ceil(numDoc / per_page);

    const data = await myCollection
      .find()
      .skip(Math.max(per_page * (page - 1), 0))
      .limit(per_page)
      .toArray();

    res.json({
      data,
      page,
      total_pages: total_pages,
      total: numDoc,
    });
  } catch (err) {
    console.log({ err });
    res.statusCode(500).send({ message: `Internal Server Error.\n\n${err}` });
  } finally {
    console.log('finally');
    await client.close();
  }
});

app.put('/cities', async (req, res) => {
  console.log({ body: req.body });

  try {
    await client.connect();

    const myDB = client.db('test');
    const myCollection = myDb.collection('books');

    //let doc = { name: 'tom', age: 75 };
    //let result = await myColl.insertOne(doc);
    let filter = { city: 'Berlin' };
    let update = { country: 'Germany', population: 3769495 };

    // A ovo sve moze i foreach... ali ne sada
    let result = await myCollection.findOneAndUpdate(
      filter,
      { $set: update },
      { new: true, upsert: true } // Make this update into an upsert
    );
    if (result.lastErrorObject.updatedExisting)
      console.log(`A document was updated  with the _id: ${result.value._id}`);
    else
      console.log(
        `A document was inserted with the _id: ${result.lastErrorObject.upserted}`
      );

    //doc = { name: 'jerry', age: 73 };
    //doc = { "city": "London", "country": "United Kingdom", "population": 8908081};
    filter = { city: 'London' };
    update = { country: 'United Kingdom', population: 8908081 };

    result = await myCollection.findOneAndUpdate(
      filter,
      { $set: update },
      { new: true, upsert: true } // Make this update into an upsert
    );
    if (result.lastErrorObject.updatedExisting)
      console.log(`A document was updated  with the _id: ${result.value._id}`);
    else
      console.log(
        `A document was inserted with the _id: ${result.lastErrorObject.upserted}`
      );

    res.json(result);
  } catch (err) {
    console.log({ err });
    res.status(500).send({ message: `Internal Server Error.\n\n${err}` });
  } finally {
    console.log('finally');
    await client.close();
  }
});

app.post('/cities', async (req, res) => {
  console.log({ body: req.body });

  try {
    await client.connect();

    const myDB = client.db('test');
    const myCollection = myDb.collection('books');

    //let filter = { name: 'Tom' };
    //let update = { age: 75 };

    const body = req.body; //req.body is allready parsed string, so we dont need apply e.g   <- JSON.parse(req.body)

    //In any case... safeguard from empty string writing in Document in Colection of MongoDB
    if (body.city === '' || body.country === '')
      throw new Error('Input parameter is not valid!');

    const city = body.city;

    const country = body.country;
    const image = body.image;
    const population = parseInt(body.population); //It formaly should be a number!
    const description = body.description;

    const filter = { city: city };
    const update = { country, image, population, description };

    // A ovo sve moze i foreach... ali ne sada
    const result = await myCollection.findOneAndUpdate(
      filter,
      { $set: update },
      { new: true, upsert: true } // Make this update into an upsert
    );
    if (result.lastErrorObject.updatedExisting)
      console.log(`A document was updated  with the _id: ${result.value._id}`);
    else
      console.log(
        `A document was inserted with the _id: ${result.lastErrorObject.upserted}`
      );

    res.json(result);
  } catch (err) {
    console.log({ err });
    res.status(500).send({ message: `Internal Server Error.\n\n${err}` });
  } finally {
    console.log('finally');
    await client.close();
  }
});

app.delete('/cities', async (req, res) => {
  console.log({ body: req.body });

  //My proprietary command for drop DB.
  const dropDbcommand = '2bce095d-c870-4cc9-9ee7-021b552bee78';
  try {
    await client.connect();

    const myDB = client.db('cartoonDb');
    const myCollection = myDB.collection('users');

    //let filter = { name: 'Tom' };
    //let update = { age: 75 };

    const body = req.body; //req.body is allready parsed string, so we dont need apply e.g   <- JSON.parse(req.body)

    //In any case... safeguard from empty string writing in Document in Colection of MongoDB
    if (body.city === '' || body.country === '')
      throw new Error('Input parameter is not valid!');

    if (body.city === dropDbcommand && body.country === dropDbcommand) {
      //DropDB - operation
      //
      let result = await myCollection.countDocuments();
      //We want to avoid an exception while calling drop() command on (i.e. over...) a collection object
      //that is: already empty, or does not even exist!
      if (result > 0) result = await myCollection.drop();
      else result = false;
      //
      if (result) console.log('Drop command over the colecction succeeded.');
      else
        console.log(
          'A requested operation: fail, or requested collection is empty, or even does not exist.'
        );
      //
      res.json(result);
    } else {
      //Simple findOneAndDelete method...
      const name = body.name;
      const old = parseInt(body.old); //Formaly it should be a number!

      const filter = { name: name, age: old };
      //
      const result = await myCollection.findOneAndDelete(filter);
      //
      if (result.lastErrorObject.n === 1)
        console.log(
          `A document: ${util.inspect(result.value)} with the _id: ${
            result.value._id
          }, was deleted.`
        );
      else
        console.log(
          `A requested document ${util.inspect(
            filter
          )}, was not find in collection. Found value is: ${
            result.lastErrorObject.value
          }`
        );
      //
      res.json(result);
    }
  } catch (err) {
    console.log({ err });
    res.status(500).send({ message: `Internal Server Error.\n\n${err}` });
  } finally {
    console.log('finally');
    await client.close();
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
