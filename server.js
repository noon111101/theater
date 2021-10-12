const { urlencoded } = require('express');
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const process = require('process');

const connectDB = require('./config/db');
const theater = require('./routers/theater');

const app = express();

app.use(compression());
app.use(cors({ origin: true }));
app.use(express.json());
app.use(urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));

connectDB();

app.use('/api/theater', theater);

app.get('/', (req, res) => {
  res.redirect('/');
});

if (process.pid) {
  console.log('This process is your pid ' + process.pid);
}

app.listen(process.env.PORT || 8005, () => {
  console.log('http://localhost:' + `${process.env.PORT || 8005}`);
});
