const { BasePage } = require('./base_page.js');
var OR = require('../resources/OR.json');
var LAN;
if (process.env.locale.includes("DE")) {
    LAN = require('../resources/de.json');
} else if (process.env.locale.includes("FR")) {
    LAN = require('../resources/fr.json');
}else if (process.env.locale.includes("EN")) {
    LAN = require('../resources/en.json');
}else if (process.env.locale.includes("ES")) {
    LAN = require('../resources/es.json');
}else{
    LAN = require('../resources/en.json');
}
exports.HomePage = class HomePage {

    constructor(page){
        this.page = page;
        this.basePage = new BasePage(page);
    }  
    async clickSettings(){
        await this.page.locator('id='+OR.locators.homePage.settingsButton).click();
        await this.page.waitForTimeout(3000);
    }
    async clickPublisher(){
        await this.page.locator('id='+OR.locators.homePage.userButton).click();
        await this.page.locator('id='+OR.locators.homePage.imprintLink).click();
        await this.page.waitForTimeout(3000);     
    }

    async clickUserButton(){
        await this.page.waitForTimeout(3000);
        await this.page.locator('id='+OR.locators.homePage.userButton).click();
        await this.page.waitForTimeout(3000);
    }

    async clickDeviceLocations(){       
        await this.page.locator('xpath='+OR.locators.homePage.deviceLocationsXpath).click();
        await this.page.waitForTimeout(3000);  
    }

    async comparedeviceLocationsAction_LabelText(){
        var actual = await  this.page.locator('xpath='+OR.locators.homePage.deviceLocationsXpath).innerText();
        var expected = await LAN.deviceLocations;
        return (actual.trim() == expected);
    }

    async isDeviceLocationsActionVisible() {
        await this.page.waitForTimeout(3000);
        try {
            return await this.page.locator('xpath='+OR.locators.homePage.deviceLocationsXpath).isVisible();
        } catch (error) {
            return false
        }
     }

    async getNewTabUrl(){
        await this.page.waitForTimeout(15000);
        var count = await this.page.context().pages().length;
        while (count <= 1) {
            count = await this.page.context().pages().length;
        }
        var page2 = await this.page.context().pages()[1];
        return (await page2.url());
    }

    async usernameInput(){
        return await this.page.locator('id='+OR.locators.loginPage.usernameInput);
               
    }

    async clickUserProfile(){
        await this.page.locator('id='+OR.locators.homePage.userButton).click();
        await this.page.waitForTimeout(1000);
      }
    
}