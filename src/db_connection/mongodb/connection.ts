import mongoose from 'mongoose';

export default function connection(config: any) {
  function connectToMongo() {
    mongoose
      .connect(config.mongo.uri)
      .then(
        () => {},
        (err: any) => {
          console.info('Mongodb error', err);
        },
      )
      .catch((err: any) => {
        console.log('ERROR:', err);
      });
  }

  mongoose.connection.on('connected', () => {
    console.log('Mongoose autoIndex:', mongoose.get('autoIndex'));
    console.info('Connected to MongoDB!');
  });

  mongoose.connection.on('reconnected', () => {
    console.info('MongoDB reconnected!');
  });

  mongoose.connection.on('error', (error: any) => {
    console.error(`Error in MongoDb connection: ${error}`);
    mongoose.disconnect();
  });

  mongoose.connection.on('disconnected', () => {
    console.error(`MongoDB disconnected! Reconnecting in ${5}s...`);
    setTimeout(() => connectToMongo(), 5000);
  });

  return {
    connectToMongo,
  };
}
