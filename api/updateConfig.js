const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    
    let newData = req.body;
    
    // Fallback jika Vercel menerima body sebagai string
    if (typeof newData === 'string') {
        newData = JSON.parse(newData);
    }

    // Hapus _id agar tidak memicu error immutable field saat update
    delete newData._id;

    await collection.updateOne(
        {}, 
        { $set: newData }, 
        { upsert: true }
    );

    res.status(200).json({ success: true, message: 'Konfigurasi berhasil disimpan' });
  } catch (error) {
    console.error("DB Update Error:", error);
    res.status(500).json({ error: 'Gagal menyimpan ke database: ' + error.message });
  }
};
