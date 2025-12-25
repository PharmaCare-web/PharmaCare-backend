const net = require('net');

const socket = net.createConnection(587, 'smtp-relay.brevo.com');

socket.on('connect', () => {
  console.log('✅ SMTP reachable!');
  socket.end();
});

socket.on('error', (err) => {
  console.error('❌ SMTP not reachable:', err);
});
