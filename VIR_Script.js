trigger
USE [taco_treceability]
GO
/****** Object:  Trigger [taco_treceability].[trg_InsertCompleted_ToMirror]    Script Date: 9/3/2025 6:12:42 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER TRIGGER [taco_treceability].[trg_InsertCompleted_ToMirror]
ON [taco_treceability].[taco_treceability].[test_cell_table_completed]
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO [taco_treceability].[taco_treceability].[test_cell_table_completed_mirror] (
        [point_1],
        [point_2],
        [voltage],
        [IR],
        [status],
        [bms_no],
        [battery_id],
        [final_qrcode],
        [module_barcode],
        [actual_no],
        [remark_by],
        [checked_by],
        [made_by],
        [module_group],
        [test_date],
        [shift],
        [min_voltage],
        [max_voltage],
        [diff_min_max],
        [total_v],
        [total_IR],
        [bypass_operator],
        [bypass_reason],
        [bypass_date],
        [ibb_barcode]
    )
    SELECT
        [point_1],
        [point_2],
        [voltage],
        [IR],
        [status],
        [bms_no],
        [battery_id],
        [final_qrcode],
        [module_barcode],
        [actual_no],
        [remark_by],
        [checked_by],
        [made_by],
        [module_group],
        [test_date],
        [shift],
        [min_voltage],
        [max_voltage],
        [diff_min_max],
        [total_v],
        [total_IR],
        [bypass_operator],
        [bypass_reason],
        [bypass_date],
        [ibb_barcode]
    FROM inserted;
END



USE [taco_treceability]
GO

INSERT INTO [taco_treceability].[test_cell_table_completed_dummy_anil]
           ([point_1]
           ,[point_2]
           ,[voltage]
           ,[IR]
           ,[status]
           ,[bms_no]
           ,[battery_id]
           ,[final_qrcode]
           ,[module_barcode]
           ,[actual_no]
           ,[remark_by]
           ,[checked_by]
           ,[made_by]
           ,[module_group]
           ,[test_date]
           ,[shift]
           ,[min_voltage]
           ,[max_voltage]
           ,[diff_min_max]
           ,[total_v]
           ,[total_IR]
           ,[bypass_operator]
           ,[bypass_reason]
           ,[bypass_date]
           ,[ibb_barcode])
     VALUES
           ('8403182'  -- point_1 (varchar)
           ,'A'        -- point_2 (varchar)
           ,'B'        -- voltage (varchar) - Note: This seems unusual (typically numeric)
           ,'3.22'     -- IR (varchar) - Note: This seems swapped with voltage
           ,'0.279'    -- status (varchar) - Note: Check if this is correct
           ,'NULL'     -- bms_no (varchar)
           ,'-'        -- battery_id (varchar)
           ,'DJ2028-F930002420'  -- final_qrcode (varchar)
           ,'01TMB04T100024E930200013'  -- module_barcode (varchar)
           ,'49'       -- actual_no (varchar)
           ,'Voltage:48.256 | IR:4.181'  -- remark_by (varchar)
           ,'line-4'   -- checked_by (varchar)
           ,'dhananjay'-- made_by (varchar)
           ,'C4'       -- module_group (varchar)
           ,'2024-9-03 9:32:10'  -- test_date (varchar)
           ,'1'        -- shift (varchar)
           ,'3.213'    -- min_voltage (varchar)
           ,'3.22'     -- max_voltage (varchar)
           ,'0.007000000000000117'  -- diff_min_max (varchar)
           ,NULL       -- total_v (varchar) - null
           ,NULL       -- total_IR (varchar) - null
           ,NULL       -- bypass_operator (varchar) - null
           ,NULL       -- bypass_reason (varchar) - null
           ,NULL       -- bypass_date (datetime) - null
           ,NULL)      -- ibb_barcode (varchar) - null
GO



const sql = require("mssql");
const axios = require("axios");

// ===== DB CONFIG =====
const configSource = {
  user: "admin1",
  password: "admin1",
  server: "DESKTOP-RREMJUE",
  database: "register_taco_treceability_VIR", // target DB
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

// ===== Format test_date → dd_mm_yy =====
function formatDateForTable(date) {
  const d = new Date(date);
  const yy = d.getFullYear().toString().slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${dd}_${mm}_${yy}`;
}

// ===== Fetch rows from Mirror Table =====
async function fetchMirrorRows(pool) {
  const result = await pool
    .request()
    .query("SELECT * FROM [taco_treceability].[taco_treceability].[test_cell_table_completed_mirror]");
  return result.recordset;
}

// ===== Group rows by module_barcode =====
function groupByModuleBarcode(rows) {
  const grouped = {};

  for (const row of rows) {
    const barcode = row.module_barcode;
    if (!barcode) continue;

    if (!grouped[barcode]) {
      grouped[barcode] = {
        rows: [],
        voltages: [],
        irs: [],
      };
    }

    grouped[barcode].rows.push(row);

    if (row.voltage !== null && row.voltage !== undefined) {
      grouped[barcode].voltages.push(row.voltage);
    }
    if (row.IR !== null && row.IR !== undefined) {
      grouped[barcode].irs.push(row.IR);
    }
  }

  return grouped;
}

// ===== Ensure Table Exists =====
async function ensureTableExists(pool, tableName) {
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='${tableName}' AND xtype='U')
    BEGIN
      CREATE TABLE [dbo].[${tableName}](
        [srno] [int] IDENTITY(1,1) NOT NULL,
        [PackID] [int] NULL,
        [Voltage_Points] [varchar](max) NULL,
        [IR_Points] [varchar](max) NULL,
        [Output_Voltage] [decimal](10, 2) NULL,
        [Timestamp] [datetime] NULL,
        [StationID] [int] NULL,
        [ModuleID] [int] NULL,
        [Status] [varchar](10) NULL,
      [checked_by][varchar](100) NULL,
      [made_by][varchar](100) NULL,
      [Insulation_value][varchar](50) NULL,
      [Pack_number][varchar](50) NULL,
        PRIMARY KEY CLUSTERED ([srno] ASC)
      ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY];
    END
  `);
}

// ===== Insert into VIR_Register table =====
async function insertIntoVIR(pool, tableName, body) {
  await ensureTableExists(pool, tableName);

  await pool.request()
    .input("PackID", sql.Int, body.PackID)
    .input("Voltage_Points", sql.VarChar(sql.MAX), body.Voltage_Points)
    .input("IR_Points", sql.VarChar(sql.MAX), body.IR_Points)
    .input("Output_Voltage", sql.Decimal(10, 2), body.Output_Voltage)
    .input("Timestamp", sql.DateTime, body.Timestamp)
    .input("StationID", sql.Int, body.StationID)
    .input("ModuleID", sql.Int, body.ModuleID)
    .input("Status", sql.VarChar(10), body.Status)
    .input("checked_by", sql.VarChar(100), body.checked_by)
    .input("made_by", sql.VarChar(100), body.made_by)
    .input("Insulation_value", sql.VarChar(50), body.Insulation_value)
    .input("Pack_number", sql.VarChar(50), body.Pack_number)
    .query(`
      INSERT INTO [dbo].[${tableName}]
      (PackID, Voltage_Points, IR_Points, Output_Voltage, Timestamp, StationID, ModuleID, Status, checked_by, made_by, Insulation_value, Pack_number)
      VALUES (@PackID, @Voltage_Points, @IR_Points, @Output_Voltage, @Timestamp, @StationID, @ModuleID, @Status, @checked_by, @made_by, @Insulation_value, @Pack_number)
    `);
}

// ===== Main Processing =====
async function main() {
  try {
    const pool = await sql.connect(configSource);

    const rows = await fetchMirrorRows(pool);
    console.log(`📥 Fetched ${rows.length} rows from mirror`);

    if (rows.length === 0) {
      console.log("⚠️ No rows to process.");
      return;
    }

    const grouped = groupByModuleBarcode(rows);
    console.log(`🔄 Grouped into ${Object.keys(grouped).length} module_barcodes`);

    for (const [module_barcode, data] of Object.entries(grouped)) {
      try {
        const firstRow = data.rows[0];

        // 🔹 Fetch ModuleID, PackID, PackNumber from API
        const nomenRes = await axios.get(
          `http://localhost:9999/fetch_nomenclature/${module_barcode}`
        );
        // const { ModuleID, PackID, PackNumber } = nomenRes.data;

        // console.log("nomenRes.data",nomenRes.data.ModuleID, nomenRes.data.PackID, nomenRes.data.PackNumber);

                const nomen = nomenRes.data[0]; // pick first row
                const PackID = nomen.Pack_ID;
              const ModuleID = nomen.Module_ID;
               const PackNumber = nomen.Pack_No; 

        // 🔹 Build body for insert
        const body = {
          PackID: PackID || null,
          Voltage_Points: data.voltages.join(","),
          IR_Points: data.irs.join(","),
          Output_Voltage: firstRow.voltage || 0,
          Timestamp: firstRow.test_date || new Date(),
          StationID: 23,
          ModuleID: ModuleID || null,
          Status: firstRow.status === "OK" ? "Pass" : "Fail",
          checked_by: firstRow.checked_by || "",
          made_by: firstRow.made_by || "",
          Insulation_value:"550",
          Pack_number: PackNumber || "",
        };

        const monthyear = formatDateForTable(firstRow.test_date);
        const tableName = `VIR_Register_${monthyear}`;

        await insertIntoVIR(pool, tableName, body);



        console.log(`✅ Inserted ${module_barcode} into ${tableName}`,body);

        // 🔹 Delete from mirror
        // await pool.request()
        //   .input("module_barcode", sql.VarChar, module_barcode)
        //   .query(`
        //     DELETE FROM [taco_treceability].[taco_treceability].[test_cell_table_completed_mirror]
        //     WHERE module_barcode = @module_barcode
        //   `);

        console.log(`🗑️ Deleted ${module_barcode} from mirror`);
      } catch (err) {
        console.error(`❌ Error processing ${module_barcode}:`, err.message);
      }
    }

    await pool.close();
  } catch (err) {
    console.error("❌ Main error:", err.message);
  }
}

main();

