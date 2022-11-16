var OR = require("../../../resources/OR.json");
const { TokenGenerators } = require('../../../utils/token_generators.js');
const { Comparisions } = require('../../../utils/comparisions.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');

const apimuploadLogs = process.env.apimBaseURL + OR.APIUrls.uploadLogs;
const apimuploadLogsStatus = process.env.apimBaseURL + OR.APIUrls.uploadCmLogsStatus;
var testDevice = process.env.serviceUserHypervDeviceId
var token, apimoduleName, deviceId, conn;
test.describe("Upload Logs API", function () {
  test.beforeAll(async function () {
    // test data preparation
    conn = await TestData.sqlDBConnection();
    var devicesRecordSet = await TestData.executeSqlQuery(conn,"select top(1) * from [dbo].[Device] where iotdeviceId = '"+testDevice+"' for json auto")
    var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    deviceId = deviceRecord[0].iotDeviceId;
    console.log("iotDeviceId: " + deviceId);
    token = await TokenGenerators.generateAuthToken("l1serviceuser");  });

  // US#74626,432252
  test("L1 user should be able to create new logs for the given filters and check the status @74626 @432252", async function () {
    var moduleNamesForTest = [ 
      "management",
      "zvimodule",
      "zssmodule",
      "zrsmodule",
      "dicomforwardermodule",
      "streamingmodule",    
      "allModules",
      "Nofilters",
      "nologForCriteria",
    ];
    for (var k = 0; k < moduleNamesForTest.length; k++) {
      apimoduleName = moduleNamesForTest[k];
      console.log(apimoduleName)
      var requestPayload;
      var contextType = ["json", "text"];
      if (apimoduleName == "allModules") {
        requestPayload = {
          modules: [
            {
              moduleName: "zvimodule",
              filter: {
                since: Math.round(
                  new Date().setDate(new Date().getDate()-1) / 1000
                ),
                tail: Math.round(Math.random() * (10000 - 1000) + 1000),
                until: Math.round(new Date().getTime() / 1000),
              },
            },
            {
              moduleName: "management",
              filter: {
                since: Math.round(
                  new Date().setDate(new Date().getDate()-1) / 1000
                ),
                tail: Math.round(Math.random() * (10000 - 1000) + 1000),
                until: Math.round(new Date().getTime() / 1000),
                loglevel: Math.round(Math.random() * (7 - 1) + 1),
              },
            },
            {
              moduleName: "dicomforwardermodule",
              filter: {
                since: Math.round(
                  new Date().setDate(new Date().getDate()-1) / 1000
                ),
                tail: Math.round(Math.random() * (10000 - 1000) + 1000),
                until: Math.round(new Date().getTime() / 1000),
              },
            },
            {
              moduleName: "zssmodule",
              filter: {
                since: Math.round(
                  new Date().setDate(new Date().getDate()-1) / 1000
                ),
                tail: Math.round(Math.random() * (10000 - 1000) + 1000),
                until: Math.round(new Date().getTime() / 1000),
              },
            },
            {
              moduleName: "zrsmodule",
              filter: {
                since: Math.round(
                  new Date().setDate(new Date().getDate()-1) / 1000
                ),
                tail: Math.round(Math.random() * (10000 - 1000) + 1000),
                until: Math.round(new Date().getTime() / 1000),
              },
            },
            {
              moduleName: "streamingmodule",
              filter: {
                since: Math.round(
                  new Date().setDate(new Date().getDate()-1) / 1000
                ),
                tail: Math.round(Math.random() * (10000 - 1000) + 1000),
                until: Math.round(new Date().getTime() / 1000),
              },
            },
            {
              moduleName: "edgeAgent",
              filter: {
                since: Math.round(
                  new Date().setDate(new Date().getDate()-1) / 1000
                ),
                tail: Math.round(Math.random() * (10000 - 1000) + 1000),
                until: Math.round(new Date().getTime() / 1000),
              },
            },
            {
              moduleName: "edgeHub",
              filter: {
                since: Math.round(
                  new Date().setDate(new Date().getDate()-1) / 1000
                ),
                tail: Math.round(Math.random() * (10000 - 1000) + 1000),
                until: Math.round(new Date().getTime() / 1000),
              },
            },
          ],
          contentType:
            contextType[Math.floor(Math.random() * contextType.length)],
        };
      } else if (apimoduleName == "Nofilters") {
        requestPayload = {
          modules: [
            {
              moduleName: "zssmodule",
              filter: {},
            },
          ],
          contentType:
            contextType[Math.floor(Math.random() * contextType.length)],
        };
      } else if (apimoduleName == "nologForCriteria") {
        requestPayload = {
          modules: [
            {
              moduleName: "management",
              filter: {
                loglevel: 10,
              },
            },
          ],
          contentType:
            contextType[Math.floor(Math.random() * contextType.length)],
        };
      } else
        requestPayload = {
          modules: [
            {
              moduleName: apimoduleName,
              filter: {
                since: Math.round(
                  new Date().setDate(new Date().getDate() - 1) / 1000
                ),
                tail: Math.round(Math.random() * (10000 - 1000) + 1000),
                until: Math.round(new Date().getTime() / 1000),
              }
            }
          ],
          contentType:
            contextType[Math.floor(Math.random() * contextType.length)],
        };

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
    }
    expect(apistatusData).toEqual("Completed");
  });

  // US#74626
  test("For L1 user verify uploadLog Api throws error for invalid payload @74626",async function () {
    var moduleNamesForTest = ["IncorrectPayload"];
    for (var k = 0; k < moduleNamesForTest.length; k++) {
      apimoduleName = moduleNamesForTest[k];
      var requestPayload;
      var contextType = ["json", "text"];
      if (apimoduleName == "IncorrectPayload") {
        requestPayload = {
          modules: {},
        };
      } else
        requestPayload = {
          modules: [
            {
              moduleName: apimoduleName,
              filter: {
                since: Math.round(
                  new Date().setFullYear(new Date().getFullYear() - 1) / 1000
                ),
                tail: Math.round(Math.random() * (1000000 - 1000) + 1000),
                until: Math.round(new Date().getTime() / 1000),
              },
            },
          ],
          contentType:
            contextType[Math.floor(Math.random() * contextType.length)],
        };

      var uploadconfig = {
        method: "post",
        url: apimuploadLogs+"/"+deviceId+"/initiate-log-upload",
        headers: {
          Authorization: "Bearer ",
          "Content-Type": "application/json",
        },
        data: requestPayload,
      };
      var response = await TokenGenerators.request(uploadconfig);
      expect(response.status).not.toEqual(200);
    }
  });
});
