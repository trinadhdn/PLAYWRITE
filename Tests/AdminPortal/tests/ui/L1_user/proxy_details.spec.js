const { BasePage } = require('../../../pages/base_page.js');
const { TestData } = require('../../../utils/test_data.js');
const { TokenGenerators } = require('../../../utils/token_generators.js')
const { test, expect } = require('@playwright/test');
const { CustomerListPage } = require('../../../pages/customer_list_page.js');
const { CustomerDetailsPage } = require('../../../pages/customer_details_page.js');
const { IotHubMethods } = require('../../../utils/iothub_methods.js');
const { CustomerDetailsStatusPage } = require("../../../pages/customer_details_status_page.js");
var OR = require("../../../resources/OR.json");
var basePage, customerListPage, customerDetailsPage,customerDetailsRecordSet,customerId,customer, deviceId, servicePage, customerDetailsStatusPage, customerDetailsId;
var hypervDeviceId = process.env.regularUserHypervDeviceId;
var proxyDeviceId = process.env.proxyDeviceId;
var activationKeyHypervDeviceId = process.env.activationKeyHypervDeviceId
const apimviewProxyConfigurationURL = process.env.apimBaseURL + OR.APIUrls.viewProxyConfigurationURL;
var sastoken, deviceId, token, conn;
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih";
const iothubResourceUri = iothub + '.azure-devices.net/devices';
const iothubPolicyKey = process.env.iotHubPolicyKey;
const iothubPolicy = 'iothubowner';

test.describe("Web UI- View Proxy Details with Service user", function () {
    test.beforeAll(async function () {
        sastoken = await TokenGenerators.generateSasToken(iothubResourceUri, iothubPolicyKey, iothubPolicy, 30)
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        conn = await TestData.sqlDBConnection();
        var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where iotdeviceId = '" + hypervDeviceId + "' for json auto")
        var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        customerDetailsId = deviceRecord[0].customerDetailsId;
        conn = await TestData.sqlDBConnection();
        customerDetailsRecordSet = await TestData.executeSqlQuery(conn, "select * from [dbo].[CustomerDetails] where customerdetailsId=" + customerDetailsId + " for json auto")
        var customerDetailsRecord = JSON.parse(customerDetailsRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        customerId = customerDetailsRecord[0].customerId;
        customer = customerDetailsRecord[0].customerName;
        console.log("customerId: " + customerId)
    });

    test.beforeEach(async function ({ page }) {
        basePage = new BasePage(page);
        customerListPage = new CustomerListPage(page);
        customerDetailsPage = new CustomerDetailsPage(page);
        customerDetailsStatusPage = new CustomerDetailsStatusPage(page);

    })

    //US#308123 US#308115 US#383402
    test("Proxy_UI-L1User should view device configuration Proxy with valid device ID @308123 @308115 @383402", async function () {

            var ConnectivityModuleProxyDetails = {
            "username": "proxyuser",
            "port": "8022",
            "hostname": "10.2.0.4",  
        };

        if(process.env.env!="dev"){ConnectivityModuleProxyDetails.hostname="10.0.4.4"}
        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(customerId);
        await customerListPage.selectCustomer(customerId);

        await customerDetailsPage.selectCMInstance(proxyDeviceId);
        await customerDetailsPage.selectCMInstanceStatus(proxyDeviceId);
        expect(await customerDetailsStatusPage.isProxyHeaderDisplayed()).toBe(true)
        //module twin checking
        var managementModuleResponse = await IotHubMethods.getModuleTwin(iothub, proxyDeviceId, 'managementmodule', sastoken);
        var isProxyenabledparam = managementModuleResponse.data[0].properties.reported.proxyEnabled
        expect(await customerDetailsStatusPage.getProxyServer()).toBe(ConnectivityModuleProxyDetails.hostname)
        expect(await customerDetailsStatusPage.getProxyPort()).toBe(ConnectivityModuleProxyDetails.port)
        expect(await customerDetailsStatusPage.getProxyUserName()).toBe(ConnectivityModuleProxyDetails.username)
        expect(isProxyenabledparam).toBe(true);

        //Navigate to another Page and comeback to status
        await customerDetailsPage.selectCMInstanceService(proxyDeviceId);
        await customerDetailsPage.selectCMInstanceStatus(proxyDeviceId);
        expect(await customerDetailsStatusPage.isProxyHeaderDisplayed()).toBe(true)
        await customerDetailsPage.selectCMInstanceSettings(proxyDeviceId);
        await customerDetailsPage.selectCMInstanceStatus(proxyDeviceId);
        expect(await customerDetailsStatusPage.isProxyHeaderDisplayed()).toBe(true)


    });

    //US#308123 US#383402 US#363848
    test("Proxy UI- Validate serviceuser should not see the Proxy Details section for non-proxy device @363848 @308123 @383402", async function ({ page }) {

        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(customerId);
        await customerListPage.selectCustomer(customerId);

        await customerDetailsPage.selectCMInstance(hypervDeviceId);
        await customerDetailsPage.selectCMInstanceStatus(hypervDeviceId);
        //change for @363848
        // expect(await customerDetailsStatusPage.isProxyHeaderDisplayed()).toBe(false)
        expect(await customerDetailsStatusPage.isProxyHeaderDisplayed()).toBe(true)
        expect(await customerDetailsStatusPage.isProxyDetailsUnAvailableMessageDisplayed()).toBe(true)
        //Validate the error message for proxy details unavailable
        expect(await customerDetailsStatusPage.compareProxyDetailsUnAvailableMessage()).toBe(true)        

        //module twin checking
        var managementModuleResponse = await IotHubMethods.getModuleTwin(iothub, hypervDeviceId, 'managementmodule', sastoken);
        var isProxyenabledparam = managementModuleResponse.data[0].properties.reported.proxyEnabled
        expect(isProxyenabledparam).toBe(false);
    });

    //US#308123 US#383402 US#363848
    test("Proxy UI- Validate serviceuser should not see the Proxy Details section for non-connected device @363848 @308123 @383402", async function ({ page }) {

        conn = await TestData.sqlDBConnection();
        await TestData.executeSqlQuery(conn, "Update [dbo].[Device] set activationStatus='True' where iotDeviceId='" + activationKeyHypervDeviceId + "'")
        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(customerId);
        await customerListPage.selectCustomer(customerId);

        await customerDetailsPage.selectCMInstance(activationKeyHypervDeviceId);
        await customerDetailsPage.selectCMInstanceStatus(activationKeyHypervDeviceId);
        expect(await customerDetailsStatusPage.getCMDeviceStatus()).toEqual("–");
        //change for @363848
        // expect(await customerDetailsStatusPage.isProxyHeaderDisplayed()).toBe(false)
        expect(await customerDetailsStatusPage.isProxyHeaderDisplayed()).toBe(true)
        expect(await customerDetailsStatusPage.isProxyDetailsUnAvailableMessageDisplayed()).toBe(true)
        //Validate the error message for proxy details unavailable
        expect(await customerDetailsStatusPage.compareProxyDetailsUnAvailableMessage()).toBe(true)
    });

});