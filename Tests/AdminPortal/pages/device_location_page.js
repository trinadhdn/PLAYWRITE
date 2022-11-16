var OR = require('../resources/OR.json');
var deviceTypes = require('../helpers/device-types.json');
const { Comparisions } = require('../utils/comparisions.js');
const { BasePage } = require('./base_page.js');
const { expect } = require('@playwright/test');
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
} else {
    LAN = require('../resources/en.json');
}

exports.DeviceLocationPage = class DeviceLocationPage {

    constructor(page) {
        this.page = page;
        this.basePage = new BasePage(page);

    }

    async addLocationButtonClick() {
        await this.page.waitForTimeout(2000);
        await this.page.locator('id=' + OR.locators.deviceLocations.addLocationButton).click();
        await this.page.waitForTimeout(1000);
    }

    async compareAddLocationButton_LabelText() {
        var actual = await this.page.locator('id=' + OR.locators.deviceLocations.addLocationButton).innerText();
        var expected = await LAN.addLocationButtonLabel;
        return (actual.trim() == expected);
    }

    async ClickOKOnDeviceLocationPopup() {
        await this.page.waitForTimeout(2000)
        await this.page.evaluate("document.querySelector('zui-dialogbox[header-text=\"" + await LAN.deviceLocations + "\"]').shadowRoot.querySelector('button#accept-button').click()");
        await this.page.waitForTimeout(1000)
    }

    async isPresent_CloseButtonConnectDeviceLocationPopup() {
        var button = await this.page.locator('css=zui-dialogbox.parent-dialog button#cancel-button').isVisible();
        return button
    }

    async isPresent_OkButtonConnectDeviceLocationPopup() {
        var button = await this.page.locator('css=zui-dialogbox.parent-dialog button#accept-button').isVisible();
        return button
    }

    async isCloseButtonPresent_locationpopup() {
        var button = await this.page.locator('css=zui-dialogbox.parent-dialog-locationModal button#cancel-button').isVisible();
        return button
    }

    async isOKButtonPresent_locationpopup() {
        var button = await this.page.locator('css=zui-dialogbox.parent-dialog-locationModal button#accept-button').isVisible();
        return button
    }

    async compareCloseButtonConnectDeviceLocationPopup_LabelText() {
        var actual = await this.page.evaluate("document.querySelector('zui-dialogbox[header-text=\"" + await LAN.deviceLocations + "\"]').shadowRoot.querySelector('button#cancel-button').textContent");
        await this.page.waitForTimeout(1000)
        var expected = await LAN.closeModalButtonLabel;
        return (actual == expected);
    }

    async compareCloseButtonDeviceLocationPopup_LabelText() {
        var actual = await this.page.evaluate("document.querySelector('zui-dialogbox[header-text=\"" + await LAN.deviceLocations + "\"]').shadowRoot.querySelector('button#cancel-button').textContent");
        await this.page.waitForTimeout(1000)
        var expected = await LAN.closeModalButtonLabel;
        return (actual == expected);
    }

    async compareAddButtonConnectDeviceLocationPopup_LabelText() {
        var actual = await this.page.evaluate("document.querySelector('[id*=\"mat-dialog\"]').querySelector('zui-dialogbox').shadowRoot.querySelector('section').querySelector('footer').querySelector('[id=\"accept-button\"]').textContent");
        await this.page.waitForTimeout(1000)
        var expected = await LAN.okButtonLabel;
        return (actual == expected);
    }
    async compareConnectDeviceLocationHeaderPopup_LabelText() {
        var actual = await this.page.evaluate("document.querySelector('[id*=\"mat-dialog\"]').querySelector('zui-dialogbox').shadowRoot.querySelector('section').querySelector('header').querySelector('[id=\"headertextcontainer\"]').textContent");
        await this.page.waitForTimeout(1000)
        var expected = await LAN.deviceLocations;
        return (actual == expected);
    }
    async compareConnectDeviceLocationLocationNamePopup_LabelText() {
        await this.page.waitForTimeout(1000)
        var actual = await this.page.evaluate("document.querySelector('[id=\"lbl-location-name\"]').textContent");
        var expected = await LAN.locationNameTitle;
        return (actual == expected);
    }

    async clickCloseonDeviceLocationPopup() {
        await this.page.waitForTimeout(2000)
        await this.page.evaluate("document.querySelector('zui-dialogbox[header-text=\"" + await LAN.deviceLocations + "\"]').shadowRoot.querySelector('button#cancel-button').click()");
        await this.page.waitForTimeout(1000)
    }

    async getDeviceLocationsTable() {
        await this.page.waitForTimeout(3000);
        return await this.page.locator('xpath=' + OR.locators.deviceLocations.deviceLocationsTable);
    }


    async isDeviceLocationsTablePresent() {

        await this.page.waitForTimeout(2000);
        try {
            return await this.page.locator('id=' + OR.locators.deviceLocations.LocationsTable).isVisible();
        } catch (error) {
            return false
        }

    }

    async getDeviceLocationsTableColumnHeaders() {
        var table = await this.getDeviceLocationsTable()
        var columnElements = await table.locator('xpath=' + ".//th").elementHandles();
        var columns = [];
        for (var i = 0; i < columnElements.length; i++) {
            columns.push((await columnElements[i].innerText()).trim());
        }
        return columns;
    }

    async getLocationFromDeviceLocationsTable(location) {
        var table = await this.getDeviceLocationsTable();
        var loadSpinner = 'xpath=' + OR.locators.customerListPage.loadSpinner;
        await this.basePage.waitTillElementIsInvisible(loadSpinner);
        var rows = await table.locator("xpath=.//tbody//tr").elementHandles();
        var rowText = new Map();
        var i;
        for (var i = 0; i < rows.length; i++) {
            var rowdata = await this.basePage.getRowText(rows[i]);
            if (rowdata.includes(location)) {
                rowText.set(OR.locators.deviceLocations.deviceHeaders.locationName, rowdata[0]);
                rowText.set(OR.locators.deviceLocations.deviceHeaders.description, rowdata[1]);
                break;
            }
        }

        return rowText;
    }

    async isLocationPresentinDeviceLocationTable(location) {
        var table = await this.getDeviceLocationsTable();
        var loadSpinner = 'xpath=' + OR.locators.customerListPage.loadSpinner;
        await this.page.waitForTimeout(3000);
        var rows = await table.locator("xpath=.//tbody//tr").elementHandles();
        var rowText = new Map();
        var i;
        for (var i = 0; i < rows.length; i++) {
            var rowdata = await this.basePage.getRowText(rows[i]);
            if (rowdata.includes(location)) {
                return true;
            }
        }

        return false;
    }

    async deleteDeviceLocationButton(location) {
        var table = await this.getDeviceLocationsTable();
        var rows = await table.locator("xpath=.//tbody//tr").elementHandles();
        for (var i = 0; i < rows.length; i++) {
            var rowdata = await this.basePage.getRowText(rows[i]);
            if (rowdata.includes(location)) {
                await this.page.waitForTimeout(2000);
                var k = i + 1;
                await this.page.evaluate("document.querySelector('[id=\"tbl-active-devicelocation-list\"]').querySelector(\"tbody > tr:nth-of-type(" + k + ") > td:nth-of-type(3)\").querySelector(\"zui-icon-common-delete\").click()");
                break;
            }
        }
    }

    async connectDeviceLocationButton(location) {
        var table = await this.getDeviceLocationsTable();
        var rows = await table.locator("xpath=.//tbody//tr").elementHandles();
        for (var i = 0; i < rows.length; i++) {
            var rowdata = await this.basePage.getRowText(rows[i]);
            if (rowdata.includes(location)) {
                await this.page.waitForTimeout(2000);
                var connectLocationIcon = await rows[i].$('id=' + OR.locators.deviceLocations.connectDeviceLocation);
                await this.page.evaluate(([connectLocationIcon]) => connectLocationIcon.click(), [connectLocationIcon]);

                break;
            }
        }
    }

    async confirmDeleteLocation() {
        await this.page.evaluate("document.querySelector('zui-dialogbox.parent-dialog-modal').shadowRoot.querySelector('#accept-button').click()");
        await this.page.waitForTimeout(3000)
    }

    async KeepLocation() {
        await this.page.evaluate("document.querySelector('zui-dialogbox.parent-dialog-modal').shadowRoot.querySelector('#cancel-button').click()");
        await this.page.waitForTimeout(2000)
    }


    async closeConnectLocation() {
        await this.page.evaluate("document.querySelector('[class=\"parent-dialog\"]').shadowRoot.querySelector('footer').querySelector('[id=\"accept-button\"]').click()");
        await this.page.waitForTimeout(3000)
    }




    async ValidateLocationNameHeaderMessageOnDeleteConfirmation() {
        var actual = await this.page.locator('xpath=' + OR.locators.deviceLocations.deleteLocationPopupHeader).innerText();
        var expected = await LAN.deleteLocationModalHeader;
        return (actual == expected);
    }

    async ValidateLocationNameSubHeaderOnDeleteConfirmation(locationName) {
        var actual = await this.page.locator('xpath=' + OR.locators.deviceLocations.deleteLocationPopupLocationName + '[1]').innerText();
        return (actual == locationName);
    }

    async ValidateLocationSubHeaderSecondLineOnDeleteConfirmation() {
        var actual = await this.page.locator('xpath=' + OR.locators.deviceLocations.deleteLocationPopupLocationName + '[2]').innerText();
        var expected = await LAN.deleteLocFormInfoLabel;
        return (actual == expected);
    }

    async ValidateLocationSubHeaderSecondLineOnDeleteConfirmation() {
        var actual = await this.page.locator('xpath=' + OR.locators.deviceLocations.deleteLocationPopupLocationName + '[2]').innerText();
        var expected = await LAN.deleteLocFormInfoLabel;
        return (actual == expected);
    }

    async getDeleteWarningHeaderMsg() {
        await this.page.waitForTimeout(2000)
        var actual = await this.page.evaluate("document.querySelector('zui-ewiq-dialog[class=\"ewiq-dialog\"').querySelector('zui-ewiq-dialog-headline').textContent");
        var expected = await LAN.deleteLocationFailedHeader;
        await this.page.waitForTimeout(1000)
        return (actual == expected);
    }

    async getDeleteWarningSubHeaderMsg(locationName) {
        await this.page.waitForTimeout(1000)
        var actual = await this.page.evaluate("document.querySelector('zui-ewiq-dialog[class=\"ewiq-dialog\"').querySelector('div[id=\"txt-body\"]').textContent");
        var expected = await LAN.deleteLocationFailedErrorMessage;
        expected = expected.replace('{LOCATION_NAME}', locationName);
        await this.page.waitForTimeout(2000)
        return (actual == expected);

    }

    async clickCloseOnDeleteWarningMessagePopup() {
        await this.page.waitForTimeout(2000)
        await this.page.evaluate("document.querySelector('zui-ewiq-dialog[class=\"ewiq-dialog\"').querySelector('zui-dialog-button').click()");
        await this.page.waitForTimeout(3000)

    }

    async editDeviceLocationButton(location) {
        var table = await this.getDeviceLocationsTable();
        var rows = await table.locator("xpath=//tbody//tr").elementHandles();
        for (var i = 0; i < rows.length; i++) {
            var rowdata = await this.basePage.getRowText(rows[i]);
            if (rowdata.includes(location)) {
                await this.page.waitForTimeout(2000);
                var k = i + 1;
                await this.page.evaluate("document.querySelector('[id=\"tbl-active-devicelocation-list\"]').querySelector(\"tbody > tr:nth-of-type(" + k + ") > td:nth-of-type(3)\").querySelector(\"zui-icon-common-edit-edit\").click()");
                break;
            }
        }
    }

    async ClickSave() {
        await this.page.evaluate("document.querySelector('zui-dialogbox[header-text=\"" + await LAN.editLocationHeader + "\"]').shadowRoot.querySelector('button#accept-button').click()");
        await this.page.waitForTimeout(3000)
    }

    async getLocationName() {
        return await this.page.locator('id=' + OR.locators.deviceLocations.locationNameInput).getAttribute("value");
    }

    async getLocationDescription() {
        return await this.page.locator('id=' + OR.locators.deviceLocations.descriptionInput).getAttribute("value");
    }

    async comparelocationNameAttribute_LabelText() {
        var actual = await this.page.locator('id=' + OR.locators.deviceLocations.locationAttribute).innerText();
        var expected = await LAN.locationNameTitle;
        expected = expected + ' *'
        return (actual == expected);
    }

    async fillLocationName(locationName) {
        var diagadd = await this.page.locator('css=zui-textfield[placeholder=\"' + await LAN.locationNamePlaceholder + '\"] input#raw')
        await diagadd.fill(locationName);
        await this.page.keyboard.press('Tab');
        await diagadd.press('Enter');
        await this.page.waitForTimeout(2000);
    }

    async locationNameValidationMessage() {
        await this.basePage.waitTillElementIsVisible(locationNameError, 5000);
        var elementData = await this.page.locator(locationNameError);
        return elementData;
    }

    async compare_mldescriptionAttribute_LabelText() {
        var actual = await this.page.locator('id=' + OR.locators.deviceLocations.ml_descriptionAttribute).innerText();
        var expected = await LAN.descriptionTitle;
        return (actual == expected);
    }
    async comparedescriptionAttribute_LabelText() {
        var actual = await this.page.locator('id=' + OR.locators.deviceLocations.ml_descriptionAttribute).innerText();
        var expected = await LAN.descriptionTitle;
        return (actual == expected);
    }

    async getLocationDevicesText() {
        return await this.page.locator('id=' + OR.locators.deviceLocations.descriptionAttribute).getAttribute("value");

    }
    async fillDescription(description) {
        var diagadd = await this.page.locator('css=zui-textarea[placeholder=\"' + await LAN.locationDescriptionPlaceholder + '\"] textarea')
        await diagadd.fill(description);
        // await this.page.keyboard.press('Tab');
        // await diagadd.press('Enter');
        await this.page.waitForTimeout(1000);
    }

    async compareAddButton_LabelText() {
        var actual = await this.page.evaluate("document.querySelector('zui-dialogbox[header-text=\"" + await LAN.addLocationHeader + "\"]').shadowRoot.querySelector('button#accept-button').textContent");
        await this.page.waitForTimeout(1000)
        var expected = await LAN.addButtonLabel;
        return (actual == expected);
    }

    async ClickAdd() {
        await this.page.waitForTimeout(2000)
        await this.page.evaluate("document.querySelector('zui-dialogbox[header-text=\"" + await LAN.addLocationHeader + "\"]').shadowRoot.querySelector('button#accept-button').click()");
        await this.page.waitForTimeout(2000)
    }

    async compareCancelButton_LabelText() {
        var actual = await this.page.evaluate("document.querySelector('zui-dialogbox[header-text=\"" + await LAN.addLocationHeader + "\"]').shadowRoot.querySelector('button#cancel-button').textContent");
        await this.page.waitForTimeout(1000)
        var expected = await LAN.keepLocButtonLabel;
        return (actual == expected);
    }

    async clickCancel() {
        await this.page.waitForTimeout(2000)
        await this.page.evaluate("document.querySelector('zui-dialogbox[header-text=\"" + await LAN.addLocationHeader + "\"]').shadowRoot.querySelector('button#cancel-button').click()");
        await this.page.waitForTimeout(2000)
    }

}