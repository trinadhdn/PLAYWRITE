const { BasePage } = require('../../../pages/base_page.js');
const { TestData } = require("../../../utils/test_data.js");
const { TokenGenerators } = require('../../../utils/token_generators.js')
const { test, expect } = require('@playwright/test');
const { CustomerListPage } = require("../../../pages/customer_list_page.js");
const { CustomerDetailsPage } = require("../../../pages/customer_details_page.js");
const { ApiHelper } = require('../../../helpers/api-helpers.js')
const { IotHubMethods } = require('../../../utils/iothub_methods.js');
const { comparisions } = require('../../../utils/comparisions.js');
var OR = require('../../../resources/OR.json');
var conn, customerDetailsId, deviceId, customer, customerId, sastoken,token;
var basePage, customerListPage,customerDetailsRecordSet, customerDetailsPage, iothubMethods;
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih"
const iothubResourceUri = iothub + '.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'
var testDevice = process.env.serviceUserHypervDeviceId;

test.describe("Viewing, modifying Custom Label in WebUI", function () {
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
        console.log("customerId: " + customerId)
        console.log("deviceId: " + deviceId)
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        sastoken = await TokenGenerators.generateSasToken(iothubResourceUri, iothubPolicyKey, iothubPolicy, 30)
        //remove custom label
        conn = await TestData.sqlDBConnection();
        await TestData.executeSqlQuery(conn, "Update [dbo].[Device] set customLabel= null where iotDeviceId='" + testDevice + "'")
    });

    test.beforeEach(async function ({ page }) {
        basePage = new BasePage(page);
        customerListPage = new CustomerListPage(page);
        customerDetailsPage = new CustomerDetailsPage(page);
        iothubMethods - new IotHubMethods(page);
    })

    //US#397621 US#363848
    test('In WebUI, L1 user should be able to view and modify the custom name on Settings tab @363848 @397621', async function () {
        let customLabel = "Label " + await ApiHelper.createcustomLabel(9)

        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(customerId);
        await customerListPage.selectCustomer(customerId);
        await customerDetailsPage.selectCMInstance(deviceId);
        await customerDetailsPage.selectCMInstanceSettings(deviceId);

        // Validate the general section
        expect(await customerDetailsPage.isGeneralSectionDisplayed()).toBe(true);
        expect(await customerDetailsPage.isNameLabelDisplayed()).toBe(true);

        expect(await customerDetailsPage.compareGeneralLabel()).toBe(true);
        expect(await customerDetailsPage.compareNameLabel()).toBe(true);
        expect(await customerDetailsPage.compareApplyLabel()).toBe(true);

        //Update the custom name and save 
        await customerDetailsPage.enterCustomName(customLabel);
        await customerDetailsPage.customnameSave();

        //Validate the device name with custom name
        var updateddeviceid = deviceId + " – " + customLabel
        expect(await customerDetailsPage.compareDeviceName()).toBe(updateddeviceid)

        //  check for custom label name displayed in left hand side accordion menu        
        expect(await customerDetailsPage.validateCustomNameDisplayedinAccordion(deviceId,customLabel)).toBe(true);

        //validate DB update
        conn = await TestData.sqlDBConnection();
        var customLabelRecordset = await TestData.executeSqlQuery(conn, "select * from [dbo].[Device] where iotdeviceId = '" + testDevice + "' for json auto")
        var customLabelRecord = JSON.parse(customLabelRecordset['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        var updatedLabel = customLabelRecord[0].customLabel;
        expect(updatedLabel).toBe(customLabel)

        //remove custom label
        conn = await TestData.sqlDBConnection();
        await TestData.executeSqlQuery(conn, "Update [dbo].[Device] set customLabel= null where iotDeviceId='" + testDevice + "'")

        //Validate the device name without custom name
        expect(await customerDetailsPage.compareDeviceName()).toBe(deviceId)

        //validate the device name is removed from left hand manu 
        expect(await customerDetailsPage.validateCustomNameDisplayedinAccordion(deviceId,customLabel)).toBe(false);


        //logout
        await basePage.logout();

    });

    //US#412376
    test('In WebUI, L1 user should not be able to click Apply button without any changes on Settings tab @363848 @397621', async function () {
        let customLabel = "Label " + await ApiHelper.createcustomLabel(9)

        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(customerId);
        await customerListPage.selectCustomer(customerId);
        await customerDetailsPage.selectCMInstance(deviceId);
        await customerDetailsPage.selectCMInstanceSettings(deviceId);

        //Check Apply button is disabled 
       expect(await customerDetailsPage.getApplyButtoninitialState()).not.toBeNull();
        //logout
        await basePage.logout();

    });
    //US#397621
    test('In WebUI, L1 user should be able to view the error for invalid or blank custom name on Settings tab @397621', async function () {

        let customLabel = "Label " + await ApiHelper.createcustomLabel(15)
        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(customerId);
        await customerListPage.selectCustomer(customerId);
        await customerDetailsPage.selectCMInstance(deviceId);
        await customerDetailsPage.selectCMInstanceSettings(deviceId);

        //Update the custom name as blank and save 
        await customerDetailsPage.enterCustomName("customLabel");
        await customerDetailsPage.enterCustomName("%^%$%");
        await customerDetailsPage.customnameSave();

        //Validate the error message for blank name
        expect(await customerDetailsPage.comparecustomLabelError()).toBe(true)

        //Update the custom name as invalid and save 
        await customerDetailsPage.enterCustomName('invalid%^*$%%');
        await customerDetailsPage.customnameSave();

        //Validate the error message for invalid name
        expect(await customerDetailsPage.comparecustomLabelError()).toBe(true)        

        //Validate the device name
        expect(await customerDetailsPage.compareDeviceName()).toBe(deviceId)

        //logout
        await basePage.logout();

    });

    test.afterAll(async function () {        
        //remove custom label
        conn = await TestData.sqlDBConnection();
        await TestData.executeSqlQuery(conn, "Update [dbo].[Device] set customLabel= null where iotDeviceId='" + testDevice + "'")
    });


});