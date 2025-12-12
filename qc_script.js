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
  1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H:17
};

// Database configurations with enhanced timeout settings
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
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
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
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
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
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  },
  pool4: {
    user: 'user_mis',
    password: 'admin',
    server: '10.9.4.28\\MSSQLSERVER',
    database: 'taco_treceability_master_module_register',
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
  },
  pool5: {
    user: 'user_mis',
    password: 'admin',
    server: '10.9.4.28\\MSSQLSERVER',
    database: 'taco_treceability_master_pack_register',
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
  },
  pool6: {
    user: 'user_mis',
    password: 'admin',
    server: '10.9.4.28\\MSSQLSERVER',
    database: 'cell_scanning_master',
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
  },
  // ============================================================================
  // CHANGE #1: NEW DATABASE POOL FOR COMPLETION TRACKING
  // Added by: Abhay | Date: 2025-12-12
  // Purpose: Track module completion history in separate database
  // ============================================================================
  pool7: {
    user: 'user_mis',
    password: 'admin',
    server: '10.9.4.28\\MSSQLSERVER',
    database: 'taco_treceability_station_status_history',
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
  }
};

// Connection management with retry logic
const connectionPools = {};

async function getConnection(poolName) {
  // Return existing pool if available and connected
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
     
      // Store the pool for reuse
      connectionPools[poolName] = pool;
     
      // Set up error handling for the pool
      pool.on('error', err => {
        console.error(`Pool ${poolName} error:`, err.message);
        // Remove the pool from cache so it will be recreated next time
        delete connectionPools[poolName];
      });
     
      return pool;
    } catch (err) {
      lastError = err;
      console.error(`Attempt ${3-retries} failed for ${poolName}:`, err.message);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
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
   
    // Specific handling for connection errors
    if (err.code === 'ETIMEOUT' || err.code === 'ESOCKET') {
      console.error('Network connectivity issue detected');
      // Invalidate the pool so it will be recreated next time
      if (pool) {
        delete connectionPools[poolName];
      }
    }
   
    throw err;
  } finally {
    // Don't close the pool here since we're caching it
    // Only close if there was an error and we don't want to keep the pool
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

// ============================================================================
// CHANGE #2: HELPER FUNCTION FOR TIMESTAMP FORMAT
// Added by: Abhay | Date: 2025-12-12
// Purpose: Generate status string with timestamp (OK|2025-12-12 10:30:45:NA:NA)
// Format: STATUS|TIMESTAMP:SUBSTATIONS:INTERLOCK
// ============================================================================
function generateModulePrintStatus() {
  const now = dayjs();
  const timestamp = now.format('YYYY-MM-DD HH.mm.ss');
  return `OK|${timestamp}:NA:NA`;
}

// ============================================================================
// CHANGE #3: COMPLETION TRACKING FUNCTION
// Added by: Abhay | Date: 2025-12-12
// Purpose: Log module completion to history database
// Table: module_completion_DD_MM_YYYY (daily tables)
// Non-blocking: Uses async without await to prevent delays
// ============================================================================
async function trackModuleCompletion(packID, moduleID, packNo, lineID) {
  try {
    const now = dayjs();
    const tableName = `module_completion_${now.format('DD_MM_YYYY')}`;
    
    await withConnection('pool7', async (pool) => {
      // Create table if it doesn't exist (daily table)
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '${tableName}')
        BEGIN
          CREATE TABLE ${tableName} (
            id INT IDENTITY(1,1) PRIMARY KEY,
            pack_id INT NOT NULL,
            module_id INT NOT NULL,
            pack_no NVARCHAR(255) NOT NULL,
            line_id INT,
            station_name NVARCHAR(255) NOT NULL,
            completion_time DATETIME NOT NULL DEFAULT GETDATE(),
            status_value NVARCHAR(255),
            
            INDEX idx_pack_id (pack_id),
            INDEX idx_module_id (module_id),
            INDEX idx_pack_no (pack_no),
            INDEX idx_line_id (line_id),
            INDEX idx_station_name (station_name),
            INDEX idx_completion_time (completion_time)
          )
        END
      `);
      
      // Insert completion record
      const timestamp = now.format('YYYY-MM-DD HH.mm.ss');
      const statusValue = `OK|${timestamp}:NA:NA`;
      
      await pool.request()
        .input('pack_id', sql.Int, packID)
        .input('module_id', sql.Int, moduleID)
        .input('pack_no', sql.NVarChar, packNo)
        .input('line_id', sql.Int, lineID)
        .input('status_value', sql.NVarChar, statusValue)
        .query(`
          INSERT INTO ${tableName}
          (pack_id, module_id, pack_no, line_id, station_name, status_value)
          VALUES (@pack_id, @module_id, @pack_no, @line_id, 'module_print_status', @status_value)
        `);
    });
  } catch (err) {
    // Silent fail - don't break main process if tracking fails
    console.error('[TRACKING] Failed to log completion:', err.message);
  }
}

// Main processing functions
async function processRecords() {
  try {
    console.log('Fetching records to process...');
    const records = await fetchRecordsToProcess();
   
    if (records.length === 0) {
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

async function fetchRecordsToProcess() {
  return withConnection('pool1', async (pool) => {
    const result = await pool.request().query(`
      SELECT sr_no, line, battery_pack_name, final_qr_code, moduleNumber, module_barcode, today_date
      FROM taco_treceability.master_compress_data
      ORDER BY sr_no
    `);
    return result.recordset;
  });
}

async function processAllRecords(records) {
  const schema_table = 'taco_treceability';
  const schema_table2 = 'dbo';
  const createdTables = new Set();
  const result = {
    processedSrNos: [],
    successCount: 0,
    errorCount: 0
  };

  for (const [index, row] of records.entries()) {
    try {
      console.log(`Processing record ${index + 1}/${records.length} (sr_no: ${row.sr_no})`);
     
      if (!validateRecord(row)) {
        result.errorCount++;
        continue;
      }

      const { year, month, day } = decodeDateFromBarcode(row.module_barcode);
      if (!year || !month || !day) {
        console.warn(`⚠️ Skipping sr_no ${row.sr_no} due to invalid date codes`);
        result.errorCount++;
        continue;
      }

      const dateFormats = calculateDateFormats(year, month, day);
      const tableNames = generateTableNames(dateFormats);

      await ensureTablesExist(tableNames, createdTables, schema_table, schema_table2);

      const last6Digits = extractLast6Digits(row.final_qr_code);
      if (!last6Digits) {
        result.errorCount++;
        continue;
      }

      if (await recordExists(row.module_barcode, tableNames.targetTable, schema_table)) {
        console.log(`Skipping module_barcode ${row.module_barcode} - already exists`);
        result.errorCount++;
        continue;
      }

      await processPackAndModuleData(
        row,
        dateFormats,
        tableNames,
        last6Digits,
        schema_table,
        schema_table2,
        result
      );

      result.successCount++;
      result.processedSrNos.push(row.sr_no);
    } catch (err) {
      console.error(`❌ Error processing sr_no ${row.sr_no}:`, err.message);
      result.errorCount++;
    }
  }

  return result;
}

// Helper functions
function validateRecord(row) {
  if (!row.module_barcode || row.module_barcode.length < 17) {
    console.warn(`⚠️ Skipping sr_no ${row.sr_no} due to invalid module_barcode`);
    return false;
  }
  return true;
}

function decodeDateFromBarcode(barcode) {
  const [yearChar, monthChar, dayChar] = barcode.substring(14, 17);
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
  return {
    targetTable: `module_register_${dateFormats.packDate_DDMMYY}`,
    packTable: `Pack_Register_${dateFormats.packDate_MMYY}`,
    module_statusTable: `module_status_${dateFormats.packDate_DDMMYYYY}`,
    pack_statusTable: `pack_status_${dateFormats.packDate_MMYYYY}`
  };
}

async function ensureTablesExist(tableNames, createdTables, schema_table, schema_table2) {
  if (!createdTables.has(tableNames.targetTable)) {
    try {
      await withConnection('pool4', async (pool) => {
        await pool.request().query(`
          IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='${tableNames.targetTable}' AND xtype='U')
          CREATE TABLE [${schema_table}].[${tableNames.targetTable}] (
            srno INT IDENTITY(1,1) PRIMARY KEY,
            Pack_ID NVARCHAR(100),
            Module_ID NVARCHAR(100),
            Module_QR NVARCHAR(100),
            Line_ID NVARCHAR(100),
            Pack_creation_Date DATE,
            Pack_No NVARCHAR(100),
            Cur_Date DATETIME2(0) DEFAULT GETDATE()
          )
        `);
        createdTables.add(tableNames.targetTable);
      });
    } catch (err) {
      console.error('Error creating target table:', err.message);
      throw err;
    }
  }

  if (!createdTables.has(tableNames.packTable)) {
    try {
      await withConnection('pool5', async (pool) => {
        await pool.request().query(`
          IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='${tableNames.packTable}' AND xtype='U')
          CREATE TABLE [${schema_table}].[${tableNames.packTable}] (
            srno INT IDENTITY(1,1) PRIMARY KEY,
            Line_ID NVARCHAR(100),
            Pack_ID NVARCHAR(100),
            Pack_No NVARCHAR(100),
            modules_creation_date NVARCHAR(MAX),
            Pack_creation_Date DATE,
            assign_stations_ids NVARCHAR(MAX),
            Interlock_on_stationIDs NVARCHAR(MAX)
          )
        `);
        createdTables.add(tableNames.packTable);
      });
    } catch (err) {
      console.error('Error creating pack table:', err.message);
      throw err;
    }
  }

  if (!createdTables.has(tableNames.module_statusTable)) {
    try {
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
        createdTables.add(tableNames.module_statusTable);
      });
    } catch (err) {
      console.error('Error creating module status table:', err.message);
      throw err;
    }
  }

  if (!createdTables.has(tableNames.pack_statusTable)) {
    try {
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
            ALT3 NVARCHAR(100),
            Dispatch NVARCHAR(100)
          )
        `);
        createdTables.add(tableNames.pack_statusTable);
      });
    } catch (err) {
      console.error('Error creating pack status table:', err.message);
      throw err;
    }
  }
}

