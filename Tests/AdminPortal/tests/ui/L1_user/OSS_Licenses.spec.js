var basePage = require('../../../pages/base_page.js');
var licensePage = require('../../../pages/license_page.js');
var homePage = require('../../../pages/home_page.js');
const { BasePage } = require('../../../pages/base_page.js');
const { LicensePage } = require('../../../pages/license_page');
const { HomePage } = require('../../../pages/home_page');

const { test, expect } = require('@playwright/test');
var basePage, licensePage, homePage;
var LAN;
if (process.env.locale.includes("DE")) {
    LAN = require('../../../resources/de.json');
} else if (process.env.locale.includes("FR")) {
    LAN = require('../../../resources/fr.json');
} else if (process.env.locale.includes("EN")) {
    LAN = require('../../../resources/en.json');
} else if (process.env.locale.includes("ES")) {
    LAN = require('../../../resources/es.json');
} else {
    LAN = require('../../../resources/en.json');
}

test.describe('Checking the License statement with L1 user ', function () {

	test.beforeEach(async function ({ page }) {
		basePage = new BasePage(page);
		licensePage = new LicensePage(page);
		homePage = new HomePage(page);

	})


	// US#98432
	test('L1 user should be able to check the Data Protection Statement @98432', async function ({ page }) {
		await basePage.navigateToUrl("l1serviceuser");
		expect(await basePage.verifyloggedInUsername("l1serviceuser")).toEqual(true);
		// await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
		await licensePage.clickDataProtectionStatement();
		var expectedUrl = await homePage.getNewTabUrl();
		console.log("expected url " + expectedUrl)
		console.log(expectedUrl.includes("vaURL=www.zeiss.com/data-protection"))
		await expect(expectedUrl.includes("vaURL=www.zeiss.com/data-protection")).toEqual(true);
	});

	test('L1 user should be able to check the End User Terms @98432', async function ({ page }) {
		await basePage.navigateToUrl("l1serviceuser");
		expect(await basePage.verifyloggedInUsername("l1serviceuser")).toEqual(true);
		// await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
		await licensePage.clickEndUserTerms();
		var expectedUrl = await homePage.getNewTabUrl();
		console.log("expected url " + expectedUrl)
		console.log(expectedUrl.includes("vaURL=www.zeiss.com/legal-notice"));
		await expect(expectedUrl.includes("vaURL=www.zeiss.com/legal-notice")).toEqual(true);
	});

	test('L1 user should be able to check the Third party software licenses and version number @397686 @98432', async function ({ page }) {
		await basePage.navigateToUrl("l1serviceuser");
		
		expect(await basePage.verifyloggedInUsername("l1serviceuser")).toEqual(true);
		
		// await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
		await licensePage.clickThirdPartySoftwareLicenses();
		var addressStatement = (await licensePage.getThirdpartysoftwarelicensesaddress()).toString();
		var expectedStatement =LAN.address;
		expect(addressStatement).toEqual(expectedStatement);

		// check for version number to be 1.2.0 in the popup 
		var versionNumber = (await licensePage.getVersionNumberinHeader()).toString().replace(/(\r\n|\n|\r)/gm, "");;
		var expectedversionNumber = LAN.version;
		expect(versionNumber).toEqual(expectedversionNumber);

		// check for version number to be 1.2.0 in the popup in the FOSS licence area 
		var versionNumberinLicenceArea = (await licensePage.getVersionNumberinLicenceArea()).toString().replace(/(\r\n|\n|\r)/gm, "");;
		var expectedversionNumberinLicenceArea =LAN.headerLicense.replace(/(\r\n|\n|\r)/gm, "");;;
		expect(versionNumberinLicenceArea).toEqual(expectedversionNumberinLicenceArea);

	});

	test('L1 user should be able to check the version number at User profile popup @397686', async function ({ page }) {
		await basePage.navigateToUrl("l1serviceuser");
		var versionNumberinUserProfilePopup = (await licensePage.getVersionNumberinUserProfilePopup()).toString().replace(/(\r\n|\n|\r)/gm, "");;
		var expectedversionNumberinUserProfilePopup =LAN.hdpVersion + " " +LAN.hdpCopyright
		expect(versionNumberinUserProfilePopup.trim()).toEqual(expectedversionNumberinUserProfilePopup);
		
	});
});
