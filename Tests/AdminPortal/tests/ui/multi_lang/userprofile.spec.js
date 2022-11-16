const { BasePage } = require('../../../pages/base_page.js');
const { LangUserProfilePage } = require('../../../pages/languages/user_profile_page.js');
const { HomePage } = require('../../../pages/home_page.js');
const { LicensePage} = require('../../../pages/license_page.js');
const { CustomerDetailsStatusPage } = require("../../../pages/customer_details_status_page.js");
const { test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
var customerId, customerName, conn,deviceId,customerDetailsId,StatusPage_ML,customerListPage;
var testDevice = process.env.serviceUserHypervDeviceId;
var basePage,langUserProfilePage, licensePage, homePage;
test.describe('Multi-language check for User profile with L1 user', function (){
  
  test.beforeEach(async function({page}){
    basePage = new BasePage(page);
    homePage = new HomePage(page);
    langUserProfilePage = new LangUserProfilePage(page);
    licensePage = new LicensePage(page);
})
    
    // US#177466 US#307707
    test('Check user profile options with Multi Languages @177466 @307707 @326276', async function (){
    // Navigate to Customer list page
        await basePage.navigateToUrl("l1serviceuser");
        await homePage.clickUserProfile();
        expect(await langUserProfilePage.compareLogoutText()).toBe(true);
        expect(await langUserProfilePage.compareAboutText()).toBe(true);
        expect(await langUserProfilePage.compareImprintText()).toBe(true);
        expect(await langUserProfilePage.compareDataProtectionStatementText()).toBe(true);
        expect(await langUserProfilePage.compareEndUserTermsText()).toBe(true);
        expect(await langUserProfilePage.compareThirdPartySoftwareLicensesLabelText()).toBe(true);
        expect(await langUserProfilePage.compareCopyrightText()).toBe(true);
        await homePage.clickUserProfile();
        await licensePage.clickThirdPartySoftwareLicenses();
        expect(await langUserProfilePage.compareStaticTextInThirdPartySoftwareLicensesPopUp()).not.toContain(false);

    });
    
   
	
});
