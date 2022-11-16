var OR = require("../../../resources/OR.json");
const { TokenGenerators } = require('../../../utils/token_generators.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
const { ApiHelper } = require('../../../helpers/api-helpers.js')

const apimBandwidthdetailsRequest = process.env.apimBaseURL + OR.APIUrls.bandwidthDetails;
var token, deviceId, azureData, conn, sastoken;
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih"
const iothubResourceUri = iothub + '.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'
var testDevice = process.env.serviceUserHypervDeviceId

test.describe("Get Bandwidth Details", function () {
  test.beforeAll(async function () {
    // test data preparation
    conn = await TestData.sqlDBConnection();
    var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where iotdeviceId = '" + testDevice + "' for json auto")
    var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    deviceId = deviceRecord[0].iotDeviceId;
    console.log("deviceId: " + deviceId);
    token = await TokenGenerators.generateAuthToken("l1serviceuser");
    sastoken = await TokenGenerators.generateSasToken(iothubResourceUri, iothubPolicyKey, iothubPolicy, 30)
  });

  // US#270714
  test("L1 user should be able to successfully update the Bandwidth Details with valid Download speed @270714", async function () {
    var dspeed = ["1", "35", "99", "555", "998", "999", "5000",];
    var uspeed = "999"
    for (var k = 0; k < dspeed.length; k++) {

      var response = await ApiHelper.setBandwidthDownloadAndUploadSpeedInMbps(token, deviceId, dspeed[k], uspeed)
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.statusCode).toBe(200);
      expect(response.data.errorCode).toBe(0);
      expect(response.data.bandwidth).toBe(null);
    }
  });

  // US#270714
  test("L1 user should be able to successfully update the Bandwidth Details with valid upload speed @270714", async function () {
    var dspeed = "15"
    var uspeed = ["1", "45", "176", "488", "998", "657", "967", "5000",];
    for (var k = 0; k < uspeed.length; k++) {

      var response = await ApiHelper.setBandwidthDownloadAndUploadSpeedInMbps(token, deviceId, dspeed, uspeed[k])
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.statusCode).toBe(200);
      expect(response.data.errorCode).toBe(0);
      expect(response.data.bandwidth).toBe(null);
    }
  });

  // US#270714
  test("L1 user should get error response when update the Bandwidth Details with whole number >999 and <=0 Download Speed @270714", async function () {
    var dspeed = ["0", "1000", "2000", "3000", "4999", "5001", "-99", "-999"];
    var uspeed = "999"
    for (var k = 0; k < dspeed.length; k++) {
      var response = await ApiHelper.setBandwidthDownloadAndUploadSpeedInMbps(token, deviceId, dspeed[k], uspeed)
      expect(response.status).toEqual(400);
      expect(response.data).toEqual("Download Speed should be in range of 1 to 999 or equal to 5000.");

    }
  });

  // US#270714
  test("L1 user should get error response when update the Bandwidth Details with invalid Download Speed @270714", async function () {
    var dspeed = ["0.9", "dfdf", "45.7", "999.8", "gfd6dhg", "fgf*5jhf",];
    var uspeed = "999"
    for (var k = 0; k < dspeed.length; k++) {
      var response = await ApiHelper.setBandwidthDownloadAndUploadSpeedInMbps(token, deviceId, dspeed[k], uspeed)
      expect(response.status).toEqual(400);
      expect(response.data).toBeNull;
    }
  });

  // US#270714
  test("L1 user should get error response when update the Bandwidth Details with whole number >999 and <=0 Upload Speed @270714", async function () {
    var dspeed = "999"
    var uspeed = ["0", "1000", "2000", "3000", "4999", "5001", "-99", "-456", "-999",];
    for (var k = 0; k < uspeed.length; k++) {

      var response = await ApiHelper.setBandwidthDownloadAndUploadSpeedInMbps(token, deviceId, dspeed, uspeed[k])
      expect(response.status).toEqual(400);
      expect(response.data).toEqual("Upload Speed should be in range of 1 to 999 or equal to 5000.");
    }
  });

  // US#270714
  test("L1 user should get error response when update the Bandwidth Details with Invalid Upload Speed @270714", async function () {
    var dspeed = "11"
    var uspeed = ["0.9", "45.6", "2wde3", "48.9", "34.76$", "999.9", "df67d#",];
    for (var k = 0; k < uspeed.length; k++) {
      var response = await ApiHelper.setBandwidthDownloadAndUploadSpeedInMbps(token, deviceId, dspeed, uspeed[k])
      expect(response.status).toEqual(400);
      expect(response.data).toBeNull;
    }
  });

  // US#270714
  test("L1 user should get error response when update the Bandwidth Details with Null Download Speed @270714", async function () {
    var dspeed = [""];
    var uspeed = "999"
    for (var k = 0; k < dspeed.length; k++) {
      var response = await ApiHelper.setBandwidthDownloadAndUploadSpeedInMbps(token, deviceId, dspeed[k], uspeed)
      expect(response.status).toEqual(400);
      expect(response.data).toEqual("'Download Speed In Mbps' must not be empty.");
    }
  });
  // US#270714
  test("L1 user should get error response when update the Bandwidth Details with Null Upload Speed @270714", async function () {
    var dspeed = "11"
    var uspeed = [""];
    for (var k = 0; k < uspeed.length; k++) {
      var response = await ApiHelper.setBandwidthDownloadAndUploadSpeedInMbps(token, deviceId, dspeed, uspeed[k])
      expect(response.status).toEqual(400);
      expect(response.data).toEqual("'Upload Speed In Mbps' must not be empty.");
    }
  });
});