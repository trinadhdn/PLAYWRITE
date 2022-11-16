const { IotHubMethods } = require('../../../utils/iothub_methods.js');
const { TokenGenerators } = require('../../../utils/token_generators.js');
const { Comparisions } = require('../../../utils/comparisions.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
const { ApiHelper } = require('../../../helpers/api-helpers.js')
var OR = require('../../../resources/OR.json');


const apimConnectedDevicesListURL = process.env.apimBaseURL + OR.APIUrls.connectedDevicesUrl;
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih"
const iothubResourceUri = iothub + '.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'
var sastoken, deviceId, token, conn, response, locIDfromResp,customerDetailsId,customerDetailsRecordSet,customerId,customer;
var testDevice = process.env.serviceUserHypervDeviceId

test.describe("Connected Devices List API for L1 user", function () {
    test.beforeAll(async function () {
        // test data preparation     
        sastoken = await TokenGenerators.generateSasToken(iothubResourceUri, iothubPolicyKey, iothubPolicy, 30)

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
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        // create location-->
        var locName = "AutoLoc-L1Del-ConDiv" + await ApiHelper.createlocname(4)
        var locDesc = "This is the location: " + locName
        var status = "active"
        var postresponse = await ApiHelper.postlocationList(token, customerId, locName, locDesc, status)
        expect(postresponse.status).toBe(200);
        locIDfromResp = postresponse.data.result.id;
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
    });
    //US#74499
    test("L1 user should fetch all the connected devices of a specified device @74499", async function ({ page }) {
        //testdata    
        let localSerialNumber = await TestData.generateSerialNumber(); 
        await ApiHelper.addDevice("DICOM", token, deviceId, "1011", "iol1.customer.internal.com", "IOL0", "436435FE300", locIDfromResp, "IOL111", "OPT: Ophthalmic Tomography", 1, "IOL1", localSerialNumber, "04049539104410(CALLISTO eye)",)
        await ApiHelper.addDevice("DICOM", token, deviceId, "", "", "IOL1", "436435FE301", locIDfromResp, "", "", 0, "IOL2", "", "04049539104410(CALLISTO eye)",)
        await ApiHelper.addDevice("DICOM", token, deviceId, "1011", "iol1.customer.internal.com", "IOL2", "436435FE302", locIDfromResp, "IIOL111OL1", "OPT: Ophthalmic Tomography", 1, "IOL1", localSerialNumber, "04049539104410(CALLISTO eye)",)
        await ApiHelper.addDevice("DICOM", token, deviceId, "", "", "IOL3", "436435FE303", locIDfromResp, "", "", 0, "IOL2", "", "04049539104410(CALLISTO eye)",)
        await ApiHelper.addDevice("DICOM", token, deviceId, "1011", "iol1.customer.internal.com", "IOL4", "436435FE304", locIDfromResp, "IOL111", "OPT: Ophthalmic Tomography", 1, "IOL1", localSerialNumber, "04049539104410(CALLISTO eye)",)
        await ApiHelper.addDevice("DICOM", token, deviceId, "", "", "IOL5", "436435FE305", locIDfromResp, "", "", 0, "IOL2", "", "04049539104410(CALLISTO eye)",)

        await page.waitForTimeout(15000)
        var iothubResponse = await IotHubMethods.getModuleTwin(iothub, deviceId, "dicomforwardermodule", sastoken);
        var iotHubConnectedDevices = iothubResponse.data[0].properties.desired.connectedDevices
        var connectedDevicesArray = Object.values(iotHubConnectedDevices)
        var sortedIothubConnectedDevices = connectedDevicesArray.sort((a, b) => { return a.name < b.name ? -1 : 1 })
        var expectedOutcome = { "activeDevices": [], "inactiveDevices": [] };
        sortedIothubConnectedDevices.forEach(element => {
            if (element.whitelisted == 1) {
                expectedOutcome.activeDevices.push(element);
            } else {
                expectedOutcome.inactiveDevices.push(element);
            }

        });

        //api request
        var config = {
            method: 'get',
            url: apimConnectedDevicesListURL + "/" + deviceId + "/connected-devices",

            headers: { "Authorization": "Bearer " + token },
        };

        var response = await TokenGenerators.request(config);
        var apiData = response.data
        var areEqual = new Array(), apiJSON, iothubJSON;
        expect(response.status).toBe(200);
        if ((apiData.activeDevices.length == expectedOutcome.activeDevices.length) && (apiData.inactiveDevices.length == expectedOutcome.inactiveDevices.length)) {
            for (var i = 0; i < apiData.activeDevices.length; i++) {
                iothubJSON = {
                    "name": expectedOutcome.activeDevices[i].name ? expectedOutcome.activeDevices[i].name : "null",
                    "aet": expectedOutcome.activeDevices[i].aet ? expectedOutcome.activeDevices[i].aet : "null",
                    "port": expectedOutcome.activeDevices[i].port ? expectedOutcome.activeDevices[i].port : "null",
                    "ip": expectedOutcome.activeDevices[i].ip ? expectedOutcome.activeDevices[i].ip : "null",
                    "uid": expectedOutcome.activeDevices[i].uid ? expectedOutcome.activeDevices[i].uid : "null",
                    "acuid": expectedOutcome.activeDevices[i].acuid ? expectedOutcome.activeDevices[i].acuid : "null",
                    "modality": expectedOutcome.activeDevices[i].modality ? expectedOutcome.activeDevices[i].modality : "null",
                    "whitelisted": expectedOutcome.activeDevices[i].whitelisted ? expectedOutcome.activeDevices[i].whitelisted : "null",
                    "mwl": expectedOutcome.activeDevices[i].mwl ? expectedOutcome.activeDevices[i].mwl : "null",
                    "archive": expectedOutcome.activeDevices[i].archive ? expectedOutcome.activeDevices[i].archive : "null"
                }
                apiJSON = {
                    "name": apiData.activeDevices[i].name ? apiData.activeDevices[i].name : "null",
                    "aet": apiData.activeDevices[i].aet ? apiData.activeDevices[i].aet : "null",
                    "port": apiData.activeDevices[i].port ? apiData.activeDevices[i].port : "null",
                    "ip": apiData.activeDevices[i].ip ? apiData.activeDevices[i].ip : "null",
                    "uid": apiData.activeDevices[i].uid ? apiData.activeDevices[i].uid : "null",
                    "acuid": apiData.activeDevices[i].acuid ? apiData.activeDevices[i].acuid : "null",
                    "modality": apiData.activeDevices[i].modality ? apiData.activeDevices[i].modality : "null",
                    "whitelisted": apiData.activeDevices[i].whitelisted ? apiData.activeDevices[i].whitelisted : "null",
                    "mwl": apiData.activeDevices[i].mwl ? apiData.activeDevices[i].mwl : "null",
                    "archive": apiData.activeDevices[i].archive ? apiData.activeDevices[i].archive : "null"
                }
                apiJSON = JSON.parse(JSON.stringify(apiData.activeDevices[i]));
                delete apiJSON.dsn;
                delete apiJSON.dt;
                delete apiJSON.fid;
                delete apiJSON.sgc;
                delete apiJSON.snc;
                iothubJSON = JSON.parse(JSON.stringify(expectedOutcome.activeDevices[i]));
                areEqual.push(Comparisions.compareUnorderedJSONObjects(apiJSON, iothubJSON));
            }
            for (var i = 0; i < apiData.inactiveDevices.length; i++) {
                iothubJSON = {
                    "name": expectedOutcome.inactiveDevices[i].name ? expectedOutcome.inactiveDevices[i].name : "null",
                    "aet": expectedOutcome.inactiveDevices[i].aet ? expectedOutcome.inactiveDevices[i].aet : "null",
                    "port": expectedOutcome.inactiveDevices[i].port ? expectedOutcome.inactiveDevices[i].port : "null",
                    "ip": expectedOutcome.inactiveDevices[i].ip ? expectedOutcome.inactiveDevices[i].ip : "null",
                    "uid": expectedOutcome.inactiveDevices[i].uid ? expectedOutcome.inactiveDevices[i].uid : "null",
                    "acuid": expectedOutcome.inactiveDevices[i].acuid ? expectedOutcome.inactiveDevices[i].acuid : "null",
                    "modality": expectedOutcome.inactiveDevices[i].modality ? expectedOutcome.inactiveDevices[i].modality : "null",
                    "whitelisted": expectedOutcome.inactiveDevices[i].whitelisted ? expectedOutcome.inactiveDevices[i].whitelisted : "null",
                    "mwl": expectedOutcome.inactiveDevices[i].mwl ? expectedOutcome.inactiveDevices[i].mwl : "null",
                    "archive": expectedOutcome.inactiveDevices[i].archive ? expectedOutcome.inactiveDevices[i].archive : "null"
                }
                apiJSON = {
                    "name": apiData.inactiveDevices[i].name ? apiData.inactiveDevices[i].name : "null",
                    "aet": apiData.inactiveDevices[i].aet ? apiData.inactiveDevices[i].aet : "null",
                    "port": apiData.inactiveDevices[i].port ? apiData.inactiveDevices[i].port : "null",
                    "ip": apiData.inactiveDevices[i].ip ? apiData.inactiveDevices[i].ip : "null",
                    "uid": apiData.inactiveDevices[i].uid ? apiData.inactiveDevices[i].uid : "null",
                    "acuid": apiData.inactiveDevices[i].acuid ? apiData.inactiveDevices[i].acuid : "null",
                    "modality": apiData.inactiveDevices[i].modality ? apiData.inactiveDevices[i].modality : "null",
                    "whitelisted": apiData.inactiveDevices[i].whitelisted ? apiData.inactiveDevices[i].whitelisted : "null",
                    "mwl": apiData.inactiveDevices[i].mwl ? apiData.inactiveDevices[i].mwl : "null",
                    "archive": apiData.inactiveDevices[i].archive ? apiData.inactiveDevices[i].archive : "null"
                }
                apiJSON = JSON.parse(JSON.stringify(apiData.inactiveDevices[i]));
                await delete apiJSON.dsn;
                await delete apiJSON.dt;
                await delete apiJSON.fid;
                await delete apiJSON.sgc;
                await delete apiJSON.snc;
                iothubJSON = JSON.parse(JSON.stringify(expectedOutcome.inactiveDevices[i]));
                areEqual.push(Comparisions.compareUnorderedJSONObjects(apiJSON, iothubJSON));
            }
        } else {
            areEqual.push(false)
        }
        expect(areEqual.flat()).not.toContain(false);

    });
    //US#74499
    test("L1 user should return empty list when non-existing device is passed as parameter @74499", async function () {

        //getting connected devices details using non-existing device id
        response = await ApiHelper.getConnectedDevices(token, "randomInvalidDeviceId")
        var responseData = response.data
        expect(response.status).toBe(400);
        expect(responseData).toBe('Invalid device id.');

    });
    //US#74499
    test("should return error when an deviceId is not passed as parameter @74499", async function () {
        var config = {
            method: 'get',
            url: apimConnectedDevicesListURL + "/connected-devices",
            headers: { "Authorization": "Bearer " + token },
        };

        var response = await TokenGenerators.request(config);
        var apiData = response.data
        expect(response.status).toBe(404);
    });
    //US#74499
    test("L1 user should return error when empty device is passed as parameter @74499", async function () {
        //getting connected devices details using empty device id
        response = await ApiHelper.getConnectedDevices(token, " ")
        var responseData = response.data
        expect(response.status).toBe(400);
        expect(responseData).toBe('IotDevice Id should not be empty.');
    });
    test.afterAll(async function () {
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        await ApiHelper.deleteAll_ActiveDevice(token, deviceId);
        await ApiHelper.deleteAll_AutomationDeviceLocations(token, customerId);
        
    });

});