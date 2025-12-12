const sql = require("mssql");
const EventEmitter = require("events");
EventEmitter.defaultMaxListeners = 20;

// ---------------- DB CONFIG ------------------
const poolEOL = new sql.ConnectionPool({
  user: "user_mis",
  password: "admin",
  server: "10.9.4.28\\MSSQLSERVER",
  database: "taco_treceability",
  options: { encrypt: true, trustServerCertificate: true }
});

const poolPackMaster = new sql.ConnectionPool({
  user: "user_mis",
  password: "admin",
  server: "10.9.4.28\\MSSQLSERVER",
  database: "taco_treceability_master",
  options: { encrypt: true, trustServerCertificate: true }
});

const poolDuplicateChecker = new sql.ConnectionPool({
  user: "user_mis",
  password: "admin",
  server: "10.9.4.28\\MSSQLSERVER",
  database: "cell_scanning_master",
  options: { encrypt: true, trustServerCertificate: true }
});

// ⭐ NEW DB for pack_status_****** tables
const poolPackStatus = new sql.ConnectionPool({
  user: 'user_mis',
  password: 'admin',
  server: '10.9.4.28\\MSSQLSERVER',
  database: 'taco_treceability_station_status',
  options: { 
    encrypt: true, 
    trustServerCertificate: true,
    connectTimeout: 30000,
    requestTimeout: 60000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
});

// ---------------- MAIN PROCESS ------------------
async function processEOL() {
  try {
    await poolEOL.connect();
    await poolPackMaster.connect();
    await poolDuplicateChecker.connect();
    await poolPackStatus.connect();      // ⭐ NEW CONNECTION

    // 1️⃣ GET DISTINCT FinalQRCode
    const qrQuery = `
      SELECT DISTINCT FinalQRCode, PackName
      FROM taco_treceability.station_status_eol
    `;

    const qrRes = await poolEOL.request().query(qrQuery);
    console.log(`Found ${qrRes.recordset.length} QR codes`);

    for (const row of qrRes.recordset) {
      const finalQR = row.FinalQRCode;
      const packName = row.PackName;

      if (!finalQR || finalQR.length < 6) {
        console.warn(`Skipping invalid QR = ${finalQR}`);
        continue;
      }

      const packNo = finalQR.slice(-6);
      const cleanPackName = packName.replaceAll("|", " ");

      console.log(`\n🔍 Processing QR = ${finalQR} | Pack_No = ${packNo}`);

      // 2️⃣ GET Pack_ID
      const packQuery = `
        SELECT Pack_ID
        FROM taco_treceability_master.taco_treceability.master_pack
        WHERE Pack_Name = @name
      `;

      const packRes = await poolPackMaster
        .request()
        .input("name", sql.NVarChar, cleanPackName)
        .query(packQuery);

      if (packRes.recordset.length === 0) {
        console.warn(`⚠ No Pack_ID found for packName=${cleanPackName}`);
        continue;
      }

      const packID = packRes.recordset[0].Pack_ID;
      console.log(`✔ Pack_ID = ${packID}`);

      // 3️⃣ Get pack creation date
      const dupQuery = `
        SELECT TOP 1 pack_creation_Date 
        FROM Pack_duplicate_checker
        WHERE Pack_ID = @pid AND Pack_No = @pno
      `;

      const dupRes = await poolDuplicateChecker
        .request()
        .input("pid", sql.Int, packID)
        .input("pno", sql.Int, packNo)
        .query(dupQuery);

      if (dupRes.recordset.length === 0) {
        console.warn(`⚠ No pack_creation_Date found`);
        continue;
      }

      const packDate = dupRes.recordset[0].pack_creation_Date;
      const dt = new Date(packDate);

      const month = String(dt.getMonth() + 1).padStart(2, "0");
      const year = dt.getFullYear();

      // ⭐ CORRECTED: use underscore instead of hyphen
      const tableName = `pack_status_${month}-${year}`;
      const statusTable = `[dbo].[${tableName}]`;

      console.log(`✔ Updating table = ${statusTable}`);

      // 4️⃣ UPDATE STATUS
      const EOL_VALUE =
        "OK:NA:2";

      const updateSql = `
        UPDATE ${statusTable}
        SET EOL = @eol
        WHERE pack_id = @pid AND pack_no = @pno
      `;

      const updateRes = await poolPackStatus
        .request()
        .input("eol", sql.NVarChar(sql.MAX), EOL_VALUE)
        .input("pid", sql.Int, packID)
        .input("pno", sql.Int, packNo)
        .query(updateSql);

      console.log(`✅ EOL Updated (Rows affected: ${updateRes.rowsAffected})`);

      // 5️⃣ DELETE processed rows
      const delSql = `
        DELETE FROM taco_treceability.station_status_eol
        WHERE FinalQRCode = @qr
      `;

      await poolEOL.request().input("qr", sql.NVarChar, finalQR).query(delSql);

      console.log(`🗑 Deleted rows for QR = ${finalQR}`);
    }
  } catch (err) {
    console.error("❌ ERROR:", err);
  }
}

// Run every 3 seconds
setInterval(processEOL, 3000);
processEOL();
