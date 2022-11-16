var OR = require('../resources/OR.json');
const { BasePage } = require('../pages/base_page.js');
const { test, expect } = require('@playwright/test');
var OR_ML = require('../resources/OR_ML.json');
var LAN;
if (process.env.locale.includes("DE")) {
    LAN = require('../resources/de.json');
} else if (process.env.locale.includes("FR")) {
    LAN = require('../resources/fr.json');
} else if (process.env.locale.includes("EN")) {
    LAN = require('../resources/en.json');
} else if (process.env.locale.includes("ES")) {
    LAN = require('../resources/es.json');
}
var basePage;
exports.CustomerDetailsStatusPage = class CustomerDetailsStatusPage {

    constructor(page) {
        this.page = page;
        basePage = new BasePage(page);

    }

    async getActivationKey() {
        await this.page.waitForSelector('id=' + OR.locators.customerDetailsPage.statusSubTab.activationKeyText, { waitFor: 'visible', timeout: 60000 })
        return await this.page.locator('id=' + OR.locators.customerDetailsPage.statusSubTab.activationKeyText).evaluate(node => node.getAttribute('value'));;
    }

    async getActivationKeyStatusIndicatorMessage() {
        return await this.page.locator('xpath=' + OR.locators.customerDetailsPage.statusSubTab.activationKeyStatusIndicatorMessage).innerText();
    }


    async getUIHistoryData() {
        var rows = await this.page.$$('xpath=' + OR.locators.customerDetailsPage.devicesSubTab.deviceHistoryTable + "//tbody//tr");
        var uiDataF = new Array()
        for (var i = 0; i < rows.length; i++) {
            var rowdata = await basePage.getRowText(rows[i]);
            var date = new Date(rowdata[2] + " " + rowdata[3]);

            var data = { updateVersion: rowdata[1], endDateTime: date.toISOString().slice(0,-5), updateType: rowdata[0] }
            uiDataF.push(data);
        }

        return uiDataF;
    }
    async activationKeyCopyButton() {
        await this.page.waitForTimeout(3000)
        var acticopybuttn = 'id=' + OR.locators.customerDetailsPage.statusSubTab.copyActivationKeyButton;
        return this.page.locator(acticopybuttn);
    }


    async geDeviceHistoryTable() {
        return await this.page.locator('xpath=' + OR.locators.customerDetailsPage.devicesSubTab.deviceHistoryTable);
    }

    async getContainerStatusSection() {
        return await this.page.locator('id=' + OR.locators.customerDetailsPage.statusSubTab.containerListTable);
    }

    async getCmModuleStatusSection() {
        return await this.page.locator('xpath=' + OR.locators.customerDetailsPage.statusSubTab.cmModuleStatusLabel);
    }
    async clickActivationKeyCopyButton() {
        await this.page.locator('id=' + OR.locators.customerDetailsPage.statusSubTab.copyActivationKeyButton).click();
        await this.page.reload();
    }
    async getCopiedActivationKeyText() {
        await basePage.logout();
        await this.page.waitForSelector('id=' + OR.locators.loginPage.usernameInput, { waitFor: 'visible', timeout: 60000 })
        await this.page.waitForTimeout(5000)
        await this.page.locator('id=' + OR.locators.loginPage.usernameInput).press("Control+V");
        return await this.page.inputValue('id=' + OR.locators.loginPage.usernameInput);;


    }
    async getDeviceId() {
        await this.page.waitForSelector('id=' + OR.locators.customerDetailsPage.statusSubTab.cmDeviceIdLabel, { waitFor: 'visible', timeout: 60000 })

        return await this.page.locator('id=' + OR.locators.customerDetailsPage.statusSubTab.cmDeviceIdLabel).evaluate(node => node.getAttribute('value'));;

    }

    async getStaticText() {

        await this.page.waitForSelector('xpath=' + OR.locators.customerDetailsPage.statusSubTab.cmStaticTextLabel, { waitFor: 'visible', timeout: 60000 })
        return await this.page.innerHTML('xpath=' + OR.locators.customerDetailsPage.statusSubTab.cmStaticTextLabel);
    }

    async getConnectivityModuleuptime() {
        return await this.page.locator('id=' + OR.locators.customerDetailsPage.statusSubTab.cmConnectivityModuleuptimeLabel).evaluate(node => node.getAttribute('value'));;
    }

    async getCurrentLANIPofVirtualMachine() {
        await this.page.waitForSelector('id=' + OR.locators.customerDetailsPage.statusSubTab.cmCurrentLANIPofVirtualMachineLabel, { waitFor: 'visible', timeout: 60000 })
        return await this.page.locator('id=' + OR.locators.customerDetailsPage.statusSubTab.cmCurrentLANIPofVirtualMachineLabel).evaluate(node => node.getAttribute('value'));;

        // return await  this.page.locator('id='+OR.locators.customerDetailsPage.statusSubTab.cmCurrentLANIPofVirtualMachineLabel).innerText("value");
    }

    async getCurrentLANMACofVirtualMachine() {

        await this.page.waitForSelector('id=' + OR.locators.customerDetailsPage.statusSubTab.cmCurrentLANMACofVirtualMachineLabel, { waitFor: 'visible', timeout: 60000 })
        return await this.page.locator('id=' + OR.locators.customerDetailsPage.statusSubTab.cmCurrentLANMACofVirtualMachineLabel).evaluate(node => node.getAttribute('value'));;

        // return await  this.page.locator('id='+OR.locators.customerDetailsPage.statusSubTab.cmCurrentLANMACofVirtualMachineLabel).innerText("value");
    }



    async IsLANIPofVirtualMachinevisible() {
        return await this.page.locator('id=' + OR.locators.customerDetailsPage.statusSubTab.cmCurrentLANIPofVirtualMachineLabel).isVisible();

    }

    async IsLANMACofVirtualMachinevisible() {

        return await this.page.locator('id=' + OR.locators.customerDetailsPage.statusSubTab.cmCurrentLANMACofVirtualMachineLabel).isVisible();

    }


    async isLANIPofVirtualMachineExists() {
        return await this.page.locator('id=' + OR.locators.customerDetailsPage.statusSubTab.cmCurrentLANIPofVirtualMachineLabel).isVisible();

    }

    async isLANMACofVirtualMachineExists() {
        return await this.page.locator('id=' + OR.locators.customerDetailsPage.statusSubTab.cmCurrentLANMACofVirtualMachineLabel).isVisible();
    }


    async getCMDeviceStatus() {
        await this.page.waitForSelector('id=' + OR.locators.customerDetailsPage.statusSubTab.cmStatusLabel, { state: 'visible', timeout: 60000 })

        return await this.page.locator('id=' + OR.locators.customerDetailsPage.statusSubTab.cmStatusLabel).evaluate(node => node.getAttribute('value'));;

    }

    //Proxy section

    async isProxyHeaderDisplayed() {
        await this.page.waitForTimeout(20000)
        return await this.page.locator('id=' + OR.locators.customerDetailsPage.ProxySettings.proxyHeader).isVisible();
    }
    async isProxyDetailsAvailable() {
        await this.page.waitForTimeout(20000)
        return await this.page.locator('id=' + OR.locators.customerDetailsPage.ProxySettings.proxyHeader).isVisible();
    }

    async isProxyDetailsUnAvailableMessageDisplayed() {
        await this.page.waitForTimeout(20000)
        //check for proxy details unavailable error icon and message is displayed
        await this.page.locator('xpath=' + OR.locators.customerDetailsPage.ProxySettings.proxyUnavailableErrorIcon).isVisible();
        return await this.page.locator('xpath=' + OR.locators.customerDetailsPage.ProxySettings.proxyUnavailableMsg).isVisible();
    }


    async compareProxyDetailsUnAvailableMessage() {
        var actual = await this.page.locator('xpath=' + OR.locators.customerDetailsPage.ProxySettings.proxyUnavailableMsg).innerText();
        var expected = LAN.proxySettingsNotAvailable;
        return (actual == expected);
    }



    async getProxyServer() {
        await this.page.waitForSelector('id=' + OR.locators.customerDetailsPage.ProxySettings.textProxyServer, { state: 'visible', timeout: 60000 })
        return await this.page.locator('id=' + OR.locators.customerDetailsPage.ProxySettings.textProxyServer).evaluate(node => node.getAttribute('value'));;

    }
    async getProxyPort() {
        await this.page.waitForSelector('id=' + OR.locators.customerDetailsPage.ProxySettings.textProxyPort, { state: 'visible', timeout: 60000 })
        return await this.page.locator('id=' + OR.locators.customerDetailsPage.ProxySettings.textProxyPort).evaluate(node => node.getAttribute('value'));;

    }
    async getProxyUserName() {

        await this.page.waitForSelector('id=' + OR.locators.customerDetailsPage.ProxySettings.textProxyUN, { state: 'visible', timeout: 60000 })
        return await this.page.locator('id=' + OR.locators.customerDetailsPage.ProxySettings.textProxyUN).evaluate(node => node.getAttribute('value'));;

    }
    async getProxyPassword() {
        await this.page.waitForSelector('id=' + OR.locators.customerDetailsPage.ProxySettings.ProxyPWD, { state: 'visible', timeout: 60000 })

        return await this.page.locator('id=' + OR.locators.customerDetailsPage.ProxySettings.ProxyPWD).evaluate(node => node.getAttribute('value'));;

    }


    async getCMDeviceStatusIcon() {
        if (this.getCMDeviceStatus == "disconnected") {

            return await this.page.locator('id=' + OR.locators.customerDetailsPage.statusSubTab.cmStatusErrorIcon);
        } else {
            return await this.page.locator('id=' + OR.locators.customerDetailsPage.statusSubTab.cmStatusConnectedIcon);
        }

    }
    async getDeviceConnectedEnvironment() {
        return await this.page.locator('id=' + OR.locators.customerDetailsPage.statusSubTab.connectedEnvironmentLabel).getAttribute("value");
    }
    async getDeviceSoftwareVersion() {

        await this.page.waitForSelector('id=' + OR.locators.customerDetailsPage.statusSubTab.currentSoftwareVersionLabel, { waitFor: 'visible', timeout: 60000 })

        return await this.page.locator('id=' + OR.locators.customerDetailsPage.statusSubTab.currentSoftwareVersionLabel).evaluate(node => node.getAttribute('value'));;
        // return await  this.page.locator('id='+OR.locators.customerDetailsPage.statusSubTab.currentSoftwareVersionLabel).innerText("value");
    }

    async getContainerStatus(module) {
        let containerStatus, containerStatusIcon
        var runningStatus = await LAN.containerRunningStatus;
        switch (module) {
            case 'edgeAgent':
                await this.page.waitForSelector('xpath=' + OR.locators.customerDetailsPage.statusSubTab.edgeAgentStatusLabel, { waitFor: 'visible', timeout: 60000 })

                containerStatus = await this.page.innerText('xpath=' + OR.locators.customerDetailsPage.statusSubTab.edgeAgentStatusLabel);

                // containerStatus = await  this.page.inputValue('xpath='+OR.locators.customerDetailsPage.statusSubTab.edgeAgentStatusLabel);
                if (containerStatus == runningStatus) {
                    containerStatusIcon = await this.page.locator('xpath=' + OR.locators.customerDetailsPage.statusSubTab.edgeAgentStatusRunningIcon).isVisible();
                } else {
                    containerStatusIcon = await this.page.locator('xpath=' + OR.locators.customerDetailsPage.statusSubTab.edgeAgentStatusErrorIcon).isVisible();
                }
                break;
            case 'edgeHub':
                containerStatus = await this.page.innerText('xpath=' + OR.locators.customerDetailsPage.statusSubTab.edgeHubStatusLabel);
                if (containerStatus == runningStatus) {
                    containerStatusIcon = await this.page.locator('xpath=' + OR.locators.customerDetailsPage.statusSubTab.edgeHubStatusRunningIcon).isVisible();
                } else {
                    containerStatusIcon = await this.page.locator('xpath=' + OR.locators.customerDetailsPage.statusSubTab.edgeHubStatusErrorIcon).isVisible();
                }
                break;
            case 'managementmodule':
                containerStatus = await this.page.innerText('xpath=' + OR.locators.customerDetailsPage.statusSubTab.managementModuleStatusLabel);
                if (containerStatus == runningStatus) {
                    containerStatusIcon = await this.page.locator('xpath=' + OR.locators.customerDetailsPage.statusSubTab.managementModuleStatusRunningIcon).isVisible();
                } else {
                    containerStatusIcon = await this.page.locator('xpath=' + OR.locators.customerDetailsPage.statusSubTab.managementModuleStatusErrorIcon).isVisible();
                }
                break;
            case 'dicomforwardermodule':
                containerStatus = await this.page.innerText('xpath=' + OR.locators.customerDetailsPage.statusSubTab.dicomforwarderModuleStatusLabel);
                if (containerStatus == runningStatus) {
                    containerStatusIcon = await this.page.locator('xpath=' + OR.locators.customerDetailsPage.statusSubTab.dicomforwarderModuleStatusRunningIcon).isVisible();
                } else {
                    containerStatusIcon = await this.page.locator('xpath=' + OR.locators.customerDetailsPage.statusSubTab.dicomforwarderModuleStatusErrorIcon).isVisible();
                }
                break;
            case 'zvimodule':
                containerStatus = await this.page.innerText('xpath=' + OR.locators.customerDetailsPage.statusSubTab.zviModuleStatusLabel);
                if (containerStatus == runningStatus) {
                    containerStatusIcon = await this.page.locator('xpath=' + OR.locators.customerDetailsPage.statusSubTab.zviModuleStatusRunningIcon).isVisible();
                } else {
                    containerStatusIcon = await this.page.locator('xpath=' + OR.locators.customerDetailsPage.statusSubTab.zviModuleStatusErrorIcon).isVisible();
                }
                break;
            case 'zssmodule':
                containerStatus = await this.page.innerText('xpath=' + OR.locators.customerDetailsPage.statusSubTab.zssModuleStatusLabel);
                if (containerStatus == runningStatus) {
                    containerStatusIcon = await this.page.locator('xpath=' + OR.locators.customerDetailsPage.statusSubTab.zssModuleStatusRunningIcon).isVisible();
                } else {
                    containerStatusIcon = await this.page.locator('xpath=' + OR.locators.customerDetailsPage.statusSubTab.zssModuleStatusErrorIcon).isVisible();
                }
                break;
            case 'zrsmodule':
                containerStatus = await this.page.innerText('xpath=' + OR.locators.customerDetailsPage.statusSubTab.zrsModuleStatusLabel);
                if (containerStatus == runningStatus) {
                    containerStatusIcon = await this.page.locator('xpath=' + OR.locators.customerDetailsPage.statusSubTab.zrsModuleStatusRunningIcon).isVisible();
                } else {
                    containerStatusIcon = await this.page.locator('xpath=' + OR.locators.customerDetailsPage.statusSubTab.zrsModuleStatusErrorIcon).isVisible();
                }
                break;
            case 'streamingmodule':
                containerStatus = await this.page.innerText('xpath=' + OR.locators.customerDetailsPage.statusSubTab.streamingModuleStatusLabel);
                if (containerStatus == runningStatus) {
                    containerStatusIcon = await this.page.locator('xpath=' + OR.locators.customerDetailsPage.statusSubTab.streamingModuleStatusRunningIcon).isVisible();
                } else {
                    containerStatusIcon = await this.page.locator('xpath=' + OR.locators.customerDetailsPage.statusSubTab.streamingModuleStatusErrorIcon).isVisible();
                }
                break;
            case 'IoTEdgeMetricsCollector':
                containerStatus = await this.page.innerText('xpath=' + OR.locators.customerDetailsPage.statusSubTab.iotEdgeMetricsCollectorStatusLabel);
                if (containerStatus == runningStatus) {
                    containerStatusIcon = await this.page.locator('xpath=' + OR.locators.customerDetailsPage.statusSubTab.iotEdgeMetricsCollectorStatusRunningIcon).isVisible();
                } else {
                    containerStatusIcon = await this.page.locator('xpath=' + OR.locators.customerDetailsPage.statusSubTab.iotEdgeMetricsCollectorStatusErrorIcon).isVisible();
                }
                break;
        }
        return [containerStatus, containerStatusIcon]
    }

    async getExpectedActivationKeyUsageInfoMessage() {
        return await LAN.labelActivationkeynotinuse;
    }
    // Container Restart

    async clickRestartmodule(moduleName) {

        await this.page.waitForSelector('xpath=' + "//table[@id='tbl-container-list']//td[contains(text(),'" + moduleName + "')]//..//button[@id='btn-add-device']//zui-icon-common-reset", { waitFor: 'visible', timeout: 60000 })
        await this.page.locator('xpath=' + "//table[@id='tbl-container-list']//td[contains(text(),'" + moduleName + "')]//..//button[@id='btn-add-device']//zui-icon-common-reset").click();
        await this.page.evaluate("document.querySelector('zui-dialogbox').shadowRoot.querySelector('section').querySelector('footer').querySelector('#accept-button').click()");
        await this.page.waitForTimeout(10000)
    }


    async isRefreshbuttondisabled(moduleName) {
        await this.page.waitForSelector('xpath=' + "//table[@id='tbl-container-list']//td[contains(text(),'" + moduleName + "')]//..//button/zui-interactive-icon/zui-icon-common-reset", { waitFor: 'visible', timeout: 60000 })
        return await this.page.locator('xpath=' + "//table[@id='tbl-container-list']//td[contains(text(),'" + moduleName + "')]//..//button/zui-interactive-icon[@disabled]").isVisible();
    }
    async getRefreshbuttonVisible(moduleName) {
        return await this.page.locator('xpath=' + "//table[@id='tbl-container-list']//td[contains(text(),'" + moduleName + "')]//..//button").isVisible();
    }

    async getlastRestartTimeUtc(module, iothubResponse) {

        switch (module) {
            case 'IoTEdgeMetricsCollector':
                var lastRestartTimeUtcnew = iothubResponse.data[0].properties.reported.modules ? iothubResponse.data[0].properties.reported.modules.IoTEdgeMetricsCollector.lastRestartTimeUtc : iothubResponse.data[0].properties.reported.modules.IoTEdgeMetricsCollector.lastRestartTimeUtc;
                return lastRestartTimeUtcnew;
                break;

            case 'managementmodule':
                var lastRestartTimeUtcnew = iothubResponse.data[0].properties.reported.modules ? iothubResponse.data[0].properties.reported.modules.managementmodule.lastRestartTimeUtc : iothubResponse.data[0].properties.reported.modules.managementmodule.lastRestartTimeUtc;
                return lastRestartTimeUtcnew;
                break;

            case 'dicomforwardermodule':
                var lastRestartTimeUtcnew = iothubResponse.data[0].properties.reported.modules ? iothubResponse.data[0].properties.reported.modules.dicomforwardermodule.lastRestartTimeUtc : iothubResponse.data[0].properties.reported.modules.dicomforwardermodule.lastRestartTimeUtc;
                return lastRestartTimeUtcnew;
                break;

            case 'zvimodule':
                var lastRestartTimeUtcnew = iothubResponse.data[0].properties.reported.modules ? iothubResponse.data[0].properties.reported.modules.zvimodule.lastRestartTimeUtc : iothubResponse.data[0].properties.reported.modules.zvimodule.lastRestartTimeUtc;
                return lastRestartTimeUtcnew;
                break;

            case 'zssmodule':
                var lastRestartTimeUtcnew = iothubResponse.data[0].properties.reported.modules ? iothubResponse.data[0].properties.reported.modules.zssmodule.lastRestartTimeUtc : iothubResponse.data[0].properties.reported.modules.zssmodule.lastRestartTimeUtc;
                return lastRestartTimeUtcnew;
                break;
            case 'zrsmodule':
                var lastRestartTimeUtcnew = iothubResponse.data[0].properties.reported.modules ? iothubResponse.data[0].properties.reported.modules.zrsmodule.lastRestartTimeUtc : iothubResponse.data[0].properties.reported.modules.zrsmodule.lastRestartTimeUtc;
                return lastRestartTimeUtcnew;
                break;
            case 'streamingmodule':
                var lastRestartTimeUtcnew = iothubResponse.data[0].properties.reported.modules ? iothubResponse.data[0].properties.reported.modules.streamingmodule.lastRestartTimeUtc : iothubResponse.data[0].properties.reported.modules.streamingmodule.lastRestartTimeUtc;
                return lastRestartTimeUtcnew;
                break;

            case 'edgeHub':
                var lastRestartTimeUtcnew = iothubResponse.data[0].properties.reported.systemModules ? iothubResponse.data[0].properties.reported.systemModules.edgeHub.lastRestartTimeUtc : iothubResponse.data[0].properties.reported.systemModules.edgeHub.lastRestartTimeUtc;
                // var lastRestartTimeUtcnew = iothubResponse.data[0].properties.reported.modules ? iothubResponse.data[0].properties.reported.modules.edgeHub.lastRestartTimeUtc : iothubResponse.data[0].properties.reported.modules.edgeHub.lastRestartTimeUtc;
                return lastRestartTimeUtcnew;
                break;


        }
    }

};
