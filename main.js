const path = require('path');

const isElectron = process.env.ELECTRON_RUN === 'true';

if (isElectron) {
  console.log('Running bundled electron app');
  eval('require')('./app.js');
} else {
  console.log('Packing or running electron app');
  require('expo-router/entry');
}