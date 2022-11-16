const { BasePage } = require('../../../pages/base_page.js');
const { test, expect } = require('@playwright/test');
const { CustomerListPage } = require('../../../pages/customer_list_page.js');
const { CustomerDetailsPage } = require('../../../pages/customer_details_page.js');
const { Comparisions } = require('../../../utils/comparisions.js');
const { TestData } = require('../../../utils/test_data.js');
var OR = require('../../../resources/OR.json');
var basePage, customerListPage, customerDetailsPage,customerId,customer, customerDetailsId,customerDetailsRecordSet,conn;
var testDevice = process.env.serviceUserHypervDeviceId;
var hypervDeviceId = process.env.regularUserHypervDeviceId;

test.describe("Customer Selection", function () {

	test.beforeAll(async function () {
		// test data preparation
		conn = await TestData.sqlDBConnection();
		var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where iotdeviceId = '" + testDevice + "' for json auto")
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


	test.beforeEach(async function ({ page }) {
		basePage = new BasePage(page);
		customerListPage = new CustomerListPage(page);
		customerDetailsPage = new CustomerDetailsPage(page);
	})

	// US#74456
	test('L1 user should be able to navigate to the selected customer details page and back to the customer list page @74456', async function () {
		var conn = await TestData.sqlDBConnection();
		var customerDetailsRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[CustomerDetails] for json auto")
		var customerDetailsRecord = JSON.parse(customerDetailsRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
		var customer = customerDetailsRecord[0].customerName;
		console.log(customer)
		await basePage.navigateToUrl("l1serviceuser");
		// await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP

		//Search a customer and select the customer
		await customerListPage.searchCustomer(customer);
		await customerListPage.selectCustomer(customer);

		//validate the details in customer details page
		var expectedCustomerName;
		if (customer.length <= 30) {
			expectedCustomerName = customer;
		} else {
			expectedCustomerName = customer.substring(0, 17) + "..."
		}

		expect(await customerDetailsPage.getCustomerButtonText()).toEqual(expectedCustomerName);
		await customerDetailsPage.navigateToCustomerList();
		expect(await (await customerListPage.customerListTable()).isVisible()).toEqual(true);
	});

	// US#365566
	test('L1 user should be able to see the customer name, ID and Agreement id after selecting customerin the web ui @365566', async () => {


		// Navigate to Customer list page
		await basePage.navigateToUrl("l1serviceuser");

		//Search a customer and get all the details
		await customerListPage.searchCustomer(customerId);
		var custDetails = await customerListPage.getselectedCustomerdetails(customerId);
		await customerListPage.selectCustomer(customerId);

		//Validate the details before clicking
		expect(await customerDetailsPage.isCustomerButtonTextPresent()).toBe(true)
		expect(await customerDetailsPage.getCustomerButtonText()).toBe(customer)
		expect(await customerDetailsPage.getCustomerbuttonIdtext()).toBe(customerId)
		await customerDetailsPage.clickCustomerbutton();

		//Validate the Labels after clicking
		expect(await customerDetailsPage.compareCustomernameLabel()).toBe(true)
		expect(await customerDetailsPage.compareCustomersapLabel()).toBe(true)
		expect(await customerDetailsPage.compareCustomerIdLabel()).toBe(true)

		//Validate the details after clicking
		expect(await customerDetailsPage.getSapCustomerId()).toBe(custDetails[0])
		expect(await customerDetailsPage.getCustomerName()).toBe(custDetails[1])
		expect(await customerDetailsPage.getAgreementId()).toBe(custDetails[2])
		expect(await customerDetailsPage.ischangeCustomerButtonPresent()).toBe(true)

		//logout
		await basePage.logout();
	});

	// US#365566
	test('Regular user should not be able to see the change customer section in the web ui @365566', async () => {

		// Navigate to url
		await basePage.navigateToUrl("regularuser");

		expect(await customerDetailsPage.isCustomerButtonTextPresent()).toBe(false)

		//logout
		await basePage.logout();
	});

});
