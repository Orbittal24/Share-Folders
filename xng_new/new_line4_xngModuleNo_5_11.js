const net = require("net");
const sql = require("mssql");
const async = require("async");
const axios = require("axios");

require("dotenv").config({ path: ".env.local" });

// TCP Port
const TCP_PORT = 9562;

// MSSQL connection configuration
const misConfig = {
  user: "admin7",
  password: "admin7",
  server: "localhost\\MSSQLSERVER",
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

const xngconfig = {
  user: "admin7",
  password: "admin7",
  server: "localhost\\MSSQLSERVER",
  database: "ORBI",
  options: {
    encrypt: false,
    trustServerCertificate: false,
  },
  pool: {
    max: 20,
    min: 1,
    idleTimeoutMillis: 30000,
  },
};

// const xngconfig = {
//   user: "admin",
//   password: "#24Orbittal",
//   database: "ORBI",
//   server: "10.9.7.104",
//   options: {
//     encrypt: false,
//     trustServerCertificate: false,
//   },
//   pool: {
//     max: 20,
//     min: 1,
//     idleTimeoutMillis: 30000,
//   },
// };

// ============================================================db connection part end...................

// update module_barcode in running_production_count_lineX
async function update_moduleBarcode_inRunningProductionCount(
  battery_pack_name,
  pack_no,
  line_id,
  pack_id,
  module_name,
  module_number,
  moduleBarcode,
  today_date
) {
  try {
    // ✅ Step 1: Dynamic table name
    const tableName = `[cell_scanning_master].[dbo].[running_production_count_line${line_id}]`;

    // ✅ Step 2: Build SQL query
    const updateQuery = `
      UPDATE ${tableName}
      SET module_barcode = @module_barcode
      WHERE pack_name = @pack_name AND pack_no = @pack_no AND module_number = @module_number;
    `;

    // ✅ Step 3: Execute query
    const request = new sql.Request();
    request.input("module_barcode", sql.VarChar, moduleBarcode.trim());
    request.input("pack_name", sql.VarChar, battery_pack_name);
    request.input("pack_no", sql.VarChar, pack_no);
    request.input("module_number", sql.Int, module_number);

    const result = await request.query(updateQuery);

    console.log(`✅ Updated module_barcode successfully in ${tableName}`);
    console.log("📊 Rows affected:", result.rowsAffected[0]);

    return {
      status: "success",
      message: `Updated module_barcode for ${battery_pack_name} - ${pack_no} - Module ${module_number}`,
      rowsAffected: result.rowsAffected[0],
    };
  } catch (error) {
    console.error(
      "❌ Error in update_moduleBarcode_inRunningProductionCount:",
      error.message
    );
    return {
      status: "error",
      message: error.message,
    };
  }
}

// ✅ New helper function using xngconfig
async function select_cellqrFromXNG(
  battery_pack_name,
  pack_no,
  line_id,
  pack_id,
  module_name,
  module_number,
  moduleBarcode,
  today_date
) {
  let xngPool;
  try {
    console.log(
      "📦 select_cellqrFromXNG() called with ModuleBarcode:",
      moduleBarcode
    );

    xngPool = await sql.connect(xngconfig);

    const tables = ["tbl_orbi_ModulePressing1", "tbl_orbi_ModulePressing2"];
    let combinedResults = [];
    let foundTable = null;

    for (const tableName of tables) {
      const query = `
        SELECT TOP 1 *
        FROM [ORBI].[dbo].[${tableName}]
        WHERE ModuleBarcode1To7 = @ModuleBarcode
        ORDER BY LastUpdatedOn DESC;
      `;

      const result = await xngPool
        .request()
        .input("ModuleBarcode", sql.VarChar, moduleBarcode.trim())
        .query(query);

      if (result.recordset.length > 0) {
        console.log(`✅ Found record in ${tableName}`);
        console.table(
          result.recordset.map((r) => ({
            ModuleBarcode1To7: r.ModuleBarcode1To7,
            Varient: r.Varient,
            LastUpdatedOn: r.LastUpdatedOn,
          }))
        );

        // ✅ Add sourceTable info directly here
        const recordsWithSource = result.recordset.map((r) => ({
          ...r,
          sourceTable: tableName,
        }));

        combinedResults.push(...recordsWithSource);

        // ✅ Set foundTable as soon as data is found
        if (!foundTable) foundTable = tableName;

        // ✅ Optional: break early since you only need one successful table
        break;
      } else {
        console.log(`⚠️ No record found in ${tableName}`);
      }
    }

    if (combinedResults.length === 0) {
      console.log("❌ No matching ModuleBarcode found in either table.");
      return { status: "not_found", data: [] };
    }

    console.log("📊 Combined Result Count:", combinedResults.length);

    // ✅ Guaranteed sourceTable value
    return {
      status: "success",
      sourceTable: foundTable || (combinedResults[0]?.sourceTable ?? "unknown"),
      data: combinedResults,
    };
  } catch (error) {
    console.error("❌ Error in select_cellqrFromXNG:", error.message);
    return {
      status: "error",
      message: error.message,
    };
  } finally {
    if (xngPool) await xngPool.close().catch(() => {});
  }
}

// ✅ New function: select_cellqrOCVDataFromRedis
async function select_cellqrOCVDataFromRedis(
  battery_pack_name,
  pack_no,
  line_id,
  pack_id,
  module_name,
  module_number,
  moduleBarcode,
  today_date,
  cellqrResult,
  jwttoken
) {
  try {
    console.log("🚀 select_cellqrOCVDataFromRedis() called");

    if (!cellqrResult?.data?.length) {
      console.warn("⚠️ No cell QR data found to send to Redis API.");
      return { status: "no_data" };
    }

    // ✅ Extract all non-empty cell barcodes from result
    const cellData = cellqrResult.data[0];
    const completed_cellqrs = [];

    for (let i = 1; i <= 22; i++) {
      const val = cellData[`CellBarcode${i}`];
      if (val && val.trim() !== "") completed_cellqrs.push(val.trim());
    }

    console.log("📦 Extracted cell QR codes:", completed_cellqrs);

    if (completed_cellqrs.length === 0) {
      console.warn("⚠️ No valid cell QR codes found.");
      return { status: "no_valid_cellqrs" };
    }

    // ✅ API endpoint
    const apiURL = `${process.env.NEXT_PUBLIC_API_IP}/redis/cell_scanning/select_cellqrs_data_array`;

    // ✅ Build headers
    const headers = {
      Authorization: `Bearer ${jwttoken}`,
      "Content-Type": "application/json",
    };

    // ✅ Build request body
    const body = {
      cellqrs: completed_cellqrs,
      metadata: {
        battery_pack_name,
        pack_no,
        line_id,
        pack_id,
        module_name,
        module_number,
        moduleBarcode,
        today_date,
      },
    };

    // console.log("🌐 Sending request to Redis API:", apiURL);

    // ✅ Send POST request
    const response = await axios.post(apiURL, body, {
      headers,
      timeout: 30000,
    });

    // console.log("✅ Redis API response received successfully");
    console.dir(response.data, { depth: null });

    return { status: "success", data: response.data };
  } catch (error) {
    console.error("❌ Error in select_cellqrOCVDataFromRedis:", error.message);
    return { status: "error", message: error.message };
  }
}

// 🔹 Function: update_cellqr_InRunningProductionCount
async function update_cellqr_InRunningProductionCount(
  line_id,
  pack_no,
  pack_name,
  module_barcode,
  module_number,
  module_name,
  cellqrs,
  jwttoken,
  PLLoad,
  Distance,
  sourceTable
) {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_IP;
    const url = `${apiBase}/cell_scanning/update_completed_cellQR_data`;

    const headers = {
      Authorization: `Bearer ${jwttoken}`,
      "Content-Type": "application/json",
    };

    const update_body = {
      line_id,
      pack_no,
      pack_name,
      module_barcode,
      cellqrs,
    };

    console.log(
      "📤 Sending update_completed_cellQR_data payload:",
      update_body
    );

    const response = await axios.post(url, update_body, {
      headers,
      timeout: 60000,
    });

    const resData = response.data;
    console.log("✅ update_completed_cellQR_data response:", resData);

    // ✅ Check for errors in response
    if (
      resData?.errors &&
      Array.isArray(resData.errors) &&
      resData.errors.length > 0
    ) {
      console.warn("⚠️ Errors detected during update:", resData.errors);

      // 🔍 Check if any error message includes UNIQUE KEY constraint violation
      const hasUniqueKeyError = resData.errors.some(
        (err) =>
          typeof err.error === "string" &&
          err.error.includes("Violation of UNIQUE KEY constraint")
      );

      if (hasUniqueKeyError) {
        console.log(
          "🚨 UNIQUE KEY violation detected — triggering dummy cellqr update..."
        );

        // 🔁 Call update_Dummy_cellqr() only in this case
        const dummyResult = await update_Dummy_cellqr(
          line_id,
          pack_no,
          pack_name,
          module_barcode,
          module_number,
          module_name,
          cellqrs,
          jwttoken,
          resData.errors
        );

        console.log("🩵 update_Dummy_cellqr() result:", dummyResult);

        return { status: "xng_issue" };
      } else {
        console.log(
          "✅ No UNIQUE KEY violation found — skipping dummy update."
        );

        // ✅ Call add_compressionData() here
        const compressionResult = await add_compressionData(
          pack_name,
          pack_no,
          module_barcode,
          PLLoad,
          Distance,
          line_id,
          sourceTable
        );

        console.log("🧱 add_compressionData() result:", compressionResult);
      }
    }

    return { status: "success", data: resData };
  } catch (err) {
    console.error(
      "❌ Error in update_cellqr_InRunningProductionCount:",
      err.message
    );
    return { status: "error", message: err.message };
  }
}

