const { BasePage } = require('../../../pages/base_page.js');
const { TestData } = require("../../../utils/test_data.js");
const { TokenGenerators } = require('../../../utils/token_generators.js')
const { test, expect } = require('@playwright/test');
const { CustomerListPage } = require("../../../pages/customer_list_page.js");
const { CustomerDetailsPage } = require("../../../pages/customer_details_page.js");
var { CustomerDetailsStatusPage } = require("../../../pages/customer_details_status_page.js");
const { IotHubMethods } = require('../../../utils/iothub_methods.js');
const { comparisions } = require('../../../utils/comparisions.js');
var OR = require('../../../resources/OR.json');
var activationKey, conn,token, customerDetailsId, deviceId,activationStatus, customer, customerId, sastoken,customerDetailsRecordSet;
var basePage, customerListPage, customerDetailsPage, iothubMethods;
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih"
const iothubResourceUri = iothub + '.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'
const apimUpdateHistoryRL = process.env.apimBaseURL + OR.APIUrls.deviceGenericUrl;
var testDevice = process.env.serviceUserHypervDeviceId;

test.describe("Viewing, modifying upstream and downstream bandwidth in WebUI", function () {
  test.beforeAll(async function () {
    // test data preparation
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
    iothubMethods - new IotHubMethods(page);
  })

  async function checkLimitUpstreamSpeed(speedData) {
    var newSpeedData = Math.round(speedData).toString()
    if (speedData >= 0.5 && speedData <= 999.4) {
      expect(await customerDetailsPage.getUpstreamBandwidthValue()).toEqual(newSpeedData);
    }
    else if (speedData > 999.4) {
      expect(await customerDetailsPage.getUpstreamBandwidthValue()).toEqual('999');

    }
    else {
      expect(await customerDetailsPage.getUpstreamBandwidthValue()).toEqual('1');
    }
  }

  async function checkLimitDownstreamSpeed(speedData) {
    var newSpeedData = Math.round(speedData).toString()
    if (speedData >= 0.5 && speedData <= 999.4) {
      expect(await customerDetailsPage.getDownstreamBandwidthValue()).toEqual(newSpeedData);
    }
    else if (speedData > 999.4) {
      expect(await customerDetailsPage.getDownstreamBandwidthValue()).toEqual('999');

    }
    else {
      expect(await customerDetailsPage.getDownstreamBandwidthValue()).toEqual('1');
    }
  }

  //US#270714
  test('In WebUI, L1 user should be able to view and modify the current maximum upstream bandwidth and verify that banner is not visible on Settings tab @270714 @326390', async function () {
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
    expect(await customerDetailsPage.getCustomerButtonText()).toEqual(expectedCustomerName);

    await customerDetailsPage.selectCMInstance(deviceId);
    await customerDetailsPage.selectCMInstanceSettings(deviceId);

    var managementModuleResponse = await IotHubMethods.getModuleTwin(iothub, deviceId, "managementmodule", sastoken);
    var upstreamBandwidth = managementModuleResponse.data[0].properties.desired.current ? managementModuleResponse.data[0].properties.desired.current.bandwidth.uploadSpeedInMbps : managementModuleResponse.data[0].properties.desired.initial.bandwidth.uploadSpeedInMbps;
    var strupstreamBandwidth = upstreamBandwidth.toString();

    // expect(await customerDetailsPage.getApplyButtoninitialState()).toBe('true');
    expect(await customerDetailsPage.getApplyButtoninitialState()).not.toBeNull();

    //user valiadtes that no banner is displayed if device is online and connected
    expect(await customerDetailsPage.isBannerPresent()).toEqual(false);

    if (upstreamBandwidth > 0 && upstreamBandwidth <= 999) {
      expect(await customerDetailsPage.getlimitUpstreamBandwidthCheckBox()).toBe('true')
      expect(await customerDetailsPage.getUpstreamBandwidthValue()).toEqual(strupstreamBandwidth)
    }
    else {
      expect(await customerDetailsPage.getlimitUpstreamBandwidthCheckBox()).toBe('false')
      expect(await customerDetailsPage.getUpstreamBandwidthValue()).toBe('')
    }
    // Enter multiple values in the bandwidth textbox
    await customerDetailsPage.clicklimitUpstreamBandwidthCheckBox();
    await customerDetailsPage.enterLimitUpstreamSpeed(999)
    await checkLimitUpstreamSpeed(999)
    await customerDetailsPage.enterLimitUpstreamSpeed(1004.6)
    await checkLimitUpstreamSpeed(1004.6)
    await customerDetailsPage.enterLimitUpstreamSpeed(998)
    await checkLimitUpstreamSpeed(998)
    await customerDetailsPage.enterLimitUpstreamSpeed(675)
    await checkLimitUpstreamSpeed(675)
    await customerDetailsPage.enterLimitUpstreamSpeed(0)
    await checkLimitUpstreamSpeed(0)
    await customerDetailsPage.enterLimitUpstreamSpeed(45)
    await checkLimitUpstreamSpeed(45)
    await customerDetailsPage.clickApplyButton();
    await customerDetailsPage.clicklimitUpstreamBandwidthCheckBox();
    await customerDetailsPage.enterLimitUpstreamSpeed(678)
    await checkLimitUpstreamSpeed(678)
    // expect(await customerDetailsPage.getApplyButton()).toBe(true)
    expect(await customerDetailsPage.getApplyButtoninitialState()).toBeNull();
    await customerDetailsPage.clickApplyButton();
    await checkLimitUpstreamSpeed(678)


  });

  //US#270714
  test('In WebUI, L1 user should be able to view and modify the current maximum downstream bandwidth @270714', async function () {
    await basePage.navigateToUrl("l1serviceuser");
    await customerListPage.searchCustomer(customerId);
    await customerListPage.selectCustomer(customerId);

    await customerDetailsPage.selectCMInstance(deviceId);
    await customerDetailsPage.selectCMInstanceSettings(deviceId);

    var managementModuleResponse = await IotHubMethods.getModuleTwin(iothub, deviceId, "managementmodule", sastoken);
    var downstreamBandwidth = managementModuleResponse.data[0].properties.desired.current ? managementModuleResponse.data[0].properties.desired.current.bandwidth.downloadSpeedInMbps : managementModuleResponse.data[0].properties.desired.initial.bandwidth.downloadSpeedInMbps;
    var strdownstreamBandwidth = downstreamBandwidth.toString();
      
    expect(await customerDetailsPage.getApplyButtoninitialState()).not.toBeNull();

    if (downstreamBandwidth > 0 && downstreamBandwidth <= 999) {
      expect(await customerDetailsPage.getlimitDownstreamBandwidthCheckBox()).toBe('true')
      expect(await customerDetailsPage.getDownstreamBandwidthValue()).toEqual(strdownstreamBandwidth)
    }
    else {
      expect(await customerDetailsPage.getlimitDownstreamBandwidthCheckBox()).toBe('false')
      expect(await customerDetailsPage.getDownstreamBandwidthValue()).toBeNull()
    }

    // Enter multiple values in the bandwidth textbox
    await customerDetailsPage.clicklimitDownstreamBandwidthCheckBox();
    await customerDetailsPage.enterLimitDownstreamSpeed(0)
    await checkLimitDownstreamSpeed(0)
    await customerDetailsPage.enterLimitDownstreamSpeed(1008.6)
    await checkLimitDownstreamSpeed(1008.6)
    await customerDetailsPage.enterLimitDownstreamSpeed(999.4)
    await checkLimitDownstreamSpeed(999.4)
    await customerDetailsPage.enterLimitDownstreamSpeed(998)
    await checkLimitDownstreamSpeed(998)
    await customerDetailsPage.enterLimitDownstreamSpeed(10)
    await checkLimitDownstreamSpeed(10)
    await customerDetailsPage.enterLimitDownstreamSpeed(31)
    await checkLimitDownstreamSpeed(31)
    await customerDetailsPage.clickApplyButton();
    await customerDetailsPage.enterLimitDownstreamSpeed(89)
    await checkLimitDownstreamSpeed(89)
    expect(await customerDetailsPage.getApplyButtoninitialState()).toBeNull();
    await customerDetailsPage.clickApplyButton();
    await checkLimitDownstreamSpeed(89)

  });


});