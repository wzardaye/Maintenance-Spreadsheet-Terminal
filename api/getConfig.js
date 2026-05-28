const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('Please add your Mongo URI to .env.local');

// Buat Schema fleksibel agar Mongoose otomatis menangani koneksi collection-nya
const ConfigSchema = new mongoose.Schema({}, { strict: false, versionKey: false });
const ConfigModel = mongoose.models.Config || mongoose.model('Config', ConfigSchema, 'portal_config');

module.exports = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(uri, { dbName: 'portal_db', serverSelectionTimeoutMS: 5000 });
    }

    const configData = await ConfigModel.findOne({}).lean(); 
    
    if (!configData) {
      return res.status(404).json({ error: 'Config tidak ditemukan di database' });
    }

    delete configData._id;
    res.status(200).json(configData);
  } catch (error) {
    console.error("DB Get Error:", error);
    res.status(500).json({ error: 'Gagal terhubung ke database' });
  }
};
