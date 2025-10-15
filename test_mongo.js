const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://msharma_db:Tit13_system@cluster0.ddd6yk5.mongodb.net/test?retryWrites=true&w=majority')
  .then(() => {
    console.log('Connected successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection failed:', err);
    process.exit(1);})