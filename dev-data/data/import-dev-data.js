const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const Tour = require('./../../models/tourModel');

dotenv.config({
  path: './config.env',
});

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

//CONNECTING TO LOCAL DATABASE
// mongoose
//   .connect(process.env.DATABASE_LOCAL, {
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     useFindAndModify: false,
//   })
//   .then(() => console.log('DB Connection was successful'));

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB Connection was successful'));

//READ JSON FIlE
const tours = fs.readFileSync(
  `${__dirname}/../data/tours-simple.json`,
  'utf-8'
);

//IMPORT DATA INTO DATABASE

const importData = async () => {
  try {
    await Tour.create(JSON.parse(tours));
    console.log('data loaded successfully');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

//DELETE ALL DATA FROM COLLECTION
const deleteAll = async () => {
  try {
    await Tour.deleteMany({});
    console.log('deleted all tours ');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteAll();
}

console.log(process.argv);
