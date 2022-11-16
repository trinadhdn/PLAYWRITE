const { BasePage } = require('../../../pages/base_page.js');
const { TestData } = require("../../../utils/test_data.js");
const { TokenGenerators } = require('../../../utils/token_generators.js')
const { LogFileRequestPage } = require('../../../pages/service_logFile_page.js');
const { test, expect } = require('@playwright/test');
const { CustomerListPage } = require("../../../pages/customer_list_page.js");
const { CustomerDetailsPage } = require("../../../pages/customer_details_page.js");
var { CustomerDetailsStatusPage } = require("../../../pages/customer_details_status_page.js");
const { IotHubMethods } = require('../../../utils/iothub_methods.js');
const { comparisions } = require('../../../utils/comparisions.js');
var OR = require('../../../resources/OR.json');
var activationKey, activationStatus, conn, token, customerDetailsId, deviceId, customer, customerId, sastoken;
var basePage, customerListPage, customerDetailsPage, customerDetailsRecordSet, iothubMethods, logFileRequestPage;
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih"
const iothubResourceUri = iothub + '.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'
const apimUpdateHistoryRL = process.env.apimBaseURL + OR.APIUrls.deviceGenericUrl;
var testDevice = process.env.serviceUserHypervDeviceId;

test.describe("Check Network Diagnosis in WebUI", function () {
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
    logFileRequestPage = new LogFileRequestPage(page);
    iothubMethods - new IotHubMethods(page);
  })

  //US#308169 US#366326
  test("L1 user should be able to get Network Diagnosis result with PING method and VALID format Address in web UI @308169 @366326", async function ({ page }) {
    test.slow();
    var valAddress = ["127.0.0.1", "www.google.com", "1.1.1.1",];
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
      expectedCustomerName
    );
    await customerDetailsPage.selectCMInstance(deviceId);
    await customerDetailsPage.selectCMInstanceService(deviceId);
    expect(await logFileRequestPage.getStartDiagButtoninitialState()).not.toBeNull();
    await logFileRequestPage.selectDiagnosisType("Ping")
    expect(await logFileRequestPage.getDiagnosisType()).toBe('Ping');
    for (var k = 0; k < valAddress.length; k++) {
      await logFileRequestPage.enterDiagnosisAddress(valAddress[k]);
      expect(await logFileRequestPage.getDiagnosisAddress()).toBe(valAddress[k]);
      await logFileRequestPage.selectStartDiagnosis();
      var response = await logFileRequestPage.getnetworkdiagresponse();
      expect(response).not.toBeNull();
      expect(response.includes("PING " + valAddress[k] + " ")).toBe(true);
      expect(await logFileRequestPage.Okbuttonpresent()).toBe(true);
      expect(await logFileRequestPage.cancelbuttonpresent()).toBe(false);
      await logFileRequestPage.closeResponseboxwithCrossbutton();
    }
    await basePage.logout()

  });

  //US#308169
  test("L1 user should see error message with PING method and INVALID format Address in web UI @308169", async function ({ page }) {
    test.slow();
    var invalAddress = ["127..0.0.1", "www.2222.com.", "11.1.1.11..", "1234567", "dgdfgdffvfdv",];
    await basePage.navigateToUrl("l1serviceuser");
    // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
    await customerListPage.searchCustomer(customerId);
    await customerListPage.selectCustomer(customerId);

    await customerDetailsPage.selectCMInstance(deviceId);
    await customerDetailsPage.selectCMInstanceService(deviceId);
    expect(await logFileRequestPage.getStartDiagButtoninitialState()).not.toBeNull();
    await logFileRequestPage.selectDiagnosisType("Ping")
    expect(await logFileRequestPage.getDiagnosisType()).toBe('Ping');
    for (var k = 0; k < invalAddress.length; k++) {
      await logFileRequestPage.enterDiagnosisAddress(invalAddress[k]);
      expect(await logFileRequestPage.getDiagnosisAddress()).toBe(invalAddress[k]);
      var errormessage = await logFileRequestPage.getErrorMsg();
      expect(errormessage).toEqual("Please enter an IPv4 address or FQDN.");
      expect(await logFileRequestPage.getStartDiagButtoninitialState()).not.toBeNull();
    }
    await basePage.logout()

  });

  //US#308169 US#366326
  test("L1 user should be able to get Network Diagnosis result with TRACEROUTE method and VALID Address in web UI @308169 @366326", async function ({ page }) {
    test.slow();
    var valAddress = ["127.0.0.1", "google.com", "1.1.1.1", "www.bing.com", "0.0.0.0"];
    await basePage.navigateToUrl("l1serviceuser");
    // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
    await customerListPage.searchCustomer(customerId);
    await customerListPage.selectCustomer(customerId);

    await customerDetailsPage.selectCMInstance(deviceId);
    await customerDetailsPage.selectCMInstanceService(deviceId);
    expect(await logFileRequestPage.getStartDiagButtoninitialState()).not.toBeNull();
    await logFileRequestPage.selectDiagnosisType("TraceRoute")
    expect(await logFileRequestPage.getDiagnosisType()).toBe('TraceRoute');
    for (var k = 0; k < valAddress.length; k++) {
      await logFileRequestPage.enterDiagnosisAddress(valAddress[k]);
      expect(await logFileRequestPage.getDiagnosisAddress()).toBe(valAddress[k]);
      await logFileRequestPage.selectStartDiagnosis();
      var response = await logFileRequestPage.getnetworkdiagresponse();
      expect(response).not.toBeNull();
      expect(response.includes("traceroute to " + valAddress[k] + " ")).toBe(true);
      //Removed Cancel button@366326
      expect(await logFileRequestPage.cancelbuttonpresent()).toBe(false);
      expect(await logFileRequestPage.Okbuttonpresent()).toBe(true);
      await logFileRequestPage.closeResponseboxwithOkbutton();
    }
    await basePage.logout()

  });

  //US#308169 US#366326
  test("L1 user should be able to close Network Diagnosis result with cross button in web UI @308169 @366326", async function ({ page }) {
    test.slow();
    await basePage.navigateToUrl("l1serviceuser");
    // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
    await customerListPage.searchCustomer(customerId);
    await customerListPage.selectCustomer(customerId);

    await customerDetailsPage.selectCMInstance(deviceId);
    await customerDetailsPage.selectCMInstanceService(deviceId);
    expect(await logFileRequestPage.getStartDiagButtoninitialState()).not.toBeNull();
    await logFileRequestPage.selectDiagnosisType("TraceRoute")
    expect(await logFileRequestPage.getDiagnosisType()).toBe('TraceRoute');

    await logFileRequestPage.enterDiagnosisAddress("127.0.0.1");
    expect(await logFileRequestPage.getDiagnosisAddress()).toBe("127.0.0.1");
    await logFileRequestPage.selectStartDiagnosis();
    var response = await logFileRequestPage.getnetworkdiagresponse();
    expect(response).not.toBeNull();
    expect(response.includes("traceroute to " + "127.0.0.1" + " ")).toBe(true);
    expect(await logFileRequestPage.Okbuttonpresent()).toBe(true);
    expect(await logFileRequestPage.cancelbuttonpresent()).toBe(false);
    expect(await logFileRequestPage.isCrossbuttonPresent()).toBe(true);
    await logFileRequestPage.closeResponseboxwithCrossbutton();
    await basePage.logout()

  });
  //US#308169
  test("L1 user should see error message with TRACEROUTE method and INVALID format Address in web UI @308169", async function ({ page }) {
    test.slow();
    var invalAddress = ["127..0.0.1", "www.2222.com.", "11.1.1.11..", "1234567", "dgdfgdffvfdv",];
    await basePage.navigateToUrl("l1serviceuser");
    // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
    await customerListPage.searchCustomer(customerId);
    await customerListPage.selectCustomer(customerId);

    await customerDetailsPage.selectCMInstance(deviceId);
    await customerDetailsPage.selectCMInstanceService(deviceId);
    expect(await logFileRequestPage.getStartDiagButtoninitialState()).not.toBeNull();
    await logFileRequestPage.selectDiagnosisType("TraceRoute")
    expect(await logFileRequestPage.getDiagnosisType()).toBe('TraceRoute');
    for (var k = 0; k < invalAddress.length; k++) {
      await logFileRequestPage.enterDiagnosisAddress(invalAddress[k]);
      expect(await logFileRequestPage.getDiagnosisAddress()).toBe(invalAddress[k]);
      var errormessage = await logFileRequestPage.getErrorMsg();
      expect(errormessage).toEqual("Please enter an IPv4 address or FQDN.");
      expect(await logFileRequestPage.getStartDiagButtoninitialState()).not.toBeNull();
    }
    await basePage.logout()
  });

  //US#308169 US#366326
  test("L1 user should get error result with PING method and valid format and INVALID input Address in web UI @308169 @366326", async function ({ page }) {
    test.slow();
    var invalInput = ["www.gh", "gfh.cbhg.ygh", "abc.ght.com", "vf45df.in"];
    await basePage.navigateToUrl("l1serviceuser");
    // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
    await customerListPage.searchCustomer(customerId);
    await customerListPage.selectCustomer(customerId);

    await customerDetailsPage.selectCMInstance(deviceId);
    await customerDetailsPage.selectCMInstanceService(deviceId);
    expect(await logFileRequestPage.getStartDiagButtoninitialState()).not.toBeNull();
    await logFileRequestPage.selectDiagnosisType("Ping")
    expect(await logFileRequestPage.getDiagnosisType()).toBe('Ping');
    for (var k = 0; k < invalInput.length; k++) {
      await logFileRequestPage.enterDiagnosisAddress(invalInput[k]);
      expect(await logFileRequestPage.getDiagnosisAddress()).toBe(invalInput[k]);
      await logFileRequestPage.selectStartDiagnosis();
      var response = (await logFileRequestPage.getnetworkdiagresponse()).trim();
      expect(response).toBe("Destination address unknown");
      expect(await logFileRequestPage.Okbuttonpresent()).toBe(true);
      expect(await logFileRequestPage.cancelbuttonpresent()).toBe(false);   
      await logFileRequestPage.closeResponseboxwithOkbutton();
    }
    await basePage.logout()

  });

  //US#308169 US#366326
  test("L1 user should get error result with TRACEROUTE method and valid format and INVALID input Address in web UI @308169 @366326", async function ({ page }) {
    test.slow();
    var invalInput = ["www.gh", "gfh.cbhg.ygh", "abc.ght.com", "vf45df.in"];
    await basePage.navigateToUrl("l1serviceuser");
    // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
    await customerListPage.searchCustomer(customerId);
    await customerListPage.selectCustomer(customerId);

    await customerDetailsPage.selectCMInstance(deviceId);
    await customerDetailsPage.selectCMInstanceService(deviceId);
    expect(await logFileRequestPage.getStartDiagButtoninitialState()).not.toBeNull();
    await logFileRequestPage.selectDiagnosisType("TraceRoute")
    expect(await logFileRequestPage.getDiagnosisType()).toBe('TraceRoute');
    for (var k = 0; k < invalInput.length; k++) {
      await logFileRequestPage.enterDiagnosisAddress(invalInput[k]);
      expect(await logFileRequestPage.getDiagnosisAddress()).toBe(invalInput[k]);
      await logFileRequestPage.selectStartDiagnosis();
      var response = (await logFileRequestPage.getnetworkdiagresponse()).trim();
      expect(response).toBe("Destination address unknown");
      expect(await logFileRequestPage.Okbuttonpresent()).toBe(true);
      expect(await logFileRequestPage.cancelbuttonpresent()).toBe(false);   
      await logFileRequestPage.closeResponseboxwithOkbutton();
    }
    await basePage.logout()

  });

});