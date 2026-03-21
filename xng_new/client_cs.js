const net = require('net');

// TCP server details
const SERVER_IP = 'localhost';
const SERVER_PORT = 8746;

// Static data to send
const dataToSend = {
  ModuleName: "Tamor",
  PacklineNumber: "000087",
  StartStop: "1",
  Status: "0"
};

// Function to send data via TCP
const sendDataViaTcp = (data) => {
  const client = new net.Socket();

  client.connect(SERVER_PORT, SERVER_IP, () => {
    console.log(`✅ Connected to TCP server at ${SERVER_IP}:${SERVER_PORT}`);
    console.log("📤 Sending data:", data);
    client.write(JSON.stringify(data));
  });

  client.on('data', (response) => {
    const message = response.toString('utf8');
    console.log('📩 Received from server:', message);

    if (message === 'ok') {
      console.log("🟢 Server says: Pack is NOT available in MIS");
    } else if (message === 'nok') {
      console.log("🔴 Server says: Pack IS available in MIS");
    } else {
      console.log("⚠️ Unexpected response:", message);
    }

    client.destroy(); // close connection
  });

  client.on('close', () => {
    console.log('🔒 Connection closed');
  });

  client.on('error', (error) => {
    console.error('❌ Connection error:', error.message);
  });
};

// Send data every 5 seconds
// setInterval(() => {
//   sendDataViaTcp(dataToSend);
// }, 5000);
sendDataViaTcp(dataToSend);
console.log('🚀 Static TCP client started. Sending data every 5 seconds...');