// ✅ Function: Insert or Update compression data
async function add_compressionData(
  pack_name,
  pack_no,
  module_barcode,
  PLLoad,
  Distance,
  line_id,
  sourceTable
) {
  let misPool;

  try {
    // ✅ Connect to MIS database
    misPool = await sql.connect(misConfig);

    // ✅ Choose correct table based on sourceTable
    const tableName =
      sourceTable === "tbl_orbi_ModulePressing1"
        ? "[taco_treceability].[taco_treceability].[module_compression_details]"
        : "[taco_treceability].[taco_treceability].[module_compression_details2]";

    console.log(`🗂️ Using table: ${tableName}`);

    // ✅ Step 1: Check if record already exists
    const checkQuery = `
      SELECT COUNT(*) AS count
      FROM ${tableName}
      WHERE final_qrcode = @pack_no
        AND product_type = @pack_name
        AND module_number = @module_barcode;
    `;

    const checkResult = await misPool
      .request()
      .input("pack_no", sql.VarChar, pack_no)
      .input("pack_name", sql.VarChar, pack_name)
      .input("module_barcode", sql.VarChar, module_barcode)
      .query(checkQuery);

    const exists = checkResult.recordset[0]?.count > 0;

    if (exists) {
      // ✅ Step 2: Update existing record
      const updateQuery = `
       UPDATE ${tableName}
SET preload_value = @PLLoad,
    force_value = @Distance,
    today_date = CONVERT(VARCHAR(19), GETDATE(), 120)
WHERE final_qrcode = @pack_no
  AND product_type = @pack_name
  AND module_number = @module_barcode;

      `;

      const updateResult = await misPool
        .request()
        .input("PLLoad", sql.Float, PLLoad)
        .input("Distance", sql.Float, Distance)
        .input("pack_no", sql.VarChar, pack_no)
        .input("pack_name", sql.VarChar, pack_name)
        .input("module_barcode", sql.VarChar, module_barcode)
        .query(updateQuery);

      console.log(
        `🔁 Updated ${updateResult.rowsAffected[0]} record(s) in ${tableName}`
      );
      return { status: "updated", table: tableName };
    } else {
      // ✅ Step 3: Insert new record
      const insertQuery = `
        INSERT INTO ${tableName}
          ([final_qrcode], [module_number], [product_type],
           [preload_value], [force_value],
           [operator], [supervisor], [quality_check], [today_date], [line], [jobstatus])
        VALUES
          (@pack_no, @module_barcode, @pack_name,
           @PLLoad, @Distance,
           'XNG', 'XNG', 'XNG', GETDATE(), @line_id, 'OK');
      `;

      const insertResult = await misPool
        .request()
        .input("pack_no", sql.VarChar, pack_no)
        .input("module_barcode", sql.VarChar, module_barcode)
        .input("pack_name", sql.VarChar, pack_name)
        .input("PLLoad", sql.Float, PLLoad)
        .input("Distance", sql.Float, Distance)
        .input("line_id", sql.VarChar, line_id)
        .query(insertQuery);

      console.log(
        `✅ Inserted ${insertResult.rowsAffected[0]} new record(s) into ${tableName}`
      );
      return { status: "inserted", table: tableName };
    }
  } catch (err) {
    console.error("❌ Error in add_compressionData():", err.message);
    return { status: "error", message: err.message };
  } finally {
    if (misPool) await misPool.close().catch(() => {});
  }
}

