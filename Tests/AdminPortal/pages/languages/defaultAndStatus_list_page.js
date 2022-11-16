var OR_ML = require('../../resources/OR_ML.json');
var LAN;
if (process.env.locale.includes("DE")) {
    LAN = require('../../resources/de.json');
} else if (process.env.locale.includes("FR")) {
    LAN = require('../../resources/fr.json');
} else if (process.env.locale.includes("EN")) {
    LAN = require('../../resources/en.json');
} else if (process.env.locale.includes("ES")) {
    LAN = require('../../resources/es.json');
}
const { BasePage } = require('../../pages/base_page.js');


var basePage;

exports.StatusListPage = class StatusListPage {

    constructor(page) {
        this.page = page;
        basePage = new BasePage(page);

    }

    async compareSelectModuleMessageLine1_LabelText() {
        await this.page.waitForTimeout(3000);
        await this.page.waitForSelector('id=' + OR_ML.default.selectModuleMessageLine1_Label, { waitFor: 'visible', timeout: 60000 })
        var actual = await this.page.locator('id=' + OR_ML.default.selectModuleMessageLine1_Label).innerText();
        var expected = await LAN.selectModuleMessage;
        return (actual == expected);
    }

    async compareConfiguration_LabelText() {
        await this.page.waitForTimeout(3000);
        var actual = await this.page.locator('xpath=' + OR_ML.sideBarMenu.titleSidebar).innerText();
        var expected = await LAN.titleSidebar;
        return (actual == expected);
    }

    async compareSideBarStatus_LabelText() {

        var actual = await this.page.evaluate("document.querySelector('zui-list-accordion-item.btn-status').getAttribute('primary-text')");
        var expected = await LAN.titleStatus;
        return (actual == expected);
    }

    async compareSideBarDevices_LabelText() {
        await this.page.waitForTimeout(3000);
        var actual = await this.page.evaluate("document.querySelector('zui-list-accordion-item.btn-devices').getAttribute('primary-text')");
        var expected = await LAN.titleDevices;
        return (actual == expected);
    }

    async compareSideBarSettings_LabelText() {

        var actual = await this.page.evaluate("document.querySelector('zui-list-accordion-item.btn-settings').getAttribute('primary-text')");
        var expected = await LAN.titleSettings;
        return (actual == expected);
    }


    async compareSideBarService_LabelText() {
        var actual = await this.page.evaluate("document.querySelector('zui-list-accordion-item.btn-service').getAttribute('primary-text')");
        var expected = await LAN.titleService;
        return (actual == expected);
    }


    async compareSelectActivationKey_LabelText() {
        var actual = await this.page.locator('xpath=' + OR_ML.Status.ActivationKey).innerText();
        var expected = await LAN.labelHeaderActivationKey;
        return (actual == expected);
    }

    async getCMDeviceStatus() {
        await this.page.waitForSelector('id=' + OR_ML.Status.cmStatusLabel, { state: 'visible', timeout: 60000 })
        return await this.page.locator('id=' + OR_ML.Status.cmStatusLabel).evaluate(node => node.getAttribute('value'));

    }

    async compareGenerateNewKey_LabelText() {
        var actual = await this.page.locator('id=' + OR_ML.Status.GenerateNewKey).innerText();
        var expected = await LAN.generateNewKey;
        return (actual.includes(expected));
    }

    async compareConnectivityModuleStatus_LabelText() {
        var actual = await this.page.locator('id=' + OR_ML.Status.ConnectivityModuleStatus_Text).innerText();
        var expected = await LAN.labelConnectivityModuleStatus;
        return (actual.includes(expected));
    }

    async compareActivationkeynotorinus_LabelText() {
        var actual = await this.page.locator('xpath=' + OR_ML.Status.Activationkeynotorinuse).innerText();
        var expected = await LAN.labelActivationkeyinuse;
        return (actual.includes(expected));
    }

    async compareContainerStatusheader_LabelText() {
        await this.page.waitForSelector('xpath=' + OR_ML.Status.ContainerStatus, { waitFor: 'visible', timeout: 60000 })
        var actual = await this.page.locator('xpath=' + OR_ML.Status.ContainerStatus).innerText();
        var expected = await LAN.labelContainerStatus;
        return (actual == expected);
    }

    async compareStatus_LabelText() {
        var actual = await this.page.locator('xpath=' + OR_ML.Status.CMS_Status).innerText();
        var expected = await LAN.labelSatus;
        return (actual == expected);
    }


    async compareDeviceId_LabelText() {
        var actual = await this.page.locator('xpath=' + OR_ML.Status.CMS_DeviceId).innerText();
        var expected = await LAN.lableDeviceId;
        return (actual == expected);
    }

    async compareCurrentSoftwareVersion_LabelText() {
        var actual = await this.page.locator('xpath=' + OR_ML.Status.CMS_CurrentSoftwareVersion).innerText();
        var expected = await LAN.lableSoftwareVersion;
        return (actual == expected);
    }

    async getCurrentSoftwareVersion_Val() {
        var CurrentSoftwareVersion_Val = await this.page.locator('xpath=' + OR_ML.Status.CMS_CurrentSoftwareVersionVal).getAttribute("value");
        return CurrentSoftwareVersion_Val;
    }
    async compareConnectedEnvironment_LabelText() {
        var actual = await this.page.locator('xpath=' + OR_ML.Status.CMS_ConnectedEnvironment).innerText();
        var expected = await LAN.lableConnectedEnvironment;
        return (actual == expected);
    }
    async compareCurrentLANIPofVirtualMachine_LabelText() {
        var actual = await this.page.locator('xpath=' + OR_ML.Status.CMS_CurrentLANIPofVirtualMachine).innerText();
        var expected = await LAN.lableIpAddress;
        return (actual == expected);
    }

    async compareCurrentLANMACofVirtualMachine_LabelText() {
        var actual = await this.page.locator('xpath=' + OR_ML.Status.CMS_CurrentLANMACofVirtualMachine).innerText();
        var expected = await LAN.lableMACAddress;
        return (actual == expected);
    }


    async compareCurrentConnectivityModuleuptim_LabelText() {
        var actual = await this.page.locator('xpath=' + OR_ML.Status.CMS_ConnectivityModuleuptim).innerText();
        var expected = await LAN.lableCMUpTime;
        return (actual == expected);
    }

    async compareCurrentlableCmIpAddressMessage1_LabelText() {
        var actual = await this.page.locator('xpath=' + OR_ML.Status.CMS_lableCmIpAddressMessage).innerText();
        var expected = await LAN.lableCmIpAddressMessage1;
        return (actual.includes(expected));
    }

    async compareCurrentlableCmIpAddressMessage2_LabelText() {
        var actual = await this.page.locator('xpath=' + OR_ML.Status.CMS_lableCmIpAddressMessage).innerText();
        var expected = await LAN.lableCmIpAddressMessage2;
        return (actual.includes(expected));
    }

    async compareCurrentUpdateHistoryHeader_LabelText() {
        var actual = await this.page.locator('xpath=' + OR_ML.Status.UpdateHistory).innerText();
        var expected = await LAN.lableUpdateHistoryHeader;
        return (actual == expected);
    }


    async compareCurrentCMS_Refresh_LabelText() {
        var actual = await this.page.locator('id=' + OR_ML.Status.CMS_Refresh).innerText();
        var expected = await LAN.refresh;
        return (actual.includes(expected));
    }

    async compareContainerNameStatus_LabelText() {
        var actual = await this.page.locator('xpath=' + OR_ML.Status.CS_ContainerName).innerText();
        var expected = await LAN.nameStatus;
        return (actual.includes(expected));
    }

    async compareContainerStatus_LabelText() {
        var actual = await this.page.locator('xpath=' + OR_ML.Status.CS_Status).innerText();
        var expected = await LAN.status;
        return (actual.includes(expected));
    }
    async compareContainerRestart_LabelText() {
        var actual = await this.page.locator('xpath=' + OR_ML.Status.CS_Restart).innerText();
        var expected = await LAN.restartColumnName;
        return (actual.includes(expected));
    }

    async compareHistoryUpdateType_LabelText() {
        var actual = await this.page.locator('xpath=' + OR_ML.Status.UH_UpdateType).innerText();
        var expected = await LAN.updateType;
        return (actual.includes(expected));
    }

    async compareHistoryupdateVersion_LabelText() {
        var actual = await this.page.locator('xpath=' + OR_ML.Status.UH_UpdateVersion).innerText();
        var expected = await LAN.updateVersion;
        return (actual == expected);
    }

    async compareHistoryupdateDate_LabelText() {
        var actual = await this.page.locator('xpath=' + OR_ML.Status.UH_UpdateDate).innerText();
        var expected = await LAN.updateDate;
        return (actual == expected);
    }

    async compareHistoryupdateTime_LabelText() {
        var actual = await this.page.locator('xpath=' + OR_ML.Status.UH_UpdateTime).innerText();
        var expected = await LAN.updateTime;
        return (actual == expected);
    }

    // ProxySettings section

    async compareProxySettings_LabelText() {
        var actual = await this.page.locator('xpath=' + OR_ML.Status.Proxy_Header).innerText();
        var expected = await LAN.lblProxySettings;
        return (actual == expected);
    }

    async compareProxyServer_LabelText() {
        var actual = await this.page.locator('xpath=' + OR_ML.Status.Proxy_Server).innerText();
        var expected = await LAN.lblProxyServer;
        return (actual == expected);
    }

    async compareProxyPort_LabelText() {
        var actual = await this.page.locator('xpath=' + OR_ML.Status.Proxy_Ports).innerText();
        var expected = await LAN.lblProxyPort;
        return (actual == expected);
    }

    async compareProxyUsername_LabelText() {
        var actual = await this.page.locator('xpath=' + OR_ML.Status.Proxy_Uname).innerText();
        var expected = await LAN.lblProxyUsername;
        return (actual == expected);
    }

    async compareProxyPassword_LabelText() {
        var actual = await this.page.locator('xpath=' + OR_ML.Status.Proxy_Pw).innerText();
        var expected = await LAN.lblProxyPassword;
        return (actual == expected);
    }


};
