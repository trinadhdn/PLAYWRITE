const { BasePage } = require('../../../pages/base_page.js');
const { LogFileRequestPage } = require('../../../pages/service_logFile_page.js');
const { TestData } = require('../../../utils/test_data.js');
const { TokenGenerators } = require('../../../utils/token_generators.js')
const { test, expect } = require('@playwright/test');
const { IotHubMethods } = require('../../../utils/iothub_methods.js');
const { CustomerListPage } = require('../../../pages/customer_list_page.js');
const { CustomerDetailsPage } = require('../../../pages/customer_details_page.js');
var basePage, customerListPage, customerDetailsPage, servicePage;

const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih";
const iothubResourceUri = iothub + '.azure-devices.net/devices';
const iothubPolicyKey = process.env.iotHubPolicyKey;
const iothubPolicy = 'iothubowner';
var deviceId, customer, conn,customerDetailsId,sastoken;
var testDevice = process.env.serviceUserHypervDeviceId,customerDetailsRecordSet,customerId;
test.describe('Connectivity Module List', function () {
    test.beforeAll(async function () {

        // test data preparation     
        sastoken = await TokenGenerators.generateSasToken(iothubResourceUri, iothubPolicyKey, iothubPolicy, 30)

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
        console.log("customerId: " + customer)
        console.log("deviceId: " + deviceId)

        //delete the exisiting connected devices
        var iothubResponse = await IotHubMethods.getModuleTwin(iothub, deviceId, 'dicomforwardermodule', sastoken);

        var iotHubConnectedDevices = iothubResponse.data[0].properties.desired.connectedDevices
        if (iotHubConnectedDevices) {
            var payload = { "desired": { "connectedDevices": null } }
            var updateModuleTwinResponse = await IotHubMethods.updateModuleTwinProperties(iothub, deviceId, 'dicomforwardermodule', sastoken, payload)
        }

    });

    test.beforeEach(async function ({ page }) {
        basePage = new BasePage(page);
        customerListPage = new CustomerListPage(page);
        customerDetailsPage = new CustomerDetailsPage(page);
        servicePage = new LogFileRequestPage(page);
    })

    //US#74461
    test('L1 user should be able to to view the list of connectivity module instances for a selected customer in Customer details page @74461', async function ({ page }) {
        var conn = await TestData.sqlDBConnection();
        var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where customerDetailsId in (select customerDetailsId from [dbo].[CustomerDetails]) and activationStatus='True' for json auto")
        var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        var deviceId = deviceRecord[0].iotDeviceId;
        var customerDetailsId = deviceRecord[0].customerDetailsId;
        conn = await TestData.sqlDBConnection();
        var customerDetailsRecordSet = await TestData.executeSqlQuery(conn, "select * from [dbo].[CustomerDetails] where customerdetailsId=" + customerDetailsId + " for json auto")
        var customerDetailsRecord = JSON.parse(customerDetailsRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        var customerId = customerDetailsRecord[0].customerId;
        var customer = customerDetailsRecord[0].customerName;
        console.log("customerId: " + customerId)
        console.log("deviceId: " + deviceId)
        console.log(customer)
        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(customer);
        await customerListPage.selectCustomer(customer);
       
        console.log(await customerDetailsPage.getCustomerButtonText())       
        conn = await TestData.sqlDBConnection();
        var itemsRecordSet = await TestData.executeSqlQuery(conn, "select * from [dbo].[Device] where customerDetailsId='" + customerDetailsId + "' for json auto");
        var items = JSON.parse(itemsRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        var expectedTotalConnectivityModuleInstances = items.length;
        deviceId = items[0].iotDeviceId;

        expect(await customerDetailsPage.getNoOfCMInstances()).toBe(expectedTotalConnectivityModuleInstances);
        expect(await customerDetailsPage.validateCMInstances(items)).not.toBe(false)

        await customerDetailsPage.selectCMInstance(deviceId);

        await customerDetailsPage.selectCMInstanceDevices(deviceId);
        console.log(await customerDetailsPage.getDeviceId());
        expect((await customerDetailsPage.getDeviceId()).includes(deviceId)).toBe(true);
        await customerDetailsPage.selectCMInstanceService(deviceId);
        await expect(await servicePage.getConsoleHeader()).toBeVisible();
        await expect(await servicePage.getLogfileHeader()).toBeVisible();
        await customerDetailsPage.selectCMInstanceStatus(deviceId);
        await expect((await customerDetailsPage.getDeviceId()).includes(deviceId)).toBe(true);
        await customerDetailsPage.navigateToCustomerList();
        await expect(await customerListPage.customerListTable()).toBeVisible();
    });

});