function extractLast6Digits(qrCode) {
  if (!qrCode) {
    console.warn('⚠️ Skipping due to null final_qr_code');
    return null;
  }
  return qrCode.replace(/\D/g, '').slice(-6);
}

async function recordExists(module_barcode, tableName, schema) {
  return withConnection('pool4', async (pool) => {
    const result = await pool.request()
      .input('module_barcode', sql.NVarChar, module_barcode)
      .query(`SELECT 1 FROM [${schema}].[${tableName}] WHERE Module_QR  = @module_barcode`);
    return result.recordset.length > 0;
  });
}

async function processPackAndModuleData(
  row,
  dateFormats,
  tableNames,
  last6Digits,
  schema_table,
  schema_table2,
  result
) {
  const packMap = new Map();

  await withConnection('pool2', async (pool2) => {
    const cleanPackName = row.battery_pack_name.replaceAll('|', ' ');
    const packRes = await pool2.request()
      .input('pack_name', sql.NVarChar, cleanPackName)
      .query(`SELECT Pack_ID FROM [taco_treceability_master].[taco_treceability].[master_pack] WHERE Pack_Name = @pack_name`);
   
    if (packRes.recordset.length === 0) {
      console.warn(`⚠️ No Pack_ID found for battery_pack_name: ${row.battery_pack_name}`);
      return;
    }

    for (const packRow of packRes.recordset) {
      const packID = packRow.Pack_ID;
     
      const modRes = await pool2.request()
        .input('moduleNumber', sql.Int, row.moduleNumber)
        .input('packID', sql.Int, packID)
        .query(`SELECT Module_ID FROM [taco_treceability_master].[taco_treceability].[master_module] WHERE moduleNumber = @moduleNumber AND Pack_ID = @packID`);
     
      if (modRes.recordset.length === 0) {
        console.warn(`⚠️ No Module_ID found for moduleNumber: ${row.moduleNumber} and Pack_ID: ${packID}`);
        continue;
      }

      for (const modRow of modRes.recordset) {
        const moduleID = modRow.Module_ID;

        await withConnection('pool4', async (pool4) => {
          await pool4.request()
            .input('packID', sql.Int, packID)
            .input('moduleID', sql.Int, moduleID)
            .input('module_barcode', sql.NVarChar, row.module_barcode)
            .input('lineID', sql.Int, lineMap[row.line])
            .input('packDate', sql.Date, dateFormats.packDate)
            .input('last6Digits', sql.NVarChar, last6Digits)
            .query(`
              INSERT INTO [${schema_table}].[${tableNames.targetTable}]
              (Pack_ID, Module_ID, Module_QR, Line_ID, Pack_creation_Date, Pack_No)
              VALUES (@packID, @moduleID, @module_barcode, @lineID, @packDate, @last6Digits)
            `);
        });

        // Insert module status
        await insertModuleStatus(
          packID,
          moduleID,
          last6Digits,
          dateFormats.packDate,
          tableNames.module_statusTable,
          schema_table2,
          lineMap[row.line]  // Pass line_id for tracking
        );

        // Handle pack registration
        await handlePackRegistration(
          row,
          packID,
          last6Digits,
          dateFormats,
          tableNames,
          schema_table,
          schema_table2,
          packMap
        );

        result.processedSrNos.push(row.sr_no);
      }
    }
  });

  // Update pack modules creation dates
  await updatePackModulesDates(packMap, tableNames.packTable, schema_table);
}

