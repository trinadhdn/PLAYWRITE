const { BasePage } = require('../../../pages/base_page.js');
const { DevicesPage } = require('../../../pages/languages/devices_page.js');
const { TestData } = require('../../../utils/test_data.js');
const { test, expect } = require('@playwright/test');
const { CustomerListPage } = require('../../../pages/customer_list_page.js');
const { StatusListPage } = require('../../../pages/languages/defaultAndStatus_list_page');
const { CustomerDetailsPage } = require('../../../pages/customer_details_page.js');
const { CustomerDetailsStatusPage } = require("../../../pages/customer_details_status_page.js");
var basePage, customerListPage, customerDetailsPage,DevicesPage_ML,StatusPage_ML,customerDetailsStatusPage;

var customerId, customerDetailsRecordSet ,customerName, conn, deviceId, customerDetailsId;
var testDevice = process.env.serviceUserHypervDeviceId;

test.describe('Multi-language check for Devices module with L1 user', function () {
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
        customerListPage = new CustomerListPage(page);
        customerDetailsPage = new CustomerDetailsPage(page);
        StatusPage_ML = new StatusListPage(page);
        customerDetailsStatusPage = new CustomerDetailsStatusPage(page);
        DevicesPage_ML = new DevicesPage(page);

    })

    // US#177466 US#307707 US#385645
    test('Check Devices screen with Multi Languages @ 177466 @307707 @326276 @385645', async function ({ page }) {
        // Navigate to Customer list page
        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(customerId);
        await customerListPage.selectCustomer(customerId);
        await customerDetailsPage.selectCMInstance(deviceId);

        await customerDetailsPage.selectCMInstanceDevices(deviceId);


        expect(await DevicesPage_ML.compareDeviceConfiguration_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareActiveDevices_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareUserInActiveDevices_LabelText()).toEqual(true)

        expect(await DevicesPage_ML.compareUserRefresh_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareAddDevice_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareAD_Name_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareAD_AE_Title_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareAD_Device_ID_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareAD_IPAddress_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareAD_PORT_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareAD_SERIAL_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareAD_LOCATION_LabelText()).toEqual(true)

        expect(await DevicesPage_ML.compareInActive_devices_InfoText_LabelText()).toEqual(true)

        expect(await DevicesPage_ML.compareIAD_Name_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareIAD_AE_Title_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareIAD_Device_ID_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareIAD_IPAddress_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareIAD_PORT_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareIAD_SERIAL_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareIAD_LOCATION_LabelText()).toEqual(true)

    });



    // US#177466 US#307707 US#353696
    test('Check Add Device screen with Multi Languages  @177466 @307707 @326276 @353696', async function ({ page }) {
        // Navigate to Customer list page
        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(customerId);
        await customerListPage.selectCustomer(customerId);
        await customerDetailsPage.selectCMInstance(deviceId);

        await customerDetailsPage.selectCMInstanceDevices(deviceId);

        await customerDetailsPage.addDeviceButtonClick();

        await customerDetailsPage.filldeviceName("");
        await customerDetailsPage.fillAeTitle("");
        await customerDetailsPage.fillIpAddress("");
        await customerDetailsPage.fillPort("");
        await customerDetailsPage.selectModality("");
        await customerDetailsPage.applyAllChanges();

        expect(await DevicesPage_ML.compareDeviceConfiguration_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareInfoMandatory_LabelText()).toEqual(true)

        expect(await DevicesPage_ML.compareAETitleRequired_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareDeviceNameRequired_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareipRequired_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.comparePortRequired_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.comparedeviceIdRequired_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareIAD_SERIAL_LabelText()).toEqual(true)
        
        // await customerDetailsPage.filldeviceName(" ");
        await customerDetailsPage.fillAeTitle("\\");
        await customerDetailsPage.fillIpAddress(" ");
        await customerDetailsPage.fillPort(" ");
        await customerDetailsPage.selectModality(" ");
        await customerDetailsPage.filldeviceName(" ");
        await customerDetailsPage.applyAllChanges();
        expect(await DevicesPage_ML.compareAETitleError_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.comparedeviceLocationRequired_LabelText()).toEqual(true)
        
        expect(await DevicesPage_ML.compareDeviceNameRequired_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareIPError_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.comparePortError_LabelText()).toEqual(true)

        expect(await DevicesPage_ML.comparedeviceNamePlaceholder_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareipPlaceholder_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareportPlaceholder_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareDeviceName_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareAETitleTitle_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareIPAddressModel_LabelText()).toEqual(true)

        expect(await DevicesPage_ML.comparePORT_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareModality_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareDeviceStatus_LabelText()).toEqual(true)

        //expect(await DevicesPage_ML.compareDeviceStatusBody_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareACuid_LabelText()).toEqual(true)
        expect(await DevicesPage_ML.compareuid_LabelText()).toEqual(true)


    });



});
