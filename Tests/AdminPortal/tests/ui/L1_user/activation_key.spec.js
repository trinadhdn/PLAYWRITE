
const { BasePage } = require('../../../pages/base_page.js');
const { LogFileRequestPage } = require('../../../pages/service_logFile_page.js');
const { TestData } = require('../../../utils/test_data.js');
const { TokenGenerators } = require('../../../utils/token_generators.js')
const { test, expect } = require('@playwright/test');
const { IotHubMethods } = require('../../../utils/iothub_methods.js');
const { CustomerListPage } = require('../../../pages/customer_list_page.js');
const { CustomerDetailsPage } = require('../../../pages/customer_details_page.js');
const { CustomerDetailsStatusPage } = require("../../../pages/customer_details_status_page.js");
var activationKeyHypervDeviceId = process.env.activationKeyHypervDeviceId
var basePage, token,customerListPage, customerDetailsPage, servicePage, customerDetailsStatusPage;
var activationKey, conn,customer,activationStatus, customerDetailsId,customerDetailsRecordSet, deviceId, customerId, getCopiedActivationKeyText;

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

  test.beforeEach(async function ({ page }) {
    basePage = new BasePage(page);
    customerListPage = new CustomerListPage(page);
    customerDetailsPage = new CustomerDetailsPage(page);
    servicePage = new LogFileRequestPage(page);
    customerDetailsStatusPage = new CustomerDetailsStatusPage(page);
  })
  //US#177412
  test("In WebUI, L1 user should be able to view an already activated Activation Key in masked format @177412", async function ({ page }) {
    conn = await TestData.sqlDBConnection();
    await TestData.executeSqlQuery(conn, "Update [dbo].[Device] set activationStatus='True' where iotDeviceId='" + deviceId + "'")
    await basePage.navigateToUrl("l1serviceuser");
    // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
    await customerListPage.searchCustomer(customerId);
    await customerListPage.selectCustomer(customerId);
    await customerDetailsPage.selectCMInstance(deviceId);
    await customerDetailsPage.selectCMInstanceStatus(deviceId);
    var maskedActivationKey = "●●●●●-●●●●●-●●●●●-●●●●●-" + activationKey.substring(24);
    await expect(await customerDetailsStatusPage.getActivationKey()).toEqual(maskedActivationKey);

    await expect(await customerDetailsStatusPage.activationKeyCopyButton()).not.toBeVisible();
  });

  //US#177412
  test("In WebUI, L1 user should be able to view Activation Key which is not yet activated @177412", async function ({ page }) {
    conn = await TestData.sqlDBConnection();
    await TestData.executeSqlQuery(conn, "Update [dbo].[Device] set activationStatus='False' where iotDeviceId='" + deviceId + "'")
    await basePage.navigateToUrl("l1serviceuser");
    await customerListPage.searchCustomer(customerId);
    await customerListPage.selectCustomer(customerId);

    await customerDetailsPage.selectCMInstance(deviceId);
    await customerDetailsPage.selectCMInstanceStatus(deviceId);
    expect(await customerDetailsStatusPage.getActivationKey()).toEqual(activationKey);
    expect((await customerDetailsStatusPage.getActivationKeyStatusIndicatorMessage()).includes(await customerDetailsStatusPage.getExpectedActivationKeyUsageInfoMessage())).toEqual(true);
    expect(await (await customerDetailsStatusPage.activationKeyCopyButton()).isVisible()).toEqual(true);
    await customerDetailsStatusPage.clickActivationKeyCopyButton();
    var actualCopiedText = await customerDetailsStatusPage.getCopiedActivationKeyText();
    expect(actualCopiedText).toEqual(activationKey);

  });

  //US#177413,313913
  test("In WebUI, L1 User should be able to generate new Activation Key @177413 @313913", async function ({ page }) {
    conn = await TestData.sqlDBConnection();
    await TestData.executeSqlQuery(conn, "Update [dbo].[Device] set activationStatus='True' where iotDeviceId='" + deviceId + "'")
    await basePage.navigateToUrl("l1serviceuser");
    // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
    await customerListPage.searchCustomer(customerId);
    await customerListPage.selectCustomer(customerId);

    await customerDetailsPage.selectCMInstance(deviceId);
    await customerDetailsPage.selectCMInstanceStatus(deviceId);
    await customerDetailsPage.clickOnGenerateNewKey();
    await customerDetailsPage.fillDeviceNameAndRequestActivationKey(deviceId);
    // await customerDetailsPage.clickCancelOnGenerateActivationKey();
    expect(await (await customerDetailsStatusPage.activationKeyCopyButton()).isVisible()).toEqual(true);
    await customerDetailsStatusPage.getActivationKey()
    expect((await customerDetailsStatusPage.getActivationKeyStatusIndicatorMessage()).includes(await customerDetailsStatusPage.getExpectedActivationKeyUsageInfoMessage())).toEqual(true);
    await customerDetailsStatusPage.clickActivationKeyCopyButton();

    // Added below steps to validate new feature
    await expect(await customerDetailsStatusPage.getCmModuleStatusSection()).not.toBeVisible();
    await expect(await customerDetailsStatusPage.getContainerStatusSection()).not.toBeVisible();
    await expect(await customerDetailsStatusPage.geDeviceHistoryTable()).not.toBeVisible();
    await expect(await customerDetailsPage.getCMInstanceSettings(deviceId)).not.toBeVisible();
    await expect(await customerDetailsPage.getCMInstanceDevices(deviceId)).not.toBeVisible();
    await expect(await customerDetailsPage.getCMInstanceService(deviceId)).not.toBeVisible();

    var actualCopiedText = await customerDetailsStatusPage.getCopiedActivationKeyText();
    expect(actualCopiedText).not.toEqual(activationKey);
    conn = await TestData.sqlDBConnection();
    var devicesRecordSet = await TestData.executeSqlQuery(conn, "select activationKey from [dbo].[Device] where iotDeviceId='" + deviceId + "'  for json auto")
    var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    var activationKeyFromDB = deviceRecord[0].activationKey;
    expect(actualCopiedText).toEqual(activationKeyFromDB);


  });

  //US#177413,313913
  test("In WebUI, L1 User should not be able to navigate to other tabs directly when Activation Key is not in use @177413 @313913", async function ({ page }) {
    conn = await TestData.sqlDBConnection();
    await TestData.executeSqlQuery(conn, "Update [dbo].[Device] set activationStatus='True' where iotDeviceId='" + deviceId + "'")
    await basePage.navigateToUrl("l1serviceuser");
    // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
    await customerListPage.searchCustomer(customerId);
    await customerListPage.selectCustomer(customerId);

    await customerDetailsPage.selectCMInstance(deviceId);
    await customerDetailsPage.selectCMInstanceStatus(deviceId);
    await customerDetailsPage.clickOnGenerateNewKey();
    await customerDetailsPage.fillDeviceNameAndRequestActivationKey(deviceId);
    // await customerDetailsPage.clickCancelOnGenerateActivationKey();
    expect(await (await customerDetailsStatusPage.activationKeyCopyButton()).isVisible()).toEqual(true);
    await customerDetailsStatusPage.getActivationKey()
    expect((await customerDetailsStatusPage.getActivationKeyStatusIndicatorMessage()).includes(await customerDetailsStatusPage.getExpectedActivationKeyUsageInfoMessage())).toEqual(true);
    await customerDetailsStatusPage.clickActivationKeyCopyButton();

    // Direct navigate to settings
    var settingsUrl = process.env.adminAppBaseURL + "customer/" + customerId + "/connectivitymodule/" + deviceId + "/settings";
    await basePage.navigateToDirectUrl(settingsUrl);
    // expect(await basePage.getCurrentUrl()).toEqual(settingsUrl);
    expect(await basePage.getCurrentUrl()).toEqual(process.env.adminAppBaseURL + "customer/" + customerId + "/connectivitymodule/" + deviceId + "/default");



    // Direct navigate to devices
    var devicesUrl = process.env.adminAppBaseURL + "customer/" + customerId + "/connectivitymodule/" + deviceId + "/devices";
    await basePage.navigateToDirectUrl(devicesUrl);
    // expect(await basePage.getCurrentUrl()).toEqual(devicesUrl);
    expect(await basePage.getCurrentUrl()).toEqual(process.env.adminAppBaseURL + "customer/" + customerId + "/connectivitymodule/" + deviceId + "/default");


    // Direct navigate to service
    var serviceUrl = process.env.adminAppBaseURL + "customer/" + customerId + "/connectivitymodule/" + deviceId + "/service";
    await basePage.navigateToDirectUrl(serviceUrl);
    // expect(await basePage.getCurrentUrl()).toEqual(serviceUrl);
    expect(await basePage.getCurrentUrl()).toEqual(process.env.adminAppBaseURL + "customer/" + customerId + "/connectivitymodule/" + deviceId + "/default");

  });

  test.afterAll(async function () {
    conn = await TestData.sqlDBConnection();
    await TestData.executeSqlQuery(conn, "Update [dbo].[Device] set activationStatus='True' where iotDeviceId='" + deviceId + "'")
  })
});