// update Dummy cellqr in running_production_count_lineX cellqr same and cellqr count not match
async function update_Dummy_cellqr(
  line_id,
  pack_no,
  pack_name,
  module_barcode,
  module_number,
  module_name,
  cellqrs
) {
  const { v4: uuidv4 } = await import("uuid");

  try {
    const pool = await sql.connect(misConfig);
    const tableName = `[cell_scanning_master].[dbo].[running_production_count_line${line_id}]`;
    console.log(`🧩 Updating DUMMY cellqrs in: ${tableName}`);

    // 1️⃣ Get all rows to update (no filter on cellqr)
    const selectQuery = `
  SELECT sr_no
  FROM ${tableName}
  WHERE pack_name = @PackName
    AND pack_no = @PackNo
    AND module_number = @ModuleNumber;
`;
    const rowsToUpdate = await pool
      .request()
      .input("PackName", sql.VarChar, pack_name)
      .input("PackNo", sql.VarChar, pack_no)
      .input("ModuleNumber", sql.VarChar, String(module_number))
      .query(selectQuery);

    if (rowsToUpdate.recordset.length === 0) {
      console.warn("⚠️ No rows found for dummy update.");
      return { status: "no_rows", message: "No rows to update" };
    }

    console.log(`🔢 Rows to update: ${rowsToUpdate.recordset.length}`);

    // 2️⃣ Loop through each row and generate a unique dummy cellqr
    for (const row of rowsToUpdate.recordset) {
      const now = new Date();
      const formattedTime = now
        .toISOString()
        .replace(/[-T:.Z]/g, "")
        .slice(0, 17);
      const dummyCellQR = `DUMMY-${formattedTime}-${uuidv4().slice(0, 6)}`;

      const updateQuery = `
        UPDATE ${tableName}
        SET cellqr = @DummyCellQR,
            cellqr_status = 'incomplete',
            updated_dateTime = GETDATE()
        WHERE sr_no = @SrNo;
      `;

      await pool
        .request()
        .input("DummyCellQR", sql.VarChar, dummyCellQR)
        .input("SrNo", sql.Int, row.sr_no)
        .query(updateQuery);

      console.log(`✅ Updated sr_no ${row.sr_no} with ${dummyCellQR}`);
    }

    console.log("🎯 All dummy cellqrs updated successfully.");

    // 3️⃣ Delete from xng_from_BatteryPackModules
    const deleteQuery = `
      DELETE FROM [cell_scanning_master].[dbo].[xng_from_BatteryPackModules]
      WHERE battery_pack_name = @PackName
        AND pack_no = @PackNo
        AND moduleBarcode = @ModuleBarcode;
    `;

    const deleteResult = await pool
      .request()
      .input("PackName", sql.VarChar, pack_name)
      .input("PackNo", sql.VarChar, pack_no)
      .input("ModuleBarcode", sql.VarChar, module_barcode)
      .query(deleteQuery);

    if (deleteResult.rowsAffected[0] > 0) {
      console.log(
        `🗑️ Deleted ${deleteResult.rowsAffected[0]} record(s) from xng_from_BatteryPackModules`
      );
    } else {
      console.warn(
        `⚠️ No matching records found in xng_from_BatteryPackModules for pack=${pack_name}, pack_no=${pack_no}, module=${module_barcode}`
      );
    }

    return {
      status: "success",
      message: `Updated ${rowsToUpdate.recordset.length} dummy rows and deleted module record.`,
    };
  } catch (err) {
    console.error("❌ Error in update_Dummy_cellqr:", err.message);
    return { status: "error", message: err.message };
  } finally {
    sql.close();
  }
}

// 🔹 Function: delete_module_from_XNG
async function delete_module_from_XNG(
  moduleBarcode,
  packNo,
  packName,
  sourceTable
) {
  let pool;
  try {
    console.log(
      `🗑️ Deleting from ${sourceTable} | Module: ${moduleBarcode} | Pack: ${packNo} | Product: ${packName}`
    );

    // ✅ Validate table name
    const allowedTables = [
      "tbl_orbi_ModulePressing1",
      "tbl_orbi_ModulePressing2",
    ];
    if (!allowedTables.includes(sourceTable)) {
      throw new Error(`❌ Invalid table name: ${sourceTable}`);
    }

    // ✅ Connect to XNG database
    pool = await sql.connect(xngconfig);

    // ✅ Delete query (adjust columns if your table uses slightly different ones)
    const deleteQuery = `
      DELETE FROM [ORBI].[dbo].[${sourceTable}]
      WHERE ModuleBarcode1To7 = @ModuleBarcode;          
    `;

    const result = await pool
      .request()
      .input("ModuleBarcode", sql.VarChar, moduleBarcode.trim())
      .input("PackNo", sql.VarChar, packNo)
      .input("PackName", sql.VarChar, packName)
      .query(deleteQuery);

    if (result.rowsAffected[0] > 0) {
      console.log(
        `✅ Deleted ${result.rowsAffected[0]} record(s) from ${sourceTable}.`
      );
      return { status: "success", message: "Record deleted successfully." };
    } else {
      console.log("⚠️ No matching record found to delete.");
      return { status: "not_found", message: "No record found to delete." };
    }
  } catch (error) {
    console.error("❌ Error in delete_module_from_XNG:", error.message);
    return { status: "error", message: error.message };
  } finally {
    // ✅ Always close connection
    if (pool) await pool.close().catch(() => {});
  }
}

