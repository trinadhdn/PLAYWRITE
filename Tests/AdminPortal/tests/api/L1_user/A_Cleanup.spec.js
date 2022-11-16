const { IotHubMethods } = require('../../../utils/iothub_methods.js');
const { TokenGenerators } = require('../../../utils/token_generators.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
const { ApiHelper } = require('../../../helpers/api-helpers.js');
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih"
const iothubResourceUri = iothub + '.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'
var sastoken, deviceId, token, conn;
var testDevice = process.env.serviceUserHypervDeviceId

test.describe("Clean up the devices for L1 user", function () {
    test.beforeAll(async function () {
        // test data preparation     
        sastoken = await TokenGenerators.generateSasToken(iothubResourceUri, iothubPolicyKey, iothubPolicy, 30)
        conn = await TestData.sqlDBConnection();
        var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where iotdeviceId = '" + testDevice + "' for json auto")
        var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        deviceId = deviceRecord[0].iotDeviceId;
        console.log("deviceId: " + deviceId)
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        
    });

    test("Delete the exisiting connected devices-Start", async function () {
        var flag = await ApiHelper.deleteAll_ActiveDevice(token, deviceId)
        if (flag == true) {
            console.log("All active devices deleted")
        } else {
            console.log("No device to Delete")
        }

        var flag2 = await ApiHelper.deleteAll_InActiveDevice(token, deviceId)
        if (flag2 == true) {
            console.log("All Inactive devices deleted")
        } else {
            console.log("No device to Delete")
        }

    });
});