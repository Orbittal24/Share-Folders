const net = require("net");
const sql = require("mssql");
const io = require("socket.io-client");
const axios = require("axios");

require("dotenv").config({ path: ".env.local" });

// ✅ Connect to Socket.IO server
const socketIO = io.connect("http://localhost:4041");

const TCP_PORT = 8746;

// ✅ MSSQL configuration
const targetConfig = {
  user: "admin7",
  password: "admin7",
  server: "localhost\\MSSQLSERVER",
  database: "taco_treceability",
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

// ✅ Socket.IO connection logs
socketIO.on("connect", () => console.log("✅ Connected to Socket.IO server."));
socketIO.on("error", (err) =>
  console.error("❌ Socket.IO error:", err.message)
);

// ✅ Insert duplicate pack record
async function insertDuplicatePack(ModuleName, PacklineNumber) {
  let pool;
  try {
    pool = await sql.connect(targetConfig);
    console.log("Inserting duplicate pack:", ModuleName, PacklineNumber);

    await pool
      .request()
      .input("ModuleName", sql.NVarChar, ModuleName)
      .input("PacklineNumber", sql.NVarChar, PacklineNumber).query(`
                INSERT INTO [taco_treceability].[xng_duplicate_pack] (pack_name, pack_no)
                VALUES (@ModuleName, @PacklineNumber)
            `);

    console.log("✅ Duplicate pack inserted successfully.");
  } catch (err) {
    console.error("❌ Insert failed:", err.message);
  } finally {
    if (pool) await pool.close();
  }
}



// ✅ Inserts running production count data
async function insert_RunningProductionCount(
  token,
  selectedPackID,
  newPackNo,
  selectedPack
) {
  try {
    const lineId = 4; // Always static value 4

    const productionCountPayload = {
      pack_id: String(selectedPackID),
      line_id: String(lineId),
      pack_no: String(newPackNo),
      pack_name: String(selectedPack),
    };

    console.log("🏭 Sending insert_RunningProductionCount request:", productionCountPayload);

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_IP}/cell_scanning/XNGrunning_production_count_insert`,
      productionCountPayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ XNGrunning_production_count_insert API Response:", response.data);

    return { success: true, data: response.data };
  } catch (error) {
    console.error("❌ Error calling XNGrunning_production_count_insert API:", error.message);

    if (error.response) {
      console.error("Response:", error.response.data);
      return { success: false, error: error.response.data };
    }

    return { success: false, error: error.message };
  }
}


//  Inserts pack status and module status
 async function insert_packStatus_moduleStatus(token, selectedPackID, newPackNo, pack_creation_date, selectedPack) {
  try {
    const stationId = 28; // static
    const lineId = 4;     // static

    const statusPayload = {
      station_id: String(stationId),
      line_id: String(lineId),
      pack_no: String(newPackNo),
      pack_id: String(selectedPackID),
      pack_creation_date: String(pack_creation_date),
      pack_name: String(selectedPack),
    };

    console.log("📦 Sending insert_packStatus_moduleStatus request:", statusPayload);

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_IP}/insert_pack_status`,
      statusPayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ insert_pack_status API Response:", response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("❌ Error calling insert_pack_status API:", error.message);

    if (error.response) {
      console.error("Response:", error.response.data);
      return { success: false, error: error.response.data };
    }

    return { success: false, error: error.message };
  }
}



// ✅ Inserts record into pack register
async function insert_pack_register(
  token,
  selectedPackID,
  newPackNo,
  pack_creation_date
) {
  try {
    const lineId = "4"; // Always "4" as a string

    const registerPayload = {
      line_id: String(lineId), // explicitly ensure it's a string
      pack_id: String(selectedPackID), // convert to string
      pack_no: String(newPackNo),
      pack_creation_date,
    };

    console.log("📦 Sending insert_pack_register request:", registerPayload);

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_IP}/cell_scanning/add_pack_register`,
      registerPayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ add_pack_register API Response:", response.data);

    return { success: true, data: response.data };
  } catch (error) {
    console.error("❌ Error calling add_pack_register API:", error.message);

    if (error.response) {
      console.error("Response:", error.response.data);
      return { success: false, error: error.response.data };
    }

    return { success: false, error: error.message };
  }
}


// Fetch pack creation date from API
async function select_packCreationDate(token, selectedPackID, newPackNo) {
  try {
    const selectDupPayload = {
      Pack_ID: selectedPackID,
      Pack_No: newPackNo,
    };

    console.log(
      "📤 Sending select_packCreationDate request:",
      selectDupPayload
    );

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_IP}/cell_scanning/select_pack_duplicate_chekar`,
      selectDupPayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // console.log("✅ select_pack_duplicate_chekar API Response:", response.data);

    return { success: true, data: response.data };
  } catch (error) {
    console.error(
      "❌ Error calling select_pack_duplicate_chekar API:",
      error.message
    );

    if (error.response) {
      console.error("Response:", error.response.data);
      return { success: false, error: error.response.data };
    }

    return { success: false, error: error.message };
  }
}

