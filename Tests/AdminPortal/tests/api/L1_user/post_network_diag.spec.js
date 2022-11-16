const { TokenGenerators } = require('../../../utils/token_generators.js');
const { Comparisions } = require('../../../utils/comparisions.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
const { IotHubMethods } = require('../../../utils/iothub_methods.js');
const { ApiHelper } = require('../../../helpers/api-helpers.js')
let ErrorMSG = require('../../../resources/ErrorMSG.json');
var OR = require("../../../resources/OR.json");

const apimNetworkDiagRequest = process.env.apimBaseURL + OR.APIUrls.networkdiagnosis;
var token, deviceId, azureData, conn, sastoken, methodName, payload;
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih"
const iothubResourceUri = iothub + '.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'
var testDevice = process.env.serviceUserHypervDeviceId;
var InputValip = "8.8.8.8"
var InputValurl = "www.google.com"

test.describe("Get Network Diagnosis Details", function () {
  test.beforeAll(async function () {
    // test data preparation
    conn = await TestData.sqlDBConnection();
    var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where iotdeviceId = '" + testDevice + "' for json auto")
    var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    deviceId = deviceRecord[0].iotDeviceId;
    console.log("deviceId: " + deviceId);
    token = await TokenGenerators.generateAuthToken("l1serviceuser");
    sastoken = await TokenGenerators.generateSasToken(iothubResourceUri, iothubPolicyKey, iothubPolicy, 30)
    methodName = 'NetworkDiagnosis'
  });

  // US#308176
  test("L1 user should be able to successfully request the Network Diagnosis Details with valid details ping method @308176", async function () {
    var valAddress = ["8.8.8.8", "127.0.0.1", "www.google.com", "1.1.1.1",];
    for (var k = 0; k < valAddress.length; k++) {
      payload = { "diagnosisType": "Ping", "destinationAddress": valAddress[k] }
      var directMethodResponse = await IotHubMethods.invokeMethod(iothub, deviceId, 'managementmodule', methodName, payload, sastoken);
      var directMethodResult = directMethodResponse.data;
      var response = await ApiHelper.postNetworkDiagnosisResp(token, deviceId, "Ping", valAddress[k]);
      expect(response.status).toBe(directMethodResult.status);
      expect(response.data.success).toBe(true);
      expect(response.data.errorCode).toBe(0);
      expect(response.data.statusCode).toBe(200);
      expect(response.data.result.includes("PING " + valAddress[k] + " ")).toBe(true);
    }

  });


  // US#308176
  test("L1 user should NOT get the Network Diagnosis Details with invalid deviceID @308176", async function () {
    var response = await ApiHelper.postNetworkDiagnosisResp(token, "invaliddevice", "Ping", InputValip);
    var responseData = response.data
    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.errorCode).toBe(1);
    expect(responseData.statusCode).toBe(400);
    expect(responseData.result).toBeNull();
    expect(responseData.errorMessage).toBe(ErrorMSG.ErrorMsg_1);
  });

  // US#308176
  test("L1 user should NOT get the Network Diagnosis Details with empty deviceID @308176", async function () {

    var response = await ApiHelper.postNetworkDiagnosisResp(token, " ", "TraceRoute", InputValip);
    var responseData = response.data
    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.errorCode).toBe(4);
    expect(responseData.statusCode).toBe(400);
    expect(responseData.result).toBeNull();
    expect(responseData.errorMessage).toBe(ErrorMSG.ErrorMsg_4);
  });

  // US#308176
  test("L1 user should NOT get the Network Diagnosis Details with empty diagnosisType @308176", async function () {

    var response = await ApiHelper.postNetworkDiagnosisResp(token, deviceId, "", InputValip);
    var responseData = response.data
    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.errorCode).toBe(3009);
    expect(responseData.statusCode).toBe(400);
    expect(responseData.result).toBeNull();
    expect(responseData.errorMessage).toBe(ErrorMSG.NullOrEmptyDiagnosisType);
  });

  // US#308176
  test("L1 user should NOT get the Network Diagnosis Details with invalid diagnosisType @308176", async function () {

    var response = await ApiHelper.postNetworkDiagnosisResp(token, deviceId, "sdjgjf", InputValip);
    var responseData = response.data
    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.errorCode).toBe(3007);
    expect(responseData.statusCode).toBe(400);
    expect(responseData.result).toBeNull();
    expect(responseData.errorMessage).toBe(ErrorMSG.InvalidDiagnosisType);
  });

  // US#308176
  test("L1 user should NOT get the Network Diagnosis Details with empty address @308176", async function () {

    var response = await ApiHelper.postNetworkDiagnosisResp(token, deviceId, "Ping", "");
    var responseData = response.data
    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.errorCode).toBe(3010);
    expect(responseData.statusCode).toBe(400);
    expect(responseData.result).toBeNull();
    expect(responseData.errorMessage).toBe(ErrorMSG.NullOrEmptyDestinationAddress);
  });

  // US#308176
  test("L1 user should NOT get the Network Diagnosis Details with invalid address @308176", async function () {

    var invalAddress = ["127..0.0.1", "www.2222.com.", "11.1.1.11..", "1234567", "dgdfgdffvfdv",];
    var diagtype = ["Ping", "TraceRoute",]
    for (var i = 0; i < diagtype.length; i++) {
      for (var k = 0; k < invalAddress.length; k++) {
        var response = await ApiHelper.postNetworkDiagnosisResp(token, deviceId, diagtype[i], invalAddress[k]);
        var responseData = response.data
        expect(response.status).toBe(400);
        expect(responseData.success).toBe(false);
        expect(responseData.errorCode).toBe(3008);
        expect(responseData.statusCode).toBe(400);
        expect(responseData.result).toBeNull();
        expect(responseData.errorMessage).toBe(ErrorMSG.InvalidDestinationAddress);

      }
    }
  });

  // US#308176
  test("L1 user should NOT get the Network Diagnosis Details with empty details deviceID @308176", async function () {

    var response = await ApiHelper.postNetworkDiagnosisResp(token, " ", "", "");
    var responseData = response.data
    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.errorCode).toBe(3009);
    expect(responseData.statusCode).toBe(400);
    expect(responseData.result).toBeNull();
    expect(responseData.errorMessage).toBe(ErrorMSG.NullOrEmptyDiagnosisType);
  });

  // US#308176
  test("L1 user should be able to successfully request the Traceroute Network Diagnosis Details with valid details trace method @308176", async function () {

    var valAddress = ["8.8.8.8", "127.0.0.1", "www.google.com", "1.1.1.1",];
    for (var k = 0; k < valAddress.length; k++) {
      payload = { "diagnosisType": "TraceRoute", "destinationAddress": valAddress[k] }      
      var directMethodResponse = await IotHubMethods.invokeMethod(iothub, deviceId, 'managementmodule', methodName, payload, sastoken);
      var directMethodResult = directMethodResponse.data
      var response = await ApiHelper.postNetworkDiagnosisResp(token, deviceId, "TraceRoute", valAddress[k]);
      expect(response.status).toBe(directMethodResult.status);
      var responseData = response.data
      expect(responseData.success).toBe(true);
      expect(responseData.errorCode).toBe(0);
      expect(responseData.statusCode).toBe(200);
      expect(response.data.result.includes("traceroute to " + valAddress[k] + " ")).toBe(true);
    }

  });

  // US#308176
  test("L1 user should NOT get the Network Diagnosis Details with empty payload @308176", async function () {
    var networkdiagnosisconfig = {
      method: "post",
      url: apimNetworkDiagRequest + "/" + deviceId + "/network-diagnosis",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      }
    };

    var response = await TokenGenerators.request(networkdiagnosisconfig);
    var responseData = response.data
    expect(response.status).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.errorCode).toBe(5);
    expect(responseData.statusCode).toBe(400);
    expect(responseData.errorMessage).toBe(ErrorMSG.RequestnullEmpty);


  });

  // US#308176
  test("L1 user should NOT get the Network Diagnosis Details with invalid token @308176", async function () {

    var response = await ApiHelper.postNetworkDiagnosisResp("invalidtoken", deviceId, "Ping", InputValip);
    var responseData = response.data
    expect(response.status).toBe(401);
    expect(responseData.statusCode).toBe(401);
    expect(responseData.message).toBe("Unauthorized");
  });


});
