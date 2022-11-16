const { TokenGenerators } = require('../../../utils/token_generators.js');
const { Comparisions } = require('../../../utils/comparisions.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
var OR = require('../../../resources/OR.json');
const { IotHubMethods } = require('../../../utils/iothub_methods.js');
const { ApiHelper } = require('../../../helpers/api-helpers.js')
var activationKey, conn, customer,actualContainerStatuscode,actualContainerStatus,activationStatus,token,customerDetailsId, deviceId, customerId, sastoken, response,customerDetailsRecordSet,customerDetailsId;
const apimDeviceInformationURL = process.env.apimBaseURL + OR.APIUrls.deviceInformationUrl;
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih"
const iothubResourceUri = iothub + '.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'
// var testDevice = `${process.env.subscription}-conm-${process.env.env}-testdevice`
var testDevice = process.env.serviceUserHypervDeviceId 


test.describe("Viewing CM Information API", function () {
    test.beforeAll(async function () {
        // // test data preparation
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
        activationStatus = deviceRecord[0].activationStatus;
        activationKey = deviceRecord[0].activationKey;
        console.log("customerId: " + customerId)
        console.log("deviceId: " + deviceId)
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        sastoken = await TokenGenerators.generateSasToken(iothubResourceUri, iothubPolicyKey, iothubPolicy, 30)
    });
    //US#177343
    test("API- L1 user  should be able to access view CM information API for valid inputs @177343 @177345", async function () {

        response = await ApiHelper.getCmInformation(token, deviceId)
        var apiData = response.data
        expect(response.status).toBe(200);
        var deviceTwinResponse = await IotHubMethods.getDeviceTwin(iothub, deviceId, sastoken);
        var deviceStatus = deviceTwinResponse.data[0].connectionState.toLowerCase()
        var deviceEnv = deviceTwinResponse.data[0].tags.env ? deviceTwinResponse.data[0].tags.env : "";
        var deviceRegion;
        if (deviceTwinResponse.data[0].properties.desired.initialState) {
            var deviceRegionShortcut = deviceTwinResponse.data[0].properties.desired.initialState ? deviceTwinResponse.data[0].properties.desired.initialState.region : "";
            conn = await TestData.sqlDBConnection();
            var regionRecordSet = await TestData.executeSqlQuery(conn, "select * from region where regionShortcut='" + deviceRegionShortcut + "' for json auto");
            var regionRecord = JSON.parse(regionRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
            deviceRegion = regionRecord[0].regionName;
        } else {
            deviceRegion = ""
        }
        conn = await TestData.sqlDBConnection();
        var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Version] where versionId in (select currentVersionId from [dbo].[Device] where iotDeviceId = '" + deviceId + "') for json auto");
        var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        expect(apiData.status.toLowerCase()).toEqual(deviceStatus)
        var envfromtwin= (`${deviceEnv} ${deviceRegion}`).trim()
        expect(apiData.environment.toLowerCase()).toEqual(envfromtwin.toLowerCase())
        expect(apiData.version).toEqual((deviceRecord[0].versionNumber).trim())
        var iothubResponse = await IotHubMethods.getModuleTwin(iothub, deviceId, '$edgeAgent', sastoken);
        var systemModulesJson = iothubResponse.data[0].properties.reported.systemModules
        var desiredCustomModulesJson = iothubResponse.data[0].properties.desired.modules
        var customModulesJson = iothubResponse.data[0].properties.reported.modules
        var customModules = [...new Set([...Object.keys(desiredCustomModulesJson), ...Object.keys(customModulesJson)])]
        var expectedModuleStatus = new Map();
        expectedModuleStatus.set('edgeAgent', systemModulesJson.edgeAgent.runtimeStatus == "unknown" ? "stopped" : systemModulesJson.edgeAgent.runtimeStatus)
        expectedModuleStatus.set('edgeHub', systemModulesJson.edgeHub.runtimeStatus == "unknown" ? "stopped" : systemModulesJson.edgeHub.runtimeStatus)
        for (let i = 0; i < customModules.length; i++) {
            var status;
            if (customModulesJson[customModules[i]]) {
                status = customModulesJson[customModules[i]].runtimeStatus == "unknown" ? "stopped" : customModulesJson[customModules[i]].runtimeStatus
            } else {
                status = "stopped"
            }
            expectedModuleStatus.set(customModules[i], status)
        }
        expect(apiData.connectedContainerStatus.length).toEqual(expectedModuleStatus.size)
        for (let [key, value] of expectedModuleStatus) {
            actualContainerStatus = (apiData.connectedContainerStatus.filter(container => container.name == key))[0].status
            if (value == "failed") {
                value = 'stopped';
            }
            expect(actualContainerStatus.toLowerCase()).toEqual(value)
        }
        /*added to check the status code*/
        if (apiData.status == 'Connected') {
            expect(apiData.statusCode).toBe(1);
        } else {
            expect(apiData.statusCode).toBe(2);
        }
        for (let [key, value] of expectedModuleStatus) {
            actualContainerStatuscode = (apiData.connectedContainerStatus.filter(container => container.name == key))[0].statusCode
            if (value == "failed") {
                value = 2;
            }
            else if (value == "stopped") {
                value = 2;
            }
            else {
                value = 1;
            }
            expect(actualContainerStatuscode).toEqual(value)
        }
        /*added to check the status code*/
        if (apiData.status == 'Connected') {
            var managementmoduleResponse = await IotHubMethods.getModuleTwin(iothub, deviceId, 'managementmodule', sastoken);
            var UptimeUTCDate = Date.parse(managementmoduleResponse.data[0].properties.reported.UptimeUTC)
            var uptimeInMilliseconds = Date.now() - UptimeUTCDate
            var days = Math.floor(uptimeInMilliseconds / (1000 * 60 * 60 * 24));
            var hours = Math.floor(((uptimeInMilliseconds / (1000 * 60 * 60)) % 24));
            var minutes = Math.floor(((uptimeInMilliseconds / (1000 * 60)) % 60))
            if (days != 1) {
                expect((apiData.cmUpTime).includes(`${days} days ${hours}`)).toEqual(true)
            } else {
                expect((apiData.cmUpTime).includes(`${days} day ${hours}`)).toEqual(true)
            }

            var minsInUI = apiData.cmUpTime.split(":")[1];
            expect((minutes - minsInUI) <= 1).toEqual(true);
            expect(apiData.cmIPAddress).toEqual(managementmoduleResponse.data[0].properties.reported.IPAddress)
            expect(apiData.cmMACAddress).toEqual(managementmoduleResponse.data[0].properties.reported.MACAddress)
        } else {
            expect(apiData.cmUpTime).toBeNull
            expect(apiData.cmIPAddress).toBeNull
            expect(apiData.cmMACAddress).toBeNull
        }

    });

    test("For API- L1 user , view CM information API should throw error when invalid device Id is passed @177343 @177345", async function () {
        //getting cminformation with invalid
        response = await ApiHelper.getCmInformation(token, "invaliddevice")
        expect(response.status).toBe(400);
        expect(response.data).toBe("Invalid device id.");

    });

    test("For API- L1 user , view CM information API should return error when no or blank device Id is passed @177343 @177345", async function () {
        //getting cminformation with non existing
        response = await ApiHelper.getCmInformation(token, "")
        expect(response.status).toBe(404);
        expect(response.data.message).toBe("Resource not found");
        //getting cminformation with blank id
        response = await ApiHelper.getCmInformation(token, " ")
        expect(response.status).toBe(404);
        expect(response.data.message).toBe("Resource not found");

    });

    test("For API- L1 user , view CM information API should return error when invalid token is passed @177343 @177345", async function () {
        //getting cminformation with invalid token
        response = await ApiHelper.getCmInformation("invalidtoken", deviceId)
        expect(response.status).toBe(401);
        expect(response.data.message).toBe("Unauthorized");

    });


});
