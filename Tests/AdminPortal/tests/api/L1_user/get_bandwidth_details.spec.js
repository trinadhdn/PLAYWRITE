const { TokenGenerators } = require('../../../utils/token_generators.js');
const { Comparisions } = require('../../../utils/comparisions.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
const { IotHubMethods } = require('../../../utils/iothub_methods.js');
const { ApiHelper } = require('../../../helpers/api-helpers.js')
var OR = require("../../../resources/OR.json");

const apimBandwidthdetailsRequest = process.env.apimBaseURL + OR.APIUrls.bandwidthDetails;
var token, deviceId, azureData, conn, sastoken, response;
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih"
const iothubResourceUri = iothub + '.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'
// var testDevice = `${process.env.subscription}-conm-${process.env.env}-testdevice`
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
  test("L1 user should be able to successfully request the Bandwidth Details with valid deviceID @270714", async function () {

    var managementModuleResponse = await IotHubMethods.getModuleTwin(iothub, deviceId, 'managementmodule', sastoken);
    var upstreamBandwidth = managementModuleResponse.data[0].properties.desired.current ? managementModuleResponse.data[0].properties.desired.current.bandwidth.uploadSpeedInMbps : managementModuleResponse.data[0].properties.desired.initial.bandwidth.uploadSpeedInMbps;
    var downstreamBandwidth = managementModuleResponse.data[0].properties.desired.current ? managementModuleResponse.data[0].properties.desired.current.bandwidth.downloadSpeedInMbps : managementModuleResponse.data[0].properties.desired.initial.bandwidth.downloadSpeedInMbps;

    response = await ApiHelper.getBandwidth(token, deviceId)
    expect(response.status).toBe(200);
    var responseData = response.data
    console.log(responseData.bandwidth.downloadSpeedInMbps)
    console.log(responseData.bandwidth.uploadSpeedInMbps)
    expect(responseData.success).toBe(true);
    expect(responseData.statusCode).toBe(200);
    expect(responseData.errorCode).toBe(0);
    expect(parseInt(responseData.bandwidth.downloadSpeedInMbps)).toBe(parseInt(downstreamBandwidth));
    expect(parseInt(responseData.bandwidth.uploadSpeedInMbps)).toBe(parseInt(upstreamBandwidth));
  });



  // US#270714
  test("L1 user should NOT get the Bandwidth Details with invalid or empty deviceID @270714", async function () {

    //getting Bandwidth details using invalid device id
    response = await ApiHelper.getBandwidth(token, "invalid")
    var responseData = response.data
    expect(response.status).toBe(400);
    expect(responseData).toBe('Invalid device id.');
    //getting Bandwidth details using empty device id
    response = await ApiHelper.getBandwidth(token, " ")
    var responseData = response.data
    expect(response.status).toBe(400);
    expect(responseData).toBe('IotDevice Id should not be empty.');
  });
});
