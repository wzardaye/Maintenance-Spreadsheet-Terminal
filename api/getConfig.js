const { MongoClient } = require('mongodb');

// Mengambil URL koneksi dari Environment Variables di Vercel
const uri = process.env.MONGODB_URI; 
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

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
  try {
    const databaseClient = await clientPromise;
    
    // Ganti 'portal_db' dan 'portal_config' sesuai nama di MongoDB Atlas kamu
    const db = databaseClient.db('portal_db'); 
    const collection = db.collection('portal_config');
    
    // Mengambil 1 dokumen konfigurasi pertama
    const configData = await collection.findOne({}); 
    
    if (!configData) {
      return res.status(404).json({ error: 'Config tidak ditemukan di database' });
    }

    // Hapus _id dari MongoDB agar tidak bentrok dengan front-end
    delete configData._id;

    res.status(200).json(configData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal terhubung ke database' });
  }
};
