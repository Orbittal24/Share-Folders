const axios = require("axios");

const API_URL = "https://misapp.tataautocomp.com:3250/station_status/filter";

const stationIds = [28,29,30,33,20,21,22,7,8,15,16,2,5,3010,3025,3026];

const TOTAL_CALLS = 700;

let passCount = 0;
let failCount = 0;

function getRandomStationId() {
  const randomIndex = Math.floor(Math.random() * stationIds.length);
  return stationIds[randomIndex];
}

async function callAPI(count) {
  const stationId = getRandomStationId();

  const body = {
    station_id: stationId,
    line_id: 0,
    customer_qrcode: "01TMB06S100028FC90100084",
    station_status: "OK",
    checklist_name: "NA",
    substation_id: "NA"
  };

  try {
    const response = await axios.post(API_URL, body);

    if (response.status === 200) {
      passCount++;
      console.log(`✅ PASS ${count} | station_id: ${stationId}`);
    } else {
      failCount++;
      console.log(`❌ FAIL ${count} | station_id: ${stationId}`);
    }

  } catch (error) {
    failCount++;
    console.log(`❌ ERROR ${count} | station_id: ${stationId}`);
  }
}

async function runTest() {
  console.log("🚀 Starting API test...\n");

  for (let i = 1; i <= TOTAL_CALLS; i++) {
    await callAPI(i);
  }

  console.log("\n📊 Test Completed");
  console.log("Total Calls:", TOTAL_CALLS);
  console.log("✅ Passed:", passCount);
  console.log("❌ Failed:", failCount);
}

runTest();
