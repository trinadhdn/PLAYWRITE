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

const { AzureStorageMethods } = require("../../../utils/azure_storage_methods.js");
var date = require('date-and-time');
var testDevice = process.env.serviceUserHypervDeviceId;
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih"
const iothubResourceUri = iothub + '.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'

var logFileRequestPage, comparisions, azureStorageMethods, customerListPage, basePage,servicePage, customerDetailsPage, customerDetailsStatusPage;
var azureData, conn, customer, deviceId,customerDetailsId,customerDetailsRecordSet,customerId, sastoken;
test.describe("Displaying log files in WebUI", function () {
  test.beforeAll(async function () {
    conn = await TestData.sqlDBConnection();
    var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where iotdeviceId = '" + testDevice + "' for json auto")
    var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    deviceId = deviceRecord[0].iotDeviceId;
    customerDetailsId = deviceRecord[0].customerDetailsId;
    conn = await TestData.sqlDBConnection();
    customerDetailsRecordSet = await TestData.executeSqlQuery(conn, "select * from [dbo].[CustomerDetails] where customerdetailsId=" + customerDetailsId + " for json auto")
    var customerDetailsRecord = JSON.parse(customerDetailsRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    customerId = customerDetailsRecord[0].customerId;
    customer = customerDetailsRecord[0].customerName;
    console.log("customerId: " + customer);
    console.log("deviceId: " + deviceId);
    sastoken = await TokenGenerators.generateSasToken(iothubResourceUri, iothubPolicyKey, iothubPolicy, 30)

  });
  test.beforeEach(async function ({ page }) {
    basePage = new BasePage(page);
    customerListPage = new CustomerListPage(page);
    customerDetailsPage = new CustomerDetailsPage(page);
    servicePage = new LogFileRequestPage(page);
    customerDetailsStatusPage = new CustomerDetailsStatusPage(page);
    logFileRequestPage = new LogFileRequestPage(page);
    comparisions = new Comparisions(page);
    azureStorageMethods = new AzureStorageMethods(page);


  })
  //US#98378,US#108997
  test("User should be able to get the log files in web UI @98378 @108997", async function ({ page }) {
    test.slow();
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
      expectedCustomerName
    );
    await customerDetailsPage.selectCMInstance(deviceId);
    await customerDetailsPage.selectCMInstanceService(deviceId);
    await logFileRequestPage.clickonRefreshButton();
    var activeserviceTable = await logFileRequestPage.getLogFileTable();
    var actualServicesDetails = await logFileRequestPage.getrowDatafromLogFileTables(activeserviceTable);

    azureData = await AzureStorageMethods.getblobs(
      process.env.subscription + "conm" + process.env.env + process.env.locationshortcut + "cmlogssa",
      "cmlogs",
      process.env.logStorageAccountKey,
      "get",
      process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih.azure-devices.net/" + deviceId + "/",
    );

    var areEqual = new Array(),
      apiJSON,
      azureJSON;

    if (actualServicesDetails.length == azureData.length) {
      for (var i = 0; i < actualServicesDetails.length; i++) {
        apiJSON = actualServicesDetails[i];
        azureJSON = azureData[i];
        areEqual.push(Comparisions.compareObjects(apiJSON, azureJSON));
      }
    } else {
      areEqual.push(false);
    }
    expect(areEqual).not.toContain(false);
  });

  //US#98378 US#231138 us#397781 US#432252
  test("User should be able create the log file request for muliple Modules in web UI @98378 @231138 @397781 @432252", async function ({ page }) {
    test.slow();
    await basePage.navigateToUrl("l1serviceuser");
    await customerListPage.searchCustomer(customer);
    await customerListPage.selectCustomer(customer);

    await customerDetailsPage.selectCMInstance(deviceId);
    await customerDetailsPage.selectCMInstanceService(deviceId);

    var iothubResponse = await IotHubMethods.getModuleTwin(iothub, deviceId, '$edgeAgent', sastoken);
    var systemModulesJson = iothubResponse.data[0].properties.reported.systemModules
    var customModulesJson = iothubResponse.data[0].properties.reported.modules
    var totalModules = [...new Set([...Object.keys(customModulesJson), ...Object.keys(systemModulesJson)])]
    console.log(totalModules)
    var iMetric = totalModules.indexOf("IoTEdgeMetricsCollector")
    console.log(totalModules.splice(iMetric, 1));
    console.log(totalModules)
    var modulecount = totalModules.length

    await logFileRequestPage.clickonRefreshButton();
    await logFileRequestPage.waitTillLogFilePageLoads();
    var activeserviceTableBefore = await logFileRequestPage.getLogFileTable();
    var actualServicesDetailsBefore = await logFileRequestPage.getrowDatafromLogFileTables(activeserviceTableBefore);
    await logFileRequestPage.clickonRequestLogButton();

    await logFileRequestPage.clickonCreateLogfileOrCancelBtn("Create log file");
    await logFileRequestPage.selectModuleName(['All']);
    await logFileRequestPage.selectModuleName(['All']);
    expect(await (await logFileRequestPage.moduleNameValidationMessage()).isVisible()).toEqual(true);

    var allContainersListed = await logFileRequestPage.getModuleNames();
    expect(await logFileRequestPage.compareModulesListed(allContainersListed)).toBe(true);

    // await logFileRequestPage.selectModuleName(['zvimodule', 'management', 'zssmodule', 'Streaming']);
    await logFileRequestPage.selectModuleName(totalModules);
    await logFileRequestPage.selectFileFormat('text');
    var now = new Date();
    var previousDate = date.addMonths(now, -1)
    await logFileRequestPage.selectEntriesfrom(date.format(previousDate, 'MM/DD/YYYY'));
    await logFileRequestPage.selectEntriesuntil();
    await logFileRequestPage.selectLogLevel('Information');
    await logFileRequestPage.enterNumberOfEntries("1000");
    await logFileRequestPage.clickonCreateLogfileOrCancelBtn("Create log file");
    await logFileRequestPage.waitTillLogFilePageLoads(15000);

    await logFileRequestPage.clickonRefreshButton();
    await logFileRequestPage.waitTillLogFilePageLoads();
    var activeserviceTableAfter = await logFileRequestPage.getLogFileTable();
    var actualServicesDetailsAfter = await logFileRequestPage.getrowDatafromLogFileTables(activeserviceTableAfter);

    expect(actualServicesDetailsAfter.length).toBe(actualServicesDetailsBefore.length + modulecount);

  });

  //US#98378
  test("User should be able create the log file request for All Modules in web UI @98378", async function ({ page }) {
    test.slow();
    await basePage.navigateToUrl("l1serviceuser");
    // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP

    await customerListPage.searchCustomer(customer);
    await customerListPage.selectCustomer(customer);
    await customerDetailsPage.selectCMInstance(deviceId);
    await customerDetailsPage.selectCMInstanceService(deviceId);

    var iothubResponse = await IotHubMethods.getModuleTwin(iothub, deviceId, '$edgeAgent', sastoken);
    var systemModulesJson = iothubResponse.data[0].properties.reported.systemModules
    var customModulesJson = iothubResponse.data[0].properties.reported.modules
    var totalModules = [...new Set([...Object.keys(customModulesJson), ...Object.keys(systemModulesJson), "managementmodule"])]
    var modulecount = totalModules.length

    await logFileRequestPage.clickonRefreshButton();
    await logFileRequestPage.waitTillLogFilePageLoads();
    var activeserviceTableBefore = await logFileRequestPage.getLogFileTable();
    var actualServicesDetailsBefore = await logFileRequestPage.getrowDatafromLogFileTables(activeserviceTableBefore);
    await logFileRequestPage.clickonRequestLogButton();

    await logFileRequestPage.selectModuleName(['All']);
    await logFileRequestPage.selectFileFormat('json');
    var now = new Date();
    var previousDate = date.addMonths(now, -1)
    await logFileRequestPage.selectEntriesfrom(date.format(previousDate, 'MM/DD/YYYY'));
    await logFileRequestPage.selectEntriesuntil();
    await logFileRequestPage.selectLogLevel('Error');
    await logFileRequestPage.enterNumberOfEntries("1000");
    await logFileRequestPage.clickonCreateLogfileOrCancelBtn("Create log file");
    await logFileRequestPage.waitTillLogFilePageLoads(12000);
    await logFileRequestPage.clickonRefreshButton();
    await logFileRequestPage.waitTillLogFilePageLoads();
    var activeserviceTableAfter = await logFileRequestPage.getLogFileTable();
    var actualServicesDetailsAfter = await logFileRequestPage.getrowDatafromLogFileTables(activeserviceTableAfter);

    expect(actualServicesDetailsAfter.length).toBe(actualServicesDetailsBefore.length + (modulecount - 1));


  });

  //US#98378
  test("L1 user should be able create get the log file request for Single Module in web UI @98378", async function ({ page }) {
    test.slow();
    await basePage.navigateToUrl("l1serviceuser");
    // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP

    await customerListPage.searchCustomer(customer);
    await customerListPage.selectCustomer(customer);

    await customerDetailsPage.selectCMInstance(deviceId);
    await customerDetailsPage.selectCMInstanceService(deviceId);

    var iothubResponse = await IotHubMethods.getModuleTwin(iothub, deviceId, '$edgeAgent', sastoken);
    var systemModulesJson = iothubResponse.data[0].properties.reported.systemModules
    var customModulesJson = iothubResponse.data[0].properties.reported.modules
    var totalModules = [...new Set([...Object.keys(customModulesJson), ...Object.keys(systemModulesJson)])]
    var iMetric = totalModules.indexOf("IoTEdgeMetricsCollector")
    console.log(totalModules.splice(iMetric, 1));
    console.log(totalModules)
    var modulecount = totalModules.length
    var randModule = totalModules[Math.floor(Math.random() * modulecount)]

    await logFileRequestPage.clickonRefreshButton();
    await logFileRequestPage.waitTillLogFilePageLoads(12000);
    var activeserviceTableBefore = await logFileRequestPage.getLogFileTable();
    var actualServicesDetailsBefore = await logFileRequestPage.getrowDatafromLogFileTables(activeserviceTableBefore);

    await logFileRequestPage.clickonRequestLogButton();

    await logFileRequestPage.selectModuleName([randModule]);
    await logFileRequestPage.selectFileFormat('json');
    var now = new Date();
    var previousDate = date.addMonths(now, -1)
    await logFileRequestPage.selectEntriesfrom(date.format(previousDate, 'MM/DD/YYYY'));
    await logFileRequestPage.selectEntriesuntil();
    await logFileRequestPage.selectLogLevel('Warning');
    await logFileRequestPage.enterNumberOfEntries("1000");
    await logFileRequestPage.clickonCreateLogfileOrCancelBtn("Create log file");
    await logFileRequestPage.waitTillLogFilePageLoads(16000);
    await logFileRequestPage.clickonRefreshButton();
    await logFileRequestPage.waitTillLogFilePageLoads(16000);
    var activeserviceTableAfter = await logFileRequestPage.getLogFileTable();
    var actualServicesDetailsAfter = await logFileRequestPage.getrowDatafromLogFileTables(activeserviceTableAfter);

    expect(actualServicesDetailsBefore.length + 1).toBe(actualServicesDetailsAfter.length);

  });
//US#98378
test.skip("For L1 user create log file button should be disable for offline devices in web UI @98378", async function ({ page }) {
  test.slow();
  await basePage.navigateToUrl("l1serviceuser");
  // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP

  await customerListPage.searchCustomer(customer);
  await customerListPage.selectCustomer(customer);

  await customerDetailsPage.selectCMInstance(deviceId);
  await customerDetailsPage.selectCMInstanceService(deviceId);

  expect(await logFileRequestPage.getLogFileButtoninitialState()).not.toBeNull();
      
});
});