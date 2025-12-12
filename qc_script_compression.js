const sql = require('mssql');
const EventEmitter = require('events');
EventEmitter.defaultMaxListeners = 50;

// DB CONFIGS
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

const configMasterCompression = {
  user: 'user_mis',
  password: 'admin',
  server: '10.9.4.28\\MSSQLSERVER',
  database: 'taco_treceability_master_module_compression',
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
let poolMasterCompression = null;

async function getPool(config, pool) {
  if (pool && pool.connected) return pool;
  if (pool) try { await pool.close(); } catch (_) {}
  return await sql.connect(config);
}

// YEAR–MONTH–DAY maps
const yearMap = {
  "B": 21, "C": 22, "D": 23, "E": 24, "F": 25, "G": 26, "H": 27,
  "J": 28, "K": 29, "L": 30, "M": 31, "N": 32, "P": 33, "R": 34,
  "S": 35, "T": 36, "V": 37, "W": 38, "X": 39, "Y": 40
};
const monthMap = { "1": "01","2": "02","3": "03","4": "04","5": "05","6": "06","7": "07","8": "08","9": "09","A": "10","B": "11","C": "12" };
const dayMap = {
  "1":"01","2":"02","3":"03","4":"04","5":"05","6":"06","7":"07","8":"08","9":"09",
  "A":"10","B":"11","C":"12","D":"13","E":"14","F":"15","G":"16","H":"17","J":"18",
  "K":"19","L":"20","M":"21","N":"22","P":"23","R":"24","S":"25","T":"26","V":"27",
  "W":"28","X":"29","Y":"30","0":"31"
};

// Extract module_compression table date
function getTableDate(barcode) {
  const yy = yearMap[barcode[14]];
  const mm = monthMap[barcode[15]];
  const dd = dayMap[barcode[16]];
  if (!yy || !mm || !dd) return null;
  return `${dd}_${mm}_${yy}`;
}

function registerTable(date) {
  return `module_register_${date}`;
}

function statusTable(date) {
  const [dd, mm, yy] = date.split("_");
  return `module_status_${dd}-${mm}-20${yy}`;
}

// MAIN LOOP
async function processCompressionStatus() {
  try {
    poolSource = await getPool(configSource, poolSource);

    // ✅ FIXED UNION QUERY - NO SYNTAX ERROR
    const sourceQuery = `
      SELECT src, module_number FROM (
          SELECT 'mirror1' AS src, module_number, srno
          FROM taco_treceability.module_compression_details_mirror
          UNION ALL
          SELECT 'mirror2' AS src, module_number, srno
          FROM taco_treceability.module_compression_details2_mirror
      ) AS x
      ORDER BY srno;
    `;

    const { recordset } = await poolSource.request().query(sourceQuery);
    if (!recordset.length) return;

    for (const row of recordset) {
      await processSingleRow(row);
    }

  } catch (err) {
    console.error("❌ Worker Error:", err);
  }
}

async function processSingleRow(row) {
  const moduleBarcode = row.module_number;

  const sourceTable =
    row.src === "mirror1"
      ? "taco_treceability.module_compression_details_mirror"
      : "taco_treceability.module_compression_details2_mirror";

  try {
    const dateStr = getTableDate(moduleBarcode);
    if (!dateStr) {
      await deleteFromSource(sourceTable, moduleBarcode);
      return;
    }

    poolMaster = await getPool(configMaster, poolMaster);

    const regTable = registerTable(dateStr);

    const regQry = `
      SELECT TOP 1 Pack_ID, Module_ID, Pack_No
      FROM taco_treceability_master_module_register.taco_treceability.[${regTable}]
      WHERE Module_QR = @barcode
    `;

    const regRes = await poolMaster.request()
      .input("barcode", sql.NVarChar(200), moduleBarcode)
      .query(regQry);

    if (!regRes.recordset.length) {
      await deleteFromSource(sourceTable, moduleBarcode);
      return;
    }

    const { Pack_ID, Module_ID, Pack_No } = regRes.recordset[0];

    // ✅ Update station status
    poolTarget = await getPool(configTarget, poolTarget);
    const statTable = statusTable(dateStr);

    await poolTarget.request()
      .input("stat", sql.NVarChar(50), "OK:NA:NA")
      .input("mid", sql.Int, Module_ID)
      .input("pno", sql.Int, Pack_No)
      .input("pid", sql.Int, Pack_ID)
      .query(`
        UPDATE taco_treceability_station_status.dbo.[${statTable}]
        SET compression_status='OK:NA:NA', compression_status2='OK:NA:NA'
        WHERE module_id=@mid AND pack_no=@pno AND pack_id=@pid
      `);

    // ✅ Insert into Master Compression Table
    poolMasterCompression = await getPool(configMasterCompression, poolMasterCompression);

    const compTable = `module_compression_${dateStr}`;

    await poolMasterCompression.request().query(`
      IF OBJECT_ID('taco_treceability_master_module_compression.dbo.${compTable}', 'U') IS NULL
      BEGIN
        CREATE TABLE taco_treceability_master_module_compression.dbo.[${compTable}](
          srno INT IDENTITY PRIMARY KEY,
          pack_no NVARCHAR(200),
          module_number NVARCHAR(200),
          battery_pack_name NVARCHAR(100),
          preload_value NVARCHAR(100),
          force_value NVARCHAR(100),
          length_value NVARCHAR(100),
          operator NVARCHAR(100),
          supervisor NVARCHAR(100),
          quality_check NVARCHAR(100),
          Pack_creation_Date DATETIME,
          line NVARCHAR(100),
          shift NVARCHAR(50),
          jobstatus NVARCHAR(50),
          Pack_ID INT
        )
      END
    `);

    await poolMasterCompression.request()
      .input("barcode", sql.NVarChar(200), moduleBarcode)
      .query(`
        INSERT INTO taco_treceability_master_module_compression.dbo.[${compTable}]
        (pack_no, module_number, battery_pack_name, preload_value, force_value, length_value,
         operator, supervisor, quality_check, Pack_creation_Date,
         line, shift, jobstatus, Pack_ID)
        SELECT RIGHT(final_qrcode, 6), module_number, product_type, preload_value, force_value, length_value,
               operator, supervisor, quality_check, today_date,
               line, shift, jobstatus, ${Pack_ID}
        FROM ${sourceTable}
        WHERE module_number = @barcode
      `);

    // ✅ Delete processed row
    await deleteFromSource(sourceTable, moduleBarcode);

  } catch (err) {
    console.error(`❌ Error for barcode ${moduleBarcode}:`, err.message);
    await deleteFromSource(sourceTable, moduleBarcode);
  }
}

async function deleteFromSource(table, barcode) {
  try {
    await poolSource.request()
      .input("b", sql.NVarChar(200), barcode)
      .query(`DELETE FROM ${table} WHERE module_number=@b`);
  } catch (_) {}
}

setInterval(processCompressionStatus, 2000);
processCompressionStatus();
