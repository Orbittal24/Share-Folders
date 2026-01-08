const { kMaxLength } = require('buffer');

module.exports = {
    includeCode: function (io) {
        var WebSocketServer = require('websocket').server;
        var http = require("http");
        const fs = require('fs');
        const nrc = require('node-run-cmd');
        var sql = require('mssql');
        const net = require('net');
        var event = require('events');
        const fetch = require('node-fetch');
        var em = new event.EventEmitter();
           const axios = require('axios');
        const https = require('https');
        const agent = new https.Agent({ rejectUnauthorized: false });

        const configSource = {
            user: 'user_mis',
            password: 'admin',
            server: "10.9.7.105",
            database: "taco_treceability",
            options: {
                encrypt: false,
                trustServerCertificate: false,
            },
        };

        var global_airleakage_plug1_value = 'NA';
        var global_airleakage_plug2_value = 'NA';
        var global_airleakage_body_value = 'NA';
        var global_airleakage_coolant_value = 'NA';

        var plugIndex = 0;
        var button1Flag = false;
        var button2Flag = false;
        var connectionFlag = false;
        var timeoutFlag = false;
        var disconnectFlag = false;
        var errorFlag = false;
        var dataFlag = false;
        var checkStatus = '';
             const sqlConfig = {
            user: "user_mis",
            password: "admin",
            database: "taco_treceability",
            server: 'localhost\\MSSQLSERVER',
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000
            },
            options: {
                encrypt: true, // for azure
                trustServerCertificate: true // change to true for local dev / self-signed certs
            }
        };

        // Initialize connection pool
        var dbConn = new sql.ConnectionPool(sqlConfig);
       // console.log("1111111111111111111111....");
        dbConn.connect().then(function () {
           // console.log("Connected....", sqlConfig);
        });

       
        // -- alt 6
        // ALT 6
        // Code to fetch body readings -- Start
        var serverWsalt6 = http.createServer(function (request, response) {
            // console.log((new Date()) + ' Received request for ' + request.url);
             response.writeHead(404);
             response.end();
         });
         serverWsalt6.listen(9557, function () {
             //console.log((new Date()) + ' Server is listening for ALT6 BODY parameters on port 9511');
         });
 
         var wsServeralt6 = new WebSocketServer({
             httpServer: serverWsalt6,
             autoAcceptConnections: false
         });
 
         function originIsAllowed(origin) {
             return true;
         }
 
         wsServeralt6.on('request', function (request) {
             if (!originIsAllowed(request.origin)) {
                 request.reject();
                // console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
                 return;
             }
 
             var connection = request.accept('echo-protocol', request.origin);
             connection.sendUTF('MIS received Alt6 Body Value Data!');
             connection.on('message', function (message) {
                console.log("message11111",message)
                 if (message.type === 'utf8') {
                     // var data = JSON.parse(message.utf8Data);
                     global_airleakage_body_value_alt6 = message.utf8Data;

                     console.log("global_airleakage_body_value_alt6:",global_airleakage_body_value_alt6);
                     //console.log('ALT6 Body:', message.utf8Data);
                     em.emit('sendAirleakageBodyDataAlt6', global_airleakage_body_value_alt6);
                     //io.emit('setAirleakageBodyValue', global_airleakage_body_value);
                 }
             });
             connection.on('close', function (reasonCode, description) { });
         });
         // Code to fetch body readings -- End
 
         // Code to fetch coolant readings -- Start
         var serverWs2alt6 = http.createServer(function (request, response) {
             //console.log((new Date()) + ' Received request for ' + request.url);
             response.writeHead(404);
             response.end();
         });
         serverWs2alt6.listen(9558, function () {
            // console.log((new Date()) + ' Server is listening for ALT6 Coolant parameter on port 9512');
         });
 
         var wsServer2alt6 = new WebSocketServer({
             httpServer: serverWs2alt6,
             autoAcceptConnections: false
         });
 
         wsServer2alt6.on('request', function (request) {
             if (!originIsAllowed(request.origin)) {
                 request.reject();
                // console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
                 return;
             }
 
             var connection = request.accept('echo-protocol', request.origin);
             connection.sendUTF('MIS received Alt6 Coolant Value Data!');
             connection.on('message', function (message) {
                 if (message.type === 'utf8') {
                     // var data = JSON.parse(message.utf8Data);
                     global_airleakage_coolant_value_alt6 = message.utf8Data;
                     console.log("global_airleakage_coolant_value_alt6:",global_airleakage_coolant_value_alt6);
                    // console.log('ALT6 Coolant:', message.utf8Data);
                     em.emit('sendAirleakageCoolantDataAlt6', global_airleakage_coolant_value_alt6);
                     //io.emit('setAirleakageCoolantValue', global_airleakage_coolant_value);
                 }
             });
             connection.on('close', function (reasonCode, description) { });
         });
         // Code to fetch coolant readings -- End



        setInterval(() => {
            // global_airleakage_plug1_value;
            // global_airleakage_plug1_value = (Math.floor(100000 + Math.random() * 900000)/10000).toFixed(2);
        }, 5000);

        // setInterval(() => {
        //     global_airleakage_plug1_value = 'NA'
        // }, 500);

        io.sockets.on('connection', (socket) => {

            

 ////////////////////////////////////////////////////IR shubham ok data shift start
 var counter_pack = 0;
 socket.on('importData_shifting', (final_qrcode) => {
 var tqr = final_qrcode;
 
 
 collect_distinct_pack(tqr);
 });
 
 function collect_distinct_pack(tqr) {
           var all_distinct_pack = [];
 
             
     sql.connect(sqlConfig, function (err) {
         request = new sql.Request();
         // var dqQuery = `SELECT DISTINCT pack_no FROM taco_treceability.torque_details_EIP WHERE pack_no != 'not_linked'`;
         var dqQuery = `SELECT pack_no FROM taco_treceability.torque_details_EIP WHERE pack_no != 'not_linked' and pack_no = '${tqr}'`;
 
         request.query(dqQuery, function (err, recordset) {
             if (err) console.log(err);
             var result = recordset.recordset;
             console.log('result::', result);
             for (var i in result) {
                 console.log('distinct_result::', result);
                 var final_qr_code = result[i].pack_no;
 
                 all_distinct_pack.push(final_qr_code);
 
                 // var getstatus=getpackassstatus(final_qr_code);
             }
             if(all_distinct_pack.length > 0){
                 console.log('distimct_if_result::', result);
                 // sendToArchive(all_distinct_pack[0]);
                 get_station_status_ok(all_distinct_pack[0],all_distinct_pack);
             }
             
 
 
         });
     });
 }
 
 function get_station_status_ok(final_qr_code,all_distinct_pack) {
     console.log('get_station_status_ok::', final_qr_code);
     var station_pack_status;
   
         sql.connect(sqlConfig, function (err) {
             request = new sql.Request();
             request.query(`SELECT TOP (1) FinalQRCodePrint_status FROM taco_treceability.taco_treceability.station_status where FinalQRCode ='${final_qr_code}'`, function (err, recordset) {
                // console.log(`SELECT TOP (1) FinalQRCodePrint_status FROM taco_treceability.taco_treceability.station_status where FinalQRCode ='${final_qr_code}'`);
                 if (err) console.log(err);
                 var result=recordset.recordset;
                console.log("OK result",result);
                 if(result.length >0){
                     for (var i in result) {
                         
                         station_pack_status= result[i].FinalQRCodePrint_status;
                         console.log('station_pack_status::', station_pack_status);
                     }
                     if(station_pack_status == 'OK') {
                         console.log('station_pack_status::', station_pack_status);
                         sendToArchive(final_qr_code,all_distinct_pack);
 
                     }
                     else{
                         counter_pack++;
                         console.log('çounter value',counter_pack,'árr len',all_distinct_pack.length)
                         if(counter_pack < all_distinct_pack.length){
                            setTimeout(() => {
                             get_station_status_ok(all_distinct_pack[counter_pack],all_distinct_pack);
                            }, 2000);
                            
                         }
                         else{
                             counter_pack = 0;
                         }
                     }
                  
                 }
                
 
             });
         });
    
 }
 
 
 function sendToArchive(final_qr_code,all_distinct_pack) {
     var dqQuery = `SELECT * FROM taco_treceability.torque_details_EIP WHERE pack_no='${final_qr_code}'`;
     var globalCurrentStore = [];
     sql.connect(sqlConfig, function (err) {
         request = new sql.Request();
         request.query(dqQuery, function (err, recordset) {
 
             if (err) console.log(err);
             var result = recordset.recordset;
 
             for (var i in result) {
                 globalCurrentStore.push(result[i]);
             }
 
 
             var insertQuery = 'INSERT INTO taco_treceability.torque_details_EIP_import2(pack_name, module_name, torque, angle, torque_status, date_dd, shift, module_barcode, process_status, pack_no, rework_status, bypass_operator, bypass_reason, process_name, station_name,smoke_sensor_linked_pack_no) VALUES'
             for (var i = 0; i < globalCurrentStore.length; i++) {
                 if (i == 0) {
                     insertQuery += ` ('${globalCurrentStore[i].pack_name}','${globalCurrentStore[i].module_name}','${globalCurrentStore[i].torque}','${globalCurrentStore[i].angle}','${globalCurrentStore[i].torque_status}','${globalCurrentStore[i].date_dd}','${globalCurrentStore[i].shift}','${globalCurrentStore[i].module_barcode}','${globalCurrentStore[i].process_status}','${globalCurrentStore[i].pack_no}','${globalCurrentStore[i].rework_status}','${globalCurrentStore[i].bypass_operator}','${globalCurrentStore[i].bypass_reason}','${globalCurrentStore[i].process_name}','${globalCurrentStore[i].station_name}','${globalCurrentStore[i].smoke_sensor_linked_pack_no}')`;
                 } else {
                     insertQuery += `,('${globalCurrentStore[i].pack_name}','${globalCurrentStore[i].module_name}','${globalCurrentStore[i].torque}','${globalCurrentStore[i].angle}','${globalCurrentStore[i].torque_status}','${globalCurrentStore[i].date_dd}','${globalCurrentStore[i].shift}','${globalCurrentStore[i].module_barcode}','${globalCurrentStore[i].process_status}','${globalCurrentStore[i].pack_no}','${globalCurrentStore[i].rework_status}','${globalCurrentStore[i].bypass_operator}','${globalCurrentStore[i].bypass_reason}','${globalCurrentStore[i].process_name}','${globalCurrentStore[i].station_name}','${globalCurrentStore[i].smoke_sensor_linked_pack_no}')`;
                 }
             }
 
             request.query(insertQuery, function (err, recordset) {
                 // if (err) throw (err);
                 if (err) console.log(err);
 
 
                 if (!err) {
                 
                     setTimeout(() => {
                         console.log('truncateTable111')
                         truncateTable(final_qr_code,all_distinct_pack);
                     }, 1000);
                 }
 
 
             });
 
         });
     });
 }
 
 function truncateTable(final_qr_code,all_distinct_pack) {
     sql.connect(sqlConfig, function (err) {
         request = new sql.Request();
      request.query(`delete from taco_treceability.taco_treceability.torque_details_EIP where pack_no='${final_qr_code}'`, function (err, recordset) {
             if (err) console.log(err);
             var result = recordset.recordset;
        
             if(!err) {
                
                 counter_pack++;
                 console.log('çounter value11',counter_pack,'árr len',all_distinct_pack.length)
 
                 if(counter_pack < all_distinct_pack.length){
                     setTimeout(() => {
                         get_station_status_ok(all_distinct_pack[counter_pack],all_distinct_pack);
                        }, 2000);
                        
                     
                 }
                 else{
                     counter_pack = 0;
                 }
             }
         });
     });
 }
 
 
 
 
 
 
 ////////////////////////////////////////////////////IR shubham ok data shift end


///////////////////////////////////////////Days Interlock//////////////////////////////////

socket.on('checkALT_child_status6',(final_qrcode,barcode)=>{
    var dqQuery = `SELECT * FROM taco_treceability.alt_bom_status where pack_no='${final_qrcode}' and status='OK'`;
   console.log("inser123:",dqQuery);
    sql.connect(sqlConfig, function (err) {
        request = new sql.Request();
        request.query(dqQuery, function (err, recordset) {
            // if (err) console.log(err);
            var result = recordset.recordset;
            if(result.length ==0){
                socket.emit("sendcheckALT_child_status6",'0',barcode);
     //   });
            }
            else{

                socket.emit("sendcheckALT_child_status6",'1',barcode);
            }
        });
    });
});




socket.on('savedaysInterlock_bypass_alt6', (reason, operator,finalqr,station) => {
    // var todayDateStr = moment().format("YYYY-MM-DD HH:mm:ss");
  //  var todayDateStr= new Date().getFullYear() + '-' + ("0" + (new Date().getMonth() + 1)).slice(-2) + '-' + ("0" + new Date().getDate()).slice(-2);
    //console.log("todayDateStr:",todayDateStr);
  var dbQuery = `INSERT INTO taco_treceability.daysQualityBypass( final_qrcode, line, bypass_operator, bypass_reason, station)VALUES('${finalqr}','5','${operator}','${reason}','${station}')`;
                
                var request2 = new sql.Request();
                 request2.query(dbQuery, function (err2, recordset) {
                 // if (err) console.log(err);
                 if (err2) console.log(err2);
                 //console.log(`Updated FinalQRCode: ${battery_idUrl} Bypass details`);


                 });             
 });

socket.on('getDaysInterlockData_eol_6', async (data,barcode) => {
    console.log('Received triggerApi event with data:', data);

    try {
        const response = await fetch('http://10.9.4.28:8000/daysinterlock_EOL', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "pk_Barcode":data
            }),
        });

        const result = await response.json();
        console.log('API Response:', result);

        // Emit response back to client
        socket.emit('apiResponse_EOL_alt6', result,data,barcode);
    } catch (error) {
        console.error('API Error:', error.message);
        socket.emit('apiError', { error: error.message });
    }
});
//////////////////////////////////////////Days Interlock/////////////////////////////////////



            socket.on('get_rework_alt8_print', (pcknumber,defectlistPrint) => {

                var data2=`{D0430,0801,0400|}
                {AY;+10,0|}
                {C|}
                {PC000;0290,0090,05,05,I,00,B=REWORK|}
                {PC001;0150,0170,05,05,I,00,B=Pack No: ${pcknumber}|}
                {PC002;0150,0231,05,05,I,00,B=Defect Name: ${defectlistPrint[0]}|}     
                {XS;I,0001,0002C3200|}                
                `;


                fs.writeFile("prn_data/REWORK_ALTPACK.prn", data2, (err) => {
                    if (err)
                        console.log(err);
                    else {
                console.log("File written successfully rework\n");
               
                
                // setTimeout(() => {
                nrc.run(`"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\REWORK_ALTPACK.prn "10.9.4.110" LPT1`).then(
                    function (existCodes) {    //10.9.4.99
                        console.log(`Command executed successfully - Printing Customer Code: ${pcknumber}`);
                        // update status printed in database

                        
                    }, function (err) {
                        console.log('Command failed to execute!');
                    }
                );
                    }
                });
            });

            socket.on('setHex_string', (scanned_barcode, packname) => {
                console.log("setHex_string::::",scanned_barcode, packname);
           var hex_file,temp_str,FinalQRCode;
                   
                   var query4 = `SELECT  * FROM taco_treceability.taco_treceability.voltage_temp_string where pack_name='${packname}'`;
                   sql.connect(sqlConfig, function (err) {
                       request = new sql.Request();
                       request.query(query4, function (err, recordset) {
                           if (err) console.log(err);
                           var result = recordset.recordset;
                           // console.log("result:", result);
                           if (result.length != 0) {
                               for (var i in result) {
                                  hex_file= result[i].hex_file_name;
                                  temp_str= result[i].temp_string;
                   
                               }
                               console.log("setHex_string22222::::",hex_file, temp_str);
   
      var query5 = `SELECT  * FROM taco_treceability.taco_treceability.finalqr_bms_details where module_qrcode='${scanned_barcode}'`;
                   sql.connect(sqlConfig, function (err) {
                       request = new sql.Request();
                       request.query(query5, function (err, recordset) {
                           if (err) console.log(err);
                           var result = recordset.recordset;
                           // console.log("result:", result);
                           if (result.length != 0) {
                               for (var i in result) {
                                FinalQRCode= result[i].FinalQRCode;
                                
                   
                               }
   
    var dbQuery = `UPDATE taco_treceability.taco_treceability.finalqr_bms_details SET hex_string='${hex_file}',string1='${temp_str}' WHERE  FinalQRCode='${FinalQRCode}'`;
                               sql.connect(sqlConfig, function (err) {
                                   request = new sql.Request();
                               
                                   request.query(dbQuery, function (err, recordset) {
                                       if (err) console.log(err);
                               
                                   });
                               });
                               
                         
                            }
                        })
                    });
                
                           }
                       });
                   }); 
                   
                   });


        


           


            socket.on('getAlreadyLinkedBms', (modulebarcode,packname) => {
                var bms_no,bms_full_string;
                var query4 = `SELECT TOP (1) * FROM taco_treceability.taco_treceability.finalqr_bms_details where module_qrcode='${modulebarcode}' ORDER BY sr_no DESC`;
                sql.connect(sqlConfig, function (err) {
                    request = new sql.Request();
                    request.query(query4, function (err, recordset) {
                        if (err) console.log(err);
                        var result = recordset.recordset;
                        //console.log("result:", result);
                        if (result.length != 0) {
                            for (var i in result) {
                               
                                bms_no = result[i].bms_no;
                                bms_full_string= result[i].bms_full_string;
                              
                            }
                            socket.emit("setAlreadyLinkedBms",bms_no,bms_full_string);
                        }
                    });
                });
            });


            socket.on('BinNumbergenerationstarted', (packname,modulebarcode) => {
   

               // console.log('BinNumbergenerationstarted:', packname,modulebarcode);
            
                var formatedMonth, formatedDay, mm, dd, year;
                var todayDate = new Date();
            
                year = todayDate.getFullYear();
                mm = (todayDate.getMonth() + 1).toString();
                formatedMonth = (mm.length === 1) ? ("0" + mm) : mm;
                dd = todayDate.getDate().toString();
                formatedDay = (dd.length === 1) ? ("0" + dd) : dd;
                var dateStr = formatedDay + "-" + formatedMonth + "-" + year;
            
                var dateTimestamp;
            
                var hh = todayDate.getHours();
                var mm = todayDate.getMinutes();
                var ss = todayDate.getSeconds()
            
                dateTimestamp = formatedDay + "-" + formatedMonth + "-" + year + " " + hh + ":" + mm + ":" + ss;
                var packnamefinal = packname.substring(0, 5);
                var capacity,mfg_date;
                //console.log("packnamefinal", packnamefinal);
                if (packnamefinal.includes('Bajaj')) {
                            var batterypart;
                            var nom_voltage_value;
                            var min_capacity_value;
                            if(packname=="Bajaj 5.9"){
                                batterypart="AH401901";
                                nom_voltage_value="51.2 V";
                                min_capacity_value="116Ah";
                                capacity='2';
                            }
                            if(packname=="Bajaj 6.1"){
                                batterypart="AH401901";
                                nom_voltage_value="51.2 V";
                                min_capacity_value="120Ah";
                                capacity='2';
                            }
                            if(packname=="Bajaj 9.2"){
                                batterypart="AH415101";
                                nom_voltage_value="51.2 V";
                                min_capacity_value="180Ah";
                                capacity='3';
                            }
                    if(packname=="Bajaj 8.9"){
                        batterypart="AH401967";
                        nom_voltage_value="51.2 V";
                        min_capacity_value="174Ah";
                        capacity='3';
                    }

                    if(packname=="Bajaj 12.2"){
                        batterypart="BK415101";
                        nom_voltage_value="51.2 V";
                        min_capacity_value="240Ah";
                        capacity='4';
                    }

                    if(packname=="Bajaj 12.1"){
                        batterypart="AH401933";
                        nom_voltage_value="51.2 V";
                        min_capacity_value="236.8Ah";
                        capacity='4';
                    }
                   
                    // if(packname=="Bajaj 11.8"){
                    //     batterypart="AH401903";
                    //     nom_voltage_value="51.2 V";
                    //     min_capacity_value="232Ah";
                    //     capacity='4';
                    // }

                    if(packname=="Bajaj 11.8"){
                        batterypart="BK401902";
                        nom_voltage_value="51.2 V";
                        min_capacity_value="232Ah";
                        capacity='4';
                    }

            
            
                    var query4 = `SELECT TOP (1) * FROM taco_treceability.taco_treceability.finalqr_bms_details where module_qrcode='${modulebarcode}' ORDER BY sr_no DESC`;
                    sql.connect(sqlConfig, function (err) {
                        request = new sql.Request();
                        request.query(query4, function (err, recordset) {
                            if (err) console.log(err);
                            var result = recordset.recordset;
                            //console.log("result:", result);
                            if (result.length != 0) {
                                for (var i in result) {
                                    var sr_no = result[i].sr_no;
                                    var pack_no = result[i].pack_no;
                                    var pack_qrcode = result[i].module_qrcode;
                                    var hex_string = result[i].hex_string;
                                    var string1 = result[i].string1;
                                     var bmsmfg=result[i].bmsmfg;
                                    var bms_no = result[i].bms_no;
                                    var finalqr= result[i].FinalQRCode;
            
                    
                                    //console.log("pack_no,pack_qrcode", pack_no, pack_qrcode);
                                    //////////////////////////////////////////////////BIN GENERATION CODE START////////////////////////////////////////////////////////////////////////////////////
            
                                    var string1_split = string1.split(" ");
                                    var num1 = string1_split[0];
                                    var num2 = string1_split[1];
                                    var year = new Date().getFullYear();
                                    var month = (new Date().getMonth() + 1);
                                    var day = new Date().getDate();
                                    var hex_string_dup1=hex_string.split(".");
                                    var hex_string_dup = hex_string_dup1[0];
            
                                 //   var dateFormat4 = new Date().getFormatDate(); //# 16 March, 2017
            
                                   
                                    var supplier = "GOTION";
                                  //  var mfg = "RNTEC";
                                  var mfg = bmsmfg;
                                    var PackSupplier = "TACO-EV";
                                    var year = year;
                                    var month = month;
                                    var day = day;
                                    var plant_line = "6";
                                    var serial = pack_no;
            
                                    let objectDate = new Date ();
                                    let day1 = objectDate.getDate();
                                    // console.log(day1);
            
                                    let year1 = objectDate.getFullYear();
                                    // console.log(year1);
            
                                    const month1 = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            
                                    const d = new Date();
                                    let monthname = (month1[d.getMonth()]).toUpperCase();
            
                                    var todaydate = day1+" "+monthname+" "+year1;
            
                                    // console.log('Date ::::year:::month:::day::::::::::::::::::::::::::::::::::::::::::::', year,month,day);
                                    // var dstr = getStr4(year,month,day);
                                    // console.log('serial:', serial);
            
            
            
                               
                                    function getStr2(supplier, mfg) {
                                        if (supplier == "GOTION") {
                                           // if (mfg == "0002") {
                                                return "02";
                                           // } 
                                          /*  else if (mfg == "0003") {
                                                return "03";
                                            } 
                                            else if (mfg == "0004") {
                                                return "04";
                                            }else {
                                                return "NA";
                                            } */
                                        } else {
                                            
                                            return "NA";
                                        }
                                    }
            
                                    function getStr3(PackSupplier) {
                                        if (PackSupplier == "BAL R&D") {
                                            return "0";
                                        } else if (PackSupplier == "BAL") {
                                            return "1";
                                        } else if (PackSupplier == "RESERVED 2") {
                                            return "2";
                                        } else if (PackSupplier == "GOTION") {
                                            return "3";
                                        } else if (PackSupplier == "TACO-EV") {
                                            return "4";
                                        }
                                    }
            
                                    function getStr4(year, month, day) {
            
                                        // Calculate d1
                                        var year_to_bin = (parseInt(year) - 2000).toString(2);
                                        var month_to_bin = (parseInt(month)).toString(2);
                                        var day_to_bin = (parseInt(day)).toString(2);
            
                                        if (year_to_bin.length == 1) year_to_bin = "000000" + year_to_bin;
                                        if (year_to_bin.length == 2) year_to_bin = "00000" + year_to_bin;
                                        if (year_to_bin.length == 3) year_to_bin = "0000" + year_to_bin;
                                        if (year_to_bin.length == 4) year_to_bin = "000" + year_to_bin;
                                        if (year_to_bin.length == 5) year_to_bin = "00" + year_to_bin;
                                        if (year_to_bin.length == 6) year_to_bin = "0" + year_to_bin;
            
                                        if (month_to_bin.length == 1) month_to_bin = "000" + month_to_bin;
                                        if (month_to_bin.length == 2) month_to_bin = "00" + month_to_bin;
                                        if (month_to_bin.length == 3) month_to_bin = "0" + month_to_bin;
            
                                        if (day_to_bin.length == 1) day_to_bin = "000" + day_to_bin;
                                        if (day_to_bin.length == 2) day_to_bin = "00" + day_to_bin;
                                        if (day_to_bin.length == 3) day_to_bin = "0" + day_to_bin;
            
                                        // console.log('year_to_bin',year_to_bin);
                                        // console.log('month_to_bin',month_to_bin);
                                        // console.log('day_to_bin',day_to_bin);
            
                                        var concat_y_m_d = year_to_bin + month_to_bin + day_to_bin;
                                        // console.log('concat_y_m_d',concat_y_m_d);
            
                                        var first_4_char_concat_y_m_d = concat_y_m_d.substring(0, 4);
                                        // console.log('first_4_char_concat_y_m_d',first_4_char_concat_y_m_d);
            
                                        var f1_hex2bin = parseInt(first_4_char_concat_y_m_d, 2).toString(16).toUpperCase();
                                        // console.log('f1_hex2bin',f1_hex2bin);
            
                                        // Calculate d2
                                        var year_to_bin2 = (parseInt(year) - 2000).toString(2);
                                        var month_to_bin2 = (parseInt(month)).toString(2);
                                        var day_to_bin2 = (parseInt(day)).toString(2);
            
                                        if (year_to_bin2.length == 1) year_to_bin2 = "000000" + year_to_bin2;
                                        if (year_to_bin2.length == 2) year_to_bin2 = "00000" + year_to_bin2;
                                        if (year_to_bin2.length == 3) year_to_bin2 = "0000" + year_to_bin2;
                                        if (year_to_bin2.length == 4) year_to_bin2 = "000" + year_to_bin2;
                                        if (year_to_bin2.length == 5) year_to_bin2 = "00" + year_to_bin2;
                                        if (year_to_bin2.length == 6) year_to_bin2 = "0" + year_to_bin2;
            
                                        if (month_to_bin2.length == 1) month_to_bin2 = "000" + month_to_bin2;
                                        if (month_to_bin2.length == 2) month_to_bin2 = "00" + month_to_bin2;
                                        if (month_to_bin2.length == 3) month_to_bin2 = "0" + month_to_bin2;
            
            
                                        if (day_to_bin2.length == 1) day_to_bin2 = "0000" + day_to_bin2;
                                        if (day_to_bin2.length == 2) day_to_bin2 = "000" + day_to_bin2;
                                        if (day_to_bin2.length == 3) day_to_bin2 = "00" + day_to_bin2;
                                        if (day_to_bin2.length == 4) day_to_bin2 = "0" + day_to_bin2;
            
                                        // console.log('year_to_bin',year_to_bin2);
                                        // console.log('month_to_bin',month_to_bin2);
                                        // console.log('day_to_bin',day_to_bin2);
            
                                        var concat_y_m_d2 = year_to_bin2 + month_to_bin2 + day_to_bin2;
                                        // console.log('concat_y_m_d',concat_y_m_d2);
            
                                        var last_12_char_concat_y_m_d2 = concat_y_m_d2.substring(concat_y_m_d2.length - 12);
                                        var first_4_char_concat_y_m_d2 = last_12_char_concat_y_m_d2.substring(0, 4);
                                        // console.log('first_4_char_concat_y_m_d2',first_4_char_concat_y_m_d2);
            
                                        var f2_hex2bin = parseInt(first_4_char_concat_y_m_d2, 2).toString(16).toUpperCase();
                                        // console.log('f2_hex2bin',f2_hex2bin);
            
                                        // Calculate d3
                                        var last_8_char_concat_y_m_d3 = concat_y_m_d2.substring(concat_y_m_d2.length - 8);
                                        var first_4_char_concat_y_m_d3 = last_8_char_concat_y_m_d3.substring(0, 4);
                                        // console.log('first_4_char_concat_y_m_d3',first_4_char_concat_y_m_d3);
            
                                        var f3_hex2bin = parseInt(first_4_char_concat_y_m_d3, 2).toString(16).toUpperCase();
                                        // console.log('f3_hex2bin',f3_hex2bin);
            
                                        // Calculate d4
                                        var last_4_char_concat_y_m_d3 = concat_y_m_d2.substring(concat_y_m_d2.length - 4);
                                        // var first_4_char_concat_y_m_d3 = last_4_char_concat_y_m_d3.substring(0,4);
                                        // console.log('first_4_char_concat_y_m_d3',first_4_char_concat_y_m_d3);
            
                                        var f4_hex2bin = parseInt(last_4_char_concat_y_m_d3, 2).toString(16).toUpperCase();
                                        // console.log('f4_hex2bin',f4_hex2bin);
            
                                        var dateStr = f1_hex2bin + f2_hex2bin + f3_hex2bin + f4_hex2bin;
                                        //  console.log('dateStr::::::::::::::::::::::::::',dateStr);
            
                                        return dateStr;
                                    }
            
                                    function getStr5(serial) {
                                        // console.log("serial_number conversion........", serial);
            
                                        
                                        
            
            
                                        var decimal_to_hex = parseInt(serial, 10).toString(16).toUpperCase();
                                        // console.log('decimal_to_hex::', decimal_to_hex);
            
                                        if (decimal_to_hex.length == 1) decimal_to_hex = "000" + decimal_to_hex;
                                        if (decimal_to_hex.length == 2) decimal_to_hex = "00" + decimal_to_hex;
                                        if (decimal_to_hex.length == 3) decimal_to_hex = "0" + decimal_to_hex;
                                        // if (decimal_to_hex.length == 4) decimal_to_hex = "00" + decimal_to_hex;
                                        // if (decimal_to_hex.length == 5) decimal_to_hex = "0" + decimal_to_hex;
            
            
                                        return decimal_to_hex;
                                    }
                                    // getStr5("5560");
                                    var bin_number = '000' + capacity + getStr2(supplier, mfg) + getStr3(PackSupplier) + getStr4(year, month, day) + plant_line.toString() + getStr5(serial);
                                  
                                    // console.log('capacity ::::::::::::::::::::::::::::::::::::::::::::::::::::::', capacity);
                                  
                                    // console.log('plant_line ::::::::::::::::::::::::::::::::::::::::::::::::::::::', plant_line);
                                    // console.log('PackSupplier ::::::::::::::::::::::::::::::::::::::::::::::::::::::', getStr3(PackSupplier));
                                    // console.log('getStr4 ::::::::::::::::::::::::::::::::::::::::::::::::::::::',  getStr4(year, month, day));
                                    // console.log('getStr2 ::::::::::::::::::::::::::::::::::::::::::::::::::::::',  getStr2(supplier, mfg));
                                    // console.log('getStr5(serial) ::::::::::::::::::::::::::::::::::::::::::::::::::::::', getStr5(serial));
            
            
                                    // console.log('gen_bin::::::::::::::::::::::::::::::::::::::::::::::::::::::', bin_number);
            
            
                                    //socket.emit();
            
            
            
                                   var final_json_string =`${bin_number}, ${num1}, ${num2}, 118635 , ${num1}, ${num2} ,${bms_no} ,118635 , ${hex_string_dup}`;
                                  //  var final_json_string = '{"bin":"' + bin_number + '","part":{"pNum":"' + num1 + '","pRev":"' + num2 + '","vCode":"118635"},"cu":{"pNum":"' + num1 + '","pRev":"' + num2 + '","srNum":"' + bms_no + '","vcode":"118635","sw":{"hexFNapp":"' + hex_string + '"}}}';
            
            
            
                                    // console.log("testttting bin",bin_number,final_json_string,nom_voltage_value,min_capacity_value,batterypart,todaydate,finalqr);
            
                                    socket.emit("sendGeneratedBinforChecking",bin_number,final_json_string);
            
            
                                    var dbQuery = `UPDATE taco_treceability.taco_treceability.finalqr_bms_details SET nom_voltage_value='${nom_voltage_value}',min_capacity_value='${min_capacity_value}',batterypart='${batterypart}',final_date='${todaydate}' WHERE  FinalQRCode='${finalqr}'`;
            sql.connect(sqlConfig, function (err) {
                request = new sql.Request();
            
                request.query(dbQuery, function (err, recordset) {
                    if (err) console.log(err);
            
                });
            });
            
            
                                  
                                }
                            }
                        });
                    });
            
            
            
                }
               
            });
            
            
            socket.on('saveBinNumberData', (bin_number,bin_json,modulebarcode) => {
            // console.log("saveBinNumberData::::",bin_number,bin_json,modulebarcode);
            
            var finalqr;
            
            var query4 = `SELECT TOP (1) * FROM taco_treceability.taco_treceability.finalqr_bms_details where module_qrcode='${modulebarcode}' `;
            sql.connect(sqlConfig, function (err) {
                request = new sql.Request();
                request.query(query4, function (err, recordset) {
                    if (err) console.log(err);
                    var result = recordset.recordset;
                    // console.log("result:", result);
                    if (result.length != 0) {
                        for (var i in result) {
                            var sr_no = result[i].sr_no;
                            var pack_no = result[i].pack_no;
                            var pack_qrcode = result[i].module_qrcode;
                            var hex_string = result[i].hex_string;
                            var string1 = result[i].string1;
                             var bmsmfg=result[i].bmsmfg;
                            var bms_no = result[i].bms_no;

                             finalqr= result[i].FinalQRCode;
            
                        }
            
            
                        var dbQuery = `UPDATE taco_treceability.taco_treceability.finalqr_bms_details SET bin_no='${bin_number}',final_json_string='${bin_json}' WHERE  FinalQRCode='${finalqr}'`;
                        sql.connect(sqlConfig, function (err) {
                            request = new sql.Request();
                        
                            request.query(dbQuery, function (err, recordset) {
                                if (err) console.log(err);
                        
                            });
                        });
            
            
            
            
                    }
                });
            }); 
            
            });
            

