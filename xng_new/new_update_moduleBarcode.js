const net = require("net");
const sql = require("mssql");
const express = require("express");
const router = express.Router();

const app = express();
app.use(express.json());

/* ================= MSSQL CONFIG ================= */

const targetConfig = {
  user: "admin7",
  password: "admin7",
  server: "localhost",
  database: "taco_treceability",
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  pool: {
    max: 20,
    min: 1,
    idleTimeoutMillis: 30000,
  },
};

let pool;
sql.connect(targetConfig).then(p => {
  pool = p;
  console.log("MSSQL Connected");
}).catch(err => {
  console.error("DB Connection Failed:", err);
});

/****************************************
 OLD → NEW UNIVERSAL MIS MODULE UPDATE API
*****************************************/

router.post("/cell_scanning/old_to_new_updateModuleBarcode", async (req, res) => {
  const {
    batteryPackName,
    ModuleBarcode,
    PackNumber,
    moduleNumber,
    moduleNo
  } = req.body;

  try {
    console.log({
      batteryPackName,
      ModuleBarcode,
      PackNumber,
      moduleNumber,
      moduleNo
    });

    /* 1️⃣ Update battery_details */
    const updateBatteryDetails = await pool.request()
      .input("moduleBarcode", sql.NVarChar, ModuleBarcode)
      .input("moduleNumber", sql.NVarChar, moduleNumber)
      .input("PackNumber", sql.NVarChar, PackNumber)
      .input("batteryPackName", sql.NVarChar, batteryPackName)
      .query(`
        UPDATE [taco_treceability].[taco_treceability].[battery_details]
        SET module_barcode_string = @moduleBarcode
        WHERE module_number = @moduleNumber
          AND final_qrcode LIKE '%' + @PackNumber
          AND battery_pack_name = @batteryPackName
      `);

    if (updateBatteryDetails.rowsAffected[0] === 0) {
      return res.status(400).json({ message: "battery_details update failed" });
    }

    /* 2️⃣ Update production_count (✔ module_status & cell_status added) */
    const updateProductionCount = await pool.request()
      .input("moduleBarcode", sql.NVarChar, ModuleBarcode)
      .input("moduleNo", sql.VarChar(50), String(moduleNo))
      .input("PackNumber", sql.NVarChar, PackNumber)
      .input("batteryPackName", sql.NVarChar, batteryPackName)
      .query(`
        UPDATE [taco_treceability].[taco_treceability].[production_count]
        SET
          module_barcode = @moduleBarcode,
          module_status = 'complete',
          cell_status = 'complete'
        WHERE moduleNumber = @moduleNo
          AND final_qr_code LIKE '%' + @PackNumber
          AND battery_pack_name = @batteryPackName
      `);

    if (updateProductionCount.rowsAffected[0] === 0) {
      return res.status(400).json({ message: "production_count update failed" });
    }

    /* 3️⃣ Update test_cell_table */
    const trimmedModuleNumber = moduleNumber.replace(/[^\w\s]/gi, "").trim();

    const updateTestCellTable = await pool.request()
      .input("moduleBarcode", sql.NVarChar, ModuleBarcode)
      .input("moduleGroup", sql.NVarChar, trimmedModuleNumber)
      .input("PackNumber", sql.NVarChar, PackNumber)
      .query(`
        UPDATE [taco_treceability].[taco_treceability].[test_cell_table]
        SET module_barcode = @moduleBarcode
        WHERE module_group = @moduleGroup
          AND final_qrcode LIKE '%' + @PackNumber
      `);

    if (updateTestCellTable.rowsAffected[0] === 0) {
      return res.status(400).json({ message: "test_cell_table update failed" });
    }

    /* 4️⃣ Insert station status */
    const stationStatus = await insertStationStatus(
      batteryPackName,
      PackNumber,
      ModuleBarcode
    );

    return res.status(200).json({
      message: "Old to New MIS Module replacement successful",
      stationStatus
    });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
});



/****************************************
 SEND DATA TO ARCHIVE (TCP)
*****************************************/

router.post("/cell_scanning/send_to_archive", async (req, res) => {
  const { final_qr_code, batt_status } = req.body;

  if (!final_qr_code || !batt_status) {
    return res.status(400).json({
      message: "final_qr_code and batt_status are required"
    });
  }

  const client = new net.Socket();

  try {
    client.connect(6007, "10.9.4.28", () => {
      console.log("🟢 Connected to Archive Server");

      const payload = `${final_qr_code}|${batt_status}`;
      console.log("📤 Sending:", payload);

      client.write(payload);
    });

    client.on("data", (data) => {
      console.log("📥 Response from Archive:", data.toString());
      client.destroy(); // close connection
    });

    client.on("close", () => {
      console.log("🔴 TCP Connection Closed");
    });

    client.on("error", (err) => {
      console.error("❌ TCP Error:", err.message);
      return res.status(500).json({
        message: "TCP communication failed",
        error: err.message
      });
    });

    return res.status(200).json({
      message: "Data sent to archive successfully",
      data: `${final_qr_code}|${batt_status}`
    });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error
    });
  }
});



/* ================= STATION STATUS ================= */

async function insertStationStatus(packName, finalQrcode, moduleBarcode) {
  let localPool;
  try {
    localPool = await sql.connect(targetConfig);

    const moduleQuery = await localPool.request()
      .input("moduleBarcode", sql.NVarChar, moduleBarcode)
      .input("packName", sql.NVarChar, packName)
      .query(`
        SELECT module_no
        FROM [taco_treceability].[taco_treceability].[xng_from_BatteryPackModules]
        WHERE moduleBarcode = @moduleBarcode
          AND battery_pack_name = @packName
      `);

    const moduleNumber = moduleQuery.recordset?.[0]?.module_no || null;
    const dateTimeNow = new Date().toISOString().replace("T", " ").substring(0, 19);

    await localPool.request()
      .input("packName", sql.NVarChar, packName)
      .input("finalQrcode", sql.NVarChar, finalQrcode)
      .input("moduleBarcode", sql.NVarChar, moduleBarcode)
      .input("moduleNumber", sql.Int, moduleNumber)
      .input("dateTimeNow", sql.VarChar, dateTimeNow)
      .query(`
        INSERT INTO [taco_treceability].[taco_treceability].[station_status]
        (
          PackName, FinalQRCode, ModuleBarcode,
          ModulePrintStatus, ModuleOCV_status, line,
          moduleNumber, Welding_status, IR_V_status,
          FinalQRCodePrint_status, AirLeakage_status,
          ChargingDischarging_status, PDI_status, EntryDateTime
        )
        VALUES
        (
          @packName, @finalQrcode, @moduleBarcode,
          'OK', 'OK', '4',
          @moduleNumber, 'OK', 'NOT OK',
          'NOT OK', 'NOT OK',
          'NOT OK', 'NOT OK', @dateTimeNow
        )
      `);

    return "station_status inserted successfully";

  } catch (err) {
    console.error("Station status error:", err);
    throw err;
  } finally {
    if (localPool) await localPool.close();
  }
}


module.exports = router;
