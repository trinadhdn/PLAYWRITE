const { BasePage } = require('./base_page.js');
var OR = require('../resources/OR.json');
exports.LicensePage = class LicensePage {
  constructor(page){
    this.page = page;
    this.basePage = new BasePage(page);
  }  

  async clickDataProtectionStatement(){
    await this.page.locator('id='+OR.locators.homePage.userButton).click();
    await this.page.waitForTimeout(1000);
     await this.page.locator('id='+OR.locators.homePage.dataProtectionLink).click();
    // await this.page.evaulate('arguments[0].click()', ele);
    await this.page.waitForTimeout(5000);
  }

  async clickEndUserTerms(){
    await this.page.locator('id='+OR.locators.homePage.userButton).click();
    await this.page.waitForTimeout(1000);
    await this.page.locator('id='+OR.locators.homePage.endUserTermsLink).click();
    await this.page.waitForTimeout(5000);
  }

  async clickThirdPartySoftwareLicenses(){
    await this.page.locator('id='+OR.locators.homePage.userButton).click();
    await this.page.waitForTimeout(1000);
    await this.page.locator('id='+OR.locators.homePage.thirdPartySoftwareLicensesLink).click();
    await this.page.waitForTimeout(5000);
  }
 
  async getThirdpartysoftwarelicensesaddress(){
    var thirdpartysoftwarelicensesaddress = 'xpath='+OR.locators.userLicense.address;
    await this.basePage.waitTillElementIsVisible(thirdpartysoftwarelicensesaddress);
    return await this.page.locator(thirdpartysoftwarelicensesaddress).textContent();
  }

  async getVersionNumberinHeader(){
    var versionNumberinHeader = 'xpath='+OR.locators.userLicense.versionInThridPartyLicensesStatementPopUp;
    await this.basePage.waitTillElementIsVisible(versionNumberinHeader);
    return await this.page.locator(versionNumberinHeader).textContent();
  }

  async getVersionNumberinLicenceArea(){
    var VersionNumberinLicenceArea = 'xpath='+OR.locators.userLicense.versionInThridPartyLicensesStatementPopUp_LicenceArea;
    await this.basePage.waitTillElementIsVisible(VersionNumberinLicenceArea);
    return await this.page.locator(VersionNumberinLicenceArea).textContent();
  }
  async getVersionNumberinUserProfilePopup(){
    await this.page.locator('id='+OR.locators.homePage.userButton).click();
    await this.page.waitForTimeout(1000);
    var versionNumberinUserProfilePopup = 'xpath='+OR.locators.userLicense.versionNumberinUserProfilePopup;
    await this.basePage.waitTillElementIsVisible(versionNumberinUserProfilePopup);
    return await this.page.locator(versionNumberinUserProfilePopup).textContent();
  }
};