/////////////////////////////////////////new code/////////////////////////////////////////////////////



socket.on("getAirLeakageStatus_6_old_to_new", function (battery_qrcode,barcode,tepC) {
    try {
        const dbSelectQuery = `
            SELECT TOP 1 ModuleBarcode
            FROM taco_treceability.station_status 
            WHERE FinalQRCode='${battery_qrcode}'
        `;

        sql.connect(sqlConfig, async (err) => {
            if (err) {
                console.error("DB connection error:", err);
                return;
            }

            const request = new sql.Request();
            request.query(dbSelectQuery, async (err, recordset) => {
                if (err) {
                    console.error("Query error:", err);
                    return;
                }

                const result1 = recordset.recordset;

                if (result1.length === 0) {
                    socket.emit(
                        "setAirLeakageStatus_6_old_to_new",
                        {
                            EOL_status: "NOT OK"
                        },
                        battery_qrcode,barcode
                    );
                    return;
                }

                // GET ONLY TOP 1 MODULE BARCODE
                const moduleBarcode = result1[0].ModuleBarcode;
                console.log("Processing module:", moduleBarcode);

                const stationIds = [4];

                // Flags
             
                let EOL_ok = false;
           

                const apiCalls = stationIds.map(station_id =>
                    axios.post(
                        "https://mismainapp.tataautocomp.com:3241/station_interlock",
                        {
                            station_id: station_id,
                            line_id: 1,
                            customer_qrcode: moduleBarcode
                        },
                        { httpsAgent: agent }
                    )
                );

                try {
                    const responses = await Promise.all(apiCalls);

                    for (const resp of responses) {
                      console.log("yyyyy:",resp.data);
                        const rows = resp.data[0].rows;
                        console.log("fffffffff:",rows);
                        if (!rows || !Array.isArray(rows)) continue;

                        for (const rowObj of rows) {
                            for (const [key, val] of Object.entries(rowObj)) {

                                const valClean = (val || "").toString().trim();


                                  console.log("check status:",valClean,key,val,moduleBarcode);
                                // ====================================================
                                // STRICT CHECK (NO lowercase, NO includes)
                                // ====================================================

                                // ---------------- ALT ----------------
                                // if (key === "ALT" || key === "ALT2" || key === "ALT3") {
                                //     if (valClean === "OK") ALT_ok = true;
                                //     console.log("ALT_ok:",valClean,ALT_ok);
                                // }

                                // ---------------- EOL ----------------
                                if (key === "EOL" || key==="EOL_Autograph") {
                                    if (valClean === "OK") EOL_ok = true;
                                       console.log("EOL_ok:",valClean,EOL_ok);
                                }

                                // ---------------- PDI ----------------
                                // if (key === "PDI") {
                                //     if (valClean === "OK") PDI_ok = true;
                                //       console.log("PDI_ok:",valClean,PDI_ok);
                                // }
                            }
                        }
                    }

                    // FINAL RESULT
                    const finalResult = {
                       
                        EOL_status: EOL_ok ? "OK" : "NOT OK"
                       
                    };

                    console.log("FINAL RESULT SENT TO FRONTEND:", finalResult);

                    socket.emit("setAirLeakageStatus_6_old_to_new", finalResult, battery_qrcode,barcode);

                } catch (apiErr) {
                    console.error("API error:", apiErr.message);
                }
            });
        });

    } catch (error) {
        console.error("Unexpected error:", error.message);
    }
});

socket.on('getAirLeakageStatus', (battery_qrcode,tepC) => {

    var dataObj;
    var ModulePrintStatus = true;
    var Welding_status = true;
    var IR_V_status = true;
    var FinalQRCodePrint_status = true;
    var ChargingDischarging_status = true;
    var finalQRCode='';
    var pname;
    // var dbSelectQuery = `SELECT * FROM station_status where FinalQRCode='${battery_qrcode}'`;
    var dbSelectQuery = `SELECT * FROM taco_treceability.taco_treceability.station_status where FinalQRCode=(SELECT final_qrcode FROM taco_treceability.taco_treceability.final_qrcode_details where CustomerQRCode='${battery_qrcode}')`;
    // console.log('air dbSelectQuery-------', dbSelectQuery);
    sql.connect(sqlConfig, function (err) {
        request = new sql.Request();
        request.query(dbSelectQuery, function (err, recordset) {
           if (err) console.log(err)
           var result1=recordset.recordset;
            if (result1.length > 0) {
                finalQRCode = result1[0].FinalQRCode;
                pname = result1[0].PackName;
                for (var i = 0; i < result1.length; i++) {
                    if (result1[i].ModulePrintStatus == "NOT OK") {
                        ModulePrintStatus = false;
                    }
                    if (result1[i].Welding_status == "NOT OK") {
                        Welding_status = false;
                    }
                    if (result1[i].IR_V_status == "NOT OK") {
                        IR_V_status = false;
                    }
                    if (result1[i].ChargingDischarging_status == "NOT OK") {
                        ChargingDischarging_status = false;
                    }
                    if (result1[i].FinalQRCodePrint_status == "NOT OK") {
                        FinalQRCodePrint_status = false;
                    } 
    
                    dataObj = {
                        "ModulePrintStatus": ModulePrintStatus,
                        "Welding_status": Welding_status,
                        "IR_V_status": IR_V_status,
                        "FinalQRCodePrint_status": FinalQRCodePrint_status,
                        "ChargingDischarging_status": ChargingDischarging_status
                    };
                    
                }
                ////////////////////////////////////////////////////


var dbSelectQuery2 = `SELECT * FROM taco_treceability.taco_treceability.air_leakage_testing where final_qrcode='${finalQRCode}'`;
// console.log('air dbSelectQuery-------', dbSelectQuery2,newbarcode);
sql.connect(sqlConfig, function (err) {
    request = new sql.Request();
    request.query(dbSelectQuery2, function (err, recordset) {
       if (err) console.log(err)
       var result1=recordset.recordset;
        if (result1.length > 0) {
        //   console.log("11111111111111:",result1);
            for (var i in result1) {
            }

            if (result1.length > 1) {

            }
            else{
                // console.log("2222222222222222:",pname);
               if(pname == 'Limber'){
                // console.log("333333333333333333333333:",pname);
                   request2 = new sql.Request();
                       request2.query("INSERT INTO taco_treceability.taco_treceability.air_leakage_testing(battery_id, battery_pack_name, final_qrcode, body_reading_unit, coolant_reading_unit, status, body_coolant_status, plug_status) values ('Rear','" + pname + "','" + finalQRCode + "','Pa','','incomplete','NOT OK','NOT OK')", function (err, recordset) {
                       if (err) console.log(err)
                      // var rows=recordset.recordset;
                       // "INSERT INTO taco_treceability.taco_treceability.users(name,user_code,emailid,designation,location,line,username,password) values ('" + name + "','" + code + "','" + emailid + "','" + designation + "','" + location_arr + "','" + line_arr + "','" + username + "','" + password1 + "')", (err, rows, fields) => {
                       //     if (err) console.log(err);
                       });
               }
            }
        }
    });
});


//////////////////////////////////////////////////////////

                socket.emit('setAirLeakageStatus', dataObj,finalQRCode,battery_qrcode,tepC);
               
            } else {
                socket.emit('setAirLeakageStatus', 'PackNOTFOUND','finalQRCode',battery_qrcode,tepC);
            }
        });
    });
    // var dbQuery = `update final_qrcode_details set status='Printed' where final_qrcode='${battery_qrcode}'`;
});

socket.on('getAirLeakageStatus_6', (battery_qrcode,tepC) => {

    var dataObj=[];
    var ModulePrintStatus = true;
    var Welding_status = true;
    var IR_V_status = true;
    var FinalQRCodePrint_status = true;
    var ChargingDischarging_status = true;
    var finalQRCode='';
    var pname;
    // var dbSelectQuery = `SELECT * FROM station_status where FinalQRCode='${battery_qrcode}'`;
    var dbSelectQuery = `SELECT * FROM taco_treceability.taco_treceability.station_status where ModuleBarcode='${battery_qrcode}'`;
    // console.log('air dbSelectQuery-------', dbSelectQuery);
    sql.connect(sqlConfig, function (err) {
        request = new sql.Request();
        request.query(dbSelectQuery, function (err, recordset) {
           if (err) console.log(err)
           var result1=recordset.recordset;
            if (result1.length > 0) {
                finalQRCode = result1[0].FinalQRCode;
                pname = result1[0].PackName;
                for (var i in result1) {
                    if (result1[i].ModulePrintStatus == "NOT OK") {
                        ModulePrintStatus = false;
                    }
                    if (result1[i].Welding_status == "NOT OK") {
                        Welding_status = false;
                    }
                    if (result1[i].IR_V_status == "NOT OK") {
                        IR_V_status = false;
                    }
                    if (result1[i].ChargingDischarging_status == "NOT OK") {
                        ChargingDischarging_status = false;
                    }
                    if (result1[i].FinalQRCodePrint_status == "NOT OK") {
                        FinalQRCodePrint_status = false;
                    } 
    
                    dataObj.push({
                        "ModulePrintStatus": ModulePrintStatus,
                        "Welding_status": Welding_status,
                        "IR_V_status": IR_V_status,
                        "FinalQRCodePrint_status": FinalQRCodePrint_status,
                        "ChargingDischarging_status": ChargingDischarging_status
                    });
                  
                }
               
//getreworkstatus(dataObj,finalQRCode,battery_qrcode,tepC);
getreworkstatus_alt(dataObj,finalQRCode,battery_qrcode,tepC);

              //  socket.emit('setAirLeakageStatus_6', dataObj,finalQRCode,battery_qrcode,tepC);
               
            } else {
                socket.emit('setAirLeakageStatus_6', 'PackNOTFOUND','finalQRCode',battery_qrcode,tepC,'');
            }
        });
    });
    // var dbQuery = `update final_qrcode_details set status='Printed' where final_qrcode='${battery_qrcode}'`;
});




