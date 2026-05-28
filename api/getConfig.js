const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local');
}

module.exports = async (req, res) => {
  try {
    // Mencegah koneksi berulang di lingkungan serverless (Vercel)
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(uri, {
        dbName: 'portal_db',
        serverSelectionTimeoutMS: 5000,
      });
    }

    const db = mongoose.connection.db;
    const collection = db.collection('portal_config');
    
    const configData = await collection.findOne({}); 
    
    if (!configData) {
      return res.status(404).json({ error: 'Config tidak ditemukan di database' });
    }

    // Hapus _id bawaan MongoDB agar tidak masuk ke frontend
    delete configData._id;
    res.status(200).json(configData);
  } catch (error) {
    console.error("DB Get Error:", error);
    res.status(500).json({ error: 'Gagal terhubung ke database' });
  }
};
