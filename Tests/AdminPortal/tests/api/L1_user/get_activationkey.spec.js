const { TestData } = require('../../../utils/test_data.js');
const { TokenGenerators } = require('../../../utils/token_generators.js')
const { test, expect } = require('@playwright/test');
const { IotHubMethods } = require('../../../utils/iothub_methods.js');
const { ApiHelper } = require('../../../helpers/api-helpers.js')
var OR = require("../../../resources/OR.json");
var activationKeyHypervDeviceId = process.env.activationKeyHypervDeviceId
const apimActivationKeyRequest = process.env.apimBaseURL + OR.APIUrls.activationKey;
var activationKey, conn,token, customerDetailsId, deviceId, customerId,customerDetailsRecordSet,customer,activationStatus;

test.describe("Viewing Activation Key in WebUI", function () {
  test.beforeAll(async function () {
    // // test data preparation
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
    activationStatus = deviceRecord[0].activationStatus;
    activationKey = deviceRecord[0].activationKey;
    console.log("customerId: " + customer)
    console.log("deviceId: " + deviceId)
    token = await TokenGenerators.generateAuthToken("l1serviceuser");
  });

  //US#177412
  test("API- L1 user should be able to get an already activated Activation Key in masked format @177412", async function ({ page }) {
    conn = await TestData.sqlDBConnection();
    await TestData.executeSqlQuery(conn, "Update [dbo].[Device] set activationStatus='True' where iotDeviceId='" + deviceId + "'")
    var response = await ApiHelper.getActivationKey(token, deviceId)
    var maskedActivationKey = "●●●●●-●●●●●-●●●●●-●●●●●-" + activationKey.substring(24);
    expect(response.status).toBe(200);
    var responseData = response.data;
    expect(responseData.activationStatus).toBe(true);
    expect(responseData.activationKey).toBe(maskedActivationKey);
  });

  //US#177412
  test("API- L1 user should be able to get the Activation Key which is not yet activated @177412", async function ({ page }) {
    conn = await TestData.sqlDBConnection();
    await TestData.executeSqlQuery(conn, "Update [dbo].[Device] set activationStatus='False' where iotDeviceId='" + deviceId + "'")
    var response = await ApiHelper.getActivationKey(token, deviceId)
    expect(response.status).toBe(200);
    var responseData = response.data;
    expect(responseData.activationStatus).toBe(false);
    expect(responseData.activationKey).toBe(activationKey);

  });

  //US#177412
  test("API- L1 user should NOT be able to get the Activation Key for invalid deviceID @177412", async function ({ page }) {
    conn = await TestData.sqlDBConnection();
    await TestData.executeSqlQuery(conn, "Update [dbo].[Device] set activationStatus='False' where iotDeviceId='" + deviceId + "'")
    //getting activation key with invalid device id
    var response = await ApiHelper.getActivationKey(token, "zidag-56432-87687")
    expect(response.status).toBe(400);
    var responseData = response.data;
    expect(responseData).toBe('Invalid device id.');

  });

  //US#177412
  test("API- L1 user should NOT be able to get the Activation Key for empty deviceID @177412", async function ({ page }) {
    conn = await TestData.sqlDBConnection();
    await TestData.executeSqlQuery(conn, "Update [dbo].[Device] set activationStatus='False' where iotDeviceId='" + deviceId + "'")
    //getting activation key with blank  device id
    var response = await ApiHelper.getActivationKey(token, " ")
    expect(response.status).toBe(400);
    expect(response.data).toBe("IotDevice Id should not be empty.");
  });


});