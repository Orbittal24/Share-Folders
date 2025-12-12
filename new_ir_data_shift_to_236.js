const sql = require('mssql');
const axios = require('axios');
const stringSimilarity = require('string-similarity');

const sqlConfig1 = {
  user: "user_mis",
  password: "admin",
  database: "taco_treceability",
  server: '10.9.4.28',
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  options: { encrypt: true, trustServerCertificate: true }
};

const sqlConfig2 = {
  user: "user_mis",
  password: "admin",
  database: "taco_treceability_master",
  server: '10.9.4.28',
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  options: { encrypt: true, trustServerCertificate: true }
};

const sqlConfig3 = {
  user: "user_mis",
  password: "admin",
  database: "master_taco_treceability_IR",
  server: '10.9.4.28',
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  options: { encrypt: true, trustServerCertificate: true }
};

let lastSeenSrNo = 0;
let pool1, pool2, pool3;

const startFetchLoop = async () => {
  await fetchLatestRows();
};

const init = async () => {
  try {
    pool1 = await new sql.ConnectionPool(sqlConfig1).connect();
    console.log("Connected to 10.9.4.28 taco_treceability");

    pool2 = await new sql.ConnectionPool(sqlConfig2).connect();
    console.log("Connected to 10.9.4.28 taco_treceability_master");

    pool3 = await new sql.ConnectionPool(sqlConfig3).connect();
    console.log("Connected to 10.9.4.28 master_taco_treceability_IR");

    // setInterval(fetchLatestRows, 4000);
    startFetchLoop();
  } catch (err) {
    console.error("Error connecting to databases:", err);
  }
};

const normalizeProcess = (text) =>
  text.toLowerCase()
      .replace(/[^a-z0-9+\/\-()& ]/g, '')  // Preserve +, /, -, (), &
      .replace(/\s+/g, ' ')               // Normalize spaces
      .trim();

const getCommonWordsScore = (a, b) => {
  const setA = new Set(a.split(' '));
  const setB = new Set(b.split(' '));
  const common = [...setA].filter(w => setB.has(w));
  return common.length / Math.max(setA.size, setB.size);
};

const uniqueProcesses = [
  "IBB connector installation",
  "Module installation into tray (Front 3 module - A1 B2 A3)",
  "Module installation into tray (Rear 2 module - B6 A7)",
  "Module installation on cooling plate B4 A5",
  "A1 +ve to B2 -ve module series busbar connection",
  "B2 +ve to A3 -ve module series busbar connection",
  "A7 -ve to B6 +ve module series busbar connection",
  "B4 +ve to A5 -ve module series busbar connection",
  "A5 -ve to B6 +ve module series busbar connection",
  "A1 -ve to shunt busbar",
  "A3 +ve to B4 -ve busbar",
  "B4 -ve to A3 +ve busbar",
  "A7 +ve to BDU busbar",
  "BMS mounting and ground wire",
  "HV connector LR",
  "Coolant connector inlet LR",
  "Coolant connector outlet LR",
  "BDU mounting LR",
  "Fuse mounting LR",
  "Pyro switching mounting LR",
  "Smoke sensor LR",
  "Relay mounting LR",
  "Shunt mounting LR",
  "HV +ve to pyro switch busbar LR",
  "Pyro switch to HV +ve busbar LR",
  "HV -ve to relay busbar LR",
  "Relay to shunt +ve busbar LR",
  "Shunt -ve to module A1 busbar LR",
  "Pyro switch to fuse busbar LR",
  "Fuse busbar LR",
  "BDU to fuse busbar",
  "BDU to module A7 busbar LR",
  "Top cover assembly LR",
  "Waterproof vent valve LR",
  "L Plate Fixing(M1+M2+M3+M4)",
  "Busbar Fixing",
  "Tie Rod Fixing(M1+M2+M3+M4)",
  "Low Voltage Wiring Harness",
  "Flexible Negative Busbar",
  "Modules Installation into the Tray",
  "HV Connector",
  "Positive & Neg.",
  "BMS bracket installation",
  "Flexible HV negative busbar to BMS",
  "B+ fuse connector, +ve busbar/+HV busbar connector",
  "Negative busbar to BMS",
  "BMS on BMS bracket (6.1)",
  "fuse connector on the side bracket plate",
  "B+ev HV cable to BMS",
  "Communication plug-in installation (6.1)",
  "bolts to fix the upper and lower panel (6.1)",
  "C PlateFixing Plate Installation",
  "Top lid (Top cover)",
  "Breather plug",  
  "L Plate Fixing(M5+M6+M7+M8)",
  "Tie Rod Fixing(M5+M6+M7+M8)",
  "busbar +ve module 4 to Module-5 -ev busbar -ev module5 to Module-5",
  "BMS on BMS bracket (12.2)",
  "Communication plug-in installation (12.2)",
  "bolts to fix the upper and lower panel (12.2)",
];

