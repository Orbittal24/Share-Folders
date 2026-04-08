const WebSocket = require('ws');
const fs = require("fs");
const XLSX = require('xlsx');
const https = require('https');
const selfsigned = require('selfsigned');

// 🔐 Generate self-signed certificate
const attrs = [{ name: 'commonName', value: '192.168.1.11' }];
const pems = selfsigned.generate(attrs, { days: 365 });


const server = https.createServer({
    key: fs.readFileSync('./192.168.1.11-key.pem'),
    cert: fs.readFileSync('./192.168.1.11.pem'),
});


// 🔥 WebSocket Secure Server
const wss = new WebSocket.Server({ server });

server.listen(1230, () => {
    console.log("🚀 WSS running on wss://192.168.1.11:1230");
});

wss.on('connection', (ws) => {
    console.log("✅ Client connected");

    ws.on('message', (message) => {
        console.log("📥 Received:", message.toString());

        let obj;
        try {
            obj = JSON.parse(message);
        } catch {
            console.log("❌ Invalid JSON");
            return;
        }

        const module_barcode = obj.module_barcode;
        const subfolder = obj.folder;

        const today = new Date().toISOString().split('T')[0];
        const [year, month, day] = today.split("-");

        const folderPath = `C:/Reports/${year}/${month}/${day}/${subfolder}/`;

        console.log("📂 Checking:", folderPath);

        if (!fs.existsSync(folderPath)) {
            console.log("🚫 Folder not found");
            return;
        }

        const files = fs.readdirSync(folderPath);
        const matched = files.filter(f => f.includes(module_barcode));

        if (matched.length === 0) {
            console.log("🚫 No file found");
            return;
        }

        const lastFile = matched[matched.length - 1];
        const fullPath = `${folderPath}/${lastFile}`;

        try {
            const workbook = XLSX.readFile(fullPath);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];

            const sheetdata = XLSX.utils.sheet_to_json(worksheet, {
                header: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
                defval: ''
            });


            console.log("📊 FULL SHEET DATA:", sheetdata);

            const findValue = (label) => {
                const row = sheetdata.find(r =>
                    Object.values(r).some(v => String(v).toLowerCase().includes(label.toLowerCase()))
                );
                return row ? Object.values(row)[1] : "";
            };

            const headerRow = sheetdata[0];
            const valueRow = sheetdata[1];

            // 🔥 Main data
            const result = {
                module_number: valueRow.A,
                test_datetime: valueRow.B,
                min_voltage: valueRow.C,
                max_voltage: valueRow.D,
                diff_voltage: valueRow.E,
                measurements: []
            };
            const startIndex = sheetdata.findIndex(row => row.A === "Actual No");

            for (let i = startIndex + 1; i < sheetdata.length; i++) {
                const row = sheetdata[i];

                if (!row.A) continue;

                result.measurements.push({
                    actual_no: row.A,
                    point1: row.B,
                    point2: row.C,
                    voltage: row.D,
                    ir: row.E
                });
            }
            console.log("📤 Sending data", JSON.stringify(result));
            ws.send(JSON.stringify(result));

        } catch (err) {
            console.error("❌ Excel error:", err.message);
        }
    });

    ws.on('close', () => {
        console.log("❌ Client disconnected");
    });
});