function getreworkstatus_alt(dataObj,qrcode,battery_qrcode,tepC){


    console.log("rework tvs 2:",dataObj,qrcode,battery_qrcode,tepC);
    var ProductCode=qrcode.split('-')[0];
    var packname;
    
     if(ProductCode == 'DJ1828'){packname = 'Kanger 1';}
     // if(ProductCode == 'DJ1828'){packname = 'Kanger 1 Gen 3';}
       if(ProductCode == 'DJ2018'){packname = 'Kanger 2';}
        if(ProductCode == 'DJ1921'){packname = 'Limber';}
         if(ProductCode == 'DJ1911'){packname = 'Challenger LR';}
          if(ProductCode == 'DJ1912'){packname = 'Challenger MR';}
           if(ProductCode == 'DJ1913'){packname = 'Bajaj 5.9';}
            if(ProductCode == 'DJ1914'){packname = 'Bajaj 8.9';}
             if(ProductCode == 'DJ1915'){packname = 'Bajaj 11.8';}  
      if(ProductCode == 'DJ2025'){packname = 'NOVA Prismatic LR';} 
               if(ProductCode == 'DJ2028'){packname = 'Tamor';} 
               if(ProductCode == 'DJ1927'){packname = 'TVS 9';} 
    if(ProductCode == 'DJ2030'){packname = 'Bajaj 12.1';} 
    if(ProductCode == 'DJ2041'){packname = 'Bajaj 6.1';} 
               if(ProductCode == 'DJ2042'){packname = 'Bajaj 9.2';} 
                 if(ProductCode == 'DJ2043'){packname = 'Bajaj 12.2';} 
    
        // var dbQuery = `SELECT * FROM taco_treceability.taco_treceability.mis_rejection_data where (final_qrcode LIKE '%${finalQRCode}%') and rework_status='rejected'`;
    
        //             sql.connect(sqlConfig, function (err) {
        //                 request = new sql.Request();
        //                 request.query(dbQuery, function (err, recordset) {
        //                     if (err) console.log(err)
        //                     var result=recordset.recordset;
    
        //                     var stationList = [];
        //                     for (var i in result) {
        //                         stationList.push(result[i].rework_remark);
        //                     }
        //                     socket.emit('setAirLeakageStatus_6', dataObj,finalQRCode,battery_qrcode,tepC,stationList);
        //                 });
        //             });
    
            var stationList = [];
            var rework_station = [];
            
            // Function to handle the DB query logic
            function getReworkStatus() {
                var dbQuery = `SELECT * FROM taco_treceability.taco_treceability.rework_defect_list WHERE final_qrcode LIKE '%${qrcode}%' `;
        
                sql.connect(sqlConfig, function (err) {
                    if (err) return console.log(err);
                    
                    request = new sql.Request();
                    request.query(dbQuery, function (err, recordset) {
                        if (err) return console.log(err);
        
                        var result = recordset.recordset;
        
                        if (result.length > 0) {
                            // Process rework defect list
                            for (var i in result) {
                                rework_station.push({ status: 'Pending', station: result[i].station_name });
                            }
                        }
        
                        // Run second query whether rework defects are found or not
                        runSecondQuery(qrcode, packname, rework_station);
                    });
                });
            }
        
            // Function to handle the second SQL query for mis_rejection_data
            function runSecondQuery(qrcode, packname, fallbackData) {
                console.log("rework_interlock:", qrcode, packname, fallbackData);
        
                var dbQuery = `SELECT * FROM taco_treceability.taco_treceability.mis_rejection_data WHERE final_qrcode LIKE '%${qrcode}%' `;
        
                sql.connect(sqlConfig, function (err) {
                    if (err) return console.log(err);
        
                    request = new sql.Request();
                    request.query(dbQuery, function (err, recordset) {
                        if (err) return console.log(err);
        
                        var result = recordset.recordset;
        
                        if (result.length > 0) {
                            // Populate stationList with rejection data
                            for (var i in result) {
                                stationList.push({ status: result[i].rework_status, station: result[i].station });
                                console.log("11111111111:",stationList);
                            }
                        }
        
                        // Combine and filter data
                        console.log("22222222222:",fallbackData,stationList);
                        const combinedStations = mergeAndFilterStations(fallbackData, stationList);
    
    
        
                        // Emit the filtered data
                       // socket.emit('setReworkStatus_interlock', combinedStations, qrcode, packname);
                       check_eol_auto_graph_status(dataObj,qrcode,battery_qrcode,tepC,combinedStations,qrcode);
                 
                    //   socket.emit('setAirLeakageStatus_6', dataObj,qrcode,battery_qrcode,tepC,combinedStations);
                    });
                });
            }
            async function check_eol_auto_graph_status(dataObj,qrcode,battery_qrcode,tepC,combinedStations,qrcode){

                let sourcePool28;
                var dataObj1=[],arr_new=[];
                if(qrcode.includes('DJ19277-')){
                    try {
                        sourcePool28 = await new sql.ConnectionPool(configSource).connect();
                        const selectQuery = `SELECT Discharge_energy_KWH, Pack_end_voltage, Pack_nominal_capacity, Voltage_difference_before_test, Lowest_Voltage_before_test, Charging_terminal_Voltage_difference_35,Charging_terminal_Voltage_difference_36, Charging_Voltage_difference_after_standing, Charging_min_Voltage_after_standing, Discharge_terminal_Voltage_difference, Discharge_temperature_max,Discharge_temperature_difference, Discharge_Voltage_difference_after_standing, DCIR, SOH,SOC_status,BMS_SW_Major_version,BMS_SW_Minor_version FROM taco_treceability.taco_treceability.EOL_auto_graph_details where battery_pack_name='${qrcode}'`;
                        const result1= await sourcePool28.request().query(selectQuery);
                        console.log("sssssssss+++++++++++++++++++++++++++++++++++++++++++++++++++++++++", result1.recordset);
                        var EOL_auto_graph_status=false;
                        var result = result1.recordset;
                         console.log("sssssssss++++++++++++++++++++222+++++++++++++++++++++++++++++++++++++", result.recordset);
                       
                        if( result1.recordset.length>0){
                           // EOL_auto_graph_status=true;
                             for (var i in result) {
                              arr_new.push(result[i].Discharge_energy_KWH); 
                              arr_new.push(result[i].Pack_end_voltage); 
                              arr_new.push(result[i].Pack_nominal_capacity); 
                              arr_new.push(result[i].Voltage_difference_before_test); 
                              arr_new.push(result[i].Lowest_Voltage_before_test); 
                              arr_new.push(result[i].Charging_terminal_Voltage_difference_35); 
                              arr_new.push(result[i].Charging_terminal_Voltage_difference_36); 
                              arr_new.push(result[i].Charging_Voltage_difference_after_standing); 
                              arr_new.push(result[i].Charging_min_Voltage_after_standing); 
                              arr_new.push(result[i].Discharge_terminal_Voltage_difference); 
                              arr_new.push(result[i].Discharge_temperature_max); 
                              arr_new.push(result[i].Discharge_temperature_difference); 
                              arr_new.push(result[i].Discharge_Voltage_difference_after_standing); 
                              arr_new.push(result[i].DCIR); 
                              arr_new.push(result[i].SOH); 
                              arr_new.push(result[i].SOC_status); 
                              arr_new.push(result[i].BMS_SW_Major_version); 
                              arr_new.push(result[i].BMS_SW_Minor_version); 
                          
                            }
                             if (arr_new.toString().includes("NOT OK")) {
                             EOL_auto_graph_status=false; 
                            }
                             else{
                                EOL_auto_graph_status=true; 
                             }
                        }else{
                            EOL_auto_graph_status=false;
                        }
                        dataObj1.push({
                            "EOL_auto_graph_status":EOL_auto_graph_status
                        });
                       console.log("dataObj",dataObj1);
                        socket.emit('setAirLeakageStatus_6', dataObj,qrcode,battery_qrcode,tepC,combinedStations,dataObj1);
                    } catch (err) {
                        console.error('Error during synchronization:', err);
                    } finally {
                        if (sourcePool28) await sourcePool28.close();
                    }
    
                }
                  else if(qrcode.includes('DJ20422-') || qrcode.includes('DJ20300-')){
                    try {
                        sourcePool28 = await new sql.ConnectionPool(configSource).connect();
                         const selectQuery = `SELECT Voltage_difference_before_test,Lowest_Voltage_before_test,Charging_terminal_Voltage_difference_35,Charging_terminal_Voltage_difference_36,Charging_Voltage_difference_after_standing,Charging_min_Voltage_after_standing,Discharge_terminal_Voltage_difference,Discharge_temperature_Rise,Discharge_temperature_difference,Discharge_energy_KWH,Discharge_Voltage_difference_after_standing,SOC_status,Pack_end_voltage,Pack_nominal_capacity,SOH,BMS_SW_Major_version,BMS_SW_Minor_version,BMS_SWRevision,ESS_BMS_FEToverheat_St_B,ESS_BMS_AFEfault_St_B,ESS_BMS_PcbTemp_Act_degC,ESS_BMS_Temperature_Act_degC,ESS_BMS_extFuseBlown_St_B,ESS_BMS_BrickTempShort_St_B,ESS_BMS_CapFulCharge_Est_Ah,ESS_BMS_EnergyFulCharge_Est_kWh FROM taco_treceability.taco_treceability.EOL_auto_graph_details_Bajaj_9_2 where battery_pack_name='${qrcode}'`;
                        const result1= await sourcePool28.request().query(selectQuery);
                        console.log("sssssssss+++++++++++++++++++++++++++++++++++++++++++++++++++++++++", result1.recordset);
                        var EOL_auto_graph_status=false;
                        var result = result1.recordset;
                         console.log("sssssssss++++++++++++++++++++222+++++++++++++++++++++++++++++++++++++", result.recordset);
                       
                        if( result1.recordset.length>0){
                           // EOL_auto_graph_status=true;
                              for (var i in result) {
                              arr_new.push(result[i].Voltage_difference_before_test); 
                              arr_new.push(result[i].Lowest_Voltage_before_test); 
                              arr_new.push(result[i].Charging_terminal_Voltage_difference_35); 
                              arr_new.push(result[i].Charging_terminal_Voltage_difference_36); 
                              arr_new.push(result[i].Charging_Voltage_difference_after_standing); 
                              arr_new.push(result[i].Charging_min_Voltage_after_standing); 
                              arr_new.push(result[i].Discharge_terminal_Voltage_difference); 
                              arr_new.push(result[i].Discharge_temperature_Rise); 
                              arr_new.push(result[i].Discharge_temperature_difference); 
                              arr_new.push(result[i].Discharge_energy_KWH); 
                              arr_new.push(result[i].Discharge_Voltage_difference_after_standing); 
                              arr_new.push(result[i].SOC_status); 
                              arr_new.push(result[i].Pack_end_voltage); 
                              arr_new.push(result[i].Pack_nominal_capacity); 
                              arr_new.push(result[i].SOH); 
                              arr_new.push(result[i].BMS_SW_Major_version);
                              arr_new.push(result[i].BMS_SW_Minor_version);
                              arr_new.push(result[i].BMS_SWRevision);
                              arr_new.push(result[i].ESS_BMS_FEToverheat_St_B); 
                              arr_new.push(result[i].ESS_BMS_AFEfault_St_B); 
                              arr_new.push(result[i].ESS_BMS_PcbTemp_Act_degC); 
                              arr_new.push(result[i].ESS_BMS_Temperature_Act_degC); 
                              arr_new.push(result[i].ESS_BMS_extFuseBlown_St_B); 
                              arr_new.push(result[i].ESS_BMS_BrickTempShort_St_B); 
                              arr_new.push(result[i].ESS_BMS_CapFulCharge_Est_Ah); 
                              arr_new.push(result[i].ESS_BMS_EnergyFulCharge_Est_kWh); 
                            }
                             if (arr_new.toString().includes("NOT OK")) {
                             EOL_auto_graph_status=false; 
                            }
                             else{
                                EOL_auto_graph_status=true; 
                             }
                        }else{
                            EOL_auto_graph_status=false;
                        }
                        dataObj1.push({
                            "EOL_auto_graph_status":EOL_auto_graph_status
                        });
                       console.log("dataObj",dataObj1);
                        socket.emit('setAirLeakageStatus_6', dataObj,qrcode,battery_qrcode,tepC,combinedStations,dataObj1);
                    } catch (err) {
                        console.error('Error during synchronization:', err);
                    } finally {
                        if (sourcePool28) await sourcePool28.close();
                    }
    
                }
                else{
                    dataObj1.push({
                        "EOL_auto_graph_status":true
                    });
                   console.log("dataObj",dataObj1);
                    socket.emit('setAirLeakageStatus_6', dataObj,qrcode,battery_qrcode,tepC,combinedStations,dataObj1);
     
                }
               
            }
            // Function to merge and filter stations
            function mergeAndFilterStations(reworkData, rejectionData) {
                const stationMap = new Map();
        
                // Add stations from rework data with "Pending" status
                for (const item of reworkData) {
                    stationMap.set(item.station, item.status);
                }
        
                // Add stations from rejection data, override only if not already "Pending"
                for (const item of rejectionData) {
                    if (!stationMap.has(item.station) || stationMap.get(item.station) !== 'reworked') {
                        stationMap.set(item.station, item.status);
                    }
                }
        
                // Convert back to an array of objects
                return Array.from(stationMap.entries()).map(([station, status]) => ({ station, status }));
            }
        
            // Start the first query
            getReworkStatus();  
    }

// function getreworkstatus(dataObj,finalQRCode,battery_qrcode,tepC){

//     var dbQuery = `SELECT * FROM taco_treceability.taco_treceability.mis_rejection_data where (final_qrcode LIKE '%${finalQRCode}%')`;

//                 sql.connect(sqlConfig, function (err) {
//                     request = new sql.Request();
//                     request.query(dbQuery, function (err, recordset) {
//                         if (err) console.log(err)
//                         var result=recordset.recordset;

//                         var stationList = [];
//                         for (var i in result) {
//                             stationList.push(result[i].rework_remark);
//                         }
//                       //  socket.emit('setAirLeakageStatus_6', dataObj,finalQRCode,battery_qrcode,tepC,stationList);
//                       check_eol_auto_graph_status(dataObj,finalQRCode,battery_qrcode,tepC,stationList);
//                     });
//                 });

  
//     //var dbQuery = `SELECT Distinct(defect_name) as def_name FROM taco_treceability.taco_treceability.rework_defect_list WHERE (final_qrcode LIKE '%${finalQRCode}%')`;

//         // sql.connect(sqlConfig, function (err) {
//         //     request = new sql.Request();
//         //     request.query(dbQuery, function (err, recordset) {
//         //         if (err) console.log(err)
//         //         var result=recordset.recordset;

//         //         var stationList = [];
//         //         for (var i in result) {
//         //             stationList.push(result[i].def_name);
//         //         }
//         //         socket.emit('setAirLeakageStatus_6', dataObj,finalQRCode,battery_qrcode,tepC,stationList);
//         //     });
//         // });
  
// }
//  async function check_eol_auto_graph_status(dataObj,qrcode,battery_qrcode,tepC,stationList){

//                 let sourcePool28;
//                 var dataObj1=[],arr_new=[];
//                 if(qrcode.includes('DJ19277-')){
//                     try {
//                         sourcePool28 = await new sql.ConnectionPool(configSource).connect();
//                         const selectQuery = `SELECT Discharge_energy_KWH, Pack_end_voltage, Pack_nominal_capacity, Voltage_difference_before_test, Lowest_Voltage_before_test, Charging_terminal_Voltage_difference_35,Charging_terminal_Voltage_difference_36, Charging_Voltage_difference_after_standing, Charging_min_Voltage_after_standing, Discharge_terminal_Voltage_difference, Discharge_temperature_max,Discharge_temperature_difference, Discharge_Voltage_difference_after_standing, DCIR, SOH,SOC_status,BMS_SW_Major_version,BMS_SW_Minor_version FROM taco_treceability.taco_treceability.EOL_auto_graph_details where battery_pack_name='${qrcode}'`;
//                         const result1= await sourcePool28.request().query(selectQuery);
//                         console.log("sssssssss+++++++++++++++++++++++++++++++++++++++++++++++++++++++++", result1.recordset);
//                         var EOL_auto_graph_status=false;
//                         var result = result1.recordset;
//                          console.log("sssssssss++++++++++++++++++++222++++++++++++++++++++++111111+++++++++++++++", result.recordset);
                       
//                         if( result1.recordset.length>0){
//                            // EOL_auto_graph_status=true;
//                              for (var i in result) {
//                               arr_new.push(result[i].Discharge_energy_KWH); 
//                               arr_new.push(result[i].Pack_end_voltage); 
//                               arr_new.push(result[i].Pack_nominal_capacity); 
//                               arr_new.push(result[i].Voltage_difference_before_test); 
//                               arr_new.push(result[i].Lowest_Voltage_before_test); 
//                               arr_new.push(result[i].Charging_terminal_Voltage_difference_35); 
//                               arr_new.push(result[i].Charging_terminal_Voltage_difference_36); 
//                               arr_new.push(result[i].Charging_Voltage_difference_after_standing); 
//                               arr_new.push(result[i].Charging_min_Voltage_after_standing); 
//                               arr_new.push(result[i].Discharge_terminal_Voltage_difference); 
//                               arr_new.push(result[i].Discharge_temperature_max); 
//                               arr_new.push(result[i].Discharge_temperature_difference); 
//                               arr_new.push(result[i].Discharge_Voltage_difference_after_standing); 
//                               arr_new.push(result[i].DCIR); 
//                               arr_new.push(result[i].SOH); 
//                               arr_new.push(result[i].SOC_status); 
//                               arr_new.push(result[i].BMS_SW_Major_version); 
//                               arr_new.push(result[i].BMS_SW_Minor_version); 
                          
//                             }
//                              if (arr_new.toString().includes("NOT OK")) {
//                              EOL_auto_graph_status=false; 
//                             }
//                              else{
//                                 EOL_auto_graph_status=true; 
//                              }
//                         }else{
//                             EOL_auto_graph_status=false;
//                         }
//                         dataObj1.push({
//                             "EOL_auto_graph_status":EOL_auto_graph_status
//                         });
//                        console.log("dataObj",dataObj1);
//                        socket.emit('setAirLeakageStatus_6', dataObj,finalQRCode,battery_qrcode,tepC,stationList,dataObj1);
//                     } catch (err) {
//                         console.error('Error during synchronization:', err);
//                     } finally {
//                         if (sourcePool28) await sourcePool28.close();
//                     }
    
//                 }
//                   else if(qrcode.includes('DJ20422-') || qrcode.includes('DJ20300-')){
//                     try {
//                         sourcePool28 = await new sql.ConnectionPool(configSource).connect();
//                          const selectQuery = `SELECT Voltage_difference_before_test,Lowest_Voltage_before_test,Charging_terminal_Voltage_difference_35,Charging_terminal_Voltage_difference_36,Charging_Voltage_difference_after_standing,Charging_min_Voltage_after_standing,Discharge_terminal_Voltage_difference,Discharge_temperature_Rise,Discharge_temperature_difference,Discharge_energy_KWH,Discharge_Voltage_difference_after_standing,SOC_status,Pack_end_voltage,Pack_nominal_capacity,SOH,BMS_SW_Major_version,BMS_SW_Minor_version,BMS_SWRevision,ESS_BMS_FEToverheat_St_B,ESS_BMS_AFEfault_St_B,ESS_BMS_PcbTemp_Act_degC,ESS_BMS_Temperature_Act_degC,ESS_BMS_extFuseBlown_St_B,ESS_BMS_BrickTempShort_St_B,ESS_BMS_CapFulCharge_Est_Ah,ESS_BMS_EnergyFulCharge_Est_kWh FROM taco_treceability.taco_treceability.EOL_auto_graph_details_Bajaj_9_2 where battery_pack_name='${qrcode}'`;
//                         const result1= await sourcePool28.request().query(selectQuery);
//                         console.log("sssssssss+++++++++++++++++++++++++++++++++++++++++++++++++++++++++", result1.recordset);
//                         var EOL_auto_graph_status=false;
//                         var result = result1.recordset;
//                          console.log("sssssssss++++++++++++++++++++222+++++++7777++++++++++++++++++++++++++++++", result);
                       
//                         if( result1.recordset.length>0){
//                            // EOL_auto_graph_status=true;
//                               for (var i in result) {
//                               arr_new.push(result[i].Voltage_difference_before_test); 
//                               arr_new.push(result[i].Lowest_Voltage_before_test); 
//                               arr_new.push(result[i].Charging_terminal_Voltage_difference_35); 
//                               arr_new.push(result[i].Charging_terminal_Voltage_difference_36); 
//                               arr_new.push(result[i].Charging_Voltage_difference_after_standing); 
//                               arr_new.push(result[i].Charging_min_Voltage_after_standing); 
//                               arr_new.push(result[i].Discharge_terminal_Voltage_difference); 
//                               arr_new.push(result[i].Discharge_temperature_Rise); 
//                               arr_new.push(result[i].Discharge_temperature_difference); 
//                               arr_new.push(result[i].Discharge_energy_KWH); 
//                               arr_new.push(result[i].Discharge_Voltage_difference_after_standing); 
//                               arr_new.push(result[i].SOC_status); 
//                               arr_new.push(result[i].Pack_end_voltage); 
//                               arr_new.push(result[i].Pack_nominal_capacity); 
//                               arr_new.push(result[i].SOH); 
//                               arr_new.push(result[i].BMS_SW_Major_version);
//                               arr_new.push(result[i].BMS_SW_Minor_version);
//                               arr_new.push(result[i].BMS_SWRevision);
//                               arr_new.push(result[i].ESS_BMS_FEToverheat_St_B); 
//                               arr_new.push(result[i].ESS_BMS_AFEfault_St_B); 
//                               arr_new.push(result[i].ESS_BMS_PcbTemp_Act_degC); 
//                               arr_new.push(result[i].ESS_BMS_Temperature_Act_degC); 
//                               arr_new.push(result[i].ESS_BMS_extFuseBlown_St_B); 
//                               arr_new.push(result[i].ESS_BMS_BrickTempShort_St_B); 
//                               arr_new.push(result[i].ESS_BMS_CapFulCharge_Est_Ah); 
//                               arr_new.push(result[i].ESS_BMS_EnergyFulCharge_Est_kWh); 
//                             }
//                              if (arr_new.toString().includes("NOT OK")) {
//                              EOL_auto_graph_status=false; 
//                             }
//                              else{
//                                 EOL_auto_graph_status=true; 
//                              }
//                         }else{
//                             EOL_auto_graph_status=false;
//                         }
//                         dataObj1.push({
//                             "EOL_auto_graph_status":EOL_auto_graph_status
//                         });
//                        console.log("dataObj",dataObj1);
//                        socket.emit('setAirLeakageStatus_6', dataObj,qrcode,battery_qrcode,tepC,stationList,dataObj1);
//                     } catch (err) {
//                         console.error('Error during synchronization:', err);
//                     } finally {
//                         if (sourcePool28) await sourcePool28.close();
//                     }
    
//                 }
//                 else{
//                     dataObj1.push({
//                         "EOL_auto_graph_status":true
//                     });
//                    console.log("dataObj",dataObj1);
//                      socket.emit('setAirLeakageStatus_6', dataObj,qrcode,battery_qrcode,tepC,stationList,dataObj1);
     
//                 }
               
//             }
socket.on('getAirLeakageStatus_61', (newbarcode,battery_qrcode,tepC) => {

    var dataObj=[];
    var ModulePrintStatus = true;
    var Welding_status = true;
    var IR_V_status = true;
    var FinalQRCodePrint_status = true;
    var ChargingDischarging_status = true;
    var finalQRCode='';
    var pname;
    // var dbSelectQuery = `SELECT * FROM station_status where FinalQRCode='${battery_qrcode}'`;
    var dbSelectQuery = `SELECT * FROM taco_treceability.taco_treceability.station_status where FinalQRCode=(SELECT final_qrcode FROM taco_treceability.taco_treceability.final_qrcode_details where CustomerQRCode='${newbarcode}')`;
    // console.log('air dbSelectQuery-------', dbSelectQuery);
    sql.connect(sqlConfig, function (err) {
        request = new sql.Request();
        request.query(dbSelectQuery, function (err, recordset) {
           if (err) console.log(err)
           var result1=recordset.recordset;
            if (result1.length > 0) {
                finalQRCode = result1[0].FinalQRCode;
                pname = result1[0].PackName;
                for (var i in result1) {
                    if (result1[i].ModulePrintStatus == "NOT OK") {
                        ModulePrintStatus = false;
                    }
                    if (result1[i].Welding_status == "NOT OK") {
                        Welding_status = false;
                    }
                    if (result1[i].IR_V_status == "NOT OK") {
                        IR_V_status = false;
                    }
                    if (result1[i].ChargingDischarging_status == "NOT OK") {
                        ChargingDischarging_status = false;
                    }
                    if (result1[i].FinalQRCodePrint_status == "NOT OK") {
                        FinalQRCodePrint_status = false;
                    } 
    
                    dataObj.push({
                        "ModulePrintStatus": ModulePrintStatus,
                        "Welding_status": Welding_status,
                        "IR_V_status": IR_V_status,
                        "FinalQRCodePrint_status": FinalQRCodePrint_status,
                        "ChargingDischarging_status": ChargingDischarging_status
                    });
                   
                }
                
////////////////////////////////////////////////////


var dbSelectQuery2 = `SELECT * FROM taco_treceability.taco_treceability.air_leakage_testing where final_qrcode='${finalQRCode}'`;
// console.log('air dbSelectQuery-------', dbSelectQuery2,newbarcode);
sql.connect(sqlConfig, function (err) {
    request = new sql.Request();
    request.query(dbSelectQuery2, function (err, recordset) {
       if (err) console.log(err)
       var result1=recordset.recordset;
        if (result1.length > 0) {
        //   console.log("11111111111111:",result1);
            for (var i in result1) {
            }

            if (result1.length > 1) {

            }
            else{
                // console.log("2222222222222222:",pname);
               if(pname == 'Limber'){
                // console.log("333333333333333333333333:",pname);
                   request2 = new sql.Request();
                       request2.query("INSERT INTO taco_treceability.taco_treceability.air_leakage_testing(battery_id, battery_pack_name, final_qrcode, body_reading_unit, coolant_reading_unit, status, body_coolant_status, plug_status) values ('Rear','" + pname + "','" + finalQRCode + "','Pa','','incomplete','NOT OK','NOT OK')", function (err, recordset) {
                       if (err) console.log(err)
                      // var rows=recordset.recordset;
                       // "INSERT INTO taco_treceability.taco_treceability.users(name,user_code,emailid,designation,location,line,username,password) values ('" + name + "','" + code + "','" + emailid + "','" + designation + "','" + location_arr + "','" + line_arr + "','" + username + "','" + password1 + "')", (err, rows, fields) => {
                       //     if (err) console.log(err);
                       });
               }
            }
        }
    });
});


//////////////////////////////////////////////////////////
                socket.emit('setAirLeakageStatus_6', dataObj,finalQRCode,battery_qrcode,tepC);
               
            } else {
                socket.emit('setAirLeakageStatus_6', 'PackNOTFOUND','finalQRCode',battery_qrcode,tepC);
            }
        });
    });
    // var dbQuery = `update final_qrcode_details set status='Printed' where final_qrcode='${battery_qrcode}'`;
});
////////////10 May 2023 ////////////////

socket.on('saveALTqcdata',(packname, final_qrcode,line,op_name,qc_name)=>{
    var dqQuery = `SELECT * FROM taco_treceability.alt_qc_data where final_qrcode='${final_qrcode}'`;
   console.log("inser123:",dqQuery);
    sql.connect(sqlConfig, function (err) {
        request = new sql.Request();
        request.query(dqQuery, function (err, recordset) {
            // if (err) console.log(err);
            var result = recordset.recordset;
            if(result.length ==0){
                var dbQuery=`insert into taco_treceability.alt_qc_data(packname,final_qrcode,line,op_name,qccheck) values('${packname}','${final_qrcode}','${line}','${op_name}','${qc_name}')`;
        console.log('insert new fields query', dbQuery);
      
            request1 = new sql.Request();
            request1.query(dbQuery, function (err, recordset) {
                if (err) console.log(err);
            })
     //   });
            }
            else{

                var dbQuery=`UPDATE taco_treceability.alt_qc_data SET op_name='${op_name}',qccheck='${qc_name}' WHERE  final_qrcode='${final_qrcode}'`;
                console.log('UPDATE new fields query', dbQuery);
              
                    request1 = new sql.Request();
                    request1.query(dbQuery, function (err, recordset) {
                        if (err) console.log(err);
                    })
            }
        });
    });
});


socket.on("get_defectlist_for_alt", function () {
    var arr = [];
    sql.connect(sqlConfig, function (err) {
        request = new sql.Request();
        request.query("SELECT DISTINCT(defect_name) as defect_name,option_name FROM taco_treceability.taco_treceability.rework_defect_list where dept='ALT' ", function (err, recordset) {
            if (err) console.log(err);
            var result = recordset.recordset;
            for (var i in result) {
                var defect_name = result[i].defect_name;
                var option_name = result[i].option_name;
                arr.push(defect_name);
                arr.push(option_name);
            }
            setTimeout(function () {
                // console.log("ccccccccccccccccccccccccccccccccccccccccc", arr);
                socket.emit("set_defectlist_for_pack_assembly", arr);
            }, 100);
        });
    });
});
/*socket.on("get_defectlist_for_pack_assembly1", function (arr1) {
    var arr = [];
    sql.connect(sqlConfig, function (err) {
        request = new sql.Request();
        request.query("SELECT DISTINCT(defect_name) as defect_name FROM taco_treceability.taco_treceability.rework_defect_list where station_name='alt_station'", function (err, recordset) {
            if (err) console.log(err);
            var result = recordset.recordset;
            for (var i in result) {
                var defect_name = result[i].defect_name;
                arr.push(defect_name);
            }
            setTimeout(function () {
               // console.log("1111111111111111111111111",arr,arr1);
                var matches = false;
            var d_list_arr = [];
            for (var p1 = 0; p1 < arr.length; p1++) {
                matches = false;
                for (var p2 = 0; p2 < arr1.length; p2++) {
                    if (arr[p1] == arr1[p2]) {
                    d_list_arr.push(arr[p1]);
                    d_list_arr.push("YES");
                    matches = true;
                    }
                }
                if (!matches) {
                    d_list_arr.push(arr[p1]);
                    d_list_arr.push("NO");
                }
            }
         //  console.log("d_list_arr",d_list_arr);
                  for(var i=0;i<d_list_arr.length;i=i+2){
                        update_defetclist_pack_assembly(d_list_arr[i],d_list_arr[i+1]);
                    }
            }, 100);
        });
    });

   
});  */
/*function update_defetclist_pack_assembly(defect_name,option_name){
    sql.connect(sqlConfig, function (err) {
        request = new sql.Request();
        request.query("UPDATE taco_treceability.taco_treceability.rework_defect_list SET option_name='"+option_name+"' where station_name='alt_station' AND defect_name='"+defect_name+"'", function (err, recordset) {
            if (err) console.log(err);
        });
    });

} */

