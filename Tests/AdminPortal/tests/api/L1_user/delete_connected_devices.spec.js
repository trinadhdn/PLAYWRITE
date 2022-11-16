const { IotHubMethods } = require('../../../utils/iothub_methods.js');
const { TokenGenerators } = require('../../../utils/token_generators.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
let OR = require('../../../resources/OR.json');
let { ApiHelper } = require('../../../helpers/api-helpers.js')
let ErrorMSG = require('../../../resources/ErrorMSG.json');

const apimAddConnectedDevicesUrl = process.env.apimBaseURL + OR.APIUrls.addConnectedDevicesUrl;
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih"
const iothubResourceUri = iothub + '.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'
let sastoken, deviceId, token, conn,locIDfromResp,customerDetailsId,customerDetailsRecordSet,customerId,customer;
let testDevice = process.env.serviceUserHypervDeviceId
test.describe("Delete Connected Devices API for L1 user", function () {
    test.beforeAll(async function () {
        sastoken = await TokenGenerators.generateSasToken(iothubResourceUri, iothubPolicyKey, iothubPolicy, 30)

        conn = await TestData.sqlDBConnection();
        let devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where iotdeviceId = '" + testDevice + "' for json auto")
        let deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
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


    })

    //US#307793
    test("API L1user should be able to delete the device and then device should be deleted from FHIR service as well as module twin @307793", async function () {

        let globalUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let globalAet = globalUid;
        console.log(globalUid);
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, "1010", "iol1.customer.internal.com", "AutDevic10150", globalUid, locIDfromResp,"10105", "OPT: Ophthalmic Tomography", 1, globalAet, localSerialNumber, "04049539104410(CALLISTO eye)",)
       
        expect(response.status).toBe(200);

        let deleteResponse = await ApiHelper.deleteDevice("DICOM", token, deviceId, globalUid)
        expect(deleteResponse.status).toBe(200);
        await TestData.waitFortimeOut(5000);

        let iothubResponse = await IotHubMethods.getModuleTwin(iothub, deviceId, "dicomforwardermodule", sastoken);
        let iotHubConnectedDevices2 = iothubResponse.data[0].properties.desired.connectedDevices ? true : false;
        if (iotHubConnectedDevices2) {
            iotHubConnectedDevices2 = iothubResponse.data[0].properties.desired.connectedDevices.hasOwnProperty(globalUid);
        }
        expect(iotHubConnectedDevices2).toBe(false);

    })
    //US#307793
    test("With L1 user_API Should throw error when deviceID is missing or invalid / validating different error codes@307793", async function () {

        let globalUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let globalAet = globalUid;
        console.log(globalUid);
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, "1010", "iol1.customer.internal.com", "AutDevic10150", globalUid, locIDfromResp,"10105", "OPT: Ophthalmic Tomography", 1, globalAet,localSerialNumber, "04049539104410(CALLISTO eye)",)

        expect(response.status).toBe(200);

        let deleteinvalidResponse = await ApiHelper.deleteDevice("DICOM", token, "invalid", globalUid)
        expect(deleteinvalidResponse.status).toBe(400);
        expect(deleteinvalidResponse.data.errorMessage).toBe(ErrorMSG.ErrorMsg_1);
        expect(deleteinvalidResponse.data.errorCode).toBe(1);



        let deleteResponse = await ApiHelper.deleteDevice("DICOM", token, " ", globalUid)
        expect(deleteResponse.status).toBe(400);  

        let deleteLatestResponse = await ApiHelper.deleteDevice("DICOM", token, deviceId, globalUid)
        expect(deleteLatestResponse.status).toBe(200);

        await TestData.waitFortimeOut(5000);

        let iothubResponse = await IotHubMethods.getModuleTwin(iothub, deviceId, "dicomforwardermodule", sastoken);
        let iotHubConnectedDevices2 = iothubResponse.data[0].properties.desired.connectedDevices ? true : false;
        if (iotHubConnectedDevices2) {
            iotHubConnectedDevices2 = iothubResponse.data[0].properties.desired.connectedDevices.hasOwnProperty(globalUid);
        }
        expect(iotHubConnectedDevices2).toBe(false);

    })
   

    test.afterAll(async function () {
        await ApiHelper.deleteAll_ActiveDevice(token, deviceId)
        await ApiHelper.deleteAll_InActiveDevice(token, deviceId)
        //Delete Location --->
        var resploc = await ApiHelper.deletelocationByID(token, customerId, locIDfromResp)
        expect(resploc.status).toBe(200)
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        await ApiHelper.deleteAll_ActiveDevice(token, deviceId);
        await ApiHelper.deleteAll_AutomationDeviceLocations(token, customerId);
   

    });

})
