const { BasePage } = require('../../../pages/base_page.js');
const { CustomerListPage } = require('../../../pages/customer_list_page.js');
const { CmProvisionPage } = require('../../../pages/cm_provision_page.js');
const { TestData } = require('../../../utils/test_data.js');
var OR = require('../../../resources/OR.json');
const { default: test, expect } = require('@playwright/test');
var customerDetailsId,customerId,customerDetailsRecordSet,customerId, customer, conn, provisionedDeviceId, activationKey, deviceCountrecordset, initdeviceCount, newdeviceCount;
var hypervDeviceId = process.env.regularUserHypervDeviceId;
var basePage, customerListPage, cmProvisionPage;
var deviceProvisioning = process.env.isDeviceProvisionEnabled;

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

    // US#355072 US#432252
    test('PR user should be able to login using Provision URL and validate the fields with multilang @355072 @432252', async () => {

        // Navigate to Provision URL
        await basePage.navigateToProvisionUrl("cmprovuser1");

        //validate the fields are displayed
        expect(await cmProvisionPage.isCMProvlabelDisplayed()).toBe(true);
        expect(await cmProvisionPage.compareCMProvlabeltext()).toBe(true);
        expect(await cmProvisionPage.compareOrderIDLabeltext()).toBe(true);
        expect(await cmProvisionPage.compareAgrmntIdLabeltext()).toBe(true);
        expect(await cmProvisionPage.compareSapCustIDLabeltext()).toBe(true);
        expect(await cmProvisionPage.compareEdgeModLabeltext()).toBe(true);
        expect(await cmProvisionPage.compareSubmitLabeltext()).toBe(true);

        //validate placeholder text
        expect(await cmProvisionPage.compareOrderIDPlaceholder()).toBe(true);
        expect(await cmProvisionPage.compareAgrmntIdPlaceholder()).toBe(true);
        expect(await cmProvisionPage.compareSapCustIDPlaceholder()).toBe(true);

        //Validate the modules 
        var modulesUI = await cmProvisionPage.getAllModulesName()
        console.log("Modules listed in Admin portal: " + modulesUI)
        expect(await cmProvisionPage.compareModulesListed(modulesUI)).toBe(true);


        //logout
        await basePage.logout();

    });

});