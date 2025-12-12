// updated_process_service.js
// Updated per request: use taco_treceability.station_status_pdu2 as source (TOP 200 srno, PackName, ModuleBarcode, today_date, line)
// Removed module_register, pack_register and pack_duplicate_checker logic — only module_status and pack_status handling retained.

const sql = require('mssql');
const dayjs = require('dayjs');
const EventEmitter = require('events');
EventEmitter.defaultMaxListeners = 20;

// Mappings for decoding QR codes
const yearMap = {
  B: 21, C: 22, D: 23, E: 24, F: 25, G: 26, H: 27, J: 28, K: 29, L: 30,
  M: 31, N: 32, P: 33, R: 34, S: 35, T: 36, V: 37, W: 38, X: 39, Y: 40,
  1: 41, 2: 42, 3: 43, 4: 44, 5: 45, 6: 46, 7: 47, 8: 48, 9: 49, A: 50
};

const monthMap = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, A: 10, B: 11, C: 12 };

const dayMap = {
  1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, A: 10, B: 11, C: 12,
  D: 13, E: 14, F: 15, G: 16, H: 17, J: 18, K: 19, L: 20, M: 21, N: 22,
  P: 23, R: 24, S: 25, T: 26, V: 27, W: 28, X: 29, Y: 30, 0: 31
};

const lineMap = {
  1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, A: 10, B: 11, C: 12
};