// socket.on("get_defectlist_for_pack_alt1", function (arr1,qrcode_str) {
//     var arr = [];
//     for(var i=0;i<arr1.length;i=i+1){
//                         update_defetclist_pack_assembly(arr1[i],qrcode_str);
//                     }
           

// });
socket.on("get_defectlist_for_pack_alt1", function (arr1,qrcode_str,packname) {
    console.log("rework_defect:",arr1,qrcode_str,packname);
    var arr = [];
    for(var i=0;i<arr1.length;i=i+1){
                        update_defetclist_pack_assembly(arr1[i],qrcode_str,packname);
                    }
           

});
// function update_defetclist_pack_assembly(defect_name,qrcode_str){
//     var final_qrcode='';
//     var new_qrstr;
//     // console.log("defect test:",defect_name,qrcode_str);
//     sql.connect(sqlConfig, function (err) {
//         request = new sql.Request();
//         request.query("SELECT final_qrcode FROM taco_treceability.taco_treceability.rework_defect_list where  defect_name='"+defect_name+"'", function (err, recordset) {
       
//        // request.query("SELECT final_qrcode FROM taco_treceability.taco_treceability.rework_defect_list where station_name='alt_station' AND defect_name='"+defect_name+"'", function (err, recordset) {
//             if (err) console.log(err);

//             var result = recordset.recordset;
          
//     if(result.length>0) {
//         for (var i in result) {
//          final_qrcode=result[i].final_qrcode;
    
//         }
//         // console.log("gggggggggggg:",final_qrcode,qrcode_str);

//         if(final_qrcode=='null' || final_qrcode==null || final_qrcode==''){
//             // console.log("rework qqqqqqqqqqqq222",final_qrcode,qrcode_str);
//             new_qrstr=qrcode_str;
//             // request.query("UPDATE taco_treceability.taco_treceability.rework_defect_list SET final_qrcode='"+new_qrstr+"' where station_name='alt_station' AND defect_name='"+defect_name+"'", function (err, recordset) {
//             //     if (err) console.log(err);
//             // });
//             request.query("UPDATE taco_treceability.taco_treceability.rework_defect_list SET final_qrcode='"+new_qrstr+"' where  defect_name='"+defect_name+"'", function (err, recordset) {
//                 if (err) console.log(err);
//             });

//         }
//         else{
// if(final_qrcode.includes(qrcode_str)){

// }
// else{
// // console.log("rework qqqqqqqqqqqq111111111",final_qrcode,qrcode_str);
// new_qrstr=final_qrcode+","+qrcode_str;
// // request.query("UPDATE taco_treceability.taco_treceability.rework_defect_list SET final_qrcode='"+new_qrstr+"' where station_name='alt_station' AND defect_name='"+defect_name+"'", function (err, recordset) {
// // if (err) console.log(err);
// // });
// request.query("UPDATE taco_treceability.taco_treceability.rework_defect_list SET final_qrcode='"+new_qrstr+"' where defect_name='"+defect_name+"'", function (err, recordset) {
//     if (err) console.log(err);
//     });
// }
          
//         }
//     }
// //
//         });

//         // request.query("UPDATE taco_treceability.taco_treceability.rework_defect_list SET option_name='"+option_name+"' where station_name='pack_assembly' AND defect_name='"+defect_name+"'", function (err, recordset) {
//         //     if (err) console.log(err);
//         // });
//     });

// }



// function update_defetclist_pack_assembly(defect_name,qrcode_str){

//     console.log("rework_yogita:",defect_name,qrcode_str);
//     var final_qrcode='';
//     var new_qrstr;
//    // console.log("defect test:",defect_name,qrcode_str);
//     sql.connect(sqlConfig, function (err) {
//         request = new sql.Request();
       
//         request.query("SELECT final_qrcode FROM taco_treceability.taco_treceability.rework_defect_list where  dept='ALT' AND defect_name='"+defect_name+"'", function (err, recordset) {
//             if (err) console.log(err);

//             var result = recordset.recordset;
          
//     if(result.length>0) {
//         for (var i in result) {
//          final_qrcode=result[i].final_qrcode;
    
//         }
//        // console.log("gggggggggggg:",final_qrcode,qrcode_str);

//         if(final_qrcode=='null' || final_qrcode==null || final_qrcode==''){
//             console.log("rework qqqqqqqqqqqq222",final_qrcode,qrcode_str);
//             new_qrstr=qrcode_str;
//             request.query("UPDATE taco_treceability.taco_treceability.rework_defect_list SET final_qrcode='"+new_qrstr+"' where station_name='alt_station' AND defect_name='"+defect_name+"'", function (err, recordset) {
//                 if (err) console.log(err);
//             });

//         }
//         else{
// if(final_qrcode.includes(qrcode_str)){

// }
// else{
// // console.log("rework qqqqqqqqqqqq111111111",final_qrcode,qrcode_str);
// new_qrstr=final_qrcode+","+qrcode_str;
// request.query("UPDATE taco_treceability.taco_treceability.rework_defect_list SET final_qrcode='"+new_qrstr+"' where station_name='alt_station' AND defect_name='"+defect_name+"'", function (err, recordset) {
// if (err) console.log(err);
// });
// }
          
//         }
//     }
// //
//         });

//         // request.query("UPDATE taco_treceability.taco_treceability.rework_defect_list SET option_name='"+option_name+"' where station_name='pack_assembly' AND defect_name='"+defect_name+"'", function (err, recordset) {
//         //     if (err) console.log(err);
//         // });
//     });

// }

 function update_defetclist_pack_assembly(defect_name, qrcode_str, packname) {

    console.log("rework_yogita:", defect_name, qrcode_str,packname);

    sql.connect(sqlConfig, function (err) {
        if (err) return console.log(err);

        let request = new sql.Request();

        // 1️⃣ FETCH existing final_qrcode
        request.query(
            `SELECT final_qrcode 
             FROM taco_treceability.taco_treceability.rework_defect_list 
             WHERE defect_name='${defect_name}'`,
            function (err, recordset) {

                if (err) return console.log(err);

                let result = recordset.recordset;
                if (result.length === 0) return;

                let final_qrcode = result[0].final_qrcode;
                let new_qrstr = "";

                // 2️⃣ CASE 1: final_qrcode is NULL or empty → set new STRING
                if (!final_qrcode || final_qrcode === 'null' || final_qrcode === '') {

                    new_qrstr = qrcode_str;

                    // UPDATE query
                    let updateReq = new sql.Request();
                    updateReq.query(
                        `UPDATE taco_treceability.taco_treceability.rework_defect_list
                         SET final_qrcode='${new_qrstr}'
                         WHERE defect_name='${defect_name}'`,
                        function (err) {
                            if (err) console.log(err);
                        }
                    );

                } else {

                    // 3️⃣ CASE 2: Append only if NOT already included
                    if (!final_qrcode.includes(qrcode_str)) {

                        new_qrstr = final_qrcode + "," + qrcode_str;

                        let updateReq = new sql.Request();
                        updateReq.query(
                            `UPDATE taco_treceability.taco_treceability.rework_defect_list
                             SET final_qrcode='${new_qrstr}'
                             WHERE defect_name='${defect_name}'`,
                            function (err) {
                                if (err) console.log(err);
                            }
                        );
                    } else {
                        // If already included, keep original
                        new_qrstr = final_qrcode;
                    }
                }

                // 4️⃣ INSERT QUERY (run for BOTH cases)
                let insertReq = new sql.Request();
                insertReq.query(
                    `INSERT INTO taco_treceability.mis_rejection_data
                     (battery_pack_name, rework_status, final_qrcode, station, rework_remark)
                     VALUES ('${packname}', 'rejected', '${qrcode_str}', 'alt_station', '${defect_name}')`,
                    function (err) {
                        if (err) console.log(err);
                        else console.log("Insert success");
                    }
                );

            }
        );
    });
}


socket.on('getAirLeakageStatus_8', (battery_qrcode,tepC) => {

    var dataObj=[];
    var ModulePrintStatus = true;
    var Welding_status = true;
    var IR_V_status = true;
    var FinalQRCodePrint_status = true;
    var ChargingDischarging_status = true;
    var finalQRCode='';
    var pname;
    // var dbSelectQuery = `SELECT * FROM station_status where FinalQRCode='${battery_qrcode}'`;
    var dbSelectQuery = `SELECT * FROM taco_treceability.taco_treceability.station_status where ModuleBarcode='${battery_qrcode}'`;
    // console.log('air dbSelectQuery-------', dbSelectQuery);
    sql.connect(sqlConfig, function (err) {
        request = new sql.Request();
        request.query(dbSelectQuery, function (err, recordset) {
           if (err) console.log(err)
           var result1=recordset.recordset;
            if (result1.length > 0) {
                finalQRCode = result1[0].FinalQRCode;
                pname = result1[0].PackName;
                for (var i in result1) {
                    if (result1[i].ModulePrintStatus == "NOT OK") {
                        ModulePrintStatus = false;
                    }
                    if (result1[i].Welding_status == "NOT OK") {
                        Welding_status = false;
                    }
                    if (result1[i].IR_V_status == "NOT OK") {
                        IR_V_status = false;
                    }
                    if (result1[i].ChargingDischarging_status == "NOT OK") {
                        ChargingDischarging_status = false;
                    }
                    if (result1[i].FinalQRCodePrint_status == "NOT OK") {
                        FinalQRCodePrint_status = false;
                    } 
    
                    dataObj.push({
                        "ModulePrintStatus": ModulePrintStatus,
                        "Welding_status": Welding_status,
                        "IR_V_status": IR_V_status,
                        "FinalQRCodePrint_status": FinalQRCodePrint_status,
                        "ChargingDischarging_status": ChargingDischarging_status
                    });
                  
                }
                
////////////////////////////////////////////////////


var dbSelectQuery2 = `SELECT * FROM taco_treceability.taco_treceability.air_leakage_testing where final_qrcode='${finalQRCode}'`;
// console.log('air dbSelectQuery-------', dbSelectQuery2,newbarcode);
sql.connect(sqlConfig, function (err) {
    request = new sql.Request();
    request.query(dbSelectQuery2, function (err, recordset) {
       if (err) console.log(err)
       var result1=recordset.recordset;
        if (result1.length > 0) {
        //   console.log("11111111111111:",result1);
            for (var i in result1) {
            }

            if (result1.length > 1) {

            }
            else{
                // console.log("2222222222222222:",pname);
               if(pname == 'Limber'){
                // console.log("333333333333333333333333:",pname);
                   request2 = new sql.Request();
                       request2.query("INSERT INTO taco_treceability.taco_treceability.air_leakage_testing(battery_id, battery_pack_name, final_qrcode, body_reading_unit, coolant_reading_unit, status, body_coolant_status, plug_status) values ('Rear','" + pname + "','" + finalQRCode + "','Pa','','incomplete','NOT OK','NOT OK')", function (err, recordset) {
                       if (err) console.log(err)
                      // var rows=recordset.recordset;
                       // "INSERT INTO taco_treceability.taco_treceability.users(name,user_code,emailid,designation,location,line,username,password) values ('" + name + "','" + code + "','" + emailid + "','" + designation + "','" + location_arr + "','" + line_arr + "','" + username + "','" + password1 + "')", (err, rows, fields) => {
                       //     if (err) console.log(err);
                       });
               }
            }
        }
    });
});


//////////////////////////////////////////////////////////
                socket.emit('setAirLeakageStatus_8', dataObj,finalQRCode,battery_qrcode,tepC);
               
            } else {
                socket.emit('setAirLeakageStatus_8', 'PackNOTFOUND','finalQRCode',battery_qrcode,tepC);
            }
        });
    });
    // var dbQuery = `update final_qrcode_details set status='Printed' where final_qrcode='${battery_qrcode}'`;
});
socket.on('getAirLeakageStatus_81', (newbarcode,battery_qrcode,tepC) => {

    var dataObj=[];
    var ModulePrintStatus = true;
    var Welding_status = true;
    var IR_V_status = true;
    var FinalQRCodePrint_status = true;
    var ChargingDischarging_status = true;
    var finalQRCode='';
    var pname;
    // var dbSelectQuery = `SELECT * FROM station_status where FinalQRCode='${battery_qrcode}'`;
    var dbSelectQuery = `SELECT * FROM taco_treceability.taco_treceability.station_status where FinalQRCode=(SELECT final_qrcode FROM taco_treceability.taco_treceability.final_qrcode_details where CustomerQRCode='${newbarcode}')`;
    // console.log('air dbSelectQuery-------', dbSelectQuery);
    sql.connect(sqlConfig, function (err) {
        request = new sql.Request();
        request.query(dbSelectQuery, function (err, recordset) {
           if (err) console.log(err)
           var result1=recordset.recordset;
            if (result1.length > 0) {
                finalQRCode = result1[0].FinalQRCode;
                pname = result1[0].PackName;
                for (var i in result1) {
                    if (result1[i].ModulePrintStatus == "NOT OK") {
                        ModulePrintStatus = false;
                    }
                    if (result1[i].Welding_status == "NOT OK") {
                        Welding_status = false;
                    }
                    if (result1[i].IR_V_status == "NOT OK") {
                        IR_V_status = false;
                    }
                    if (result1[i].ChargingDischarging_status == "NOT OK") {
                        ChargingDischarging_status = false;
                    }
                    if (result1[i].FinalQRCodePrint_status == "NOT OK") {
                        FinalQRCodePrint_status = false;
                    } 
    
                    dataObj.push({
                        "ModulePrintStatus": ModulePrintStatus,
                        "Welding_status": Welding_status,
                        "IR_V_status": IR_V_status,
                        "FinalQRCodePrint_status": FinalQRCodePrint_status,
                        "ChargingDischarging_status": ChargingDischarging_status
                    });
                   
                }
                ////////////////////////////////////////////////////


var dbSelectQuery2 = `SELECT * FROM taco_treceability.taco_treceability.air_leakage_testing where final_qrcode='${finalQRCode}'`;
// console.log('air dbSelectQuery-------', dbSelectQuery2,newbarcode);
sql.connect(sqlConfig, function (err) {
    request = new sql.Request();
    request.query(dbSelectQuery2, function (err, recordset) {
       if (err) console.log(err)
       var result1=recordset.recordset;
        if (result1.length > 0) {
        //   console.log("11111111111111:",result1);
            for (var i in result1) {
            }

            if (result1.length > 1) {

            }
            else{
                // console.log("2222222222222222:",pname);
               if(pname == 'Limber'){
                // console.log("333333333333333333333333:",pname);
                   request2 = new sql.Request();
                       request2.query("INSERT INTO taco_treceability.taco_treceability.air_leakage_testing(battery_id, battery_pack_name, final_qrcode, body_reading_unit, coolant_reading_unit, status, body_coolant_status, plug_status) values ('Rear','" + pname + "','" + finalQRCode + "','Pa','','incomplete','NOT OK','NOT OK')", function (err, recordset) {
                       if (err) console.log(err)
                      // var rows=recordset.recordset;
                       // "INSERT INTO taco_treceability.taco_treceability.users(name,user_code,emailid,designation,location,line,username,password) values ('" + name + "','" + code + "','" + emailid + "','" + designation + "','" + location_arr + "','" + line_arr + "','" + username + "','" + password1 + "')", (err, rows, fields) => {
                       //     if (err) console.log(err);
                       });
               }
            }
        }
    });
});


//////////////////////////////////////////////////////////

                socket.emit('setAirLeakageStatus_8', dataObj,finalQRCode,battery_qrcode,tepC);
               
            } else {
                socket.emit('setAirLeakageStatus_8', 'PackNOTFOUND','finalQRCode',battery_qrcode,tepC);
            }
        });
    });
    // var dbQuery = `update final_qrcode_details set status='Printed' where final_qrcode='${battery_qrcode}'`;
});

//////////////////////////

