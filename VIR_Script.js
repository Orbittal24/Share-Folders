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


// ===== Update Voltage IR Station Status =====
async function UpdateVolageIRStationStatus(body) {
  try {
    // Build the payload for API
    const payload = {
      station_id: 30, // fixed or can be body.StationID
      line_id: body.line_id || "",     // update if dynamic
      customer_qrcode: body.customer_qrcode || "", // assuming Pack_number holds QR
      station_status: "OK",
      checklist_name: "NA",
      substation_id: "NA"
    };

    const response = await axios.post(
      "http://localhost:9999/station_status/filter",
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    console.log(`📡 Station status updated for QR: ${payload.customer_qrcode}`, response.data);
  } catch (err) {
    console.error("❌ Error updating station status:", err.message);
  }
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

           const Iterlockbody = {
          line_id: Line_ID,
          customer_qrcode: module_barcode,
        };

        const monthyear = formatDateForTable(firstRow.test_date);
        const tableName = `VIR_Register_${monthyear}`;

        await insertIntoVIR(pool, tableName, body);

        await UpdateVolageIRStationStatus(Iterlockbody);

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


C:\Users\C01063714\Desktop\VIR_OldToNew_Script>node VIR_OldToNewScript.js
❌ Main error: Server requires encryption, set 'encrypt' config option to true.


    ------------------------------------------------------------------------------------------------------------------------

    python clinet side service VIR 



import os
import time
import threading
import serial
import pandas as pd
import requests
from datetime import datetime

# -----------------------------
# Globals
# -----------------------------
serial_port = None
line_id = None
latest_data = {"voltage": "0.00", "resistance": "0.00", "timestamp": datetime.utcnow().isoformat()}
last_was_default = True
stop_event = threading.Event()

# -----------------------------
# Excel Config Reader
# -----------------------------
def read_com_port():
    """Reads COM port + Line from Excel file"""
    global line_id
    try:
        excel_path = os.path.join(os.path.dirname(__file__), "config", "com_port_config.xlsx")
        print(f"[CONFIG] Reading Excel: {excel_path}")
        df = pd.read_excel(excel_path)
        line_id = df.loc[0, "Line"]  # Expect column "Line"
        print(f"[CONFIG] Line ID = {line_id}")

        # COM port can also be read from Excel, here hardcoded to COM3
        com_port = "COM3"
        print(f"[CONFIG] Using COM port: {com_port}")
        return com_port
    except Exception as e:
        print(f"[CONFIG ERROR] {e}, falling back to COM3")
        return "COM3"

# -----------------------------
# Serial Port Init
# -----------------------------
def initialize_serial_port():
    """Initializes or reinitializes the serial port connection"""
    global serial_port, stop_event
    com_port = read_com_port()

    try:
        if serial_port and serial_port.is_open:
            print("[SERIAL] Closing previous port...")
            serial_port.close()

        serial_port = serial.Serial(
            port=com_port,
            baudrate=9600,
            bytesize=serial.EIGHTBITS,
            parity=serial.PARITY_NONE,
            stopbits=serial.STOPBITS_ONE,
            timeout=1
        )
        print(f"[SERIAL] Port {com_port} opened successfully")

        # Start background reader
        stop_event.clear()
        threading.Thread(target=serial_reader, daemon=True).start()

        # Send initial commands
        send_initial_commands()

    except Exception as e:
        print(f"[SERIAL ERROR] Failed to open port {com_port}: {e}")

# -----------------------------
# Serial Reader
# -----------------------------
def serial_reader():
    """Continuously reads from the serial port"""
    global latest_data, last_was_default
    print("[SERIAL] Reader thread started")
    while not stop_event.is_set():
        try:
            if serial_port and serial_port.in_waiting:
                raw = serial_port.readline().decode(errors="ignore").strip()
                if raw:
                    print(f"[DATA RAW] {raw}")
                    process_serial_data(raw)
        except Exception as e:
            print(f"[SERIAL ERROR] Reader exception: {e}")
        time.sleep(0.1)

# -----------------------------
# Data Processor
# -----------------------------
def process_serial_data(data):
    """Parses and processes incoming serial data"""
    global latest_data, last_was_default
    clean_data = data.strip()
    print(f"[DATA PROCESS] {clean_data}")

    if "E" in clean_data and "," in clean_data:
        values = [v.strip() for v in clean_data.split(",")]
        if len(values) >= 2:
            try:
                ir_value = float(values[0])
                formatted_ir = f"{abs(ir_value * 1000):.2f}"

                voltage_value = float(values[1].replace("V", "").replace(" ", ""))
                formatted_voltage = f"{abs(voltage_value):.3f}"

                MAX_VALID = 1000
                if abs(ir_value) >= MAX_VALID or abs(voltage_value) >= MAX_VALID:
                    print("[DATA PROCESS] Default values detected, ignoring...")
                    last_was_default = True
                    return

                if last_was_default:
                    latest_data = {
                        "voltage": formatted_voltage,
                        "resistance": formatted_ir,
                        "timestamp": datetime.utcnow().isoformat(),
                        "line_no": line_id
                    }
                    print(f"[DATA PROCESS] Valid measurement: {latest_data}")
                    send_to_fastapi(latest_data)
                    last_was_default = False
                else:
                    print("[DATA PROCESS] Skipping continuous valid value")
            except Exception as e:
                print(f"[DATA ERROR] Failed parsing values: {e}")

# -----------------------------
# Command Sender
# -----------------------------
def send_initial_commands():
    """Sends initial setup commands and starts periodic fetch"""
    if not serial_port:
        return
    cmds = ["*IDN?", ":MEASure:RESistance?", ":MEMory:STATe ON"]
    for cmd in cmds:
        print(f"[COMMAND] {cmd}")
        serial_port.write((cmd + "\n").encode())

    def periodic_fetch():
        while not stop_event.is_set():
            try:
                if serial_port:
                    print("[COMMAND PERIODIC] :FETch?")
                    serial_port.write(b":FETch?\n")
            except Exception as e:
                print(f"[COMMAND ERROR] {e}")
            time.sleep(1)

    threading.Thread(target=periodic_fetch, daemon=True).start()

# -----------------------------
# Send to FastAPI
# -----------------------------
def send_to_fastapi(data):
    """Sends processed data to external FastAPI server"""
    try:
        url = "https://misapp.tataautocomp.com:5555/api/measurements"
        payload = {
            "voltage": data["voltage"],
            "resistance": data["resistance"],
            "timestamp": datetime.utcnow().isoformat(),
            "line_no": data.get("line_no", line_id)
        }
        r = requests.post(url, json=payload, verify=False, timeout=5)
        print("[FASTAPI] Response:", r.text)
    except Exception as e:
        print(f"[FASTAPI ERROR] {e}")

# -----------------------------
# Main
# -----------------------------
if __name__ == "__main__":
    initialize_serial_port()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        stop_event.set()
        if serial_port and serial_port.is_open:
            serial_port.close()
        print("Script stopped")


