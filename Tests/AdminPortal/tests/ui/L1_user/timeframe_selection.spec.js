
const { BasePage } = require('../../../pages/base_page.js');
const { LogFileRequestPage } = require('../../../pages/service_logFile_page.js');
const { TestData } = require('../../../utils/test_data.js');
const { TokenGenerators } = require('../../../utils/token_generators.js')
const { test, expect } = require('@playwright/test');
const { IotHubMethods } = require('../../../utils/iothub_methods.js');
const { CustomerListPage } = require('../../../pages/customer_list_page.js');
const { CustomerDetailsPage } = require('../../../pages/customer_details_page.js');

var basePage, customerListPage, customerDetailsPage, servicePage;
var activationKey, conn,activationStatus, customerDetailsId, groupId,deviceId, customerId, sastoken, customerDetailsRecordSet, customer ;

var testDevice = process.env.serviceUserHypervDeviceId;
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih"
const iothubResourceUri = iothub + '.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'
test.describe("Timeframe Updates in WebUI", function () {
  test.beforeAll(async function () {
    // // test data preparation
    conn = await TestData.sqlDBConnection();
    var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where customerDetailsId in (select customerDetailsId from [dbo].[CustomerDetails]) and activationStatus='True' and iotDeviceId = '" + testDevice + "' for json auto")
    var devicesRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    deviceId = devicesRecord[0].iotDeviceId;
    customerDetailsId = devicesRecord[0].customerDetailsId;
    groupId = devicesRecord[0].groupId;
    conn = await TestData.sqlDBConnection();
    customerDetailsRecordSet = await TestData.executeSqlQuery(conn, "select * from [dbo].[CustomerDetails] where customerdetailsId=" + customerDetailsId + " for json auto")
    var customerDetailsRecord = JSON.parse(customerDetailsRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    customerId = customerDetailsRecord[0].customerId;
    customer = customerDetailsRecord[0].customerName;
    activationStatus = devicesRecord[0].activationStatus;
    activationKey = devicesRecord[0].activationKey;
    console.log("customerId: " + customerId)
    console.log("deviceId: " + deviceId)
    sastoken = await TokenGenerators.generateSasToken(iothubResourceUri, iothubPolicyKey, iothubPolicy, 30)

  });

  test.beforeEach(async function ({ page }) {
    basePage = new BasePage(page);
    customerListPage = new CustomerListPage(page);
    customerDetailsPage = new CustomerDetailsPage(page);
    servicePage = new LogFileRequestPage(page);
  })
  //US#177337
  test("In WebUI, L1 user should be able to view the timeframes for updates @177337", async function ({ page }) {
    await basePage.navigateToUrl("l1serviceuser");
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
    await customerDetailsPage.selectCMInstanceSettings(deviceId);
    expect(await customerDetailsPage.getSelectedTimeframeOption()).toEqual(groupId.toString())
    var time1 = await (await customerDetailsPage.getTimeframeRadioButton(1)).getAttribute("label");
    var time2 = await (await customerDetailsPage.getTimeframeRadioButton(2)).getAttribute("label");
    var time3 = await (await customerDetailsPage.getTimeframeRadioButton(3)).getAttribute("label");

    let time1Boundaries = time1.split("-")
    let time2Boundaries = time2.split("-")
    let time3Boundaries = time3.split("-")
    expect((await TestData.getUTCTimeCustom(time1Boundaries[0])).includes("02:00:00")).toEqual(true)
    expect((await TestData.getUTCTimeCustom(time1Boundaries[1])).includes("04:00:00")).toEqual(true)
    expect((await TestData.getUTCTimeCustom(time2Boundaries[0])).includes("10:00:00")).toEqual(true)
    expect((await TestData.getUTCTimeCustom(time2Boundaries[1])).includes("12:00:00")).toEqual(true)
    expect((await TestData.getUTCTimeCustom(time3Boundaries[0])).includes("04:00:00")).toEqual(true)
    expect((await TestData.getUTCTimeCustom(time3Boundaries[1])).includes("06:00:00")).toEqual(true)

  });

  //US#177339
  test("In WebUI, L1 user should be able to change the timeframe for updates @177339", async function ({ page }) {
    await basePage.navigateToUrl("l1serviceuser");
    await customerListPage.searchCustomer(customerId);
    await customerListPage.selectCustomer(customerId);
    await customerDetailsPage.selectCMInstance(deviceId);
    await customerDetailsPage.selectCMInstanceSettings(deviceId);
    expect(await customerDetailsPage.getSelectedTimeframeOption()).toEqual(groupId.toString())
    var updatedGroupId
    if (groupId == 1) {
      updatedGroupId = 2;
    } else if (groupId == 2) {
      updatedGroupId = 3;
    } else if (groupId == 3) {
      updatedGroupId = 1;
    }
    await customerDetailsPage.selectTimeframe(updatedGroupId);
    expect(await customerDetailsPage.getSelectedTimeframeOption()).toEqual(updatedGroupId.toString())
    conn = await TestData.sqlDBConnection();
    var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where iotDeviceId='" + deviceId + "' for json auto");
    var devicesRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    expect(devicesRecord[0].groupId).toEqual(updatedGroupId);
  });

  test("In WebUI, L1 user should be able to change the timeframe and it shoould update in IoTHubDeviceUpdate Module Twin @398370", async function ({ page }) {
    await basePage.navigateToUrl("l1serviceuser");
    await customerListPage.searchCustomer(customerId);
    await customerListPage.selectCustomer(customerId);
    await customerDetailsPage.selectCMInstance(deviceId);
    await customerDetailsPage.selectCMInstanceSettings(deviceId);
    for (var i = 1; i < 4; i++) {
      var updatedGroupId
      var tagName;
      if (i == 1) {
        updatedGroupId = 2;
        tagName = 'Zeiss_CM_GRP2'
      } else if (i == 2) {
        updatedGroupId = 3;
        tagName = 'Zeiss_CM_GRP3'
      } else if (i == 3) {
        updatedGroupId = 1;
        tagName = 'Zeiss_CM_GRP1'

      }
      await customerDetailsPage.selectTimeframe(updatedGroupId);
      var iothubResponse = await IotHubMethods.getModuleTwin(iothub, deviceId, 'IoTHubDeviceUpdate', sastoken);
      var aduTag = iothubResponse.data[0].tags.ADUGroup;
      expect(await customerDetailsPage.getSelectedTimeframeOption()).toEqual(updatedGroupId.toString())
      expect(aduTag).toEqual(tagName)
      conn = await TestData.sqlDBConnection();
      var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where iotDeviceId='" + deviceId + "' for json auto");
      var devicesRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
      expect(devicesRecord[0].groupId).toEqual(updatedGroupId);
    }
  });



});
