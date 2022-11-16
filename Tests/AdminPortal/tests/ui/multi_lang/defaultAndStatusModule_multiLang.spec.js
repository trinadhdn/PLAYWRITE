const { BasePage } = require('../../../pages/base_page.js');
const { StatusListPage } = require('../../../pages/languages/defaultAndStatus_list_page');
const { CustomerListPage } = require('../../../pages/customer_list_page.js');
const { CustomerDetailsPage } = require('../../../pages/customer_details_page.js');
const { CustomerDetailsStatusPage } = require("../../../pages/customer_details_status_page.js");
const { test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
var customerId, customer, customerName, conn, deviceId, customerDetailsId, StatusPage_ML, customerListPage;
var basePage,customerDetailsRecordSet, customerDetailsPage, customerDetailsStatusPage, homePage;
var testDevice = process.env.serviceUserHypervDeviceId;
var proxyDeviceId = process.env.proxyDeviceId;
var softwrVersion = "1.2.0"

test.describe('Multi-language check for Status with L1 user', function () {
    test.beforeAll(async function () {
        // test data preparation     
        conn = await TestData.sqlDBConnection();
        var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where iotdeviceId ='" + testDevice + "' and activationStatus='True' for json auto")
        var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        deviceId = deviceRecord[0].iotDeviceId;
        customerDetailsId = deviceRecord[0].customerDetailsId;
        conn = await TestData.sqlDBConnection();
        customerDetailsRecordSet = await TestData.executeSqlQuery(conn, "select * from [dbo].[CustomerDetails] where customerdetailsId=" + customerDetailsId + " for json auto")
        var customerDetailsRecord = JSON.parse(customerDetailsRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        customerId = customerDetailsRecord[0].customerId;
        customerName = customerDetailsRecord[0].customerName;

        console.log("customerName: " + customerName)
        console.log("customerId: " + customerId)
    });


    test.beforeEach(async function ({ page }) {
        basePage = new BasePage(page);
        customerListPage = new CustomerListPage(page);
        customerDetailsPage = new CustomerDetailsPage(page);
        StatusPage_ML = new StatusListPage(page);
        customerDetailsStatusPage = new CustomerDetailsStatusPage(page);
    })

    // US#177466,#326276
    test('Check Status screen with Multi Languages @177466 @307707 @326276', async function ({ page }) {
        // Navigate to Customer list page
        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(customerId);
        await customerListPage.selectCustomer(customerId);
        expect(await StatusPage_ML.compareSelectModuleMessageLine1_LabelText()).toEqual(true);

        expect(await StatusPage_ML.compareConfiguration_LabelText()).toEqual(true);

        await customerDetailsPage.selectCMInstance(deviceId);

        expect(await StatusPage_ML.compareSideBarStatus_LabelText()).toEqual(true);
        expect(await StatusPage_ML.compareSideBarDevices_LabelText()).toEqual(true);
        expect(await StatusPage_ML.compareSideBarSettings_LabelText()).toEqual(true);
        expect(await StatusPage_ML.compareSideBarService_LabelText()).toEqual(true);

        await customerDetailsPage.selectCMInstance(deviceId);

        await customerDetailsPage.selectCMInstanceStatus(deviceId);

        expect(await StatusPage_ML.compareSelectActivationKey_LabelText()).toEqual(true);
        expect(await StatusPage_ML.compareGenerateNewKey_LabelText()).toEqual(true);
        expect(await StatusPage_ML.compareConnectivityModuleStatus_LabelText()).toEqual(true);
        expect(await StatusPage_ML.compareActivationkeynotorinus_LabelText()).toEqual(true);
        expect(await StatusPage_ML.compareContainerStatusheader_LabelText()).toEqual(true);
        await TestData.waitFortimeOut(5000);

        // Connectivity Module status
        expect(await StatusPage_ML.compareDeviceId_LabelText()).toEqual(true);
        expect(await StatusPage_ML.compareStatus_LabelText()).toEqual(true);
        expect(await StatusPage_ML.compareCurrentSoftwareVersion_LabelText()).toEqual(true);
        expect(await StatusPage_ML.getCurrentSoftwareVersion_Val()).toEqual(softwrVersion);
        expect(await StatusPage_ML.compareConnectedEnvironment_LabelText()).toEqual(true)
        expect(await StatusPage_ML.compareCurrentLANIPofVirtualMachine_LabelText()).toEqual(true);
        expect(await StatusPage_ML.compareCurrentLANMACofVirtualMachine_LabelText()).toEqual(true);
        expect(await StatusPage_ML.compareCurrentConnectivityModuleuptim_LabelText()).toEqual(true);
        expect(await StatusPage_ML.compareCurrentCMS_Refresh_LabelText()).toEqual(true);


        expect(await StatusPage_ML.compareCurrentlableCmIpAddressMessage1_LabelText()).toEqual(true);
        expect(await StatusPage_ML.compareCurrentlableCmIpAddressMessage2_LabelText()).toEqual(true);
        expect(await StatusPage_ML.compareCurrentUpdateHistoryHeader_LabelText()).toEqual(true);
        expect(await StatusPage_ML.compareContainerNameStatus_LabelText()).toEqual(true);
        expect(await StatusPage_ML.compareContainerStatus_LabelText()).toEqual(true);
        expect(await StatusPage_ML.compareContainerRestart_LabelText()).toEqual(true);


        expect(await StatusPage_ML.compareHistoryUpdateType_LabelText()).toEqual(true);
        expect(await StatusPage_ML.compareHistoryupdateVersion_LabelText()).toEqual(true);
        expect(await StatusPage_ML.compareHistoryupdateDate_LabelText()).toEqual(true);
        expect(await StatusPage_ML.compareHistoryupdateTime_LabelText()).toEqual(true);


    });

    // US#365566
    test('Check the customer name, ID and Agreement id labels with multilang in the web ui @365566', async () => {

        // Navigate to Customer list page
        await basePage.navigateToUrl("l1serviceuser");


        //Search a customer and select the customer
        await customerListPage.searchCustomer(customerId);
        await customerListPage.selectCustomer(customerId);
        expect(await customerDetailsPage.isCustomerButtonTextPresent()).toBe(true)
        expect(await customerDetailsPage.getCustomerButtonText()).toBe(customerName)
        expect(await customerDetailsPage.getCustomerbuttonIdtext()).toBe(customerId)
        await customerDetailsPage.clickCustomerbutton();

        expect(await customerDetailsPage.compareCustomernameLabel()).toBe(true)
        expect(await customerDetailsPage.compareCustomersapLabel()).toBe(true)
        expect(await customerDetailsPage.compareCustomerIdLabel()).toBe(true)
        expect(await customerDetailsPage.compareChangeCustomerLabel()).toBe(true)

        //logout
        await basePage.logout();
    });


    // US#177466,#326276
    test('Check Proxy section with Multi Languages @177466 @307707 @326276', async function ({ page }) {
        conn = await TestData.sqlDBConnection();
        var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where iotdeviceId = '" + proxyDeviceId + "' for json auto")
        var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        customerDetailsId = deviceRecord[0].customerDetailsId;
        conn = await TestData.sqlDBConnection();
        customerDetailsRecordSet = await TestData.executeSqlQuery(conn, "select * from [dbo].[CustomerDetails] where customerdetailsId=" + customerDetailsId + " for json auto")
        var customerDetailsRecord = JSON.parse(customerDetailsRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        customerId = customerDetailsRecord[0].customerId;
        console.log("customerId: " + customerId)

        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(customerId);
        await customerListPage.selectCustomer(customerId);

        await customerDetailsPage.selectCMInstance(proxyDeviceId);
        await customerDetailsPage.selectCMInstanceStatus(proxyDeviceId);
        expect(await customerDetailsStatusPage.isProxyHeaderDisplayed()).toBe(true)

        
        // Proxy Settings
        expect(await StatusPage_ML.compareProxySettings_LabelText()).toEqual(true);
        expect(await StatusPage_ML.compareProxyServer_LabelText()).toEqual(true);
        expect(await StatusPage_ML.compareProxyPort_LabelText()).toEqual(true);
        expect(await StatusPage_ML.compareProxyUsername_LabelText()).toEqual(true);
        expect(await StatusPage_ML.compareProxyPassword_LabelText()).toEqual(true);

    });


    });
