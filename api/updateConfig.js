const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const options = { useUnifiedTopology: true, useNewUrlParser: true };

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

module.exports = async (req, res) => {
  // Hanya menerima metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const databaseClient = await clientPromise;
    const db = databaseClient.db('portal_db');
    const collection = db.collection('portal_config');
    
    const newData = req.body;
    
    // Pastikan tidak ada _id dari frontend yang ikut masuk
    delete newData._id;

    // Ganti (replace) seluruh isi dokumen yang pertama kali ditemukan
    // Jika belum ada dokumen sama sekali (upsert: true), maka buat baru
    await collection.replaceOne({}, newData, { upsert: true });

    res.status(200).json({ success: true, message: 'Konfigurasi berhasil disimpan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menyimpan ke database' });
  }
};
