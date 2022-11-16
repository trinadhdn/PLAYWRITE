const { TokenGenerators } = require('../../../utils/token_generators.js');
const { Comparisions } = require('../../../utils/comparisions.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js'); 
var OR = require("../../../resources/OR.json");
const { KeyVaultMethods } = require("../../../utils/keyvault_methods.js");


const apimserviceCredentialsRequest = process.env.apimBaseURL + OR.APIUrls.serviceCredentials;

var token, deviceId, azureData, conn;

test.describe("Get service credentials", function () {
  test.beforeAll(async function () {
    // test data preparation
    conn = await TestData.sqlDBConnection();
    var devicesRecordSet = await TestData.executeSqlQuery(conn,"select top(1) * from [dbo].[Device] where customerDetailsId in (select customerDetailsId from [dbo].[CustomerDetails]) and activationStatus='True' for json auto")
    var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    deviceId = deviceRecord[0].iotDeviceId;
    console.log("deviceId: " + deviceId);
    token = await TokenGenerators.generateAuthToken("l1serviceuser");   
    azureData = await KeyVaultMethods.getSecrets(deviceId+"-cmconsole-pin");
  });

  // US#98366
  test("L1 user should be able to successfully request the service credentials with valid deviceID @98366", async function () {
    var requestserviceCredentialsconfig = {
      method: "get",
      url: apimserviceCredentialsRequest+"/"+deviceId+"/service-pin",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      params: {
        iotDeviceId: deviceId,
      },
    };
    var response = await TokenGenerators.request(requestserviceCredentialsconfig);
    expect(response.status).toBe(200);
    expect(response.data.cmConsolePin).toBe(azureData.value);
  });



  // US#98366
  test("L1 user should NOT get the service credentials with invalid deviceID @98366", async function () {
    var requestserviceCredentialsconfig = {
      method: "get",
      url: apimserviceCredentialsRequest+"/"+" "+"/service-pin",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      }
    };
    var response = await TokenGenerators.request(requestserviceCredentialsconfig);
    expect(response.status).toBe(400);
  });
});
