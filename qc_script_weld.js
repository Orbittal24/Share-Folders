const sql = require('mssql');
const EventEmitter = require('events');
EventEmitter.defaultMaxListeners = 20;

const configSource = {
  user: 'user_mis',
  password: 'admin',
  server: '10.9.4.28\\MSSQLSERVER',
  database: 'taco_treceability',
  options: { encrypt: true, trustServerCertificate: true }
};

const configMaster = {
  user: 'user_mis',
  password: 'admin',
  server: '10.9.4.28\\MSSQLSERVER',
  database: 'taco_treceability_master_module_register',
  options: { encrypt: true, trustServerCertificate: true }
};

const configTarget = {
  user: 'user_mis',
  password: 'admin',
  server: '10.9.4.28\\MSSQLSERVER',
  database: 'taco_treceability_station_status',
  options: { encrypt: true, trustServerCertificate: true }
};

let poolSource = null;
let poolMaster = null;
let poolTarget = null;

async function getPool(config, currentPool) {
  if (currentPool && currentPool.connected) return currentPool;
  if (currentPool) try { await currentPool.close(); } catch (e) { /* ignore */ }
  return await sql.connect(config);
}

// --- Mapping Tables ---
const yearMap = {
  "B": 21, "C": 22, "D": 23, "E": 24, "F": 25,
  "G": 26, "H": 27, "J": 28, "K": 29, "L": 30,
  "M": 31, "N": 32, "P": 33, "R": 34, "S": 35,
  "T": 36, "V": 37, "W": 38, "X": 39, "Y": 40,
  "1": 41, "2": 42, "3": 43, "4": 44, "5": 45,
  "6": 46, "7": 47, "8": 48, "9": 49, "A": 50
};

const monthMap = {
  "1": "01", "2": "02", "3": "03", "4": "04", "5": "05", "6": "06",
  "7": "07", "8": "08", "9": "09", "A": "10", "B": "11", "C": "12"
};

const dayMap = {
  "1": "01", "2": "02", "3": "03", "4": "04", "5": "05",
  "6": "06", "7": "07", "8": "08", "9": "09", "A": "10",
  "B": "11", "C": "12", "D": "13", "E": "14", "F": "15",
  "G": "16", "H": "17", "J": "18", "K": "19", "L": "20",
  "M": "21", "N": "22", "P": "23", "R": "24", "S": "25",
  "T": "26", "V": "27", "W": "28", "X": "29", "Y": "30",
  "0": "31"
};

// --- Helper: extract table_date ---
function getTableDateFromBarcode(barcode) {
  if (!barcode || barcode.length < 17) return null;

  const yearChar = barcode[14];  // 14th (0-indexed)
  const monthChar = barcode[15]; // 15th
  const dayChar = barcode[16];   // 16th

  const yy = yearMap[yearChar];
  const mm = monthMap[monthChar];
  const dd = dayMap[dayChar];

  if (!yy || !mm || !dd) {
    console.warn(`⚠️ Could not map year=${yearChar}, month=${monthChar}, day=${dayChar}`);
    return null;
  }

  return `${dd}_${mm}_${yy}`;
}

// --- Build table names ---
function buildRegisterTable(dateStr) {
  if (!dateStr) return null;
  return `module_register_${dateStr}`;
}

function buildStatusTable(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('_');
  if (parts.length !== 3) return null;
  let [dd, mm, yy] = parts;
  if (yy.length === 2) yy = "20" + yy;
  return `module_status_${dd}-${mm}-${yy}`;
}

