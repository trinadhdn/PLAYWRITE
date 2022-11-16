const { BasePage } = require('../../../pages/base_page.js');
const { test, expect } = require('@playwright/test');
const { LangCustomerListPage } = require('../../../pages/languages/customer_list_page.js');
const { CustomerListPage } = require('../../../pages/customer_list_page.js');
const { TestData } = require('../../../utils/test_data.js');

var basePage, customerListPage, langCustomerListPage;
var customerId, customerName, conn;
test.describe('Multi-language check for Customer List with L1 user', function () {
    test.beforeAll(async function () {
        // test data preparation     
        conn = await TestData.sqlDBConnection();
        var customerDetailsRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[CustomerDetails] for json auto")
        var customerDetailsRecord = JSON.parse(customerDetailsRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        var customerDetailsId = customerDetailsRecord[0].customerDetailsId;
        customerName = customerDetailsRecord[0].customerName;
        customerId = customerDetailsRecord[0].customerId;
        console.log("customerName: " + customerName)
        console.log("customerId: " + customerId)
    });
    test.beforeEach(async function ({ page }) {
        basePage = new BasePage(page);
        customerListPage = new CustomerListPage(page);
        langCustomerListPage = new LangCustomerListPage(page);
    })

    // US#74477
    test('Check Customer screen with Multi Languages @74477', async function () {
        // Navigate to Customer list page
        await basePage.navigateToUrl("l1serviceuser");
        expect(await langCustomerListPage.compareSelectCustomerText()).toEqual(true)
        expect(await langCustomerListPage.compareCustomerNameText()).toEqual(true)
        expect(await langCustomerListPage.compareCustomerIDText()).toEqual(true)
        expect(await langCustomerListPage.compareAgreementIDText()).toEqual(true)
        expect(await langCustomerListPage.compareinfoCustomerlistText()).toEqual(true)
        expect(await langCustomerListPage.comparesearchLeaveText()).toEqual(true)
        await customerListPage.searchCustomer("Invalid input 12380923");
        expect(await langCustomerListPage.noCustomersInfoMessage()).toEqual(true);

    });



});
