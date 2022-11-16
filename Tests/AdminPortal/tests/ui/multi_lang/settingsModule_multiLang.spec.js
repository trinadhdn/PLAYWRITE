const { BasePage } = require('../../../pages/base_page.js');
const { SettingsPage } = require('../../../pages/languages/settings_page.js');
const { TestData } = require('../../../utils/test_data.js');
const { CustomerListPage } = require('../../../pages/customer_list_page.js');
const { CustomerDetailsPage } = require('../../../pages/customer_details_page.js');
const { test, expect } = require('@playwright/test');

var customerId, customerName, conn, deviceId, customerDetailsId, customerDetailsRecordSet, basePage, customerListPage, customerDetailsPage, settingsPage_ML;
var testDevice = process.env.serviceUserHypervDeviceId;
var basePage,customerListPage,customerDetailsPage,settingsPage_ML;
test.describe('Multi-language check for settings module with L1 user', function () {
    test.beforeAll(async function () {
        // test data preparation     
        conn = await TestData.sqlDBConnection();
        var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where iotdeviceId ='" + testDevice + "' and activationStatus='True' for json auto")
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
        settingsPage_ML = new SettingsPage(page);
    })

    // US#177466 US#307707
    test("Check settings screen with Multi Languages @177466 @307707 @326276", async function () {
        // Navigate to Customer list page
        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(customerId);
        await customerListPage.selectCustomer(customerId);
        await customerDetailsPage.selectCMInstance(deviceId);

        await customerDetailsPage.selectCMInstanceSettings(deviceId);

        //timeframe section
        expect(await settingsPage_ML.compareTitleHeader_LabelText()).toEqual(true)
        expect(await settingsPage_ML.compareUserInformation_LabelText()).toEqual(true)
        expect(await settingsPage_ML.compareUserinstruction_Text_LabelText()).toEqual(true)

        var time1 = await (await customerDetailsPage.getTimeframeRadioButton(1)).getAttribute("label");
        var time2 = await (await customerDetailsPage.getTimeframeRadioButton(2)).getAttribute("label");
        var time3 = await (await customerDetailsPage.getTimeframeRadioButton(3)).getAttribute("label");
        let time1Boundaries = time1.split("-")
        let time2Boundaries = time2.split("-")
        let time3Boundaries = time3.split("-")

        if (process.env.locale.includes("DE") || process.env.locale.includes("ES")) {

            expect(await settingsPage_ML.checkRemoveampm(time1Boundaries)).not.toContain(true);
            expect(await settingsPage_ML.checkRemoveampm(time2Boundaries)).not.toContain(true);
            expect(await settingsPage_ML.checkRemoveampm(time3Boundaries)).not.toContain(true);
            expect((await TestData.getUTCTimeCustom24hrs(time1Boundaries[0])).includes("02:00:00")).toEqual(true)
            expect((await TestData.getUTCTimeCustom24hrs(time1Boundaries[1])).includes("04:00:00")).toEqual(true)
            expect((await TestData.getUTCTimeCustom24hrs(time2Boundaries[0])).includes("10:00:00")).toEqual(true)
            expect((await TestData.getUTCTimeCustom24hrs(time2Boundaries[1])).includes("12:00:00")).toEqual(true)
            expect((await TestData.getUTCTimeCustom24hrs(time3Boundaries[0])).includes("04:00:00")).toEqual(true)
            expect((await TestData.getUTCTimeCustom24hrs(time3Boundaries[1])).includes("06:00:00")).toEqual(true)
        } else {

            expect((await TestData.getUTCTimeCustom(time1Boundaries[0])).includes("02:00:00")).toEqual(true)
            expect((await TestData.getUTCTimeCustom(time1Boundaries[1])).includes("04:00:00")).toEqual(true)
            expect((await TestData.getUTCTimeCustom(time2Boundaries[0])).includes("10:00:00")).toEqual(true)
            expect((await TestData.getUTCTimeCustom(time2Boundaries[1])).includes("12:00:00")).toEqual(true)
            expect((await TestData.getUTCTimeCustom(time3Boundaries[0])).includes("04:00:00")).toEqual(true)
            expect((await TestData.getUTCTimeCustom(time3Boundaries[1])).includes("06:00:00")).toEqual(true)
        }


        //Bandwidth section
        expect(await settingsPage_ML.compareBandwidthTitle_LabelText()).toEqual(true)
        expect(await settingsPage_ML.comparelimitUpstreamBandwidthLabel()).toEqual(true)
        expect(await settingsPage_ML.comparelimitDownstreamBandwidthLabel()).toEqual(true)
        expect(await settingsPage_ML.compareapplySettingstext()).toEqual(true)

        //Custom Label General Section

        expect(await customerDetailsPage.isGeneralSectionDisplayed()).toBe(true);
        expect(await customerDetailsPage.isNameLabelDisplayed()).toBe(true);

        expect(await customerDetailsPage.compareGeneralLabel()).toBe(true);
        expect(await customerDetailsPage.compareNameLabel()).toBe(true);
        expect(await customerDetailsPage.compareApplyLabel()).toBe(true);
        expect(await customerDetailsPage.compareNamePlaceholder()).toBe(true);

        await customerDetailsPage.enterCustomName("customLabel");
        await customerDetailsPage.enterCustomName("#$%^*#");
        await customerDetailsPage.customnameSave();

        //Validate the error message for blank name
        expect(await customerDetailsPage.comparecustomLabelError()).toBe(true)
        expect(await customerDetailsPage.compareDeviceName()).toBe(deviceId)

    });



});
