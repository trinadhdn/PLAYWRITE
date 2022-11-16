const { BasePage } = require('../../../pages/base_page.js');
const { test, expect } = require('@playwright/test');
const { CustomerListPage } = require('../../../pages/customer_list_page.js');
const { CustomerDetailsPage } = require('../../../pages/customer_details_page.js');
const { HomePage } = require('../../../pages/home_page.js');
const { DeviceLocationPage } = require('../../../pages/device_location_page.js');
const { TestData } = require('../../../utils/test_data.js');
const { ApiHelper } = require('../../../helpers/api-helpers.js');
var OR = require('../../../resources/OR.json');
const { TokenGenerators } = require('../../../utils/token_generators.js');

var deviceId, customer, conn, token, customerId;
var hypervDeviceId = process.env.serviceUserHypervDeviceId;
var basePage, customerListPage, customerDetailsPage, homePage, addLocationPage, sastoken;
var LAN,customerDetailsId,conn,customerDetailsRecordSet,customerDetailsRecord;
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih"
const iothubResourceUri = iothub + '.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'

if (process.env.locale.includes("DE")) {
    LAN = require('../../../resources/de.json');
} else if (process.env.locale.includes("FR")) {
    LAN = require('../../../resources/fr.json');
} else if (process.env.locale.includes("EN")) {
    LAN = require('../../../resources/en.json');
} else if (process.env.locale.includes("ES")) {
    LAN = require('../../../resources/es.json');
} else {
    LAN = require('../../../resources/en.json');
}
var searchCriteria = "6100";
test.describe('Device Locations Functionality', function () {
    test.beforeAll(async function () {

        // test data preparation     
        conn = await TestData.sqlDBConnection();
        var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where iotdeviceId = '" + hypervDeviceId + "' for json auto")
        var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        deviceId = deviceRecord[0].iotDeviceId;
        customerDetailsId = deviceRecord[0].customerDetailsId;
        conn = await TestData.sqlDBConnection();
        customerDetailsRecordSet = await TestData.executeSqlQuery(conn, "select * from [dbo].[CustomerDetails] where customerdetailsId=" + customerDetailsId + " for json auto")
        var customerDetailsRecord = JSON.parse(customerDetailsRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        sastoken = await TokenGenerators.generateSasToken(iothubResourceUri, iothubPolicyKey, iothubPolicy, 30)

        customerId = customerDetailsRecord[0].customerId;
        customer = customerDetailsRecord[0].customerName;
        console.log("customerId: " + customer)
        console.log("deviceId: " + deviceId)
    });

    test.beforeEach(async function ({ page }) {
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        await ApiHelper.deleteAll_ActiveDevice(token, deviceId);
        await ApiHelper.deleteAll_AutomationDeviceLocations(token, customerId);
        basePage = new BasePage(page);
        customerListPage = new CustomerListPage(page);
        customerDetailsPage = new CustomerDetailsPage(page);
        homePage = new HomePage(page);
        addLocationPage = new DeviceLocationPage(page);
    })

    //US#353679,364463
    test('L1 User verifies device location action is not present on Select Customers page @353679 @364463', async function () {
        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(customer);
        await homePage.clickUserButton();
        expect(await homePage.isDeviceLocationsActionVisible()).toEqual(false);
    })

    //US#353679,364463
    test('L1 User verifies the presence of table and the column headers including multi language @353679 @364463', async function () {
        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(searchCriteria);
        await customerListPage.selectCustomer(customer);

        await homePage.clickUserButton();
        await homePage.clickDeviceLocations();

        //validating table headers, table
        var isTablePresent = await addLocationPage.isDeviceLocationsTablePresent();
        expect(isTablePresent).toEqual(true);
        expect(await addLocationPage.getDeviceLocationsTableColumnHeaders()).toEqual([LAN.locationNameColName, LAN.descriptionTitle.toUpperCase(), LAN.actionColName])
    })

    //US#353679,364463
    test('L1 User should be able to add a new location and validates it in the location list table and validate the character constraint @353679 @364463', async function () {
        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(searchCriteria);
        await customerListPage.selectCustomer(customer);

        await homePage.clickUserButton();
        await homePage.clickDeviceLocations();

        await addLocationPage.addLocationButtonClick();
        var locName = Math.random().toString(36).substring(2, 5).toUpperCase();
        var locNameAltered = 'AutoLoc' + locName + '12345678901234567890123456789012345678901234567890';

        //user validates that only 50 characters gets added to location Name and rest is ignored
        await addLocationPage.fillLocationName(locNameAltered);
        await addLocationPage.fillDescription("TrialDescription");
        await addLocationPage.ClickAdd();
        var deviceList = await addLocationPage.getLocationFromDeviceLocationsTable('AutoLoc' + locName + '1234567890123456789012345678901234567890');
        expect(deviceList.get(OR.locators.deviceLocations.deviceHeaders.locationName)).toEqual('AutoLoc' + locName + '1234567890123456789012345678901234567890');
        expect(deviceList.get(OR.locators.deviceLocations.deviceHeaders.description)).toEqual("TrialDescription");
        await addLocationPage.deleteDeviceLocationButton('AutoLoc' + locName + '1234567890123456789012345678901234567890');
        await addLocationPage.confirmDeleteLocation();

        //validating if user is successfully able to add a location without description
        await addLocationPage.addLocationButtonClick();
        locName = Math.random().toString(36).substring(2, 5).toUpperCase();
        await addLocationPage.fillLocationName('AutoLoc' + locName);

        await addLocationPage.ClickAdd();

        //validating the table if the above created location is added to the table
        var deviceList = await addLocationPage.getLocationFromDeviceLocationsTable('AutoLoc' + locName);
        expect(deviceList.get(OR.locators.deviceLocations.deviceHeaders.locationName)).toEqual('AutoLoc' + locName);
        expect(deviceList.get(OR.locators.deviceLocations.deviceHeaders.description)).toEqual("null");
        await addLocationPage.deleteDeviceLocationButton('AutoLoc' + locName);
        await addLocationPage.confirmDeleteLocation();
    })

    //US#353679,364463
    test('L1 User - Verify that the device location is not added if user hits Cancel button on Add Device Location @353679 @364463', async function () {
        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(searchCriteria);
        await customerListPage.selectCustomer(customer);
        var expectedCustomerName;
        if (customer.length <= 30) {
            expectedCustomerName = customer;
        } else {
            expectedCustomerName = customer.substring(0, 17) + "..."
        }
        expect(await customerDetailsPage.getCustomerButtonText()).toEqual(expectedCustomerName);
        await customerDetailsPage.selectCMInstance(deviceId);

        await customerDetailsPage.selectCMInstanceDevices(deviceId);
        expect(await customerDetailsPage.getDeviceId()).toEqual(deviceId);
        await homePage.clickUserButton();
        await homePage.clickDeviceLocations();
        await addLocationPage.addLocationButtonClick();

        //Entering loation name and then user clicks cancel button
        await addLocationPage.fillLocationName("randomLocationName1");
        await addLocationPage.fillDescription("Enter the description here1");
        await addLocationPage.clickCancel();

        //User validates that the location is not added to the list
        var isPresent = await addLocationPage.isLocationPresentinDeviceLocationTable("randomLocationName1");
        expect(isPresent).toEqual(false);
    })

    //US#353679,364463,366326
    test('L1 User - Verify OK and Cancel Button Behavior on Device Location Popup @353679 @364463 @366326', async function () {
        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(searchCriteria);
        await customerListPage.selectCustomer(customer);

        await customerDetailsPage.selectCMInstance(deviceId);

        await customerDetailsPage.selectCMInstanceDevices(deviceId);
        expect(await customerDetailsPage.getDeviceId()).toEqual(deviceId);
        await homePage.clickUserButton();
        await homePage.clickDeviceLocations();

        // validate the close button is not present
        expect(await addLocationPage.isCloseButtonPresent_locationpopup()).toBe(false)
        expect(await addLocationPage.isOKButtonPresent_locationpopup()).toBe(true)

        //User clicks OK button and verify that the Device Location popup is closed
        await addLocationPage.ClickOKOnDeviceLocationPopup();
        var isTablePresent = await addLocationPage.isDeviceLocationsTablePresent();
        expect(isTablePresent).toEqual(false);

        //No Close button will be present@366326 so below section is not required
        // await homePage.clickUserButton();
        // await homePage.clickDeviceLocations();
        // // await addLocationPage.clickCloseonDeviceLocationPopup();
        // var isTablePresent = await addLocationPage.isDeviceLocationsTablePresent();
        // expect(isTablePresent).toEqual(false);
    })

    //US#353676
    test('L1 User - Verify L1 User is able to edit the existing location, validate existing values and delete the location @353676', async function () {

        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(searchCriteria);
        await customerListPage.selectCustomer(customer);

        await customerDetailsPage.selectCMInstance(deviceId);

        await customerDetailsPage.selectCMInstanceDevices(deviceId);
        expect(await customerDetailsPage.getDeviceId()).toEqual(deviceId);
        await homePage.clickUserButton();
        await homePage.clickDeviceLocations();

        //user adds a location
        var universalLocation = "AutoLoc-" + await ApiHelper.createlocname(4)
        await addLocationPage.addLocationButtonClick();
        await addLocationPage.fillLocationName(universalLocation);
        await addLocationPage.fillDescription("1234AutomationDescription");
        await addLocationPage.ClickAdd();

        //user validated that the existing values are pre-populated on Edit Device Location popup
        await addLocationPage.editDeviceLocationButton(universalLocation);
        expect(await addLocationPage.getLocationName()).toEqual(universalLocation);
        expect(await addLocationPage.getLocationDescription()).toEqual("1234AutomationDescription");

        //update the locaiton name and description on edit device location popup
        await addLocationPage.fillLocationName("edited" + universalLocation);
        await addLocationPage.fillDescription("EditedAutomationDescription");
        await addLocationPage.ClickSave();

        //user validates that the edited location name and description are populated in the table
        var deviceList = await addLocationPage.getLocationFromDeviceLocationsTable("edited" + universalLocation);
        expect(deviceList.get(OR.locators.deviceLocations.deviceHeaders.locationName)).toEqual("edited" + universalLocation);
        expect(deviceList.get(OR.locators.deviceLocations.deviceHeaders.description)).toEqual("EditedAutomationDescription");

        //user validates that the deleted location is no longer part of location table
        await addLocationPage.deleteDeviceLocationButton("edited" + universalLocation);

        //user validates the header message and devlice location name on Delete confirmation popup
        expect(await addLocationPage.ValidateLocationNameHeaderMessageOnDeleteConfirmation()).toEqual(true);
        expect(await addLocationPage.ValidateLocationNameSubHeaderOnDeleteConfirmation("edited" + universalLocation)).toEqual(true);
        expect(await addLocationPage.ValidateLocationSubHeaderSecondLineOnDeleteConfirmation()).toEqual(true);
        await addLocationPage.confirmDeleteLocation();
        var isPresent = await addLocationPage.isLocationPresentinDeviceLocationTable("edited" + universalLocation);
        expect(isPresent).toEqual(false);
    })


    //US#353676
    test('L1 User - Verify L1 User is not able to delete the location that is associated with a device and can be deleted after dis associating it @353676', async function () {

        //user creates a location
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        var universalLocation = "AutoLoc-" + await ApiHelper.createlocname(4)
        var locDesc = "This is the location: " + universalLocation
        var status = "active"
        var Serial = await TestData.generateSerialNumber()
        var postresponse = await ApiHelper.postlocationList(token, customerId, universalLocation, locDesc, status)
        expect(postresponse.status).toBe(200);
        var locIDfromResp = postresponse.data.result.id;

        //user adds a device using above created location
        var response = await ApiHelper.addDevice("DICOM", token, deviceId, "11111", "103.103.103.103", "DeviceUsingLocation", "DUL1", locIDfromResp, "DUL1", "OP: Ophthalmic Photography", 1, "DUL1", Serial, "04057748087141 (CIRRUS 6000)", null);
        expect(response.status).toBe(200);

        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(searchCriteria);
        await customerListPage.selectCustomer(customer);

        await customerDetailsPage.selectCMInstance(deviceId);

        await customerDetailsPage.selectCMInstanceDevices(deviceId);
        expect(await customerDetailsPage.getDeviceId()).toEqual(deviceId);
        await homePage.clickUserButton();
        await homePage.clickDeviceLocations();

        //user tries to delete the location that is used by a device and validates the error message
        await addLocationPage.deleteDeviceLocationButton(universalLocation);
        await addLocationPage.confirmDeleteLocation();
        expect(await addLocationPage.getDeleteWarningHeaderMsg()).toEqual(true);
        expect(await addLocationPage.getDeleteWarningSubHeaderMsg(universalLocation)).toEqual(true);
        await addLocationPage.clickCloseOnDeleteWarningMessagePopup();
        var isPresent = await addLocationPage.isLocationPresentinDeviceLocationTable(universalLocation);
        expect(isPresent).toEqual(true);
        await addLocationPage.ClickOKOnDeviceLocationPopup();

        //delete the device
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        postresponse = await ApiHelper.deleteDevice("DICOM", token, deviceId, "DUL1");
        expect(postresponse.status).toBe(200);
        await homePage.clickUserButton();
        await homePage.clickDeviceLocations();
        await addLocationPage.deleteDeviceLocationButton(universalLocation);
        await addLocationPage.confirmDeleteLocation();
        var isPresent = await addLocationPage.isLocationPresentinDeviceLocationTable(universalLocation);
        expect(isPresent).toEqual(false);
    })

    //US#353676,366326
    test('L1 User - Verify edited location is reflected for the devices that use it @353676 @366326', async function () {

        //user creates a location
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        var universalLocation = "AutoLoc-" + await ApiHelper.createlocname(4)
        var locDesc = "This is the location: " + universalLocation
        var status = "active"
        var Serial = await TestData.generateSerialNumber()
        var postresponse = await ApiHelper.postlocationList(token, customerId, universalLocation, locDesc, status)
        expect(postresponse.status).toBe(200);
        var locIDfromResp = postresponse.data.result.id;

        //user adds a device using above created location
        var response = await ApiHelper.addDevice("DICOM", token, deviceId, "11111", "103.103.103.103", "DeviceUsingLocation", "DUL2", locIDfromResp, "DUL2", "OP: Ophthalmic Photography", 1, "DUL2", Serial, "04057748081118 (ATLAS 9000)", null);
        expect(response.status).toBe(200);

        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(searchCriteria);
        await customerListPage.selectCustomer(customer);

        await customerDetailsPage.selectCMInstance(deviceId);

        await customerDetailsPage.selectCMInstanceDevices(deviceId);
        expect(await customerDetailsPage.getDeviceId()).toEqual(deviceId);
        await homePage.clickUserButton();
        await homePage.clickDeviceLocations();

        await addLocationPage.editDeviceLocationButton(universalLocation);

        //update the locaiton name on edit device location popup       
        await addLocationPage.fillLocationName("Edited" + universalLocation);
        await addLocationPage.ClickSave();

        // validate the close button is not present
        expect(await addLocationPage.isCloseButtonPresent_locationpopup()).toBe(false)
        expect(await addLocationPage.isOKButtonPresent_locationpopup()).toBe(true)

        await addLocationPage.ClickOKOnDeviceLocationPopup();

        //User verifies that the location name is updated in Edit Device popup
        var activeDevicesTable = await customerDetailsPage.getActiveDevicesTable();
        var actualDeviceDetails = await customerDetailsPage.editDevice(activeDevicesTable, "DeviceUsingLocation");
        expect(await customerDetailsPage.getDeviceLocation()).toEqual(locIDfromResp);

        //delete the device
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        postresponse = await ApiHelper.deleteDevice("DICOM", token, deviceId, "DUL2");
        expect(postresponse.status).toBe(200);

        //delete the location
        postresponse = await ApiHelper.deletelocationByID(token, customerId, locIDfromResp);
        expect(postresponse.status).toBe(200);
    })

    //US#353676
    test('L1 User - Verify single location can be used for multiple devices and all devices are listed while deleting location @353676', async function () {

        //user creates a location
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        var universalLocation = "AutoLoc-" + await ApiHelper.createlocname(4)
        var locDesc = "This is the location: " + universalLocation
        var status = "active"
        var Serial = await TestData.generateSerialNumber()
        var postresponse = await ApiHelper.postlocationList(token, customerId, universalLocation, locDesc, status)
        expect(postresponse.status).toBe(200);
        var locIDfromResp = postresponse.data.result.id;

        //user adds multiple devices using above created location
        var response = await ApiHelper.addDevice("DICOM", token, deviceId, "11111", "103.103.103.103", "DeviceUsingLocation", "DUL6", locIDfromResp, "DUL6", "OP: Ophthalmic Photography", 1, "DUL6", Serial, "04057748087141 (CIRRUS 6000)", null);
        expect(response.status).toBe(200);

        var Serial = await TestData.generateSerialNumber()
        var response = await ApiHelper.addDevice("DICOM", token, deviceId, "11111", "103.103.103.103", "DeviceUsingLocation", "DUL7", locIDfromResp, "DUL7", "OP: Ophthalmic Photography", 1, "DUL7", Serial, "04057748087141 (CIRRUS 6000)", null);
        expect(response.status).toBe(200);

        var Serial = await TestData.generateSerialNumber()
        var response = await ApiHelper.addDevice("DICOM", token, deviceId, "11111", "103.103.103.103", "DeviceUsingLocation", "DUL8", locIDfromResp, "DUL8", "OP: Ophthalmic Photography", 1, "DUL8", Serial, "04057748087141 (CIRRUS 6000)", null);
        expect(response.status).toBe(200);

        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(searchCriteria);
        await customerListPage.selectCustomer(customer);

        await customerDetailsPage.selectCMInstance(deviceId);
        await homePage.clickUserButton();
        await homePage.clickDeviceLocations();

        //User tries to delete the location
        await addLocationPage.deleteDeviceLocationButton(universalLocation);
        await addLocationPage.confirmDeleteLocation();
        expect(await addLocationPage.getDeleteWarningHeaderMsg()).toEqual(true);
        expect(await addLocationPage.getDeleteWarningSubHeaderMsg(universalLocation)).toEqual(true);
        await addLocationPage.clickCloseOnDeleteWarningMessagePopup();
        var isPresent = await addLocationPage.isLocationPresentinDeviceLocationTable(universalLocation);
        expect(isPresent).toEqual(true);

        //delete the device
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        postresponse = await ApiHelper.deleteDevice("DICOM", token, deviceId, "DUL6");
        expect(postresponse.status).toBe(200);
        postresponse = await ApiHelper.deleteDevice("DICOM", token, deviceId, "DUL7");
        expect(postresponse.status).toBe(200);
        postresponse = await ApiHelper.deleteDevice("DICOM", token, deviceId, "DUL8");
        expect(postresponse.status).toBe(200);

        //delete location
        postresponse = await ApiHelper.deletelocationByID(token, customerId, locIDfromResp)
        expect(postresponse.status).toBe(200);
    })

    //US#353676
    test('L1 User - Verify1 L1 User is not able to delete the location that is associated with a device and can be deleted after dis associating it @353676', async function () {

        //user creates a location
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        var universalLocation = "AutoLoc-" + await ApiHelper.createlocname(4)
        var locDesc = "This is the location: " + universalLocation
        var status = "active"
        var Serial = await TestData.generateSerialNumber()
        var postresponse = await ApiHelper.postlocationList(token, customerId, universalLocation, locDesc, status)
        expect(postresponse.status).toBe(200);
        var locIDfromResp = postresponse.data.result.id;

        //user adds a device using above created location
        var response = await ApiHelper.addDevice("DICOM", token, deviceId, "11111", "103.103.103.103", "DeviceUsingLocation", "DUL1", locIDfromResp, "DUL1", "OP: Ophthalmic Photography", 1, "DUL1", Serial, "04049471092080 (IOLMaster 700)", null);
        expect(response.status).toBe(200);

        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(searchCriteria);
        await customerListPage.selectCustomer(customer);

        await customerDetailsPage.selectCMInstance(deviceId);

        await customerDetailsPage.selectCMInstanceDevices(deviceId);
        expect(await customerDetailsPage.getDeviceId()).toEqual(deviceId);
        await homePage.clickUserButton();
        await homePage.clickDeviceLocations();

        //user tries to delete the location that is used by a device and validates the error message
        await addLocationPage.deleteDeviceLocationButton(universalLocation);
        await addLocationPage.confirmDeleteLocation();
        expect(await addLocationPage.getDeleteWarningHeaderMsg()).toEqual(true);
        expect(await addLocationPage.getDeleteWarningSubHeaderMsg(universalLocation)).toEqual(true);
        await addLocationPage.clickCloseOnDeleteWarningMessagePopup();
        var isPresent = await addLocationPage.isLocationPresentinDeviceLocationTable(universalLocation);
        expect(isPresent).toEqual(true);

        //delete the device
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        postresponse = await ApiHelper.deleteDevice("DICOM", token, deviceId, "DUL1");
        expect(postresponse.status).toBe(200);

        //validate that the location can be deleted now
        await addLocationPage.deleteDeviceLocationButton(universalLocation);
        await addLocationPage.confirmDeleteLocation();
        var isPresent = await addLocationPage.isLocationPresentinDeviceLocationTable(universalLocation);
        expect(isPresent).toEqual(false);
    })

    //US#360590,366326
    test('L1 User - Verify Connected devices are been in Shown in location connected device popup @360590 @366326', async function () {

        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        //user creates a location
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        let universalLocation = "AutoLoc-" + await ApiHelper.createlocname(4)
        let locDesc = "This is the location: " + universalLocation
        let status = "active"
        var Serial = await TestData.generateSerialNumber()
        let postresponse = await ApiHelper.postlocationList(token, customerId, universalLocation, locDesc, status)
        expect(postresponse.status).toBe(200);
        let locIDfromResp = postresponse.data.result.id;

        //user adds a device using above created location
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, "11111", "103.103.103.103", localUid, localUid, locIDfromResp, 10171, "OP: Ophthalmic Photography", 1, localAet, Serial, "04049471092080 (IOLMaster 700)", null);
        expect(response.status).toBe(200);

        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(searchCriteria);
        await customerListPage.selectCustomer(customer);

        await customerDetailsPage.selectCMInstance(deviceId);

        await customerDetailsPage.selectCMInstanceDevices(deviceId);
        expect(await customerDetailsPage.getDeviceId()).toEqual(deviceId);
        await homePage.clickUserButton();
        await homePage.clickDeviceLocations();

        //Connect the Device Location Button
        await addLocationPage.connectDeviceLocationButton(universalLocation);

        //only ok button should be exist @366326
        expect(await addLocationPage.isPresent_CloseButtonConnectDeviceLocationPopup()).toBe(false);
        expect(await addLocationPage.isPresent_OkButtonConnectDeviceLocationPopup()).toBe(true);

        //check the device details from location 
        var devicelocationResp = await ApiHelper.getDeviceLocationByID(token, locIDfromResp, customerId)
        expect(devicelocationResp.status).toBe(200);

        let devicelocationRespdata = await addLocationPage.getLocationDevicesText();
        expect(devicelocationRespdata.includes(localAet)).toBe(true);
        expect(devicelocationRespdata.includes("IOLMaster 700")).toBe(true);



        //delete the device
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        postresponse = await ApiHelper.deleteDevice("DICOM", token, deviceId, localUid);
        expect(postresponse.status).toBe(200);

        //delete the location
        postresponse = await ApiHelper.deletelocationByID(token, customerId, locIDfromResp);
        expect(postresponse.status).toBe(200);
    })

    //US#360590
    test('L1 User - Verify banner with proper text is visible for not activated device @326390', async function () {
        token = await TokenGenerators.generateAuthToken("l1serviceuser");

        let getDevicesresponse = await ApiHelper.getDevices(token, searchCriteria)
        expect(getDevicesresponse.status).toBe(200);
        var nonActivatedDevice;
        let data = getDevicesresponse.data;
        for (var k = 0; k < (data.length); k++) {
            if (data[k].activationStatus == false) {
                nonActivatedDevice = data[k].iotDeviceId;
                break;
            }
        }
        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(searchCriteria);
        await customerListPage.selectCustomer(customer);

        await customerDetailsPage.selectCMInstance(nonActivatedDevice);

        await customerDetailsPage.selectCMInstanceStatus(nonActivatedDevice);
        expect(await customerDetailsPage.isBannerPresent()).toEqual(true);
        expect(await customerDetailsPage.getBannerHeader()).toEqual(LAN.connectivityModuleNotInstalledBannerTitle);

    })

    test.afterAll(async function () {
        //delete the exisiting connected devices
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        await ApiHelper.deleteAll_ActiveDevice(token, deviceId);
        await ApiHelper.deleteAll_AutomationDeviceLocations(token, customerId);
    });

})