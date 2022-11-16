const { TokenGenerators } = require('../../../utils/token_generators.js');
const { default: test, expect } = require('@playwright/test');
const { ApiHelper } = require('../../../helpers/api-helpers.js')
const { TestData } = require('../../../utils/test_data.js');
const { CmProvisionPage } = require('../../../pages/cm_provision_page.js');
var OR = require("../../../resources/OR.json");
let ErrorMSG = require('../../../resources/ErrorMSG.json');

var token, postresponsedata, deviceActKey, postresponse, l1prToken, conn, activationKey, orderId, sapCustomerId;
var deviceProvisioning = process.env.isDeviceProvisionEnabled;

test.describe("Only PR flag cmprovuser1 device provisioning api", function () {
  test.beforeEach(async function () {
    // test data preparation
    token = await TokenGenerators.generateAuthToken("cmprovuser1");
    l1prToken = await TokenGenerators.generateAuthToken("cmprovuserl1");

  });

  // US#355072,397782
  test("API - cmprovuser1 user should be able to successfully provision a device with valid details @355072 @397782", async function () {
    if (deviceProvisioning === "true") {
      var sapIdValue  =  await CmProvisionPage.createSapId(9)
      postresponse = await ApiHelper.postDeviceEnrollment(token, "20201247", "5985", "Zeiss", "DF,ZV,ST",sapIdValue)
      expect(postresponse.status).toBe(200);
      deviceActKey = postresponse.data.result.deviceActivationKey;
      var deviceId = postresponse.data.result.deviceId;
      expect(deviceActKey).not.toBeNull();
      expect(deviceId).not.toBeNull();

      conn = await TestData.sqlDBConnection();
      let devicesRecordSet = await TestData.executeSqlQuery(conn, "select * from [dbo].[Device] where iotdeviceId = '" + deviceId + "' for json auto")
      let deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
      activationKey = deviceRecord[0].activationKey;
      orderId = deviceRecord[0].orderId;
      sapCustomerId = deviceRecord[0].sapCustomerId;
      expect(activationKey).toBe(deviceActKey)
      expect(orderId).toBe("20201247")
      expect(sapCustomerId).toBe(sapIdValue)
    }
    else {
      expect(true).toEqual(true);
      console.log("Bypassed device provisioning test as value for isDeviceProvisioningTestsEnabled is set to false")
    }
  });

  // US#355072
  test("API - cmprovuser1 user error codes validation for invalid details for device provisioning @355072", async function () {
    var sapIdValue  =  await CmProvisionPage.createSapId(9)
    // for invalid orderID
    postresponse = await ApiHelper.postDeviceEnrollment(token, "order with space with maximum length for order ID to test the boundary value scenario for device enrollment api", "5985", "Zeiss", "DF,ZV", sapIdValue)
    postresponsedata = postresponse.data
    expect(postresponse.status).toBe(400);
    expect(postresponsedata.errorMessage).toBe(ErrorMSG.OrderIDInvalidErrorMsg)
    expect(postresponsedata.success).toBe(false);
    expect(postresponsedata.statusCode).toBe(400);
    expect(postresponsedata.result).toBe(null);
    expect(postresponsedata.errorCode).toBe(0);

    // for invalid customerID
    postresponse = await ApiHelper.postDeviceEnrollment(token, "20201247", "598500000000000000000000000000000000000000000000000000000000000000000000", "Zeiss", "DF,ZV", sapIdValue)
    postresponsedata = postresponse.data
    expect(postresponse.status).toBe(400);
    expect(postresponsedata.errorMessage).toBe(ErrorMSG.CustomerIDInvalidErrorMsg)
    expect(postresponsedata.success).toBe(false);
    expect(postresponsedata.statusCode).toBe(400);
    expect(postresponsedata.result).toBe(null);
    expect(postresponsedata.errorCode).toBe(0);

    // for invalid token
    postresponse = await ApiHelper.postDeviceEnrollment("token123", "20201247", "5985", "Zeiss", "DF,ZV", sapIdValue)
    expect(postresponse.status).toBe(401);

    // for sap Id >10 characters   
    var sapIdValue11  =  await CmProvisionPage.createSapId(30)     
    postresponse = await ApiHelper.postDeviceEnrollment(token, "20201247", "5985", "Zeiss", "DF,ZV", sapIdValue11)
    postresponsedata = postresponse.data
    expect(postresponse.status).toBe(400);
    expect(postresponsedata.errorMessage).toBe(ErrorMSG.SapErrorMsg)
    expect(postresponsedata.success).toBe(false);
    expect(postresponsedata.statusCode).toBe(400);
    expect(postresponsedata.result).toBe(null);
    expect(postresponsedata.errorCode).toBe(0);

    // for unsupported containers         
    postresponse = await ApiHelper.postDeviceEnrollment(token, "20201247", "5985", "Zeiss", "DF,ZV,ZR,ZS,ST,AB", sapIdValue)
    postresponsedata = postresponse.data
    expect(postresponse.status).toBe(400);
    expect(postresponsedata.errorMessage).toBe(ErrorMSG.EdgeModuleErrorMsg)
    expect(postresponsedata.success).toBe(false);
    expect(postresponsedata.statusCode).toBe(400);
    expect(postresponsedata.result).toBe(null);
    expect(postresponsedata.errorCode).toBe(0);

    // for customerId null value
    postresponse = await ApiHelper.postDeviceEnrollment(token, "20201247", "", "Zeiss", "DF,ZV", sapIdValue)
    postresponsedata = postresponse.data
    expect(postresponse.status).toBe(400);
    expect(postresponsedata.errorMessage).toBe(ErrorMSG.CustIdErrorMsg)
    expect(postresponsedata.success).toBe(false);
    expect(postresponsedata.statusCode).toBe(400);
    expect(postresponsedata.result).toBe(null);
    expect(postresponsedata.errorCode).toBe(0);

    // for orderId null value
    postresponse = await ApiHelper.postDeviceEnrollment(token, "", "6100", "Zeiss", "DF,ZV", sapIdValue)
    postresponsedata = postresponse.data
    expect(postresponse.status).toBe(400);
    expect(postresponsedata.errorMessage).toBe(ErrorMSG.OrderIdErrorMsg)
    expect(postresponsedata.success).toBe(false);
    expect(postresponsedata.statusCode).toBe(400);
    expect(postresponsedata.result).toBe(null);
    expect(postresponsedata.errorCode).toBe(0);

  });

  // US#355072
  test("API - Regular user should not be able to successfully provision a device with valid details @355072", async function () {
    var sapIdValue  =  await CmProvisionPage.createSapId(9)
    token = await TokenGenerators.generateAuthToken("regularuser");
    postresponse = await ApiHelper.postDeviceEnrollment(token, "20201247", "5985", "Zeiss", "DF,ZV", sapIdValue)
    expect(postresponse.status).toBe(403);
  });

  // US#355072
  test("API - L1 user should not be able to successfully provision a device with valid details @355072", async function () {
    var sapIdValue  =  await CmProvisionPage.createSapId(9)
    token = await TokenGenerators.generateAuthToken("l1serviceuser");
    postresponse = await ApiHelper.postDeviceEnrollment(token, "20201247", "5985", "Zeiss", "DF,ZV", sapIdValue)
    if (process.env.username == process.env.cmprovuserl1) {
      expect(postresponse.status).toBe(200);
    } else {
      expect(postresponse.status).toBe(403);
    }
  });

  // US#355072
  test("API - cmprovuserl1 user should be able to successfully provision a device with valid details @355072", async function () {
    if (deviceProvisioning === "true") {
      var sapIdValue  =  await CmProvisionPage.createSapId(9)
      postresponse = await ApiHelper.postDeviceEnrollment(l1prToken, "20201247", "5985", "Zeiss", "DF,ZV", sapIdValue)
      expect(postresponse.status).toBe(200);
      deviceActKey = postresponse.data.result.deviceActivationKey;
      var deviceId = postresponse.data.result.deviceId;
      expect(deviceActKey).not.toBeNull();
      expect(deviceId).not.toBeNull();
    }
    else {
      expect(true).toEqual(true);
      console.log("Bypassed device provisioning test as value for isDeviceProvisioningTestsEnabled is set to false")
    }
  });

  // US#355072
  test("API - cmprovuserl1 user error codes validation for invalid details for device provisioning @355072", async function () {
    var sapIdValue  =  await CmProvisionPage.createSapId(9)
    // for invalid orderID
    
    postresponse = await ApiHelper.postDeviceEnrollment(l1prToken, "order with space with maximum length for order ID to test the boundary value scenario for device enrollment api", "5985", "Zeiss", "DF,ZV", sapIdValue)
    postresponsedata = postresponse.data
    expect(postresponse.status).toBe(400);
    expect(postresponsedata.errorMessage).toBe(ErrorMSG.OrderIDInvalidErrorMsg)
    expect(postresponsedata.success).toBe(false);
    expect(postresponsedata.statusCode).toBe(400);
    expect(postresponsedata.result).toBe(null);
    expect(postresponsedata.errorCode).toBe(0);

    // for invalid customerID
    postresponse = await ApiHelper.postDeviceEnrollment(l1prToken, "20201247", "598500000000000000000000000000000000000000000000000000000000000000000000", "Zeiss", "DF,ZV", sapIdValue)
    postresponsedata = postresponse.data
    expect(postresponse.status).toBe(400);
    expect(postresponsedata.errorMessage).toBe(ErrorMSG.CustomerIDInvalidErrorMsg)
    expect(postresponsedata.success).toBe(false);
    expect(postresponsedata.statusCode).toBe(400);
    expect(postresponsedata.result).toBe(null);
    expect(postresponsedata.errorCode).toBe(0);

    // for sap Id >10 characters 
    var sapIdValue11  =  await CmProvisionPage.createSapId(30)       
    postresponse = await ApiHelper.postDeviceEnrollment(l1prToken, "20201247", "5985", "Zeiss", "DF,ZV", sapIdValue11)
    postresponsedata = postresponse.data
    expect(postresponse.status).toBe(400);
    expect(postresponsedata.errorMessage).toBe(ErrorMSG.SapErrorMsg)
    expect(postresponsedata.success).toBe(false);
    expect(postresponsedata.statusCode).toBe(400);
    expect(postresponsedata.result).toBe(null);
    expect(postresponsedata.errorCode).toBe(0);

    // for unsupported containers         
    postresponse = await ApiHelper.postDeviceEnrollment(l1prToken, "20201247", "5985", "Zeiss", "DF,ZV,ZR,ZS,ST,AB", sapIdValue)
    postresponsedata = postresponse.data
    expect(postresponse.status).toBe(400);
    expect(postresponsedata.errorMessage).toBe(ErrorMSG.EdgeModuleErrorMsg)
    expect(postresponsedata.success).toBe(false);
    expect(postresponsedata.statusCode).toBe(400);
    expect(postresponsedata.result).toBe(null);
    expect(postresponsedata.errorCode).toBe(0);

    // for customerId null value
    postresponse = await ApiHelper.postDeviceEnrollment(l1prToken, "20201247", "", "Zeiss", "DF,ZV", sapIdValue)
    postresponsedata = postresponse.data
    expect(postresponse.status).toBe(400);
    expect(postresponsedata.errorMessage).toBe(ErrorMSG.CustIdErrorMsg)
    expect(postresponsedata.success).toBe(false);
    expect(postresponsedata.statusCode).toBe(400);
    expect(postresponsedata.result).toBe(null);
    expect(postresponsedata.errorCode).toBe(0);

    // for orderId null value
    postresponse = await ApiHelper.postDeviceEnrollment(l1prToken, "", "6100", "Zeiss", "DF,ZV", sapIdValue)
    postresponsedata = postresponse.data
    expect(postresponse.status).toBe(400);
    expect(postresponsedata.errorMessage).toBe(ErrorMSG.OrderIdErrorMsg)
    expect(postresponsedata.success).toBe(false);
    expect(postresponsedata.statusCode).toBe(400);
    expect(postresponsedata.result).toBe(null);
    expect(postresponsedata.errorCode).toBe(0);

  });


});