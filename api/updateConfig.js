const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri); // Tidak pakai options
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri); // Tidak pakai options
  clientPromise = client.connect();
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const databaseClient = await clientPromise;
    const db = databaseClient.db('portal_db');
    const collection = db.collection('portal_config');
    
    let newData = req.body;
    
    // Fallback jika Vercel menerima body sebagai string
    if (typeof newData === 'string') {
        newData = JSON.parse(newData);
    }

    // Pastikan tidak ada _id yang terkirim agar tidak memicu immutable error
    delete newData._id;

    // Menggunakan updateOne + $set lebih kebal error daripada replaceOne
    await collection.updateOne(
        {}, 
        { $set: newData }, 
        { upsert: true }
    );

    res.status(200).json({ success: true, message: 'Konfigurasi berhasil disimpan' });
  } catch (error) {
    console.error("DB Update Error:", error);
    // Mengembalikan pesan error spesifik agar mudah di-debug
    res.status(500).json({ error: 'Gagal menyimpan ke database: ' + error.message });
  }
};
