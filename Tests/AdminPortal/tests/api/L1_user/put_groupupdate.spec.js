const { TokenGenerators } = require('../../../utils/token_generators.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
var OR = require('../../../resources/OR.json');
let { ApiHelper } = require('../../../helpers/api-helpers.js');
const apimGroupUpdateURL = process.env.apimBaseURL + OR.APIUrls.groupUpdateUrl;
var testDevice = process.env.serviceUserHypervDeviceId
var deviceId,groupId, token, conn, updatedGroupId, sastoken;

const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih"
const iothubResourceUri = iothub + '.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'
test.describe("GroupUpdate API for L1 users", function () {
    test.beforeAll(async function () {
        // test data preparation   
        conn = await TestData.sqlDBConnection();
        var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where customerDetailsId in (select customerDetailsId from [dbo].[CustomerDetails] where customerId='5985' ) and activationStatus='True' and iotDeviceId != '" + testDevice + "' for json auto")
        var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        deviceId = deviceRecord[0].iotDeviceId;
        groupId = deviceRecord[0].groupId;
        token = await TokenGenerators.generateAuthToken("regularuser")
        sastoken = await TokenGenerators.generateSasToken(iothubResourceUri, iothubPolicyKey, iothubPolicy, 30)
    });
    test.beforeEach(async function () {
        if (groupId == 1) {
            updatedGroupId = 2
        } else if (groupId == 2) {
            updatedGroupId = 3
        } else if (groupId == 3) {
            updatedGroupId = 1
        }
    })
    //US#177339
    test("GroupUpdate API should be able to update the timeframe group for updates for L1 user @177339", async function () {

        //api request
        let response = await ApiHelper.selectTimeframeUpdateGroupAssociate(token, deviceId, updatedGroupId);
        expect(response.status).toBe(200);
        conn = await TestData.sqlDBConnection();
        var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where iotDeviceId='" + deviceId + "' for json auto");
        var devicesRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        expect(devicesRecord[0].groupId).toEqual(updatedGroupId);
    });
    //US#177339
    test("GroupUpdate API should be NOT able to update the timeframe group when invalid deviceId is passed for L1 user @177339", async function () {
        //api request
        let response = await ApiHelper.selectTimeframeUpdateGroupAssociate(token, 'InvalidDeviceId', updatedGroupId);
        expect(response.status).toBe(400);
        expect(response.data).toBe('Invalid device id.');
    });
    //US#177339
    test("GroupUpdate API should be NOT able to update the timeframe group when invalid groupId is passed for L1 user @177339", async function () {
        //api request
        let response = await ApiHelper.selectTimeframeUpdateGroupAssociate(token, deviceId, 12);
        expect(response.status).toBe(400);
    });
    //US#177339
    test("GroupUpdate API should throw error when empty deviceId is passed for L1 user @177339", async function () {
        let response = await ApiHelper.selectTimeframeUpdateGroupAssociate(token, ' ', updatedGroupId);
        expect(response.status).toBe(400);
        expect(response.data).toEqual("IotDevice Id should not be empty.");
    });
    //US#177339
    test("GroupUpdate API should throw error when empty groupId is passed for L1 user @177339", async function () {
        let response = await ApiHelper.selectTimeframeUpdateGroupAssociate(token, deviceId, ' ');
        expect(response.status).toBe(400);
        expect(response.data).toEqual("Group Id should not be empty.");
    });

});