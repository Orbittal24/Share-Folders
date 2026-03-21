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

// const fetch_and_add_dataRunningPackCellDetails = async (line_id, pack_name, pack_no, module_number, token) => {
//   try {
//     const tableName = `[cell_scanning_master].[dbo].[running_production_count_line${line_id}]`;

//     console.log(`📦 Fetching from ${tableName} for pack=${pack_name}, pack_no=${pack_no}, module=${module_number}`);

//     const pool = await sql.connect(misConfig);

//     // ✅ 1. Fetch distinct batches and plant codes
//     const distinctQuery = `
//       SELECT DISTINCT cell_batch, cell_plantCode
//       FROM ${tableName}
//       WHERE pack_name = @pack_name AND pack_no = @pack_no
//     `;
//     const distinctResult = await pool
//       .request()
//       .input("pack_name", sql.VarChar, pack_name)
//       .input("pack_no", sql.VarChar, pack_no)
//       .query(distinctQuery);

//     const distinctData = distinctResult.recordset;
//     const distinctBatches = [...new Set(distinctData.map((r) => r.cell_batch).filter(Boolean))];
//     const distinctPlantCodes = [...new Set(distinctData.map((r) => r.cell_plantCode).filter(Boolean))];

//     console.log("🏭 Distinct Plant Codes:", distinctPlantCodes.join(", "));
//     console.log("📦 Distinct Cell Batches:", distinctBatches.join(", "));

//     // ✅ 2. Fetch the TOP 1 record for detailed info
//     const topQuery = `
//       SELECT TOP 1 *
//       FROM ${tableName}
//       WHERE pack_name = @pack_name AND pack_no = @pack_no AND module_number = @module_number
//       ORDER BY updated_dateTime DESC;
//     `;
//     const topResult = await pool
//       .request()
//       .input("pack_name", sql.VarChar, pack_name)
//       .input("pack_no", sql.VarChar, pack_no)
//       .input("module_number", sql.VarChar, String(module_number))
//       .query(topQuery);

//     const data = topResult.recordset;
//     console.log(`✅ Fetched ${data.length} top record(s).`);

//     if (data.length > 0) {
//       console.log("🔍 Top 1 Record Details:");
//       console.table(data[0]);
//     } else {
//       console.log("⚠️ No records found for this pack/module.");
//     }

//     return { status: "success", data };
//   } catch (err) {
//     console.error("❌ Error in fetch_and_add_dataRunningPackCellDetails():", err.message);
//     return { status: "error", message: err.message };
//   } finally {
//     sql.close();
//   }
// };


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

    const allowedRes = await axios.post(allowedBatchUrl, allowedBatchesPayload, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 30000,
    });

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

    console.log("🚀 API 6 Payload → add_running_pack_cell_detail:", finalPayload);

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




// ✅ Run as async IIFE
(async () => {
  const fetchResult = await fetch_and_add_dataRunningPackCellDetails(
    4,
    "Tamor",
    "000090",
    1,
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTc2MzAzNTE5Mn0.tiutVdr5CtXeK-C4aLrR7rL2xLFjky_3slN4SafV_Og"
  );

  if (fetchResult.status === "success") {
    console.log("📦 Running Pack Cell Details fetched successfully");
  } else {
    console.warn("⚠️ Failed to fetch Running Pack Cell Details:", fetchResult.message);
  }
})();
