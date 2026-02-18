const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../../models/User');

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const filter = {
    'location.area': { $exists: true, $ne: '' },
    $or: [
      { 'location.state': { $exists: false } },
      { 'location.state': '' },
      { 'location.state': null }
    ]
  };

  const result = await User.updateMany(
    filter,
    [{ $set: { 'location.state': '$location.area' } }]
  );

  const modified = result.modifiedCount ?? result.nModified ?? 0;
  console.log(`Backfilled state for ${modified} users.`);

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error('Migration failed:', error.message || error);
  process.exitCode = 1;
});
