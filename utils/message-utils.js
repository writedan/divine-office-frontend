let messageQueue = [];

const logMessage = (stream, ...args) => {
  if (global.mainEmitter) {
    messageQueue.forEach(([stream, ...args]) => {
      global.mainEmitter.emit('log-message', stream, ...args);
    });
    messageQueue = []; 
    global.mainEmitter.emit('log-message', stream, ...args);
  } else {
    messageQueue.push([stream, ...args]);
  }
};

module.exports = { logMessage };
