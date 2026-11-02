import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import cors from "cors";

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);
export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}
const mongoClient = await connectToMongoDB();
const db = mongoClient.db("eventora");
const eventCollection = db.collection("events");
const bookingCollection = db.collection("bookings");

//http://localhost:8000/create-event
app.post("/create-event", async (req, res) => {
  const data = req.body;
  const result = await eventCollection.insertOne(data);
  console.log(result);
  res.send(result);
});

//http://localhost:8000/my-booking

app.post("/my-booking", async (req, res) => {
  const data = req.body;
  const oldBooking = await bookingCollection.findOne({
    email: data.email,
    eventId: data.eventId,
  });
  if (oldBooking) {
    return res.status(409).send({ message: "Already joined this event." });
  }
  const result = await bookingCollection.insertOne(data);
  res.send(result);
});

//http://localhost:8000/all-events
app.get("/all-events", async (req, res) => {
  const result = await eventCollection.find().toArray();
  res.send(result);
});

//http://localhost:8000/all-events/${id}
app.get("/all-events/:id", async (req, res) => {
  const { id } = req.params;
  const result = await eventCollection.findOne({ _id: new ObjectId(id) });
  res.send(result);
});

app.get("/my-booking/check", async (req, res) => {
  const result = await bookingCollection.findOne({
    email: req.query.email,
    eventId: req.query.eventId,
  });

  res.send({ alreadyJoined: !!result });
});

//http://localhost:8000/my-booking/${email}
app.get("/my-booking/:email", async (req, res) => {
  const { email } = req.params;
  const result = await bookingCollection.find({ email: email }).toArray();
  res.send(result);
});

//http://localhost:8000/my-created-events/${email}
app.get("/my-created-events/:email", async (req, res) => {
  const { email } = req.params;
  const result = await eventCollection.find({ email: email }).toArray();
  res.send(result);
});

//http://localhost:8000
app.get("/", (req, res) => {
  res.send({ msg: "Server is running fine" });
});

app.patch("/all-events/:id", async (req, res) => {
  const { email, ...updatedData } = req.body;
  const result = await eventCollection.updateOne(
    { _id: new ObjectId(req.params.id), "organizer.email": email },
    { $set: updatedData },
  );
  res.send(result);
});
app.delete("/all-events/:id", async (req, res) => {
  const result = await eventCollection.deleteOne({
    _id: new ObjectId(req.params.id),
    "organizer.email": req.query.email,
  });
  res.send(result);
});
app.delete("/my-booking/:id", async (req, res) => {
  const result = await bookingCollection.deleteOne({
    _id: new ObjectId(req.params.id),
    email: req.query.email,
  });

  res.send(result);
});
app.listen(PORT, () => {
  console.log(`Server is running at ${PORT}`);
});
