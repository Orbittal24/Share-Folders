// 📦 Dependencies
const sql = require("mssql");
const dayjs = require("dayjs");

// 🔠 Year, Month, Day Mappings
const yearMap = {
  B: 21, C: 22, D: 23, E: 24, F: 25, G: 26, H: 27, J: 28, K: 29, L: 30,
  M: 31, N: 32, P: 33, R: 34, S: 35, T: 36, V: 37, W: 38, X: 39, Y: 40,
  1: 41, 2: 42, 3: 43, 4: 44, 5: 45, 6: 46, 7: 47, 8: 48, 9: 49, A: 50
};

const monthMap = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, A: 10, B: 11, C: 12 };

const dayMap = {
  1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9,
  A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17,
  J: 18, K: 19, L: 20, M: 21, N: 22, P: 23, R: 24, S: 25,
  T: 26, V: 27, W: 28, X: 29, Y: 30, 0: 31
};

// 🔧 SQL Configurations
const configs = {
  pool1: {
    user: "user_mis",
    password: "admin",
    server: "10.9.4.28\\MSSQLSERVER",
    database: "taco_treceability",
    options: { encrypt: true, trustServerCertificate: true },
  },
  pool2: {
    user: "user_mis",
    password: "admin",
    server: "10.9.4.28\\MSSQLSERVER",
    database: "taco_treceability_master",
    options: { encrypt: true, trustServerCertificate: true },
  },
  pool4: {
    user: "user_mis",
    password: "admin",
    server: "10.9.4.28\\MSSQLSERVER",
    database: "taco_treceability_master_module_register",
    options: { encrypt: true, trustServerCertificate: true },
  },
  pool5: {
    user: "user_mis",
    password: "admin",
    server: "10.9.4.28\\MSSQLSERVER",
    database: "taco_treceability_master_pack_register",
    options: { encrypt: true, trustServerCertificate: true },
  },
  pool6: {
    user: "user_mis",
    password: "admin",
    server: "10.9.4.28\\MSSQLSERVER",
    database: "taco_treceability_master_pdu_register",
    options: { encrypt: true, trustServerCertificate: true },
  },
};

// 🗺️ Line Mapping
const lineMap = {
  line1: 1, line2: 2, line3: 3, line4: 4, line5: 5, line6: 6, line7: 7,
  line8: 8, line9: 9, lineA: 10, lineB: 11, lineC: 12, lineD: 13, lineE: 14, lineF: 15
};

// 🔌 Utility: Create independent pool
async function getPool(config) {
  const pool = new sql.ConnectionPool(config);
  await pool.connect();
  return pool;
}

// 🧠 Decode barcode date
function decodeDateFromBarcode(barcode) {
  try {
    const [yearChar, monthChar, dayChar] = barcode.substring(14, 17);
    return {
      year: yearMap[yearChar],
      month: monthMap[monthChar],
      day: dayMap[dayChar],
    };
  } catch {
    return { year: null, month: null, day: null };
  }
}

