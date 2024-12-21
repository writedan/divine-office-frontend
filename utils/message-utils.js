let messageQueue = [];

const logMessage = (stream, ...args) => {
  const formatLog = (args) => {
    return args.map(arg => {
      if (arg instanceof Error) {
        return `Error: ${arg.message}\nStack Trace: ${arg.stack}`;
      } else if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return arg;
        }
      } else {
        return arg;
      }
    });
  };

  if (global.mainEmitter) {
    messageQueue.forEach(([stream, ...args]) => {
      const formattedMessage = formatLog(args);
      global.mainEmitter.emit('log-message', stream, ...formattedMessage);
    });

    messageQueue = []; 

    const formattedMessage = formatLog(args);
    global.mainEmitter.emit('log-message', stream, ...formattedMessage);
  } else {
    messageQueue.push([stream, ...args]);
  }
};
;

module.exports = { logMessage };