const fetchLatestRows = async () => {
  try {
    const processListSQL = uniqueProcesses.map(p => `'${p.replace(/'/g, "''")}'`).join(',');

    // const result = await pool1.request().query(`
    //   SELECT TOP(1) sr_no, pack_name, module_name, module_barcode, torque, angle,
    //          process_name, date_dd, pack_no, smoke_sensor_linked_pack_no, bypass_operator
    //   FROM taco_treceability.torque_details_EIP_mirror
    //   WHERE sr_no > ${lastSeenSrNo}
    //     AND pack_name = 'NOVA Prismatic LR'
    //     AND process_name IN (${processListSQL})
    //   ORDER BY sr_no DESC
    // `);

     const result = await pool1.request().query(`
      SELECT TOP(1) sr_no, pack_name, module_name, module_barcode, torque, angle,
             process_name, date_dd, pack_no, smoke_sensor_linked_pack_no, bypass_operator
      FROM taco_treceability.torque_details_EIP_mirror
      WHERE sr_no > ${lastSeenSrNo}
        AND pack_name IN ('NOVA Prismatic LR','Bajaj 6.1','Bajaj 12.2')
        AND process_name IN (${processListSQL})
      ORDER BY sr_no DESC
    `);

  console.log('result',result)

    for (const row of result.recordset) {
      const processedPackNo = row.pack_no === 'not_linked' ? 'not_linked' : row.pack_no.slice(-6);
      const packRes = await pool2.request().query(`
        SELECT Pack_ID FROM taco_treceability.master_pack
        WHERE Pack_Name='${row.pack_name}'
      `);
      if (!packRes.recordset.length) continue;
      const packID = packRes.recordset[0].Pack_ID;

      let scanType, scanID, moduleName, modulebarQR;
      if (!row.smoke_sensor_linked_pack_no || row.smoke_sensor_linked_pack_no.toLowerCase() === 'null') {
        const modRes = await pool2.request().query(`
          SELECT Module_Name, Module_ID FROM taco_treceability.master_module
          WHERE moduleNumber='${row.module_name}' AND Pack_ID='${packID}'
        `);

        // console.log('modRes',modRes)

        if (!modRes.recordset.length) continue;
        scanType = 'Module';
        scanID = modRes.recordset[0].Module_ID;
        moduleName = modRes.recordset[0].Module_Name;
      } else {
        const bomRes = await pool2.request().query(`
          SELECT BOM_ID FROM taco_treceability.BOM_Master
          WHERE BOM_Name='Smoke sensor' AND Pack_ID='${packID}'
        `);
        if (!bomRes.recordset.length) continue;
        scanType = 'BOM';
        scanID = bomRes.recordset[0].BOM_ID;
      }

      if (row.module_barcode.startsWith('DJ')) {
        const qrRes = await pool1.request().query(`
          SELECT CustomerQRCode FROM taco_treceability.final_qrcode_details
          WHERE final_qrcode='${row.pack_no}'
        `);
        if (!qrRes.recordset.length) continue;
        scanType = 'Pack';
        modulebarQR = qrRes.recordset[0].CustomerQRCode;
      }

      const [pmRes, pmResPack, pmResBom] = await Promise.all([        
        pool3.request().query(`
          SELECT Process_Name, Process_ID, Total_Count, Scan_Name
          FROM taco_treceability.Process_Master
          WHERE Pack_ID='${packID}' AND Scan_ID='${scanID}'
        `),
        pool3.request().query(`
          SELECT Process_Name, Process_ID, Total_Count, Scan_Name
          FROM taco_treceability.Process_Master
          WHERE Pack_ID='${packID}' AND Scan_ID='${packID}' AND Scan_Name='Pack'
        `),
        pool3.request().query(`
          SELECT Process_Name, Process_ID, Total_Count, Scan_Name
          FROM taco_treceability.Process_Master
          WHERE Pack_ID='${packID}' AND Scan_Name='BOM'
        `),
      ]);

      if (!pmRes.recordset.length) continue;
      if (scanType === 'Pack' && !pmResPack.recordset.length) continue;
      if (scanType === 'BOM' && !pmResBom.recordset.length) continue;

      let best = { score:0, processID:null, totalCount:null, scanName:null, processName:'' };
      let best1 = {...best}, best2 = {...best};

      // ----- Module match logic -----
      if (scanType === 'Module') {
      //  console.log('Module:::::::::::::',row.process_name,moduleName)
        const inputNorm = normalizeProcess(row.process_name);
        const modKey = moduleName.toLowerCase();
        

        for (const p of pmRes.recordset) {
          const raw = p.Process_Name.toLowerCase();
          if (!raw.includes(modKey)) continue;  // ensure module string is present
          const cand = normalizeProcess(p.Process_Name);

          let score = 0;
          if (inputNorm === cand) score = 1;
          else if (cand.startsWith(inputNorm)) score = 0.99;
          else if (cand.includes(inputNorm)) score = 0.95;
          else if (inputNorm.includes(cand)) score = 0.9;
          else {
            score = 0.7 * getCommonWordsScore(inputNorm, cand) +
                    0.3 * stringSimilarity.compareTwoStrings(inputNorm, cand);
          }

          if (score > best.score ||
              (score === best.score && p.Process_Name.length < best.processName.length)) {
            best = { score, processID: p.Process_ID, totalCount: p.Total_Count, scanName: p.Scan_Name, processName: p.Process_Name };
          }
          
        }
        if (!best.processID || best.score < 0.5) continue;
      }

      // ----- Pack match logic -----
      else if (scanType === 'Pack') {
        
        const inputNorm = normalizeProcess(row.process_name);
        const inputRaw = row.process_name.toLowerCase();
        const arr = [];

        for (const p of pmResPack.recordset) {
          const raw = p.Process_Name.toLowerCase();
          const cand = normalizeProcess(p.Process_Name);

          let score=0;
          if (inputRaw === raw) score=1;
          else if (raw.startsWith(inputRaw)) score=0.99;
          else if (raw.includes(inputRaw)) score=0.95;
          else if (inputRaw.includes(raw)) score=0.9;
          else {
            score = 0.7 * getCommonWordsScore(inputNorm, cand) +
                    0.3 * stringSimilarity.compareTwoStrings(inputNorm, cand);
          }

          arr.push({ score, processID: p.Process_ID, totalCount: p.Total_Count, scanName: p.Scan_Name, processName: p.Process_Name });
        }
        arr.sort((a,b) => b.score - a.score || a.processName.length - b.processName.length);
        best1 = arr[0];
        if (!best1.processID || best1.score < 0.5) continue;
      }

      // ----- BOM match logic -----

      else if (scanType === 'BOM') {
        // console.log('tt')
        const inputWords = row.process_name.match(/[\w()+\-\/&]+/g); // Preserve special chars
        if (!inputWords || inputWords.length === 0) continue;
      
        const matches = [];
      
        for (const p of pmResBom.recordset) {
          // console.log('tttttttt',pmResBom.recordset)
          const processWords = p.Process_Name.match(/[\w()+\-\/&]+/g) || [];
      
          // Exact word-by-word match preserving case and symbols
          const allMatch = inputWords.every(word => processWords.includes(word));
      
          if (allMatch) {
            matches.push({
              score: 1,  // all words matched
              processID: p.Process_ID,
              totalCount: p.Total_Count,
              scanName: p.Scan_Name,
              processName: p.Process_Name
            });
          }
        }
      
        // Pick highest score, then shortest process name
        matches.sort((a, b) => b.score - a.score || a.processName.length - b.processName.length);
        best2 = matches[0];
      
        if (!best2?.processID || best2.score < 0.5) continue;
      }
      

      // ----- API calls & deletions -----
      if (scanType === 'Module') {
        // console.log('ffffffffff')
        const api1Payload = {
          pack_id: String(packID),
          process_id: best.processID,
          time: row.date_dd,
          module_name: moduleName,
          target_count: best.totalCount,
          pack_no: processedPackNo,
          line_id: 1,
          Received_Data: `${row.torque},${row.angle}`,
          module_barcode: row.module_barcode
        };
        console.log("API1 api1Payload:", api1Payload);
        try {
          const response = await axios.post('https://mismainapp.tataautocomp.com:3241/trigger_process_data', api1Payload);
          console.log('API1 Response:', JSON.stringify(response.data, null, 2));
          const message = response.data?.message || '';          
          const Process_Status = response.data?.Process_Status || '';
          const putUrl = response.data?.PUT_url || '';
          const module_barcode = response.data?.module_barcode || '';
        
          if (message === "Process register updated successfully" && Process_Status === "Pending") {
            await pool1.request().query(`DELETE FROM taco_treceability.torque_details_EIP_mirror WHERE sr_no = ${row.sr_no}`);
            console.log(`Deleted sr_no ${row.sr_no} after successful update.`);
            // console.log('Module sr_no')
            return startFetchLoop();
          } 
          else if (message === "Process register updated successfully" && Process_Status === "Completed") {
  try {
    // 1. Extract Process_ID from putUrl
    const processIdMatch = putUrl.match(/Process_ID=(\d+)/);
    const processId = processIdMatch ? processIdMatch[1] : null;

    if (!processId) {
      console.error("Process_ID not found in PUT_url:", putUrl);
    } else {
      console.log("Extracted Process_ID:", processId);

      // 2. Fetch Station_ID from DB
      const stationResult = await pool3
        .request()
        .query(`SELECT Station_ID FROM taco_treceability.Process_Master WHERE Process_ID = '${processId}'`);

      if (stationResult.recordset.length === 0) {
        console.error("No Station_ID found for Process_ID:", processId);
      } else {
        const stationId = stationResult.recordset[0].Station_ID;
        console.log("Fetched Station_ID:", stationId);

        // 3. Build payload
        const stationPayload = {
          station_id: stationId,
          line_id: "1",
          customer_qrcode: module_barcode,
          station_status: "OK",
          checklist_name: "NA",
          substation_id: processId
        };

        console.log("Sending Station Payload:", stationPayload);

        // 4. Send payload to API
        try {
          const stationResponse = await axios.post(
            "https://mismainapp.tataautocomp.com:3241/station_status/filter",
            stationPayload,
            {
              headers: { "Content-Type": "application/json" }
            }
          );
          console.log("Station Status API Response:", JSON.stringify(stationResponse.data, null, 2));
        } catch (stationErr) {
          console.error("Error sending Station Status API:", stationErr.message);
          if (stationErr.response)
            console.error("Station API Error Response:", JSON.stringify(stationErr.response.data, null, 2));
        }
      }
    }

    // 5. Delete record after successful process update
    await pool1.request().query(
      `DELETE FROM taco_treceability.torque_details_EIP_mirror WHERE sr_no = ${row.sr_no}`
    );
    console.log(`Deleted sr_no ${row.sr_no} after successful update.`);
    console.log("Module sr_no complete***:::::::", message, Process_Status);
    return startFetchLoop();
  } catch (innerErr) {
    console.error("Error in Process Completed flow:", innerErr.message);
  }
}
          else if (message === "Process already completed. No update necessary.") {
            await pool1.request().query(`
              DELETE FROM taco_treceability.torque_details_EIP_mirror
              WHERE pack_no = '${row.pack_no}'
                AND module_barcode = '${row.module_barcode}'
                AND process_name = '${row.process_name}'
                AND pack_name = '${row.pack_name}'
            `);
            console.log(`Deleted all matching rows for already completed process: pack_name=${row.pack_name}, pack_no=${row.pack_no}, barcode=${row.module_barcode}`);
            // console.log('Module all')
            return startFetchLoop();
          }
        } catch (err) {
          console.error('API1 send error:', err.message);
          if (err.response) console.error('API1 Error Response:', JSON.stringify(err.response.data, null, 2));
        }
        
      }

      else if (scanType === 'Pack') {
        const api1Payload = {
          pack_id: String(packID),
          process_id: best1.processID,
          time: row.date_dd,
          module_name: row.pack_name,
          target_count: best1.totalCount,
          pack_no: processedPackNo,
          line_id: 1,
          Received_Data: `${row.torque},${row.angle}`,
          module_barcode: modulebarQR
        };
        try {
          const response = await axios.post('https://mismainapp.tataautocomp.com:3241/trigger_process_data', api1Payload);
          console.log('API1 Response:', JSON.stringify(response.data, null, 2));
          const message = response.data?.message || '';
          const Process_Status = response.data?.Process_Status || '';
          const putUrl = response.data?.PUT_url || '';
          const module_barcode = response.data?.module_barcode || '';
        
          if (message === "Process register updated successfully" && Process_Status === "Pending") {
            await pool1.request().query(`DELETE FROM taco_treceability.torque_details_EIP_mirror WHERE sr_no = ${row.sr_no}`);
            console.log(`Deleted sr_no ${row.sr_no} after successful update.`);
            console.log('Pack sr_no complete***:::::::',message,Process_Status)
            return startFetchLoop();
          } 
          else if (message === "Process register updated successfully" && Process_Status === "Completed") {
  try {
    // 1. Extract Process_ID from putUrl
    const processIdMatch = putUrl.match(/Process_ID=(\d+)/);
    const processId = processIdMatch ? processIdMatch[1] : null;

    if (!processId) {
      console.error("Process_ID not found in PUT_url:", putUrl);
    } else {
      console.log("Extracted Process_ID:", processId);

      // 2. Fetch Station_ID from DB
      const stationResult = await pool3
        .request()
        .query(`SELECT Station_ID FROM taco_treceability.Process_Master WHERE Process_ID = '${processId}'`);

      if (stationResult.recordset.length === 0) {
        console.error("No Station_ID found for Process_ID:", processId);
      } else {
        const stationId = stationResult.recordset[0].Station_ID;
        console.log("Fetched Station_ID:", stationId);

        // 3. Build payload for API
        const stationPayload = {
          station_id: stationId,
          line_id: "1",
          customer_qrcode: module_barcode,
          station_status: "OK",
          checklist_name: "NA",
          substation_id: processId
        };

        console.log('stationPayload',stationPayload)

        // Send POST request to station_status/filter API
        try {
          const stationResponse = await axios.post(
            "https://mismainapp.tataautocomp.com:3241/station_status/filter",
            stationPayload
          );
          console.log("Station Status API Response:", JSON.stringify(stationResponse.data, null, 2));
        } catch (stationErr) {
          console.error("Error sending Station Status API:", stationErr.message);
          if (stationErr.response) console.error("Station API Error Response:", JSON.stringify(stationErr.response.data, null, 2));
        }
      }
    }

    // 4. Delete record from DB after successful process update
    await pool1.request().query(`DELETE FROM taco_treceability.torque_details_EIP_mirror WHERE sr_no = ${row.sr_no}`);
    console.log(`Deleted sr_no ${row.sr_no} after successful update.`);
    console.log("Pack sr_no complete***:::::::", message, Process_Status);
    return startFetchLoop();
  } catch (innerErr) {
    console.error("Error in Process Completed flow:", innerErr.message);
  }
}
          // else if (message === "Process register updated successfully" && Process_Status === "Completed") {
          //   await pool1.request().query(`DELETE FROM taco_treceability.torque_details_EIP_mirror WHERE sr_no = ${row.sr_no}`);
          //   console.log(`Deleted sr_no ${row.sr_no} after successful update.`);
          //   console.log('Pack sr_no complete***:::::::',message,Process_Status)
          //   return startFetchLoop();
          // }
          else if (message === "Process already completed. No update necessary.") {
            await pool1.request().query(`
              DELETE FROM taco_treceability.torque_details_EIP_mirror
              WHERE pack_no = '${row.pack_no}'
                AND module_barcode = '${row.module_barcode}'
                AND process_name = '${row.process_name}'
                AND pack_name = '${row.pack_name}'
            `);
            console.log(`Deleted all matching rows for already completed process: pack_name=${row.pack_name}, pack_no=${row.pack_no}, barcode=${row.module_barcode}`);
            console.log('Pack all')
            return startFetchLoop();
          }
        } catch (err) {
          console.error('API1 send error:', err.message);
          if (err.response) console.error('API1 Error Response:', JSON.stringify(err.response.data, null, 2));
        }
        
      }

      else if (scanType === 'BOM' && processedPackNo !== 'not_linked') {
        const api2Payload = {
          pack_id: String(packID),
          process_id: best2.processID,
          time: row.date_dd,
          bom_id: scanID,
          Pack_Number: processedPackNo,
          target_count: best2.totalCount,
          line_id: 1,
          Received_Data: `${row.torque},${row.angle}`,
          bom_qr: row.bypass_operator === 'na'
            ? `${row.module_barcode},${row.module_barcode}`
            : `${row.module_barcode},${row.bypass_operator}`
        };
        console.log("API2 payload:", api2Payload);
        try {
          const response = await axios.post('https://mismainapp.tataautocomp.com:3241/trigger_tray_after_link_data', api2Payload);
          console.log('API2 Response:', JSON.stringify(response.data, null, 2));
          const message = response.data?.message || '';
        
          if (message === "Tray bolting updated successfully") {
            await pool1.request().query(`DELETE FROM taco_treceability.torque_details_EIP_mirror WHERE sr_no = ${row.sr_no}`);
            console.log(`Deleted sr_no ${row.sr_no} after successful tray bolting.`);
            console.log('BOM pack sr_no')
            return startFetchLoop();
          } else if (message === "Process already completed. No update necessary.") {
            await pool1.request().query(`
              DELETE FROM taco_treceability.torque_details_EIP_mirror
              WHERE pack_no = '${row.pack_no}'
                AND module_barcode = '${row.module_barcode}'
                AND process_name = '${row.process_name}'
                AND pack_name = '${row.pack_name}'
            `);
            console.log(`Deleted all matching rows for already completed tray bolting: pack_name=${row.pack_name}, pack_no=${row.pack_no}`);
            console.log('BOM pack all')
            return startFetchLoop();
          }
        } catch (err) {
          console.error('API2 send error:', err.message);
          if (err.response) console.error('API2 Error Response:', JSON.stringify(err.response.data, null, 2));
        }
        
      }

      else if (scanType === 'BOM' && processedPackNo === 'not_linked') {
        const api3Payload = {
          pack_id: String(packID),
          process_id: best2.processID,
          time: row.date_dd,
          bom_id: scanID,
          target_count: best2.totalCount,
          line_id: 1,
          Received_Data: `${row.torque},${row.angle}`,
          bom_qr: row.bypass_operator === 'na'
            ? `${row.module_barcode},${row.module_barcode}`
            : `${row.module_barcode},${row.bypass_operator}`
        };
        console.log("API3 payload:", api3Payload);
        try {
          const response = await axios.post('https://mismainapp.tataautocomp.com:3241/trigger_tray_data', api3Payload);
          console.log('API3 Response:', JSON.stringify(response.data, null, 2));
          const message = response.data?.message || '';
        
          if (message === "BOM Process updated successfully") {
            await pool1.request().query(`DELETE FROM taco_treceability.torque_details_EIP_mirror WHERE sr_no = ${row.sr_no}`);
            console.log(`Deleted sr_no ${row.sr_no} after successful BOM process update.`);
            console.log('BOM not_linked sr_no')
            return startFetchLoop();
          } else if (message === "Process already completed. No update necessary.") {
            await pool1.request().query(`
              DELETE FROM taco_treceability.torque_details_EIP_mirror
              WHERE pack_no = '${row.pack_no}'
                AND module_barcode = '${row.module_barcode}'
                AND process_name = '${row.process_name}'
                AND pack_name = '${row.pack_name}'
            `);
            console.log(`Deleted all matching rows for already completed BOM process: pack_name=${row.pack_name}, pack_no=${row.pack_no}`);
            console.log('BOM not_linked all')
            return startFetchLoop();
          }
        } catch (err) {
          console.error('API3 send error:', err.message);
          if (err.response) console.error('API3 Error Response:', JSON.stringify(err.response.data, null, 2));
        }
        
      }

      if (row.sr_no > lastSeenSrNo) lastSeenSrNo = row.sr_no;
    }
    // If no early return happened, still continue the loop
  setTimeout(startFetchLoop, 3000); // Wait 3 seconds before next fetch
} catch (err) {
  console.error("Error fetching or processing rows:", err);
  setTimeout(startFetchLoop, 5000); // Retry after error
}
    
  // } catch (err) {
  //   console.error("Error fetching or processing rows:", err);
  // }
};

init();