// 📅 Format date strings
function calculateDateFormats(year, month, day) {
  try {
    const d = dayjs(`${2000 + year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    return {
      packDate: d.format("YYYY-MM-DD"),
      DDMMYY: d.format("DD_MM_YY"),
      MMYY: d.format("MM_YY"),
    };
  } catch {
    return { packDate: null };
  }
}

// 🧱 Generate table names dynamically
function generateTableNames(dateFormats) {
  return {
    moduleTable: `module_register_${dateFormats.DDMMYY}`,
    packTable: `pack_register_${dateFormats.MMYY}`,
  };
}

// 🔍 Fetch Pack_ID + Module_ID and insert record into module_register
async function processPackAndModuleData(row, dateFormats, tableNames, last6Digits) {
  let packID = null;
  let moduleID = null;

  try {
    const pool2 = await getPool(configs.pool2);
 const cleanPackName = row.battery_pack_name.replaceAll('|', ' ');
    const packRes = await pool2.request()
      .input('pack_name', sql.NVarChar, `PDU ${cleanPackName}`)
      //.input("pack_name", sql.NVarChar, `PDU ${row.battery_pack_name}`)
      .query(`
        SELECT Pack_ID FROM [taco_treceability_master].[taco_treceability].[master_pack]
        WHERE Pack_Name = @pack_name
      `);

    if (!packRes.recordset.length) {
      console.warn(`⚠️ No Pack_ID for ${row.battery_pack_name}`);
      await pool2.close();
      return { packID, moduleID };
    }

    packID = String(packRes.recordset[0].Pack_ID).trim();

    const modRes = await pool2.request()
      .input("packID", sql.Int, packID)
      .query(`
        SELECT TOP 1 Module_ID FROM [taco_treceability_master].[taco_treceability].[master_module]
        WHERE Pack_ID = @packID
      `);

    if (!modRes.recordset.length) {
      console.warn(`⚠️ No Module_ID for Pack_ID ${packID}`);
      await pool2.close();
      return { packID, moduleID };
    }

    moduleID = String(modRes.recordset[0].Module_ID).trim();

    const pool4 = await getPool(configs.pool4);
    await pool4.request()
      .input("packID", sql.NVarChar, packID)
      .input("moduleID", sql.Int, moduleID)
      .input("module_barcode", sql.NVarChar, row.module_barcode)
      .input("lineID", sql.Int, lineMap[row.line] || 1)
      .input("packDate", sql.Date, dateFormats.packDate)
      .input("last6Digits", sql.NVarChar, last6Digits)
      .query(`
        INSERT INTO [taco_treceability].[${tableNames.moduleTable}]
        (Pack_ID, Module_ID, Module_QR, Line_ID, Pack_creation_Date, Pack_No)
        VALUES (@packID, @moduleID, @module_barcode, @lineID, @packDate, @last6Digits)
      `);

    await pool4.close();
    await pool2.close();

    return { packID, moduleID };
  } catch (err) {
    console.error("❌ Error in processPackAndModuleData:", err);
    return { packID: null, moduleID: null };
  }
}

// 🚀 Main Process
async function processPDUDetails() {
  let pool1, pool4, pool5, pool6, pool2;

  try {
    pool1 = await getPool(configs.pool1);
    pool4 = await getPool(configs.pool4);
    pool5 = await getPool(configs.pool5);
    pool6 = await getPool(configs.pool6);
    pool2 = await getPool(configs.pool2);

    console.log("✅ Connected to DBs");

    const { recordset } = await pool1.request().query(`
      SELECT TOP(1) *
      FROM taco_treceability.taco_treceability.pdu_qrcode_details_mirror
      WHERE final_qrcode IS NOT NULL AND final_qrcode <> ''
      ORDER BY sr_no DESC
    `);

    if (!recordset.length) {
      console.log("⚠️ No new records");
      return;
    }

   for (const row of recordset) {
  const { module_barcode, battery_pack_name: originalPackName, final_qrcode, line } = row;
  const { year, month, day } = decodeDateFromBarcode(module_barcode);
  if (!year || !month || !day) continue;

  const dateFormats = calculateDateFormats(year, month, day);
  const tableNames = generateTableNames(dateFormats);
  const last6Digits = module_barcode.slice(-6);

  // Ensure Module + Pack tables
  await pool4.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='${tableNames.moduleTable}' AND xtype='U')
    CREATE TABLE taco_treceability.${tableNames.moduleTable} (
      srno INT IDENTITY(1,1) PRIMARY KEY,
      Pack_ID NVARCHAR(100),
      Module_ID NVARCHAR(100),
      Module_QR NVARCHAR(100),
      Line_ID NVARCHAR(100),
      Pack_creation_Date DATE,
      Pack_No NVARCHAR(100),
      Cur_Date DATETIME DEFAULT GETDATE()
    );
  `);

  await pool5.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='${tableNames.packTable}' AND xtype='U')
    CREATE TABLE taco_treceability.${tableNames.packTable} (
      srno INT IDENTITY(1,1) PRIMARY KEY,
      Line_ID NVARCHAR(100),
      Pack_ID NVARCHAR(100),
      Pack_No NVARCHAR(100),
      modules_creation_date NVARCHAR(MAX),
      Pack_creation_Date DATE,
      assign_stations_ids NVARCHAR(MAX),
      Interlock_on_stationIDs NVARCHAR(MAX)
    );
  `);

  // Fetch Pack_ID + Module_ID
  const { packID, moduleID } = await processPackAndModuleData(row, dateFormats, tableNames, last6Digits);

  if (packID && moduleID) {
    await pool5.request()
      .input("Line_ID", sql.Int, lineMap[row.line] || 1)
      .input("Pack_ID", sql.Int, packID)
      .input("Pack_No", sql.NVarChar, last6Digits)
      .input("modules_creation_date", sql.NVarChar, dateFormats.packDate)
      .input("Pack_creation_Date", sql.Date, dateFormats.packDate)
      .query(`
        INSERT INTO taco_treceability.${tableNames.packTable}
        (Line_ID, Pack_ID, Pack_No, modules_creation_date, Pack_creation_Date,assign_stations_ids, Interlock_on_stationIDs)
        VALUES (@Line_ID, @Pack_ID, @Pack_No, @modules_creation_date, @Pack_creation_Date,
        '3,7,8,9,10,11,12,13,14,15,16,17,18,19,3015,3016,3011,3012,3013,3014,20,21,22,3007,3008,3009,3010',
        '1,20,21,22,3009,3010,3008,3011,3012,3013,3014,7,8,9,10,11,12,13,14,3015,3016,4,15,16,18,19,3,30,3021,3022,3023,3024,3026,28,33,39,32,2,29,5,35,40,41,3025')
      `);
  }

  // 🆕 PDU Register logic
  const { recordset: nomenData } = await pool2.request()
    .input('packName', sql.VarChar, `PDU ${originalPackName}`)
    .query(`
      SELECT TOP 1 mm_position, yy_position, pack_id
      FROM taco_treceability_master.taco_treceability.Nomenclature_Master
      WHERE category = 'PDU' AND pack_name = @packName;
    `);

  if (!nomenData.length) {
    console.log(`⚠️ No nomenclature found for ${originalPackName}`);
    continue;
  }

  const { mm_position, yy_position, pack_id } = nomenData[0];
  const extractPart = (qrcode, positions) => {
    try {
      const [start, end] = positions.split(',').map((p) => parseInt(p.trim(), 10));
      return qrcode.substring(start, end + 1);
    } catch {
      return '';
    }
  };

  const mm = extractPart(final_qrcode, mm_position);
  const yy = extractPart(final_qrcode, yy_position);
  if (!mm || !yy) continue;

  const pduTable = `pdu_register_${mm}_${yy}`;
  const battery_pack_name = `PDU ${originalPackName}`; // ✅ Added PDU prefix here

  const createPDU = `
    USE taco_treceability_master_pdu_register;
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='${pduTable}' AND xtype='U')
    BEGIN
      CREATE TABLE dbo.${pduTable} (
        sr_no INT IDENTITY(1,1) PRIMARY KEY,
        battery_pack_name VARCHAR(255),
        scan_by VARCHAR(255),
        final_qrcode VARCHAR(500),
        shift_supervisor VARCHAR(255),
        quality_check_by VARCHAR(255),
        shift VARCHAR(50),
        line VARCHAR(50),
        module_barcode VARCHAR(500),
        bdu_no VARCHAR(100),
        bms_no VARCHAR(100),
        hardware_version VARCHAR(100),
        software_version VARCHAR(100),
        Pack_ID INT,
        Pack_creation_Date DATETIME DEFAULT GETDATE()
      );
    END`;
  await pool6.request().query(createPDU);

  const { recordset: dupCheck } = await pool6.request()
    .input('final_qrcode', sql.VarChar, final_qrcode)
    .query(`SELECT COUNT(*) AS count FROM ${pduTable} WHERE final_qrcode=@final_qrcode`);

  if (dupCheck[0].count === 0) {
    await pool6.request()
      .input('battery_pack_name', sql.VarChar, battery_pack_name)
      .input('scan_by', sql.VarChar, row.scan_by || '')
      .input('final_qrcode', sql.VarChar, final_qrcode)
      .input('shift_supervisor', sql.VarChar, row.shift_supervisor || '')
      .input('quality_check_by', sql.VarChar, row.quality_check_by || '')
      .input('shift', sql.VarChar, row.shift || '')
      .input('line', sql.VarChar, row.line || '')
      .input('module_barcode', sql.VarChar, row.module_barcode || '')
      .input('bdu_no', sql.VarChar, row.bdu_no || '')
      .input('bms_no', sql.VarChar, row.bms_no || '')
      .input('hardware_version', sql.VarChar, row.hardware_version || '')
      .input('software_version', sql.VarChar, row.software_version || '')
      .input('Pack_ID', sql.Int, pack_id || 0)
      .query(`
        INSERT INTO dbo.${pduTable}
        (battery_pack_name, scan_by, final_qrcode, shift_supervisor, quality_check_by,
         shift, line, module_barcode, bdu_no, bms_no, hardware_version, software_version, Pack_ID)
        VALUES (@battery_pack_name, @scan_by, @final_qrcode, @shift_supervisor, @quality_check_by,
         @shift, @line, @module_barcode, @bdu_no, @bms_no, @hardware_version, @software_version, @pack_id)
      `);
    console.log(`✅ Inserted ${final_qrcode} → ${pduTable} with ${battery_pack_name}`);
  }

  await pool1.request()
    .input("final_qrcode", sql.VarChar, final_qrcode)
    .query(`DELETE FROM taco_treceability.taco_treceability.pdu_qrcode_details_mirror WHERE final_qrcode=@final_qrcode`);
  console.log(`🗑 Deleted ${final_qrcode} from mirror`);
}

  } catch (err) {
    console.error("❌ Error in processPDUDetails:", err);
  } finally {
    if (pool1) await pool1.close();
    if (pool4) await pool4.close();
    if (pool5) await pool5.close();
    if (pool6) await pool6.close();
    if (pool2) await pool2.close();
    console.log("🔒 Connections closed");
  }
}

// 🔁 Scheduler
console.log("⏳ Starting PDU Monitor...");
processPDUDetails();
setInterval(processPDUDetails, 10000);

