var OR = require('../resources/OR.json');
var deviceTypes = require('../helpers/device-types.json');
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
exports.CustomerDetailsPage = class CustomerDetailsPage {

    constructor(page) {
        this.page = page;
        this.basePage = new BasePage(page);

    }
    //customer details UI- change customer--->
    async getCustomerName() {
        return await this.page.innerHTML('id=' + OR.locators.customerDetailsPage.customerNameText);
    }
    async getSapCustomerId() {
        return await this.page.innerHTML('id=' + OR.locators.customerDetailsPage.sapcustomerIdText);
    }

    async getAgreementId() {
        return await this.page.innerHTML('id=' + OR.locators.customerDetailsPage.agreementIdText);
    }

    async getCustomerbuttonIdtext() {
        await this.page.waitForTimeout(5000)
        return await this.page.innerHTML('id=' + OR.locators.customerDetailsPage.customeragreementIdText);
    }
    async getCustomerButtonText() {
        await this.page.waitForTimeout(5000)
        return await this.page.innerHTML('id=' + OR.locators.customerDetailsPage.customerButtonText);
    }

    async clickCustomerbutton() {
        await this.page.locator('id=' + OR.locators.customerDetailsPage.customerButton).click();
        await this.page.waitForTimeout(5000)
    }

    async compareCustomernameLabel() {

        await this.page.waitForSelector('id=' + OR.locators.customerDetailsPage.customerNameLabel, { waitFor: 'visible', timeout: 60000 })
        var actual = (await this.page.innerHTML('id=' + OR.locators.customerDetailsPage.customerNameLabel)).trim();
        var expected = LAN.titleCustomerName;
        return (actual == expected);
    }

    async compareCustomersapLabel() {
        await this.page.waitForSelector('id=' + OR.locators.customerDetailsPage.sapcustomerIdLabel, { waitFor: 'visible', timeout: 60000 })
        var actual = (await this.page.innerHTML('id=' + OR.locators.customerDetailsPage.sapcustomerIdLabel)).trim();
        var expected = LAN.titleSapCustomerId;
        return (actual == expected);
    }

    async compareCustomerIdLabel() {
        await this.page.waitForSelector('id=' + OR.locators.customerDetailsPage.agreementIdLabel, { waitFor: 'visible', timeout: 60000 })
        var actual = (await this.page.innerHTML('id=' + OR.locators.customerDetailsPage.agreementIdLabel)).trim();
        var expected = LAN.titleCustomerId;
        return (actual == expected);
    }

    async compareChangeCustomerLabel() {
        await this.page.waitForSelector('id=' + OR.locators.customerDetailsPage.changeCustomerButton, { waitFor: 'visible', timeout: 60000 })
        var actual = (await this.page.locator('id=' + OR.locators.customerDetailsPage.changeCustomerButton).innerText()).trim();
        var expected = LAN.changeCustomer;
        return (actual == expected);
    }

    async ischangeCustomerButtonPresent() {
        try {
            await this.page.waitForSelector('id=' + OR.locators.customerDetailsPage.changeCustomerButton, { waitFor: 'visible', timeout: 60000 })
            return await this.page.locator('id=' + OR.locators.customerDetailsPage.changeCustomerButton).isVisible();
        } catch (error) {
            return false
        }
    }

    //<-------

    async isCustomerButtonTextPresent() {
        try {
            await this.page.waitForSelector('id=' + OR.locators.customerDetailsPage.customerButtonText, { waitFor: 'visible', timeout: 60000 })
            return await this.page.locator('id=' + OR.locators.customerDetailsPage.customerButtonText).isVisible();
        } catch (error) {
            return false
        }
    }
    async navigateToCustomerList() {
        await this.page.locator('id=' + OR.locators.customerDetailsPage.customerButton).click();
        await this.page.waitForTimeout(1000)
        await this.page.locator('id=' + OR.locators.customerDetailsPage.changeCustomerButton).click();
    }
    async getNoOfCMInstances() {
        return await this.page.locator('xpath=' + OR.locators.customerDetailsPage.connectivityModuleInstances).count();
    }
    async selectCMInstance(deviceId) {
        var locator = 'xpath=' + "//zui-list-accordion[@header-text='" + deviceId + "']";
        await this.page.waitForSelector(locator, { waitFor: 'visible', timeout: 60000 })
        await this.basePage.scrollElemFinderIntoView(locator);
        await this.page.waitForTimeout(6000)
        await this.page.locator(locator).click();
        await this.page.waitForTimeout(5000)
    }

    async isCMInstancePresent(deviceId) {
        await this.page.waitForTimeout(3000);
        try {
            return await this.page.locator('xpath=' + "//zui-list-accordion[@header-text='" + deviceId + "']").isDisplayed();
        } catch (error) {
            return false
        }
    }
    async selectCMInstanceStatus(deviceId) {
        await this.basePage.scrollElemFinderIntoView('xpath=' + "//zui-list-accordion[@header-text='" + deviceId + "']//parent::zui-list-accordion/zui-list-accordion-item[@class='btn-status']");
        await this.page.waitForTimeout(1000);
        await this.page.locator('xpath=' + "//zui-list-accordion[@header-text='" + deviceId + "']//parent::zui-list-accordion/zui-list-accordion-item[@class='btn-status']").click();
        await this.page.waitForTimeout(2000);
    }

    async clickOnGenerateNewKey() {
        await this.basePage.scrollElemFinderIntoView('xpath=' + OR.locators.customerDetailsPage.statusSubTab.generatenewkey);
        await this.page.waitForTimeout(6000);
        await this.page.locator('xpath=' + OR.locators.customerDetailsPage.statusSubTab.generatenewkey).click();

    }

    async fillDeviceNameAndRequestActivationKey(deviceId) {

        await this.basePage.scrollElemFinderIntoView('xpath=' + OR.locators.customerDetailsPage.statusSubTab.generatenewkey_deviceid);
        await this.page.locator('css=zui-textfield#frm-inp-device-id input#raw').fill(deviceId);
        await this.page.evaluate("document.querySelector('zui-dialogbox').shadowRoot.querySelector('section').querySelector('footer').querySelector('#accept-button').click()");
        var loadSpinner = 'id=' + OR.locators.customerDetailsPage.statusSubTab.loadSpinner;
        await this.basePage.waitTillElementIsInvisible(loadSpinner)
        await this.page.waitForTimeout(8000);

    }


    async selectAddDeviceType(type) {

        await this.basePage.scrollElemFinderIntoView('xpath=' + OR.locators.customerDetailsPage.deviceDetailsForm.deviceType);
        let selectedType = await this.page.locator('xpath=' + OR.locators.customerDetailsPage.deviceDetailsForm.deviceType).getAttribute('value');
        if (!(selectedType == type)) {
            if (type.toUpperCase() == "DICOM") {
                await this.page.locator('xpath=' + OR.locators.customerDetailsPage.deviceDetailsForm.deviceTypeDICOM).click();
            } else if (type.toUpperCase() == "STREAMING") {
                await this.page.locator('xpath=' + OR.locators.customerDetailsPage.deviceDetailsForm.deviceTypeStreaming).click();

            } else if (type.toUpperCase() == "BOTH") {
                await this.page.locator('xpath=' + OR.locators.customerDetailsPage.deviceDetailsForm.deviceTypeBOTH).click();

            }

        }

    }
    async getCMInstanceSettings(deviceId) {
        return await this.page.locator('xpath=' + "//zui-list-accordion[@header-text='" + deviceId + "']//parent::zui-list-accordion/zui-list-accordion-item[@id='btn-settings']");
    }
    async selectCMInstanceSettings(deviceId) {
        await this.page.waitForTimeout(1000)
        await this.page.evaluate("document.querySelector('zui-list-accordion[header-text=" + deviceId + "]').scrollIntoView()");
        await this.page.waitForTimeout(1000)
        await this.page.evaluate("document.querySelector('zui-list-accordion[header-text=" + deviceId + "]').querySelector('zui-list-accordion-item.btn-settings').click()");
        await this.page.waitForTimeout(2000);
    }

    async getCMInstanceDevices(deviceId) {
        return await this.page.locator('xpath=' + "//zui-list-accordion[@header-text='" + deviceId + "']//parent::zui-list-accordion/zui-list-accordion-item[@id='btn-devices']");

    }
    async selectCMInstanceDevices(deviceId) {
        await this.page.waitForTimeout(1000)
        await this.page.evaluate("document.querySelector('zui-list-accordion[header-text=" + deviceId + "]').scrollIntoView()");
        await this.page.waitForTimeout(1000)
        await this.page.evaluate("document.querySelector('zui-list-accordion[header-text=" + deviceId + "]').querySelector('zui-list-accordion-item.btn-devices').click()");
        await this.page.waitForTimeout(2000)

    }

    async getCMInstanceService(deviceId) {
        return await this.page.locator('xpath=' + "//zui-list-accordion[@header-text='" + deviceId + "']//parent::zui-list-accordion/zui-list-accordion-item[@id='btn-service']");
    }
    async selectCMInstanceService(deviceId) {
        await this.page.waitForTimeout(1000)
        await this.page.evaluate("document.querySelector('zui-list-accordion[header-text=" + deviceId + "]').scrollIntoView()");
        await this.page.waitForTimeout(1000)
        await this.page.evaluate("document.querySelector('zui-list-accordion[header-text=" + deviceId + "]').querySelector('zui-list-accordion-item.btn-service').click()");
        await this.page.waitForTimeout(2000)
    }

    async getPageHeader() {
        return await this.page.innerHTML('id=' + OR.locators.customerDetailsPage.pageHeader);
    }
    async getDeviceId() {
        return await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceId).innerText();
    }
    async getDeviceActivationStatus() {
        return await this.page.innerHTML('id=' + OR.locators.customerDetailsPage.deviceActivationStatus);
    }
    async getPageHeaderInDevicesTab() {
        return await this.page.innerHTML('id=' + OR.locators.customerDetailsPage.devicesSubTab.devicesHeader);
    }
    async getActiveDevicesHeaderInDevicesTab() {
        return await this.page.innerHTML('id=' + OR.locators.customerDetailsPage.devicesSubTab.activeDevicesHeader);
    }
    async getInactiveDevicesHeaderInDevicesTab() {
        return await this.page.innerHTML('id=' + OR.locators.customerDetailsPage.devicesSubTab.inactiveDevicesHeader);
    }
    async getActiveDevicesTable() {
        await this.page.waitForTimeout(3000);
        return await this.page.locator('xpath=' + OR.locators.customerDetailsPage.devicesSubTab.activeDevicesTable);
    }

    async clickCancelOnGenerateActivationKey() {
        await this.page.evaluate("document.querySelector('zui-dialogbox').shadowRoot.querySelector('section').querySelector('footer').querySelector('#cancel-button').click()");
    }

    async getBannerHeader() {
        return await this.page.evaluate("document.querySelector('zui-inline-message[id=\"txt-banner\"]').getAttribute('header-text')");
    }

    async isBannerPresent() {
        await this.page.waitForTimeout(2000);
        return await this.page.locator('xpath=' + OR.locators.customerDetailsPage.banner).isVisible();
    }

    async isDevicesTablePresent() {

        await this.page.waitForTimeout(3000);
        try {
            return await this.page.locator('xpath=' + OR.locators.customerDetailsPage.devicesSubTab.activeDevicesTable).isPresent();
        } catch (error) {
            return false
        }

    }
    async getInactiveDevicesTable() {
        return await this.page.locator('xpath=' + OR.locators.customerDetailsPage.devicesSubTab.inactiveDevicesTable);
    }
    async getActiveDevicesTableColumnsInDevicesTab() {
        var table = await this.getActiveDevicesTable()
        var columnElements = await table.locator('xpath=' + ".//th").elementHandles();
        var columns = [];
        for (var i = 0; i < columnElements.length; i++) {
            columns.push((await columnElements[i].innerText()).trim());
        }
        return columns;
    }
    async getInactiveDevicesTableColumnsInDevicesTab() {
        var table = await this.getInactiveDevicesTable();
        var columnElements = await table.locator('xpath=' + ".//th").elementHandles();
        var columns = [];
        for (var i = 0; i < columnElements.length; i++) {
            columns.push((await columnElements[i].innerText()).trim());
        }
        return columns;
    }

    async validateActiveDevicesTableColumnSortedInAscendingOrder(column) {
        var table = await this.getActiveDevicesTable();
        var colValues = await this.basePage.getColumnVal(column, table);
        var expectedSortedVal = colValues.slice().sort((a, b) => a - b);
        return Comparisions.compareObjects(colValues, expectedSortedVal);
    }

    async validateInactiveDevicesTableColumnSortedInAscendingOrder(column) {
        var table = await this.getInactiveDevicesTable();
        var colValues = await this.basePage.getColumnVal(column, table);
        var expectedSortedVal = colValues.slice().sort((a, b) => a - b);
        return Comparisions.compareObjects(colValues, expectedSortedVal);
    }


    async validateDevicesTableData(table, data) {
        var rows = await (await table.elementHandle()).$$('xpath=' + ".//tbody//tr");

        const areEqual = []
        if (rows.length == data.length) {
            for (var i = 0; i < rows.length; i++) {
                var rowdata = await this.basePage.getRowText(rows[i]);
                var expectedData = [];

                var deviceIdentifiedValue = data[i].di.trim();
                if (deviceIdentifiedValue != null) {
                    var deviceType = deviceTypes.find(x => x.identifier == deviceIdentifiedValue);
                    deviceIdentifiedValue += " (" + deviceType.name + ")";
                }
                expectedData.push(data[i].name ? (data[i].name.trim() ? data[i].name.trim() : "null") : "null");
                expectedData.push(data[i].di ? (deviceIdentifiedValue ? deviceIdentifiedValue.trim() : "null") : "null");
                expectedData.push(data[i].sn ? (data[i].sn.trim() ? data[i].sn.trim() : "null") : "null");
                expectedData.push(data[i].aet ? (data[i].aet.trim() ? data[i].aet.trim() : "null") : "null");
                expectedData.push(data[i].sgc ? (data[i].sgc.trim() ? data[i].sgc.trim() : "null") : "null");
                expectedData.push(data[i].ip ? (data[i].ip.trim() ? data[i].ip.trim() : "null") : "null");
                expectedData.push(data[i].port ? (data[i].port.trim() ? data[i].port.trim() : "null") : "null");
                expectedData.push("null");
                areEqual.push(await Comparisions.compareObjects(rowdata, expectedData));
            }
        } else {
            areEqual.push(false);
        }
        return areEqual;
    }

    async validateCMInstances(data) {
        await this.page.waitForTimeout(5000)
        var rows = await this.page.$$('xpath=' + OR.locators.customerDetailsPage.connectivityModuleInstanceTitle);
        const areEqual = [];
        if (rows.length == data.length) {
            for (var i = 0; i < rows.length; i++) {
                var rowdata = await rows[i].getAttribute('header-text');
                var expectedData = data[i].iotDeviceId;
                areEqual.push(rowdata == expectedData);
            }
        } else {
            areEqual.push(false);
        }
        return areEqual;
    }
    async getInactiveDevicesDisclaimerText() {
        return await this.page.locator('xpath=' + OR.locators.customerDetailsPage.devicesSubTab.inactiveDevicesDisclaimer).innerText();
    }
    async fillDeviceSerial(deviceSerial) {
        await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.deviceSerialInput).fill("");
        await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.deviceSerialInput).fill(deviceSerial)
        await this.page.waitForTimeout(2000)
    }

    async fillManuallyEnteredDI(manualDi) {
        await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.manualEnteredDIInput).fill("");
        await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.manualEnteredDIInput).fill(manualDi)
        await this.page.waitForTimeout(1000)
    }
    async isEmptyActiveDevicesMessagePresent() {
        var msg = await this.page.evaluate("document.querySelector('div[class=\"active-devices-body\"]').querySelector('zui-inline-message').textContent");
        return await Comparisions.compareObjects(msg, OR.locators.customerDetailsPage.devicesSubTab.emptyActiveDevicesMessage);
    }

    async isEmptyInactiveDevicesMessagePresent() {
        var msg = await this.page.evaluate("document.querySelector('div[class=\"inactive-devices-body\"]').querySelector('zui-inline-message').textContent");
        return await Comparisions.compareObjects(msg, OR.locators.customerDetailsPage.devicesSubTab.emptyInactiveDevicesMessage);
    }

    async addDeviceButtonClick() {
        await this.page.locator('id=' + OR.locators.customerDetailsPage.addDeviceButton).click();
        await this.page.waitForTimeout(2000);
    }

    async refreshDeviceButtonClick() {
        await this.page.locator('id=' + OR.locators.customerDetailsPage.refreshDeviceButton).click();
        await this.page.waitForTimeout(3000);
    }


    async filldeviceName(deviceName) {
        await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.deviceNameInput).fill("");
        await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.deviceNameInput).fill(deviceName)
        await this.page.waitForTimeout(1000)

    }

    async getdeviceName() {
        await this.page.waitForSelector('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.deviceNameInput, { waitFor: 'visible', timeout: 60000 })
        var devicename = (await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.deviceNameInput).inputValue()).trim();
        return devicename

    }

    async cleardeviceName() {
        await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.deviceNameInput).fill("");
        await this.page.waitForTimeout(3000);
    }

    async fillAeTitle(aeTitle) {
        await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.aeTitleInput).fill("");
        await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.aeTitleInput).fill(aeTitle)
        await this.page.waitForTimeout(1000)

    }

    async getAeTitle() {
        return await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.aeTitleInput).inputValue();

    }
    async getInternamIdentifier() {
        return await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.internamIdentifier).innerText();

    }

    async clearAeTitle() {
        await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.aeTitleInput).fill("");
        await this.page.waitForTimeout(3000);
    }

    async fillIpAddress(ipAddress) {
        await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.ipAddressInput).fill("");
        await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.ipAddressInput).fill(ipAddress)
        await this.page.waitForTimeout(1000)

    }


    async getIpAddress() {
        return await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.ipAddressInput).inputValue();

    }

    async clearDeviceSerial() {
        await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.deviceSerialInput).fill("");
        await this.page.waitForTimeout(2000);
    }

    async clearIpAddress() {
        await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.ipAddressInput).fill("");
        await this.page.waitForTimeout(3000);
    }

    async fillPort(port) {
        await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.portInput).fill("");
        await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.portInput).fill(port);
        await this.page.waitForTimeout(1000);

    }

    async getPort() {
        return await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.portInput).inputValue();


    }

    async clearPort() {
        await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.portInput).fill("");
        await this.page.waitForTimeout(3000);
    }

    async selectModality(modality) {
        try {
            await this.page.evaluate("document.querySelector('[placeholder=\"Select modality\"]').shadowRoot.querySelector('zui-select-button').click()");
            await this.page.evaluate("document.querySelector('zui-portal').shadowRoot.querySelector('zui-menu').querySelector('zui-menu-item[value=\"" + modality + "\"]').click()");
            await this.page.waitForTimeout(2000);
        } catch {

        }

    }
    async getModality() {
        return await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.modalitySelect).getAttribute('value');
    }

    async selectDeviceIdentifier(deviceIdentifier) {
        if (deviceIdentifier === "04049539104410 (CALLISTO eye)") {
            deviceIdentifier = "04049539104410";
        }
        else if (deviceIdentifier === "04049471092080 (IOLMaster 700)") {
            deviceIdentifier = "04049471092080";
        }
        else {
            deviceIdentifier = "Others";
        }
        await this.page.evaluate("document.querySelector('[placeholder=\"Select Device Identifier (DI)\"]').shadowRoot.querySelector('zui-select-button').click()");
        await this.page.waitForTimeout(1000);
        await this.page.evaluate("document.querySelector('zui-portal').shadowRoot.querySelector('zui-menu').querySelector('zui-menu-item[value=\"" + deviceIdentifier + "\"]').click()");
        await this.page.waitForTimeout(3000);
    }

    async selectDeviceIdentifierWithID(deviceIdentifierID) {

        await this.page.evaluate("document.querySelector('[placeholder=\"Select Device Identifier (DI)\"]').shadowRoot.querySelector('zui-select-button').click()");
        await this.page.waitForTimeout(1000);
        await this.page.evaluate("document.querySelector('zui-portal').shadowRoot.querySelector('zui-menu').querySelector('zui-menu-item[value=\"" + deviceIdentifierID + "\"]').click()");
        await this.page.waitForTimeout(3000);
    }


    async selectDeviceLocation(location) {
        await this.page.evaluate("document.querySelector('[placeholder=\"Select location\"]').shadowRoot.querySelector('zui-select-button').click()");
        await this.page.waitForTimeout(2000);
        await this.page.evaluate("document.querySelector('zui-portal').shadowRoot.querySelector('zui-menu').querySelector('zui-menu-item[value=\"" + location + "\"]').click()");
        await this.page.waitForTimeout(3000);
    }

    async getDeviceLocation() {
        return await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.deviceLocationInput).getAttribute('value');
    }

    async toggleWhitelistDevice(whitelist) {
        var inputChecked = await this.page.locator('css=zui-toggle-switch#frm-inp-whitelisted button').getAttribute('aria-checked')
        if (whitelist.toLowerCase() != inputChecked.toLowerCase()) {
            await this.page.$eval('css=zui-toggle-switch#frm-inp-whitelisted button', (whiteListToogle) => whiteListToogle.click());
        }

    }
    async applyAllChanges() {
        await this.page.evaluate("document.querySelector('zui-dialogbox').shadowRoot.querySelector('#accept-button').click()");
        await this.page.waitForTimeout(3000)
    }

    async selectModalityHint() {
        await this.basePage.waitTillElementIsVisible('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.selectModalityHint, 1000)
        var elementData = await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.selectModalityHint);
        return elementData;

    }

    async deviceSerialHint() {
        await this.basePage.waitTillElementIsVisible('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.deviceSerialHint, 1000)
        var elementData = await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.deviceSerialHint);
        return elementData;

    }

    async cancelDeviceForm() {
        await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.cancelButton).click()
        await this.page.waitForTimeout(3000)
    }

    async deviceIdentifierValidationMessage() {
        await this.basePage.waitTillElementIsVisible('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.deviceIdentifierValidationMessage, 1000);
        var elementData = await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.deviceIdentifierValidationMessage);
        return elementData;
    }

    async deviceLocationValidationMessage() {
        await this.basePage.waitTillElementIsVisible('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.deviceLocationValidationMessage, 1000);
        var elementData = await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.deviceLocationValidationMessage);
        return elementData;
    }

    async getDeviceFromDevicesTable(table, aeTitle) {
        var loadSpinner = 'xpath=' + OR.locators.customerListPage.loadSpinner;
        await this.basePage.waitTillElementIsInvisible(loadSpinner);
        var rows = await table.locator("xpath=.//tbody//tr").elementHandles();
        var rowText = new Map();
        var i;
        for (var i = 0; i < rows.length; i++) {
            var rowdata = await this.basePage.getRowText(rows[i]);
            if (rowdata.includes(aeTitle)) {
                rowText.set(OR.locators.customerDetailsPage.deviceHeaders.name, rowdata[0]);
                rowText.set(OR.locators.customerDetailsPage.deviceHeaders.deviceIdentifier, rowdata[1]);
                rowText.set(OR.locators.customerDetailsPage.deviceHeaders.deviceSerial, rowdata[2]);
                rowText.set(OR.locators.customerDetailsPage.deviceHeaders.aetitle, rowdata[3]);
                rowText.set(OR.locators.customerDetailsPage.deviceHeaders.location, rowdata[4]);
                rowText.set(OR.locators.customerDetailsPage.deviceHeaders.ip, rowdata[5]);
                rowText.set(OR.locators.customerDetailsPage.deviceHeaders.port, rowdata[6]);
                break;
            }
        }

        return rowText;
    }

    async editDevice(table, uid) {
        var rows = await table.locator("xpath=.//tbody//tr").elementHandles();;
        for (var i = 0; i < rows.length; i++) {
            var rowdata = await this.basePage.getRowText(rows[i]);
            if (rowdata.includes(uid)) {
                await this.page.waitForTimeout(2000);
                var editIcon = await rows[i].$('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.editDevice);
                await this.page.evaluate(([editIcon]) => editIcon.click(), [editIcon]);
                break;
            }
        }
        await this.page.waitForTimeout(3000);
    }


    async deleteDeviceButton(table, uid) {
        var rows = await table.locator("xpath=.//tbody//tr").elementHandles();
        for (var i = 0; i < rows.length; i++) {
            var rowdata = await this.basePage.getRowText(rows[i]);
            if (rowdata.includes(uid)) {
                await this.page.waitForTimeout(2000);
                var deleteIcon = await rows[i].$('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.deleteDevice);
                await this.page.evaluate(([deleteIcon]) => deleteIcon.click(), [deleteIcon]);

                break;
            }
        }
    }

    async confirmDeleteDevice() {
        await this.page.evaluate("document.querySelector('zui-dialogbox').shadowRoot.querySelector('#accept-button').click()");

    }

    async KeepDevice() {
        await this.page.evaluate("document.querySelector('zui-dialogbox').shadowRoot.querySelector('#cancel-button').click()");
    }

    async deviceNameHint() {
        await this.basePage.waitTillElementIsVisible('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.deviceNameHint, 1000)
        var elementData = await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.deviceNameHint);
        return elementData;

    }
    async aeTitleHint() {
        await this.basePage.waitTillElementIsVisible('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.aeTitleHint, 1000)
        var elementData = await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.aeTitleHint);
        return elementData;
    }
    async ipAddressHint() {
        await this.basePage.waitTillElementIsVisible('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.ipAddressHint, 1000)
        var elementData = await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.ipAddressHint);
        return elementData;
    }
    async portHint() {
        await this.basePage.waitTillElementIsVisible('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.portHint, 1000);
        var elementData = await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.portHint);
        return elementData;
    }
    async aeTitleValidationMessage() {
        await this.basePage.waitTillElementIsVisible('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.aeTitleValidationMessage, 1000);
        var elementData = await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.aeTitleValidationMessage);
        return elementData;
    }

    async portRangeValidationMessage() {
        await this.basePage.waitTillElementIsVisible('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.portRangeValidationMessage, 5000);
        var elementData = await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.portRangeValidationMessage);
        return elementData;

    }
    async getUIValidationMessage() {
        await this.basePage.waitTillElementIsVisible('xpath=' + OR.locators.customerDetailsPage.deviceDetailsForm.uniqueUidAetMessage, 5000);
        return await this.page.locator('xpath=' + OR.locators.customerDetailsPage.deviceDetailsForm.uniqueUidAetMessage).innerText();
    }
    async closeUniqueUidAetValidationDialog() {
        await this.page.locator('xpath=' + OR.locators.customerDetailsPage.deviceDetailsForm.closeValidationDialogButton).click();
        await this.page.waitForTimeout(3000);
    }

    async isCMInstanceDevicesPresent(deviceId) {
        await this.page.waitForTimeout(3000)
        try {
            return await this.page.locator('xpath=' + "//zui-list-accordion[@header-text='" + deviceId + "']//parent::zui-list-accordion/zui-list-accordion-item[@id='btn-devices']").isDisplayed();
        } catch (error) {
            return false
        }


    }
    async isCMInstanceServicePresent(deviceId) {
        await this.page.waitForTimeout(3000);
        try {
            return await this.page.locator('xpath=' + "//zui-list-accordion[@header-text='" + deviceId + "']//parent::zui-list-accordion/zui-list-accordion-item[@id='btn-service']").isDisplayed();
        } catch (error) {
            return false
        }

    }


    async isCMInstanceDeviceModulePresent() {
        await this.page.waitForTimeout(3000);
        try {
            return await this.page.locator('xpath=' + "//zui-list-accordion[@header-text='" + deviceId + "']//parent::zui-list-accordion/zui-list-accordion-item[@id='btn-service']").isDisplayed();
        } catch (error) {
            return false
        }

    }
    async getUserHintInformationOnTimeZoneText() {
        await this.page.waitForSelector('id=' + OR.locators.customerDetailsPage.settingsSubTab.userHintInformationOnTimezoneMessage, { waitFor: 'visible', timeout: 60000 })
        return await this.page.innerHTML('id=' + OR.locators.customerDetailsPage.settingsSubTab.userHintInformationOnTimezoneMessage);
    }
    async selectTimeframe(option) {
        if (option == 1) {
            await this.page.locator('xpath=' + OR.locators.customerDetailsPage.settingsSubTab.timeframe1RadionButton).click();
        } else if (option == 2) {
            await this.page.locator('xpath=' + OR.locators.customerDetailsPage.settingsSubTab.timeframe2RadionButton).click();
        } else if (option == 3) {
            await this.page.locator('xpath=' + OR.locators.customerDetailsPage.settingsSubTab.timeframe3RadionButton).click();
        }

        await this.page.waitForTimeout(30000)
    }
    async getSelectedTimeframeOption() {
        await this.page.waitForSelector('xpath=' + OR.locators.customerDetailsPage.settingsSubTab.selectedTimeframe, { waitFor: 'visible', timeout: 60000 });
        return await this.page.locator('xpath=' + OR.locators.customerDetailsPage.settingsSubTab.selectedTimeframe).getAttribute("value");
    }
    async getTimeframeRadioButton(option) {
        if (option == 1) {
            return await this.page.locator('xpath=' + OR.locators.customerDetailsPage.settingsSubTab.timeframe1RadionButton)
        } else if (option == 2) {
            return await this.page.locator('xpath=' + OR.locators.customerDetailsPage.settingsSubTab.timeframe2RadionButton)
        } else if (option == 3) {
            return await this.page.locator('xpath=' + OR.locators.customerDetailsPage.settingsSubTab.timeframe3RadionButton)
        } else {
            return null;
        }
    }

    async getCreateLogFileState() {
        return await this.page.locator('xpath=' + OR.locators.customerDetailsPage.serviceRequestPage.requestLogButton).getAttribute('disabled');
    }

    // Bandwidth data
    async getlimitUpstreamBandwidthCheckBox() {
        return await this.page.locator('xpath=' + OR.locators.customerDetailsPage.settingsSubTab.limitUpstreamBandwidthCheckBox).getAttribute('value');
    }
    async getlimitDownstreamBandwidthCheckBox() {
        return await this.page.locator('xpath=' + OR.locators.customerDetailsPage.settingsSubTab.limitDownstreamBandwidthCheckBox).getAttribute('value');
    }

    async getUpstreamBandwidthValue() {
        await this.page.locator('xpath=//h2[@id=\"txt-bandwidth-header\"]').click();
        var upstreamSpeed = await this.page.evaluate("document.querySelector('zui-textfield[id=\"inp-upstream-bandwidth\"]').shadowRoot.querySelector('input').value");
        return upstreamSpeed;
    }

    async getDownstreamBandwidthValue() {
        await this.page.locator('xpath=//h2[@id=\"txt-bandwidth-header\"]').click();
        var downstreamSpeed = await this.page.evaluate("document.querySelector('zui-textfield[id=\"inp-downstream-bandwidth\"]').shadowRoot.querySelector('input').value");
        return downstreamSpeed;
    }

    async getApplyButton() {
        return await this.page.locator('xpath=' + OR.locators.customerDetailsPage.settingsSubTab.ApplyButton).isEnabled();
    }

    async getApplyButtoninitialState() {
        return await this.page.locator('xpath=' + OR.locators.customerDetailsPage.settingsSubTab.ApplyButton).getAttribute('disabled');
    }
    async isAEIDFieldSVisible() {
        return await this.page.locator('id='+ OR.locators.customerDetailsPage.deviceDetailsForm.aeTitleInput).isVisible();
    }

    async isPORTFieldVisible() {
        return await this.page.locator('id='+ OR.locators.customerDetailsPage.deviceDetailsForm.portInput).isVisible();
    } 
    
    
    async isModalityFieldVisible() {
        return await this.page.locator('id='+ OR.locators.customerDetailsPage.deviceDetailsForm.modalitySelect).isVisible();
    } 
    // #1
    async clicklimitUpstreamBandwidthCheckBox() {
        if (await this.page.locator('xpath=' + OR.locators.customerDetailsPage.settingsSubTab.limitUpstreamBandwidthCheckBox).getAttribute('value') == 'true') {
            var limitUpstreamele = await this.page.locator('css=zui-textfield#inp-upstream-bandwidth input#raw')
            await limitUpstreamele.fill("")
        }
        else {
            await this.page.locator('xpath=' + OR.locators.customerDetailsPage.settingsSubTab.limitUpstreamBandwidthCheckBox).click()
            await this.page.waitForTimeout(2000)
            var val = await this.page.locator('xpath=' + OR.locators.customerDetailsPage.settingsSubTab.limitUpstreamBandwidthCheckBox).getAttribute('value')
            expect(val).toBe('true');
        }
        await this.page.waitForTimeout(2000)
    }

    // #1_A
    async clicklimitDownstreamBandwidthCheckBox() {
        if (await this.page.locator('xpath=' + OR.locators.customerDetailsPage.settingsSubTab.limitDownstreamBandwidthCheckBox).getAttribute('value') == 'true') {
            var limitDownstreamele = await this.page.locator('css=zui-textfield#inp-downstream-bandwidth input#raw')
            await limitDownstreamele.fill("");

        }
        else {
            await this.page.locator('xpath=' + OR.locators.customerDetailsPage.settingsSubTab.limitDownstreamBandwidthCheckBox).click()
            await this.page.waitForTimeout(2000)
            var val = await this.page.locator('xpath=' + OR.locators.customerDetailsPage.settingsSubTab.limitDownstreamBandwidthCheckBox).getAttribute('value')
            expect(val).toBe('true');
        }
        await this.page.waitForTimeout(2000)
    }
    // #2
    async enterLimitUpstreamSpeed(speedData) {
        var limitUpstreamele = await this.page.locator('css=zui-textfield#inp-upstream-bandwidth input#raw')
        await limitUpstreamele.fill("")
        await limitUpstreamele.fill(speedData.toString())
        await this.page.waitForTimeout(2000)
        await limitUpstreamele.press('Enter')
        await this.page.waitForTimeout(5000)
    }
    // #2_A
    async enterLimitDownstreamSpeed(speedData) {
        var limitDownstreamele = await this.page.locator('css=zui-textfield#inp-downstream-bandwidth input#raw')
        await limitDownstreamele.fill("");
        await limitDownstreamele.fill(speedData.toString())
        await this.page.waitForTimeout(2000)
        await limitDownstreamele.press('Enter')
        await this.page.waitForTimeout(5000)
    }

    async clickApplyButton() {
        await this.page.locator('xpath=' + OR.locators.customerDetailsPage.settingsSubTab.ApplyButton).click();
        await this.page.waitForTimeout(4000)
    }


    // Custom Label Update UI ------------>>>>>>>>>>>

    async isGeneralSectionDisplayed() {
        await this.page.waitForTimeout(2000);
        var visible = await this.page.locator('id=' + OR.locators.customerDetailsPage.settingsSubTab.GeneralLabel).isVisible();
        return visible;
    }

    async isNameLabelDisplayed() {
        await this.page.waitForTimeout(2000);
        var visible = await this.page.locator('xpath=' + OR.locators.customerDetailsPage.settingsSubTab.CustomNameLabel).isVisible();
        return visible;
    }

    async compareGeneralLabel() {
        await this.page.waitForSelector('id=' + OR.locators.customerDetailsPage.settingsSubTab.GeneralLabel, { waitFor: 'visible', timeout: 60000 })
        var actual = (await this.page.innerHTML('id=' + OR.locators.customerDetailsPage.settingsSubTab.GeneralLabel)).trim();
        var expected = LAN.titleGeneralSettings;
        return (actual == expected);
    }

    async compareNameLabel() {
        await this.page.waitForSelector('xpath=' + OR.locators.customerDetailsPage.settingsSubTab.CustomNameLabel, { waitFor: 'visible', timeout: 60000 })
        var actual = (await this.page.innerHTML('xpath=' + OR.locators.customerDetailsPage.settingsSubTab.CustomNameLabel)).trim();
        var expected = LAN.customLabel;
        return (actual == expected);
    }

    async compareNamePlaceholder() {
        await this.page.waitForSelector('css=zui-textfield#inp-general input#raw', { waitFor: 'visible', timeout: 60000 })
        var actual = (await this.page.locator('css=zui-textfield#inp-general input#raw').getAttribute('placeholder')).trim();
        var expected = LAN.generalCustomLabelPlaceholder;
        return (actual == expected);
    }

    async compareApplyLabel() {
        await this.page.waitForSelector('id=' + OR.locators.customerDetailsPage.settingsSubTab.CustomNameApply, { waitFor: 'visible', timeout: 60000 })
        var actual = (await this.page.innerHTML('id=' + OR.locators.customerDetailsPage.settingsSubTab.CustomNameApply)).trim();
        var expected = LAN.applySettings;
        return (actual == expected);
    }

    async enterCustomName(name) {
        var customLabel = await this.page.locator('css=zui-textfield#inp-general input#raw')
        await customLabel.fill(name);
        await customLabel.press('Enter')
    }

    async customnameSave() {
        await this.page.locator('id=' + OR.locators.customerDetailsPage.settingsSubTab.CustomNameApply).click();
        var loadSpinner = 'id=' + OR.locators.customerDetailsPage.statusSubTab.loadSpinner;
        await this.basePage.waitTillElementIsInvisible(loadSpinner)
        await this.page.waitForTimeout(5000);
    }

    async compareDeviceName() {
        await this.page.reload();
        await this.page.waitForSelector('id=' + OR.locators.customerDetailsPage.deviceId, { waitFor: 'visible', timeout: 60000 })
        var deviceid = await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceId).innerText();
        return deviceid;
    }

    async comparecustomLabelError() {
        var actual = await this.page.locator('css=zui-textfield#inp-general zui-error-message#error').innerText();
        var expected = LAN.customLabelError;
        return (actual == expected);
    }

    async validateCustomNameDisplayedinAccordion(deviceId, customLabel) {
        try {
            var locator = "xpath=//zui-list-accordion[@header-text='" + deviceId + "'and @second-line-text='" + customLabel + "']";
            return await this.page.locator(locator).isVisible();
        }

        catch (error) {
            return false
        }

    }

    // <<<<<<<<<<------------Custom Label Update UI 

};