// ✅ New function: module_finalize for add data in module register and station status
async function module_finalize(
  line_id,
  pack_name,
  pack_id,
  pack_no,
  module_no,
  module_qr,
  jwttoken,
  sourceTable
) {
  console.log(
    "🧩 module_finalize() called with data:",
    line_id,
    pack_name,
    pack_id,
    pack_no,
    module_no,
    module_qr,
    sourceTable
  );

  let pool;

  try {
    pool = await sql.connect(misConfig);

    // 1  Step: Update dynamic table — module_status = 'complete'
    const dynamicTable = `[cell_scanning_master].[dbo].[running_production_count_line${line_id}]`;

    const updateQuery = `
      UPDATE ${dynamicTable}
      SET [module_status] = 'complete'
      WHERE [pack_no] = @Pack_No
        AND [pack_name] = @Pack_Name
        AND [module_number] = @Module_No
    `;

    console.log("📝 Updating module_status in dynamic table:", dynamicTable);

    const updateResult = await pool
      .request()
      .input("Pack_No", sql.VarChar, pack_no)
      .input("Pack_Name", sql.VarChar, pack_name)
      .input("Module_No", sql.VarChar, String(module_no))
      .query(updateQuery);

    console.log(
      `✅ Updated module_status = 'complete' in ${dynamicTable}. Rows affected:`,
      updateResult.rowsAffected
    );

    // 2 Step: Connect to SQL and fetch Pack_duplicate_checker
    const selectQuery = `
      SELECT TOP 1
       [Line_Id],
       [Pack_ID],
       [Pack_No],
       [pack_creation_Date],
       [new_series],
       [auto_reset_date]
FROM [cell_scanning_master].[dbo].[Pack_duplicate_checker]
WHERE [Pack_ID] = @Pack_ID
  AND [Pack_No] = @Pack_No
  AND [Line_Id] = @Line_Id
ORDER BY [srno] DESC;
    `;

    const result = await pool
      .request()
      .input("Pack_ID", sql.Int, pack_id)
      .input("Pack_No", sql.VarChar, pack_no)
      .input("Line_Id", sql.VarChar, line_id)
      .query(selectQuery);

    if (!result.recordset.length) {
      console.warn("⚠️ No matching record found in Pack_duplicate_checker.");
      return { status: "not_found" };
    }

    const record = result.recordset[0];
    const pack_creation_date = record.pack_creation_Date
      ? new Date(record.pack_creation_Date).toISOString()
      : null;

    console.log("✅ Fetched pack details:", record);

    // 2️⃣ Step: Call add_module_register API
    const register_body = {
      line_id: String(line_id),
      pack_name,
      pack_no,
      module_no: String(module_no),
      module_qr,
      pack_creation_date,
    };

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwttoken}`,
    };

    const apiBase = process.env.NEXT_PUBLIC_API_IP;
    const registerUrl = `${apiBase}/cell_scanning/add_module_register`;

    console.log("📤 Calling add_module_register API...");

    const registerRes = await axios.post(registerUrl, register_body, {
      headers,
      timeout: 30000,
    });

    console.log("✅ add_module_register response:", registerRes.data);

    if (registerRes.status !== 200) {
      throw new Error(
        `add_module_register failed with status ${registerRes.status}`
      );
    }

    // 3 Step: Call station_status/filter API
    const station_status_payload = {
      station_id: "28", // You can modify if you have real ID
      line_id,
      customer_qrcode: module_qr,
      station_status: "OK",
      checklist_name: "NA",
      substation_id: "NA",
    };

    const statusUrl = `${apiBase}/station_status/filter`;

    console.log("📤 Calling station_status/filter API...");

    // uncomment when goes in live production
    // const statusRes = await axios.post(statusUrl, station_status_payload, {
    //   headers: { "Content-Type": "application/json" },
    //   timeout: 30000,
    // });

    // console.log("✅ station_status/filter response:", statusRes.data);

    // 4 Step: Call check_pack_complete API
    const checkPackUrl = `${apiBase}/cell_scanning/check_pack_complete`;
    const bodyData = {
      line_id: Number(line_id),
      pack_name,
      pack_no,
    };

    await delete_module_from_XNG(module_qr, pack_no, pack_name, sourceTable);

    console.log("📤 Checking pack completion status...");

    const checkPackRes = await axios.post(checkPackUrl, bodyData, {
      headers,
      timeout: 30000,
    });

    const resultData = checkPackRes.data;

    if (checkPackRes.status === 200 && resultData.status === "complete") {
      console.log("✅ Pack complete:", resultData.message);

      // 🧩 New step: fetch and store data
      const fetchResult = await fetch_and_add_dataRunningPackCellDetails(
        line_id,
        pack_name,
        pack_no,
        module_number,
        jwttoken
      );

      if (fetchResult.status === "success") {
        console.log(
          "📦 Running Pack Cell Details fetched successfully:",
          fetchResult.data.length,
          "rows"
        );
      } else {
        console.warn(
          "⚠️ Failed to fetch Running Pack Cell Details:",
          fetchResult.message
        );
      }

      // 🟢 Step 5️⃣: Call shift_completePackData API
      const shiftCompleteUrl = `${apiBase}/cell_scanning/shift_completePackData`;
      const shiftBody = {
        line_id: Number(line_id),
        pack_name,
        pack_no,
      };

      try {
        console.log("📤 Calling shift_completePackData API...");
        const shiftCompleteRes = await axios.post(shiftCompleteUrl, shiftBody, {
          headers,
          timeout: 30000,
        });
        console.log(
          "✅ shift_completePackData response:",
          shiftCompleteRes.data
        );
      } catch (err) {
        console.error("❌ Error in shift_completePackData:", err.message);
      }

      // 🟢 Step 6️⃣: Call shift_running_pack_cell_details API
      const shiftRunningUrl = `${apiBase}/cell_scanning/shift_running_pack_cell_details`;
      try {
        console.log("📤 Calling shift_running_pack_cell_details API...");
        const shiftRunningRes = await axios.post(shiftRunningUrl, shiftBody, {
          headers,
          timeout: 30000,
        });
        console.log(
          "✅ shift_running_pack_cell_details response:",
          shiftRunningRes.data
        );
      } catch (err) {
        console.error(
          "❌ Error in shift_running_pack_cell_details:",
          err.message
        );
      }

      // 🟢 Step 7️⃣: Call redis/remove_usedcellqrFromRedis API
      const removeRedisUrl = `${apiBase}/cell_scanning/redis/remove_usedcellqrFromRedis`;
      try {
        console.log("📤 Calling remove_usedcellqrFromRedis API...");
        const removeRedisRes = await axios.post(removeRedisUrl, shiftBody, {
          headers,
          timeout: 30000,
        });
        console.log(
          "✅ remove_usedcellqrFromRedis response:",
          removeRedisRes.data
        );
      } catch (err) {
        console.error("❌ Error in remove_usedcellqrFromRedis:", err.message);
      }
    } else {
      console.log("⚠️ Pack not complete:", resultData.message);
    }

    return "ok";
    // return {
    //   status: "OK",
    //   // registerRes: registerRes.data,
    //   // statusRes: statusRes.data,
    //   // packCheck: resultData,
    // };
  } catch (error) {
    console.error("🔥 Error in module_finalize():", error.message);
    return { status: "error", message: error.message };
  } finally {
    if (pool) await pool.close().catch(() => {});
  }
}

// fetch and add data in running_pack_cell_details
const fetch_and_add_dataRunningPackCellDetails = async (
  line_id,
  pack_name,
  pack_no,
  module_number,
  token
) => {
  try {
    const tableName = `[cell_scanning_master].[dbo].[running_production_count_line${line_id}]`;

    console.log(
      `📦 Fetching from ${tableName} for pack=${pack_name}, pack_no=${pack_no}, module=${module_number}`
    );

    const pool = await sql.connect(misConfig);

    // ✅ 1. Fetch distinct batches and plant codes
    const distinctQuery = `
      SELECT DISTINCT cell_batch, cell_plantCode
      FROM ${tableName}
      WHERE pack_name = @pack_name AND pack_no = @pack_no
    `;
    const distinctResult = await pool
      .request()
      .input("pack_name", sql.VarChar, pack_name)
      .input("pack_no", sql.VarChar, pack_no)
      .query(distinctQuery);

    const distinctData = distinctResult.recordset;
    const distinctBatches = [
      ...new Set(distinctData.map((r) => r.cell_batch).filter(Boolean)),
    ];
    const distinctPlantCodes = [
      ...new Set(distinctData.map((r) => r.cell_plantCode).filter(Boolean)),
    ];

    console.log("🏭 Distinct Plant Codes:", distinctPlantCodes.join(", "));
    console.log("📦 Distinct Cell Batches:", distinctBatches.join(", "));

    // ✅ 2. Fetch the TOP 1 record for detailed info
    const topQuery = `
      SELECT TOP 1 *
      FROM ${tableName}
      WHERE pack_name = @pack_name AND pack_no = @pack_no AND module_number = @module_number
      ORDER BY updated_dateTime DESC;
    `;
    const topResult = await pool
      .request()
      .input("pack_name", sql.VarChar, pack_name)
      .input("pack_no", sql.VarChar, pack_no)
      .input("module_number", sql.VarChar, String(module_number))
      .query(topQuery);

    const data = topResult.recordset;
    console.log(`✅ Fetched ${data.length} top record(s).`);

    if (data.length === 0) {
      console.log("⚠️ No records found for this pack/module.");
      return { status: "not_found" };
    }

    const record = data[0];
    console.log("🔍 Top 1 Record Details:");
    console.table(record);

    const apiBase = process.env.NEXT_PUBLIC_API_IP;

    // ✅ 3. Call API: select_cellqr_ocv_category_master
    const ocvApiUrl = `${apiBase}/cell_scanning/select_cellqr_ocv_category_master`;
    const body = {
      voltage: record.cell_voltage,
      ir: record.cell_ir,
      k_value: record.cell_kvalue,
    };

    console.log("📤 Sending to select_cellqr_ocv_category_master:", body);

    const response = await axios.post(ocvApiUrl, body, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 30000,
    });

    const resultData = response.data;
    console.log("✅ OCV Category Response:", resultData);

    let categoryData = resultData?.data || {};
    if (resultData.success) {
      console.log("🎯 OCV Category Match:", categoryData);
    } else {
      console.warn("⚠️ No OCV category matched:", resultData.message);
    }

    // ✅ 4. Call API: select_allowed_batches
    const allowedBatchUrl = `${apiBase}/select_allowed_batches`;

    const allowedBatchesPayload = {
      pack_name: pack_name,
      line_id: line_id,
      batch: record.cell_batch,
      pack_id: record.pack_id,
      plant_code: record.cell_plantCode,
    };

    console.log("📤 Sending to select_allowed_batches:", allowedBatchesPayload);

    const allowedRes = await axios.post(
      allowedBatchUrl,
      allowedBatchesPayload,
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      }
    );

    const allowedData = allowedRes.data;
    console.log("✅ Allowed Batches Response:", allowedData);

    // ✅ 5. Call API: add_running_pack_cell_detail
    const addPackCellUrl = `${apiBase}/cell_scanning/add_running_pack_cell_detail`;

    const finalPayload = {
      pack_name: pack_name,
      pack_no: pack_no,
      line_no: String(line_id),
      plant_code: distinctPlantCodes.join(","),
      allowed_batches: (allowedData.allowed_batches || []).join(","),
      live_batches: distinctBatches.join(","),
      no_of_mix_plant_code: 1,
      allowed_batches_no: String(allowedData.no_of_allowed_batch_mix || 0),
      voltage_range: `${categoryData.voltage_range_from}-${categoryData.voltage_range_to}`,
      ir_range: `${categoryData.ir_range_from}-${categoryData.ir_range_to}`,
      kvalue_range: `${categoryData.k_value_range_from}-${categoryData.k_value_range_to}`,
      grade: categoryData.class_grade || "NA",
      soc_perc: 17,
      operator_name: "XNG",
      supervisor_name: "XNG",
      quality_check_by: "XNG",
      pack_id: record.pack_id,
      capacity: categoryData.capacity || "NA",
    };

    console.log(
      "🚀 API 6 Payload → add_running_pack_cell_detail:",
      finalPayload
    );

    const finalRes = await axios.post(addPackCellUrl, finalPayload, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 30000,
    });

    console.log("✅ Added Running Pack Cell Detail:", finalRes.data);

    return {
      status: "success",
      topRecord: record,
      ocvCategory: categoryData,
      allowedBatch: allowedData,
      addedPackDetail: finalRes.data,
      batches: distinctBatches,
      plantCodes: distinctPlantCodes,
    };
  } catch (err) {
    console.error(
      "❌ Error in fetch_and_add_dataRunningPackCellDetails():",
      err.message
    );
    return { status: "error", message: err.message };
  } finally {
    sql.close();
  }
};

// ✅ Example function (keep your actual DB logic here)
async function xngupdateInsertModuleNo(
  ModuleNumber,
  ModuleBarcode,
  pack_name,
  PackNumber,
  lineNo
) {
  let misPool;

  try {
    // Extract module name and polarity
    const moduleMatch = ModuleNumber.match(/^(\S+)\s*\(([^)]+)\)$/);
    let moduleName = ModuleNumber;
    let modulePolarity = null;

    if (moduleMatch) {
      moduleName = moduleMatch[1].trim();
      modulePolarity = `(${moduleMatch[2].trim()})`;
    }

    // console.log("🔍 Parsed:", { moduleName, modulePolarity });

    // ✅ Trim barcode before using
    ModuleBarcode = ModuleBarcode.trim();

    // ✅ Step 1️⃣: Connect to single pool (misConfig)
    misPool = await sql.connect(misConfig);

    // Step 2️⃣: Get Pack info
    const packResult = await misPool
      .request()
      .input("Pack_Name", sql.VarChar, pack_name).query(`
        SELECT [Pack_ID], [Pack_Name], [Total_Module_Count]
        FROM [taco_treceability_master].[taco_treceability].[master_pack]
        WHERE [Pack_Name] = @Pack_Name
      `);

    if (packResult.recordset.length === 0) {
      console.log("⚠️ No matching Pack found for:", pack_name);
      return "No matching records found";
    }

    const pack = packResult.recordset[0];
    console.log("✅ Found Pack:", pack);

    // Step 3️⃣: Get Module details using same connection
    const moduleResult = await misPool
      .request()
      .input("Pack_ID", sql.Int, pack.Pack_ID)
      .input("Module_Name", sql.VarChar, moduleName)
      .input("module_polarity", sql.VarChar, modulePolarity).query(`
        SELECT [Module_ID], [Module_Name], [Total_Cell_Count],
               [Pack_ID], [module_polarity], [module_series_name],
               [moduleNumber], [module_group_id]
        FROM [taco_treceability_master].[taco_treceability].[master_module]
        WHERE [Pack_ID] = @Pack_ID
          AND [Module_Name] = @Module_Name
          AND [module_polarity] = @module_polarity
      `);

    if (moduleResult.recordset.length === 0) {
      console.log("⚠️ No matching Module found for:", {
        moduleName,
        modulePolarity,
      });
      return "No matching records found";
    }

    const module = moduleResult.recordset[0];
    console.log("✅ Found Module:", module);

    // 🧩 Step 3.1 : Check if module already exists to prevent duplicate insert
    const duplicateCheck = await misPool
      .request()
      .input("battery_pack_name", sql.VarChar, pack.Pack_Name)
      .input("pack_no", sql.VarChar, PackNumber)
      .input("moduleBarcode", sql.VarChar, ModuleBarcode)
      .input("module_number", sql.Int, module.moduleNumber).query(`
        SELECT COUNT(*) AS count
        FROM [cell_scanning_master].[dbo].[xng_from_BatteryPackModules]
        WHERE [battery_pack_name] = @battery_pack_name
          AND [pack_no] = @pack_no
          AND ([moduleBarcode] = @moduleBarcode OR [module_number] = @module_number)
      `);

    const existsCount = duplicateCheck.recordset[0]?.count ?? 0;

    if (existsCount > 0) {
      console.log(
        `⚠️ Module already exists for Pack '${PackNumber}' (${pack_name}) — skipping insert.`
      );
      return "NOK";
    }

    // Step 4️⃣: Insert into xng_from_BatteryPackModules
    const insertResult = await misPool
      .request()
      .input("battery_pack_name", sql.VarChar, pack.Pack_Name)
      .input("pack_no", sql.VarChar, PackNumber)
      .input("pack_id", sql.Int, pack.Pack_ID)
      .input("line_id", sql.NVarChar, lineNo)
      .input("cellcount", sql.Int, module.Total_Cell_Count)
      .input(
        "module_name",
        sql.NVarChar,
        `${module.Module_Name} ${module.module_polarity}`
      )
      .input("module_number", sql.Int, module.moduleNumber)
      .input("moduleBarcode", sql.VarChar, ModuleBarcode).query(`
        INSERT INTO [cell_scanning_master].[dbo].[xng_from_BatteryPackModules]
          ([battery_pack_name], [pack_no], [pack_id], [line_id],
           [module_name], [module_number], [moduleBarcode], [cellcount])
        VALUES (@battery_pack_name, @pack_no, @pack_id, @line_id,
                @module_name, @module_number, @moduleBarcode, @cellcount)
      `);

    if (insertResult.rowsAffected[0] === 0) {
      console.error("❌ Insertion failed");
      return "Insertion Failed";
    }

    console.log("✅ Successfully inserted module record");

    // Step 5️⃣: Select and print inserted records for this pack
    const selectResult = await misPool
      .request()
      .input("battery_pack_name", sql.VarChar, pack_name)
      .input("pack_no", sql.VarChar, PackNumber).query(`
        SELECT [sr_no],
               [battery_pack_name],
               [pack_no],
               [line_id],
               [pack_id],
               [module_name],
               [module_number],
               [moduleBarcode],
               [cellcount],
               [today_date]
        FROM [cell_scanning_master].[dbo].[xng_from_BatteryPackModules]
        WHERE [battery_pack_name] = @battery_pack_name
          AND [pack_no] = @pack_no
        ORDER BY [sr_no] DESC
      `);

    console.log("📦 Inserted/Matching Records:");
    console.table(selectResult.recordset);

    // ✅ Step 5️⃣: Call next function with specific parameters
    const latestRecord = selectResult.recordset[0]; // latest record by sr_no
    if (latestRecord) {
      const {
        battery_pack_name,
        pack_no,
        line_id,
        pack_id,
        module_name,
        module_number,
        moduleBarcode,
        cellcount,
        today_date,
      } = latestRecord;

      const updateResult = await update_moduleBarcode_inRunningProductionCount(
        battery_pack_name,
        pack_no,
        line_id,
        pack_id,
        module_name,
        module_number,
        moduleBarcode,
        today_date
      );

      console.log(
        "🔁 update_moduleBarcode_inRunningProductionCount result:",
        updateResult
      );

      // ✅ Step: Call select_cellqrFromXNG next
      const cellqrResult = await select_cellqrFromXNG(
        battery_pack_name,
        pack_no,
        line_id,
        pack_id,
        module_name,
        module_number,
        moduleBarcode,
        today_date
      );

      console.log("🔍 select_cellqrFromXNG result:", cellqrResult);

      // ✅ Step: Validate cell count from select_cellqrFromXNG result
      if (
        cellqrResult?.status === "success" &&
        Array.isArray(cellqrResult.data) &&
        cellqrResult.data.length > 0
      ) {
        const record = cellqrResult.data[0];

        // Count non-empty cell barcodes (CellBarcode1...CellBarcode22)
        const cellBarcodes = Object.keys(record)
          .filter((key) => key.startsWith("CellBarcode") && record[key]?.trim())
          .map((key) => record[key]);

        const actualCount = cellBarcodes.length;
        const expectedCount = Number(cellcount);

        console.log(
          `🧮 Cell count from XNG: ${actualCount} / Expected: ${expectedCount}`
        );

        // ✅ Check for mismatch
        if (actualCount !== expectedCount) {
          const msg = `Cell count mismatch: Expected ${expectedCount}, but found ${actualCount} in XNG result`;
          console.warn(`⚠️ ${msg}`);

          // 3️⃣ Delete from xng_from_BatteryPackModules
          try {
            const deleteQuery = `
        DELETE FROM [cell_scanning_master].[dbo].[xng_from_BatteryPackModules]
        WHERE battery_pack_name = @PackName
          AND pack_no = @PackNo
          AND moduleBarcode = @ModuleBarcode;
      `;

            const deletePool = await sql.connect(misConfig);
            const deleteResult = await deletePool
              .request()
              .input("PackName", sql.VarChar, battery_pack_name)
              .input("PackNo", sql.VarChar, pack_no)
              .input("ModuleBarcode", sql.VarChar, moduleBarcode)
              .query(deleteQuery);

            console.log(
              `🗑️ Deleted ${deleteResult.rowsAffected[0]} record(s) from xng_from_BatteryPackModules due to mismatch.`
            );

            await deletePool.close();
          } catch (delErr) {
            console.error(
              "❌ Error deleting from xng_from_BatteryPackModules:",
              delErr.message
            );
          }

          // Return xng_issue after deletion
          return { status: "xng_issue", message: msg };
        }
      } else {
        const msg =
          "select_cellqrFromXNG returned no valid data — treating as XNG issue.";
        console.warn(`⚠️ ${msg}`);
        return { status: "xng_issue", message: msg };
      }

      // No duplicate, proceed with API flow
      const apiBase = process.env.NEXT_PUBLIC_API_IP;
      if (!apiBase)
        throw new Error("Environment variable NEXT_PUBLIC_API_IP is not set");

      const loginPayload = { username: "admin", password: "admin123" };
      console.log("🔐 Logging into API to fetch JWT token...");

      const res = await axios.post(`${apiBase}/login`, loginPayload);
      if (!res.data?.access_token)
        throw new Error("Login failed or token missing in response");

      const jwttoken = res.data.access_token;
      console.log("✅ JWT Token received successfully:", jwttoken);

      // ✅ Step: Call select_cellqrOCVDataFromRedis next
      const cellqrOCVResult = await select_cellqrOCVDataFromRedis(
        battery_pack_name,
        pack_no,
        line_id,
        pack_id,
        module_name,
        module_number,
        moduleBarcode,
        today_date,
        cellqrResult,
        jwttoken
      );

      console.log("🔍 select_cellqrOCVDataFromRedis result:", cellqrOCVResult);

      // ✅ Extract only found cells safely
      let found_cells = [];

      if (cellqrOCVResult?.data) {
        const data = cellqrOCVResult.data;
        if (Array.isArray(data.found)) found_cells = data.found;
      }

      // ✅ Log found cells
      console.log(
        "✅ Found cells from Redis:",
        found_cells.length,
        found_cells
      );

      // ✅ Extract PLLoad and Distance from the first record in cellqrResult.data
      const record = cellqrResult?.data?.[0] || {};
      const PLLoad = record.PLLoad ?? null;
      const Distance = record.Distance ?? null;

      // ✅ Determine which module_pressing table the data came from
      // (Assuming select_cellqrFromXNG() attaches this info in the response)
      const sourceTable =
        cellqrResult?.sourceTable ||
        record?.sourceTable ||
        "unknown_module_pressing_table";

      console.log(
        "📏 From XNG — PLLoad:",
        PLLoad,
        "Distance:",
        Distance,
        "| Source Table:",
        sourceTable
      );

      // ✅ Step: Call update_cellqr_InRunningProductionCount next
      const updateCellqrResult = await update_cellqr_InRunningProductionCount(
        line_id,
        pack_no,
        battery_pack_name,
        moduleBarcode,
        module_number,
        module_name,
        found_cells,
        jwttoken,
        PLLoad,
        Distance,
        sourceTable
      );

      console.log(
        "🔁 update_cellqr_InRunningProductionCount result:",
        updateCellqrResult
      );

      // 🔎 Handle returned status (xng_issue, success, etc.)
      if (updateCellqrResult.status === "xng_issue") {
        return "xng_issue";
      }

      // ✅ Extract updated count safely
      const updatedCount = Number(updateCellqrResult?.data?.updated_count ?? 0);
      const expectedCount = Number(cellcount);

      // ✅ Compare with expected cellcount
      if (updatedCount !== expectedCount) {
        console.warn(
          `⚠️ Mismatch detected: Expected ${expectedCount}, but only ${updatedCount} cellqrs were updated.`
        );

        // 🔁 Call update_Dummy_cellqr()
        const dummyResult = await update_Dummy_cellqr(
          line_id,
          pack_no,
          battery_pack_name,
          moduleBarcode,
          module_number,
          module_name,
          found_cells,
          jwttoken,
          updateCellqrResult?.data?.errors || []
        );

        console.log("🩵 update_Dummy_cellqr() result:", dummyResult);
        return "mis_issue";
      } else {
        console.log(
          "✅ Cell count matches. No need to call update_Dummy_cellqr()."
        );
      }

      // ✅ If we reached here — no xng_issue, no mis_issue → call module_finalize()
      if (
        updateCellqrResult?.status !== "xng_issue" &&
        updatedCount === expectedCount
      ) {
        console.log("🚀 All validations passed — calling module_finalize()...");

        try {
          const finalizeResult = await module_finalize(
            line_id,
            battery_pack_name,
            pack_id,
            pack_no,
            module_number,
            moduleBarcode,
            jwttoken,
            sourceTable
          );

          console.log(
            "✅ module_finalize() executed successfully.",
            finalizeResult
          );
          return finalizeResult; // optional: if you want to bubble up success
        } catch (finalizeErr) {
          console.error("❌ Error in module_finalize():", finalizeErr.message);
          // 🔁 Return mis_issue if any failure happens during module_finalize
          return { status: "mis_issue", message: finalizeErr.message };
        }
      }
    }

    return "OK"; //tempppppp
  } catch (error) {
    console.error("🔥 Error in xngupdateInsertModuleNo:", error.message);
    return "DB_ERROR";
  } finally {
    // Clean up
    if (misPool) await misPool.close().catch(() => {});
  }
}

// ✅ TCP Server
const server = net.createServer((socket) => {
  console.log("🔗 TCP client connected......");

  socket.on("data", async (data) => {
    try {
      const dataStr = data.toString().trim();
      if (!dataStr) throw new Error("Received empty data");

      const parsedData = JSON.parse(dataStr);
      console.log("📥 Received data from XNG...................:", parsedData);

      const {
        ModuleStartStop,
        ModuleNumber,
        ModuleBarcode,
        ModuleName,
        PackNumber,
        lineNo,
      } = parsedData;

      if (
        !ModuleStartStop ||
        !ModuleNumber ||
        !ModuleBarcode ||
        !ModuleName ||
        !PackNumber ||
        !lineNo
      ) {
        throw new Error("Invalid data format.");
      }

      // ✅ Send ModuleName as pack_name instead
      const pack_name = ModuleName;

      const result = await xngupdateInsertModuleNo(
        ModuleNumber,
        ModuleBarcode,
        pack_name,
        PackNumber,
        lineNo
      );

      console.log("DB result..last:", result);

      if (result === "OK") {
        console.log("✅ Operation successful for module");
        socket.write("ok");
      } else if (result === "NOK") {
        console.log("⚠️ Updating");
        socket.write("nok");
      } else if (typeof result === "object") {
        console.log("❌ Unexpected result (object):", result);
        socket.write(JSON.stringify(result)); // ✅ convert object to string
      } else {
        console.log("❌ Unexpected result (string):", result);
        socket.write(String(result)); // ✅ ensure even non-string primitives are handled safely
      }
    } catch (error) {
      console.error("Error processing TCP data:", error.message);
      socket.write("Error: " + error.message);
    }
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err.message);
  });

  socket.on("end", () => {
    console.log("🔌 TCP client disconnected.");
  });

  socket.on("close", (hadError) => {
    console.log(
      `TCP connection closed ${hadError ? "due to error" : "gracefully"}`
    );
  });
});

// Start TCP Server only
server.listen(TCP_PORT, () => {
  console.log(`🚀 TCP server listening on port ${TCP_PORT}`);
});
