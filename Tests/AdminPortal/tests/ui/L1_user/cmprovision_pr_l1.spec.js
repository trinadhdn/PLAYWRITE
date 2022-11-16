const { BasePage } = require('../../../pages/base_page.js');
const { Comparisions } = require('../../../utils/comparisions.js');
const { CustomerListPage } = require('../../../pages/customer_list_page.js');
const { CmProvisionPage } = require('../../../pages/cm_provision_page.js');
const { TestData } = require('../../../utils/test_data.js');
var OR = require('../../../resources/OR.json');
const { default: test, expect } = require('@playwright/test');
const { TokenGenerators } = require('../../../utils/token_generators.js')
var customerId, customer,customerDetailsId,customerDetailsRecordSet, conn, provisionedDeviceId, activationKey, deviceCountrecordset, initdeviceCount, newdeviceCount;
var hypervDeviceId = process.env.regularUserHypervDeviceId;
var basePage, customerListPage, cmProvisionPage;
var deviceProvisioning = process.env.isDeviceProvisionEnabled;
var currentEnv = process.env.env;
if (currentEnv == 'dev') {
    currentEnv = 'DEV'
} else if (currentEnv == 'qa') {
    currentEnv = 'QA'
} else if (currentEnv == 'stg') {
    currentEnv = 'STAGE'
} else if (currentEnv == 'uat') {
    currentEnv = 'UAT'
} else if (currentEnv == 'ppd') {
    currentEnv = 'PRE-PROD'
} else if (currentEnv == 'prd') {
    currentEnv = 'PROD'
}

