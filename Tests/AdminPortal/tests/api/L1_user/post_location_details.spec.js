const { TokenGenerators } = require('../../../utils/token_generators.js');
const { Comparisions } = require('../../../utils/comparisions.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
const { IotHubMethods } = require('../../../utils/iothub_methods.js');
const { ApiHelper } = require('../../../helpers/api-helpers.js')
var OR = require("../../../resources/OR.json");
let ErrorMSG = require('../../../resources/ErrorMSG.json');

const locationListurl = process.env.apimBaseURL + OR.APIUrls.bandwidthDetails;
var token, deviceId,customerId,customer, conn,customerDetailsId,customerDetailsRecordSet, sastoken, response, updateresponse, getresponse, updatedName, updatedDesc, updateresponsedata, updateresponseresult;
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih"
const iothubResourceUri = iothub + '.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'
var testDevice = process.env.serviceUserHypervDeviceId

test.describe("L1 user Post and Update Location List Details", function () {
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
        sastoken = await TokenGenerators.generateSasToken(iothubResourceUri, iothubPolicyKey, iothubPolicy, 30)
    });

    // US#353679,364463
    test("API - L1 user should be able to successfully post the Location Details with valid details @353679 @364463", async function () {
        var locName = "AutoLoc-L1Post-Loc" + await ApiHelper.createlocname(4)
        var locDesc = "This is the location: " + locName
        var status = "active"
        var postresponse = await ApiHelper.postlocationList(token, customerId, locName, locDesc, status)
        expect(postresponse.status).toBe(200);
        var locIDfromResp = postresponse.data.result.id;
        response = await ApiHelper.getlocationList(token, customerId)
        var responseData = response.data;
        expect(response.status).toBe(200);
        expect(responseData.errorCode).toBe(0);
        var responseResult = responseData.result;
        var flagarray = await ApiHelper.validatelocationExists(responseResult, locName, locIDfromResp)
        expect(flagarray[0]).toBe(true);
        expect(flagarray[1]).toBe(true);
        //delete created location
        expect((await ApiHelper.deletelocationByID(token, customerId, locIDfromResp)).status).toBe(200);

    });

    // US#353679,364463
    test("API - L1 user error codes validation for invalid details for post location @353679 @364463", async function () {
        var status, locName, locDesc, locname51char, postresponsedata, locDescgrtr255char
        locName = "AutoLoc-L1Post-Loc" + await ApiHelper.createlocname(4)
        locDesc = "This is the location: " + locName
        status = "active"

        // for invalid customerID
        var postresponse = await ApiHelper.postlocationList(token, "customer123", locName, locDesc, status)
        postresponsedata = postresponse.data
        expect(postresponse.status).toBe(400);
        expect(postresponsedata.errorMessage).toBe(ErrorMSG.ErrorMsg_3)
        expect(postresponsedata.success).toBe(false);
        expect(postresponsedata.statusCode).toBe(400);
        expect(postresponsedata.result).toBe(null);
        expect(postresponsedata.errorCode).toBe(3);

        // for invalid token
        var postresponse = await ApiHelper.postlocationList("token123", customerId, locName, locDesc, status)
        expect(postresponse.status).toBe(401);

        // for location name >50 character        
        locname51char = "AutoLoc-L1Post-Loc" + await ApiHelper.createlocname(43)
        var postresponse = await ApiHelper.postlocationList(token, customerId, locname51char, locDesc, status)
        postresponsedata = postresponse.data
        expect(postresponse.status).toBe(400);
        expect(postresponsedata.errorMessage).toBe(ErrorMSG.ErrorMsg_4027)
        expect(postresponsedata.success).toBe(false);
        expect(postresponsedata.statusCode).toBe(400);
        expect(postresponsedata.result).toBe(null);
        expect(postresponsedata.errorCode).toBe(4027);

        // for location description >255 character         
        locDescgrtr255char = "Description: " + await ApiHelper.createlocname(255)
        var postresponse = await ApiHelper.postlocationList(token, customerId, locName, locDescgrtr255char, status)
        postresponsedata = postresponse.data
        expect(postresponse.status).toBe(400);
        expect(postresponsedata.errorMessage).toBe(ErrorMSG.ErrorMsg_4031)
        expect(postresponsedata.success).toBe(false);
        expect(postresponsedata.statusCode).toBe(400);
        expect(postresponsedata.result).toBe(null);
        expect(postresponsedata.errorCode).toBe(4031);

        // for incorrect status
        status = "ACTIVE"
        var postresponse = await ApiHelper.postlocationList(token, customerId, locName, locDesc, status)
        postresponsedata = postresponse.data
        expect(postresponse.status).toBe(400);
        expect(postresponsedata.errorMessage).toBe(ErrorMSG.ErrorMsg_4032)
        expect(postresponsedata.success).toBe(false);
        expect(postresponsedata.statusCode).toBe(400);
        expect(postresponsedata.result).toBe(null);
        expect(postresponsedata.errorCode).toBe(4032);

    });

    // US#353679,364463
    test("API - L1 user error codes validation for blank or missing detailsfor post location @353679 @364463", async function () {
        var status, locName, locDesc, responseData
        locName = "AutoLoc-L1Post-Loc" + await ApiHelper.createlocname(4)
        locDesc = "This is the location: " + locName
        status = "active"

        // for Blank customer ID
        var postresponse = await ApiHelper.postlocationList(token, " ", locName, locDesc, status)
        responseData = postresponse.data
        expect(postresponse.status).toBe(400);
        expect(responseData.errorMessage).toBe(ErrorMSG.ErrorMsg_0)
        expect(responseData.success).toBe(false);
        expect(responseData.statusCode).toBe(400);
        expect(responseData.result).toBe(null);
        expect(responseData.errorCode).toBe(0);

        // for blank token
        var postresponse = await ApiHelper.postlocationList(" ", customerId, locName, locDesc, status)
        expect(postresponse.status).toBe(401);

        // for Blank location name
        var postresponse = await ApiHelper.postlocationList(token, customerId, " ", locDesc, status)
        responseData = postresponse.data
        expect(postresponse.status).toBe(400);
        expect(responseData.errorMessage).toBe(ErrorMSG.ErrorMsg_4025)
        expect(responseData.success).toBe(false);
        expect(responseData.statusCode).toBe(400);
        expect(responseData.result).toBe(null);
        expect(responseData.errorCode).toBe(4025);

        // for Blank location description--will allow
        var postresponse = await ApiHelper.postlocationList(token, customerId, locName, "", status)
        expect(postresponse.status).toBe(200);
        expect(postresponse.data.errorCode).toBe(0);
        var locIDfromResp = postresponse.data.result.id;
        expect((await ApiHelper.deletelocationByID(token, customerId, locIDfromResp)).status).toBe(200);


        // for Blank status
        var postresponse = await ApiHelper.postlocationList(token, customerId, locName, locDesc, "")
        responseData = postresponse.data
        expect(postresponse.status).toBe(400);
        expect(responseData.errorMessage).toBe(ErrorMSG.ErrorMsg_4028)
        expect(responseData.success).toBe(false);
        expect(responseData.statusCode).toBe(400);
        expect(responseData.result).toBe(null);
        expect(responseData.errorCode).toBe(4028);

        // for missing parameters
        var postresponse = await ApiHelper.postlocationList(token, customerId)
        expect(postresponse.status).toBe(500);

    });


    // US#353676
    test("API - L1 user should be able to successfully update the Location Details @353676", async function () {
        var locName = "AutoLoc-L1Post-Loc" + await ApiHelper.createlocname(4)
        var locDesc = "This is the location: " + locName
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
        expect(flagarray[0]).toBe(true);
        expect(flagarray[1]).toBe(true);

        //Update location name description
        updatedName = "Update-" + await ApiHelper.createlocname(5)
        updatedDesc = "Updated location is: " + updatedName
        updateresponse = await ApiHelper.updatelocationbyID(token, customerId, locIDfromResp, updatedName, updatedDesc, status)
        expect(updateresponse.status).toBe(200);
        expect(updateresponse.data.statusCode).toBe(200);
        updateresponseresult = updateresponse.data.result
        expect(updateresponseresult.id).toBe(locIDfromResp);
        expect(updateresponseresult.name).toBe(updatedName);
        expect(updateresponseresult.description).toBe(updatedDesc);

        //Check the update in the location list
        response = await ApiHelper.getlocationList(token, customerId)
        var responseData = response.data;
        expect(response.status).toBe(200);
        var responseResult = responseData.result;
        var flagarray = await ApiHelper.validateUpdatedlocation(responseResult, locIDfromResp, updatedName, updatedDesc)
        expect(flagarray).not.toContain(false);

        //delete created location
        expect((await ApiHelper.deletelocationByID(token, customerId, locIDfromResp)).status).toBe(200);

    });

    // US#353676
    test("API - L1 user should Not be able to update the Location Details with invalid parameters @353676", async function () {
        var locName = "AutoLoc-L1Post-Loc" + await ApiHelper.createlocname(4)
        var locDesc = "This is the location: " + locName
        var status = "active"
        updatedName = "Update-" + await ApiHelper.createlocname(5)
        updatedDesc = "Updated location is: " + updatedName

        // create location 
        var postresponse = await ApiHelper.postlocationList(token, customerId, locName, locDesc, status)
        expect(postresponse.status).toBe(200);
        var locIDfromResp = postresponse.data.result.id;

        var postresponse2 = await ApiHelper.postlocationList(token, "5985", locName, locDesc, status)
        expect(postresponse2.status).toBe(200);
        var locIDfromResp2 = postresponse2.data.result.id;


        //Update location invalid customer ID
        updateresponse = await ApiHelper.updatelocationbyID(token, "invalidcust234", locIDfromResp, updatedName, updatedDesc, status)
        expect(updateresponse.status).toBe(400);
        updateresponsedata = updateresponse.data
        expect(updateresponsedata.errorMessage).toBe(ErrorMSG.ErrorMsg_3)
        expect(updateresponsedata.success).toBe(false);
        expect(updateresponsedata.statusCode).toBe(400);
        expect(updateresponsedata.result).toBe(null);
        expect(updateresponsedata.errorCode).toBe(3);

        //Update location with different valid customer ID
        updateresponse = await ApiHelper.updatelocationbyID(token, "5985", locIDfromResp, updatedName, updatedDesc, status)
        expect(updateresponse.status).toBe(400);
        updateresponsedata = updateresponse.data
        expect(updateresponsedata.errorMessage).toBe(ErrorMSG.ErrorMsg_4033)
        expect(updateresponsedata.success).toBe(false);
        expect(updateresponsedata.statusCode).toBe(400);
        expect(updateresponsedata.errorCode).toBe(4033);

        //Update location for different valid customer ID
        updateresponse = await ApiHelper.updatelocationbyID(token, customerId, locIDfromResp2, updatedName, updatedDesc, status)
        expect(updateresponse.status).toBe(400);
        updateresponsedata = updateresponse.data
        expect(updateresponsedata.errorMessage).toBe(ErrorMSG.ErrorMsg_4033)
        expect(updateresponsedata.success).toBe(false);
        expect(updateresponsedata.statusCode).toBe(400);
        expect(updateresponsedata.errorCode).toBe(4033);

        //Update location invalid location ID
        updateresponse = await ApiHelper.updatelocationbyID(token, customerId, "46543675gf", updatedName, updatedDesc, status)
        expect(updateresponse.status).toBe(400);
        updateresponsedata = updateresponse.data
        expect(updateresponsedata.errorMessage).toBe(ErrorMSG.ErrorMsg_4033)
        expect(updateresponsedata.success).toBe(false);
        expect(updateresponsedata.statusCode).toBe(400);
        expect(updateresponsedata.result).toBe(null);
        expect(updateresponsedata.errorCode).toBe(4033);

        //Update location name>50 character
        let locname51char = "AutoLoc-L1Post-Loc" + await ApiHelper.createlocname(43)
        updateresponse = await ApiHelper.updatelocationbyID(token, customerId, locIDfromResp, locname51char, updatedDesc, status)
        expect(updateresponse.status).toBe(400); updateresponsedata = updateresponse.data
        expect(updateresponsedata.errorMessage).toBe(ErrorMSG.ErrorMsg_4027)
        expect(updateresponsedata.success).toBe(false);
        expect(updateresponsedata.statusCode).toBe(400);
        expect(updateresponsedata.result).toBe(null);
        expect(updateresponsedata.errorCode).toBe(4027);

        //Update location Description>255 character
        let locDescgrtr255char = "Description: " + await ApiHelper.createlocname(255)
        updateresponse = await ApiHelper.updatelocationbyID(token, customerId, locIDfromResp, updatedName, locDescgrtr255char, status)
        expect(updateresponse.status).toBe(400);
        updateresponsedata = updateresponse.data
        expect(updateresponsedata.errorMessage).toBe(ErrorMSG.ErrorMsg_4031)
        expect(updateresponsedata.success).toBe(false);
        expect(updateresponsedata.statusCode).toBe(400);
        expect(updateresponsedata.result).toBe(null);
        expect(updateresponsedata.errorCode).toBe(4031);

        //Update location with invalid status
        var invstatus = "AcTiVe"
        updateresponse = await ApiHelper.updatelocationbyID(token, customerId, locIDfromResp, updatedName, updatedDesc, invstatus)
        expect(updateresponse.status).toBe(400);
        updateresponsedata = updateresponse.data
        expect(updateresponsedata.errorMessage).toBe(ErrorMSG.ErrorMsg_4032)
        expect(updateresponsedata.success).toBe(false);
        expect(updateresponsedata.statusCode).toBe(400);
        expect(updateresponsedata.result).toBe(null);
        expect(updateresponsedata.errorCode).toBe(4032);

        //delete created location
        expect((await ApiHelper.deletelocationByID(token, customerId, locIDfromResp)).status).toBe(200);
        expect((await ApiHelper.deletelocationByID(token, "5985", locIDfromResp2)).status).toBe(200);

    });

    test.afterAll(async function () {       
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        await ApiHelper.deleteAll_AutomationDeviceLocations(token, customerId);
    });

});