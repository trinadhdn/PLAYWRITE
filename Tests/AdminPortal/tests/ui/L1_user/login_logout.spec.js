const { BasePage } = require('../../../pages/base_page.js');
const { test, expect } = require('@playwright/test');
var OR = require('../../../resources/OR.json');


var basePage;

test.describe('Connectivity Module List', function () {
	test.beforeEach(async function ({ page }) {
		basePage = new BasePage(page);

	})
	//US#74446
	test('L1 user should be able to successfully login and logout of the Connectivity Module Web UI @74446', async function ({ page }) {
		await basePage.navigateToUrl("l1serviceuser");
		expect(await basePage.verifyloggedInUsername("l1serviceuser")).toEqual(true);
		// await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
		await basePage.logout();
		await expect(await basePage.logoutButton()).toBeVisible();

	});

});