// --- Main Worker ---
async function processWeldingStatus() {
  try {
    poolSource = await getPool(configSource, poolSource);

    const sourceQuery = `
      SELECT TOP (1) srno, PackName, FinalQRCode, ModuleBarcode, Welding_status, EntryDateTime, moduleNumber, line
      FROM taco_treceability.station_status_weld
      ORDER BY srno
    `;
    const { recordset } = await poolSource.request().query(sourceQuery);

    if (!recordset || recordset.length === 0) {
      console.log("ℹ️ No rows to process");
      return;
    }

    const row = recordset[0];
    const moduleBarcode = row.ModuleBarcode;
    if (!moduleBarcode) {
      console.warn(`⚠️ Skipping row srno=${row.srno} — missing ModuleBarcode`);
      return;
    }

    try {
      console.log("🔍 Extracting table_date from ModuleBarcode:", moduleBarcode);

      const table_date = getTableDateFromBarcode(moduleBarcode);
      if (!table_date) {
        console.warn(`⚠️ Could not extract date for barcode=${moduleBarcode}`);
        // Delete anyway
        await poolSource.request()
          .input('barcode', sql.NVarChar(200), moduleBarcode)
          .query(`DELETE FROM taco_treceability.station_status_weld WHERE ModuleBarcode = @barcode`);
        console.log(`🗑️ Deleted row (invalid barcode) barcode=${moduleBarcode}`);
        return;
      }

      // --- Step 1: query module_register_xx from master DB ---
      poolMaster = await getPool(configMaster, poolMaster);
      const registerTable = buildRegisterTable(table_date);

      const regQuery = `
        SELECT TOP (1) Pack_ID, Module_ID, Pack_No
        FROM taco_treceability_master_module_register.taco_treceability.[${registerTable}]
        WHERE Module_QR = @barcode
      `;

      const regReq = poolMaster.request();
      regReq.input('barcode', sql.NVarChar(200), moduleBarcode);
      const regRes = await regReq.query(regQuery);

      if (!regRes.recordset || regRes.recordset.length === 0) {
        console.warn(`⚠️ No matching ModuleBarcode in ${registerTable}`);

        // Delete row anyway
        await poolSource.request()
          .input('barcode', sql.NVarChar(200), moduleBarcode)
          .query(`DELETE FROM taco_treceability.station_status_weld WHERE ModuleBarcode = @barcode`);
        console.log(`🗑️ Deleted row barcode=${moduleBarcode} (not found in ${registerTable})`);

        return;
      }

      const { Pack_ID, Module_ID, Pack_No } = regRes.recordset[0];

      // --- Step 2: update module_status_xx in target DB ---
      poolTarget = await getPool(configTarget, poolTarget);
      const statusTable = buildStatusTable(table_date);

      const updateReq = poolTarget.request();
      updateReq.input('status', sql.NVarChar(50), 'OK:NA:NA');
      updateReq.input('module_id', sql.Int, Module_ID);
      updateReq.input('pack_no', sql.Int, Pack_No);
      updateReq.input('pack_id', sql.Int, Pack_ID);

      const updateSql = `
        UPDATE taco_treceability_station_status.dbo.[${statusTable}]
        SET welding_status = @status
        WHERE module_id = @module_id AND pack_no = @pack_no AND pack_id = @pack_id
      `;
      const updateResult = await updateReq.query(updateSql);

      console.log(`✅ Updated barcode=${moduleBarcode} in ${statusTable} (rows affected: ${updateResult.rowsAffected})`);

      // --- Step 3: delete from source table ---
      await poolSource.request()
        .input('barcode', sql.NVarChar(200), moduleBarcode)
        .query(`DELETE FROM taco_treceability.station_status_weld WHERE ModuleBarcode = @barcode`);

      console.log(`🗑️ Deleted processed row barcode=${moduleBarcode}`);
    } catch (err) {
      console.error(`❌ Error processing ModuleBarcode=${moduleBarcode}:`, err.message || err);

      // Always delete row to avoid reprocessing stuck barcodes
      await poolSource.request()
        .input('barcode', sql.NVarChar(200), moduleBarcode)
        .query(`DELETE FROM taco_treceability.station_status_weld WHERE ModuleBarcode = @barcode`);
      console.log(`🗑️ Deleted errored row barcode=${moduleBarcode}`);
    }
  } catch (err) {
    console.error('❌ Main Error in processWeldingStatus:', err);
  }
}

// Run every 2 seconds
setInterval(processWeldingStatus, 2000);
processWeldingStatus();
