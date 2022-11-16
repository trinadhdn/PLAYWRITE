const { BasePage } = require('../../../pages/base_page.js');
const { Comparisions } = require('../../../utils/comparisions.js');
const { CustomerListPage } = require('../../../pages/customer_list_page.js');
const { TestData } = require('../../../utils/test_data.js');
var OR = require('../../../resources/OR.json');
const { default: test, expect } = require('@playwright/test');
const { TokenGenerators } = require('../../../utils/token_generators.js')
var customerId, customerName, conn;
test.describe('Customer List with L1 user', () => {
    var basePage, customerListPage;
    test.beforeAll(async () => {
        conn = await TestData.sqlDBConnection();
        var customerDetailsRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[CustomerDetails] for json auto")
        var customerDetailsRecord = JSON.parse(customerDetailsRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        var customerDetailsId = customerDetailsRecord[0].customerDetailsId;
        customerName = customerDetailsRecord[0].customerName;
        customerId = customerDetailsRecord[0].customerId;
        console.log("customerName: " + customerName)
        console.log("customerId: " + customerId)
    });

    test.beforeEach(async ({ page }) => {
        basePage = new BasePage(page);
        customerListPage = new CustomerListPage(page);
    })

    // US#74477 US#355070
    test('L1 user should be able to filter the customer list based on Customer Id and reset the filter @74477 @355070', async () => {
        // Navigate to Customer list page
        await basePage.navigateToUrl("l1serviceuser");

        //verify the columns in customer list table - co
        var expectedColumns = ['Customer ID', 'Customer name', 'Agreement ID'];
        var actualColumns = await customerListPage.customerListTableColumns();
        var comp = await Comparisions.compareObjects(actualColumns, expectedColumns)
        expect(comp).toBe(true);

        //verify the filter for Customer Id and the rows shown are the customers with the filtered customer Id
        var totalCustomers = await customerListPage.totalCustomerRows();
        await customerListPage.searchCustomer(customerId);
        //After applying the filter, compare the no.of rows(all the filtered rows) shown with the no.of.rows containing the filtered value
        expect(await customerListPage.totalCustomerRows()).toEqual(await customerListPage.noOfCustomerRowsWithFilter(customerId))

        //verify reset filter
        await customerListPage.resetCustomerSearch();
        var customerCountAfterReset = await customerListPage.totalCustomerRows();
        expect(await customerListPage.getSearchFilterValue()).toBe("");
        await expect(await customerListPage.customerSearchButton()).toBeVisible();
        //Compare the total rows before filtering and the rows after reset
        expect(totalCustomers).toEqual(customerCountAfterReset);
    });

    // US#74477 US#355070
    test('L1 user should be able to filter the customer list based on Customer Name and reset the filter @74477 @355070', async () => {
        // Navigate to Customer list page
        await basePage.navigateToUrl("l1serviceuser");

        //verify the filter for Customer Id and the rows shown are the customers with the filtered customer Id
        var totalCustomers = await customerListPage.totalCustomerRows();
        await customerListPage.searchCustomer(customerName);
        //After applying the filter, compare the no.of rows(all the filtered rows) shown with the no.of.rows containing the filtered value
        expect(await customerListPage.totalCustomerRows()).toEqual(await customerListPage.noOfCustomerRowsWithFilter(customerName))

        //verify reset filter
        await customerListPage.resetCustomerSearch();
        var customerCountAfterReset = await customerListPage.totalCustomerRows();
        expect(await customerListPage.getSearchFilterValue()).toBe("");
        await expect(await customerListPage.customerSearchButton()).toBeVisible();
        //Compare the total rows before filtering and the rows after reset
        expect(totalCustomers).toEqual(customerCountAfterReset);
    });

    // US#74477 US#355070
    test('L1 user should see an informational message when there are no entries for the search item @74477 @355070', async () => {
        // Navigate to Customer list page
        await basePage.navigateToUrl("l1serviceuser");
        // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP

        // Search an invalid text
        await customerListPage.searchCustomer("Invalid input 12380923");
        expect((await customerListPage.noCustomersInfoMessage()).includes("Invalid input 12380923")).toBe(true);
    });

    // US#74477 US#355070
    test('L1 user should be able to see the complete customer list when filters are not applied @74477 @355070', async () => {
        //test data preparation
        var apimCustomerListURL = process.env.apimBaseURL + OR.APIUrls.customerListUrl;
        var token = await TokenGenerators.generateAuthToken("l1serviceuser");
        var config = {
            method: 'get',
            url: apimCustomerListURL,
            headers: { "Authorization": "Bearer " + token },
        };

        var response = await TokenGenerators.request(config);
        var apiData = await response.data

        // Navigate to Customer list page
        await basePage.navigateToUrl("l1serviceuser");
        // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP


        var customerListTable = await customerListPage.customerListTable();
        expect(await customerListPage.validateCustomerListTableData(customerListTable, apiData)).not.toContain(false)

    });
});