// ✅ Call insert_pack_duplicate_chekar API
async function insert_pack_duplicate_checkar(token, packId, packNo) {
  try {
    const insertDupPayload = {
      line_id: 4, // Always send line 4
      pack_id: packId, // Fetched Pack_ID from master pack
      pack_no: packNo, // PacklineNumber
    };

    console.log("📦 Sending insert duplicate check request:", insertDupPayload);

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_IP}/cell_scanning/insert_pack_duplicate_chekar`,
      insertDupPayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // console.log("✅ insert_pack_duplicate_chekar API Response:", response.data);

    return { success: true, data: response.data };
  } catch (error) {
    console.error(
      "❌ Error calling insert_pack_duplicate_chekar API:",
      error.message
    );

    if (error.response) {
      console.error("Response:", error.response.data);
      return { success: false, error: error.response.data };
    }

    return { success: false, error: error.message };
  }
}

// ModuleName = pack name
// PacklineNumber = pack  number


// ✅ TCP Server
const server = net.createServer((socket) => {
  console.log("🔗 TCP client connected.");

  socket.on("data", async (data) => {
    try {
      const dataStr = data.toString().trim();
      if (!dataStr) throw new Error("Received empty data.");

      const parsedData = JSON.parse(dataStr);
      console.log("📦 Received data:", parsedData);

      const { ModuleName, PacklineNumber, StartStop, Status } = parsedData;
      if (!ModuleName || !PacklineNumber || !StartStop || !Status) {
        throw new Error("Invalid data format.");
      }

      let pool;
      try {
        pool = await sql.connect(targetConfig);
      } catch (dbError) {
        console.error("❌ Database connection error:", dbError.message);
        socket.write("Database connection error.");
        return;
      }

      const trimmedPacklineNumber = PacklineNumber.trim();
      console.log("➡️ Checking module:", ModuleName, trimmedPacklineNumber);

      // Step 1️⃣: Get Pack_ID from master_pack
      const packIdResult = await pool
        .request()
        .input("ModuleName", sql.VarChar, ModuleName).query(`
          SELECT TOP 1 [Pack_ID], [Pack_Name], [Total_Module_Count]
          FROM [taco_treceability_master].[taco_treceability].[master_pack]
          WHERE [Pack_Name] = @ModuleName;
        `);

      if (packIdResult.recordset.length === 0) {
        console.log("❌ Pack not found in master_pack:", ModuleName);
        socket.write("nok");
        return;
      }

      const packId = packIdResult.recordset[0].Pack_ID;
      console.log("✅ Found Pack_ID:", packId);

      // Step 2️⃣: Check for duplicate in Pack_duplicate_checker
      const duplicateCheck = await pool
        .request()
        .input("PackId", sql.Int, packId)
        .input("PacklineNumber", sql.VarChar, trimmedPacklineNumber).query(`
          SELECT [srno], [Line_Id], [Pack_ID], [Pack_No], [pack_creation_Date], [new_series], [auto_reset_date]
          FROM [cell_scanning_master].[dbo].[Pack_duplicate_checker]
          WHERE [Pack_ID] = @PackId AND [Pack_No] = @PacklineNumber;
        `);

      if (duplicateCheck.recordset.length > 0) {
        console.log("⚠️ Duplicate pack detected in Pack_duplicate_checker.");
        socket.write("nok");
        return;
      }

      // No duplicate, proceed with API flow
      const apiBase = process.env.NEXT_PUBLIC_API_IP;
      if (!apiBase) throw new Error("Environment variable NEXT_PUBLIC_API_IP is not set");

      const loginPayload = { username: "admin", password: "admin123" };
      console.log("🔐 Logging into API to fetch JWT token...");

      const res = await axios.post(`${apiBase}/login`, loginPayload);
      if (!res.data?.access_token) throw new Error("Login failed or token missing in response");

      const jwttoken = res.data.access_token;
      console.log("✅ JWT Token received successfully:", jwttoken);

      // -------------------------------
      // 🚀 Unified execution wrapper
      // -------------------------------
      async function runStep(fn, label) {
        const result = await fn;
        console.log(`📩 ${label} result:`, result);

        if (!result?.success) {
          throw new Error(`${label} failed: ${JSON.stringify(result?.error || result)}`);
        }
        return result;
      }

      // ✅ 1️⃣ Insert duplicate checker
      await runStep(
        insert_pack_duplicate_checkar(jwttoken, packId, PacklineNumber),
        "insert_pack_duplicate_checkar()"
      );

      // ✅ 2️⃣ Select pack creation date
      const selectResult = await runStep(
        select_packCreationDate(jwttoken, packId, PacklineNumber),
        "select_packCreationDate()"
      );

      const pack_creation_date =
        selectResult?.data?.data?.[0]?.pack_creation_Date ||
        selectResult?.data?.data?.[0]?.pack_creation_date ||
        null;

      if (!pack_creation_date) {
        throw new Error("⚠️ pack_creation_date not found in select_packCreationDate response.");
      }

      console.log("📅 Extracted pack_creation_date:", pack_creation_date);

      // ✅ 3️⃣ Insert pack register
      await runStep(
        insert_pack_register(jwttoken, packId, PacklineNumber, pack_creation_date),
        "insert_pack_register()"
      );

      // ✅ 4️⃣ Insert pack & module status
      // await runStep(
      //   insert_packStatus_moduleStatus(
      //     jwttoken,
      //     packId,
      //     PacklineNumber,
      //     pack_creation_date,
      //     ModuleName
      //   ),
      //   "insert_packStatus_moduleStatus()"
      // );

      // ✅ 5️⃣ Insert running production count
      await runStep(
        insert_RunningProductionCount(jwttoken, packId, PacklineNumber, ModuleName),
        "insert_RunningProductionCount()"
      );

      // ✅ If all steps succeed
      socket.write("ok");
      console.log("🎉 All operations completed successfully.");

    } catch (error) {
      console.error("❌ Error processing TCP data:", error.message);
      socket.write("nok");
    }
  });

  socket.on("error", (err) => {
    console.error("⚠️ TCP socket error:", err.message);
  });

  socket.on("end", () => {
    console.log("🔚 TCP client disconnected.");
  });

  socket.on("close", (hadError) => {
    console.log(`🔒 TCP connection closed ${hadError ? "with error" : "gracefully"}.`);
  });
});



// ✅ Start only TCP Server
server.listen(TCP_PORT, () => {
  console.log(`🚀 TCP server running continuously on port ${TCP_PORT}`);
});
