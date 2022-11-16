const { BasePage } = require('../../../pages/base_page.js');
const { HomePage } = require('../../../pages/home_page.js');
const { test, expect } = require('@playwright/test');
var OR = require('../../../resources/OR.json');
var basePage, homePage

test.describe('Imprint page', function () {

    test.beforeEach(async function ({ page }) {
        basePage = new BasePage(page);
        homePage = new HomePage(page);
    })

    //US#98435
    test('L1 user should be able to successfully navigate to Imprint page @98435', async function () {
        await basePage.navigateToUrl("l1serviceuser");
        expect(await basePage.verifyloggedInUsername("l1serviceuser")).toEqual(true);
        // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
        await homePage.clickPublisher();
        var expectedUrl = await homePage.getNewTabUrl();
        expect(expectedUrl).toEqual("https://www.zeiss.com/corporate/int/legal-information/publisher.html");


    });

});
