const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(
      // 'mongodb://localhost:27017/sample_mflix',
      'mongodb+srv://root:root@cluster0.lo4bk.mongodb.net/sample_mflix?retryWrites=true&w=majority',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log('MongoDB connected');
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

module.exports = connectDB;
