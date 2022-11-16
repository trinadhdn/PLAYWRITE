const { TokenGenerators } = require('../../../utils/token_generators.js');
const { Comparisions } = require('../../../utils/comparisions.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
const { IotHubMethods } = require('../../../utils/iothub_methods.js');
const { ApiHelper } = require('../../../helpers/api-helpers.js')
var OR = require("../../../resources/OR.json");
let ErrorMSG = require('../../../resources/ErrorMSG.json');

const locationListurl = process.env.apimBaseURL + OR.APIUrls.bandwidthDetails;
var token, locIDfromRespdevice,deviceId, conn, sastoken, response, locName, customer, locDesc, postresponse, regulartoken, devicelocationRespResult, customerId, customerDetailsId, customerDetailsRecordSet, customer;
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih"
const iothubResourceUri = iothub + '.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'
var testDevice = process.env.serviceUserHypervDeviceId
var deviceCount = 5;


test.describe("l1user-Get Location List Details", function () {
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
        regulartoken = await TokenGenerators.generateAuthToken("regularuser");
        sastoken = await TokenGenerators.generateSasToken(iothubResourceUri, iothubPolicyKey, iothubPolicy, 30)
    });

    // US#353679,364463
    test("API - L1 user should be able to successfully get the Location Details with valid CustomerID @353679 @364463", async function () {
        locName = "AutoLoc-L1Del-ConDiv" + await ApiHelper.createlocname(4)
        locDesc = "This is the location: " + locName
        postresponse = await ApiHelper.postlocationList(token, customerId, locName, locDesc, "active")
        expect(postresponse.status).toBe(200);
        var locIDfromResp = postresponse.data.result.id;
        response = await ApiHelper.getlocationList(token, customerId)
        var responseData = response.data;
        expect(response.status).toBe(200);
        expect(responseData.statusCode).toBe(200);
        expect(responseData.errorMessage).toBe("");
        expect(responseData.success).toBe(true);
        var responseResult = responseData.result;
        var flagarray = await ApiHelper.validatelocationExists(responseResult, locName, locIDfromResp)
        expect(flagarray[0]).toBe(true);
        expect(flagarray[1]).toBe(true);
        //delete created location
        expect((await ApiHelper.deletelocationByID(token, customerId, locIDfromResp)).status).toBe(200);

    });

    // US#353679,364463
    test("API - L1 user should not be able to successfully get the Location Details with Invalid details @353679 @364463", async function () {

        //Invalid CustomerID
        response = await ApiHelper.getlocationList(token, "customer5985434")
        var responseData = response.data
        expect(response.status).toBe(400);
        expect(responseData.statusCode).toBe(400);
        expect(responseData.errorCode).toBe(3);
        expect(responseData.errorMessage).toBe(ErrorMSG.ErrorMsg_3);
        expect(responseData.result).toBe(null);
        expect(responseData.success).toBe(false);

        //Invalid Token
        response = await ApiHelper.getlocationList("123token", customerId)
        var responseData = response.data
        expect(response.status).toBe(401);

        //Blank CustomerID
        response = await ApiHelper.getlocationList(token, " ")
        var responseData = response.data
        expect(response.status).toBe(400);
        expect(responseData.statusCode).toBe(400);
        expect(responseData.errorCode).toBe(0);
        expect(responseData.errorMessage).toBe(ErrorMSG.ErrorMsg_0);
        expect(responseData.result).toBe(null);
        expect(responseData.success).toBe(false);

    });

    // US#353679,364463
    test("API - L1 user should not be able to get the Location Details of incorrect customer after posting location for another customer @353679 @364463", async function () {
        locName = "AutoLoc-L1Del-ConDiv" + await ApiHelper.createlocname(4)
        locDesc = "This is the location: " + locName
        // create location for 5985
        postresponse = await ApiHelper.postlocationList(token, "5985", locName, locDesc, "active")
        expect(postresponse.status).toBe(200);
        var locIDfromResp = postresponse.data.result.id;
        // get location for 6100
        response = await ApiHelper.getlocationList(token, customerId)
        var responseData = response.data;
        expect(response.status).toBe(200);
        expect(responseData.statusCode).toBe(200);
        expect(responseData.success).toBe(true);
        var responseResult = responseData.result;
        var flagarray = await ApiHelper.validatelocationExists(responseResult, locName, locIDfromResp)
        expect(flagarray).not.toContain(true);

         //delete created location
         expect((await ApiHelper.deletelocationByID(token, "5985", locIDfromResp)).status).toBe(200);

    });

    // US#360590
    test("API - L1 user should be able to successfully get the device details bound to a Location @360590", async function () {

        locName = "AutoLoc-L1Del-ConDiv" + await ApiHelper.createlocname(4)
        locDesc = "This is the location: " + locName
        var status = "active"

        // create location
        var postresponse = await ApiHelper.postlocationList(token, customerId, locName, locDesc, status)
        expect(postresponse.status).toBe(200);
        locIDfromRespdevice = postresponse.data.result.id;

        //search the location 
        response = await ApiHelper.getlocationList(token, customerId)
        expect(response.status).toBe(200);
        var responseResult = response.data.result;
        var flagarray = await ApiHelper.validatelocationExists(responseResult, locName, locIDfromRespdevice)
        expect(flagarray).not.toContain(false);

        //add few devices with above location
        var deviceNamearray = await ApiHelper.createDevicewithlocation("DICOM", token, deviceCount, locIDfromRespdevice, deviceId, sastoken)

        //check the device details from location         
        var devicelocationResp = await ApiHelper.getDeviceLocationByID(token, locIDfromRespdevice, customerId)
        expect(devicelocationResp.status).toBe(200);
        devicelocationRespResult = devicelocationResp.data.result
        expect(devicelocationRespResult.length).toBe(deviceCount);
        var devicelocationArray = await ApiHelper.getDeviceLocationDetails(devicelocationRespResult)
        
        // compare both the devices array
        expect(await Comparisions.compareObjects(deviceNamearray, devicelocationArray)).toBe(true)

    });

    // US#360590
    test("API - L1 user should not  get the device details with invalid inputs @360590", async function () {

        locName = "AutoLoc-L1Del-ConDiv" + await ApiHelper.createlocname(4)
        locDesc = "This is the location: " + locName
        var status = "active"

        // create location
        var postresponse = await ApiHelper.postlocationList(token, customerId, locName, locDesc, status)
        expect(postresponse.status).toBe(200);
        var locIDfromResp = postresponse.data.result.id;

        //check the device details from location if no device is bound to a Location        
        var devicelocationResp = await ApiHelper.getDeviceLocationByID(token, locIDfromResp, customerId)
        expect(devicelocationResp.status).toBe(200);
        devicelocationRespResult = devicelocationResp.data.result
        expect(devicelocationRespResult.length).toBe(0);

        //check the device details from location if Location id is incorrect  --implemented as 200    
        var devicelocationResp = await ApiHelper.getDeviceLocationByID(token, "invalidID", customerId)
        expect(devicelocationResp.status).toBe(200);
        devicelocationRespResult = devicelocationResp.data.result
        expect(devicelocationRespResult.length).toBe(0);

        //check the device details from location if token is incorrect       
        var devicelocationResp = await ApiHelper.getDeviceLocationByID("123fdtg", locIDfromResp, customerId)
        expect(devicelocationResp.status).toBe(401);

        //check the device details from location if locatioID is random 
        var randGUID = await ApiHelper.createGUID()
        response = await ApiHelper.getlocationList(token, customerId)
        expect(response.status).toBe(200);
        var responseResult = response.data.result;
        var flagarray = await ApiHelper.validatelocationExists(responseResult, locName, randGUID)
        expect(flagarray).not.toContain(true);

        var devicelocationResp = await ApiHelper.getDeviceLocationByID(token, randGUID, customerId)
        expect(devicelocationResp.status).toBe(200);
        devicelocationRespResult = devicelocationResp.data.result
        expect(devicelocationRespResult.length).toBe(0);

        //delete created location
        expect((await ApiHelper.deletelocationByID(token, customerId, locIDfromResp)).status).toBe(200);

    });

    test.afterAll(async function () {
        await ApiHelper.deleteAll_ActiveDevice(token, deviceId)
        await ApiHelper.deleteAll_InActiveDevice(token, deviceId)
        
        //Delete All Locations --->
        await ApiHelper.deleteAll_AutomationDeviceLocations(token, customerId);
    });

});