socket.on('savebypassALT', function (final_qrcode,operator_name,reason) {
   // console.log("testtttiiiiiiiiiiiiiiiiiiiiiiiiiiiiiinnnnnnnnnnnnnnng:",final_qrcode,operator_name,reason);
  // var todayDateStr2=new Date().getFullYear()+"-";
    var todayDateStr ='2023-05-08';
    var dbQuery = `SELECT * FROM taco_treceability.air_leakage_testing where final_qrcode='${final_qrcode}'`;
    sql.connect(sqlConfig, function (err) {
        request = new sql.Request();
        request.query(dbQuery, function (err, recordset) {
            if (err) console.log(err);
            var result=recordset.recordset;
            // console.log("result:::::",result);
            if(result.length>0){
                 request.query(`UPDATE taco_treceability.taco_treceability.air_leakage_testing SET bypass_operator='${operator_name}',bypass_reason='${reason}',bypass_date='${todayDateStr}' WHERE final_qrcode='${final_qrcode}'`, function (err, recordset) {

                 });

                 request.query(`UPDATE taco_treceability.taco_treceability.station_status SET ChargingDischarging_status='OK' WHERE FinalQRCode='${final_qrcode}'`, function (err, recordset) {

                 });
                //  console.log("ffffffffiiiiiiiiiiiiiiiiiiiiiiiiiiffffffffffffffffffffffffffffffffffffff");
            }
            else{
// console.log("NOT UPDATE");
            }
           
        });
    });
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////
            socket.on('getcustomerqrcode_alt', (packQRCODE, packname) => {
                ///connect to database for details of modules 
                //var resp = getDataNowPrinting(packQRCODE,packNameStr);
                var dbQuery = `SELECT CustomerQRCode,final_qrcode
                FROM taco_treceability.taco_treceability.final_qrcode_details where final_qrcode=(
              SELECT FinalQRCode
                FROM taco_treceability.taco_treceability.station_status where ModuleBarcode='${packQRCODE}')`;
                // console.log('getPackDataForPrintPackAssembly', dbQuery);
                sql.connect(sqlConfig, function (err) {
                    request = new sql.Request();
                    request.query(dbQuery, function (err, recordset) {
                        if (err) console.log(err)
                        var result = recordset.recordset;

                        var final_qrcodes = [], battery_pack_name;
                        var dataObj = {};
                        var final_no;
                        for (var i in result) {
                            dataObj = {
                                "CustomerQRCode": result[i].CustomerQRCode
                            }
                            final_qrcodes.push(dataObj);
                            final_no=result[i].final_qrcode;
                        }
                        socket.emit('setcustomerqrcode_alt', final_qrcodes, packname,final_no);
                    });
                });

            });
            // master print - start
            // Print Sticker - master print


socket.on('printAirleakageTest_masterprint', (packNO, body, coolant, plug1, plug2, packname, station_id, dateTimestamp, printToStation,final_qrcode) => {
    var bodyVal = body; //.split(' ')[0]
    var coolantVal = coolant; //.split(' ')[0]
    //var plug1Val=plug1.split(' ')[0]
    //var plug2Val=plug2.split(' ')[0]
console.log("printToStation",printToStation);
    var station_printer_ip = "";
    switch (printToStation) {
        case "alt": station_printer_ip = "10.9.4.72"; break;
        case "alt2": station_printer_ip = "10.9.4.79"; break;
        case "alt3": station_printer_ip = "10.9.4.86"; break;
        case "alt4": station_printer_ip = "10.9.4.93"; break;
        case "alt5": station_printer_ip = "10.9.4.181"; break;
        case "alt6": station_printer_ip = "10.9.4.107"; break;
        case "alt7": station_printer_ip = "10.9.4.114"; break;
        case "alt8": station_printer_ip = "10.9.4.121"; break;
       
    }


    // console.log('packNO,body,coolant,plug1,plug2', packNO, body, coolant, plug1, plug2);

    var formatedMonth, formatedDay, mm, dd, year;
    var todayDate = new Date();

    year = todayDate.getFullYear();
    mm = (todayDate.getMonth() + 1).toString();
    formatedMonth = (mm.length === 1) ? ("0" + mm) : mm;
    dd = todayDate.getDate().toString();
    formatedDay = (dd.length === 1) ? ("0" + dd) : dd;
    var dateStr = formatedDay + "-" + formatedMonth + "-" + year;

    //var dateTimestamp;

    var hh = todayDate.getHours();
    var mm = todayDate.getMinutes();
    var ss = todayDate.getSeconds();

    //dateTimestamp = formatedDay + "-" + formatedMonth + "-" + year + " " + hh +":" + mm + ":" + ss;

    var packnamefinal = packname.substring(0, 5);
    var capacity,mfg_date;
    console.log("packnamefinal alt6", packnamefinal,packname);
    if (printToStation=='alt6' && packnamefinal.includes('Bajaj')) {
                var batterypart;
                var nom_voltage_value;
                var min_capacity_value;
                var tac_no;
                if(packname=="Bajaj 5.9"){
                    batterypart="AH401901";
                    nom_voltage_value="51.2 V";
                    min_capacity_value="116Ah";
                    capacity='2';
                    tac_no='';
                }

        if(packname.includes("Bajaj 8.9")){
            batterypart="AH401967";
            nom_voltage_value="51.2 V";
            min_capacity_value="174Ah";
            capacity='3';
            tac_no='AN5079';
        }
       
        if(packname.includes("Bajaj 11.8")){
            // batterypart="AH401903";
            batterypart="BK401902";
            nom_voltage_value="51.2 V";
            min_capacity_value="232Ah";
            capacity='4';
            tac_no='AN5080';
        }
        if(packname=="Bajaj 6.1"){
            batterypart="AH401901";
            nom_voltage_value="51.2 V";
            min_capacity_value="120Ah";
        capacity='2';
        tac_no='AR8302';
    }
    if(packname.includes("Bajaj 9.2")){
        batterypart="AH415101";
        nom_voltage_value="51.2 V";
        min_capacity_value="180Ah";
        capacity='3';
        tac_no='AR8301';
    }
    if(packname.includes("Bajaj 12.2")){
        // batterypart="AH401903";
        batterypart="BK401902";
        nom_voltage_value="51.2 V";
        min_capacity_value="232Ah";
        capacity='4';
        tac_no='AR8300';
    }


    if(packname.includes("Bajaj 12.1")){
        batterypart="AH401933";
        nom_voltage_value="51.2 V";
        min_capacity_value="236.8Ah";
        capacity='4';
        tac_no='AR8249';
    }

        

        var query4=`SELECT TOP (1) * FROM taco_treceability.taco_treceability.station_status s INNER JOIN taco_treceability.taco_treceability.finalqr_bms_details f ON s.FinalQRCode=f.FinalQRCode where s.FinalQRCode = '${final_qrcode}' and s.PackName='${packname}'  ORDER BY f.sr_no DESC`
     //   var query4 = `SELECT TOP (1) * FROM taco_treceability.taco_treceability.finalqr_bms_details where module_qrcode='${modulebarcode}' ORDER BY sr_no DESC`;
        sql.connect(sqlConfig, function (err) {
            request = new sql.Request();
            request.query(query4, function (err, recordset) {
                if (err) console.log(err);
                var result = recordset.recordset;
                // console.log("result:", result);
                if (result.length != 0) {
                    for (var i in result) {
                        var sr_no = result[i].sr_no;
                        var pack_no = result[i].pack_no;
                        var pack_qrcode = result[i].module_qrcode;
                        var hex_string = result[i].hex_string;
                        var string1 = result[i].string1;
                         var bmsmfg=result[i].bmsmfg;
                        var bms_no = result[i].bms_no;
                        var finalqr= result[i].FinalQRCode;
                        var bin_number= result[i].bin_no;
                        var final_json_string= result[i].final_json_string;
                        var batterypart= result[i].batterypart;
                        var nom_voltage_value= result[i].nom_voltage_value;
                        var min_capacity_value= result[i].min_capacity_value;
                        var mfg_date1= result[i].final_date;

                     
                        var string1_split = string1.split(" ");
                        var num1 = string1_split[0];
                        var num2 = string1_split[1];
                        var year = new Date().getFullYear();
                        var month = (new Date().getMonth() + 1);
                        var day = new Date().getDate();


                        let objectDate = new Date ();
                        let day1 = objectDate.getDate();
                        // console.log(day1);

                        let year1 = objectDate.getFullYear();
                        // console.log(year1);

                        const month1 = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

                        const d = new Date();
                        let monthname = (month1[d.getMonth()]).toUpperCase();

                        var todaydate = day1+" "+monthname+" "+year1;
                        if(mfg_date1=="" || mfg_date1==null || mfg_date1=='NULL' || mfg_date1=='undefined')
{
mfg_date=todaydate;
}
else{
mfg_date=mfg_date1;
}
var data_zebra_new,data_tosiba_new;
if(packname=='Bajaj 6.1'){
data_tosiba_new=`{D0300,0301,0280|}
{C|}
 {XB00;0100,0053,T,M,05,A,0,M2=${final_json_string}|}
        {PC000;0033,0200,07,07,H,33,B=${num1}|}
        {PC001;0057,0200,07,07,H,33,B=${bms_no}|}
        {PC002;0033,0080,07,07,H,33,B=${num2}|}
        {PC003;0082,0200,07,07,H,33,B=SW:AH404446|}
        {PC004;0020,0245,05,05,H,00,B=${bin_number}|}
        {PC005;0020,0260,05,05,H,00,B=049346|}
        {PC006;0020,0278,05,05,H,00,B=MFG :|}
        {PC007;0074,0278,05,05,H,00,B=${mfg_date}|}
{XS;I,0001,0000C6200|}`;
}
else if( packname=='Bajaj 8.9' || packname=='Bajaj 11.8'|| packname=='Bajaj 9.2' || packname=='Bajaj 12.2' || packname=='Bajaj 12.1'){
//     data_tosiba_new=`{D0330,0301,0280|}
//    {AY;+00,0|}
//    {C|}
//    {XB00;0090,0053,T,M,05,A,0,M2=${final_json_string}|}
//    {PC000;0033,0190,05,05,I,33,B=${num1}|}
//    {PC001;0057,0188,05,05,I,33,B=${bms_no}|}
//    {PC002;0033,0083,05,05,I,33,B=${num2}|}
//    {PC003;0020,0229,05,05,H,00,B=${tac_no}|}
//    {PC004;0020,0245,05,05,H,00,B=${bin_number}|}
//    {PC005;0020,0260,05,05,H,00,B=${hex_string}|}
//    {PC006;0020,0278,05,05,H,00,B=MFG :|}
//    {PC007;0074,0278,05,05,H,00,B=${mfg_date}|}
//    {XS;I,0001,0002C6200|}
//    `;
data_tosiba_new=`{D0300,0301,0280|}
{C|}
 {XB00;0090,0053,T,M,05,A,0,M2=${final_json_string}|}
        {PC000;0033,0200,07,07,H,33,B=${num1}|}
        {PC001;0057,0200,07,07,H,33,B=${bms_no}|}
        {PC002;0033,0080,07,07,H,33,B=${num2}|}
        {PC003;0020,0229,05,05,H,00,B=${tac_no}|}
        {PC004;0020,0245,05,05,H,00,B=${bin_number}|}
        {PC005;0020,0260,05,05,H,00,B=${hex_string}|}
        {PC006;0020,0278,05,05,H,00,B=MFG :|}
        {PC007;0074,0278,05,05,H,00,B=${mfg_date}|}
{XS;I,0001,0000C6200|}`;
   }
   else{
   data_tosiba_new=`{D0330,0301,0280|}
   {AY;+00,0|}
   {C|}
   {XB00;0090,0053,T,M,05,A,0,M2=${final_json_string}|}
   {PC000;0033,0190,05,05,I,33,B=${num1}|}
   {PC001;0057,0188,05,05,I,33,B=${bms_no}|}
   {PC002;0033,0083,05,05,I,33,B=${num2}|}
   {PC004;0020,0245,05,05,H,00,B=${bin_number}|}
   {PC005;0020,0260,05,05,H,00,B=${hex_string}|}
   {PC006;0020,0278,05,05,H,00,B=MFG :|}
   {PC007;0074,0278,05,05,H,00,B=${mfg_date}|}
   {XS;I,0001,0002C6200|}
   `; 
   }
   

/*if(packname=="Bajaj 8.9" || packname=="Bajaj 11.8"){
data_zebra_new=`CT~~CD,~CC^~CT~
^XA~TA000~JSN^LT30^MNW^MTT^PON^PMN^LH0,0^JMA^PR2,2~SD20^JUS^LRN^CI0^XZ
^XA
^MMT
^PW354
^LL0331
^LS-5
^FT80,240^A0B,19,19^FH\^FD${num1} ${num2}^FS
^FT136,290^BQN,2,4
^FH\^FDLA,${final_json_string}^FS
^FT57,299^A0N,19,19^FH\^FD${bin_number}^FS
^FT107,240^A0B,19,19^FH\^FD${bms_no}^FS
^FT57,322^A0N,19,19^FH\^FD${hex_string}^FS
^FT57,343^A0N,19,19^FH\^FDMFG: ${mfg_date}^FS
^FT57,275^A0N,19,19^FH\^FD${tac_no}^FS
^PQ1,0,1,Y^XZ
`;
}
else{
data_zebra_new=`CT~~CD,~CC^~CT~
^XA~TA000~JSN^LT30^MNW^MTT^PON^PMN^LH0,0^JMA^PR2,2~SD20^JUS^LRN^CI0^XZ
^XA
^MMT
^PW354
^LL0331
^LS-5
^FT80,240^A0B,19,19^FH\^FD${num1} ${num2}^FS
^FT136,290^BQN,2,4
^FH\^FDLA,${final_json_string}^FS
^FT57,299^A0N,19,19^FH\^FD${bin_number}^FS
^FT107,240^A0B,19,19^FH\^FD${bms_no}^FS
^FT57,322^A0N,19,19^FH\^FD${hex_string}^FS
^FT57,343^A0N,19,19^FH\^FDMFG: ${mfg_date}^FS
^PQ1,0,1,Y^XZ
    `; 
}  */
                     console.log("updating alt 5 yogita", data_zebra_new);
                        //  updateAirleakageValuesInDB(packNO,body,coolant,plug1,plug2,packname,'ALT 6');

                   /*     fs.writeFile("prn_data/godex_print.prn", data_zebra_new, (err) => {  //"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_esr.prn LPT1
                            if (err)
                                console.log(err);
                            else {
                                nrc.run(`"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\godex_print.prn "10.9.4.149_zebra_alt5" LPT1`).then(
                                    function (existCodes) {
                                        console.log(`Command executed successfully - Printing file_airleakage`);
                                        console.log('Lali',bms_no);
                                   

                                    }, function (err) {
                                        // console.log('Command failed to execute!');
                                    }
                                );

                            }
                        }); */






                      //  setTimeout(function () {
                            fs.writeFile("prn_data/testtosiba.prn", data_tosiba_new, (err) => {
                                if (err)
                                    console.log(err);
                                else {
                    
                                    nrc.run(`"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\testtosiba.prn "10.9.4.110" LPT1`).then(
                                        function (existCodes) {
                                            console.log(`Command executed successfully - Printing Customer Code: 11111`);
                                            // update status printed in database
                    
                                            
                                        }, function (err) {
                                            console.log('Command failed to execute!');
                                        }
                                    ); 
                                    }
                                });

                          //  },100);


                    }
                }
            });
        });



    }
   else if (printToStation=='alt7' && packnamefinal.includes('Bajaj')) {
        var batterypart;
        var nom_voltage_value;
        var min_capacity_value;
        var tac_no;
        if(packname=="Bajaj 5.9"){
            batterypart="AH401901";
            nom_voltage_value="51.2 V";
            min_capacity_value="116Ah";
            capacity='2';
            tac_no='';
        }

if(packname=="Bajaj 8.9"){
    batterypart="AH401967";
    nom_voltage_value="51.2 V";
    min_capacity_value="174Ah";
    capacity='3';
    tac_no='AN5079';
}

if(packname=="Bajaj 11.8"){
    // batterypart="AH401903";
    batterypart="BK401902";
    nom_voltage_value="51.2 V";
    min_capacity_value="232Ah";
    capacity='4';
    tac_no='AN5080';
}
if(packname=="Bajaj 6.1"){
    batterypart="AH401901";
    nom_voltage_value="51.2 V";
    min_capacity_value="120Ah";
    capacity='2';
    tac_no='AR8302';
}

if(packname=="Bajaj 9.2"){
    batterypart="AH415101";
    nom_voltage_value="51.2 V";
    min_capacity_value="180Ah";
    capacity='3';
    tac_no='AR8301';
}

if(packname=="Bajaj 12.2"){
    // batterypart="AH401903";
    batterypart="BK401902";
    nom_voltage_value="51.2 V";
    min_capacity_value="232Ah";
    capacity='4';
    tac_no='AR8300';
}

if(packname=="Bajaj 12.1"){
    // batterypart="AH401903";
    batterypart="AH401933";
    nom_voltage_value="51.2 V";
    min_capacity_value="236.8Ah";
    capacity='4';
    tac_no='AR8249';
}



var query4=`SELECT TOP (1) * FROM taco_treceability.taco_treceability.station_status s INNER JOIN taco_treceability.taco_treceability.finalqr_bms_details f ON s.FinalQRCode=f.FinalQRCode where s.FinalQRCode = '${final_qrcode}' and s.PackName='${packname}' ORDER BY f.sr_no DESC`
//   var query4 = `SELECT TOP (1) * FROM taco_treceability.taco_treceability.finalqr_bms_details where module_qrcode='${modulebarcode}' ORDER BY sr_no DESC`;
sql.connect(sqlConfig, function (err) {
    request = new sql.Request();
    request.query(query4, function (err, recordset) {
        if (err) console.log(err);
        var result = recordset.recordset;
        // console.log("result:", result);
        if (result.length != 0) {
            for (var i in result) {
                var sr_no = result[i].sr_no;
                var pack_no = result[i].pack_no;
                var pack_qrcode = result[i].module_qrcode;
                var hex_string = result[i].hex_string;
                var string1 = result[i].string1;
                 var bmsmfg=result[i].bmsmfg;
                var bms_no = result[i].bms_no;
                var finalqr= result[i].FinalQRCode;
                var bin_number= result[i].bin_no;
                var final_json_string= result[i].final_json_string;
                var batterypart= result[i].batterypart;
                var nom_voltage_value= result[i].nom_voltage_value;
                var min_capacity_value= result[i].min_capacity_value;
                var mfg_date1= result[i].final_date;

             
                var string1_split = string1.split(" ");
                var num1 = string1_split[0];
                var num2 = string1_split[1];
                var year = new Date().getFullYear();
                var month = (new Date().getMonth() + 1);
                var day = new Date().getDate();


                let objectDate = new Date ();
                let day1 = objectDate.getDate();
                // console.log(day1);

                let year1 = objectDate.getFullYear();
                // console.log(year1);

                const month1 = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

                const d = new Date();
                let monthname = (month1[d.getMonth()]).toUpperCase();

                var todaydate = day1+" "+monthname+" "+year1;
                if(mfg_date1=="" || mfg_date1==null || mfg_date1=='NULL' || mfg_date1=='undefined')
{
mfg_date=todaydate;
}
else{
mfg_date=mfg_date1;
}


// var data_zebra_new;


// if(packname=="Bajaj 8.9" || packname=="Bajaj 11.8"){
// data_zebra_new=`CT~~CD,~CC^~CT~
// ^XA~TA000~JSN^LT30^MNW^MTT^PON^PMN^LH0,0^JMA^PR2,2~SD20^JUS^LRN^CI0^XZ
// ^XA
// ^MMT
// ^PW354
// ^LL0331
// ^LS-5
// ^FT80,240^A0B,19,19^FH\^FD${num1} ${num2}^FS
// ^FT136,290^BQN,2,4
// ^FH\^FDLA,${final_json_string}^FS
// ^FT57,299^A0N,19,19^FH\^FD${bin_number}^FS
// ^FT107,240^A0B,19,19^FH\^FD${bms_no}^FS
// ^FT57,322^A0N,19,19^FH\^FD${hex_string}^FS
// ^FT57,343^A0N,19,19^FH\^FDMFG: ${mfg_date}^FS
// ^FT57,275^A0N,19,19^FH\^FD${tac_no}^FS
// ^PQ1,0,1,Y^XZ
// `;
// }
// else{
// data_zebra_new=`CT~~CD,~CC^~CT~
// ^XA~TA000~JSN^LT30^MNW^MTT^PON^PMN^LH0,0^JMA^PR2,2~SD20^JUS^LRN^CI0^XZ
// ^XA
// ^MMT
// ^PW354
// ^LL0331
// ^LS-5
// ^FT80,240^A0B,19,19^FH\^FD${num1} ${num2}^FS
// ^FT136,290^BQN,2,4
// ^FH\^FDLA,${final_json_string}^FS
// ^FT57,299^A0N,19,19^FH\^FD${bin_number}^FS
// ^FT107,240^A0B,19,19^FH\^FD${bms_no}^FS
// ^FT57,322^A0N,19,19^FH\^FD${hex_string}^FS
// ^FT57,343^A0N,19,19^FH\^FDMFG: ${mfg_date}^FS
// ^PQ1,0,1,Y^XZ
//     `; 
// }


var data_zebra_new,data_tosiba_new;
if(packname=='Bajaj 6.1'){
data_tosiba_new=`{D0300,0301,0280|}
{C|}
 {XB00;0100,0053,T,M,05,A,0,M2=${final_json_string}|}
        {PC000;0033,0200,07,07,H,33,B=${num1}|}
        {PC001;0057,0200,07,07,H,33,B=${bms_no}|}
        {PC002;0033,0080,07,07,H,33,B=${num2}|}
        {PC003;0082,0200,07,07,H,33,B=SW:AH404446|}
        {PC004;0020,0245,05,05,H,00,B=${bin_number}|}
        {PC005;0020,0260,05,05,H,00,B=049346|}
        {PC006;0020,0278,05,05,H,00,B=MFG :|}
        {PC007;0074,0278,05,05,H,00,B=${mfg_date}|}
{XS;I,0001,0000C6200|}`;
}
else if( packname=='Bajaj 8.9' || packname=='Bajaj 11.8' || packname=='Bajaj 12.1' || packname=='Bajaj 9.2' || packname=='Bajaj 12.2'){
//     data_tosiba_new=`{D0330,0301,0280|}
//    {AY;+00,0|}
//    {C|}
//    {XB00;0090,0053,T,M,05,A,0,M2=${final_json_string}|}
//    {PC000;0033,0190,05,05,I,33,B=${num1}|}
//    {PC001;0057,0188,05,05,I,33,B=${bms_no}|}
//    {PC002;0033,0083,05,05,I,33,B=${num2}|}
//    {PC003;0020,0229,05,05,H,00,B=${tac_no}|}
//    {PC004;0020,0245,05,05,H,00,B=${bin_number}|}
//    {PC005;0020,0260,05,05,H,00,B=${hex_string}|}
//    {PC006;0020,0278,05,05,H,00,B=MFG :|}
//    {PC007;0074,0278,05,05,H,00,B=${mfg_date}|}
//    {XS;I,0001,0002C6200|}
//    `;
data_tosiba_new=`{D0300,0301,0280|}
{C|}
 {XB00;0090,0053,T,M,05,A,0,M2=${final_json_string}|}
        {PC000;0033,0200,07,07,H,33,B=${num1}|}
        {PC001;0057,0200,07,07,H,33,B=${bms_no}|}
        {PC002;0033,0080,07,07,H,33,B=${num2}|}
        {PC003;0020,0229,05,05,H,00,B=${tac_no}|}
        {PC004;0020,0245,05,05,H,00,B=${bin_number}|}
        {PC005;0020,0260,05,05,H,00,B=${hex_string}|}
        {PC006;0020,0278,05,05,H,00,B=MFG :|}
        {PC007;0074,0278,05,05,H,00,B=${mfg_date}|}
{XS;I,0001,0000C6200|}`;
   }
   else{
   data_tosiba_new=`{D0330,0301,0280|}
   {AY;+00,0|}
   {C|}
   {XB00;0090,0053,T,M,05,A,0,M2=${final_json_string}|}
   {PC000;0033,0190,05,05,I,33,B=${num1}|}
   {PC001;0057,0188,05,05,I,33,B=${bms_no}|}
   {PC002;0033,0083,05,05,I,33,B=${num2}|}
   {PC004;0020,0245,05,05,H,00,B=${bin_number}|}
   {PC005;0020,0260,05,05,H,00,B=${hex_string}|}
   {PC006;0020,0278,05,05,H,00,B=MFG :|}
   {PC007;0074,0278,05,05,H,00,B=${mfg_date}|}
   {XS;I,0001,0002C6200|}
   `; 
   }
                // update status printed in database
                // save in DB

              //  console.log("updating alt 6", data1);
                //  updateAirleakageValuesInDB(packNO,body,coolant,plug1,plug2,packname,'ALT 6');

          /*      fs.writeFile("prn_data/godex_print_alt.prn", data_zebra_new, (err) => {  //"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_esr.prn LPT1
                    if (err)
                        console.log(err);
                    else {
                        nrc.run(`"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\godex_print_alt.prn "10.9.4.149_zebra_alt5" LPT1`).then(
                            function (existCodes) {
                                console.log(`Command executed successfully - Printing file_airleakage`);
                            var dbQuery = `UPDATE taco_treceability.taco_treceability.finalqr_bms_details SET bin_no='${bin_number}',final_json_string='${final_json_string}',nom_voltage_value='${nom_voltage_value}',min_capacity_value='${min_capacity_value}',batterypart='${batterypart}' WHERE FinalQRCode='${finalqr}'`;
                                sql.connect(sqlConfig, function (err) {
                                    request = new sql.Request();

                                    request.query(dbQuery, function (err, recordset) {
                                        if (err) console.log(err);

                                    });
                                }); 


                            }, function (err) {
                                // console.log('Command failed to execute!');
                            }
                        );

                    }
                }); */


                fs.writeFile("prn_data/testtosiba.prn", data_tosiba_new, (err) => {
                    if (err)
                        console.log(err);
                    else {
        
                        nrc.run(`"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\testtosiba.prn "10.9.4.110" LPT1`).then(
                            function (existCodes) {
                                console.log(`Command executed successfully - Printing Customer Code: 11111`);
                                // update status printed in database
        
                                
                            }, function (err) {
                                console.log('Command failed to execute!');
                            }
                        ); 
                        }
                    });
            }
        }
    });
});



}
else if (printToStation=='alt5' && packnamefinal.includes('Bajaj')) {
    var batterypart;
    var nom_voltage_value;
    var min_capacity_value;
    var tac_no;
    if(packname=="Bajaj 5.9"){
        batterypart="AH401901";
        nom_voltage_value="51.2 V";
        min_capacity_value="116Ah";
        capacity='2';
        tac_no='';
    }

if(packname=="Bajaj 8.9"){
batterypart="AH401967";
nom_voltage_value="51.2 V";
min_capacity_value="174Ah";
capacity='3';
tac_no='AN5079';
}

if(packname=="Bajaj 11.8"){
// batterypart="AH401903";
batterypart="BK401902";
nom_voltage_value="51.2 V";
min_capacity_value="232Ah";
capacity='4';
tac_no='AN5080';
}

if(packname=="Bajaj 6.1"){
    batterypart="AH401901";
    nom_voltage_value="51.2 V";
    min_capacity_value="120Ah";
    capacity='2';
    tac_no='AR8302';
}

if(packname=="Bajaj 9.2"){
    batterypart="AH415101";
    nom_voltage_value="51.2 V";
    min_capacity_value="180Ah";
    capacity='3';
    tac_no='AR8301';
}


if(packname=="Bajaj 12.2"){
    // batterypart="AH401903";
    batterypart="BK401902";
    nom_voltage_value="51.2 V";
    min_capacity_value="232Ah";
    capacity='4';
    tac_no='AR8300';
}

if(packname=="Bajaj 12.1"){
    // batterypart="AH401903";
    batterypart="AH401933";
    nom_voltage_value="51.2 V";
    min_capacity_value="236.8Ah";
    capacity='4';
    tac_no='AR8249';
}


var query4=`SELECT TOP (1) * FROM taco_treceability.taco_treceability.station_status s INNER JOIN taco_treceability.taco_treceability.finalqr_bms_details f ON s.FinalQRCode=f.FinalQRCode where s.FinalQRCode = '${final_qrcode}' and s.PackName='${packname}' ORDER BY f.sr_no DESC`
//   var query4 = `SELECT TOP (1) * FROM taco_treceability.taco_treceability.finalqr_bms_details where module_qrcode='${modulebarcode}' ORDER BY sr_no DESC`;
sql.connect(sqlConfig, function (err) {
request = new sql.Request();
request.query(query4, function (err, recordset) {
    if (err) console.log(err);
    var result = recordset.recordset;
    // console.log("result:", result);
    if (result.length != 0) {
        for (var i in result) {
            var sr_no = result[i].sr_no;
            var pack_no = result[i].pack_no;
            var pack_qrcode = result[i].module_qrcode;
            var hex_string = result[i].hex_string;
            var string1 = result[i].string1;
             var bmsmfg=result[i].bmsmfg;
            var bms_no = result[i].bms_no;
            var finalqr= result[i].FinalQRCode;
            var bin_number= result[i].bin_no;
            var final_json_string= result[i].final_json_string;
            var batterypart= result[i].batterypart;
            var nom_voltage_value= result[i].nom_voltage_value;
            var min_capacity_value= result[i].min_capacity_value;
            var mfg_date1= result[i].final_date;

         
            var string1_split = string1.split(" ");
            var num1 = string1_split[0];
            var num2 = string1_split[1];
            var year = new Date().getFullYear();
            var month = (new Date().getMonth() + 1);
            var day = new Date().getDate();


            let objectDate = new Date ();
            let day1 = objectDate.getDate();
            // console.log(day1);

            let year1 = objectDate.getFullYear();
            // console.log(year1);

            const month1 = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

            const d = new Date();
            let monthname = (month1[d.getMonth()]).toUpperCase();

            var todaydate = day1+" "+monthname+" "+year1;
            if(mfg_date1=="" || mfg_date1==null || mfg_date1=='NULL' || mfg_date1=='undefined')
{
mfg_date=todaydate;
}
else{
mfg_date=mfg_date1;
}

// var data_zebra_new;


// if(packname=="Bajaj 8.9" || packname=="Bajaj 11.8"){
// data_zebra_new=`CT~~CD,~CC^~CT~
// ^XA~TA000~JSN^LT30^MNW^MTT^PON^PMN^LH0,0^JMA^PR2,2~SD20^JUS^LRN^CI0^XZ
// ^XA
// ^MMT
// ^PW354
// ^LL0331
// ^LS-5
// ^FT80,240^A0B,19,19^FH\^FD${num1} ${num2}^FS
// ^FT136,290^BQN,2,4
// ^FH\^FDLA,${final_json_string}^FS
// ^FT57,299^A0N,19,19^FH\^FD${bin_number}^FS
// ^FT107,240^A0B,19,19^FH\^FD${bms_no}^FS
// ^FT57,322^A0N,19,19^FH\^FD${hex_string}^FS
// ^FT57,343^A0N,19,19^FH\^FDMFG: ${mfg_date}^FS
// ^FT57,275^A0N,19,19^FH\^FD${tac_no}^FS
// ^PQ1,0,1,Y^XZ
// `;
// }
// else{
// data_zebra_new=`CT~~CD,~CC^~CT~
// ^XA~TA000~JSN^LT30^MNW^MTT^PON^PMN^LH0,0^JMA^PR2,2~SD20^JUS^LRN^CI0^XZ
// ^XA
// ^MMT
// ^PW354
// ^LL0331
// ^LS-5
// ^FT80,240^A0B,19,19^FH\^FD${num1} ${num2}^FS
// ^FT136,290^BQN,2,4
// ^FH\^FDLA,${final_json_string}^FS
// ^FT57,299^A0N,19,19^FH\^FD${bin_number}^FS
// ^FT107,240^A0B,19,19^FH\^FD${bms_no}^FS
// ^FT57,322^A0N,19,19^FH\^FD${hex_string}^FS
// ^FT57,343^A0N,19,19^FH\^FDMFG: ${mfg_date}^FS
// ^PQ1,0,1,Y^XZ
//     `; 
// }

var data_zebra_new,data_tosiba_new;
if(packname=='Bajaj 6.1'){
data_tosiba_new=`{D0300,0301,0280|}
{C|}
 {XB00;0100,0053,T,M,05,A,0,M2=${final_json_string}|}
        {PC000;0033,0200,07,07,H,33,B=${num1}|}
        {PC001;0057,0200,07,07,H,33,B=${bms_no}|}
        {PC002;0033,0080,07,07,H,33,B=${num2}|}
        {PC003;0082,0200,07,07,H,33,B=SW:AH404446|}
        {PC004;0020,0245,05,05,H,00,B=${bin_number}|}
        {PC005;0020,0260,05,05,H,00,B=049346|}
        {PC006;0020,0278,05,05,H,00,B=MFG :|}
        {PC007;0074,0278,05,05,H,00,B=${mfg_date}|}
{XS;I,0001,0000C6200|}`;
}
else if(packname=='Bajaj 12.1' || packname=='Bajaj 9.2' || packname=='Bajaj 12.2' ||  packname=='Bajaj 8.9' ||  packname=='Bajaj 11.8') {
//     data_tosiba_new=`{D0330,0301,0280|}
//    {AY;+00,0|}
//    {C|}
//    {XB00;0090,0053,T,M,05,A,0,M2=${final_json_string}|}
//    {PC000;0033,0190,05,05,I,33,B=${num1}|}
//    {PC001;0057,0188,05,05,I,33,B=${bms_no}|}
//    {PC002;0033,0083,05,05,I,33,B=${num2}|}
//    {PC003;0020,0229,05,05,H,00,B=${tac_no}|}
//    {PC004;0020,0245,05,05,H,00,B=${bin_number}|}
//    {PC005;0020,0260,05,05,H,00,B=${hex_string}|}
//    {PC006;0020,0278,05,05,H,00,B=MFG :|}
//    {PC007;0074,0278,05,05,H,00,B=${mfg_date}|}
//    {XS;I,0001,0002C6200|}
//    `;
data_tosiba_new=`{D0300,0301,0280|}
{C|}
 {XB00;0090,0053,T,M,05,A,0,M2=${final_json_string}|}
        {PC000;0033,0200,07,07,H,33,B=${num1}|}
        {PC001;0057,0200,07,07,H,33,B=${bms_no}|}
        {PC002;0033,0080,07,07,H,33,B=${num2}|}
        {PC003;0020,0229,05,05,H,00,B=${tac_no}|}
        {PC004;0020,0245,05,05,H,00,B=${bin_number}|}
        {PC005;0020,0260,05,05,H,00,B=${hex_string}|}
        {PC006;0020,0278,05,05,H,00,B=MFG :|}
        {PC007;0074,0278,05,05,H,00,B=${mfg_date}|}
{XS;I,0001,0000C6200|}`;
   }
   else{
   data_tosiba_new=`{D0330,0301,0280|}
   {AY;+00,0|}
   {C|}
   {XB00;0090,0053,T,M,05,A,0,M2=${final_json_string}|}
   {PC000;0033,0190,05,05,I,33,B=${num1}|}
   {PC001;0057,0188,05,05,I,33,B=${bms_no}|}
   {PC002;0033,0083,05,05,I,33,B=${num2}|}
   {PC004;0020,0245,05,05,H,00,B=${bin_number}|}
   {PC005;0020,0260,05,05,H,00,B=${hex_string}|}
   {PC006;0020,0278,05,05,H,00,B=MFG :|}
   {PC007;0074,0278,05,05,H,00,B=${mfg_date}|}
   {XS;I,0001,0002C6200|}
   `; 
   }
            // update status printed in database
            // save in DB

          //  console.log("updating alt 6", data1);
            //  updateAirleakageValuesInDB(packNO,body,coolant,plug1,plug2,packname,'ALT 6');

          /*  fs.writeFile("prn_data/godex_print_alt.prn", data_zebra_new, (err) => {  //"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_esr.prn LPT1
                if (err)
                    console.log(err);
                else {
                    nrc.run(`"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\godex_print_alt.prn "10.9.4.149_zebra_alt5" LPT1`).then(
                        function (existCodes) {
                            console.log(`Command executed successfully - Printing file_airleakage`);
                       var dbQuery = `UPDATE taco_treceability.taco_treceability.finalqr_bms_details SET bin_no='${bin_number}',final_json_string='${final_json_string}',nom_voltage_value='${nom_voltage_value}',min_capacity_value='${min_capacity_value}',batterypart='${batterypart}' WHERE FinalQRCode='${finalqr}'`;
                            sql.connect(sqlConfig, function (err) {
                                request = new sql.Request();

                                request.query(dbQuery, function (err, recordset) {
                                    if (err) console.log(err);

                                });
                            }); 


                        }, function (err) {
                            // console.log('Command failed to execute!');
                        }
                    );

                }
            }); */


            fs.writeFile("prn_data/testtosiba.prn", data_tosiba_new, (err) => {
                if (err)
                    console.log(err);
                else {
    
                    nrc.run(`"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\testtosiba.prn "10.9.4.110" LPT1`).then(
                        function (existCodes) {
                            console.log(`Command executed successfully - Printing Customer Code: 11111`);
                            // update status printed in database
    
                            
                        }, function (err) {
                            console.log('Command failed to execute!');
                        }
                    ); 
                    }
                });
        }
    }
});
});



}
else if (printToStation == 'alt8'){        
   
    
    var data1 = `{D0420,0826,0400|}
    {C|}
    {PV00;0050,0068,0042,0042,B,00,B=AIR OK|}
    {PV01;0304,0068,0038,0038,B,00,B=${dateTimestamp}|}
    {PV02;0050,0120,0035,0035,B,00,B=Pack:|}
    {PV03;0158,0120,0028,0028,B,00,B=${packNO}|}
    {PV04;0050,0170,0038,0038,B,00,B=Pack Name:|}
    {PV05;0353,0170,0038,0038,B,00,B==${packname}|}
    {PV06;0050,0238,0038,0038,B,00,B=BODY|}
    {PV07;0050,0298,0038,0038,B,00,B=${bodyVal}|}
    {PV08;0234,0238,0038,0038,B,00,B=COOLANT|}
    {PV09;0589,0238,0038,0038,B,00,B=STATION|}
    {PV10;0263,0298,0038,0038,B,00,B=${coolantVal}|}
    {PV11;0623,0298,0038,0038,B,00,B=PDI|}
    {PV12;0050,0350,0030,0038,B,00,B=VOLTAGE-IR OK|}
    {PV13;0050,0400,0030,0038,B,00,B=TORQUE-OK|}
    {XS;I,0001,0000C3001|}`;
    
    
    
    
    
    var data_nir = `{D0420,0826,0400|}
                  {C|}
                  {PV00;0050,0068,0042,0042,B,00,B=AIR OK|}
                  {PV01;0304,0068,0038,0038,B,00,B=${dateTimestamp}|}
                  {PV02;0050,0120,0035,0035,B,00,B=Pack:|}
                  {PV03;0158,0120,0028,0028,B,00,B=${packNO}|}
                  {PV04;0050,0170,0038,0038,B,00,B=Pack Name:|}
                  {PV05;0353,0170,0038,0038,B,00,B==${packname}|}
                  {PV06;0050,0238,0038,0038,B,00,B=BODY|}
                  {PV07;0050,0298,0038,0038,B,00,B=${bodyVal}|}
                  {PV08;0234,0238,0038,0038,B,00,B=COOLANT|}
                  {PV09;0589,0238,0038,0038,B,00,B=STATION|}
                  {PV10;0263,0298,0038,0038,B,00,B=${coolantVal}|}
                  {PV11;0623,0298,0038,0038,B,00,B=PDI|}
                  {PV12;0050,0350,0030,0038,B,00,B=VOLTAGE-IR OK|}
                  {XS;I,0001,0000C3001|}`;
    
                  
    
    var data_ejeeto = `{D0420,0826,0400|}
    {C|}
    {PV00;0050,0068,0042,0042,B,00,B=AIR OK|}
    {PV01;0304,0068,0038,0038,B,00,B=${dateTimestamp}|}
    {PV02;0050,0120,0035,0035,B,00,B=Pack:|}
    {PV03;0158,0120,0028,0028,B,00,B=${packNO}|}
    {PV04;0050,0170,0038,0038,B,00,B=Pack Name:|}
    {PV05;0353,0170,0038,0038,B,00,B==${packname}|}
    {PV06;0050,0238,0038,0038,B,00,B=BODY|}
    {PV07;0050,0298,0038,0038,B,00,B=${bodyVal}|}
    {PV08;0234,0238,0038,0038,B,00,B=COOLANT|}
    {PV09;0589,0238,0038,0038,B,00,B=STATION|}
    {PV10;0263,0298,0038,0038,B,00,B=${coolantVal}|}
    {PV11;0623,0298,0038,0038,B,00,B=${station_id}|}
    {XS;I,0001,0000C3001|}`;
    
    
        // update status printed in database
        // save in DB
        //updateAirleakageValuesInDB(packNO,body,coolant,plug1,plug2,packname,'ALT 1');
    
    
        if(packname.trim()==='Limber Rear'){
            fs.writeFile("prn_data/file_airleakage_masterprint.prn", data_nir, (err) => {  //"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_esr.prn LPT1
                if (err)
                    console.log(err);
                else {
                    nrc.run(`"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_masterprint.prn "10.9.4.110" LPT1`).then(
                        function (existCodes) {
                            // console.log(`Command executed successfully - Printing file_airleakage`);
        
        
                        }, function (err) {
                            // console.log('Command failed to execute!');
                        }
                    );
        
                }
            });
        }
    
        else if(packname.trim()==='Limber Front'){
            fs.writeFile("prn_data/file_airleakage_masterprint.prn", data_nir, (err) => {  //"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_esr.prn LPT1
                if (err)
                    console.log(err);
                else {
                    nrc.run(`"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_masterprint.prn "10.9.4.110" LPT1`).then(
                        function (existCodes) {
                            // console.log(`Command executed successfully - Printing file_airleakage`);
        
        
                        }, function (err) {
                            // console.log('Command failed to execute!');
                        }
                    );
        
                }
            });
        }
    
    else{
        fs.writeFile("prn_data/file_airleakage_masterprint.prn", data1, (err) => {  //"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_esr.prn LPT1
            if (err)
                console.log(err);
            else {
                nrc.run(`"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_masterprint.prn "10.9.4.110" LPT1`).then(
                    function (existCodes) {
                        // console.log(`Command executed successfully - Printing file_airleakage`);
    
    
                    }, function (err) {
                        // console.log('Command failed to execute!');
                    }
                );
    
            }
        });
    }
    
    
    
    
    }
//////////////////////////////////////////////////////////////////////////////////////////////////////////          
else{        
// var data1 = `{D0420,0826,0400|}
//     {C|}
//     {PV00;0050,0064,0042,0042,B,00,B=AIR OK|}
//     {PV01;0304,0059,0038,0038,B,00,B=${dateTimestamp}|}
//     {PV02;0050,0139,0035,0035,B,00,B=Pack:|}
//     {PV03;0158,0136,0028,0028,B,00,B=${packNO}|}
//     {PV04;0050,0191,0038,0038,B,00,B=Pack Name:|}
//     {PV05;0353,0191,0038,0038,B,00,B=${packname}|}
//     {PV06;0050,0258,0038,0038,B,00,B=BODY|}
//     {PV07;0050,0338,0038,0038,B,00,B=${bodyVal}|}
//     {PV08;0234,0258,0038,0038,B,00,B=COOLANT|}
//     {PV09;0589,0268,0038,0038,B,00,B=STATION|}
//     {PV10;0263,0338,0038,0038,B,00,B=${coolantVal}|}
//     {PV11;0623,0335,0038,0038,B,00,B=${station_id}|}
//     {XS;I,0001,0000C3001|}`;



var data1 = `{D0420,0826,0400|}
{C|}
{PV00;0050,0068,0042,0042,B,00,B=AIR OK|}
{PV01;0304,0068,0038,0038,B,00,B=${dateTimestamp}|}
{PV02;0050,0120,0035,0035,B,00,B=Pack:|}
{PV03;0158,0120,0028,0028,B,00,B=${packNO}|}
{PV04;0050,0170,0038,0038,B,00,B=Pack Name:|}
{PV05;0353,0170,0038,0038,B,00,B==${packname}|}
{PV06;0050,0238,0038,0038,B,00,B=BODY|}
{PV07;0050,0298,0038,0038,B,00,B=${bodyVal}|}
{PV08;0234,0238,0038,0038,B,00,B=COOLANT|}
{PV09;0589,0238,0038,0038,B,00,B=STATION|}
{PV10;0263,0298,0038,0038,B,00,B=${coolantVal}|}
{PV11;0623,0298,0038,0038,B,00,B=${station_id}|}
{PV12;0050,0350,0030,0038,B,00,B=VOLTAGE-IR OK|}
{PV13;0050,0400,0030,0038,B,00,B=TORQUE-OK|}
{XS;I,0001,0000C3001|}`;





var data_nir = `{D0420,0826,0400|}
              {C|}
              {PV00;0050,0068,0042,0042,B,00,B=AIR OK|}
              {PV01;0304,0068,0038,0038,B,00,B=${dateTimestamp}|}
              {PV02;0050,0120,0035,0035,B,00,B=Pack:|}
              {PV03;0158,0120,0028,0028,B,00,B=${packNO}|}
              {PV04;0050,0170,0038,0038,B,00,B=Pack Name:|}
              {PV05;0353,0170,0038,0038,B,00,B==${packname}|}
              {PV06;0050,0238,0038,0038,B,00,B=BODY|}
              {PV07;0050,0298,0038,0038,B,00,B=${bodyVal}|}
              {PV08;0234,0238,0038,0038,B,00,B=COOLANT|}
              {PV09;0589,0238,0038,0038,B,00,B=STATION|}
              {PV10;0263,0298,0038,0038,B,00,B=${coolantVal}|}
              {PV11;0623,0298,0038,0038,B,00,B=${station_id}|}
              {PV12;0050,0350,0030,0038,B,00,B=VOLTAGE-IR OK|}
              {XS;I,0001,0000C3001|}`;

              

var data_ejeeto = `{D0420,0826,0400|}
{C|}
{PV00;0050,0068,0042,0042,B,00,B=AIR OK|}
{PV01;0304,0068,0038,0038,B,00,B=${dateTimestamp}|}
{PV02;0050,0120,0035,0035,B,00,B=Pack:|}
{PV03;0158,0120,0028,0028,B,00,B=${packNO}|}
{PV04;0050,0170,0038,0038,B,00,B=Pack Name:|}
{PV05;0353,0170,0038,0038,B,00,B==${packname}|}
{PV06;0050,0238,0038,0038,B,00,B=BODY|}
{PV07;0050,0298,0038,0038,B,00,B=${bodyVal}|}
{PV08;0234,0238,0038,0038,B,00,B=COOLANT|}
{PV09;0589,0238,0038,0038,B,00,B=STATION|}
{PV10;0263,0298,0038,0038,B,00,B=${coolantVal}|}
{PV11;0623,0298,0038,0038,B,00,B=${station_id}|}
{XS;I,0001,0000C3001|}`;


    // update status printed in database
    // save in DB
    //updateAirleakageValuesInDB(packNO,body,coolant,plug1,plug2,packname,'ALT 1');


    if(packname.trim()==='Limber Rear'){
        fs.writeFile("prn_data/file_airleakage_masterprint.prn", data_nir, (err) => {  //"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_esr.prn LPT1
            if (err)
                console.log(err);
            else {
                nrc.run(`"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_masterprint.prn "10.9.4.110" LPT1`).then(
                    function (existCodes) {
                        // console.log(`Command executed successfully - Printing file_airleakage`);
    
    
                    }, function (err) {
                        // console.log('Command failed to execute!');
                    }
                );
    
            }
        });
    }

    else if(packname.trim()==='Limber Front'){
        fs.writeFile("prn_data/file_airleakage_masterprint.prn", data_nir, (err) => {  //"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_esr.prn LPT1
            if (err)
                console.log(err);
            else {
                nrc.run(`"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_masterprint.prn "10.9.4.110" LPT1`).then(
                    function (existCodes) {
                        // console.log(`Command executed successfully - Printing file_airleakage`);
    
    
                    }, function (err) {
                        // console.log('Command failed to execute!');
                    }
                );
    
            }
        });
    }

    else if(packname.trim()==='Ejeeto 21.3'){
        fs.writeFile("prn_data/file_airleakage_masterprint.prn", data_ejeeto, (err) => {  //"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_esr.prn LPT1
            if (err)
                console.log(err);
            else {
                nrc.run(`"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_masterprint.prn "10.9.4.110" LPT1`).then(
                    function (existCodes) {
                        // console.log(`Command executed successfully - Printing file_airleakage`);
    
    
                    }, function (err) {
                        // console.log('Command failed to execute!');
                    }
                );
    
            }
        });
    }

    else if(packname.trim()==='Ejeeto 18.4'){
        fs.writeFile("prn_data/file_airleakage_masterprint.prn", data_ejeeto, (err) => {  //"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_esr.prn LPT1
            if (err)
                console.log(err);
            else {
                nrc.run(`"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_masterprint.prn "10.9.4.110" LPT1`).then(
                    function (existCodes) {
                        // console.log(`Command executed successfully - Printing file_airleakage`);
    
    
                    }, function (err) {
                        // console.log('Command failed to execute!');
                    }
                );
    
            }
        });
    }
else{
    fs.writeFile("prn_data/file_airleakage_masterprint.prn", data1, (err) => {  //"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_esr.prn LPT1
        if (err)
            console.log(err);
        else {
            nrc.run(`"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_masterprint.prn "10.9.4.110" LPT1`).then(
                function (existCodes) {
                    // console.log(`Command executed successfully - Printing file_airleakage`);


                }, function (err) {
                    // console.log('Command failed to execute!');
                }
            );

        }
    });
}




}

////////////////////////////////////////////////////////////////////////////////////



});



            socket.on('getRunningBatteryPacksALT', (data) => {
                // Query database using battery_id
                // var dbQuery = `SELECT * FROM final_qrcode_details where final_qrcode='${battery_qrcode}'`;
                var dbQuery = `SELECT * FROM taco_treceability.taco_treceability.air_leakage_testing where body_coolant_status = 'OK'`;
                sql.connect(sqlConfig, function (err) {
                    request = new sql.Request();
                    request.query(dbQuery, function (err, recordset) {
                        if (err) console.log(err)
                        var result = recordset.recordset;
                        // connection.query(dbQuery, function (err, result) {
                        //     if (err) console.log(err);
                        // console.log(result);
                        var final_qrcodes = [], battery_pack_name;
                        var dataObj = {};
                        var uniques = [];
                        for (var i in result) {
                            if (!uniques.includes(result[i].final_qrcode)) {

                                uniques.push(result[i].final_qrcode);

                                dataObj = {
                                    "final_qrcode": result[i].final_qrcode,
                                    "battery_pack_name": result[i].battery_pack_name
                                }
                                final_qrcodes.push(dataObj);
                            }

                        }
                        socket.emit('setRunningBatteryPacksALT', final_qrcodes);
                    });
                });
            });


            socket.on('getRunningBatteryPacksALT_bajaj', (data) => {
                // Query database using battery_id
                // var dbQuery = `SELECT * FROM final_qrcode_details where final_qrcode='${battery_qrcode}'`;
                var dbQuery = `SELECT  * FROM taco_treceability.taco_treceability.air_leakage_testing where body_reading!='NULL' and battery_pack_name like 'Bajaj %'`;
                sql.connect(sqlConfig, function (err) {
                    request = new sql.Request();
                    request.query(dbQuery, function (err, recordset) {
                        if (err) console.log(err)
                        var result = recordset.recordset;
                        // connection.query(dbQuery, function (err, result) {
                        //     if (err) console.log(err);
                        // console.log(result);
                        var final_qrcodes = [], battery_pack_name;
                        var dataObj = {};
                        var uniques = [];
                        for (var i in result) {
                            if (!uniques.includes(result[i].final_qrcode)) {

                                uniques.push(result[i].final_qrcode);

                                dataObj = {
                                    "final_qrcode": result[i].final_qrcode,
                                    "battery_pack_name": result[i].battery_pack_name
                                }
                                final_qrcodes.push(dataObj);
                            }

                        }
                        socket.emit('setRunningBatteryPacksALT_bajaj', final_qrcodes);
                    });
                });
            });

            socket.on('getALTDataForPrint', (final_qrcode, packNameStr) => {

                var dbQuery = `SELECT * FROM taco_treceability.taco_treceability.air_leakage_testing where body_coolant_status='OK' AND final_qrcode='${final_qrcode}' order by sr_no desc`;
                var dbQuery2 = `SELECT TOP 1 * FROM taco_treceability.taco_treceability.final_qrcode_details where final_qrcode='${final_qrcode}'`;
                sql.connect(sqlConfig, function (err) {
                    request = new sql.Request();
                    request.query(dbQuery, function (err, recordset) {
                        if (err) console.log(err)
                        var result = recordset.recordset;

                        request.query(dbQuery2, function (err, recordset2) {
                            if (err) console.log(err)
                            var result2 = recordset2.recordset;

                            socket.emit('setALTDataForPrint', result, result2,final_qrcode);
                        });
                    });
                });
            });

            socket.on('getALTDataForPrintCustomerQRCode', (CustomerQRCode) => {

                var dbQuery = `SELECT * FROM taco_treceability.taco_treceability.air_leakage_testing where body_coolant_status = 'OK' AND final_qrcode=(select final_qrcode from taco_treceability.taco_treceability.final_qrcode_details where  CustomerQRCode='${CustomerQRCode}') order by sr_no desc`;
                var dbQuery2 = `SELECT TOP 1 * FROM taco_treceability.taco_treceability.final_qrcode_details where final_qrcode=(select final_qrcode from taco_treceability.taco_treceability.taco_treceability.final_qrcode_details where CustomerQRCode='${CustomerQRCode}')`;
                sql.connect(sqlConfig, function (err) {
                    request = new sql.Request();
                    request.query(dbQuery, function (err, recordset) {
                        if (err) console.log(err)
                        var result = recordset.recordset;

                        request.query(dbQuery2, function (err, recordset2) {
                            if (err) console.log(err)
                            var result2 = recordset2.recordset;

                            socket.emit('setALTDataForPrint', result, result2);
                        });
                    });
                });
            });
            // master print - end

            //test d1
            socket.on('val1', (data) => {
                socket.emit('setval1', "OK");
            });
            //test d2
            socket.on('val2', (data) => {
                socket.emit('setval2', "OK");
            });
            // Auto scanning emit
            socket.on('getPlug1Values', (data) => {
                if (plugIndex == 0) {
                    if (global_airleakage_plug1_value != 'NA') {
                        socket.emit('setPlug1Values', global_airleakage_plug1_value, plugIndex);
                        //plugIndex++;
                        //global_airleakage_plug1_value = 'NA'
                    } else {
                        socket.emit('setPlug1Values', 'NA');
                    }
                } else if (plugIndex == 1) {
                    if (global_airleakage_plug1_value != 'NA') {
                        socket.emit('setPlug1Values', global_airleakage_plug1_value, plugIndex);
                        //plugIndex++;
                        //global_airleakage_plug1_value = 'NA'
                    } else {
                        socket.emit('setPlug1Values', 'NA');
                    }
                }


            });

            // Manual scanning emit 1
            socket.on('getPlug1ManualValues', (plugIndexStr) => {
                button1Flag = true;
                button2Flag = false;
                if (global_airleakage_plug1_value != 'NA') {
                    socket.emit('setPlug1ManualValues', global_airleakage_plug1_value, plugIndexStr);
                    //global_airleakage_plug1_value = 'NA';
                } else {
                    socket.emit('setPlug1ManualValues', 'NA', plugIndexStr);
                }
            });

            // socket.on('getPlug2Values', (data) => {
            //     if(global_airleakage_plug2_value!='NA') {
            //         socket.emit('setPlug2Values', global_airleakage_plug2_value);
            //     } else {
            //         socket.emit('setPlug2Values', 'NA');    
            //     }

            // });

            // Manual scanning emit 2
            socket.on('getPlug2ManualValues', (plugIndexStr) => {
                button1Flag = false;
                button2Flag = true;
                if (global_airleakage_plug1_value != 'NA') {
                    socket.emit('setPlug2ManualValues', global_airleakage_plug2_value, plugIndexStr);
                    //global_airleakage_plug1_value = 'NA';
                } else {
                    socket.emit('setPlug2ManualValues', 'NA', plugIndexStr);
                }
            });

            socket.on('resetPlugIndex', (plugIndexStr) => {
                plugIndex = 0;
            });

            // Airleakage Body parameter
           

            em.on('sendAirleakageBodyDataAlt6', (value) => {
                io.emit('setAirleakageBodyValueAlt6', value);
            });

            socket.on('getAirleakageBodyValue', (msg) => {
                // if(global_airleakage_plug1_value!='NA') {
                //     socket.emit('setPlug2ManualValues', global_airleakage_plug1_value, plugIndexStr);
                //     global_airleakage_plug1_value = 'NA';
                // } else {
                //     
                // } 
                socket.emit('setAirleakageBodyValue', global_airleakage_body_value);
            });

            // Airleakage Coolant parameter
           

            em.on('sendAirleakageCoolantDataAlt6', (value) => {
                // console.log('sendAirleakageCoolantDataAlt8 called');
                io.emit('setAirleakageCoolantValueAlt6', value);
            });

            socket.on('getAirleakageCoolantValue', (msg) => {
                // if(global_airleakage_plug1_value!='NA') {
                //     socket.emit('setPlug2ManualValues', global_airleakage_plug1_value, plugIndexStr);
                //     global_airleakage_plug1_value = 'NA';
                // } else {
                //     socket.emit('setAirleakageCoolantValue', global_airleakage_coolant_value);
                // } 
                socket.emit('setAirleakageCoolantValue', global_airleakage_coolant_value);
            });

            socket.on('printAirleakageTest222222', (data) => {
                // console.log('test done');
                socket.emit('testemit', 'data');

            });


//             // Print Sticker - alt1
           
            // Print Sticker - alt8

            socket.on('store_alt_value', (packNO, body, coolant, plug1, plug2, packname, station,modulebarcode) => {
             
                updateAirleakageValuesInDB(packNO, body, coolant, plug1, plug2, packname, 'ALT 5','','');
                });

            socket.on('printAirleakageTest_alt5', (packNO, body, coolant, plug1, plug2, packname, station_id, modulebarcode) => {
                var bodyVal = body; //.split(' ')[0]
                var coolantVal = coolant; //.split(' ')[0]
                var plug1Val = plug1.split(' ')[0]
                var plug2Val = plug2.split(' ')[0]
            
            
                // console.log('packNO,body,coolant,plug1,plug2', packNO, body, coolant, plug1, plug2);
            
                var formatedMonth, formatedDay, mm, dd, year;
                var todayDate = new Date();
            
                year = todayDate.getFullYear();
                mm = (todayDate.getMonth() + 1).toString();
                formatedMonth = (mm.length === 1) ? ("0" + mm) : mm;
                dd = todayDate.getDate().toString();
                formatedDay = (dd.length === 1) ? ("0" + dd) : dd;
                var dateStr = formatedDay + "-" + formatedMonth + "-" + year;
            
                var dateTimestamp;
            
                var hh = todayDate.getHours();
                var mm = todayDate.getMinutes();
                var ss = todayDate.getSeconds();
            
                dateTimestamp = formatedDay + "-" + formatedMonth + "-" + year + " " + hh + ":" + mm + ":" + ss;
                var packnamefinal = packname.substring(0, 5);
                //var capacity;
                var capacity,mfg_date;
            
            
                console.log("packnamefinal", packnamefinal,packname);
                if (packnamefinal.includes('Bajaj')) {
                            var batterypart;
                            var nom_voltage_value;
                            var min_capacity_value;
                            var tac_no;
                            if(packname=="Bajaj 5.9"){
                                batterypart="AH401901";
                                nom_voltage_value="51.2 V";
                                min_capacity_value="116Ah";
                                capacity='2';
                                tac_no='';
                            }
            
                    if(packname=="Bajaj 8.9"){
                        batterypart="AH401967";
                        nom_voltage_value="51.2 V";
                        min_capacity_value="174Ah";
                        capacity='3';
                        tac_no='AN5079';
                    }
                   
                    if(packname=="Bajaj 11.8"){
                        // batterypart="AH401903";
                        batterypart="BK401902";
                        nom_voltage_value="51.2 V";
                        min_capacity_value="232Ah";
                        capacity='4';
                        tac_no='AN5080';
                    }
                    if(packname=="Bajaj 6.1"){
                        batterypart="AH401901";
                        nom_voltage_value="51.2 V";
                        min_capacity_value="118.4Ah";
                        capacity='2';
                        tac_no='AR8302';
                    }
                    if(packname=="Bajaj 9.2"){
                        batterypart="AH415101";
                        nom_voltage_value="51.2 V";
                        min_capacity_value="180Ah";
                        capacity='3';
                        tac_no='AR8301';
                    }

                    if(packname=="Bajaj 12.2"){
                        // batterypart="AH401903";
                        batterypart="BK401902";
                        nom_voltage_value="51.2 V";
                        min_capacity_value="232Ah";
                        capacity='4';
                        tac_no='AR8300';
                    }
                    
                    if(packname=="Bajaj 12.1"){
                        // batterypart="AH401903";
                        batterypart="AH401933";
                        nom_voltage_value="51.2 V";
                        min_capacity_value="236.8Ah";
                        capacity='3';
                        tac_no='AR8249';
                    }
                    
            
                    var query4 = `SELECT TOP (1) * FROM taco_treceability.taco_treceability.finalqr_bms_details where module_qrcode='${modulebarcode}' ORDER BY sr_no DESC`;
                    sql.connect(sqlConfig, function (err) {
                        request = new sql.Request();
                        request.query(query4, function (err, recordset) {
                            if (err) console.log(err);
                            var result = recordset.recordset;
                            // console.log("result:", result);
                            if (result.length != 0) {
                                for (var i in result) {
                                    var sr_no = result[i].sr_no;
                                    var pack_no = result[i].pack_no;
                                    var pack_qrcode = result[i].module_qrcode;
                                    var hex_string = result[i].hex_string;
                                    var string1 = result[i].string1;
                                     var bmsmfg=result[i].bmsmfg;
                                    var bms_no = result[i].bms_no;
                                    var finalqr= result[i].FinalQRCode;
                                   var bin_number= result[i].bin_no;
                                   var todaydate=result[i].final_date;
                                   var final_json_string=result[i].final_json_string;
                                    
                                    var bmsmfg=result[i].bmsmfg;
                                    
                                   
                                   var bin_number= result[i].bin_no;
                                   var batterypart= result[i].batterypart;
                                   var nom_voltage_value= result[i].nom_voltage_value;
                                   var min_capacity_value= result[i].min_capacity_value;
                                   var mfg_date1= result[i].final_date;
            
                                    //   var hex_string=result[i].hex_string;
                                    // var nom_voltage_value = result[i].nom_voltage_value;
                                    // var min_capacity_value = result[i].min_capacity_value;
                                    // var finalpackqrcode=result[i].finalpackqrcode;
                                    //  var final_json_string=result[i].final_json_string;
                                    // console.log("pack_no,pack_qrcode", pack_no, pack_qrcode,final_json_string);
                                    //////////////////////////////////////////////////BIN GENERATION CODE START////////////////////////////////////////////////////////////////////////////////////
            
                                    var string1_split = string1.split(" ");
                                    var num1 = string1_split[0];
                                    var num2 = string1_split[1];
                                    var year = new Date().getFullYear();
            
            
            
            
                                                        
                                                        
                                                        
                                                       var month = (new Date().getMonth() + 1);
                                                       var day = new Date().getDate();
                               
                               
                                                       let objectDate = new Date ();
                                                       let day1 = objectDate.getDate();
                                                       // console.log(day1);
                               
                                                       let year1 = objectDate.getFullYear();
                                                       // console.log(year1);
                               
                                                       const month1 = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                               
                                                       const d = new Date();
                                                       let monthname = (month1[d.getMonth()]).toUpperCase();
                               
                                                       var todaydate = day1+" "+monthname+" "+year1;
                                                       if(mfg_date1=="" || mfg_date1==null || mfg_date1=='NULL' || mfg_date1=='undefined')
                               {
                               mfg_date=todaydate;
                               }
                               else{
                               mfg_date=mfg_date1;
                               }
                               
            

                            //    var data_zebra_new;


                            //    if(packname=="Bajaj 8.9" || packname=="Bajaj 11.8"){
                            //    data_zebra_new=`CT~~CD,~CC^~CT~
                            //    ^XA~TA000~JSN^LT30^MNW^MTT^PON^PMN^LH0,0^JMA^PR2,2~SD20^JUS^LRN^CI0^XZ
                            //    ^XA
                            //    ^MMT
                            //    ^PW354
                            //    ^LL0331
                            //    ^LS-5
                            //    ^FT80,240^A0B,19,19^FH\^FD${num1} ${num2}^FS
                            //    ^FT136,290^BQN,2,4
                            //    ^FH\^FDLA,${final_json_string}^FS
                            //    ^FT57,299^A0N,19,19^FH\^FD${bin_number}^FS
                            //    ^FT107,240^A0B,19,19^FH\^FD${bms_no}^FS
                            //    ^FT57,322^A0N,19,19^FH\^FD${hex_string}^FS
                            //    ^FT57,343^A0N,19,19^FH\^FDMFG: ${mfg_date}^FS
                            //    ^FT57,275^A0N,19,19^FH\^FD${tac_no}^FS
                            //    ^PQ1,0,1,Y^XZ
                            //    `;
                            //    }
                            //    else{
                            //    data_zebra_new=`CT~~CD,~CC^~CT~
                            //    ^XA~TA000~JSN^LT30^MNW^MTT^PON^PMN^LH0,0^JMA^PR2,2~SD20^JUS^LRN^CI0^XZ
                            //    ^XA
                            //    ^MMT
                            //    ^PW354
                            //    ^LL0331
                            //    ^LS-5
                            //    ^FT80,240^A0B,19,19^FH\^FD${num1} ${num2}^FS
                            //    ^FT136,290^BQN,2,4
                            //    ^FH\^FDLA,${final_json_string}^FS
                            //    ^FT57,299^A0N,19,19^FH\^FD${bin_number}^FS
                            //    ^FT107,240^A0B,19,19^FH\^FD${bms_no}^FS
                            //    ^FT57,322^A0N,19,19^FH\^FD${hex_string}^FS
                            //    ^FT57,343^A0N,19,19^FH\^FDMFG: ${mfg_date}^FS
                            //    ^PQ1,0,1,Y^XZ
                            //        `; 
                            //    } 
            

                            var data_zebra_new,data_tosiba_new;
                           if(packname=='Bajaj 6.1'){
data_tosiba_new=`{D0300,0301,0280|}
{C|}
 {XB00;0100,0053,T,M,05,A,0,M2=${final_json_string}|}
        {PC000;0033,0200,07,07,H,33,B=${num1}|}
        {PC001;0057,0200,07,07,H,33,B=${bms_no}|}
        {PC002;0033,0080,07,07,H,33,B=${num2}|}
        {PC003;0082,0200,07,07,H,33,B=SW:AH404446|}
        {PC004;0020,0245,05,05,H,00,B=${bin_number}|}
        {PC005;0020,0260,05,05,H,00,B=049346|}
        {PC006;0020,0278,05,05,H,00,B=MFG :|}
        {PC007;0074,0278,05,05,H,00,B=${mfg_date}|}
{XS;I,0001,0000C6200|}`;
}
else if(packname=='Bajaj 9.2' || packname=='Bajaj 12.1' || packname=='Bajaj 12.2' ||  packname=='Bajaj 8.9' ||  packname=='Bajaj 11.8'){
//     data_tosiba_new=`{D0330,0301,0280|}
//    {AY;+00,0|}
//    {C|}
//    {XB00;0090,0053,T,M,05,A,0,M2=${final_json_string}|}
//    {PC000;0033,0190,05,05,I,33,B=${num1}|}
//    {PC001;0057,0188,05,05,I,33,B=${bms_no}|}
//    {PC002;0033,0083,05,05,I,33,B=${num2}|}
//    {PC003;0020,0229,05,05,H,00,B=${tac_no}|}
//    {PC004;0020,0245,05,05,H,00,B=${bin_number}|}
//    {PC005;0020,0260,05,05,H,00,B=${hex_string}|}
//    {PC006;0020,0278,05,05,H,00,B=MFG :|}
//    {PC007;0074,0278,05,05,H,00,B=${mfg_date}|}
//    {XS;I,0001,0002C6200|}
//    `;
data_tosiba_new=`{D0300,0301,0280|}
{C|}
 {XB00;0090,0053,T,M,05,A,0,M2=${final_json_string}|}
        {PC000;0033,0200,07,07,H,33,B=${num1}|}
        {PC001;0057,0200,07,07,H,33,B=${bms_no}|}
        {PC002;0033,0080,07,07,H,33,B=${num2}|}
        {PC003;0020,0229,05,05,H,00,B=${tac_no}|}
        {PC004;0020,0245,05,05,H,00,B=${bin_number}|}
        {PC005;0020,0260,05,05,H,00,B=${hex_string}|}
        {PC006;0020,0278,05,05,H,00,B=MFG :|}
        {PC007;0074,0278,05,05,H,00,B=${mfg_date}|}
{XS;I,0001,0000C6200|}`;
   }
   else{
   data_tosiba_new=`{D0330,0301,0280|}
   {AY;+00,0|}
   {C|}
   {XB00;0090,0053,T,M,05,A,0,M2=${final_json_string}|}
   {PC000;0033,0190,05,05,I,33,B=${num1}|}
   {PC001;0057,0188,05,05,I,33,B=${bms_no}|}
   {PC002;0033,0083,05,05,I,33,B=${num2}|}
   {PC004;0020,0245,05,05,H,00,B=${bin_number}|}
   {PC005;0020,0260,05,05,H,00,B=${hex_string}|}
   {PC006;0020,0278,05,05,H,00,B=MFG :|}
   {PC007;0074,0278,05,05,H,00,B=${mfg_date}|}
   {XS;I,0001,0002C6200|}
   `; 
   }
                                    // update status printed in database
                                    // save in DB
            
                                  //  console.log("updating alt 6", data1);
                                    //  updateAirleakageValuesInDB(packNO,body,coolant,plug1,plug2,packname,'ALT 6');
                                    updateAirleakageValuesInDB(packNO, body, coolant, plug1, plug2, packname, 'ALT 5','','');
                                /*    fs.writeFile("prn_data/godex_print.prn", data_zebra_new, (err) => {  //"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_esr.prn LPT1
                                        if (err)
                                            console.log(err);   //   var finalqr= result[i].FinalQRCode;
                                        else {
                                            packname
                                            nrc.run(`"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\godex_print.prn "10.9.4.149_zebra_alt5" LPT1`).then(
                                                function (existCodes) {
                                                    console.log(`Command executed successfully - Printing file_airleakage_alt6 live print`);
                                                   savealt6data(bin_number,final_json_string,nom_voltage_value,min_capacity_value,batterypart,todaydate,tac_no,finalqr);
            
            
                                                }, function (err) {
                                                    // console.log('Command failed to execute!');
                                                }
                                            );
            
                                        }
                                    });  */
                                    ////////////////////////////////////////////////
                                 //   setTimeout(function () {
                                    fs.writeFile("prn_data/testtosiba.prn", data_tosiba_new, (err) => {
                                        if (err)
                                            console.log(err);
                                        else {
                            
                                            nrc.run(`"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\testtosiba.prn "10.9.4.110" LPT1`).then(
                                                function (existCodes) {
                                                    console.log(`Command executed successfully - Printing Customer Code: 11111`);
                                                    // update status printed in database
                            
                                                    
                                                }, function (err) {
                                                    console.log('Command failed to execute!');
                                                }
                                            ); 
                                            }
                                        });

                                 //   },100);
                                    //////////////////////////////////////////
                                }
                            }
                        });
                    });
            
            
                }
                else {
            
            
                    /////////////////////////////////////////////////////////////////////////////////////////////
            
            
            if(packname=="Limber Rear"){
            var myString = packNO;
            var tee =  myString.substring(26, 27);
            
            // console.log('kartiket::::::::::::::::',tee)
            if (tee == '0')
            {
            //packNO = packNO.replace('F', '0');
            myString = myString.substring(0, 26) + "R" +   myString.substring(27, myString.length);
            // console.log('FFFFFFFFFFF kartiket21::::::::::::::::',myString)
            var tee2 =  myString.substring(13, 14);
            if (tee2 == '3')
            {
            //packNO = packNO.replace('F', '0');
            myString = myString.substring(0, 13) + "4" +   myString.substring(14, myString.length);
            
            }
            
            packNO = myString;
            }  
            }
            
            
            if(packname=="Limber Front"){
            var myString = packNO;
            var tee =  myString.substring(26, 27);
            
            // console.log('kartiket::::::::::::::::',tee)
            if (tee == '0')
            {
            //packNO = packNO.replace('F', '0');
            myString = myString.substring(0, 26) + "F" +   myString.substring(27, myString.length);
            // console.log('FFFFFFFFFFF kartiket21::::::::::::::::',myString)
            var tee2 =  myString.substring(13, 14);
            if (tee2 == '3')
            {
            //packNO = packNO.replace('F', '0');
            myString = myString.substring(0, 13) + "3" +   myString.substring(14, myString.length);
            
            }
            
            packNO = myString;
            }  
            }
            
             
            
            
            
              ////////////////////////////////////////////////////////////////////////////////////////////
            
                    var data1 = `{D0420,0826,0400|}
                {C|}
                {PV00;0050,0064,0042,0042,B,00,B=AIR OK|}
                {PV01;0304,0059,0038,0038,B,00,B=${dateTimestamp}|}
                {PV02;0050,0139,0035,0035,B,00,B=Pack:|}
                {PV03;0158,0136,0028,0028,B,00,B=${packNO}|}
                {PV04;0050,0191,0038,0038,B,00,B=Pack Name:|}
                {PV05;0353,0191,0038,0038,B,00,B=${packname}|}
                {PV06;0050,0258,0038,0038,B,00,B=BODY|}
                {PV07;0050,0338,0038,0038,B,00,B=${bodyVal}|}
                {PV08;0234,0258,0038,0038,B,00,B=COOLANT|}
                {PV09;0589,0268,0038,0038,B,00,B=STATION|}
                {PV10;0263,0338,0038,0038,B,00,B=${coolantVal}|}
                {PV11;0623,0335,0038,0038,B,00,B=ALT 5|}
                {XS;I,0001,0000C3001|}`;

               
            
                    // update status printed in database
                    // save in DB
                    updateAirleakageValuesInDB(packNO, body, coolant, plug1, plug2, packname, 'ALT 5','','');
            
                    fs.writeFile("prn_data/file_airleakage6.prn", data1, (err) => {  //"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_esr.prn LPT1
                        if (err)
                            console.log(err);
                        else {
                            nrc.run(`"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage6.prn "10.9.4.110" LPT1`).then(
                                function (existCodes) {
                                    // console.log(`Command executed successfully - Printing file_airleakage`);
            
            
            
                                }, function (err) {
                                    // console.log('Command failed to execute!');
                                }
                            );
            
                        }
                    });
            
            
                }
            });
            



            function savealt6data(bin_number,final_json_string,nom_voltage_value,min_capacity_value,batterypart,todaydate,tac_no,finalqr){
                var dbQuery = `UPDATE taco_treceability.taco_treceability.finalqr_bms_details SET bin_no='${bin_number}',final_json_string='${final_json_string}',nom_voltage_value='${nom_voltage_value}',min_capacity_value='${min_capacity_value}',batterypart='${batterypart}',final_date='${todaydate}',tac_no='${tac_no}' WHERE  FinalQRCode='${finalqr}'`;
                sql.connect(sqlConfig, function (err) {
                   var request = new sql.Request();

                    request.query(dbQuery, function (err, recordset) {
                        if (err) console.log(err);

                    });
                });
            }

            socket.on('printAirleakageTest_alt8', (packNO, body, coolant, plug1, plug2, packname, station_id,defectlistPrint,ir_completion_status) => {
                var bodyVal = body; //.split(' ')[0]
                var coolantVal = coolant; //.split(' ')[0]
                var plug1Val = plug1.split(' ')[0]
                var plug2Val = plug2.split(' ')[0]

                var pcknumber=packNO.slice(packNO.length - 6);
                // console.log('packNO,body,coolant,plug1,plug2', packNO, body, coolant, plug1, plug2);

                var formatedMonth, formatedDay, mm, dd, year;
                var todayDate = new Date();

                year = todayDate.getFullYear();
                mm = (todayDate.getMonth() + 1).toString();
                formatedMonth = (mm.length === 1) ? ("0" + mm) : mm;
                dd = todayDate.getDate().toString();
                formatedDay = (dd.length === 1) ? ("0" + dd) : dd;
                var dateStr = formatedDay + "-" + formatedMonth + "-" + year;

                var dateTimestamp;

                var hh = todayDate.getHours();
                var mm = todayDate.getMinutes();
                var ss = todayDate.getSeconds();

                dateTimestamp = formatedDay + "-" + formatedMonth + "-" + year + " " + hh + ":" + mm + ":" + ss;

                /////////////////////////////////////////////////////////////////////////////////////////////

                if(defectlistPrint.length==0){
if(packname=="Limber Rear"){
    var myString = packNO;
    var tee =  myString.substring(26, 27);
    
    // console.log('kartiket::::::::::::::::',tee)
    if (tee == '0')
     {
         //packNO = packNO.replace('F', '0');
         myString = myString.substring(0, 26) + "R" +   myString.substring(27, myString.length);
        //  console.log('FFFFFFFFFFF kartiket21::::::::::::::::',myString)
         var tee2 =  myString.substring(13, 14);
         if (tee2 == '3')
         {
         //packNO = packNO.replace('F', '0');
         myString = myString.substring(0, 13) + "4" +   myString.substring(14, myString.length);
         
         }
         
         packNO = myString;
     }  
}

          
if(packname=="Limber Front"){
    var myString = packNO;
    var tee =  myString.substring(26, 27);
    
    // console.log('kartiket::::::::::::::::',tee)
    if (tee == '0')
     {
         //packNO = packNO.replace('F', '0');
         myString = myString.substring(0, 26) + "F" +   myString.substring(27, myString.length);
        //  console.log('FFFFFFFFFFF kartiket21::::::::::::::::',myString)
         var tee2 =  myString.substring(13, 14);
         if (tee2 == '3')
         {
         //packNO = packNO.replace('F', '0');
         myString = myString.substring(0, 13) + "3" +   myString.substring(14, myString.length);
         
         }
         
         packNO = myString;
     }  
}



              ////////////////////////////////////////////////////////////////////////////////////////////

              var data1 = `{D0420,0826,0400|}
              {C|}
              {PV00;0050,0068,0042,0042,B,00,B=AIR OK|}
              {PV01;0304,0068,0038,0038,B,00,B=${dateTimestamp}|}
              {PV02;0050,0120,0035,0035,B,00,B=Pack:|}
              {PV03;0158,0120,0028,0028,B,00,B=${packNO}|}
              {PV04;0050,0170,0038,0038,B,00,B=Pack Name:|}
              {PV05;0353,0170,0038,0038,B,00,B==${packname}|}
              {PV06;0050,0238,0038,0038,B,00,B=BODY|}
              {PV07;0050,0298,0038,0038,B,00,B=${bodyVal}|}
              {PV08;0234,0238,0038,0038,B,00,B=COOLANT|}
              {PV09;0589,0238,0038,0038,B,00,B=STATION|}
              {PV10;0263,0298,0038,0038,B,00,B=${coolantVal}|}
              {PV11;0623,0298,0038,0038,B,00,B=ALT 8|}
              {PV12;0050,0350,0030,0038,B,00,B=VOLTAGE-IR OK|}
              {PV13;0050,0400,0030,0038,B,00,B=TORQUE-OK|}
              {XS;I,0001,0000C3001|}`;


              var data_not_ir= `{D0420,0826,0400|}
              {C|}
              {PV00;0050,0068,0042,0042,B,00,B=AIR OK|}
              {PV01;0304,0068,0038,0038,B,00,B=${dateTimestamp}|}
              {PV02;0050,0120,0035,0035,B,00,B=Pack:|}
              {PV03;0158,0120,0028,0028,B,00,B=${packNO}|}
              {PV04;0050,0170,0038,0038,B,00,B=Pack Name:|}
              {PV05;0353,0170,0038,0038,B,00,B==${packname}|}
              {PV06;0050,0238,0038,0038,B,00,B=BODY|}
              {PV07;0050,0298,0038,0038,B,00,B=${bodyVal}|}
              {PV08;0234,0238,0038,0038,B,00,B=COOLANT|}
              {PV09;0589,0238,0038,0038,B,00,B=STATION|}
              {PV10;0263,0298,0038,0038,B,00,B=${coolantVal}|}
              {PV11;0623,0298,0038,0038,B,00,B=ALT 8|}
              {PV12;0050,0350,0030,0038,B,00,B=VOLTAGE-IR OK|}
              {PV13;0050,0400,0030,0038,B,00,B=TORQUE NOT-OK|}
              {XS;I,0001,0000C3001|}`;


              var data_nir = `{D0420,0826,0400|}
              {C|}
              {PV00;0050,0068,0042,0042,B,00,B=AIR OK|}
              {PV01;0304,0068,0038,0038,B,00,B=${dateTimestamp}|}
              {PV02;0050,0120,0035,0035,B,00,B=Pack:|}
              {PV03;0158,0120,0028,0028,B,00,B=${packNO}|}
              {PV04;0050,0170,0038,0038,B,00,B=Pack Name:|}
              {PV05;0353,0170,0038,0038,B,00,B==${packname}|}
              {PV06;0050,0238,0038,0038,B,00,B=BODY|}
              {PV07;0050,0298,0038,0038,B,00,B=${bodyVal}|}
              {PV08;0234,0238,0038,0038,B,00,B=COOLANT|}
              {PV09;0589,0238,0038,0038,B,00,B=STATION|}
              {PV10;0263,0298,0038,0038,B,00,B=${coolantVal}|}
              {PV11;0623,0298,0038,0038,B,00,B=ALT 8|}
              {PV12;0050,0350,0030,0038,B,00,B=VOLTAGE-IR OK|}
              {XS;I,0001,0000C3001|}`;

              var data_nir_sm = `{D0420,0826,0400|}
              {C|}
              {PV00;0050,0068,0042,0042,B,00,B=AIR OK|}
              {PV01;0304,0068,0038,0038,B,00,B=${dateTimestamp}|}
              {PV02;0050,0120,0035,0035,B,00,B=Pack:|}
              {PV03;0158,0120,0028,0028,B,00,B=${pcknumber}|}
              {PV04;0050,0170,0038,0038,B,00,B=Pack Name:|}
              {PV05;0353,0170,0038,0038,B,00,B==${packname}|}
              {PV06;0050,0238,0038,0038,B,00,B=BODY|}
              {PV07;0050,0298,0038,0038,B,00,B=${bodyVal}|}
              {PV08;0234,0238,0038,0038,B,00,B=COOLANT|}
              {PV09;0589,0238,0038,0038,B,00,B=STATION|}
              {PV10;0263,0298,0038,0038,B,00,B=${coolantVal}|}
              {PV11;0623,0298,0038,0038,B,00,B=ALT 8|}
              {PV12;0050,0350,0030,0038,B,00,B=VOLTAGE-IR OK|}
              {XS;I,0001,0000C3001|}`;

                // update status printed in database
                // save in DB
                updateAirleakageValuesInDB(packNO, body, coolant, plug1, plug2, packname, 'ALT 8');


                if(packname=="Limber Rear"){
                fs.writeFile("prn_data/file_airleakage8.prn", data_nir, (err) => {  //"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_esr.prn LPT1
                    if (err)
                        console.log(err);
                    else {
                        nrc.run(`"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage8.prn "10.9.4.110" LPT1`).then(
                            function (existCodes) {
                                // console.log(`Command executed successfully - Printing file_airleakage`);



                            }, function (err) {
                                // console.log('Command failed to execute!');
                            }
                        );

                    }
                });
            }
           
            else if(packname=="Limber Front"){
                fs.writeFile("prn_data/file_airleakage8.prn", data_nir, (err) => {  //"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_esr.prn LPT1
                    if (err)
                        console.log(err);
                    else {
                        nrc.run(`"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage8.prn "10.9.4.110" LPT1`).then(
                            function (existCodes) {
                                // console.log(`Command executed successfully - Printing file_airleakage`);



                            }, function (err) {
                                // console.log('Command failed to execute!');
                            }
                        );

                    }
                });
            }
            else if(packname=="SM eBada Dost"){
                console.log()
                fs.writeFile("prn_data/file_airleakage8_8.prn", data_nir_sm, (err) => {  //"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_esr.prn LPT1
                    if (err)
                        console.log(err);
                    else {
                        nrc.run(`"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage8_8.prn "10.9.4.110" LPT1`).then(
                            function (existCodes) {
                                // console.log(`Command executed successfully - Printing file_airleakage`);



                            }, function (err) {
                                // console.log('Command failed to execute!');
                            }
                        );

                    }
                });
            }
            else {
                if(ir_completion_status=="OK"){
                fs.writeFile("prn_data/file_airleakage8_8.prn", data_nir_sm, (err) => {  //"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_esr.prn LPT1
                    if (err)
                        console.log(err);
                    else {
                        nrc.run(`"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage8_8.prn "10.9.4.110" LPT1`).then(
                            function (existCodes) {
                                // console.log(`Command executed successfully - Printing file_airleakage`);



                            }, function (err) {
                                // console.log('Command failed to execute!');
                            }
                        );

                    }
                });
            }
            if(ir_completion_status=="NOT OK"){
                fs.writeFile("prn_data/file_airleakage8_8.prn", data_nir_sm, (err) => {  //"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_esr.prn LPT1
                    if (err)
                        console.log(err);
                    else {
                        nrc.run(`"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage8_8.prn "10.9.4.110" LPT1`).then(
                            function (existCodes) {
                                // console.log(`Command executed successfully - Printing file_airleakage`);



                            }, function (err) {
                                // console.log('Command failed to execute!');
                            }
                        );

                    }
                });
            }
            }



            }
            else{
                if(packname=="Limber Rear"){
                    var myString = packNO;
                    var tee =  myString.substring(26, 27);
                    
                    // console.log('kartiket::::::::::::::::',tee)
                    if (tee == '0')
                     {
                         //packNO = packNO.replace('F', '0');
                         myString = myString.substring(0, 26) + "R" +   myString.substring(27, myString.length);
                        //  console.log('FFFFFFFFFFF kartiket21::::::::::::::::',myString)
                         var tee2 =  myString.substring(13, 14);
                         if (tee2 == '3')
                         {
                         //packNO = packNO.replace('F', '0');
                         myString = myString.substring(0, 13) + "4" +   myString.substring(14, myString.length);
                         
                         }
                         
                         packNO = myString;
                     }  
                }
                
                          
                if(packname=="Limber Front"){
                    var myString = packNO;
                    var tee =  myString.substring(26, 27);
                    
                    // console.log('kartiket::::::::::::::::',tee)
                    if (tee == '0')
                     {
                         //packNO = packNO.replace('F', '0');
                         myString = myString.substring(0, 26) + "F" +   myString.substring(27, myString.length);
                        //  console.log('FFFFFFFFFFF kartiket21::::::::::::::::',myString)
                         var tee2 =  myString.substring(13, 14);
                         if (tee2 == '3')
                         {
                         //packNO = packNO.replace('F', '0');
                         myString = myString.substring(0, 13) + "3" +   myString.substring(14, myString.length);
                         
                         }
                         
                         packNO = myString;
                     }  
                }
                
                
                
                              ////////////////////////////////////////////////////////////////////////////////////////////
                
                                var data1 = `{D0420,0826,0400|}
                                {C|}
                                {PV00;0050,0064,0042,0042,B,00,B=AIR OK|}
                                {PV01;0304,0059,0038,0038,B,00,B=${dateTimestamp}|}
                                {PV02;0050,0139,0035,0035,B,00,B=Pack:|}
                                {PV03;0158,0136,0028,0028,B,00,B=${packNO}|}
                                {PV04;0050,0191,0038,0038,B,00,B=Pack Name:|}
                                {PV05;0353,0191,0038,0038,B,00,B=${packname}|}
                                {PV06;0050,0258,0038,0038,B,00,B=BODY|}
                                {PV07;0050,0338,0038,0038,B,00,B=${bodyVal}|}
                                {PV08;0234,0258,0038,0038,B,00,B=COOLANT|}
                                {PV09;0589,0268,0038,0038,B,00,B=STATION|}
                                {PV10;0263,0338,0038,0038,B,00,B=${coolantVal}|}
                                {PV11;0623,0335,0038,0038,B,00,B=ALT 8|}
                                {XS;I,0001,0000C3001|}`;


                                var data2=`{D0430,0801,0400|}
                                {AY;+10,0|}
                                {C|}
                                {PC000;0290,0090,05,05,I,00,B=REWORK|}
                                {PC001;0150,0170,05,05,I,00,B=Pack No: ${pcknumber}|}
                                {PC002;0150,0231,05,05,I,00,B=Defect Name: ${defectlistPrint[0]}|}     
                                {XS;I,0001,0002C3200|}                
                                `;

                                
                
                                // update status printed in database
                                // save in DB
                                updateAirleakageValuesInDB(packNO, body, coolant, plug1, plug2, packname, 'ALT 8');
                
                                fs.writeFile("prn_data/file_airleakage8.prn", data1, (err) => {  //"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage_esr.prn LPT1
                                    if (err)
                                        console.log(err);
                                    else {
                                        nrc.run(`"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\file_airleakage8.prn "10.9.4.110" LPT1`).then(
                                            function (existCodes) {
                                                // console.log(`Command executed successfully - Printing file_airleakage`);
                
                
                
                                            }, function (err) {
                                                // console.log('Command failed to execute!');
                                            }
                                        );
                
                                    }
                                }); 


                                // setTimeout(function () {

                                //     fs.writeFile("prn_data/REWORK_ALTPACK.prn", data2, (err) => {
                                //         if (err)
                                //             console.log(err);
                                //         else {
                                //     console.log("File written successfully rework\n");
                                   
                                    
                                //     // setTimeout(() => {
                                //     nrc.run(`"C:\\Program Files (x86)\\Printfil\\Printfil.exe" C:\\Project\\EV_Battery_MIS\\SQL\\ALT_Stations\\Standalone_Airleakage\\prn_data\\REWORK_ALTPACK.prn "10.9.4.110" LPT1`).then(
                                //         function (existCodes) {    //10.9.4.99
                                //             console.log(`Command executed successfully - Printing Customer Code: ${pcknumber}`);
                                //             // update status printed in database
                    
                                            
                                //         }, function (err) {
                                //             console.log('Command failed to execute!');
                                //         }
                                //     );
                                //         }
                                //     });
                    
                                // }, 400)
            }
            });



        });
        

        function updateAirleakageValuesInDB(packNO, body, coolant, plug1, plug2, packname, line,c_status,b_status) {
            console.log('packNO, body, coolant, plug1, plug2, packname, line,c_status,b_status',packNO, body, coolant, plug1, plug2, packname, line,c_status,b_status)
            var final_qrcode;
            var date = new Date(),
                year = date.getFullYear(),
                month = (date.getMonth() + 1).toString(),
                formatedMonth = (month.length === 1) ? ("0" + month) : month,
                day = date.getDate().toString(),
                formatedDay = (day.length === 1) ? ("0" + day) : day,
                hour = date.getHours().toString(),
                formatedHour = (hour.length === 1) ? ("0" + hour) : hour,
                minute = date.getMinutes().toString(),
                formatedMinute = (minute.length === 1) ? ("0" + minute) : minute,
                second = date.getSeconds().toString(),
                formatedSecond = (second.length === 1) ? ("0" + second) : second;
            var str = year + "-" + formatedMonth + "-" + formatedDay + " " + formatedHour + ':' + formatedMinute + ':' + formatedSecond;
// console.log('vishal::::::::',packNO, body, coolant, plug1, plug2, packname, line)
if (packNO.indexOf('F') > -1)
                             {
                               // packNO = packNO.replace('F', '0');
 
                             }
                             if (packNO.indexOf('R') > -1)
                             {
                               // packNO  = packNO.replace('R', '0');   
                             }
                             //console.log('CpackNO::::::::vishall',CpackNO)
/////////////////////////////////////New ADDITION /////////////////////////////////
if(packname=="Limber Rear"){
    var myString = packNO;
    var tee_temp =  myString.substring(26, 27);
    
    // console.log('kartiket::::::::::::::::',tee_temp)
    if (tee_temp == 'R')
     {
         //packNO = packNO.replace('F', '0');
         myString = myString.substring(0, 26) + "0" +   myString.substring(27, myString.length);
        //  console.log('FFFFFFFFFFF kartiket21::::::::::::::::',myString)
         var tee2 =  myString.substring(13, 14);
         if (tee2 == '4')
         {
         //packNO = packNO.replace('F', '0');
         myString = myString.substring(0, 13) + "3" +   myString.substring(14, myString.length);
         
         }
         
         packNO = myString;
     }  
}

if(packname=="Limber Front"){
    var myString = packNO;
    var tee_TEMP =  myString.substring(26, 27);
    
    // console.log('kartiket::::::::::::::::',tee_TEMP)
    if (tee_TEMP == 'F')
     {
         //packNO = packNO.replace('F', '0');
         myString = myString.substring(0, 26) + "0" +   myString.substring(27, myString.length);
        //  console.log('FFFFFFFFFFF kartiket21::::::::::::::::',myString)
         var tee2 =  myString.substring(13, 14);
         if (tee2 == '3')
         {
         //packNO = packNO.replace('F', '0');
         myString = myString.substring(0, 13) + "3" +   myString.substring(14, myString.length);
         
         }
         
         packNO = myString;
     }  
}




///////////////////////////////////NEW ADDITION///////////////////////////////////////////
// if(line == 'ALT 1'){
    if(line == 'ALT 1' || line == 'ALT 2' || line == 'ALT 3' || line == 'ALT 4'){
        var pdi_status = 'OK';
        if(c_status == 'OK' && b_status == 'OK'){
            pdi_status = 'OK';
}   else{

}
    sql.connect(sqlConfig, function (err) {
        request = new sql.Request();
        // console.log("SELECT * FROM taco_treceability.taco_treceability.final_qrcode_details WHERE CustomerQRCode='" + packNO + "'");
        request.query("SELECT * FROM taco_treceability.taco_treceability.final_qrcode_details WHERE CustomerQRCode='" + packNO + "'", function (err, recordset) {
            if (err) console.log(err)
            var result = recordset.recordset;
            for (var i in result) {
                final_qrcode = result[i].final_qrcode;
            }
            // console.log('Updatinggggggggggggggggggggg::::::::::::',final_qrcode,body)
            // setTimeout(function () {
            // sql.connect(sqlConfig, function (err) {
            // request = new sql.Request();
            var selectQry = `SELECT * FROM taco_treceability.taco_treceability.air_leakage_testing WHERE final_qrcode='${final_qrcode}'`;
           // console.log("UPDATE taco_treceability.taco_treceability.air_leakage_testing SET body_reading='" + body + "',coolant_reading='" + coolant + "',status='" + line + "',checked_by='" + str + "',body_coolant_status='OK' WHERE final_qrcode='" + final_qrcode + "'");
            if (final_qrcode) {
                request.query(selectQry, function (err, recordset) {
                    if (err) console.log(err);
                    //var result=recordset.recordset;
                    //console.log('air_leakage_testing: body_reading:',result[0].body_reading);

//////check if Limber
var TMLPartNo = packNO.substring(0,14);
var serialNO=packNO.substring(packNO.length-6);
var packnametmp;

// if(TMLPartNo =='00545680600113'){
//     packnametmp = 'Limber Front';

// } else if(TMLPartNo =='00545680600114'){
//     packnametmp = 'Limber Rear';

// }
if(packname=='Limber Front'){
packnametmp = 'Limber Front';
}
else if(packname=='Limber Rear'){
packnametmp = 'Limber Rear';
}
else{
packnametmp = packname;
}

if(packnametmp == 'Limber Front'){


request.query(" insert into taco_treceability.taco_treceability.air_leakage_testing (body_reading, coolant_reading, status, checked_by, body_coolant_status, final_qrcode, battery_id, battery_pack_name) values('"+ body +"','" + coolant + "','" + line + "','" + str + "','OK','" + final_qrcode + "','Front','"+ packnametmp+"')", function (err, recordset) {
if (err) console.log(err);
//reset interval on frontend
// socket.emit("reset_interval_fe",'');
request.query("UPDATE taco_treceability.taco_treceability.station_status SET AirLeakage_status='OK' WHERE FinalQRCode='" + final_qrcode + "'", function (err, recordset) {
    if (err) console.log(err);
});
});
}
else if(packnametmp == 'Limber Rear'){

// request.query("UPDATE taco_treceability.taco_treceability.air_leakage_testing SET body_reading='" + body + "',coolant_reading='" + coolant + "',status='" + line + "',checked_by='" + str + "',body_coolant_status='OK' WHERE battery_id='Rear' and final_qrcode='" + final_qrcode + "'", function (err, recordset) {
request.query(" insert into  taco_treceability.taco_treceability.air_leakage_testing (body_reading, coolant_reading, status, checked_by, body_coolant_status, final_qrcode, battery_id, battery_pack_name) values('"+ body +"','" + coolant + "','" + line + "','" + str + "','OK','" + final_qrcode + "','Rear','"+ packnametmp+"')", function (err, recordset) {

if (err) console.log(err);
//reset interval on frontend
// socket.emit("reset_interval_fe",'');
request.query("UPDATE taco_treceability.taco_treceability.station_status SET AirLeakage_status='OK' WHERE FinalQRCode='" + final_qrcode + "'", function (err, recordset) {
    if (err) console.log(err);
});
});

}
else{

// request.query("UPDATE taco_treceability.taco_treceability.air_leakage_testing SET body_reading='" + body + "',coolant_reading='" + coolant + "',status='" + line + "',checked_by='" + str + "',body_coolant_status='OK' WHERE final_qrcode='" + final_qrcode + "'", function (err, recordset) {
request.query(" insert into  taco_treceability.taco_treceability.air_leakage_testing (body_reading, coolant_reading, status, checked_by, body_coolant_status, final_qrcode, battery_pack_name) values('"+ body +"','" + coolant + "','" + line + "','" + str + "','OK','" + final_qrcode + "','"+ packnametmp+"')", function (err, recordset) {

if (err) console.log(err);
//reset interval on frontend
// socket.emit("reset_interval_fe",'');
request.query("UPDATE taco_treceability.taco_treceability.station_status SET AirLeakage_status='OK' WHERE FinalQRCode='" + final_qrcode + "'", function (err, recordset) {
    if (err) console.log(err);
});
});
}


                   
                });

            }

            // });
            // }, 200);
        });
    });
}
else if(line == 'ALT 8'){
    // if(line == 'ALT 1' || line == 'ALT 2' || line == 'ALT 3' || line == 'ALT 4'){
        var pdi_status = 'NOT OK';
        if(c_status == 'OK' && b_status == 'OK'){
            pdi_status = 'OK';
}   else{

}
console.log('pdi_statusssssssssss',pdi_status,'c_status',c_status,'b_status',b_status)
 sql.connect(sqlConfig, function (err) {
        request = new sql.Request();
        // console.log("SELECT * FROM taco_treceability.taco_treceability.final_qrcode_details WHERE CustomerQRCode='" + packNO + "'");
        request.query("SELECT * FROM taco_treceability.taco_treceability.final_qrcode_details WHERE CustomerQRCode='" + packNO + "'", function (err, recordset) {
            if (err) console.log(err)
            var result = recordset.recordset;
            for (var i in result) {
                final_qrcode = result[i].final_qrcode;
            }
            // console.log('Updatinggggggggggggggggggggg::::::::::::',final_qrcode,body)
            // setTimeout(function () {
            // sql.connect(sqlConfig, function (err) {
            // request = new sql.Request();
            var selectQry = `SELECT * FROM taco_treceability.taco_treceability.air_leakage_testing WHERE final_qrcode='${final_qrcode}'`;
           // console.log("UPDATE taco_treceability.taco_treceability.air_leakage_testing SET body_reading='" + body + "',coolant_reading='" + coolant + "',status='" + line + "',checked_by='" + str + "',body_coolant_status='OK' WHERE final_qrcode='" + final_qrcode + "'");
            if (final_qrcode) {
                request.query(selectQry, function (err, recordset) {
                    if (err) console.log(err);
                    //var result=recordset.recordset;
                    //console.log('air_leakage_testing: body_reading:',result[0].body_reading);

//////check if Limber
var TMLPartNo = packNO.substring(0,14);
var serialNO=packNO.substring(packNO.length-6);
var packnametmp;

// if(TMLPartNo =='00545680600113'){
//     packnametmp = 'Limber Front';

// } else if(TMLPartNo =='00545680600114'){
//     packnametmp = 'Limber Rear';

// }
if(packname=='Limber Front'){
packnametmp = 'Limber Front';
}
else if(packname=='Limber Rear'){
packnametmp = 'Limber Rear';
}
else{
packnametmp = packname;
}

if(packnametmp == 'Limber Front'){


request.query(" insert into taco_treceability.taco_treceability.air_leakage_testing (body_reading, coolant_reading, status, checked_by, body_coolant_status, final_qrcode, battery_id, battery_pack_name) values('"+ body +"','" + coolant + "','PDI','" + str + "','OK','" + final_qrcode + "','Front','"+ packnametmp+"')", function (err, recordset) {
if (err) console.log(err);
request.query("UPDATE taco_treceability.taco_treceability.station_status SET AirLeakage_status='OK' WHERE FinalQRCode='" + final_qrcode + "'", function (err, recordset) {
    if (err) console.log(err);
});
});
}
else if(packnametmp == 'Limber Rear'){

// request.query("UPDATE taco_treceability.taco_treceability.air_leakage_testing SET body_reading='" + body + "',coolant_reading='" + coolant + "',status='" + line + "',checked_by='" + str + "',body_coolant_status='OK' WHERE battery_id='Rear' and final_qrcode='" + final_qrcode + "'", function (err, recordset) {
request.query(" insert into  taco_treceability.taco_treceability.air_leakage_testing (body_reading, coolant_reading, status, checked_by, body_coolant_status, final_qrcode, battery_id, battery_pack_name) values('"+ body +"','" + coolant + "','PDI','" + str + "','OK','" + final_qrcode + "','Rear','"+ packnametmp+"')", function (err, recordset) {

if (err) console.log(err);
request.query("UPDATE taco_treceability.taco_treceability.station_status SET AirLeakage_status='OK' WHERE FinalQRCode='" + final_qrcode + "'", function (err, recordset) {
    if (err) console.log(err);
});
});

}
else{

// request.query("UPDATE taco_treceability.taco_treceability.air_leakage_testing SET body_reading='" + body + "',coolant_reading='" + coolant + "',status='" + line + "',checked_by='" + str + "',body_coolant_status='OK' WHERE final_qrcode='" + final_qrcode + "'", function (err, recordset) {
request.query(" insert into  taco_treceability.taco_treceability.air_leakage_testing (body_reading, coolant_reading, status, checked_by, body_coolant_status, final_qrcode, battery_pack_name) values('"+ body +"','" + coolant + "','PDI','" + str + "','OK','" + final_qrcode + "','"+ packnametmp+"')", function (err, recordset) {

if (err) console.log(err);
request.query("UPDATE taco_treceability.taco_treceability.station_status SET AirLeakage_status='OK' WHERE FinalQRCode='" + final_qrcode + "'", function (err, recordset) {
    if (err) console.log(err);
});
});
}


                   
                });

            }

            // });
            // }, 200);
        });
    });
}
else{
    sql.connect(sqlConfig, function (err) {
        request = new sql.Request();
        // console.log("SELECT * FROM taco_treceability.taco_treceability.final_qrcode_details WHERE CustomerQRCode='" + packNO + "'");
        request.query("SELECT * FROM taco_treceability.taco_treceability.final_qrcode_details WHERE CustomerQRCode='" + packNO + "'", function (err, recordset) {
            if (err) console.log(err)
            var result = recordset.recordset;
            for (var i in result) {
                final_qrcode = result[i].final_qrcode;
            }
            // console.log('Updatinggggggggggggggggggggg::::::::::::',final_qrcode,body)
            // setTimeout(function () {
            // sql.connect(sqlConfig, function (err) {
            // request = new sql.Request();
            var selectQry = `SELECT * FROM taco_treceability.taco_treceability.air_leakage_testing WHERE final_qrcode='${final_qrcode}'`;
           // console.log("UPDATE taco_treceability.taco_treceability.air_leakage_testing SET body_reading='" + body + "',coolant_reading='" + coolant + "',status='" + line + "',checked_by='" + str + "',body_coolant_status='OK' WHERE final_qrcode='" + final_qrcode + "'");
            if (final_qrcode) {
                request.query(selectQry, function (err, recordset) {
                    if (err) console.log(err);
                    //var result=recordset.recordset;
                    //console.log('air_leakage_testing: body_reading:',result[0].body_reading);

//////check if Limber
var TMLPartNo = packNO.substring(0,14);
var serialNO=packNO.substring(packNO.length-6);
var packnametmp;

// if(TMLPartNo =='00545680600113'){
//     packnametmp = 'Limber Front';

// } else if(TMLPartNo =='00545680600114'){
//     packnametmp = 'Limber Rear';

// }
if(packname=='Limber Front'){
packnametmp = 'Limber Front';
}
else if(packname=='Limber Rear'){
packnametmp = 'Limber Rear';
}
else{
packnametmp = packname;
}

if(packnametmp == 'Limber Front'){

request.query("UPDATE taco_treceability.taco_treceability.air_leakage_testing SET body_reading='" + body + "',coolant_reading='" + coolant + "',status='" + line + "',checked_by='" + str + "',body_coolant_status='OK' WHERE battery_id!='Rear' and final_qrcode='" + final_qrcode + "' and status!='PDI'", function (err, recordset) {
if (err) console.log(err);
request.query("UPDATE taco_treceability.taco_treceability.station_status SET AirLeakage_status='OK' WHERE FinalQRCode='" + final_qrcode + "'", function (err, recordset) {
    if (err) console.log(err);
});
});
}
else if(packnametmp == 'Limber Rear'){

request.query("UPDATE taco_treceability.taco_treceability.air_leakage_testing SET body_reading='" + body + "',coolant_reading='" + coolant + "',status='" + line + "',checked_by='" + str + "',body_coolant_status='OK' WHERE battery_id='Rear' and final_qrcode='" + final_qrcode + "' and status!='PDI'", function (err, recordset) {
if (err) console.log(err);
request.query("UPDATE taco_treceability.taco_treceability.station_status SET AirLeakage_status='OK' WHERE FinalQRCode='" + final_qrcode + "'", function (err, recordset) {
    if (err) console.log(err);
});
});

}
else{

request.query("UPDATE taco_treceability.taco_treceability.air_leakage_testing SET body_reading='" + body + "',coolant_reading='" + coolant + "',status='" + line + "',checked_by='" + str + "',body_coolant_status='OK' WHERE final_qrcode='" + final_qrcode + "' and status!='PDI'", function (err, recordset) {
if (err) console.log(err);
request.query("UPDATE taco_treceability.taco_treceability.station_status SET AirLeakage_status='OK' WHERE FinalQRCode='" + final_qrcode + "'", function (err, recordset) {
    if (err) console.log(err);
});
});
}


                   
                });

            }

            // });
            // }, 200);
        });
    });
}


           
        }

        console.log('AirLeakage code imported');
    }
};