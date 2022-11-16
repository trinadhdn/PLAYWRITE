const { BasePage } = require('../../../pages/base_page.js');
const { TestData } = require('../../../utils/test_data.js');
const { TokenGenerators } = require('../../../utils/token_generators.js')
const { test, expect } = require('@playwright/test');
const { CustomerListPage } = require('../../../pages/customer_list_page.js');
const { CustomerDetailsPage } = require('../../../pages/customer_details_page.js');
const { KeyVaultMethods } = require("../../../utils/keyvault_methods.js");
const { LogFileRequestPage } = require('../../../pages/service_logFile_page.js');

var basePage, customerListPage,customerDetailsPage, servicePage;

const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih";
const iothubResourceUri = iothub + '.azure-devices.net/devices';
const iothubPolicyKey = process.env.iotHubPolicyKey;
const iothubPolicy = 'iothubowner';
var azureData, conn, customer, deviceId, token,sastoken, customerDetailsRecordSet,customerDetailsId,customerId  ;
test.describe("Get service credentials to WebUI", function () {

  test.beforeAll(async function () {

    // test data preparation     
    sastoken = await TokenGenerators.generateSasToken(iothubResourceUri, iothubPolicyKey, iothubPolicy, 30)

    conn = await TestData.sqlDBConnection();
    var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where customerDetailsId in (select customerDetailsId from [dbo].[CustomerDetails]) and activationStatus='True' for json auto")
    var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    deviceId = deviceRecord[0].iotDeviceId;
    customerDetailsId = deviceRecord[0].customerDetailsId;
    conn = await TestData.sqlDBConnection();
    customerDetailsRecordSet = await TestData.executeSqlQuery(conn, "select * from [dbo].[CustomerDetails] where customerdetailsId=" + customerDetailsId + " for json auto")
    var customerDetailsRecord = JSON.parse(customerDetailsRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    customerId = customerDetailsRecord[0].customerId;
    customer = customerDetailsRecord[0].customerName;
    console.log("customerId: " + customer)
    console.log("deviceId: " + deviceId)
    azureData = await KeyVaultMethods.getSecrets(
      deviceId + "-cmconsole-pin");
    token = await TokenGenerators.generateAuthToken("l1serviceuser");


  });

  test.beforeEach(async function ({ page }) {
    basePage = new BasePage(page);
    customerListPage = new CustomerListPage(page);
    customerDetailsPage = new CustomerDetailsPage(page);
    servicePage = new LogFileRequestPage(page);

  })
  //US#98366
  test("L1 user should be able to see the service credentials in web UI and verify that no banner is displayed on Settings tab @98366 @326390", async function ({ page }) {
    await basePage.navigateToUrl("l1serviceuser");
    // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
    await customerListPage.searchCustomer(customer);
    await customerListPage.selectCustomer(customer);
    var expectedCustomerName;
    if (customer.length <= 30) {
      expectedCustomerName = customer;
    } else {
      expectedCustomerName = customer.substring(0, 17) + "...";
    }
    expect(await customerDetailsPage.getCustomerButtonText()).toEqual(
      expectedCustomerName);

    await customerDetailsPage.selectCMInstance(deviceId);

    await customerDetailsPage.selectCMInstanceService(deviceId);

    var password = await servicePage.getServiceConsolePassword();

    //user valiadtes that no banner is displayed if device is online and connected
    await expect(await customerDetailsPage.isBannerPresent()).toEqual(false);

    expect(password).toBe(azureData.value);

  });
});
