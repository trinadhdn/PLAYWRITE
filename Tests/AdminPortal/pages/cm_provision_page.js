var OR = require('../resources/OR.json');
const { Comparisions } = require('../utils/comparisions.js');
const { BasePage } = require('../pages/base_page.js');
const { expect } = require('@playwright/test');
var LAN;
if (process.env.locale.includes("DE")) {
    LAN = require('../resources/de.json');
} else if (process.env.locale.includes("EN")) {
    LAN = require('../resources/en.json');
} else if (process.env.locale.includes("ES")) {
    LAN = require('../resources/es.json');
} else {
    LAN = require('../resources/en.json');
}

exports.CmProvisionPage = class CmProvisionPage {

    constructor(page) {
        this.page = page;
        this.basePage = new BasePage(page);

    }
    async isCMProvlabelDisplayed() {

        await this.page.waitForTimeout(3000);
        try {
            var isdisplayed = await this.page.locator('id=' + OR.locators.cmProvisioningPage.cmProvisioningHeader).isVisible();
            return isdisplayed;
        } catch (error) {
            return false
        }
    }

    async compareCMProvlabeltext() {
        await this.page.waitForSelector('id=' + OR.locators.cmProvisioningPage.cmProvisioningHeader, { waitFor: 'visible', timeout: 60000 })
        var actual = (await this.page.innerHTML('id=' + OR.locators.cmProvisioningPage.cmProvisioningHeader)).trim();
        var expected = LAN.cmProvisioningTitle;
        return (actual == expected);
    }

    async getCMProvEnv() {
        await this.page.waitForSelector('id=' + OR.locators.cmProvisioningPage.cmProvisioningEnv, { waitFor: 'visible', timeout: 60000 })
        var env = (await this.page.innerHTML('id=' + OR.locators.cmProvisioningPage.cmProvisioningEnv)).trim();
        return env;
    }

    async compareOrderIDLabeltext() {
        await this.page.waitForSelector('id=' + OR.locators.cmProvisioningPage.cmProvOrderIDLabel, { waitFor: 'visible', timeout: 60000 })
        var actual = (await this.page.innerHTML('id=' + OR.locators.cmProvisioningPage.cmProvOrderIDLabel)).trim();
        var expected = LAN.cmProvisioningOrderIdTitle;
        return (actual == expected);
    }

    async compareOrderIDPlaceholder() {
        await this.page.waitForSelector('id=' + OR.locators.cmProvisioningPage.cmProvOrderIDVal, { waitFor: 'visible', timeout: 60000 })
        var actual = (await this.page.locator('id=' + OR.locators.cmProvisioningPage.cmProvOrderIDVal).getAttribute('data-placeholder')).trim();
        var expected = LAN.cmProvisioningOrderIdPlaceholder;
        return (actual == expected);
    }

    async compareAgrmntIdLabeltext() {
        await this.page.waitForSelector('id=' + OR.locators.cmProvisioningPage.cmProvAgreementIDLabel, { waitFor: 'visible', timeout: 60000 })
        var actual = (await this.page.innerHTML('id=' + OR.locators.cmProvisioningPage.cmProvAgreementIDLabel)).trim();
        var expected = LAN.cmProvisioningAgreementIdTitle;
        return (actual == expected);
    }

    async compareAgrmntIdPlaceholder() {
        await this.page.waitForSelector('id=' + OR.locators.cmProvisioningPage.cmProvAgreementIDVal, { waitFor: 'visible', timeout: 60000 })
        var actual = (await this.page.locator('id=' + OR.locators.cmProvisioningPage.cmProvAgreementIDVal).getAttribute('data-placeholder')).trim();
        var expected = LAN.cmProvisioningAgreementIdPlaceholder;
        return (actual == expected);
    }
    async compareSapCustIDLabeltext() {
        await this.page.waitForSelector('id=' + OR.locators.cmProvisioningPage.cmProvsapCustIDLabel, { waitFor: 'visible', timeout: 60000 })
        var actual = (await this.page.innerHTML('id=' + OR.locators.cmProvisioningPage.cmProvsapCustIDLabel)).trim();
        var expected = LAN.cmProvisioningSapCustomerIdTitle;
        return (actual == expected);
    }

    async compareSapCustIDPlaceholder() {
        await this.page.waitForSelector('id=' + OR.locators.cmProvisioningPage.cmProvsapCustIDVal, { waitFor: 'visible', timeout: 60000 })
        var actual = (await this.page.locator('id=' + OR.locators.cmProvisioningPage.cmProvsapCustIDVal).getAttribute('data-placeholder')).trim();
        var expected = LAN.cmProvisioningSapCustomerId;
        return (actual == expected);
    }

    async compareEdgeModLabeltext() {
        await this.page.waitForSelector('id=' + OR.locators.cmProvisioningPage.edgeModuleLabel, { waitFor: 'visible', timeout: 60000 })
        var actual = (await this.page.innerHTML('id=' + OR.locators.cmProvisioningPage.edgeModuleLabel)).trim();
        var expected = LAN.cmProvisioningModulesTitle;
        return (actual == expected);
    }

    async compareSubmitLabeltext() {
        await this.page.waitForSelector('xpath=' + OR.locators.cmProvisioningPage.submitButton, { waitFor: 'visible', timeout: 60000 })
        var actual = (await this.page.innerHTML('xpath=' + OR.locators.cmProvisioningPage.submitButton)).trim();
        var expected = LAN.cmProvisioningSubmit;
        return (actual == expected);
    }

    async getAllModulesName() {
        var moduleNames = await this.page.$$('xpath=' + OR.locators.cmProvisioningPage.allmodules);
        var modules = [];
        var len = moduleNames.length
        for (var i = 0; i < len; i++) {
            var text = (await moduleNames[i].textContent()).trim()
            modules.push(text ? text : "null");
        }
        return modules;
    }

    async compareModulesListed(modules) {
        var actualmodules = modules;
        var mod1 = LAN.cmProvisioningModulesManagement;
        var mod2 = LAN.cmProvisioningModulesDF;
        var mod3 = LAN.cmProvisioningModulesZV;
        var mod4 = LAN.cmProvisioningModulesZR;
        var mod5 = LAN.cmProvisioningModulesZS;
        var mod6 = LAN.cmProvisioningModulesST;
        var expectedmodules = [mod1,mod2,mod3,mod4,mod5,mod6]
        var comp = await Comparisions.compareObjects(actualmodules, expectedmodules)
        return comp;
    }

    async enterOrderID(orderId) {
        var field = await this.page.locator('id=' + OR.locators.cmProvisioningPage.cmProvOrderIDVal)
        await field.fill(orderId);
        await this.page.keyboard.press('Tab');

    }

    async enterAgrmntId(agreementid) {
        var field = await this.page.locator('id=' + OR.locators.cmProvisioningPage.cmProvAgreementIDVal)
        await field.fill(agreementid);
        await this.page.keyboard.press('Tab');
    }

    async enterSapCustID(sapId) {
        var field = await this.page.locator('id=' + OR.locators.cmProvisioningPage.cmProvsapCustIDVal)
        await field.fill(sapId);
        await field.press('Enter');
    }

    async isManagementSelected() {
        var checkBoxval = await this.page.locator('xpath=' + OR.locators.cmProvisioningPage.edgeModuleManagement).getAttribute('value')
        return Boolean(checkBoxval);

    }
    async isManagementEnabled() {
        var enabled = await this.page.locator('xpath=' + OR.locators.cmProvisioningPage.edgeModuleManagement).getAttribute('disabled')
        return enabled;

    }

    async selectEdgeModule(module) {
        var checkBox;
        switch (module) {
            case 'DICOM Forwarder':
                checkBox = await this.page.locator('css=zui-checkbox#cm-provisioning-module-df svg#checkbox')
                await checkBox.click();
                break;

            case 'ZVI':
                checkBox = await this.page.locator('css=zui-checkbox#cm-provisioning-module-zv svg#checkbox')
                await checkBox.click();
                break;

            case 'Smart Services 1':
                checkBox = await this.page.locator('css=zui-checkbox#cm-provisioning-module-zr svg#checkbox')
                await checkBox.click();
                break;

            case 'Smart Services 2':
                checkBox = await this.page.locator('css=zui-checkbox#cm-provisioning-module-zs svg#checkbox')
                await checkBox.click();
                break;

            case 'Streaming':
                checkBox = await this.page.locator('css=zui-checkbox#cm-provisioning-module-st svg#checkbox')
                await checkBox.click();
                break;

        }
    }

    async clickSubmit() {
        await this.page.locator('xpath=' + OR.locators.cmProvisioningPage.submitButton).click();
        await this.page.waitForTimeout(10000);
        var loadSpinner = 'xpath=' + OR.locators.cmProvisioningPage.loadSpinner
        await this.basePage.waitTillElementIsInvisible(loadSpinner)

    }

    async isDialogBoxDisplayed() {
        try {
            var dialog = await this.page.locator('xpath=' + OR.locators.cmProvisioningPage.dialogBox).isVisible()
            return dialog;
        } catch (error) {
            return false
        }
    }

    async getNewDeviceId() {
        await this.page.waitForSelector('xpath=' + OR.locators.cmProvisioningPage.newdeviceid, { waitFor: 'visible', timeout: 60000 })
        var deviceid = (await this.page.innerHTML('xpath=' + OR.locators.cmProvisioningPage.newdeviceid)).trim();
        return deviceid;
    }

    async getNewActivationKey() {
        await this.page.waitForSelector('xpath=' + OR.locators.cmProvisioningPage.newActivationKey, { waitFor: 'visible', timeout: 60000 })
        var activationKey = (await this.page.innerHTML('xpath=' + OR.locators.cmProvisioningPage.newActivationKey)).trim();
        return activationKey;

    }

    async closedeviceDialogBox() {
        await this.page.locator('xpath=' + OR.locators.cmProvisioningPage.closeButton).click();
        await this.page.waitForTimeout(3000);
    }

    async compareOrderIdReqError() {
        await this.page.waitForSelector('xpath=' + OR.locators.cmProvisioningPage.orderIDReq, { waitFor: 'visible', timeout: 60000 })
        var actual = (await this.page.innerHTML('xpath=' + OR.locators.cmProvisioningPage.orderIDReq)).trim();
        var expected = LAN.cmProvisioningOrderIdRequired;
        return (actual == expected);
    }

    async isOrderIdErrorDisplayed() {
        try {
            var ordererror = await this.page.locator('xpath=' + OR.locators.cmProvisioningPage.orderIDReq).isVisible()
            return ordererror;
        } catch (error) {
            return false
        }
    }

    async isAgreemntIdErrorDisplayed() {
        try {
            var agreeerror = await this.page.locator('xpath=' + OR.locators.cmProvisioningPage.agreementIDReq).isVisible()
            return agreeerror;
        } catch (error) {
            return false
        }
    }

    async compareAgreemntIdReqError() {
        await this.page.waitForSelector('xpath=' + OR.locators.cmProvisioningPage.agreementIDReq, { waitFor: 'visible', timeout: 60000 })
        var actual = (await this.page.innerHTML('xpath=' + OR.locators.cmProvisioningPage.agreementIDReq)).trim();
        var expected = LAN.cmProvisioningAgreementIdRequired;
        return (actual == expected);
    }

    async compareAgreemntIdInvalError() {
        await this.page.waitForSelector('xpath=' + OR.locators.cmProvisioningPage.agreementIDInvalid, { waitFor: 'visible', timeout: 60000 })
        var actual = (await this.page.innerHTML('xpath=' + OR.locators.cmProvisioningPage.agreementIDInvalid)).trim();
        var expected = LAN.cmProvisioningInvalidAgreementId;
        return (actual == expected);
    }

    async idDeviceLocationDisplayed() {
        await this.page.locator('id=' + OR.locators.homePage.userButton).click();
        await this.page.waitForTimeout(3000);
        try {
            var devicelocationdisplayed = await this.page.locator('css=zui-list-item#location-listitem').isVisible()
            return devicelocationdisplayed;
        } catch (error) {
            return true
        }
    }

    async isForbiddenDisplayed() {
        try {
            var forbidden = await this.page.locator('xpath=' + OR.locators.cmProvisioningPage.forbidden).isVisible()
            return forbidden;
        } catch (error) {
            return false
        }
    }

    static async createRandomID(length) {
        var result = '';
        var characters = '0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
    static async createSapId(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }


};