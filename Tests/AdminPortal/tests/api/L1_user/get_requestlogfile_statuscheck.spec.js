const { TokenGenerators } = require('../../../utils/token_generators.js');
const { Comparisions } = require('../../../utils/comparisions.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js'); 
var OR = require('../../../resources/OR.json');
const { AzureStorageMethods } = require('../../../utils/azure_storage_methods.js');

const apimLogFileRequest = process.env.apimBaseURL + OR.APIUrls.requestLogFile;

var token, deviceId, azureData, conn, requestPayload;
const apimuploadLogs = process.env.apimBaseURL + OR.APIUrls.uploadLogs;
const apimuploadLogsStatus = process.env.apimBaseURL + OR.APIUrls.uploadCmLogsStatus;
  var testDevice = process.env.serviceUserHypervDeviceId
  
test.describe("Log File Request", function () {
  test.beforeAll(async function () {
    // test data preparation
    conn = await TestData.sqlDBConnection();
    var devicesRecordSet = await TestData.executeSqlQuery(conn,"select top(1) * from [dbo].[Device] where iotdeviceId = '"+testDevice+"' for json auto")
    var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    deviceId = deviceRecord[0].iotDeviceId;
    console.log("deviceId: " + deviceId);
    var contextType = ["json", "text"];

    requestPayload = {
      modules: [
       
        {
          moduleName: "management",
          filter: {
            tail: Math.round(Math.random() * (1000000 - 1000) + 1000),
            until: Math.round(new Date().getTime() / 1000),
            loglevel: Math.round(Math.random() * (7 - 1) + 1),
          }
        }
      ],
      iotDeviceId: deviceId,
      contentType:
        contextType[Math.floor(Math.random() * contextType.length)],
    };
    token = await TokenGenerators.generateAuthToken("l1serviceuser");

    var uploadconfig = {
      method: "post",
      url: apimuploadLogs+"/"+deviceId+"/initiate-log-upload",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      data: requestPayload,
    };
    var response = await TokenGenerators.request(uploadconfig);
    expect(response.status).toBe(200);
    var status = response.data.payload.status;
      var correlationID = response.data.payload.correlationId;
      expect(
        status == "Completed" || status == "Running" || status == "NotStarted"
      ).toEqual(true);
      expect(correlationID).not.toBeNull;
      var statusconfig = {
        method: "get",
        url: apimuploadLogsStatus+"/"+deviceId+"/log-upload-status/"+correlationID,
        headers: { 
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
         }
      };
      var apistatusData = "nodata";
      while (!apistatusData.match(/Completed|Failed/g)) {
        var statusresponse = await TokenGenerators.request(statusconfig);
        expect(statusresponse.status).toBe(200);
        apistatusData = statusresponse.data.payload.status;
      }
    expect(apistatusData).toEqual("Completed");
    
    azureData = await AzureStorageMethods.getblobs(
      process.env.subscription+"conm"+process.env.env+process.env.locationshortcut+"cmlogssa",
       "cmlogs",
       process.env.logStorageAccountKey,
       "get",
       process.env.subscription+"-conm-"+process.env.env+"-"+process.env.locationshortcut+"-iothub-aih.azure-devices.net/"+deviceId+"/",
     );
  
  });

  // US#108997
  test("L1 user should be able to successfully request the log files from Azure blob with valid deviceID @108997", async function () {
    var requestLogFileconfig = {
      method: "get",
      url: apimLogFileRequest+"/"+deviceId+"/log-files",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      }
    };
    var response = await TokenGenerators.request(requestLogFileconfig);
    expect(response.status).toBe(200);
    var apidata = response.data;
    for (var i = 0; i < apidata.length; i++) {
      apidata[i].modifiedTime = Date.parse(apidata[i].modifiedTime);
    }

    var areEqual = new Array(),apiJSON,azureJSON;

    if (apidata.length == azureData.length) {
      for (var i = 0; i < apidata.length; i++) {
        apiJSON = apidata[i];
        azureJSON = azureData[i];
        areEqual.push(Comparisions.compareObjects(apiJSON, azureJSON));
      }
    } else {
      areEqual.push(false);
    }
    expect(areEqual).not.toContain(false);
  });


   // US#108997
   test("L1 user should be NOT be able to successfully request the log files from Azure blob with Empty deviceID @108997", async function () {
    var requestLogFileconfig = {
      method: "get",
      url: apimLogFileRequest+"/"+" "+"/log-files",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      }
    };
    var response = await TokenGenerators.request(requestLogFileconfig);
     expect(response.status).toBe(400);
     expect(response.data).toBe("IotDevice Id should not be empty.");

 
  });
  test("L1 user should be NOT be able to successfully request the log files from Azure blob with invalid deviceID @108997", async function () {
    deviceId = "123";
    var requestLogFileconfig = {
      method: "get",
      url: apimLogFileRequest+"/"+deviceId+"/log-files",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      }
    };
    var response = await TokenGenerators.request(requestLogFileconfig);
     expect(response.status).toBe(400);
     expect(response.data).toBe("Invalid device id.");

 
  });
});
