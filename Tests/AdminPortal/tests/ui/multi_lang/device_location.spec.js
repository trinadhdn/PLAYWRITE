const { BasePage } = require('../../../pages/base_page.js');
const { DevicesPage } = require('../../../pages/languages/devices_page.js');
const { TestData } = require('../../../utils/test_data.js');
const { test, expect } = require('@playwright/test');
const { CustomerListPage } = require('../../../pages/customer_list_page.js');
const { StatusListPage } = require('../../../pages/languages/defaultAndStatus_list_page');
const { DeviceLocationPage } = require('../../../pages/device_location_page.js');
const { CustomerDetailsPage } = require('../../../pages/customer_details_page.js');
const { ApiHelper } = require('../../../helpers/api-helpers.js')
const { CustomerDetailsStatusPage } = require("../../../pages/customer_details_status_page.js");
const { TokenGenerators } = require('../../../utils/token_generators.js');
const { HomePage } = require('../../../pages/home_page.js');

var customerId,customerDetailsRecordSet, customerName, conn, deviceId, customerDetailsId, token;
var testDevice = process.env.serviceUserHypervDeviceId;
var basePage, customerListPage, customerDetailsPage, homePage,DevicesPage_ML, addLocationPage,StatusPage_ML,customerDetailsStatusPage;

var LAN;
if (process.env.locale.includes("DE")) {
    LAN = require('../../../resources/de.json');
} else if (process.env.locale.includes("FR")) {
    LAN = require('../../../resources/fr.json');
}else if (process.env.locale.includes("EN")) {
    LAN = require('../../../resources/en.json');
}else if (process.env.locale.includes("ES")) {
    LAN = require('../../../resources/es.json');
}else{
    LAN = require('../../../resources/en.json');
}

test.describe('Multi-language check for Device Location module with L1 user', function () {
    test.beforeAll(async function () {
        // test data preparation     
        conn = await TestData.sqlDBConnection();
        var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where iotdeviceId ='"+testDevice+"' and activationStatus='True' for json auto")
        var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        deviceId = deviceRecord[0].iotDeviceId;
        customerDetailsId = deviceRecord[0].customerDetailsId;
        conn = await TestData.sqlDBConnection();
        customerDetailsRecordSet = await TestData.executeSqlQuery(conn, "select * from [dbo].[CustomerDetails] where customerdetailsId=" + customerDetailsId + " for json auto")
        var customerDetailsRecord = JSON.parse(customerDetailsRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        customerId = customerDetailsRecord[0].customerId;
        customerName = customerDetailsRecord[0].customerName;

        console.log("customerName: " + customerName)
        console.log("customerId: " + customerId)
    });

    test.beforeEach(async function ({ page }) {
        basePage = new BasePage(page);
        homePage = new HomePage(page);
        customerListPage = new CustomerListPage(page);
        customerDetailsPage = new CustomerDetailsPage(page);
        StatusPage_ML = new StatusListPage(page);
        customerDetailsStatusPage = new CustomerDetailsStatusPage(page);
        DevicesPage_ML = new DevicesPage(page);
        addLocationPage = new DeviceLocationPage(page);

    })

    // US#353679 US#353676
    test('Check Device Location screen with Multi Languages @353679 @353676 @366326', async function ({ page }) {
        // Navigate to Customer list page
        let locName = "AutoLoc-" + await ApiHelper.createlocname(4)
        let locDesc = "This is the location: " + locName
        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(customerId);
        await customerListPage.selectCustomer(customerName);
      
        await customerDetailsPage.selectCMInstance(deviceId);

        await customerDetailsPage.selectCMInstanceDevices(deviceId);
        await homePage.clickUserButton();
        expect(await homePage.comparedeviceLocationsAction_LabelText()).toEqual(true);
        await homePage.clickDeviceLocations();
        expect(await addLocationPage.getDeviceLocationsTableColumnHeaders()).toEqual([LAN.locationNameColName.toUpperCase(),LAN.descriptionTitle.toUpperCase(),LAN.actionColName.toUpperCase()]);
        expect(await addLocationPage.compareAddLocationButton_LabelText()).toEqual(true);

        await addLocationPage.addLocationButtonClick();
        expect(await addLocationPage.comparelocationNameAttribute_LabelText()).toEqual(true);
        expect(await addLocationPage.compare_mldescriptionAttribute_LabelText()).toEqual(true);
        await addLocationPage.fillLocationName(locName);
        await addLocationPage.fillDescription(locDesc);
        expect(await addLocationPage.compareAddButton_LabelText()).toEqual(true);
        expect(await addLocationPage.compareCancelButton_LabelText()).toEqual(true);
        await addLocationPage.ClickAdd();
        await addLocationPage.editDeviceLocationButton(locName);
        expect(await addLocationPage.comparelocationNameAttribute_LabelText()).toEqual(true);
        expect(await addLocationPage.comparedescriptionAttribute_LabelText()).toEqual(true);
        await addLocationPage.ClickSave();
        await addLocationPage.connectDeviceLocationButton(locName);
        expect(await addLocationPage.isPresent_CloseButtonConnectDeviceLocationPopup()).toBe(false);//366326
        // expect(await addLocationPage.compareCloseButtonConnectDeviceLocationPopup_LabelText()).toEqual(true);//366326
        expect(await addLocationPage.compareConnectDeviceLocationHeaderPopup_LabelText()).toEqual(true);
        expect(await addLocationPage.compareConnectDeviceLocationLocationNamePopup_LabelText()).toEqual(true);
        await addLocationPage.closeConnectLocation();
        await addLocationPage.deleteDeviceLocationButton(locName);      
        expect(await addLocationPage.ValidateLocationNameSubHeaderOnDeleteConfirmation(locName)).toEqual(true);
        //expect(await addLocationPage.ValidateLocationNameHeaderMessageOnDeleteConfirmation()).toEqual(true);
        expect(await addLocationPage.ValidateLocationSubHeaderSecondLineOnDeleteConfirmation()).toEqual(true);
        await addLocationPage.confirmDeleteLocation();

    });

});