test.describe('Customer List with L1 user', () => {
    test.beforeAll(async () => {
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
        console.log("customer: " + customer)

    });

    test.beforeEach(async ({ page }) => {
        basePage = new BasePage(page);
        customerListPage = new CustomerListPage(page);
        cmProvisionPage = new CmProvisionPage(page);

        conn = await TestData.sqlDBConnection();
        deviceCountrecordset = await TestData.executeSqlQuery(conn, "select count(*) as countd from dbo.Device where customerdetailsId='" + customerDetailsId + "' ")
        initdeviceCount = deviceCountrecordset['recordset'][0].countd;
        console.log("Initial Device count: " + initdeviceCount)
    })

    // US#355072
    test('PR-L1 user should be able to login using Provision URL and validate the fields @355072 ', async () => {

        // Navigate to Provision URL
        await basePage.navigateToProvisionUrl("cmprovuserl1");

        //validate the fields are displayed
        expect(await cmProvisionPage.isCMProvlabelDisplayed()).toBe(true);
        expect(await cmProvisionPage.compareCMProvlabeltext()).toBe(true);
        expect((await cmProvisionPage.getCMProvEnv()).includes(currentEnv)).toBe(true);
        expect(await cmProvisionPage.compareOrderIDLabeltext()).toBe(true);
        expect(await cmProvisionPage.compareAgrmntIdLabeltext()).toBe(true);
        expect(await cmProvisionPage.compareSapCustIDLabeltext()).toBe(true);
        expect(await cmProvisionPage.compareEdgeModLabeltext()).toBe(true);
        expect(await cmProvisionPage.compareSubmitLabeltext()).toBe(true);

        //validate placeholder text
        expect(await cmProvisionPage.compareOrderIDPlaceholder()).toBe(true);
        expect(await cmProvisionPage.compareAgrmntIdPlaceholder()).toBe(true);
        expect(await cmProvisionPage.compareSapCustIDPlaceholder()).toBe(true);


        //logout
        await basePage.logout();

    });

    // US#355072
    test('PR-L1 user should be able to Provision new device with selected modules for valid customerID @355072 ', async () => {
        if (deviceProvisioning == 'true') {
            var edgeModules = ["DICOM Forwarder", "Streaming", "Smart Services 1.0", "Smart Services 2.0", "ZVI",]
            var orderId = await CmProvisionPage.createRandomID(5)
            var sapID = await CmProvisionPage.createRandomID(9)
            // Navigate to Provision URL
            await basePage.navigateToProvisionUrl("cmprovuserl1");

            //Enter the deils for all the fields
            await cmProvisionPage.enterOrderID(orderId);
            await cmProvisionPage.enterAgrmntId(customerId);
            await cmProvisionPage.enterSapCustID(sapID);
            for (var k = 0; k < edgeModules.length; k++) {
                await cmProvisionPage.selectEdgeModule(edgeModules[k]);
            }
            await cmProvisionPage.clickSubmit();

            // get the device id and activation key
            provisionedDeviceId = await cmProvisionPage.getNewDeviceId();
            activationKey = await cmProvisionPage.getNewActivationKey();

            //get the current count of device
            conn = await TestData.sqlDBConnection();
            deviceCountrecordset = await TestData.executeSqlQuery(conn, "select count(*) as countd from dbo.Device where customerdetailsId='" + customerDetailsId + "' ")
            newdeviceCount = deviceCountrecordset['recordset'][0].countd;
            console.log("New Device count: " + newdeviceCount)
            expect(newdeviceCount).toBe(initdeviceCount + 1)

            //match the device details with db
            conn = await TestData.sqlDBConnection();
            var devicesRecordSet = await TestData.executeSqlQuery(conn, "select * from [dbo].[Device] where iotdeviceId = '" + provisionedDeviceId + "' for json auto")
            var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
            var dbactivationKey = deviceRecord[0].activationKey;
            expect(activationKey).toBe(dbactivationKey)
            console.log("Activation Key : " + activationKey)
        }
        else {
            expect(true).toEqual(true);
            console.log("Bypassed device provisioning test as value for isDeviceProvisioningTestsEnabled is set to false")
        }

    });

    // US#355072
    test('PR-L1 user should be able to Provision new device without selecting additional modules for valid customerID @355072 ', async () => {
        if (deviceProvisioning == 'true') {
            var orderId = await CmProvisionPage.createRandomID(5)
            var sapID = await CmProvisionPage.createRandomID(9)
            // Navigate to Provision URL
            await basePage.navigateToProvisionUrl("cmprovuserl1");

            //Enter the deils for all the fields
            await cmProvisionPage.enterOrderID(orderId);
            await cmProvisionPage.enterAgrmntId(customerId);
            await cmProvisionPage.enterSapCustID(sapID);
            await cmProvisionPage.clickSubmit();

            // get the device id and activation key
            provisionedDeviceId = await cmProvisionPage.getNewDeviceId();
            activationKey = await cmProvisionPage.getNewActivationKey();

            //get the current count of device
            conn = await TestData.sqlDBConnection();
            deviceCountrecordset = await TestData.executeSqlQuery(conn, "select count(*) as countd from dbo.Device where customerdetailsId='" + customerDetailsId + "' ")
            newdeviceCount = deviceCountrecordset['recordset'][0].countd;
            console.log("New Device count: " + newdeviceCount)
            expect(newdeviceCount).toBe(initdeviceCount + 1)

            //match the device details with db
            conn = await TestData.sqlDBConnection();
            var devicesRecordSet = await TestData.executeSqlQuery(conn, "select * from [dbo].[Device] where iotdeviceId = '" + provisionedDeviceId + "' for json auto")
            var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
            var dbactivationKey = deviceRecord[0].activationKey;
            expect(activationKey).toBe(dbactivationKey)
            console.log("Activation Key : " + activationKey)
        }
        else {
            expect(true).toEqual(true);
            console.log("Bypassed device provisioning test as value for isDeviceProvisioningTestsEnabled is set to false")
        }

    });

    // US#355072
    test('PR-L1 user should be able to Provision new device without SAP ID for valid customerID @355072 ', async () => {
        if (deviceProvisioning == 'true') {
            var orderId = await CmProvisionPage.createRandomID(5)
            var sapID = await CmProvisionPage.createRandomID(9)
            // Navigate to Provision URL
            await basePage.navigateToProvisionUrl("cmprovuserl1");

            //Enter the deils for all the fields
            await cmProvisionPage.enterOrderID(orderId);
            await cmProvisionPage.enterAgrmntId(customerId);
            await cmProvisionPage.clickSubmit();

            // get the device id and activation key
            provisionedDeviceId = await cmProvisionPage.getNewDeviceId();
            activationKey = await cmProvisionPage.getNewActivationKey();

            //get the current count of device
            conn = await TestData.sqlDBConnection();
            deviceCountrecordset = await TestData.executeSqlQuery(conn, "select count(*) as countd from dbo.Device where customerdetailsId='" + customerDetailsId + "' ")
            newdeviceCount = deviceCountrecordset['recordset'][0].countd;
            console.log("New Device count: " + newdeviceCount)
            expect(newdeviceCount).toBe(initdeviceCount + 1)

            //match the device details with db
            conn = await TestData.sqlDBConnection();
            var devicesRecordSet = await TestData.executeSqlQuery(conn, "select * from [dbo].[Device] where iotdeviceId = '" + provisionedDeviceId + "' for json auto")
            var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
            var dbactivationKey = deviceRecord[0].activationKey;
            expect(activationKey).toBe(dbactivationKey)
            console.log("Activation Key : " + activationKey)
        }
        else {
            expect(true).toEqual(true);
            console.log("Bypassed device provisioning test as value for isDeviceProvisioningTestsEnabled is set to false")
        }

    });

    // US#355072
    test('PR-L1 user should NOT be able to Provision new device without Order ID or Agreement ID @355072 ', async () => {

        // Navigate to Provision URL
        await basePage.navigateToProvisionUrl("cmprovuserl1");

        //Enter blank order ID
        await cmProvisionPage.enterOrderID("");
        await cmProvisionPage.compareOrderIdReqError();

        //Enter spaces order ID
        await cmProvisionPage.enterOrderID("        ");
        await cmProvisionPage.compareOrderIdReqError();

        //Enter blank Agreement ID
        await cmProvisionPage.enterAgrmntId("");
        await cmProvisionPage.compareAgreemntIdReqError();

        //logout
        await basePage.logout();

    });

    // US#355072
    test('PR-L1 user should NOT be able to Provision new device directly clicking on Submit button without any details @355072 ', async () => {

        // Navigate to Provision URL
        await basePage.navigateToProvisionUrl("cmprovuserl1");
        // click on submit
        await cmProvisionPage.clickSubmit();

        //Validate the error
        await cmProvisionPage.compareOrderIdReqError();
        await cmProvisionPage.compareAgreemntIdReqError();

        //logout
        await basePage.logout();

    });

    // US#355072
    test('PR-L1 user should NOT be able to Provision new device with invalid Agreement ID @355072 ', async () => {


        var agreementid = "Aggrjgh" + await CmProvisionPage.createRandomID(8)

        // Navigate to Provision URL
        await basePage.navigateToProvisionUrl("cmprovuserl1");

        //Enter invalid Agreement ID
        await cmProvisionPage.enterAgrmntId(agreementid);
        await cmProvisionPage.compareAgreemntIdInvalError();

        //logout
        await basePage.logout();

    });

    // US#355072 
    test('PR-L1 user should NOT be able to Provision new device with valid but incorrect Agreement ID @355072 ', async () => {

        var orderId = await CmProvisionPage.createRandomID(5)
        var sapID = await CmProvisionPage.createRandomID(9)
        var agreementid = await CmProvisionPage.createRandomID(8)

        // Navigate to Provision URL
        await basePage.navigateToProvisionUrl("cmprovuserl1");

        //Enter the deils for all the fields
        await cmProvisionPage.enterOrderID(orderId);
        await cmProvisionPage.enterAgrmntId(agreementid);
        expect(await cmProvisionPage.isAgreemntIdErrorDisplayed()).toBe(false);
        await cmProvisionPage.enterSapCustID(sapID);
        await cmProvisionPage.selectEdgeModule("DICOM Forwarder");
        await cmProvisionPage.clickSubmit();
        expect(await cmProvisionPage.isDialogBoxDisplayed()).toBe(false)

        //get the current count of device
        conn = await TestData.sqlDBConnection();
        deviceCountrecordset = await TestData.executeSqlQuery(conn, "select count(*) as countd from dbo.Device where customerdetailsId='" + customerDetailsId + "' ")
        newdeviceCount = deviceCountrecordset['recordset'][0].countd;
        console.log("New Device count: " + newdeviceCount)
        expect(newdeviceCount).toBe(initdeviceCount)

        //logout
        await basePage.logout();

    });

    // US#355072
    test('PR-L1 user should NOT be able to see the device Location in the sidebar @355072 ', async () => {

        // Navigate to Provision URL
        await basePage.navigateToProvisionUrl("cmprovuserl1");

        // Verify Device Location is not visible
        expect(await cmProvisionPage.idDeviceLocationDisplayed()).toBe(false)

        //logout
        await basePage.logout();

    });

    // US#355072
    test('PR-L1 user should NOT be able to uncheck the Management module selection @355072 ', async () => {

        // Navigate to Provision URL
        await basePage.navigateToProvisionUrl("cmprovuserl1");

        //validate management module
        expect(await cmProvisionPage.isManagementSelected()).toBe(true);
        expect(await cmProvisionPage.isManagementEnabled()).not.toBeNull();

        //logout
        await basePage.logout();

    });


});