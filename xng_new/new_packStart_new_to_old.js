const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

// ===== OPTIONAL DB (comment if not testing DB) =====
const sql = require("mssql");

const sqlConfig = {
  user: "localhost",
  password: "admin7",
  database: "taco_treceability",
  server: "admin7",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};
// ==================================================

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // allow all for trial
  },
});

app.get("/", (req, res) => {
  res.send("✅ Socket.IO QR Server Running");
});

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on(
    "generateQR",
    async (
      packname,
      selectedBatches,
      shift_incharge,
      shift_supervisor,
      range_from,
      range_to,
      PacklineNumber,
line_id
    ) => {
      try {
        console.log("📥 generateQR received:");
        console.log({
          packname,
          selectedBatches,
          shift_incharge,
          shift_supervisor,
          range_from,
          range_to,
          PacklineNumber,
line_id
        });

        // =============================
        // 🔢 QR / Battery ID Generation
        // =============================
        let ProductCode = "000000";
        let serialNumber = "0000000000";
        let battery_id = "";

        const dateObj = new Date();
        let dd = String(dateObj.getDate()).padStart(2, "0");
        let mm = String(dateObj.getMonth() + 1).padStart(2, "0");
        let yyyy = dateObj.getFullYear();

        battery_id += `${dd}${mm}${yyyy}`;

        // Product code mapping
        const productMap = {
          "Kanger 1 AIO": "DJ1828",
          "Kanger 1 Gen 3": "DJ1828",
          "Kanger 2": "DJ2018",
          Limber: "DJ1921",
          "Challnger LR": "DJ1911",
          "Challnger MR": "DJ1912",
          "NOVA MROPS": "DJ2020",
          "NOVA LROPS": "DJ2021",
          Tamor: "DJ2028",
          "NOVA Prismatic LR": "DJ2025",
          "CORAL SR": "DJ2022",
        };

        ProductCode = productMap[packname] || "000000";
        battery_id += ProductCode;

        // =============================
        // 🧪 DB FETCH LAST SERIAL (OPTIONAL)
        // =============================
        try {
          await sql.connect(sqlConfig);

          const query = `
            SELECT TOP 1 battery_id 
            FROM taco_treceability.final_qrcode_details
            ORDER BY sr_no DESC
          `;

          const result = await sql.query(query);

          if (result.recordset.length > 0) {
            const lastBatteryId = result.recordset[0].battery_id;
            const lastSerial = lastBatteryId.substring(14);
            serialNumber = String(parseInt(lastSerial) + 1).padStart(10, "0");
          } else {
            serialNumber = "0000000001";
          }
        } catch (dbErr) {
          console.warn("⚠️ DB skipped (trial mode):", dbErr.message);
          serialNumber = "0000000001";
        }

        battery_id += serialNumber;

        console.log("✅ Generated Battery ID:", battery_id);

        // =============================
        // 📦 packRegister (MOCK)
        // =============================
        await packRegister(
          packname,
          battery_id,
          selectedBatches,
          shift_incharge,
          shift_supervisor,
          range_from,
          range_to,
          PacklineNumber
        );

        // =============================
        // 📤 Send response to client
        // =============================
        // ✅ YOUR LINE
socket.emit("qrGenerated");

        console.log("📤 qrGenerated emitted");
      } catch (err) {
        console.error("❌ generateQR error:", err);
        socket.emit("qrGenerated", {
          status: "error",
          message: err.message,
        });
      }
    }
  );

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// =============================
// 🧪 MOCK packRegister FUNCTION
// =============================
function packRegister(
  packname,
  battery_id,
  selectedBatches,
  shift_incharge,
  shift_supervisor,
  range_from,
  range_to,
  PacklineNumber
) {
  return new Promise((resolve) => {
    console.log("📦 packRegister called with:");
    console.log({
      packname,
      battery_id,
      selectedBatches,
      shift_incharge,
      shift_supervisor,
      range_from,
      range_to,
      PacklineNumber,
    });

    setTimeout(() => {
      resolve("PACK REGISTERED SUCCESSFULLY");
    }, 1000);
  });
}

// =============================
// 🚀 START SERVER
// =============================
const PORT = 6998;
server.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
});
