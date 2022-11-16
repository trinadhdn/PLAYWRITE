const { BasePage } = require('../../../pages/base_page.js');
const { LogFileRequestPage } = require('../../../pages/service_logFile_page.js');
const { TestData } = require('../../../utils/test_data.js');
const { TokenGenerators } = require('../../../utils/token_generators.js')
const { test, expect } = require('@playwright/test');
const { IotHubMethods } = require('../../../utils/iothub_methods.js');
const { CustomerListPage } = require('../../../pages/customer_list_page.js');
const { CustomerDetailsPage } = require('../../../pages/customer_details_page.js');
const { CustomerDetailsStatusPage } = require("../../../pages/customer_details_status_page.js");
const { Comparisions } = require('../../../utils/comparisions.js');
var OR = require('../../../resources/OR.json');

var basePage, customerListPage, customerDetailsPage, servicePage, deviceTwinResponse, comparisions, customer;
var activationKey, conn, customerDetailsId,activationStatus,customerDetailsRecordSet, deviceId, customerId, sastoken, customerDetailsStatusPage, token;

var testDevice = process.env.serviceUserHypervDeviceId;
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih"
const iothubResourceUri = iothub + '.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'
const apimUpdateHistoryRL = process.env.apimBaseURL + OR.APIUrls.deviceGenericUrl;

test.describe("Restarting Container in WebUI", function () {
  test.beforeAll(async function () {
    // // test data preparation
    conn = await TestData.sqlDBConnection();
    var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where iotdeviceId = '" + testDevice + "' for json auto")
    //   var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where customerDetailsId in (select customerDetailsId from [dbo].[CustomerDetails]) and activationStatus='True' for json auto")
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
    console.log("customerId: " + customerId)
    console.log("deviceId: " + deviceId)
    token = await TokenGenerators.generateAuthToken("l1serviceuser");
    sastoken = await TokenGenerators.generateSasToken(iothubResourceUri, iothubPolicyKey, iothubPolicy, 30)

  });

  test.beforeEach(async function ({ page }) {
    basePage = new BasePage(page);
    customerListPage = new CustomerListPage(page);
    customerDetailsPage = new CustomerDetailsPage(page);
    servicePage = new LogFileRequestPage(page);
    customerDetailsStatusPage = new CustomerDetailsStatusPage(page);
    comparisions = new Comparisions(page);

  })

  // US#308182
  test("In WebUI, L1 user should restart the custom modules when we pass the Module name @308181", async function ({ page }) {
    await basePage.navigateToUrl("l1serviceuser");
    await customerListPage.searchCustomer(customerId);
    await customerListPage.selectCustomer(customerId);
    await customerDetailsPage.selectCMInstance(deviceId);
    await customerDetailsPage.selectCMInstanceStatus(deviceId);

    var iothubResponse = await IotHubMethods.getModuleTwin(iothub, deviceId, '$edgeAgent', sastoken);
    var deviceStatus = iothubResponse.data[0].properties.reported.lastDesiredStatus.code == 200 ? 'Connected' : 'Not connected'
    expect(await customerDetailsStatusPage.getDeviceId()).toEqual(deviceId)
    var deviceStatusUi = await customerDetailsStatusPage.getCMDeviceStatus()
    expect(deviceStatusUi).toEqual(deviceStatus);

    //user valiadtes that no banner is displayed if device is online and connected
    expect(await customerDetailsPage.isBannerPresent()).toEqual(false);

    var desiredCustomModulesJson = iothubResponse.data[0].properties.desired.modules
    var customModulesJson = iothubResponse.data[0].properties.reported.modules
    var customModules = [...new Set([...Object.keys(desiredCustomModulesJson), ...Object.keys(customModulesJson)])]

    for (let i = 0; i < customModules.length; i++) {

      await customerDetailsStatusPage.clickRestartmodule(customModules[i]);

      var todaylocal = Math.floor((new Date()).getTime() / 1000)
      var secondsOffset = (new Date().getTimezoneOffset()) * 60
      var finalcurrentutc = (todaylocal + secondsOffset)
      await page.waitForTimeout(30000)

      var iothubResponse = await IotHubMethods.getModuleTwin(iothub, deviceId, '$edgeAgent', sastoken);
      var lastRestartTimeUtcnew = await customerDetailsStatusPage.getlastRestartTimeUtc(customModules[i], iothubResponse)
      var lastRestartTimeUtcnewconv = Math.floor((new Date(lastRestartTimeUtcnew)).getTime() / 1000)

      let diff = Math.abs(finalcurrentutc - lastRestartTimeUtcnewconv)
      console.log(customModules[i] +"---> diff: " +diff)
      expect(diff <= 120).toBe(true);
    }

  });


  //US#308182
  test("In WebUI, L1 user should be able to restart the EdgeHub container @308182", async function ({ page }) {
    await basePage.navigateToUrl("l1serviceuser");
    await customerListPage.searchCustomer(customerId);
    await customerListPage.selectCustomer(customerId);

    await customerDetailsPage.selectCMInstance(deviceId);
    await customerDetailsPage.selectCMInstanceStatus(deviceId);

    var iothubResponse = await IotHubMethods.getModuleTwin(iothub, deviceId, '$edgeAgent', sastoken);
    var deviceStatus = iothubResponse.data[0].properties.reported.lastDesiredStatus.code == 200 ? 'Connected' : 'Not connected'
    expect(await customerDetailsStatusPage.getDeviceId()).toEqual(deviceId)
    var deviceStatusUi = await customerDetailsStatusPage.getCMDeviceStatus()
    expect(deviceStatusUi).toEqual(deviceStatus);

    await customerDetailsStatusPage.clickRestartmodule('edgeHub');
    var today = new Date().toUTCString();
    var todaylocal = Math.floor((new Date()).getTime() / 1000)
    var secondsOffset = (new Date().getTimezoneOffset()) * 60
    var finalcurrentutc = (todaylocal + secondsOffset)
    await page.waitForTimeout(20000);

    var iothubResponse = await IotHubMethods.getModuleTwin(iothub, deviceId, '$edgeAgent', sastoken);
    var lastRestartTimeUtcnew = await customerDetailsStatusPage.getlastRestartTimeUtc('edgeHub', iothubResponse)
    var lastRestartTimeUtcnewconv = Math.floor((new Date(lastRestartTimeUtcnew)).getTime() / 1000)

    let diff = Math.abs(finalcurrentutc - lastRestartTimeUtcnewconv)
    expect(diff <= 90).toBe(true);
  });

  //US#308182
  test("In WebUI, L1 user should NOT be able to restart the EdgeAgent container @308182", async function ({ page }) {
    await basePage.navigateToUrl("l1serviceuser");
    await customerListPage.searchCustomer(customerId);
    await customerListPage.selectCustomer(customerId);

    await customerDetailsPage.selectCMInstance(deviceId);
    await customerDetailsPage.selectCMInstanceStatus(deviceId);
    var iothubResponse = await IotHubMethods.getModuleTwin(iothub, deviceId, '$edgeAgent', sastoken);
    var deviceStatus = iothubResponse.data[0].properties.reported.lastDesiredStatus.code == 200 ? 'Connected' : 'Not connected'
    await expect(await customerDetailsStatusPage.getDeviceId()).toEqual(deviceId)
    var deviceStatusUi = await customerDetailsStatusPage.getCMDeviceStatus()
    await expect(deviceStatusUi).toEqual(deviceStatus);
    expect(await customerDetailsStatusPage.isRefreshbuttondisabled('edgeAgent')).toBe(true);

  });


});