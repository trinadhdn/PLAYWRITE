var OR_ML = require('../../resources/OR_ML.json');
var OR = require('../../resources/OR.json');
const { BasePage } = require('../../pages/base_page.js');
var LAN;
let year = new Date().getFullYear();
if (process.env.locale.includes("DE")) {
    LAN = require('../../resources/de.json');
} else if (process.env.locale.includes("FR")) {
    LAN = require('../../resources/fr.json');
}else if (process.env.locale.includes("EN")) {
    LAN = require('../../resources/en.json');
}else if (process.env.locale.includes("ES")) {
    LAN = require('../../resources/es.json');
  }

exports.LangUserProfilePage = class LangUserProfilePage{
    
    constructor(page){
        this.page = page;
        this.basePage = new BasePage(page);
    }
    async compareLogoutText(){
        var actual = await this.page.locator('xpath='+OR_ML.userProfile.labelLogout).innerText();
        var expected = await LAN.logout;
        return (actual == expected);
    }
    
    async compareAboutText(){
        var actual = await this.page.locator('xpath='+OR_ML.userProfile.labelAbout).innerText();
        var expected = await LAN.about;
        return (actual == expected);
    }
      
    async compareImprintText(){
        var actual = await this.page.locator('xpath='+OR_ML.userProfile.labelImprint).innerText();
        var expected = await LAN.imprint;
        return (actual == expected);
    }

    async compareDataProtectionStatementText(){
        var actual = await this.page.locator('xpath='+OR_ML.userProfile.labelDataProtectionStatement).innerText();
        var expected = await LAN.dataProtectionStatement;
        return (actual == expected);
    }
    
    async compareEndUserTermsText(){
        var actual = await this.page.locator('xpath='+OR_ML.userProfile.labelEndUserTerms).innerText();
        var expected = await LAN.endUserTerms;
        return (actual == expected);
    }

    
    async compareThirdPartySoftwareLicensesLabelText(){
        var actual = await this.page.locator('xpath='+OR_ML.userProfile.labelThirdPartySoftwareLicenses).innerText();
        var expected = await LAN.thirdPartyLicenses;
        return (actual == expected);
    }

    async compareStaticTextInThirdPartySoftwareLicensesPopUp(){
        await this.page.waitForTimeout(30000);
        await this.page.waitForSelector('xpath='+OR.locators.userLicense.address, { waitFor: 'visible', timeout:60000})   
        await this.basePage.scrollElemFinderIntoView('xpath='+OR.locators.userLicense.address)
        var actualAddress = (await this.page.locator('xpath='+OR.locators.userLicense.address).innerText()).replace(/\s+/g, '');
        var expectedAddress = (await LAN.address).replace(/\s+/g, '');
        
        var addressResult = (actualAddress.includes(expectedAddress))
        var actualVersion = (await this.page.locator('xpath='+OR.locators.userLicense.versionInThridPartyLicensesStatementPopUp).innerText()).replace(/\s+/g, '');
        var expectedVersion = (await LAN.version).replace(/\s+/g, '');
        var versionResult = (actualVersion.includes(expectedVersion))
        var actualCopyright = await this.page.locator('xpath='+OR.locators.userLicense.copywrightInThridPartyLicensesStatementPopUp).innerText();
        var expectedCopyright = (await LAN.copyright).replace("2021",year);
        var copyrightResult = (actualCopyright.includes(expectedCopyright))
        return [addressResult,versionResult,copyrightResult]
    }

    async compareCopyrightText(){
        var actual = (await this.page.locator("xpath="+OR_ML.userProfile.labelCopyright).innerText()).replace(/\s+/g, '');
        var expected = (await LAN.labelCopyright + " " + year).replace(/\s+/g, '');
        return (actual.includes(expected));
    }


   }
