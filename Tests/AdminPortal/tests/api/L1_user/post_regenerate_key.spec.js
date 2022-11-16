const { TokenGenerators } = require('../../../utils/token_generators.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
const { ApiHelper } = require('../../../helpers/api-helpers.js')
var OR = require('../../../resources/OR.json');
const apimregenerateKeyURL = process.env.apimBaseURL + OR.APIUrls.regenerateKeyUrl;
const apimregenerationStatusUrl = process.env.apimBaseURL + OR.APIUrls.regenerationStatusUrl;

var token, activationKey,customer, conn,customerDetailsRecordSet, customerDetailsId, deviceId, customerId, newResponse;
var activationKeyHypervDeviceId = process.env.activationKeyHypervDeviceId

test.describe("Regenerate the activation key API", function () {
  test.beforeAll(async function () {
    conn = await TestData.sqlDBConnection();
    var devicesRecordSet = await TestData.executeSqlQuery(conn, "select * from [dbo].[Device] where iotdeviceId ='" + activationKeyHypervDeviceId + "' for json auto")
    var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    deviceId = deviceRecord[0].iotDeviceId;
    customerDetailsId = deviceRecord[0].customerDetailsId;
    conn = await TestData.sqlDBConnection();
    customerDetailsRecordSet = await TestData.executeSqlQuery(conn, "select * from [dbo].[CustomerDetails] where customerdetailsId=" + customerDetailsId + " for json auto")
    var customerDetailsRecord = JSON.parse(customerDetailsRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    customerId = customerDetailsRecord[0].customerId;
    customer = customerDetailsRecord[0].customerName;
    var activationStatus = deviceRecord[0].activationStatus;
    activationKey = deviceRecord[0].activationKey;
    console.log("customerId: " + customer)
    console.log("deviceId: " + deviceId)
    token = await TokenGenerators.generateAuthToken("l1serviceuser");
  })

  // US#177413-- Can not use same device twice
  test.skip("API,L1 user should be able to regenerate the activation key @177413", async function () {
    conn = await TestData.sqlDBConnection();
    await TestData.executeSqlQuery(conn, "Update [dbo].[Device] set activationStatus='True' where iotDeviceId='" + deviceId + "'")
    var config = {
      method: 'post',
      url: apimregenerateKeyURL + deviceId + "/regenerateKey",
      headers: { "Authorization": "Bearer " + token },
    };

    var response = await TokenGenerators.request(config);
    var apiData = response.data
    expect(response.status).toBe(200);
    var InstanceValue = apiData.Value;


    var config2 = {
      method: 'get',
      url: apimregenerationStatusUrl + "/" + InstanceValue,
      headers: { "Authorization": "Bearer " + token },
    };

    var response = await TokenGenerators.request(config2);
    var apiData = response.data

    while (apiData.status != "Completed") {
      response = await TokenGenerators.request(config2);
      apiData = response.data;

    }
    expect(response.status).toBe(200);
    expect(apiData.status).toBe("Completed");
    var newActivationKey = apiData.activationKey;
    expect(newActivationKey).not.toEqual(activationKey);
    conn = await TestData.sqlDBConnection();
    var devicesRecordSet = await TestData.executeSqlQuery(conn, "select activationKey from [dbo].[Device] where iotDeviceId='" + deviceId + "'  for json auto")
    var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    var activationKeyFromDB = deviceRecord[0].activationKey;
    expect(newActivationKey).toEqual(activationKeyFromDB);

  });

  //US#344323
  test("API- L1 user should NOT be able to regenerate the activation key using invalid token or blank device id  @344323", async function ({ page }) {

    //Regenerating Activation Key using invalid token                 
    newResponse = await ApiHelper.regenerateKey("invalidToken", deviceId)
    expect(newResponse.status).toBe(401);
    //Regenerating Activation Key using blank token                 
    newResponse = await ApiHelper.regenerateKey(token, " ")
    expect(newResponse.status).toBe(403);
  });

  test.afterAll(async function () {
    conn = await TestData.sqlDBConnection();
    await TestData.executeSqlQuery(conn, "Update [dbo].[Device] set activationStatus='True' where iotDeviceId='" + deviceId + "'")
  })
});