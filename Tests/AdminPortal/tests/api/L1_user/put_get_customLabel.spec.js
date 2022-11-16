const { TokenGenerators } = require('../../../utils/token_generators.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
const { ApiHelper } = require('../../../helpers/api-helpers.js')
var OR = require("../../../resources/OR.json");
let ErrorMSG = require('../../../resources/ErrorMSG.json');


var token,putresponse4,putresponsedata,customerId,sastoken,customerDetailsId,customerDetailsRecordSet, deviceId, iotdeviceId, conn, customLabel, putresponse, getResponse, regulartoken;
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih"
const iothubResourceUri = iothub + '.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'
var testDevice = process.env.serviceUserHypervDeviceId

test.describe("L1 user-Put Get customLabel Details", function () {
    test.beforeAll(async function () {
        // test data preparation
        conn = await TestData.sqlDBConnection();
        var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where iotdeviceId = '" + testDevice + "' for json auto")
        var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        iotdeviceId = deviceRecord[0].iotDeviceId;
        deviceId = deviceRecord[0].deviceId;
        customerDetailsId = deviceRecord[0].customerDetailsId;
        conn = await TestData.sqlDBConnection();
        customerDetailsRecordSet = await TestData.executeSqlQuery(conn, "select * from [dbo].[CustomerDetails] where customerdetailsId=" + customerDetailsId + " for json auto")
        var customerDetailsRecord = JSON.parse(customerDetailsRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        customerId = customerDetailsRecord[0].customerId;
        console.log("customerId: " + customerId)
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        regulartoken = await TokenGenerators.generateAuthToken("regularuser");
        sastoken = await TokenGenerators.generateSasToken(iothubResourceUri, iothubPolicyKey, iothubPolicy, 30)
        //remove custom label
        conn = await TestData.sqlDBConnection();
        await TestData.executeSqlQuery(conn, "Update [dbo].[Device] set customLabel= null where iotDeviceId='" + testDevice + "'")
    });

    // US#397621
    test("API - L1 user should be able to successfully update the custom Label Details with valid details @397621", async function () {
        customLabel = "Label " + await ApiHelper.createcustomLabel(9)
        putresponse = await ApiHelper.putCustomLabel(token, iotdeviceId, customLabel)
        putresponsedata = putresponse.data
        expect(putresponse.status).toBe(200);
        expect(putresponsedata.statusCode).toBe(200);
        expect(putresponsedata.result).toBe(customLabel);
        expect(putresponsedata.success).toBe(true);
        expect(putresponsedata.errorCode).toBe(0);
        expect(putresponsedata.errorMessage).toBe("");

        //validate DB update
        conn = await TestData.sqlDBConnection();
        var customLabelRecordset = await TestData.executeSqlQuery(conn, "select * from [dbo].[Device] where iotdeviceId = '" + testDevice + "' for json auto")
        var customLabelRecord = JSON.parse(customLabelRecordset['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        var updatedLabel = customLabelRecord[0].customLabel;
        expect(updatedLabel).toBe(customLabel)

        //remove custom label
        conn = await TestData.sqlDBConnection();
        await TestData.executeSqlQuery(conn, "Update [dbo].[Device] set customLabel= null where iotDeviceId='" + testDevice + "'")

    });

    // US#397621
    test("API - L1 user should see error when updating custom label with Blank details @397621", async function () {
        customLabel = "Label " + await ApiHelper.createcustomLabel(9)

        //#1 Custom Label is Blank
        putresponse = await ApiHelper.putCustomLabel(token, iotdeviceId, " ")
        putresponsedata = putresponse.data
        expect(putresponse.status).toBe(400);
        expect(putresponsedata.statusCode).toBe(400);
        expect(putresponsedata.result).toBe(null);
        expect(putresponsedata.success).toBe(false);
        expect(putresponsedata.errorCode).toBe(3004);
        expect(putresponsedata.errorMessage).toBe(ErrorMSG.EmptycustomLabel);

        //#2 Blank request body
        var apiCustomLabelUrl = process.env.apimBaseURL + OR.updatedAPIUrls.customLabelurl;
        apiCustomLabelUrl = apiCustomLabelUrl.replace('{iotDeviceId}', iotdeviceId);
        var config = {
            method: 'put',
            url: apiCustomLabelUrl,
            data: {},
            headers: { "Authorization": "Bearer " + token }
        };
        var putresponse2 = await TokenGenerators.request(config);
        putresponsedata = putresponse2.data
        expect(putresponse2.status).toBe(400);
        expect(putresponsedata.statusCode).toBe(400);
        expect(putresponsedata.result).toBe(null);
        expect(putresponsedata.success).toBe(false);
        expect(putresponsedata.errorCode).toBe(3004);
        expect(putresponsedata.errorMessage).toBe(ErrorMSG.EmptycustomLabel);

        //#3 iotDeviceid is Blank in URL
        var putresponse3 = await ApiHelper.putCustomLabel(token, " ", customLabel)
        putresponsedata = putresponse3.data
        expect(putresponse3.status).toBe(400);
        expect(putresponsedata.statusCode).toBe(400);
        expect(putresponsedata.result).toBe(null);
        expect(putresponsedata.success).toBe(false);
        expect(putresponsedata.errorCode).toBe(4);
        expect(putresponsedata.errorMessage).toBe(ErrorMSG.ErrorMsg_4);


        //#4 Custom Label is null
        putresponse4 = await ApiHelper.putCustomLabel(token, iotdeviceId, null)
        putresponsedata = putresponse4.data
        expect(putresponse4.status).toBe(400);
        expect(putresponsedata.statusCode).toBe(400);
        expect(putresponsedata.result).toBe(null);
        expect(putresponsedata.success).toBe(false);
        expect(putresponsedata.errorCode).toBe(3004);
        expect(putresponsedata.errorMessage).toBe(ErrorMSG.EmptycustomLabel);


    });

    // US#397621
    test("API - L1 user should see error when updating custom label with Invalid details @397621", async function () {

        customLabel = "Label " + await ApiHelper.createcustomLabel(9)
        //#1 Invalid characters in customLabel   --Bug#402805 
        putresponse = await ApiHelper.putCustomLabel(token, iotdeviceId, "invalid%^$&#*")
        putresponsedata = putresponse.data
        expect(putresponse.status).toBe(400);
        expect(putresponsedata.statusCode).toBe(400);
        expect(putresponsedata.result).toBe(null);
        expect(putresponsedata.success).toBe(false);
        expect(putresponsedata.errorCode).toBe(3005);
        expect(putresponsedata.errorMessage).toBe(ErrorMSG.customLabelInvalid);

        //#2 incorrect iotdeviceid in url
        var putresponse2 = await ApiHelper.putCustomLabel(token, "zidag-hgf56", customLabel)
        putresponsedata = putresponse2.data
        expect(putresponse2.status).toBe(400);
        expect(putresponsedata.statusCode).toBe(400);
        expect(putresponsedata.result).toBe(null);
        expect(putresponsedata.success).toBe(false);
        expect(putresponsedata.errorCode).toBe(1);
        expect(putresponsedata.errorMessage).toBe(ErrorMSG.ErrorMsg_1);


        //#3 invalid characters in url 
        var putresponse3 = await ApiHelper.putCustomLabel(token, "zidag-***-fgh", customLabel)
        putresponsedata = putresponse3.data
        expect(putresponse3.status).toBe(400);
        expect(putresponsedata.statusCode).toBe(400);
        expect(putresponsedata.result).toBe(null);
        expect(putresponsedata.success).toBe(false);
        expect(putresponsedata.errorCode).toBe(1);
        expect(putresponsedata.errorMessage).toBe(ErrorMSG.ErrorMsg_1);

        //#4 >20 characters in customLabel
        customLabel = "Label " + await ApiHelper.createcustomLabel(15)
        putresponse4 = await ApiHelper.putCustomLabel(token, iotdeviceId, customLabel)
        putresponsedata = putresponse4.data
        expect(putresponse4.status).toBe(400);
        expect(putresponsedata.statusCode).toBe(400);
        expect(putresponsedata.result).toBe(null);
        expect(putresponsedata.success).toBe(false);
        expect(putresponsedata.errorCode).toBe(3005);
        expect(putresponsedata.errorMessage).toBe(ErrorMSG.customLabelInvalid);

        //#5 ''\\' characters in customLabel 
        let putresponse5 = await ApiHelper.putCustomLabel(token, iotdeviceId, "invalid\\label")
        putresponsedata = putresponse5.data
        expect(putresponse5.status).toBe(400);
        expect(putresponsedata.statusCode).toBe(400);
        expect(putresponsedata.result).toBe(null);
        expect(putresponsedata.success).toBe(false);
        expect(putresponsedata.errorCode).toBe(0);
        expect(putresponsedata.errorMessage).toBe(ErrorMSG.InvalidPayload);

    });

    // US#397621
    test("API - L1 user should see error when updating custom label for ALL invalid characters @397621", async function () {

        var invalchar = '!@#$%^&*(){}?|<>+='
        for (var i = 0; i < invalchar.length; i++) {
            customLabel = "inval" + invalchar[i] + "Label"
            putresponse = await ApiHelper.putCustomLabel(token, iotdeviceId, customLabel)
            putresponsedata = putresponse.data
            expect(putresponse.status).toBe(400);
            expect(putresponsedata.statusCode).toBe(400);
            expect(putresponsedata.result).toBe(null);
            expect(putresponsedata.success).toBe(false);
            expect(putresponsedata.errorCode).toBe(3005);
            expect(putresponsedata.errorMessage).toBe(ErrorMSG.customLabelInvalid);
        }

    });

    // US#397621
    test("API - L1 user should be able to successfully get the custom Label Details for device @397621", async function () {
        customLabel = "Label " + await ApiHelper.createcustomLabel(9)
        putresponse = await ApiHelper.putCustomLabel(token, iotdeviceId, customLabel)
        putresponsedata = putresponse.data
        expect(putresponse.status).toBe(200);
        expect(putresponsedata.result).toBe(customLabel);

        //validate DB update
        conn = await TestData.sqlDBConnection();
        var customLabelRecordset = await TestData.executeSqlQuery(conn, "select * from [dbo].[Device] where iotdeviceId = '" + testDevice + "' for json auto")
        var customLabelRecord = JSON.parse(customLabelRecordset['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        var updatedLabel = customLabelRecord[0].customLabel;
        expect(updatedLabel).toBe(customLabel)

        //getdevice 
        getResponse = await ApiHelper.getCustomlabel(token, customerId)

        //validate updated custom label for the device
        var validatecustomLabelExist = await ApiHelper.validateCustomlabelfordevice(getResponse, iotdeviceId, customLabel)
        expect(validatecustomLabelExist).toBe(true)

        //remove custom label
        conn = await TestData.sqlDBConnection();
        await TestData.executeSqlQuery(conn, "Update [dbo].[Device] set customLabel= null where iotDeviceId='" + testDevice + "'")

    });

});