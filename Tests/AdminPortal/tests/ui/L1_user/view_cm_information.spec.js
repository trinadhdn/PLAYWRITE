
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
const { ApiHelper } = require('../../../helpers/api-helpers.js');
var OR = require('../../../resources/OR.json');

var basePage, customer, customerListPage, customerDetailsPage,comparisions, servicePage, deviceTwinResponse;
var activationKey, conn, customerDetailsRecordSet, customerDetailsId,activationStatus, deviceId, customerId, sastoken, customerDetailsStatusPage, token;

var testDevice = process.env.serviceUserHypervDeviceId;
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih"
const iothubResourceUri = iothub + '.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'
const apimUpdateHistoryRL = process.env.apimBaseURL + OR.APIUrls.deviceGenericUrl;
var hypervDeviceId = process.env.regularUserHypervDeviceId;

test.describe("Viewing CM Information in WebUI", function () {
  test.beforeAll(async function () {
    // // test data preparation
    conn = await TestData.sqlDBConnection();
    var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where iotdeviceId ='" + testDevice + "' and activationStatus='True' for json auto")
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
  //US#177343
  test("In WebUI, L1 user should be able to view CM current state and configuration @177343", async function ({ page }) {
    await basePage.navigateToUrl("l1serviceuser");
    // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
    await customerListPage.searchCustomer(customerId);
    await customerListPage.selectCustomer(customerId);
    var expectedCustomerName;
    if (customer.length <= 30) {
      expectedCustomerName = customer;
    } else {
      expectedCustomerName = customer.substring(0, 17) + "...";
    }
    expect(await customerDetailsPage.getCustomerButtonText()).toEqual(
      expectedCustomerName);

    await customerDetailsPage.selectCMInstance(deviceId);
    await customerDetailsPage.selectCMInstanceStatus(deviceId);
    var deviceTwinResponse = await IotHubMethods.getDeviceTwin(iothub, deviceId, sastoken);
    var deviceEnv = deviceTwinResponse.data[0].tags.env ? deviceTwinResponse.data[0].tags.env : "";
    var deviceRegion;
    if (deviceTwinResponse.data[0].properties.desired.initialState) {
      var deviceRegionShortcut = deviceTwinResponse.data[0].properties.desired.initialState ? deviceTwinResponse.data[0].properties.desired.initialState.region : "";
      conn = await TestData.sqlDBConnection();
      var regionRecordSet = await TestData.executeSqlQuery(conn, "select * from region where regionShortcut='" + deviceRegionShortcut + "' for json auto");
      var regionRecord = JSON.parse(regionRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
      deviceRegion = regionRecord[0].regionName;
    } else {
      deviceRegion = ""
    }
    conn = await TestData.sqlDBConnection();
    var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Version] where versionId in (select currentVersionId from [dbo].[Device] where iotDeviceId = '" + deviceId + "') for json auto");
    var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    var iothubResponse = await IotHubMethods.getModuleTwin(iothub, deviceId, '$edgeAgent', sastoken);
    var deviceStatus = iothubResponse.data[0].properties.reported.lastDesiredStatus.code == 200 ? 'Connected' : 'Not connected'
    expect(await customerDetailsStatusPage.getDeviceId()).toEqual(deviceId)
    expect(await customerDetailsStatusPage.getCMDeviceStatus()).toEqual(deviceStatus);
    var env = await customerDetailsStatusPage.getDeviceConnectedEnvironment();
    expect(env.toLowerCase()).toEqual((`${deviceEnv} ${deviceRegion}`).trim().toLowerCase())

    expect(await customerDetailsStatusPage.getDeviceSoftwareVersion()).toEqual((deviceRecord[0].versionNumber).trim())
    var systemModulesJson = iothubResponse.data[0].properties.reported.systemModules
    var desiredCustomModulesJson = iothubResponse.data[0].properties.desired.modules
    var customModulesJson = iothubResponse.data[0].properties.reported.modules
    var customModules = [...new Set([...Object.keys(desiredCustomModulesJson), ...Object.keys(customModulesJson)])]

    var expectedModuleStatus = new Map();
    expectedModuleStatus.set('edgeAgent', systemModulesJson.edgeAgent.runtimeStatus == "unknown" ? "stopped" : systemModulesJson.edgeAgent.runtimeStatus)
    expectedModuleStatus.set('edgeHub', systemModulesJson.edgeHub.runtimeStatus == "unknown" ? "stopped" : systemModulesJson.edgeAgent.runtimeStatus)
    for (let i = 0; i < customModules.length; i++) {
      var status;
      if (customModulesJson[customModules[i]]) {
        status = customModulesJson[customModules[i]].runtimeStatus == "unknown" ? "stopped" : customModulesJson[customModules[i]].runtimeStatus
      } else {
        status = "stopped"
      }
      expectedModuleStatus.set(customModules[i], status)
    }
    for (let [key, value] of expectedModuleStatus) {
      var [actualContainerStatus, actualContainerStatusIcon] = await customerDetailsStatusPage.getContainerStatus(key);
      if (value == "failed") {
        value = 'stopped';
      }else if (value == "backoff") {
        value = 'stopped';
      }
      expect(actualContainerStatus.toLowerCase()).toEqual(value)
      expect(actualContainerStatusIcon).toEqual(true)
    }

  });

  //US#177345
  test("In WebUI, L1 user should be able to view CM uptime,IP and MAC @177345", async function ({ page }) {
    await basePage.navigateToUrl("l1serviceuser");
    await customerListPage.searchCustomer(customerId);
    await customerListPage.selectCustomer(customerId);

    await customerDetailsPage.selectCMInstance(deviceId);
    await customerDetailsPage.selectCMInstanceStatus(deviceId);
    var managementModuleResponse = await IotHubMethods.getModuleTwin(iothub, deviceId, 'managementmodule', sastoken);
    var ConnectivityModuleuptime = managementModuleResponse.data[0].properties.reported.UptimeUTC;
    var CurrentLANIPofVirtualMachine = managementModuleResponse.data[0].properties.reported.IPAddress;
    var CurrentLANMACofVirtualMachine = managementModuleResponse.data[0].properties.reported.MACAddress;
    if (await customerDetailsStatusPage.getCMDeviceStatus() == "Connected") {
      expect(await customerDetailsStatusPage.getCurrentLANIPofVirtualMachine()).toEqual(CurrentLANIPofVirtualMachine)
      var mac = await customerDetailsStatusPage.getCurrentLANMACofVirtualMachine();
      expect(mac.replace(/\:/g, "")).toEqual(CurrentLANMACofVirtualMachine);
      var UptimeUTCDate = Date.parse(managementModuleResponse.data[0].properties.reported.UptimeUTC)
      var uptimeInMilliseconds = Date.now() - UptimeUTCDate
      var days = Math.floor(uptimeInMilliseconds / (1000 * 60 * 60 * 24));
      var hours = Math.floor(((uptimeInMilliseconds / (1000 * 60 * 60)) % 24));
      var minutes = Math.floor(((uptimeInMilliseconds / (1000 * 60)) % 60))
      let moduptime = await customerDetailsStatusPage.getConnectivityModuleuptime();
      if (days != 1) {
        expect(moduptime.includes(`${days} days ${hours}`)).toEqual(true);
      } else {
        expect(moduptime.includes(`${days} day ${hours}`)).toEqual(true);
      }
      var minsInUI = moduptime.split(":")[1];
      expect((minutes - minsInUI) <= 1).toEqual(true);
    }
    else {
      expect(await customerDetailsStatusPage.IsLANIPofVirtualMachinevisible()).toBe(false);
      expect(await customerDetailsStatusPage.IsLANMACofVirtualMachinevisible()).toBe(false);
    }
  });


  //US#177341 457593
  test("In WebUI, L1 user should be able to view device History @177341 @457593", async function ({ page }) {
    await basePage.navigateToUrl("l1serviceuser");
    await customerListPage.searchCustomer(customerId);
    await customerListPage.selectCustomer(customerId);

    await customerDetailsPage.selectCMInstance(deviceId);
    await customerDetailsPage.selectCMInstanceStatus(deviceId);
    var activeDeviceHistoryTable = await customerDetailsStatusPage.geDeviceHistoryTable();
    var uiDataF = await customerDetailsStatusPage.getUIHistoryData();

    //api request   

    var response = await ApiHelper.getUpdates(token, deviceId)
    var apiData = response.data;
    var dataResults = apiData.result
    var apiDataF = new Array()

    for (var i = 0; i < dataResults.length; i++) {      
      var date = new Date(dataResults[i].endDateTime);
      var data = { updateVersion: dataResults[i].updateVersion, endDateTime: date.toISOString().slice(0,-5), updateType: dataResults[i].updateType.toLowerCase()}
      apiDataF.push(data);
    }
    var areEqual = new Array(), apiJSON, uiJSON;

    if (apiDataF.length <= uiDataF.length) {

      for (var i = 0; i < dataResults.length; i++) {

        apiJSON = JSON.parse(JSON.stringify(apiDataF[i]));
        uiJSON = JSON.parse(JSON.stringify(uiDataF[i]));
        areEqual.push(await Comparisions.compareObjects(apiJSON, uiJSON));

      }
    } else {
      areEqual.push(false);
    }
    expect(areEqual).not.toContain(false);

  });
  
  

});