// Database configurations
// Kept pools for compatibility; only pool1, pool2, pool3 are used in this updated script.
const configs = {
  pool1: {
    user: 'user_mis',
    password: 'admin',
    server: '10.9.4.28\\MSSQLSERVER',
    database: 'taco_treceability',
    options: { 
      encrypt: true, 
      trustServerCertificate: true,
      connectTimeout: 30000,
      requestTimeout: 60000
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
  },
  pool2: {
    user: 'user_mis',
    password: 'admin',
    server: '10.9.4.28\\MSSQLSERVER',
    database: 'taco_treceability_master',
    options: { 
      encrypt: true, 
      trustServerCertificate: true,
      connectTimeout: 30000,
      requestTimeout: 60000
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
  },
  pool3: {
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
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
  }
  // pools 4/5/6 removed from active use
};

// Connection management with retry logic
const connectionPools = {};

async function getConnection(poolName) {
  if (connectionPools[poolName] && connectionPools[poolName].connected) {
    return connectionPools[poolName];
  }

  let retries = 3;
  let lastError = null;
  
  while (retries-- > 0) {
    try {
      const pool = new sql.ConnectionPool(configs[poolName]);
      await pool.connect();
      console.log(`${poolName} connected successfully`);
      connectionPools[poolName] = pool;
      pool.on('error', err => {
        console.error(`Pool ${poolName} error:`, err.message);
        delete connectionPools[poolName];
      });
      return pool;
    } catch (err) {
      lastError = err;
      console.error(`Attempt ${3-retries} failed for ${poolName}:`, err.message);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  console.error(`All connection attempts failed for ${poolName}`);
  throw lastError;
}

async function closeConnection(pool) {
  try {
    if (pool && pool.connected) {
      await pool.close();
      console.log('Connection closed successfully');
    }
  } catch (err) {
    console.error('Error closing connection:', err.message);
  }
}

async function withConnection(poolName, callback) {
  let pool;
  try {
    pool = await getConnection(poolName);
    return await callback(pool);
  } catch (err) {
    console.error(`Error in ${poolName} operation:`, err.message);
    if (err.code === 'ETIMEOUT' || err.code === 'ESOCKET') {
      console.error('Network connectivity issue detected');
      if (pool) delete connectionPools[poolName];
    }
    throw err;
  } finally {
    if (pool && (pool.connected === false || pool._connected === false)) {
      try {
        await pool.close();
        delete connectionPools[poolName];
      } catch (closeErr) {
        console.error('Error closing connection:', closeErr.message);
      }
    }
  }
}

// Main processing functions
async function processRecords() {
  try {
    console.log('Fetching records to process...');
    const records = await fetchRecordsToProcess();
    
    if (!records || records.length === 0) {
      console.log('No records found to process');
      return;
    }

    const processingResults = await processAllRecords(records);
    await cleanupProcessedRecords(processingResults.processedSrNos);
    
    console.log(`Processing complete. ${processingResults.successCount} succeeded, ${processingResults.errorCount} failed`);
  } catch (err) {
    console.error('Fatal error in processRecords:', err.message);
  }
}

// Updated: use station_status_pdu2 as source table and new column names
async function fetchRecordsToProcess() {
  return withConnection('pool1', async (pool) => {
    const result = await pool.request().query(`
      SELECT TOP (1) srno, PackName, ModuleBarcode, today_date, line
      FROM taco_treceability.station_status_pdu2
      ORDER BY srno
    `);
    return result.recordset;
  });
}

async function processAllRecords(records) {
  // schema for status tables
  const schema_table2 = 'dbo';
  const result = {
    processedSrNos: [],
    successCount: 0,
    errorCount: 0
  };

  for (const [index, row] of records.entries()) {
    try {
      console.log(`Processing record ${index + 1}/${records.length} (srno: ${row.srno})`);
      
      if (!validateRecord(row)) {
        result.errorCount++;
        continue;
      }

      const { year, month, day } = decodeDateFromBarcode(row.ModuleBarcode);
      if (!year || !month || !day) {
        console.warn(`⚠️ Skipping srno ${row.srno} due to invalid date codes in ModuleBarcode`);
        result.errorCount++;
        continue;
      }

      const dateFormats = calculateDateFormats(year, month, day);
      const tableNames = generateTableNames(dateFormats);

      // Ensure only module_status and pack_status tables exist (create if not)
      await ensureStatusTablesExist(tableNames, schema_table2);

      const last6Digits = extractLast6Digits(row.ModuleBarcode || row.ModuleBarcode);
      if (!last6Digits) {
        console.warn(`⚠️ Skipping srno ${row.srno} due to invalid last6 digits extraction`);
        result.errorCount++;
        continue;
      }

      // Process pack/module status and pack registration (only pack_status insertion, no pack_register/module_register)
      await processPackAndModuleData(
        row,
        dateFormats,
        tableNames,
        last6Digits,
        schema_table2,
        result
      );

      result.successCount++;
      result.processedSrNos.push(row.srno);
    } catch (err) {
      console.error(`❌ Error processing srno ${row.srno}:`, err.message);
      result.errorCount++;
    }
  }

  return result;
}

// Helper functions
function validateRecord(row) {
  if (!row.ModuleBarcode || row.ModuleBarcode.length < 17) {
    console.warn(`⚠️ Skipping srno ${row.srno} due to invalid ModuleBarcode`);
    return false;
  }
  if (!row.PackName) {
    console.warn(`⚠️ Skipping srno ${row.srno} due to missing PackName`);
    return false;
  }
  return true;
}

function decodeDateFromBarcode(barcode) {
  // substring(14,17) logic retained from original code
  const slice = barcode.substring(14, 17);
  const yearChar = slice[0];
  const monthChar = slice[1];
  const dayChar = slice[2];
  return {
    year: yearMap[yearChar],
    month: monthMap[monthChar],
    day: dayMap[dayChar]
  };
}

function calculateDateFormats(year, month, day) {
  const packDateObj = dayjs(`${2000 + year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  return {
    packDate: packDateObj.format('YYYY-MM-DD'),
    packDate_DDMMYY: packDateObj.format('DD_MM_YY'),
    packDate_DDMMYYYY: packDateObj.format('DD-MM-YYYY'),
    packDate_MMYY: packDateObj.format('MM_YY'),
    packDate_MMYYYY: packDateObj.format('MM-YYYY')
  };
}

function generateTableNames(dateFormats) {
  // Only dynamic status tables retained
  return {
    module_statusTable: `module_status_${dateFormats.packDate_DDMMYYYY}`,
    pack_statusTable: `pack_status_${dateFormats.packDate_MMYYYY}`
  };
}

async function ensureStatusTablesExist(tableNames, schema_table2) {
  // Create module_status table in pool3 DB if not exists
  await withConnection('pool3', async (pool) => {
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='${tableNames.module_statusTable}' AND xtype='U')
      CREATE TABLE [${schema_table2}].[${tableNames.module_statusTable}] (
        id INT IDENTITY(1,1) PRIMARY KEY,
        pack_id INT,
        module_id INT,
        pack_no NVARCHAR(100),
        today_date DATE,
        module_print_status NVARCHAR(100),
        compression_status NVARCHAR(100),
        ibb_status NVARCHAR(100),
        QA_gate1 NVARCHAR(100),
        welding_status NVARCHAR(100),
        voltage_ir_status NVARCHAR(100),
        QA_gate2 NVARCHAR(100),
        bom_status NVARCHAR(100),
        compression_status2 NVARCHAR(100)
      )
    `);
  });

  // Create pack_status table in pool3 DB if not exists
  await withConnection('pool3', async (pool) => {
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='${tableNames.pack_statusTable}' AND xtype='U')
      CREATE TABLE [${schema_table2}].[${tableNames.pack_statusTable}] (
        id INT IDENTITY(1,1) PRIMARY KEY,
        pack_id INT,
        pack_no NVARCHAR(100),
        today_date DATE,
        Pack_Assembly NVARCHAR(100),
        Customer_Qrcode_Generate NVARCHAR(100),
        QA_gate3 NVARCHAR(100),
        BMS_Link NVARCHAR(100),
        Current_Sensor_Link NVARCHAR(100),
        BMS_Flashing NVARCHAR(100),
        Slave1_Link NVARCHAR(100),
        Slave2_Link NVARCHAR(100),
        EOL NVARCHAR(100),
        EOL_Autograph NVARCHAR(100),
        ALT_BOM_Verification NVARCHAR(100),
        ALT NVARCHAR(100),
        QA_gate4 NVARCHAR(100),
        PDI NVARCHAR(MAX),
        IR_Pack_Assembly_PC1 NVARCHAR(100),
        IR_Pack_Assembly_PC2 NVARCHAR(100),
        IR_Pack_Assembly_PC3 NVARCHAR(100),
        IR_Pack_Assembly_PC4 NVARCHAR(100),
        IR_Pack_Assembly_PC5 NVARCHAR(100),
        IR_Pack_Assembly_PC6 NVARCHAR(100),
        IR_Pack_Assembly_PC7 NVARCHAR(100),
        IR_Pack_Assembly_PC8 NVARCHAR(100),
        IR_Pack_Assembly_PC9 NVARCHAR(100),
        IR_Pack_Assembly_PC10 NVARCHAR(100),
        can_PA NVARCHAR(100),
        can_EOL NVARCHAR(100),
        can_ALT NVARCHAR(100),
        can_PDI NVARCHAR(100),
        IR_Module_Assembly_PC1 NVARCHAR(100),
        IR_Module_Assembly_PC2 NVARCHAR(100),
        IR_Pack_Assembly_Rework_PC1 NVARCHAR(100),
        IR_ALT_PC1 NVARCHAR(100),
        IR_Tray_Assembly_PC1 NVARCHAR(100),
        QA_gate4_2 NVARCHAR(100),
        QA_gate5 NVARCHAR(100),
        ALT2 NVARCHAR(100),
        ALT3 NVARCHAR(100)
      )
    `);
  });
}

function extractLast6Digits(qrCode) {
  if (!qrCode) {
    console.warn('⚠️ Skipping due to null ModuleBarcode');
    return null;
  }
  return qrCode.replace(/\D/g, '').slice(-6);
}

// processPackAndModuleData now only inserts module_status and pack_status (no module_register/pack_register duplicates)
async function processPackAndModuleData(
  row,
  dateFormats,
  tableNames,
  last6Digits,
  schema_table2,
  result
) {
  // Lookup Pack_ID and Module_ID from master DB (pool2)
  await withConnection('pool2', async (pool2) => {
     const cleanPackName = row.PackName.replaceAll('|', ' ');
    const packRes = await pool2.request()    
     .input('pack_name', sql.NVarChar, `PDU ${cleanPackName}`)
      //.input('pack_name', sql.NVarChar, `PDU ${row.PackName}`)
      .query(`SELECT Pack_ID FROM [taco_treceability_master].[taco_treceability].[master_pack] WHERE Pack_Name = @pack_name`);
    
    if (packRes.recordset.length === 0) {
      console.warn(`⚠️ No Pack_ID found for PackName: ${row.PackName}`);
      return;
    }

    for (const packRow of packRes.recordset) {
      const packID = packRow.Pack_ID;
      
      const modRes = await pool2.request()
        .input('moduleBarcode', sql.NVarChar, row.ModuleBarcode)
        .input('packID', sql.Int, packID)
        // Note: original code used moduleNumber; here we try to find Module_ID by ModuleBarcode OR fallback logic.
        .query(`SELECT Module_ID FROM [taco_treceability_master].[taco_treceability].[master_module] WHERE Pack_ID = @packID`);
      
      if (modRes.recordset.length === 0) {
        // fallback: if ModuleBarcode is not present in master_module, attempt lookup by some other mapping (original code used moduleNumber)
        console.warn(`⚠️ No Module_ID found for ModuleBarcode: ${row.ModuleBarcode} and Pack_ID: ${packID}`);
        continue;
      }

      for (const modRow of modRes.recordset) {
        const moduleID = modRow.Module_ID;

        // Insert module status (pool3)
        await insertModuleStatus(
          packID,
          moduleID,
          last6Digits,
          dateFormats.packDate,
          tableNames.module_statusTable,
          schema_table2
        );

        // Handle pack registration: only insert pack_status if not exists
        await handlePackRegistration(
          row,
          packID,
          last6Digits,
          dateFormats,
          tableNames,
          schema_table2
        );

        result.processedSrNos.push(row.srno);
      }
    }
  });
}

async function insertModuleStatus(packID, moduleID, packNo, packDate, tableName, schema) {
  const moduleStatusValues = [
    packID, moduleID, packNo, packDate,
    'OK:NA:NA', 'OK:NA:NA', 'OK:NA:NA', 'OK:NA:NA',
    'OK:NA:NA', 'OK:NA:NA', 
    (packID.toString() === "28" || packID.toString() === "29" || packID.toString() === "33" || 
     packID.toString() === "2" || packID.toString() === "3" || packID.toString() === "8" || 
     packID.toString() === "20" || packID.toString() === "27" || packID.toString() === "18" || 
     packID.toString() === "1" || packID.toString() === "19" || packID.toString() === "15") ? 
     'OK:NA:NA' : 'OK:NA:NA',
    'OK:NA:NA', 'OK:NA:NA'
  ];

  await withConnection('pool3', async (pool) => {
    await pool.request()
      .input('pack_id', sql.Int, moduleStatusValues[0])
      .input('module_id', sql.Int, moduleStatusValues[1])
      .input('pack_no', sql.NVarChar, moduleStatusValues[2])
      .input('today_date', sql.Date, moduleStatusValues[3])
      .input('module_print_status', sql.NVarChar, moduleStatusValues[4])
      .input('compression_status', sql.NVarChar, moduleStatusValues[5])
      .input('ibb_status', sql.NVarChar, moduleStatusValues[6])
      .input('QA_gate1', sql.NVarChar, moduleStatusValues[7])
      .input('welding_status', sql.NVarChar, moduleStatusValues[8])
      .input('voltage_ir_status', sql.NVarChar, moduleStatusValues[9])
      .input('QA_gate2', sql.NVarChar, moduleStatusValues[10])
      .input('bom_status', sql.NVarChar, moduleStatusValues[11])
      .input('compression_status2', sql.NVarChar, moduleStatusValues[12])
      .query(`
        INSERT INTO [${schema}].[${tableName}]
        (pack_id, module_id, pack_no, today_date, module_print_status, compression_status, 
         ibb_status, QA_gate1, welding_status, voltage_ir_status, QA_gate2, bom_status, compression_status2)
        VALUES (@pack_id, @module_id, @pack_no, @today_date, @module_print_status, @compression_status, 
                @ibb_status, @QA_gate1, @welding_status, @voltage_ir_status, @QA_gate2, @bom_status, @compression_status2)
      `);
  });
}

async function handlePackRegistration(
  row,
  packID,
  packNo,
  dateFormats,
  tableNames,
  schema_table2
) {
  // packExists now checks pack_status table in pool3
  const packExists = await withConnection('pool3', async (pool) => {
    const result = await pool.request()
      .input('packID', sql.Int, packID)
      .input('packNo', sql.NVarChar, packNo)
      .query(`SELECT 1 FROM [${schema_table2}].[${tableNames.pack_statusTable}] WHERE pack_id = @packID AND pack_no = @packNo`);
    return result.recordset.length > 0;
  });

  if (!packExists) {
    // Only insert into pack_status (no pack_register / pack_duplicate_checker)
    await insertPackStatus(packID, packNo, dateFormats.packDate, tableNames.pack_statusTable, schema_table2);
  }
}

async function insertPackStatus(packID, packNo, packDate, tableName, schema) {
  let query;
 

    query = `
      INSERT INTO [${schema}].[${tableName}]
      (pack_id, pack_no, today_date, Pack_Assembly, Customer_Qrcode_Generate, QA_gate3,
       BMS_Link, Current_Sensor_Link, BMS_Flashing, Slave1_Link, Slave2_Link, EOL,
       EOL_Autograph, ALT_BOM_Verification, ALT, QA_gate4, PDI, IR_Pack_Assembly_PC1,
       IR_Pack_Assembly_PC2, IR_Pack_Assembly_PC3, IR_Pack_Assembly_PC4, IR_Pack_Assembly_PC5,
       IR_Pack_Assembly_PC6, IR_Pack_Assembly_PC7, IR_Pack_Assembly_PC8, IR_Pack_Assembly_PC9,
       IR_Pack_Assembly_PC10, can_PA, can_EOL, can_ALT, can_PDI, IR_Module_Assembly_PC1,
       IR_Module_Assembly_PC2, IR_Pack_Assembly_Rework_PC1, IR_ALT_PC1, IR_Tray_Assembly_PC1,
       QA_gate4_2, QA_gate5, ALT2, ALT3)
      VALUES (@packID, @packNo, @packDate, 'NOT OK:NA:NA',
       'NOT OK:NA:NA','NOT OK:NA:NA',
       'NOT OK:NA:NA','NOT OK:NA:NA',
       'NOT OK:NA:NA','NOT OK:NA:NA',
       'NOT OK:NA:NA','NOT OK:NA:NA',
       'NOT OK:NA:NA','NOT OK:NA:NA',
       'NOT OK:NA:NA','NOT OK:NA:NA',
       'NOT OK:NA:NA',
       'NOT OK:NA:NA',
       'NOT OK:NA:NA','NOT OK:NA:NA',
       'NOT OK:NA:NA','NOT OK:NA:NA',
       'NOT OK:NA:NA','NOT OK:NA:NA',
       'NOT OK:NA:NA','NOT OK:NA:NA',
       'NOT OK:NA:NA','NOT OK:NA:NA',
       'NOT OK:NA:NA','NOT OK:NA:NA',
       'NOT OK:NA:NA','NOT OK:NA:NA',
       'NOT OK:NA:NA','NOT OK:NA:NA',
       'NOT OK:NA:NA','NOT OK:NA:NA',
       'NOT OK:NA:NA','NOT OK:NA:NA',
       'NOT OK:NA:NA','NOT OK:NA:NA')
    `;


  await withConnection('pool3', async (pool) => {
    await pool.request()
      .input('packID', sql.Int, packID)
      .input('packNo', sql.NVarChar, packNo)
      .input('packDate', sql.Date, packDate)
      .query(query);
  });
}

async function cleanupProcessedRecords(processedSrNos) {
  if (!processedSrNos || processedSrNos.length === 0) return;

  const uniqueSrNos = [...new Set(processedSrNos)];
  const chunkSize = 1000;
  
  for (let i = 0; i < uniqueSrNos.length; i += chunkSize) {
    const chunk = uniqueSrNos.slice(i, i + chunkSize);
    await withConnection('pool1', async (pool) => {
      await pool.request()
        .query(`DELETE FROM taco_treceability.station_status_pdu2 WHERE srno IN (${chunk.join(',')})`);
    });
  }
  console.log(`Cleaned up ${uniqueSrNos.length} processed records`);
}

// Process control with circuit breaker pattern
let isProcessing = false;

async function safeProcessRecords() {
  if (isProcessing) {
    console.log('Processing already in progress, skipping this run');
    return;
  }

  try {
    isProcessing = true;
    await processRecords();
  } catch (err) {
    console.error(' Error in safeProcessRecords:', err.message);
  } finally {
    isProcessing = false;
  }
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log(' Received SIGINT. Shutting down gracefully...');
  // Close all pools gracefully
  for (const k of Object.keys(connectionPools)) {
    try { await connectionPools[k].close(); } catch (e) {}
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log(' Received SIGTERM. Shutting down gracefully...');
  for (const k of Object.keys(connectionPools)) {
    try { await connectionPools[k].close(); } catch (e) {}
  }
  process.exit(0);
});

// Start processing
console.log('Starting record processing service (updated) ...');
// Run every second as original (adjust if this is too frequent)
setInterval(safeProcessRecords, 1000);
