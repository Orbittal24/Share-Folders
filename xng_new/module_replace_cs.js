const net = require('net');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const morgan = require('morgan');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware for logging requests
app.use(morgan('tiny'));

// Serve dashboard (same as before)
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'module_index.html'));
});

// Function to emit logs to the client-side
const emitLog = (logMessage) => {
    console.log(logMessage);
    io.emit('log', logMessage);
};

// ---------------------------------------------------
// STATIC MOCK DATA (replaces OPC UA reads)
// ---------------------------------------------------
const getStaticData = () => {
    return {
        ModuleName: "Tamor",
        ModuleBarcode: "01TMB01T100024F9J0200034   ",
        PacklineNumber: "0087",
        ModuleStartStop: "1", // 1 = start
        ModuleNumber: "A1 (-)",
        PreviousStatus: "NA",
        PackNumber: "000090",
        lineNo: "4"
    };
};

// ---------------------------------------------------
// TCP Communication (same logic as your code)
// ---------------------------------------------------
const sendDataViaTcp = (data) => {
    const client = new net.Socket();
    const serverIp = 'localhost';
    const serverPort = 9562;

    client.connect(serverPort, serverIp, () => {
        console.log('Connected to TCP server');
        client.write(JSON.stringify(data));
        emitLog(`Sent to TCP server: ${JSON.stringify(data)}`);
    });

    client.on('data', (data) => {
        const dataR = data.toString('utf8');
        console.log('Received:', dataR);
        emitLog(`Received from TCP: ${dataR}`);

        if (dataR === 'ok') {
            emitLog('Current Module Completed');
        } else if (dataR === 'nok') {
            emitLog('Module Barcode Already Registered');
        } else if (dataR === 'mis_issue') {
            emitLog('xng_issue_cell_duplication...');
        } else if (dataR === 'xng_issue') {
            emitLog('xng_issue...cell mismatch');
        } else {
            emitLog(`Unexpected data from TCP: ${dataR}`);
        }

        client.destroy();
    });

    client.on('close', () => {
        console.log('Connection closed');
        emitLog('TCP connection closed');
    });

    client.on('error', (error) => {
        console.error('Connection error:', error);
        emitLog(`TCP connection error: ${error.message}`);
    });
};

// ---------------------------------------------------
// Main loop (sends static data every 2 seconds)
// ---------------------------------------------------
let prevModuleBarcode = null;

const main = async () => {
    try {
        const data = getStaticData();

        console.log('Fetched static data:', data);
        emitLog(`Fetched static data: ${JSON.stringify(data)}`);

        if (parseInt(data.ModuleStartStop) === 1 && data.ModuleBarcode) {
            if (data.ModuleBarcode !== prevModuleBarcode) {
                sendDataViaTcp(data);
                prevModuleBarcode = data.ModuleBarcode;
            } else {
                emitLog('Duplicate ModuleBarcode detected, skipping sendDataViaTcp.');
            }
        } else {
            emitLog('ModuleStartStop is not active or barcode missing.');
        }
    } catch (error) {
        console.error('Error:', error);
        emitLog(`Error: ${error.message}`);
    }
};

// Run every 2 seconds
setInterval(main, 2000);

// Start the Express server
server.listen(9595, () => {
    console.log('Server running at http://localhost:9595');
});
