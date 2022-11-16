const { TokenGenerators } = require('../../../utils/token_generators.js');
const { Comparisions } = require('../../../utils/comparisions.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
const { IotHubMethods } = require('../../../utils/iothub_methods.js');
const { ApiHelper } = require('../../../helpers/api-helpers.js')
var OR = require("../../../resources/OR.json");
let ErrorMSG = require('../../../resources/ErrorMSG.json');

const locationListurl = process.env.apimBaseURL + OR.APIUrls.bandwidthDetails;
var token, regtoken, deviceId, conn, sastoken, getresponse, delresponse,customerId, response,customerDetailsId,customerDetailsRecordSet,customer;
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih"
const iothubResourceUri = iothub + '.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'
var testDevice = process.env.serviceUserHypervDeviceId

test.describe("L1 user Delete Location Details", function () {
    test.beforeAll(async function () {
        // test data preparation
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
        regtoken = await TokenGenerators.generateAuthToken("regularuser");
        sastoken = await TokenGenerators.generateSasToken(iothubResourceUri, iothubPolicyKey, iothubPolicy, 30)
    });

    // US#353676,364463
    test("API - L1 user should be able to successfully delete the Location Details for valid location Id @353676 @364463", async function () {
        var locName = "AutoLoc-L1Del-Loc" + await ApiHelper.createlocname(4)
        var locDesc = "This is the AutoLoc: " + locName
        var status = "active"

        // create location
        var postresponse = await ApiHelper.postlocationList(token, customerId, locName, locDesc, status)
        expect(postresponse.status).toBe(200);
        var locIDfromResp = postresponse.data.result.id;

        //search the location 
        response = await ApiHelper.getlocationList(token, customerId)
        var responseData = response.data;
        expect(response.status).toBe(200);
        var responseResult = responseData.result;
        var flagarray = await ApiHelper.validatelocationExists(responseResult, locName, locIDfromResp)
        expect(flagarray).not.toContain(false);

        // delete the location
        delresponse = await ApiHelper.deletelocationByID(token, customerId, locIDfromResp)
        expect(delresponse.status).toBe(200);
        expect(delresponse.data.result).toBe(locIDfromResp);

        //check the location if deleted or not
        getresponse = await ApiHelper.getlocationList(token, customerId)
        expect(getresponse.status).toBe(200);
        var responseResult = getresponse.data.result;
        var flagarray = await ApiHelper.validatelocationExists(responseResult, locName, locIDfromResp)
        expect(flagarray).not.toContain(true);

    });

    // US#353676,364463
    test("API - L1 user should Not be able to delete the Location with invalid details @353676 @364463", async function () {
        var locName = "AutoLoc-L1Del-Loc" + await ApiHelper.createlocname(4)
        var locDesc = "This is the AutoLoc: " + locName
        var status = "active"

        // create location
        var postresponse = await ApiHelper.postlocationList(token, customerId, locName, locDesc, status)
        expect(postresponse.status).toBe(200);
        var locIDfromResp = postresponse.data.result.id;

        //search the location 
        response = await ApiHelper.getlocationList(token, customerId)
        expect(response.status).toBe(200);
        var responseResult = response.data.result;
        var flagarray = await ApiHelper.validatelocationExists(responseResult, locName, locIDfromResp)
        expect(flagarray).not.toContain(false);

        //1. delete the location with different customer id and correct location id
        delresponse = await ApiHelper.deletelocationByID(token, "5985", locIDfromResp)
        expect(delresponse.status).toBe(400);
        expect(delresponse.data.errorCode).toBe(4033);
        expect(delresponse.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4033);

        //2. delete the location with invalid customer id and correct name
        delresponse = await ApiHelper.deletelocationByID(token, "invalid453", locIDfromResp)
        expect(delresponse.status).toBe(400);
        expect(delresponse.data.errorCode).toBe(3);
        expect(delresponse.data.errorMessage).toBe(ErrorMSG.ErrorMsg_3);


        //3. delete the location with valid customer id and incorrect id
        delresponse = await ApiHelper.deletelocationByID(token, customerId, "invalidID123")
        expect(delresponse.status).toBe(400);
        expect(delresponse.data.errorCode).toBe(4033);
        expect(delresponse.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4033);

        //4. delete the location with valid customer id and random locationID
        var randGUID = await ApiHelper.createGUID()
        response = await ApiHelper.getlocationList(token, customerId)
        expect(response.status).toBe(200);
        var responseResult = response.data.result;
        var flagarray = await ApiHelper.validatelocationExists(responseResult, locName, randGUID)
        expect(flagarray).not.toContain(true);
        delresponse = await ApiHelper.deletelocationByID(token, customerId, randGUID)
        expect(delresponse.status).toBe(400); 

        //5. delete the location with invalid token
        delresponse = await ApiHelper.deletelocationByID("token123", customerId, locIDfromResp)
        expect(delresponse.status).toBe(401);

        delresponse = await ApiHelper.deletelocationByID(regtoken, customerId, locIDfromResp)
        expect(delresponse.status).toBe(403);


        //6. delete the location with null id        
        delresponse = await ApiHelper.deletelocationByID(token, customerId, " /")
        expect(delresponse.status).toBe(400);
        expect(delresponse.data.errorCode).toBe(4034);
        expect(delresponse.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4034);

        //7. delete the location of already deleted location

        // delete successfully---->
        delresponse = await ApiHelper.deletelocationByID(token, customerId, locIDfromResp)
        expect(delresponse.status).toBe(200);

        // again try to delete the same location---->
        delresponse = await ApiHelper.deletelocationByID(token, customerId, locIDfromResp)
        expect(delresponse.status).toBe(400);
        expect(delresponse.data.errorCode).toBe(4033); //Need to be fixed
        expect(delresponse.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4033);





    });

    // US#353676,364463
    test("API - L1 user should Not be able to delete the Location which is associated with device @353676 @364463", async function () {
        var locName = "AutoLoc-L1Del-Loc" + await ApiHelper.createlocname(4)
        var locDesc = "This is the location: " + locName
        var status = "active"

        // create location
        var postresponse = await ApiHelper.postlocationList(token, customerId, locName, locDesc, status)
        expect(postresponse.status).toBe(200);
        var locIDfromResp = postresponse.data.result.id;

        //search the location 
        response = await ApiHelper.getlocationList(token, customerId)
        expect(response.status).toBe(200);
        var responseResult = response.data.result;
        var flagarray = await ApiHelper.validatelocationExists(responseResult, locName, locIDfromResp)
        expect(flagarray).not.toContain(false);

        //add a device with above location
        let globalUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let globalAet = globalUid;
        console.log(globalUid);
        let localSerialNumber = await TestData.generateSerialNumber();
        var adddeviceResp = await ApiHelper.addDevice("DICOM", token, deviceId, "1010", "iol1.customer.internal.com", "AutDevic10150", globalUid, locIDfromResp, "10105", "OPT: Ophthalmic Tomography", 1, globalAet, localSerialNumber, "04049539104410(CALLISTO eye)",)
        expect(adddeviceResp.status).toBe(200);

        //delete the location
        delresponse = await ApiHelper.deletelocationByID(token, customerId, locIDfromResp)
        expect(delresponse.status).toBe(409);
        expect(delresponse.data.errorCode).toBe(4038);
        expect(delresponse.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4038);

        // delete device
        var deleteLatestResponse = await ApiHelper.deleteDevice("DICOM", token, deviceId, globalUid)
        expect(deleteLatestResponse.status).toBe(200);

        //delete the location
        delresponse = await ApiHelper.deletelocationByID(token, customerId, locIDfromResp)
        expect(delresponse.status).toBe(200);

    });
    test.afterAll(async function () {       
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        await ApiHelper.deleteAll_ActiveDevice(token, deviceId);
        await ApiHelper.deleteAll_AutomationDeviceLocations(token, customerId);
   

    });

});