async function insertModuleStatus(packID, moduleID, packNo, packDate, tableName, schema, lineID) {
  // ============================================================================
  // CHANGE #4: GENERATE TIMESTAMP STATUS FOR module_print_status
  // Modified by: Abhay | Date: 2025-12-12
  // Old: 'OK:NA:NA'
  // New: 'OK|2025-12-12 10:30:45:NA:NA' (includes timestamp)
  // ============================================================================
  const modulePrintStatus = generateModulePrintStatus();
  
  const moduleStatusValues = [
    packID, moduleID, packNo, packDate,
    modulePrintStatus,  // Changed from 'OK:NA:NA'
    'NOT OK:NA:NA', 'NOT OK:NA:28,29', 'NOT OK:NA:NA',
    'NOT OK:NA:30', 'NOT OK:NA:15,16,29,30,28',
    (packID.toString() === "28" || packID.toString() === "29" || packID.toString() === "33" ||
     packID.toString() === "2" || packID.toString() === "3" || packID.toString() === "8" ||
     packID.toString() === "20" || packID.toString() === "27" || packID.toString() === "18" ||
     packID.toString() === "1" || packID.toString() === "19" || packID.toString() === "15") ?
     'NOT OK:NA:NA' : 'NOT OK:NA:3010',
    'NOT OK:NA:NA', 'NOT OK:NA:NA'
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

  // ============================================================================
  // CHANGE #5: TRACK MODULE COMPLETION IN HISTORY DATABASE
  // Added by: Abhay | Date: 2025-12-12
  // Non-blocking call - runs async without waiting
  // Logs to: module_completion_DD_MM_YYYY table
  // ============================================================================
  trackModuleCompletion(packID, moduleID, packNo, lineID).catch(err => {
    console.error('[TRACKING] Background tracking failed:', err.message);
  });
}

async function handlePackRegistration(
  row,
  packID,
  packNo,
  dateFormats,
  tableNames,
  schema_table,
  schema_table2,
  packMap
) {
  const packExists = await withConnection('pool5', async (pool) => {
    const result = await pool.request()
      .input('packID', sql.Int, packID)
      .input('packNo', sql.NVarChar, packNo)
      .query(`SELECT 1 FROM [${schema_table}].[${tableNames.packTable}] WHERE Pack_ID = @packID AND Pack_No = @packNo`);
    return result.recordset.length > 0;
  });

  if (!packExists) {
    await createNewPack(
      row,
      packID,
      packNo,
      dateFormats,
      tableNames,
      schema_table,
      schema_table2
    );
  }

  const packKey = `${packID}_${packNo}`;
  if (!packMap.has(packKey)) packMap.set(packKey, []);
  packMap.get(packKey).push(dateFormats.packDate);
}

async function createNewPack(
  row,
  packID,
  packNo,
  dateFormats,
  tableNames,
  schema_table,
  schema_table2
) {
  // Insert into Pack_Register
  await withConnection('pool5', async (pool) => {
    await pool.request()
      .input('lineID', sql.Int, lineMap[row.line])
      .input('packID', sql.Int, packID)
      .input('packNo', sql.NVarChar, packNo)
      .input('packDate', sql.Date, dateFormats.packDate)
      .query(`
        INSERT INTO [${schema_table}].[${tableNames.packTable}]
        (Line_ID, Pack_ID, Pack_No, modules_creation_date, Pack_creation_Date, assign_stations_ids, Interlock_on_stationIDs)
        VALUES (@lineID, @packID, @packNo, '', @packDate,
                '3,7,8,9,10,11,12,13,14,15,16,17,18,19,3015,3016,3011,3012,3013,3014,20,21,22,3007,3008,3009,3010',
                '1,20,21,22,3009,3010,3008,3011,3012,3013,3014,7,8,9,10,11,12,13,14,3015,3016,4,15,16,18,19,3,30,3021,3022,3023,3024,3026,28,33,39,32,2,29,5,35,40,41,3025,3028')
      `);
  });

  // Insert into Pack_duplicate_checker
  await withConnection('pool6', async (pool) => {
    await pool.request()
      .input('lineID', sql.Int, lineMap[row.line])
      .input('packID', sql.Int, packID)
      .input('packNo', sql.NVarChar, packNo)
      .input('packDate', sql.Date, dateFormats.packDate)
      .query(`
        INSERT INTO [${schema_table2}].[Pack_duplicate_checker]
        (Line_Id, Pack_ID, Pack_No, pack_creation_Date, new_series, auto_reset_date)
        VALUES (@lineID, @packID, @packNo, @packDate, 'NA', '')
      `);
  });

  // Insert into pack_status
  await insertPackStatus(packID, packNo, dateFormats.packDate, tableNames.pack_statusTable, schema_table2);
}

async function insertPackStatus(packID, packNo, packDate, tableName, schema) {
  let query;
  if (packID.toString() === "19") {
    query = `
      INSERT INTO [${schema}].[${tableName}]
      (pack_id, pack_no,
       today_date, Pack_Assembly,
       Customer_Qrcode_Generate, QA_gate3,
       BMS_Link, Current_Sensor_Link,
      BMS_Flashing, Slave1_Link,
      Slave2_Link, EOL,
       EOL_Autograph,ALT_BOM_Verification,
        ALT, QA_gate4,
         PDI, IR_Pack_Assembly_PC1,
          IR_Pack_Assembly_PC2, IR_Pack_Assembly_PC3,
           IR_Pack_Assembly_PC4, IR_Pack_Assembly_PC5,
      IR_Pack_Assembly_PC6, IR_Pack_Assembly_PC7,
      IR_Pack_Assembly_PC8, IR_Pack_Assembly_PC9,
      IR_Pack_Assembly_PC10, can_PA,
      can_EOL, can_ALT,
      can_PDI, IR_Module_Assembly_PC1,
      IR_Module_Assembly_PC2, IR_Pack_Assembly_Rework_PC1,
       IR_ALT_PC1, IR_Tray_Assembly_PC1,
        QA_gate4_2, QA_gate5,
         ALT2, ALT3,Dispatch)
      VALUES (@packID, @packNo,
      @packDate,'NOT OK:NA:33',
      'NOT OK:NA:NA','NOT OK:NA:20',
      'NOT OK:NA:3021,3022,4','NOT OK:NA:NA',
      'NOT OK:NA:NA','NOT OK:NA:NA',
      'NOT OK:NA:NA','NOT OK:NA:2,3011',
      'NOT OK:NA:NA','NOT OK:NA:NA',
      'NOT OK:NA:22,3023','NOT OK:NA:3012',
      'NOT OK:NA:1,20,21,22,3009,3010,3011,3012,3013,3014,7,8,9,10,11,12,13,14,3015,3016,4,15,16,18,19,3,30,3021,3022,3023,3024,3026,28,33,39,32,2,29,5,35,40,41,3025','NOT OK:226,227,228,229,230,231,232:33',
      'NOT OK:233,234,235,236,237,238,239,240,241:7', 'NOT OK:NA:8',
      'NOT OK:NA:9','NOT OK:NA:10',
      'NOT OK:NA:11','NOT OK:NA:12',
      'NOT OK:NA:13','NOT OK:NA:14',
      'NOT OK:NA:NA','NOT OK:NA:3011,21',
      'NOT OK:NA:3011,3012','NOT OK:NA:3011,3012,3013,22,3023',
      'NOT OK:NA:3011,3012,3013,3014','NOT OK:NA:30',
      'NOT OK:NA:15','NOT OK:NA:NA',
      'NOT OK:NA:NA','NOT OK:NA:NA',
      'NOT OK:NA:3012','NOT OK:NA:NA',
      'NOT OK:NA:22,3023','NOT OK:NA:22,3023','NOT OK:NA:5')
    `;
  }
  else if (packID.toString() === "1") {
    query = `
      INSERT INTO [${schema}].[${tableName}]
      (pack_id, pack_no,
       today_date,Pack_Assembly,
       Customer_Qrcode_Generate, QA_gate3,
        BMS_Link, Current_Sensor_Link,
      BMS_Flashing, Slave1_Link,
      Slave2_Link, EOL,
       EOL_Autograph,ALT_BOM_Verification,
       ALT, QA_gate4,
        PDI, IR_Pack_Assembly_PC1,
         IR_Pack_Assembly_PC2, IR_Pack_Assembly_PC3,
          IR_Pack_Assembly_PC4, IR_Pack_Assembly_PC5,
      IR_Pack_Assembly_PC6, IR_Pack_Assembly_PC7,
      IR_Pack_Assembly_PC8, IR_Pack_Assembly_PC9,
      IR_Pack_Assembly_PC10, can_PA,
      can_EOL, can_ALT,
      can_PDI, IR_Module_Assembly_PC1,
      IR_Module_Assembly_PC2, IR_Pack_Assembly_Rework_PC1,
       IR_ALT_PC1, IR_Tray_Assembly_PC1,
       QA_gate4_2, QA_gate5,
        ALT2, ALT3, Dispatch)
      VALUES (@packID, @packNo,
       @packDate,'NOT OK:NA:7,8,9,10,11,12,13,14,33,3015,3016',
       'NOT OK:NA:NA','NOT OK:NA:33',
       'NOT OK:NA:3021,3022,4','NOT OK:NA:NA',
       'NOT OK:NA:NA','NOT OK:NA:NA',
       'NOT OK:NA:NA','NOT OK:NA:2,3011',
       'NOT OK:NA:NA','NOT OK:NA:NA',
       'NOT OK:NA:22,3023','NOT OK:NA:3012',
       'NOT OK:NA:1,20,21,22,3009,3010,3011,3012,3013,3014,7,8,9,10,11,12,13,14,3015,3016,4,15,16,18,19,3,30,3021,3022,3023,3024,3026,28,33,39,32,2,29,5,35,40,41,3025','NOT OK:242,243,244,245,246,248,249:33',
      'NOT OK:250,251,252,253,254,255,256,257,258,259,260,261,262,263,264:7','OK:NA:8',
      'OK:NA:9','OK:NA:10',
      'OK:NA:11','OK:NA:12',
      'OK:NA:13','OK:NA:14',
      'OK:NA:NA','NOT OK:NA:3011,21',
      'NOT OK:NA:3011,3012','NOT OK:NA:3011,3012,3013,22,3023',
      'NOT OK:NA:3011,3012,3013,3014','NOT OK:365,366,367,368,369,370,371:30',
      'OK:NA:15','NOT OK:NA:NA',
      'NOT OK:363,364:NA','NOT OK:NA:NA',
      'NOT OK:NA:3012','NOT OK:NA:NA',
      'NOT OK:NA:22,3023','NOT OK:NA:22,3023','NOT OK:NA:5')
    `;
  }
  else {
    query = `
      INSERT INTO [${schema}].[${tableName}]
      (pack_id, pack_no,
       today_date,Pack_Assembly,
        Customer_Qrcode_Generate, QA_gate3,
        BMS_Link, Current_Sensor_Link,
        BMS_Flashing, Slave1_Link,
         Slave2_Link, EOL,
         EOL_Autograph,ALT_BOM_Verification,
         ALT, QA_gate4,
          PDI, IR_Pack_Assembly_PC1,
          IR_Pack_Assembly_PC2, IR_Pack_Assembly_PC3,
          IR_Pack_Assembly_PC4, IR_Pack_Assembly_PC5,
      IR_Pack_Assembly_PC6, IR_Pack_Assembly_PC7,
       IR_Pack_Assembly_PC8, IR_Pack_Assembly_PC9,
       IR_Pack_Assembly_PC10, can_PA,
       can_EOL, can_ALT,
        can_PDI, IR_Module_Assembly_PC1,
         IR_Module_Assembly_PC2, IR_Pack_Assembly_Rework_PC1,
         IR_ALT_PC1, IR_Tray_Assembly_PC1,
          QA_gate4_2, QA_gate5,
          ALT2, ALT3, Dispatch)
      VALUES (@packID, @packNo,
      @packDate,'NOT OK:NA:33',
      'NOT OK:NA:NA','NOT OK:NA:20',
      'NOT OK:NA:3021,3022,4','NOT OK:NA:NA',
      'NOT OK:NA:NA','NOT OK:NA:NA',
      'NOT OK:NA:NA','NOT OK:NA:2,3011',
      'NOT OK:NA:NA','NOT OK:NA:NA',
      'NOT OK:NA:22,3023','NOT OK:NA:3012',
      'NOT OK:NA:1,20,21,22,3009,3010,3011,3012,3013,3014,7,8,9,10,11,12,13,14,3015,3016,4,15,16,18,19,3,30,3021,3022,3023,3024,3026,28,33,39,32,2,29,5,35,40,41,3025','NOT OK:NA:33',
      'NOT OK:NA:7','NOT OK:NA:8',
      'NOT OK:NA:9','NOT OK:NA:10',
      'NOT OK:NA:11','NOT OK:NA:12',
      'NOT OK:NA:13','NOT OK:NA:14',
      'NOT OK:NA:NA','NOT OK:NA:3011,21',
      'NOT OK:NA:3011,3012','NOT OK:NA:3011,3012,3013,22,3023',
      'NOT OK:NA:3011,3012,3013,3014','NOT OK:NA:30',
      'NOT OK:NA:15','NOT OK:NA:NA',
      'NOT OK:NA:NA','NOT OK:NA:NA',
      'NOT OK:NA:3012','NOT OK:NA:NA',
      'NOT OK:NA:22,3023','NOT OK:NA:22,3023','NOT OK:NA:5')
    `;
  }

  await withConnection('pool3', async (pool) => {
    await pool.request()
      .input('packID', sql.Int, packID)
      .input('packNo', sql.NVarChar, packNo)
      .input('packDate', sql.Date, packDate)
      .query(query);
  });
}

async function updatePackModulesDates(packMap, packTable, schema) {
  for (const [packKey, dates] of packMap.entries()) {
    const [packID, packNo] = packKey.split('_');
    const uniqueDates = [...new Set(dates)].join(',');
   
    await withConnection('pool5', async (pool) => {
      await pool.request()
        .input('packID', sql.Int, packID)
        .input('packNo', sql.NVarChar, packNo)
        .input('uniqueDates', sql.NVarChar, uniqueDates)
        .query(`
          UPDATE [${schema}].[${packTable}]
          SET modules_creation_date = @uniqueDates
          WHERE Pack_ID = @packID AND Pack_No = @packNo
        `);
    });
  }
}

async function cleanupProcessedRecords(processedSrNos) {
  if (processedSrNos.length === 0) return;

  const uniqueSrNos = [...new Set(processedSrNos)];
  const chunkSize = 1000;
 
  for (let i = 0; i < uniqueSrNos.length; i += chunkSize) {
    const chunk = uniqueSrNos.slice(i, i + chunkSize);
    await withConnection('pool1', async (pool) => {
      await pool.request()
        .query(`DELETE FROM taco_treceability.master_compress_data WHERE sr_no IN (${chunk.join(',')})`);
    });
  }
  console.log(`Cleaned up ${uniqueSrNos.length} processed records`);
}

// Process control with circuit breaker pattern
let isProcessing = false;
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 5;
const RETRY_DELAY = 60000; // 1 minute

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
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log(' Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

// Start processing
console.log('Starting record processing service...');
console.log('[INFO] Completion tracking enabled - logging to taco_treceability_station_status_history');
setInterval(safeProcessRecords, 1000);

