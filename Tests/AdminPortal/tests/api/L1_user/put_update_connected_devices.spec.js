const { IotHubMethods } = require('../../../utils/iothub_methods.js');
const { TokenGenerators } = require('../../../utils/token_generators.js');
const { Comparisions } = require('../../../utils/comparisions.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
let OR = require('../../../resources/OR.json');
let ErrorMSG = require('../../../resources/ErrorMSG.json');
let { ApiHelper } = require('../../../helpers/api-helpers.js')

const apimAddConnectedDevicesUrl = process.env.apimBaseURL + OR.APIUrls.addConnectedDevicesUrl;
const apimUpdateConnectedDevicesUrl = process.env.apimBaseURL + OR.APIUrls.updateConnectedDevicesUrl;
const apimDeleteConnectedDevicesUrl = process.env.apimBaseURL + OR.APIUrls.connectedDevicesUrl;
const apimConnectDevicesUrl = process.env.apimBaseURL + OR.APIUrls.connectedDevicesUrl;
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih"
const iothubResourceUri = iothub + '.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'
let sastoken, deviceId, token, conn, globalUid, globalAet, locIDfromResp, customerId, customer, customerDetailsId, customerDetailsRecordSet;
let testDevice = process.env.serviceUserHypervDeviceId;
test.describe("Update Connected Devices API for L1 user", function () {
    test.beforeAll(async function () {
        // test data preparation     
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
        var locName = "AutoLoc-L1Put-Device" + await ApiHelper.createlocname(4)
        var locDesc = "This is the location: " + locName
        var status = "active"
        var postresponse = await ApiHelper.postlocationList(token, customerId, locName, locDesc, status)
        expect(postresponse.status).toBe(200);
        locIDfromResp = postresponse.data.result.id;
        //Create a connected devices
        globalUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        globalAet = globalUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '101', 'iol10101.customer.internal.com', 'AutDevic10101', globalUid, locIDfromResp, '10101', 'OPT: Ophthalmic Tomography', 1, globalAet, localSerialNumber, '04049539104410 (CALLISTO eye)',);
        expect(response.status).toBe(200);
    });

    //US#74509
    test("L1 user should successfully update an existing device with all the parameters @74509", async function () {
        //api request
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.updateDevice("DICOM", token, deviceId, '1011', 'iol10101upd.customer.internal.com', 'AutDevic10101Updt', globalUid, locIDfromResp, '10101Updt', 'OPM: Ophthalmic Mapping', 0, globalAet, localSerialNumber, '04049539104410 (Carl Zeiss Meditec)',);
        let areEqual = new Array(), expectedJSON, iothubJSON;
        expect(response.status).toBe(200);
        await TestData.waitFortimeOut(20000);
        let iothubResponse = await IotHubMethods.getModuleTwin(iothub, deviceId, "dicomforwardermodule", sastoken);
        let iotHubConnectedDevices = iothubResponse.data[0].properties.desired.connectedDevices
        expectedJSON = {
            "port": "1011",
            "ip": "iol10101upd.customer.internal.com",
            "name": "AutDevic10101Updt",
            "uid": globalUid,
            "acuid": "10101Updt",
            "modality": "OPM: Ophthalmic Mapping",
            "whitelisted": 0,
            "sgc": locIDfromResp,
            "aet": globalAet,
            "sn": localSerialNumber,
            "di": "04049539104410"
        }
        if (iotHubConnectedDevices.hasOwnProperty(globalUid)) {
            iothubJSON = iotHubConnectedDevices[globalUid];

            expect(iothubJSON.fid).not.toBeNull();
            expect(iothubJSON.snc).not.toBeNull();
            expect(iothubJSON.di).not.toBeNull();

            delete iothubJSON.fid;
            delete iothubJSON.snc;
            delete iothubJSON.di;

            areEqual.push(Comparisions.compareUnorderedJSONObjects(iothubJSON, expectedJSON));
        } else {
            areEqual.push(false)
        }
        expect(areEqual).not.toContain(false)

    });

    //US#233023
    test("DeleteDevice_L1 user should successfully delete the existing device @233023", async function () {
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        //api request
        let localSerialNumber = await TestData.generateSerialNumber();
        let createresponse = await ApiHelper.addDevice("DICOM", token, testDevice, '1011', '100.customer.internal.com', 'AutDevic104455', localUid, locIDfromResp, '636414444', 'OPM: Ophthalmic Mapping', 0, localAet, localSerialNumber, '04049539104410 (Carl Zeiss Meditec)',);

        expect(createresponse.status).toBe(200);
        let newResponse = await ApiHelper.deleteDevice("DICOM", token, deviceId, localUid);
        expect(newResponse.status).toBe(200);

    });
    //US#230859 
    test("DeleteAPI_Through API, L1 user should be able to test the connection status of a connectedDevice successfully @230859", async function () {
        //api request
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        let createresponse = await ApiHelper.addDevice("DICOM", token, deviceId, '11113', '127.0.0.1', 'CALLISTOEYE', localUid, locIDfromResp, '191929', 'OPM: Ophthalmic Mapping', 1, localAet, localSerialNumber, '04049539104410 (CALLISTO eye)',);

        expect(createresponse.status).toBe(200);
        let response = await ApiHelper.getConnectedDevices(token, deviceId);

        expect(response.status).toBe(200);
        let delResponse = await ApiHelper.deleteDevice("DICOM", token, deviceId, localUid);
        expect(delResponse.status).toBe(200);

    });

    //US#230859 
    test("Through API, L1 user should see failed as connection status of a connectedDevice of disconnected CM VM @230859", async function () {
        //api request
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        let createresponse = await ApiHelper.addDevice("DICOM", token, deviceId, '11111', 'localhost.host', 'ConnectDevice1919', localUid, locIDfromResp, '191929', 'OPM: Ophthalmic Mapping', 1, localAet, localSerialNumber, '04049539104410 (CALLISTO eye)',);
        expect(createresponse.status).toBe(200);
        let connectionStatusResponse = await ApiHelper.getDevice(token, deviceId);
        expect(connectionStatusResponse.status).toBe(200);
        //expect(connectionStatusResponse.data.statusCode).toBe(200);      
        let delResponse = await ApiHelper.getDevice(token, deviceId, localUid);
        expect(delResponse.status).toBe(200);
    });
    //US#74509
    test("L1 user should not update device if the aet value matches with an existing connected device aet value @74509", async function () {
        //api request
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        let postResponse = await ApiHelper.addDevice("DICOM", token, deviceId, '101', 'iol10101.customer.internal.com', 'AutDevic10101', localUid, locIDfromResp, '10101', 'OPT: Ophthalmic Tomography', 1, localAet, localSerialNumber, '04049539104410 (CALLISTO eye)',);
        expect(postResponse.status).toBe(200);
        let response = await ApiHelper.updateDevice("DICOM", token, deviceId, '1011', 'iol10101upd.customer.internal.com', 'AutDevic10101Updt', globalUid, locIDfromResp, '10101Updt', 'OPM: Ophthalmic Mapping', 0, localAet, localSerialNumber, '04049539104410 (Carl Zeiss Meditec)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4002);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4002);


    });

    //US#74509
    test("L1 user should successfully update an exisiting device with only mandatory parameters @74509", async function () {
        let localSerialNumber = await TestData.generateSerialNumber();
        //api request
        let response = await ApiHelper.updateDevice("DICOM", token, deviceId, '10111', 'iol10101upd1.customer.internal.com', 'Aut10101Updt1', globalUid, locIDfromResp, '', 'US: Ultrasound', 0, globalAet, localSerialNumber, '04049471092080 (IOLMaster 700)',);
        expect(response.status).toBe(200);
    });

    //US#74509
    test("L1 user should not update existing device when required parameter - uid is missing @74509", async function () {
        let localSerialNumber = await TestData.generateSerialNumber();
        //api request
        let response = await ApiHelper.updateDevice("DICOM", token, deviceId, '10112', 'iol10101upd2.customer.internal.com', 'Aut10101Updt2', '', locIDfromResp, '10101Updt2', 'OPT: Ophthalmic Tomography', 1, globalAet, localSerialNumber, '04049471092080 (IOLMaster 700)',);

        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4020);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4020);



    });

    //US#74509
    test("L1 user should not update existing device when required parameter - port is missing @74509", async function () {
        let localSerialNumber = await TestData.generateSerialNumber();
        //api request
        let response = await ApiHelper.updateDevice("DICOM", token, deviceId, '', 'iol10101upd2.customer.internal.com', 'Aut10101Updt2', globalUid, locIDfromResp, '10101Updt2', 'OPT: Ophthalmic Tomography', 1, globalAet, localSerialNumber, '04049471092080 (IOLMaster 700)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4017);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4017);


    });

    //US#74509
    test("L1 user should not update existing device when required parameter - ip is missing @74509", async function () {
        let localSerialNumber = await TestData.generateSerialNumber();
        //api request
        let response = await ApiHelper.updateDevice("DICOM", token, deviceId, '10111', '', 'Aut10101Updt2', globalUid, locIDfromResp, '10101Updt2', 'OPT: Ophthalmic Tomography', 1, globalAet, localSerialNumber, '04049471092080 (IOLMaster 700)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4019);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4019);


    });

    //US#74509
    test("L1 user should not update existing device when required parameter - name is missing @74509", async function () {
        let localSerialNumber = await TestData.generateSerialNumber();
        //api request
        let response = await ApiHelper.updateDevice("DICOM", token, deviceId, '10111', 'iol10101upd2.customer.internal.com', '', globalUid, locIDfromResp, '10101Updt2', 'OPT: Ophthalmic Tomography', 1, globalAet, localSerialNumber, '04049471092080 (IOLMaster 700)',);

        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4010);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4010);


    });

    //US#74509
    test("L1 user should not update existing device when required parameter - aet is missing @74509", async function () {
        let localSerialNumber = await TestData.generateSerialNumber();
        //api request
        let response = await ApiHelper.updateDevice("DICOM", token, deviceId, '10111', 'iol10101.customer.internal.com', 'Aut10101Updt2', globalUid, locIDfromResp, '10101Updt2', 'OPT: Ophthalmic Tomography', 1, '', localSerialNumber, '04049471092080 (IOLMaster 700)',);

        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4014);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4014);


    });

    //US#74509
    test("L1 user should not update existing device when deviceId is missing @74509", async function () {
        let localSerialNumber = await TestData.generateSerialNumber();
        //api request
        let requestBody = {
            "port": "10111",
            "ip": "iol10101Upd2.customer.internal.com",
            "name": "Aut10101Updt2",
            "uid": globalUid,
            "acuid": "10101Updt2",
            "modality": "OPT",
            "whitelisted": 1,
            "aet": globalAet,
            "sgc": locIDfromResp,
            "type": {
                "name": "IOLMaster 700",
                "identifier": "04049471092080",
                "manufacturer": "Carl Zeiss Meditec",
                "type": ""
            },
            "serial": localSerialNumber
        }
        let config = {
            method: 'put',
            url: apimUpdateConnectedDevicesUrl + "/" + " " + "/connected-devices",
            headers: { "Authorization": "Bearer " + token },
            data: requestBody
        };

        let response = await TokenGenerators.request(config);
        expect(response.status).toBe(400);
    });

    //US#74509
    test("L1 user should not update existing device when deviceId is empty @74509", async function () {
        let localSerialNumber = await TestData.generateSerialNumber();
        //api request
        let response = await ApiHelper.updateDevice("DICOM", token, ' ', '10111', 'iol10101Upd2.customer.internal.com', 'Aut10101Updt2', globalUid, locIDfromResp, '10101Updt2', 'OPT: Ophthalmic Tomography', 1, globalAet, localSerialNumber, '04049471092080 (IOLMaster 700)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4);

    });

    //US#74509
    test("L1 user should not update a new device when deviceId is a non-existant Id @74509", async function () {
        let localSerialNumber = await TestData.generateSerialNumber();
        //api request
        let response = await ApiHelper.updateDevice("DICOM", token, '12345', '10111', 'iol10101Upd2.customer.internal.com', 'Aut10101Updt2', globalUid, locIDfromResp, '10101Updt2', 'OPT: Ophthalmic Tomography', 1, globalAet, localSerialNumber, '04049471092080 (IOLMaster 700)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(1);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_1);
    });

    //US#74509
    test("L1 user should not update existing device when aet is already an existing value - check case insensitive for aet value @74509", async function () {
        //api request
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        globalAet = globalAet.toLowerCase();
        let localSerialNumber = await TestData.generateSerialNumber();
        let addresponse = await ApiHelper.addDevice("DICOM", token, deviceId, '101', 'iol10101.customer.internal.com', 'AutDevic10101', localUid, locIDfromResp, '10101', 'OPT: Ophthalmic Tomography', 1, localAet, localSerialNumber, '04049539104410 (CALLISTO eye)',);
        expect(addresponse.status).toBe(200);
        let response = await ApiHelper.updateDevice("DICOM", token, deviceId, '10111', 'iol10101upd2.customer.internal.com', 'Aut10101Updt2', localUid, locIDfromResp, '10101Updt2', 'OPT: Ophthalmic Tomography', 1, globalAet, localSerialNumber, '04049471092080 (IOLMaster 700)',);

        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4002);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4002);


    });

    //US#74509
    test("L1 user should not update existing device when the length of aet value is greater than 16 @74509", async function () {
        let localSerialNumber = await TestData.generateSerialNumber();
        //api request
        let localAet = "Aut879824365872659873284983275";
        let response = await ApiHelper.updateDevice("DICOM", token, deviceId, '10111', 'iol10101.customer.internal.com', 'Aut10101Updt1', globalUid, locIDfromResp, '10101Updt2', 'OPT: Ophthalmic Tomography', 1, localAet, localSerialNumber, '04049471092080 (IOLMaster 700)',);

        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4016);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4016);

    });

    //US#74509
    // UID is a unique value and cannot be updated
    test("L1 user should not successfully update existing device - check case insensitive for uid value @74509", async function () {
        let localSerialNumber = await TestData.generateSerialNumber();
        //api request

        let uid = globalUid.toLowerCase()
        let response = await ApiHelper.updateDevice("DICOM", token, deviceId, '10111', 'iol10101upd2.customer.internal.com', 'AutDevic10102Updt', uid, locIDfromResp, "45657", 'OPT: Ophthalmic Tomography', 1, globalAet, localSerialNumber, '04049471092080 (IOLMaster 700)',);

        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(6);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_6);


    });

    //US#74509
    test("L1 user should not update device when the required field - modality is missing @74509", async function () {
        let localSerialNumber = await TestData.generateSerialNumber();
        //api request let response = await ApiHelper.updateDevice("DICOM", token, deviceId, '10111', 'iol10101Upd2.customer.internal.com', 'AutDevic10102Updt',uid, uid,'OPT: Ophthalmic Tomography', 1,'Aut10102', '11111','04049471092080 (IOLMaster 700)',);
        let response = await ApiHelper.updateDevice("DICOM", token, deviceId, '10111', 'iol10101.customer.internal.com', 'Aut10101Updt1', globalUid, locIDfromResp, '10101Updt2', '', 1, globalAet, localSerialNumber, '04049471092080 (IOLMaster 700)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4013);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4013);
    });
    //US#74509
    test("L1 user should not update device when port is not a number @74509", async function () {
        let localSerialNumber = await TestData.generateSerialNumber();
        //api request
        let response = await ApiHelper.updateDevice("DICOM", token, deviceId, 'p-8080', 'iol10101.customer.internal.com', 'Aut10101Updt1', globalUid, locIDfromResp, '10101Updt2', 'US: Ultrasound', 1, globalAet, localSerialNumber, '04049471092080 (IOLMaster 700)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4018);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4018);
    });

    //US#74509
    test("L1 user should not update device when port number is outside the range 0-65535 @74509", async function () {
        let localSerialNumber = await TestData.generateSerialNumber();
        //api request
        let response = await ApiHelper.updateDevice("DICOM", token, deviceId, '-1', 'iol10101Upd2.customer.internal.com', 'Aut10101Updt1', globalUid, locIDfromResp, '10101Updt2', 'US: Ultrasound', 1, globalAet, localSerialNumber, '04049471092080 (IOLMaster 700)',);
        expect(response.status).toBe(400);
        //api request
        let putResponse = await ApiHelper.updateDevice("DICOM", token, deviceId, '65536', 'iol10101.customer.internal.com', 'Aut10101Updt1', globalUid, locIDfromResp, '10101Updt2', 'US: Ultrasound', 1, globalAet, localSerialNumber, '04049471092080 (IOLMaster 700)',);
        expect(putResponse.status).toBe(400);
        expect(response.data.errorCode).toBe(4018);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4018);
    });

    //US#74509    
    test("L1 user should  update device when aet contains characters other than alphabets, number, hyphen @74509", async function () {
        //api requesta
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        let postResponse = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol10101upd2.customer.internal.com', 'Aut10101Updt1', localUid, locIDfromResp, '10101Updt2', 'US: Ultrasound', 1, localAet, localSerialNumber, '04049471092080 (IOLMaster 700)',);
        expect(postResponse.status).toBe(200);
        let response = await ApiHelper.updateDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10102Updt', localUid, locIDfromResp, '10102', 'US: Ultrasound', 1, localAet, localSerialNumber, '04049471092080 (IOLMaster 700)',);
        expect(response.status).toBe(200);
        await TestData.waitFortimeOut(20000);
        let iothubResponse = await IotHubMethods.getModuleTwin(iothub, deviceId, "dicomforwardermodule", sastoken);

        let iotHubConnectedDevices = iothubResponse.data[0].properties.desired.connectedDevices

        let expectedJSON = {
            "port": "1019",
            "ip": "iol1.customer.internal.com",
            "name": "AutDevic10102Updt",
            "uid": localUid,
            "acuid": "10102",
            "modality": "US: Ultrasound",
            "whitelisted": 1,
            "aet": localAet,
            "sn": localSerialNumber,
            "di": "04049471092080"
        }
        let areEqual = new Array();

        if (iotHubConnectedDevices.hasOwnProperty(localUid)) {
            let iothubJSON = iotHubConnectedDevices[localUid];
            expect(iothubJSON.fid).not.toBeNull();
            expect(iothubJSON.snc).not.toBeNull();
            expect(iothubJSON.sgc).not.toBeNull();
            expect(iothubJSON.di).not.toBeNull();

            delete iothubJSON.dt;
            delete iothubJSON.fid;
            delete iothubJSON.snc;
            areEqual.push(await Comparisions.compareUnorderedJSONObjects(iothubJSON, expectedJSON));
        } else {
            areEqual.push(false)
        }
        expect(areEqual).not.toContain(false)

    });


    //US#74509
    test("L1 user should NOT update device when aet contains special characters \ @74509 ", async function () {
        //api request
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.updateDevice("DICOM", token, deviceId, '1019', 'iol10101Upd2.customer.internal.com', 'AutDevic10102Updt', globalUid, locIDfromResp, '10102', 'US: Ultrasound', 1, 'Spl\\02', localSerialNumber, '04049471092080 (IOLMaster 700)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(0);
        expect(response.data.errorMessage).toBe(ErrorMSG.InvalidPayload);
    });

    //US#308070
    test("L1 user should not update device when serial number contains more than 14 characters @308070", async function () {
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.updateDevice("DICOM", token, deviceId, '1019', 'iol10101upd2.customer.internal.com', 'AutDevic10102Updt', globalUid, locIDfromResp, '10102', 'US: Ultrasound', 1, globalAet, '1111111111111111111111111111111', '04049471092080 (IOLMaster 700)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4009);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4009);
    })

    //US#308070
    test("L1 user should not update device when manually entered DI contains more than 14 characters @308070", async function () {
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.updateDevice("DICOM", token, deviceId, '1019', 'iol10101upd2.customer.internal.com', 'AutDevic10102Updt', globalUid, locIDfromResp, '10102', 'US: Ultrasound', 1, globalAet, localSerialNumber, '0404947109208043rfgdfgdrt (IOLMaster 700)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4008);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4008);
    })

    //US#308070
    test("L1 user should not update device when mandatory parameter serial number is missing @308070", async function () {
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.updateDevice("DICOM", token, deviceId, '1019', 'iol10101upd2.customer.internal.com', 'AutDevic10102Updt', globalUid, locIDfromResp, '10102', 'US: Ultrasound', 1, globalAet, '', '040494710 (IOLMaster 700)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4004);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4004);
    })

    //US#308070
    test("L1 user should not update device when mandatory parameter device identifier is missing @308070", async function () {
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.updateDevice("DICOM", token, deviceId, '1019', 'iol10101upd2.customer.internal.com', 'AutDevic10102Updt', globalUid, locIDfromResp, '10102', 'US: Ultrasound', 1, globalAet, localSerialNumber, ' (IOLMaster 700)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4005);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4005);
    })

    //US#308070 US#310324
    test("L1 user should not update device when IP is invalid @308070 @380235 @381818", async function () {
        let localSerialNumber = await TestData.generateSerialNumber();
        //api request
        var ipadd = ['1.11...11..11...', '299.299.299.299', '5555..5555', '0000.0000.0000.0000', '111..rr..1111..', '00.0.000.0000', '0000.234.45.0000',]
        for (var k = 0; k < ipadd.length; k++) {
            console.log("port number is: " + ipadd[k]);
            let response = await ApiHelper.updateDevice("DICOM", token, deviceId, '1019', ipadd[k], 'Aut10101Updt1', globalUid, locIDfromResp, '10101Updt2', 'US: Ultrasound', 1, globalAet, localSerialNumber, '04049471092080 (IOLMaster 700)',);
            expect(response.status).toBe(400);
            expect(response.data.errorCode).toBe(4026);
            expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4026);
        }

    });

    //US#74509
    test("L1 user should update device when uid is a non-existant uid @74509", async function () {
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '121', 'newdevice.customer.internal.com', 'NewDevice', localUid, locIDfromResp, '10101', 'OPT: Ophthalmic Tomography', 1, localAet, localSerialNumber, '04049539104410 (CALLISTO eye)',);

        expect(response.status).toBe(200);
        let nextResponse = await ApiHelper.updateDevice("DICOM", token, deviceId, '121', 'newdevice.customer.internal.com', 'NewDevice', "localUi#@***d", locIDfromResp, '10101', 'OPT: Ophthalmic Tomography', 1, localAet, localSerialNumber, '04049539104410 (CALLISTO eye)',);
        expect(nextResponse.status).toBe(400);
        expect(nextResponse.data.errorCode).toBe(4002);

    });

    //US#353696
    test("L1 user should not update a device when required parameter - sgc is empty @353696", async function () {
        let localSerialNumber = await TestData.generateSerialNumber();
        //api request
        let response = await ApiHelper.updateDevice("DICOM", token, deviceId, '101', 'iol10101.customer.internal.com', 'AutDevic10101', globalUid, " ", '10101', 'OPT: Ophthalmic Tomography', 1, globalAet, localSerialNumber, '04049539104410 (CALLISTO eye)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4034);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4034_1);
    });

    //US#353696
    test("L1 user should not update a device when required parameter - sgc is less than 36 character @353696", async function () {
        //api request
        let localSerialNumber = await TestData.generateSerialNumber();
        var locIDless36char = await ApiHelper.createlocname(35)
        let response = await ApiHelper.updateDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic1010', globalUid, locIDless36char, '10111', 'US: Ultrasound', 1, globalAet, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4041);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4041);
    });

    //US#353696
    test("L1 user should not update a device when required parameter - sgc is > 36 characters @353696", async function () {
        //api request
        let localSerialNumber = await TestData.generateSerialNumber();
        var locIDgrtr36char = await ApiHelper.createlocname(37)
        let response = await ApiHelper.updateDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic1010', globalUid, locIDgrtr36char, '10111', 'US: Ultrasound', 1, globalAet, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4042);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4042);
    });

    //US#353696
    test("L1 user should not update a device when required parameter - sgc is from different customerID @353696", async function () {

        // create location-->
        var locName = "AutoLoc-L1Put-Device" + await ApiHelper.createlocname(4)
        var locDesc = "This is the location: " + locName
        var status = "active"
        var postresponse = await ApiHelper.postlocationList(token, "5985", locName, locDesc, status)
        expect(postresponse.status).toBe(200);
        var locIDfromResp2 = postresponse.data.result.id;
        let localSerialNumber = await TestData.generateSerialNumber();
        globalUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let addResponse = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic1010', globalUid, locIDfromResp, globalUid, 'US: Ultrasound', 1, globalUid, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(addResponse.status).toBe(200);
        //api request
        let response = await ApiHelper.updateDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic1010', globalUid, locIDfromResp2, globalUid, 'US: Ultrasound', 1, globalUid, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4047);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4047);
    });

    //US#392137
    test("L1 user should not update device when DI and Serial no are not unique @392137", async function () {
        //api request
        let actualData = JSON.parse("[{\"identifier\":\"04049539102423\",\"name\":\"CALLISTO eye 3.2.1 model I\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049539069092\",\"name\":\"CALLISTO eye 3.5.1 model I\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049539103512\",\"name\":\"CALLISTO eye model II\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049539069214\",\"name\":\"CALLISTO eye model III\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049471092080\",\"name\":\"IOLMaster 700\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049471092066\",\"name\":\"IOLMaster 500\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748081118\",\"name\":\"ATLAS 9000\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04250668606731\",\"name\":\"VISUSCREEN 100\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04250668606724\",\"name\":\"VISUSCREEN 500\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049471097139\",\"name\":\"VISUREF 150\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748087080\",\"name\":\"CIRRUS 5000\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748087097\",\"name\":\"CIRRUS 500\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748087141\",\"name\":\"CIRRUS 6000\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"\",\"name\":\"Others\",\"manufacturer\":\"Unknown\",\"type\":null}]");
        for (let i = 0; i < actualData.length - 1; i++) {
            let localUid = await TestData.generateUIDforDevice();
            let localAet = localUid;
            let localSerialNumber = await TestData.generateSerialNumber();
            let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol10101.customer.internal.com', 'AutDevic10101', localUid, locIDfromResp, '10101', 'OPT: Ophthalmic Tomography', 1, localAet, localSerialNumber, actualData[i].identifier + '(' + actualData[i].manufacturer + ')',);
            expect(response.status).toBe(200);
            let newlocalSerialNumber = await TestData.generateSerialNumber();
            let newlocalUid = await TestData.generateUIDforDevice();
            let newlocalAet = newlocalUid;
            let response2 = await ApiHelper.addDevice("DICOM", token, deviceId, '101', 'iol10101.customer.internal.com', 'AutDevic10101', newlocalUid, locIDfromResp, '10101', 'OPT: Ophthalmic Tomography', 1, newlocalAet, newlocalSerialNumber, actualData[i].identifier + '(' + actualData[i].manufacturer + ')',);
            expect(response2.status).toBe(200);
            // Update the added device with similar serial no and DI which was added in the  beforeAll  method
            await ApiHelper.updateisDiSnChangedFlag(true);
            let postresponse = await ApiHelper.updateDevice("DICOM", token, deviceId, '101', 'iol10101.customer.internal.com', 'AutDevic10101', newlocalUid, locIDfromResp, '10101', 'OPT: Ophthalmic Tomography', 1, newlocalAet, localSerialNumber, actualData[i].identifier + '(' + actualData[i].manufacturer + ')', '', true);
            expect(postresponse.status).toBe(400);
            expect(postresponse.data.errorCode).toBe(4053);
            expect(postresponse.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4053);

            await ApiHelper.updateisDiSnChangedFlag('Missit');
            let putresponse = await ApiHelper.updateDevice("DICOM", token, deviceId, '101', 'iol10101.customer.internal.com', 'AutDevic10101', newlocalUid, locIDfromResp, '10101', 'OPT: Ophthalmic Tomography', 1, newlocalAet, localSerialNumber, actualData[i].identifier + '(' + actualData[i].manufacturer + ')', '', true);
            expect(putresponse.status).toBe(400);
        }
    });
    test.afterAll(async function () {

        await ApiHelper.deleteAll_ActiveDevice(token, deviceId)
        await ApiHelper.deleteAll_InActiveDevice(token, deviceId)

        //Delete All Location --->
        await ApiHelper.deleteAll_AutomationDeviceLocations(token, customerId);
    });



});