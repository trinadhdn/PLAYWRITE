const { IotHubMethods } = require('../../../utils/iothub_methods.js');
const { TokenGenerators } = require('../../../utils/token_generators.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
var OR = require('../../../resources/OR.json');
let { ApiHelper } = require('../../../helpers/api-helpers.js')

const apimviewProxyConfigurationURL = process.env.apimBaseURL + OR.APIUrls.viewProxyConfigurationURL;
var sastoken, deviceId, token, conn;
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih";
const iothubResourceUri = iothub + '.azure-devices.net/devices';
const iothubPolicyKey = process.env.iotHubPolicyKey;
const iothubPolicy = 'iothubowner';
var testDevice = process.env.serviceUserHypervDeviceId 

test.describe("Get device tag", function () {
 
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


// US#432240 
test("L1 user should get the device tags with valid deviceID @432240", async function () {
       
  //getting device tag details using valid device id
  var getDeviceTagresponse = await ApiHelper.getDeviceTags(token, deviceId)
  var responseData = getDeviceTagresponse.data;
  expect(getDeviceTagresponse.status).toBe(200);
  
  var deviceTwinResponse = await IotHubMethods.getDeviceTwin(iothub, deviceId,sastoken);  
  var edgeModulesJson = deviceTwinResponse.data[0].tags.edgeModules; 
  expect(responseData.result).toEqual(edgeModulesJson);
  });

  // US#432240 
  test("L1 user should NOT get the device tags with invalid deviceID @432240", async function () {
       
    //getting device tag details using invalid device id
    var getDeviceTagresponse = await ApiHelper.getDeviceTags(token, "invalid")
    var responseData = getDeviceTagresponse.data;
    expect(getDeviceTagresponse.status).toBe(400);
    expect(responseData).toBe('Invalid device id.');

    //getting device tags using empty device id
    var response = await ApiHelper.getDeviceTags(token, " ")
    var responseData = response.data
    expect(response.status).toBe(400);
    expect(responseData).toBe('IotDevice Id should not be empty.');
  });
  });
