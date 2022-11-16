const { TokenGenerators } = require('../../../utils/token_generators.js');
const { Comparisions } = require('../../../utils/comparisions.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
var OR = require('../../../resources/OR.json');
const { IotHubMethods } = require('../../../utils/iothub_methods.js');
const { ApiHelper } = require('../../../helpers/api-helpers.js');
var testDevice = process.env.serviceUserHypervDeviceId

const apimContainerRestartURL = process.env.apimBaseURL + OR.APIUrls.containerRestartURL;
var conn,token,deviceId,sastoken;
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih"
const iothubResourceUri = iothub + '.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'

test.describe("Container Restart API", function () {
  test.beforeAll(async function () {
    conn = await TestData.sqlDBConnection();
    var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where iotdeviceId ='" + testDevice + "' and activationStatus='True' for json auto")
    var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    deviceId = deviceRecord[0].iotDeviceId;
    token = await TokenGenerators.generateAuthToken("l1serviceuser");
    sastoken = await TokenGenerators.generateSasToken(iothubResourceUri, iothubPolicyKey, iothubPolicy, 30)
  })

  // US#308181
  test("L1User should restart the custom modules when we pass the valid device ID, Module ID @308181", async function () {

    var iothubResponse = await IotHubMethods.getModuleTwin(iothub, deviceId, '$edgeAgent', sastoken);
    var desiredCustomModulesJson = iothubResponse.data[0].properties.desired.modules
    var customModulesJson = iothubResponse.data[0].properties.reported.modules
    var customModules = [...new Set([...Object.keys(desiredCustomModulesJson), ...Object.keys(customModulesJson)])]
    for (let i = 0; i < customModules.length; i++) {
      var restartResponse = await ApiHelper.postContainerRestart(token, deviceId, customModules[i])
      expect(restartResponse.status).toBe(200);
      expect(restartResponse.data.success).toBe(true);
    }


  });

  // US#308181
  test("L1User should restart the EdgeHub container when we pass the valid device ID, Module ID @308181", async function () {

    var restartResponse = await ApiHelper.postContainerRestart(token, deviceId, "edgeHub")
    expect(restartResponse.status).toBe(200);
    expect(restartResponse.data.success).toBe(true);

  });

  // US#308181
  test("L1 User should not be able to restart the EdgeAgent container when we pass the valid device ID, Module ID @308181", async function () {

    var restartResponse = await ApiHelper.postContainerRestart(token, deviceId, "edgeAgent")
    expect(restartResponse.status).toBe(400);
    expect(restartResponse.data).toBe("You can not restart edgeAgent module.");
  });

  // US#308181
  test("L1User Restart API should return bad request error when we pass the valid device ID, invalid Module ID @308181", async function () {
    var restartResponse = await ApiHelper.postContainerRestart(token, deviceId, "abcmodule")
    expect(restartResponse.status).toBe(400);
    expect(restartResponse.data).toBe("Invalid modulename.");
  });


  // US#308181
  test("L1User Restart API should return bad request error when we pass the invalid device ID, valid Module ID @308181", async function () {
    var restartResponse = await ApiHelper.postContainerRestart(token, "12345", "edgeHub")
    expect(restartResponse.status).toBe(400);
    expect(restartResponse.data).toBe("Invalid device id.");
  });


  // US#308181
  test("L1User Restart API should return bad request error when we pass the invalid device ID, invalid Module ID @308181", async function () {
    var restartResponse = await ApiHelper.postContainerRestart(token, "12345", "abcmodule")
    expect(restartResponse.status).toBe(400);
    expect(restartResponse.data).toBe("Invalid device id.");

  });

  // US#308181
  test("L1 User Restart API should return bad request error when we pass the null device ID  @308181", async function () {

    var restartResponse = await ApiHelper.postContainerRestart(token, " ", "edgeHub")
    expect(restartResponse.status).toBe(400);
    expect(restartResponse.data).toBe("IotDevice Id should not be empty.");

  });



  // US#308181
  test("L1 User Restart API should return bad request error when we pass the null Modules ID  @308181", async function () {

    var restartResponse = await ApiHelper.postContainerRestart(token, deviceId, " ")
    expect(restartResponse.status).toBe(400);
    expect(restartResponse.data).toBe("ModuleName should not be empty.");

  });

});