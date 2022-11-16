const { BasePage } = require('../../../pages/base_page.js');
const { TokenGenerators } = require('../../../utils/token_generators.js')
const { test, expect } = require('@playwright/test');
const { IotHubMethods } = require('../../../utils/iothub_methods.js');
const { CustomerListPage } = require('../../../pages/customer_list_page.js');
const { CustomerDetailsPage } = require('../../../pages/customer_details_page.js');
const { TestData } = require('../../../utils/test_data.js');
const { ApiHelper } = require('../../../helpers/api-helpers.js')
var OR = require('../../../resources/OR.json');
var LAN;
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
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih"
const iothubResourceUri = iothub + '.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'
var deviceId, customer, response, conn, token, sastoken, customerId, universalLocation, locIDfromResp, universalLocIDfromResp;
const apimAddConnectedDevicesUrl = process.env.apimBaseURL + OR.APIUrls.addConnectedDevicesUrl;
const apimUpdateConnectedDevicesUrl = process.env.apimBaseURL + OR.APIUrls.updateConnectedDevicesUrl;
var testDevice = process.env.serviceUserHypervDeviceId, customerDetailsId, customerDetailsRecordSet;
var basePage, customerListPage, customerDetailsPage
test.describe('Connected Devices Management', function () {
    test.beforeAll(async function () {

        // test data preparation     
        sastoken = await TokenGenerators.generateSasToken(iothubResourceUri, iothubPolicyKey, iothubPolicy, 30)
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        conn = await TestData.sqlDBConnection();
        var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where iotdeviceId = '" + testDevice + "' for json auto")
        var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        deviceId = deviceRecord[0].iotDeviceId;
        customerDetailsId = deviceRecord[0].customerDetailsId;
        conn = await TestData.sqlDBConnection();
        customerDetailsRecordSet = await TestData.executeSqlQuery(conn, "select * from [dbo].[CustomerDetails] where customerdetailsId=" + customerDetailsId + " for json auto")
        var customerDetailsRecord = JSON.parse(customerDetailsRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        customerId = customerDetailsRecord[0].customerId;
        customer = customerDetailsRecord[0].customerName;
        console.log("customerId: " + customerId)
        console.log("deviceId: " + deviceId)

    });

    test.beforeEach(async function ({ page }) {
        basePage = new BasePage(page);
        customerListPage = new CustomerListPage(page);
        customerDetailsPage = new CustomerDetailsPage(page);
        universalLocation = "AutoLoc-" + await ApiHelper.createlocname(4)
        var locDesc = "This is the location: " + universalLocation
        var status = "active"
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        await ApiHelper.deleteAll_ActiveDevice(token, deviceId);
        await ApiHelper.deleteAll_InActiveDevice(token, deviceId);
        await ApiHelper.deleteAll_AutomationDeviceLocations(token, customerId);
        var postresponse = await ApiHelper.postlocationList(token, customerId, universalLocation, locDesc, status)
        expect(postresponse.status).toBe(200);
        universalLocIDfromResp = postresponse.data.result.id;
    })
    //US#74509		US#308070   US#353696 US#385645
    test('User should be able to add a new connected device successfully with all the parameters and verify no banner is displayed @74509 @308070 @353696 @326390 @385645', async function () {

        await basePage.navigateToUrl("l1serviceuser");
        // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
        await customerListPage.searchCustomer(customer);
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

        //user valiadtes that no banner is displayed if device is online and connected
        await expect(await customerDetailsPage.isBannerPresent()).toEqual(false);

        await customerDetailsPage.addDeviceButtonClick();
        await customerDetailsPage.filldeviceName("Test Active Device1");
        await customerDetailsPage.fillAeTitle("TestDAeT!tle1");
        await customerDetailsPage.fillIpAddress("101.101.101.101");
        await customerDetailsPage.fillPort("8080");
        await customerDetailsPage.selectDeviceIdentifier("04049471092080 (IOLMaster 700)");
        await customerDetailsPage.fillDeviceSerial(await TestData.generateSerialNumber());
        await customerDetailsPage.selectModality("OPT: Ophthalmic Tomography");
        await customerDetailsPage.toggleWhitelistDevice("true");
        await customerDetailsPage.selectDeviceLocation(universalLocIDfromResp);
        await customerDetailsPage.applyAllChanges();
        var activeDevicesTable = await customerDetailsPage.getActiveDevicesTable();
        var actualDeviceDetails = await customerDetailsPage.getDeviceFromDevicesTable(activeDevicesTable, "TestDAeT!tle1");
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.name)).toEqual("Test Active Device1")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.aetitle)).toEqual("TestDAeT!tle1")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.ip)).toEqual("101.101.101.101")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.port)).toEqual("8080")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.location)).toEqual(universalLocation)

        var actualDeviceDetails = await customerDetailsPage.editDevice(activeDevicesTable, "TestDAeT!tle1");
        expect(await customerDetailsPage.getdeviceName()).toEqual("Test Active Device1");
        expect(await customerDetailsPage.getAeTitle()).toEqual("TestDAeT!tle1");
        expect(await customerDetailsPage.getIpAddress()).toEqual("101.101.101.101")
        expect(await customerDetailsPage.getPort()).toEqual("8080")
        expect(await customerDetailsPage.getModality()).toEqual("OPT: Ophthalmic Tomography")
        expect(await customerDetailsPage.getDeviceLocation()).toEqual(universalLocIDfromResp);
    });


    //US#353699
    test('User should be able to add a new connected device successfully with diffrent device types @353699', async function () {

        await basePage.navigateToUrl("l1serviceuser");
        // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
        await customerListPage.searchCustomer(customer);
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

        //user valiadtes that no banner is displayed if device is online and connected
        expect(await customerDetailsPage.isBannerPresent()).toEqual(false);

        // let actualData = JSON.parse("[{\"identifier\":\"04049539102423\",\"name\":\"CALLISTO eye 3.2.1 model I\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049539069092\",\"name\":\"CALLISTO eye 3.5.1 model I\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049539103512\",\"name\":\"CALLISTO eye model II\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049539069214\",\"name\":\"CALLISTO eye model III\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049471092080\",\"name\":\"IOLMaster 700\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049471092066\",\"name\":\"IOLMaster 500\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748081118\",\"name\":\"Atlas 9000\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04250668606731\",\"name\":\"VISUSCREEN 100\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04250668606724\",\"name\":\"VISUSCREEN 500\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049471097139\",\"name\":\"Visuref 150\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748087080\",\"name\":\"Cirrus 5000\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748087097\",\"name\":\"Cirrus 500\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748087141\",\"name\":\"Cirrus 6000\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null}]");
        let actualData = JSON.parse("[{\"identifier\":\"04057748081118\",\"name\":\"Atlas 9000\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04250668606731\",\"name\":\"VISUSCREEN 100\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04250668606724\",\"name\":\"VISUSCREEN 500\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049471097139\",\"name\":\"Visuref 150\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748087080\",\"name\":\"Cirrus 5000\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748087097\",\"name\":\"Cirrus 500\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748087141\",\"name\":\"Cirrus 6000\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null}]");

        for (let i = 0; i < actualData.length - 1; i++) {
            let localAet = await TestData.generateUIDforDevice(deviceId, sastoken);
            await TestData.waitFortimeOut(2000);
            await customerDetailsPage.addDeviceButtonClick();
            await TestData.waitFortimeOut(3000);
            await customerDetailsPage.filldeviceName(localAet);
            await customerDetailsPage.fillAeTitle(localAet);
            await customerDetailsPage.fillIpAddress("101.101.101.101");
            await customerDetailsPage.fillPort("8080");
            console.log("device Identifier: " + actualData[i].identifier)
            await customerDetailsPage.selectDeviceIdentifierWithID(actualData[i].identifier);
            await customerDetailsPage.fillDeviceSerial(await TestData.generateSerialNumber());
            await customerDetailsPage.selectModality("OPT: Ophthalmic Tomography");
            await customerDetailsPage.toggleWhitelistDevice("true");
            await customerDetailsPage.selectDeviceLocation(universalLocIDfromResp);
            await TestData.waitFortimeOut(2000);
            await customerDetailsPage.applyAllChanges();
            await TestData.waitFortimeOut(2000);
            var activeDevicesTable = await customerDetailsPage.getActiveDevicesTable();
            var actualDeviceDetails = await customerDetailsPage.getDeviceFromDevicesTable(activeDevicesTable, localAet);
            expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.name)).toEqual(localAet)
            expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.aetitle)).toEqual(localAet)
            expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.ip)).toEqual("101.101.101.101")
            expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.port)).toEqual("8080")
            expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.location)).toEqual(universalLocation)

            var actualDeviceDetails = await customerDetailsPage.editDevice(activeDevicesTable, localAet);
            await TestData.waitFortimeOut(2000);
            expect(await customerDetailsPage.getdeviceName()).toEqual(localAet);
            expect(await customerDetailsPage.getAeTitle()).toEqual(localAet);
            expect(await customerDetailsPage.getIpAddress()).toEqual("101.101.101.101")
            expect(await customerDetailsPage.getPort()).toEqual("8080")
            expect(await customerDetailsPage.getModality()).toEqual("OPT: Ophthalmic Tomography")
            expect(await customerDetailsPage.getDeviceLocation()).toEqual(universalLocIDfromResp);
            await customerDetailsPage.applyAllChanges();
            await TestData.waitFortimeOut(3000);
        }
    });

    test('User should be able to add a new connected device successfully with all special chars in AEID and UID @74509', async function () {
        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(customer);
        await customerListPage.selectCustomer(customer);

        await customerDetailsPage.selectCMInstance(deviceId);
        await customerDetailsPage.selectCMInstanceDevices(deviceId);
        expect(await customerDetailsPage.getDeviceId()).toEqual(deviceId);

        await customerDetailsPage.addDeviceButtonClick();
        await customerDetailsPage.filldeviceName("Test Active Device 0!");
        await customerDetailsPage.fillAeTitle("Test!@%^&*()");
        await customerDetailsPage.fillIpAddress("101.101.101.101");
        await customerDetailsPage.fillPort("7070");
        await customerDetailsPage.selectDeviceIdentifier("04049471092080 (IOLMaster 700)");
        await customerDetailsPage.fillDeviceSerial(await TestData.generateSerialNumber());
        await customerDetailsPage.selectModality("OPT: Ophthalmic Tomography");
        await customerDetailsPage.selectDeviceLocation(universalLocIDfromResp);
        await customerDetailsPage.toggleWhitelistDevice("true");
        await customerDetailsPage.applyAllChanges();
        var activeDevicesTable = await customerDetailsPage.getActiveDevicesTable();
        var actualDeviceDetails = await customerDetailsPage.getDeviceFromDevicesTable(activeDevicesTable, "Test!@%^&*()");
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.name)).toEqual("Test Active Device 0!")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.aetitle)).toEqual("Test!@%^&*()")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.ip)).toEqual("101.101.101.101")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.port)).toEqual("7070")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.location)).toEqual(universalLocation)

    });


    //US#402531
    test("L1 user - location name should be updated in Devices table grid when it got updated  @402531", async function () {


        var locName = "AutoLoc-RPost-Loc" + await ApiHelper.createlocname(4)
        var locDesc = "This is the location: " + locName
        var status = "active"

        // create location 
        var postresponse = await ApiHelper.postlocationList(token, customerId, locName, locDesc, status)
        expect(postresponse.status).toBe(200);
        var locIDfromResp = postresponse.data.result.id;

        //search the location 
        response = await ApiHelper.getlocationList(token, customerId)
        expect(response.status).toBe(200);

        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(customer);
        await customerListPage.selectCustomer(customer);

        await customerDetailsPage.selectCMInstance(deviceId);
        await customerDetailsPage.selectCMInstanceDevices(deviceId);
        expect(await customerDetailsPage.getDeviceId()).toEqual(deviceId);

        await customerDetailsPage.addDeviceButtonClick();
        await customerDetailsPage.filldeviceName("Test Active Device 0!");
        await customerDetailsPage.fillAeTitle("Test!@%^&*()");
        await customerDetailsPage.fillIpAddress("101.101.101.101");
        await customerDetailsPage.fillPort("7070");
        await customerDetailsPage.selectDeviceIdentifier("04049471092080 (IOLMaster 700)");
        await customerDetailsPage.fillDeviceSerial(await TestData.generateSerialNumber());
        await customerDetailsPage.selectModality("OPT: Ophthalmic Tomography");
        await customerDetailsPage.selectDeviceLocation(locIDfromResp);
        await customerDetailsPage.toggleWhitelistDevice("true");
        await customerDetailsPage.applyAllChanges();


        //Update location name description
        updatedName = "Update-" + await ApiHelper.createlocname(5)
        updatedDesc = "Updated location is: " + updatedName
        updateresponse = await ApiHelper.updatelocationbyID(token, customerId, locIDfromResp, updatedName, updatedDesc, status)
        expect(updateresponse.status).toBe(200);
        expect(updateresponse.data.statusCode).toBe(200);


        await customerDetailsPage.refreshDeviceButtonClick();


        var activeDevicesTable = await customerDetailsPage.getActiveDevicesTable();
        var actualDeviceDetails = await customerDetailsPage.getDeviceFromDevicesTable(activeDevicesTable, "Test!@%^&*()");
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.name)).toEqual("Test Active Device 0!")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.aetitle)).toEqual("Test!@%^&*()")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.ip)).toEqual("101.101.101.101")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.port)).toEqual("7070")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.location)).toEqual(updatedName)

    });


    //US#74509
    test('Verify default value for modality is not set @74509', async function () {
        await basePage.navigateToUrl("l1serviceuser");
        // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
        await customerListPage.searchCustomer(customer);
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
        await TestData.waitFortimeOut(2000);
        await customerDetailsPage.addDeviceButtonClick();
        await TestData.waitFortimeOut(3000);
        await customerDetailsPage.filldeviceName("Test Active Device2");
        await customerDetailsPage.fillAeTitle("TestDAeTitle2");
        await customerDetailsPage.fillIpAddress("102.102.102.102");
        await customerDetailsPage.fillPort("9090");
        await customerDetailsPage.selectDeviceIdentifier("(Others)");
        await customerDetailsPage.fillDeviceSerial(await TestData.generateSerialNumber());
        await customerDetailsPage.selectDeviceLocation(universalLocIDfromResp);
        await customerDetailsPage.fillManuallyEnteredDI("1001");
        await customerDetailsPage.applyAllChanges();
        expect(await customerDetailsPage.selectModalityHint()).toBeVisible();
        await TestData.waitFortimeOut(1000);
        await customerDetailsPage.selectModality("AR: Autorefraction");
        await TestData.waitFortimeOut(3000);
        await customerDetailsPage.applyAllChanges();
        await TestData.waitFortimeOut(2000);
        var activeDevicesTable = await customerDetailsPage.getActiveDevicesTable();
        var actualDeviceDetails = await customerDetailsPage.getDeviceFromDevicesTable(activeDevicesTable, "TestDAeTitle2");
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.name)).toEqual("Test Active Device2")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.aetitle)).toEqual("TestDAeTitle2")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.ip)).toEqual("102.102.102.102")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.port)).toEqual("9090")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.location)).toEqual(universalLocation)

        var actualDeviceDetails = await customerDetailsPage.editDevice(activeDevicesTable, "TestDAeTitle2");
        await TestData.waitFortimeOut(2000);
        expect(await customerDetailsPage.getdeviceName()).toEqual("Test Active Device2");
        expect(await customerDetailsPage.getAeTitle()).toEqual("TestDAeTitle2");
        expect(await customerDetailsPage.getIpAddress()).toEqual("102.102.102.102");
        expect(await customerDetailsPage.getPort()).toEqual("9090");
        expect(await customerDetailsPage.getModality()).toEqual("AR: Autorefraction");
    })

    //US#74509 US#308070 US#353696 US#385645
    test('User should be able to update exisiting connected device successfully @74509 @308070 @353696 @385645', async function () {
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        var locName = "AutoLoc-" + await ApiHelper.createlocname(4)
        var locDesc = "This is the location: " + locName
        var status = "active"
        var postresponse = await ApiHelper.postlocationList(token, customerId, locName, locDesc, status)
        expect(postresponse.status).toBe(200);

        var response = await ApiHelper.addDevice("DICOM", token, deviceId, "11111", "103.103.103.103", "Test Active Device3", "TAD3", universalLocIDfromResp, "TAD3", "OPT: Ophthalmic Tomography", 1, "TAD3", await TestData.generateSerialNumber(), "04049471092080 (IOLMaster 700)", null);
        expect(response.status).toBe(200);

        await basePage.navigateToUrl("l1serviceuser");
        // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
        await customerListPage.searchCustomer(customer);
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

        var activeDevicesTable = await customerDetailsPage.getActiveDevicesTable();

        locIDfromResp = postresponse.data.result.id;
        var actualDeviceDetails = await customerDetailsPage.editDevice(activeDevicesTable, "TAD3");

        await customerDetailsPage.filldeviceName("Test Act Device3Upd");
        await customerDetailsPage.fillAeTitle("TAD*Updt");
        await customerDetailsPage.fillIpAddress("103.103.103.104");
        await customerDetailsPage.fillPort("65533");
        await customerDetailsPage.selectDeviceLocation(locIDfromResp);
        await customerDetailsPage.selectDeviceIdentifier("04049471092080 (IOLMaster 700)");
        await customerDetailsPage.fillDeviceSerial(await TestData.generateSerialNumber());
        await customerDetailsPage.selectModality("LEN: Lensometry");
        await customerDetailsPage.applyAllChanges();
        var actualDeviceDetails = await customerDetailsPage.getDeviceFromDevicesTable(activeDevicesTable, "TAD*Updt");
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.name)).toEqual("Test Act Device3Upd")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.aetitle)).toEqual("TAD*Updt")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.ip)).toEqual("103.103.103.104")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.port)).toEqual("65533")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.location)).toEqual(locName)

        var actualDeviceDetails = await customerDetailsPage.editDevice(activeDevicesTable, "TAD*Updt");
        expect(await customerDetailsPage.getdeviceName()).toEqual("Test Act Device3Upd");
        expect(await customerDetailsPage.getAeTitle()).toEqual("TAD*Updt");
        expect(await customerDetailsPage.getIpAddress()).toEqual("103.103.103.104");
        expect(await customerDetailsPage.getPort()).toEqual("65533");
        expect(await customerDetailsPage.getModality()).toEqual("LEN: Lensometry");
        expect(await customerDetailsPage.getDeviceLocation()).toEqual(locIDfromResp);
    })

    //US#74509
    test('User should be able to update exisiting active connected device to be inactive device @74509', async function () {
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        var response = await ApiHelper.addDevice("DICOM", token, deviceId, "11111", "104.104.104.104", "ActToInact", "TAD@4", universalLocIDfromResp, "TAD@4", "OPT: Ophthalmic Tomography", 1, "TAD4", await TestData.generateSerialNumber(), "04049471092080 (IOLMaster 700)", null);
        expect(response.status).toBe(200);

        var locName = "AutoLoc-" + await ApiHelper.createlocname(4)
        var locDesc = "This is the location: " + locName
        var status = "active"
        var postresponse = await ApiHelper.postlocationList(token, customerId, locName, locDesc, status)
        expect(postresponse.status).toBe(200);
        var locIDfromRespNew = postresponse.data.result.id;

        await basePage.navigateToUrl("l1serviceuser");
        // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
        await customerListPage.searchCustomer(customer);
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

        var activeDevicesTable = await customerDetailsPage.getActiveDevicesTable();
        await TestData.waitFortimeOut(2000);
        var actualDeviceDetails = await customerDetailsPage.editDevice(activeDevicesTable, "TAD4");
        await TestData.waitFortimeOut(2000);
        await customerDetailsPage.filldeviceName("ActToInactiveUpd");
        await customerDetailsPage.fillAeTitle("TAD!4Updt");
        await customerDetailsPage.fillIpAddress("104.104.104.100");
        await customerDetailsPage.fillPort("11114");
        await customerDetailsPage.selectDeviceIdentifier("04049471092080 (IOLMaster 700)");
        await customerDetailsPage.fillDeviceSerial(await TestData.generateSerialNumber());
        await customerDetailsPage.selectDeviceLocation(universalLocIDfromResp);
        await customerDetailsPage.selectModality("LEN: Lensometry");
        await customerDetailsPage.toggleWhitelistDevice("false");
        await customerDetailsPage.applyAllChanges();
        var inactiveDevicesTable = await customerDetailsPage.getInactiveDevicesTable();
        var actualDeviceDetails = await customerDetailsPage.getDeviceFromDevicesTable(inactiveDevicesTable, "TAD!4Updt");
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.name)).toEqual("ActToInactiveUpd")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.aetitle)).toEqual("TAD!4Updt")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.ip)).toEqual("104.104.104.100")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.port)).toEqual("11114")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.location)).toEqual(universalLocation)
        await TestData.waitFortimeOut(2000);
        await customerDetailsPage.editDevice(inactiveDevicesTable, "TAD!4Updt");
        await TestData.waitFortimeOut(2000);
        await customerDetailsPage.filldeviceName("ActToInactiveUpd1");
        await customerDetailsPage.fillAeTitle("TAD!4Updt1");
        await customerDetailsPage.fillIpAddress("104.104.104.111");
        await customerDetailsPage.fillPort("111");
        await customerDetailsPage.selectDeviceIdentifier("04049471092080 (IOLMaster 700)");
        await customerDetailsPage.fillDeviceSerial(await TestData.generateSerialNumber());
        await customerDetailsPage.selectModality("OPT: Ophthalmic Tomography");
        await customerDetailsPage.selectDeviceLocation(locIDfromRespNew);
        await customerDetailsPage.toggleWhitelistDevice("false");
        await customerDetailsPage.applyAllChanges();

        var actualDeviceDetails = await customerDetailsPage.getDeviceFromDevicesTable(inactiveDevicesTable, "TAD!4Updt1");
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.name)).toEqual("ActToInactiveUpd1")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.aetitle)).toEqual("TAD!4Updt1")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.ip)).toEqual("104.104.104.111")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.port)).toEqual("111")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.location)).toEqual(locName)

        var actualDeviceDetails = await customerDetailsPage.editDevice(inactiveDevicesTable, "TAD!4Updt1");
        expect(await customerDetailsPage.getdeviceName()).toEqual("ActToInactiveUpd1")
        expect(await customerDetailsPage.getAeTitle()).toEqual("TAD!4Updt1")
        expect(await customerDetailsPage.getIpAddress()).toEqual("104.104.104.111")
        expect(await customerDetailsPage.getPort()).toEqual("111")
        expect(await customerDetailsPage.getModality()).toEqual("OPT: Ophthalmic Tomography")
        expect(await customerDetailsPage.getDeviceLocation()).toEqual(locIDfromRespNew);

    })

    //US#74509 US#308070 US#353696
    test('User should be able to see validation errors for mandatory fields when adding a new device @74509 @308070 @353696', async function () {
        await basePage.navigateToUrl("l1serviceuser");
        // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
        await customerListPage.searchCustomer(customer);
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

        await customerDetailsPage.addDeviceButtonClick();
        await TestData.waitFortimeOut(2000);
        await customerDetailsPage.cleardeviceName();
        await customerDetailsPage.clearAeTitle();
        await customerDetailsPage.clearIpAddress();
        await customerDetailsPage.clearPort();
        await customerDetailsPage.clearDeviceSerial();
        await customerDetailsPage.applyAllChanges();

        expect(await customerDetailsPage.deviceNameHint()).toBeVisible()
        expect(await customerDetailsPage.deviceSerialHint()).toBeVisible()
        expect(await customerDetailsPage.aeTitleHint()).toBeVisible()
        expect(await customerDetailsPage.ipAddressHint()).toBeVisible()
        expect(await customerDetailsPage.portHint()).toBeVisible()
        expect(await customerDetailsPage.deviceLocationValidationMessage()).toBeVisible()

        await customerDetailsPage.fillAeTitle("test\\.#$5");
        await customerDetailsPage.applyAllChanges();
        expect(await customerDetailsPage.aeTitleValidationMessage()).toBeVisible()

        await customerDetailsPage.clearAeTitle();
        await customerDetailsPage.fillAeTitle("https://data");
        await customerDetailsPage.applyAllChanges();
        expect(await customerDetailsPage.aeTitleValidationMessage()).toBeVisible()
        await customerDetailsPage.clearAeTitle();

        await customerDetailsPage.fillAeTitle("https://");
        await customerDetailsPage.applyAllChanges();
        expect(await customerDetailsPage.aeTitleValidationMessage()).toBeVisible()

        await customerDetailsPage.selectDeviceIdentifier("(Others)");
        await customerDetailsPage.fillDeviceSerial("aaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        await customerDetailsPage.applyAllChanges();
        expect(await customerDetailsPage.aeTitleValidationMessage()).toBeVisible()
        await customerDetailsPage.cancelDeviceForm();

    })
    //US#74509
    test('User should be able to see validation errors for aet fields - length and special characters in name when adding a new device @74509', async function () {
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        var response = await ApiHelper.addDevice("DICOM", token, deviceId, "11111", "105.105.105.105", "TestDevice5", "TAD5", universalLocIDfromResp, "TAD5", "OPT: Ophthalmic Tomography", 1, "TAD5", await TestData.generateSerialNumber(), "04049471092080 (IOLMaster 700)", null);
        expect(response.status).toBe(200);

        await basePage.navigateToUrl("l1serviceuser");
        // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
        await customerListPage.searchCustomer(customer);
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

        var activeDevicesTable = await customerDetailsPage.getActiveDevicesTable();
        var actualDeviceDetails = await customerDetailsPage.editDevice(activeDevicesTable, "TAD5");
        await TestData.waitFortimeOut(2000);
        await customerDetailsPage.cleardeviceName();
        await customerDetailsPage.clearAeTitle();
        await customerDetailsPage.clearIpAddress();
        await customerDetailsPage.clearPort();
        await customerDetailsPage.applyAllChanges();

        expect(await customerDetailsPage.deviceNameHint()).toBeVisible()
        expect(await customerDetailsPage.aeTitleHint()).toBeVisible()
        expect(await customerDetailsPage.ipAddressHint()).toBeVisible()
        expect(await customerDetailsPage.portHint()).toBeVisible()

        await customerDetailsPage.fillAeTitle("test\\.#$5");
        await customerDetailsPage.applyAllChanges();
        expect(await customerDetailsPage.aeTitleValidationMessage()).toBeVisible()
        await customerDetailsPage.clearAeTitle();

        await customerDetailsPage.fillAeTitle("https://data");
        await customerDetailsPage.applyAllChanges();
        expect(await customerDetailsPage.aeTitleValidationMessage()).toBeVisible()
        await customerDetailsPage.clearAeTitle();

        await customerDetailsPage.fillAeTitle("https://");
        await customerDetailsPage.applyAllChanges();
        expect(await customerDetailsPage.aeTitleValidationMessage()).toBeVisible()
        await customerDetailsPage.cancelDeviceForm();

        var actualDeviceDetails = await customerDetailsPage.getDeviceFromDevicesTable(activeDevicesTable, "TAD5");
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.name)).toEqual("TestDevice5")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.aetitle)).toEqual("TAD5")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.ip)).toEqual("105.105.105.105")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.port)).toEqual("11111")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.location)).toEqual(universalLocation)
        var actualDeviceDetails = await customerDetailsPage.editDevice(activeDevicesTable, "TAD5");
        await TestData.waitFortimeOut(2000);
        expect(await customerDetailsPage.getdeviceName()).toEqual("TestDevice5")
        expect(await customerDetailsPage.getAeTitle()).toEqual("TAD5")
        expect(await customerDetailsPage.getIpAddress()).toEqual("105.105.105.105")
        expect(await customerDetailsPage.getPort()).toEqual("11111")
        expect(await customerDetailsPage.getModality()).toEqual("OPT: Ophthalmic Tomography")
    })

    //US#74509
    test('Verify user sees validation message while adding a device with an existing device aet value @74509', async function () {
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        var response = await ApiHelper.addDevice("DICOM", token, deviceId, "11116", "106.106.106.106", "Test Active Device6", "TAD6", universalLocIDfromResp, "TAD6", "OPT: Ophthalmic Tomography", 1, "TAD6", await TestData.generateSerialNumber(), "04049471092080 (IOLMaster 700)", null);
        expect(response.status).toBe(200);

        await basePage.navigateToUrl("l1serviceuser");
        // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
        await customerListPage.searchCustomer(customer);
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

        await customerDetailsPage.addDeviceButtonClick();

        await customerDetailsPage.filldeviceName("NewTest1");
        await customerDetailsPage.fillAeTitle("TAD6");
        await customerDetailsPage.fillIpAddress("9.9.9.9");
        await customerDetailsPage.fillPort("99");
        await customerDetailsPage.selectDeviceIdentifier("04049471092080 (IOLMaster 700)");
        await customerDetailsPage.fillDeviceSerial(await TestData.generateSerialNumber());
        await customerDetailsPage.selectModality("LEN: Lensometry");
        await customerDetailsPage.selectDeviceLocation(universalLocIDfromResp);
        await customerDetailsPage.toggleWhitelistDevice("true");
        await customerDetailsPage.applyAllChanges();

        var message = await (await customerDetailsPage.getUIValidationMessage()).trim();
        expect(message).toEqual("Internal identifier or AE Title already taken");
        await customerDetailsPage.closeUniqueUidAetValidationDialog();
        var activeDevicesTable = await customerDetailsPage.getActiveDevicesTable();
        var actualDeviceDetails = await customerDetailsPage.getDeviceFromDevicesTable(activeDevicesTable, "NewTest1");
        expect(actualDeviceDetails.size).toEqual(0);
    })

    //US#74509
    test("Verify L1 service user sees validation message while updating a device with an existing device aet value @74509", async function () {
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        var response = await ApiHelper.addDevice("DICOM", token, deviceId, "11119", "109.109.109.109", "Test Active Device9", "TAD9", universalLocIDfromResp, "TAD9", "OPT: Ophthalmic Tomography", 1, "TAD9", await TestData.generateSerialNumber(), "04049471092080 (IOLMaster 700)", null);
        expect(response.status).toBe(200);

        var response = await ApiHelper.addDevice("DICOM", token, deviceId, "11119", "110.110.110.110", "Test Active Device10", "TAD10", universalLocIDfromResp, "TAD10", "OPT: Ophthalmic Tomography", 1, "TAD10", await TestData.generateSerialNumber(), "04049471092080 (IOLMaster 700)", null);
        expect(response.status).toBe(200);

        await basePage.navigateToUrl("l1serviceuser");
        // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
        await customerListPage.searchCustomer(customer);
        await customerListPage.selectCustomer(customer);
        var expectedCustomerName;
        if (customer.length <= 30) {
            expectedCustomerName = customer;
        } else {
            expectedCustomerName = customer.substring(0, 17) + "...";
        }
        expect(await customerDetailsPage.getCustomerButtonText()).toEqual(expectedCustomerName);
        await customerDetailsPage.selectCMInstance(deviceId);

        await customerDetailsPage.selectCMInstanceDevices(deviceId);
        expect(await customerDetailsPage.getDeviceId()).toEqual(deviceId);
        var activeDevicesTable = await customerDetailsPage.getActiveDevicesTable();
        var actualDeviceDetails = await customerDetailsPage.editDevice(activeDevicesTable, "TAD9");

        await customerDetailsPage.filldeviceName("NewTest1");
        await customerDetailsPage.fillAeTitle("TAD10");
        await customerDetailsPage.fillIpAddress("9.9.9.9");
        await customerDetailsPage.fillPort("99");
        await customerDetailsPage.selectDeviceIdentifier("04049471092080 (IOLMaster 700)");
        await customerDetailsPage.fillDeviceSerial(await TestData.generateSerialNumber());
        await customerDetailsPage.selectModality("LEN: Lensometry");
        await customerDetailsPage.selectDeviceLocation(universalLocIDfromResp);
        await customerDetailsPage.toggleWhitelistDevice("true");
        await customerDetailsPage.applyAllChanges();

        var message = await (await customerDetailsPage.getUIValidationMessage()).trim();
        expect(message).toEqual("Internal identifier or AE Title already taken");
        await customerDetailsPage.closeUniqueUidAetValidationDialog();
        var activeDevicesTable = await customerDetailsPage.getActiveDevicesTable();
        var actualDeviceDetails = await customerDetailsPage.getDeviceFromDevicesTable(activeDevicesTable, "NewTest1");
        expect(actualDeviceDetails.size).toEqual(0);
    });

    //US#339940
    test('In Web UI L1user -few special chars in AEID will be replaced by hyphen in UID @74509 @339940', async function () {
        var nameAEtitle = ["spc $ .com", "Spcl # $ .@", "test.spc !$@", "test.spc %$*", "te#st[^spc!$@",]
        await basePage.navigateToUrl("l1serviceuser");
        // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
        await customerListPage.searchCustomer(customer);
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
        for (var k = 0; k < nameAEtitle.length; k++) {
            await customerDetailsPage.addDeviceButtonClick();
            var deviceName = "TestDevice spclchar" + k
            await customerDetailsPage.filldeviceName(deviceName);
            await customerDetailsPage.fillAeTitle(nameAEtitle[k]);
            await customerDetailsPage.fillIpAddress("10.101.10.101");
            await customerDetailsPage.fillPort("65535");
            await customerDetailsPage.selectDeviceIdentifier("04049471092080 (IOLMaster 700)");
            await customerDetailsPage.fillDeviceSerial(await TestData.generateSerialNumber());
            await customerDetailsPage.selectModality("OPT: Ophthalmic Tomography");
            await customerDetailsPage.selectDeviceLocation(universalLocIDfromResp);
            await customerDetailsPage.toggleWhitelistDevice("true");
            await customerDetailsPage.applyAllChanges();
            var activeDevicesTable = await customerDetailsPage.getActiveDevicesTable();
            var actualDeviceDetails = await customerDetailsPage.getDeviceFromDevicesTable(activeDevicesTable, nameAEtitle[k]);
            expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.name)).toEqual(deviceName)
            expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.aetitle)).toEqual(nameAEtitle[k])
            await customerDetailsPage.editDevice(activeDevicesTable, nameAEtitle[k]);
            expect(await customerDetailsPage.getdeviceName()).toEqual(deviceName)
            expect(await customerDetailsPage.getAeTitle()).toEqual(nameAEtitle[k])
            var internalIdentifier = nameAEtitle[k].replace(/[#$.]/gi, '-').replace(/\s+/g, '-');
            expect(await customerDetailsPage.getInternamIdentifier()).toEqual(internalIdentifier);
            await customerDetailsPage.cancelDeviceForm();
        }

    });

    // US#233023
    test('L1 user should successfully delete the existing device @233023', async function () {
        await basePage.navigateToUrl("l1serviceuser");
        // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
        await customerListPage.searchCustomer(customer);
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
        let localUID = await TestData.generateUIDforDevice(deviceId, sastoken);
        await customerDetailsPage.addDeviceButtonClick();
        await customerDetailsPage.filldeviceName("Test Active Device1");
        await customerDetailsPage.fillAeTitle(localUID);
        await customerDetailsPage.fillIpAddress("101.101.101.101");
        await customerDetailsPage.fillPort("63331");
        await customerDetailsPage.selectDeviceIdentifier("04049471092080 (IOLMaster 700)");
        await customerDetailsPage.fillDeviceSerial(await TestData.generateSerialNumber());
        await customerDetailsPage.selectModality("OPT: Ophthalmic Tomography");
        await customerDetailsPage.selectDeviceLocation(universalLocIDfromResp);
        await customerDetailsPage.toggleWhitelistDevice("true");
        await customerDetailsPage.applyAllChanges();
        var activeDevicesTable = await customerDetailsPage.getActiveDevicesTable();

        await customerDetailsPage.deleteDeviceButton(activeDevicesTable, localUID);
        await customerDetailsPage.confirmDeleteDevice();

        activeDevicesTable = await customerDetailsPage.getActiveDevicesTable();
        var actualDeviceDetails = await customerDetailsPage.getDeviceFromDevicesTable(activeDevicesTable, localUID);

        expect(await actualDeviceDetails.size).toEqual(0);


    });
    test('L1 user should cancel deletion for the existing device @233023', async function () {
        await basePage.navigateToUrl("l1serviceuser");
        // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
        await customerListPage.searchCustomer(customer);
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
        let localUID = await TestData.generateUIDforDevice(deviceId, sastoken);
        await customerDetailsPage.addDeviceButtonClick();
        await customerDetailsPage.filldeviceName("Test Active Device1");
        await customerDetailsPage.fillAeTitle(localUID);
        await customerDetailsPage.fillIpAddress("101.101.101.101");
        await customerDetailsPage.fillPort("8080");
        await customerDetailsPage.selectDeviceIdentifier("04049471092080 (IOLMaster 700)");
        await customerDetailsPage.fillDeviceSerial(await TestData.generateSerialNumber());
        await customerDetailsPage.selectModality("OPT: Ophthalmic Tomography");
        await customerDetailsPage.selectDeviceLocation(universalLocIDfromResp);
        await customerDetailsPage.toggleWhitelistDevice("true");
        await customerDetailsPage.applyAllChanges();

        var activeDevicesTable = await customerDetailsPage.getActiveDevicesTable();
        await customerDetailsPage.deleteDeviceButton(activeDevicesTable, localUID);
        await customerDetailsPage.KeepDevice();
        activeDevicesTable = await customerDetailsPage.getActiveDevicesTable();
        var actualDeviceDetails = await customerDetailsPage.getDeviceFromDevicesTable(activeDevicesTable, localUID);
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.name)).toEqual("Test Active Device1")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.aetitle)).toEqual(localUID)
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.ip)).toEqual("101.101.101.101")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.port)).toEqual("8080")
        expect(actualDeviceDetails.get(OR.locators.customerDetailsPage.deviceHeaders.location)).toEqual(universalLocation)
    });
    //US#392137, US#363848
    test("Verify L1 user should sees validation message while adding a device with an existing device  unqiue combination of DI and SNo value @363848 @392137", async function () {

        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        let localUid = await TestData.generateUIDforDevice();
        let localAet = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        var response = await ApiHelper.addDevice("DICOM", token, deviceId, "11119", "109.109.109.109", "Test Active Device9", localAet, universalLocIDfromResp, localUid, "OPT: Ophthalmic Tomography", 1, localUid, localSerialNumber, "04049471092080 (IOLMaster 700)", null);
        expect(response.status).toBe(200);

        await basePage.navigateToUrl("l1serviceuser");
        // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
        await customerListPage.searchCustomer(customer);
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
        await customerDetailsPage.addDeviceButtonClick();


        await customerDetailsPage.filldeviceName("Test Active Device9");
        await customerDetailsPage.fillAeTitle("TAD10");
        await customerDetailsPage.fillIpAddress("109.109.109.109");
        await customerDetailsPage.fillPort("11119");
        await customerDetailsPage.selectDeviceIdentifier("04049471092080 (IOLMaster 700)");
        await customerDetailsPage.fillDeviceSerial(localSerialNumber);
        await customerDetailsPage.selectModality("OPT: Ophthalmic Tomography");
        await customerDetailsPage.selectDeviceLocation(universalLocIDfromResp);
        await customerDetailsPage.toggleWhitelistDevice("true");
        await customerDetailsPage.applyAllChanges();

        var message = await (await customerDetailsPage.getUIValidationMessage()).trim();
        expect(message).toEqual(LAN.diandSerialErrorMessage);
        await customerDetailsPage.closeUniqueUidAetValidationDialog();
        var activeDevicesTable = await customerDetailsPage.getActiveDevicesTable();
        var actualDeviceDetails = await customerDetailsPage.getDeviceFromDevicesTable(activeDevicesTable, "TAD10");
        expect(actualDeviceDetails.size).toEqual(0);

    });

    //US#392137, US#363848
    test("Verify L1 user should sees validation message while adding a device with Manual Identifer and with existing device unqiue combination of DI and SNo value @363848 @392137", async function () {

        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        let localUid = await TestData.generateUIDforDevice();
        let localAet = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        var response = await ApiHelper.addDevice("DICOM", token, deviceId, "11119", "109.109.109.109", "Test Active Device9", localAet, universalLocIDfromResp, localUid, "OPT: Ophthalmic Tomography", 1, localUid, localSerialNumber, "(Others)", '12390888');
        expect(response.status).toBe(200);

        await basePage.navigateToUrl("l1serviceuser");
        // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
        await customerListPage.searchCustomer(customer);
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
        await customerDetailsPage.addDeviceButtonClick();


        await customerDetailsPage.filldeviceName("Test Active Device9");
        await customerDetailsPage.fillAeTitle("TAD10");
        await customerDetailsPage.fillIpAddress("109.109.109.109");
        await customerDetailsPage.fillPort("11119");
        await customerDetailsPage.fillDeviceSerial(localSerialNumber);
        await customerDetailsPage.selectModality("OPT: Ophthalmic Tomography");
        await customerDetailsPage.selectDeviceIdentifier("(Others)");
        await customerDetailsPage.fillManuallyEnteredDI('12390888');
        await customerDetailsPage.selectDeviceLocation(universalLocIDfromResp);
        await customerDetailsPage.toggleWhitelistDevice("true");

        await customerDetailsPage.applyAllChanges();

        var message = await (await customerDetailsPage.getUIValidationMessage()).trim();
        expect(message).toEqual(LAN.diandSerialErrorMessage);
        await customerDetailsPage.closeUniqueUidAetValidationDialog();
        var activeDevicesTable = await customerDetailsPage.getActiveDevicesTable();
        var actualDeviceDetails = await customerDetailsPage.getDeviceFromDevicesTable(activeDevicesTable, "TAD10");
        expect(actualDeviceDetails.size).toEqual(0);

    });
    //US#392137
    test("Verify L1 user should  not see validation message while updating existing device for the unqiue combination of DI and SNo value @392137", async function () {

        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        let localUid = await TestData.generateUIDforDevice();
        let localAet = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        var response = await ApiHelper.addDevice("DICOM", token, deviceId, "11119", "109.109.109.109", "Test Active Device9", localAet, universalLocIDfromResp, localUid, "OPT: Ophthalmic Tomography", 1, localUid, localSerialNumber, "04049471092080 (IOLMaster 700)", null);
        expect(response.status).toBe(200);

        await basePage.navigateToUrl("l1serviceuser");
        // await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
        await customerListPage.searchCustomer(customer);
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
        var activeDevicesTable = await customerDetailsPage.getActiveDevicesTable();
        var actualDeviceDetails = await customerDetailsPage.editDevice(activeDevicesTable, localUid);

        await customerDetailsPage.filldeviceName("Test Active Device9");
        await customerDetailsPage.fillAeTitle(localAet + "Tes");
        await customerDetailsPage.fillIpAddress("109.109.109.109");
        await customerDetailsPage.fillPort("11119");
        await customerDetailsPage.selectModality("OPT: Ophthalmic Tomography");
        await customerDetailsPage.selectDeviceLocation(universalLocIDfromResp);
        await customerDetailsPage.toggleWhitelistDevice("true");
        await customerDetailsPage.applyAllChanges();
        var activeDevicesTable = await customerDetailsPage.getActiveDevicesTable();
        var actualDeviceDetailsForAET = await customerDetailsPage.getDeviceFromDevicesTable(activeDevicesTable, localAet + "Tes");
        expect(actualDeviceDetailsForAET.get('aetitle')).toEqual(localAet + "Tes");

    });

    //US#392137,402351
    test("Verify L1 user should  see validation message while updating existing device with already existing unqiue combination of DI and SNo value @392137 @402351", async function () {

        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        let localUid = await TestData.generateUIDforDevice();
        let localAet = localUid;
        let localUid2 = await TestData.generateUIDforDevice();
        let localAet2 = localUid2;
        let localSerialNumber = await TestData.generateSerialNumber();
        let localSerialNumber2 = await TestData.generateSerialNumber();

        var response = await ApiHelper.addDevice("DICOM", token, deviceId, "11119", "109.109.109.109", "Test Active Device9", localAet, universalLocIDfromResp, localUid, "OPT: Ophthalmic Tomography", 1, localUid, localSerialNumber, "04049471092080 (IOLMaster 700)", null);
        var response2 = await ApiHelper.addDevice("DICOM", token, deviceId, "11119", "109.109.109.109", "Test Active Device9", localAet2, universalLocIDfromResp, localUid2, "OPT: Ophthalmic Tomography", 1, localUid2, localSerialNumber2, "04049471092080 (IOLMaster 700)", null);

        expect(response.status).toBe(200);
        expect(response2.status).toBe(200);

        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(customer);
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
        var activeDevicesTable = await customerDetailsPage.getActiveDevicesTable();
        var actualDeviceDetails = await customerDetailsPage.editDevice(activeDevicesTable, localUid2);


        await customerDetailsPage.selectDeviceIdentifier("04049471092080 (IOLMaster 700)");
        await customerDetailsPage.fillDeviceSerial(localSerialNumber);

        await customerDetailsPage.applyAllChanges();

        var message = await (await customerDetailsPage.getUIValidationMessage()).trim();
        expect(message).toEqual(LAN.diandSerialErrorMessage);
        await customerDetailsPage.closeUniqueUidAetValidationDialog();



    });
    test.afterAll(async function () {
        //delete the exisiting connected devices
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        await ApiHelper.deleteAll_ActiveDevice(token, deviceId);
        await ApiHelper.deleteAll_InActiveDevice(token, deviceId);
        await ApiHelper.deleteAll_AutomationDeviceLocations(token, customerId);

    });

});

