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
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih"
const iothubResourceUri = iothub + '.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'
let flag = false
let sastoken,customer,customerId, deviceId, token, conn, locIDfromResp, responsedel,customerDetailsId,customerDetailsRecordSet;
let testDevice = process.env.serviceUserHypervDeviceId
test.describe("Add Connected Devices API for L1 user", function () {
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
        var locName = "AutoLoc-L1Post-AddDevice" + await ApiHelper.createlocname(4)
        var locDesc = "This is the location: " + locName
        var status = "active"
        var postresponse = await ApiHelper.postlocationList(token, customerId, locName, locDesc, status)
        expect(postresponse.status).toBe(200);
        locIDfromResp = postresponse.data.result.id;
    });
    //US#74509 US#308070 US#307789 US#353696
    test("L1 user should successfully add a new device with all the parameters updated in module twin and added to FHIR service. @74509 @308070 @307789 @353696", async function () {
        //api request
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10101', localUid, locIDfromResp, '10101', 'OPT: Ophthalmic Tomography', 1, localAet, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        let areEqual = new Array(), iothubJSON;
        expect(response.status).toBe(200);
        responsedel = await ApiHelper.deleteDevice("DICOM", token, deviceId, localUid)
        expect(responsedel.status).toBe(200)

    });


    //US#124751 US#310324 US#307789 US#353696 US#353699
    test("L1 user should add a new device with all device Types @353696 @124751 @310324 @307789 @353699", async function () {

        //api request

        let actualData = JSON.parse("[{\"identifier\":\"04049539102423\",\"name\":\"CALLISTO eye 3.2.1 model I\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049539069092\",\"name\":\"CALLISTO eye 3.5.1 model I\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049539103512\",\"name\":\"CALLISTO eye model II\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049539069214\",\"name\":\"CALLISTO eye model III\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049471092080\",\"name\":\"IOLMaster 700\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049471092066\",\"name\":\"IOLMaster 500\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748081118\",\"name\":\"ATLAS 9000\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04250668606731\",\"name\":\"VISUSCREEN 100\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04250668606724\",\"name\":\"VISUSCREEN 500\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049471097139\",\"name\":\"VISUREF 150\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748087080\",\"name\":\"CIRRUS 5000\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748087097\",\"name\":\"CIRRUS 500\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748087141\",\"name\":\"CIRRUS 6000\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"\",\"name\":\"Others\",\"manufacturer\":\"Unknown\",\"type\":null}]");
        for (let i = 0; i < actualData.length - 1; i++) {
            let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
            let localAet = localUid;
            console.log("round:  " + i + "  localUid----> " + localUid + "  actualData: " + actualData[i].identifier)
            let localSerialNumber = await TestData.generateSerialNumber();
            let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10101', localUid, locIDfromResp, '10101', 'OPT: Ophthalmic Tomography', 1, localAet, localSerialNumber, actualData[i].identifier + '(' + actualData[i].manufacturer + ')',);
            let areEqual = new Array(), iothubJSON;
            expect(response.status).toBe(200);

            let responsedel = await ApiHelper.deleteDevice("DICOM", token, deviceId, localUid)
            expect(responsedel.status).toBe(200)

            console.log("round " + i + "  Passed")


        }
    });

    //US#74509 US#353696
    test("L1 user should not add a new device if the aet value matches with an existing connected device aet value @74509 @353696", async function () {
        //api request
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10101', localUid, locIDfromResp, '10101', 'OPT: Ophthalmic Tomography', 1, localAet, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(200);
        localSerialNumber = await TestData.generateSerialNumber();
        let nextRunresponse = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10101', localUid, locIDfromResp, '10101', 'OPT: Ophthalmic Tomography', 1, localAet, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(nextRunresponse.status).toBe(400);
        expect(nextRunresponse.data.errorCode).toBe(4002);
        expect(nextRunresponse.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4002);

        responsedel = await ApiHelper.deleteDevice("DICOM", token, deviceId, localUid)
        expect(responsedel.status).toBe(200)
    });

    //US#74509 US#353696
    test("L1 user should not add a new device if the uid value matches with an existing connected device uid value @74509 @353696", async function () {
        //api request
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '121', 'newdevice.customer.internal.com', 'NewDevice', localUid, locIDfromResp, '10101', 'OPT: Ophthalmic Tomography', 1, localAet, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        let areEqual = new Array(), expectedJSON, iothubJSON;
        expect(response.status).toBe(200);
        localSerialNumber = await TestData.generateSerialNumber();
        let newresponse = await ApiHelper.addDevice("DICOM", token, deviceId, '121', 'newdevice.customer.internal.com', 'NewDevice', localUid, locIDfromResp, '10101', 'OPT: Ophthalmic Tomography', 1, localAet, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(newresponse.status).toBe(400);
        expect(newresponse.data.errorCode).toBe(4002);
        expect(newresponse.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4002);
        responsedel = await ApiHelper.deleteDevice("DICOM", token, deviceId, localUid)
        expect(responsedel.status).toBe(200)


    });
    //US#74509 US#353696
    test("L1 user should successfully add a new device when only mandatory parameters @74509 @353696", async function () {
        //api request
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic1010', localUid, locIDfromResp, '10171', 'US: Ultrasound', 1, localAet, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        let areEqual = new Array(), expectedJSON, iothubJSON;
        expect(response.status).toBe(200);
        await TestData.waitFortimeOut(15000);
        let iothubResponse = await IotHubMethods.getModuleTwin(iothub, deviceId, "dicomforwardermodule", sastoken);
        let iotHubConnectedDevices = iothubResponse.data[0].properties.desired.connectedDevices
        expectedJSON = {
            "port": "1019",
            "ip": "iol1.customer.internal.com",
            "name": "AutDevic1010",
            "uid": localUid,
            "acuid": "10171",
            "aet": localAet,
            "modality": "US: Ultrasound",
            "sgc": locIDfromResp,
            "sn": "1",
            "di": "04049539102423",
            "st": "DICOM"

        }
        if (iotHubConnectedDevices.hasOwnProperty(localUid)) {
            iothubJSON = iotHubConnectedDevices[localUid];
            delete iothubJSON.fid;
            delete iothubJSON.snc;
            console.log('iothubJSON', iothubJSON);
            console.log('expectedJSON', expectedJSON);
            await areEqual.push(await Comparisions.compareUnorderedJSONObjects(iothubJSON, expectedJSON));
        } else {
            areEqual.push(false)
        }
        expect(areEqual[0]).not.toContain(false)
        responsedel = await ApiHelper.deleteDevice("DICOM", token, deviceId, localUid)
        expect(responsedel.status).toBe(200)

    });

    //US#74509 US#353696
    test("L1 user should not add a new device when required parameter - uid is missing @74509 @353696", async function () {
        //api request
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic1010', '', locIDfromResp, '10111', 'US: Ultrasound', 1, 'Aut10113', localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4020);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4020);
    });

    //US#74509 US#353696
    test("L1 user should not add a new device when required parameter - port is missing @74509 @353696", async function () {
        //api request

        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '', 'iol1.customer.internal.com', 'AutDevic1010', localUid, locIDfromResp, '10111', 'OPT: Ophthalmic Tomography', 1, localAet, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4017);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4017);

    });

    //US#74509 US#353696
    test("L1 user should not add a new device when required parameter - ip is missing @74509 @353696", async function () {
        //api request

        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', '', 'AutDevic10131', localUid, locIDfromResp, '10131', 'OPT: Ophthalmic Tomography', 1, localAet, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4019);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4019);

    });

    //US#74509 US#353696
    test("L1 user should not add a new device when required parameter - name is missing @74509 @353696", async function () {
        //api request
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', '', localUid, locIDfromResp, '10131', 'OPT: Ophthalmic Tomography', 1, localAet, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4010);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4010);

    });

    //US#74509 US#353696
    test("L1 user should not add a new device when required parameter - aet is missing @74509 @353696", async function () {
        //api request

        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10001', localUid, locIDfromResp, '10131', 'OPT: Ophthalmic Tomography', 1, '', localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4014);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4014);

    });

    //US#74509 US#353696
    test("L1 user should not add a new device when deviceId is missing @74509 @353696", async function () {
        //api request
       var requestBody = {
            "port": "1019",
            "ip": "iol1.customer.internal.com",
            "name": "AutDevic13301",
            "acuid": "13301",
            "uid": "636330108",
            "modality": "OPT",
            "whitelisted": 1,
            "aet": "Au330108",
            "sgc": locIDfromResp,
            "type": {
                "name": "CALLISTO eye 3.2.1 model I",
                "identifier": "04049539102423",
                "manufacturer": "Carl Zeiss Meditec",
                "type": ""
            },
            "serial": "1"
        }
        let config = {
            method: 'post',
            url: apimAddConnectedDevicesUrl + "/" + " " + "/connected-devices",
            headers: { "Authorization": "Bearer " + token },
            data: requestBody
        };

        let response = await TokenGenerators.request(config);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4);
    });

    //US#74509 US#353696
    test("L1 user should not add a new device when deviceId is empty @74509 @353696", async function () {
        let localSerialNumber = await TestData.generateSerialNumber();
        //api request
        let response = await ApiHelper.addDevice("DICOM", token, ' ', '1019', 'iol1.customer.internal.com', 'AutDevic10001', '636330108', locIDfromResp, '10131', 'OPT: Ophthalmic Tomography', 1, 'Au330108', localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4);
    });

    //US#74509 US#353696
    test("L1 user should not add a new device when deviceId is a non-existant Id @74509 @353696", async function () {
        //api request
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.addDevice("DICOM", token, 'randomdeviceId', '1019', 'iol1.customer.internal.com', 'AutDevic10001', '636330108', locIDfromResp, '10131', 'OPT: Ophthalmic Tomography', 1, 'Au330108',localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(1);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_1);
    });

    //US#74509 US#353696
    test("should throw error when aet is already an existing value - check case insensitive for aet value @74509 @353696", async function () {
        //api request

        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10001', localUid, locIDfromResp, '10131', 'OPT: Ophthalmic Tomography', 1, localAet, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(200);
        var localUid2 = localUid.toLowerCase();
        var localAet2 = localAet.toLowerCase();
        localSerialNumber = await TestData.generateSerialNumber();        
        let nextResponse = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10001', localUid2, locIDfromResp, '10131', 'OPT: Ophthalmic Tomography', 1, localAet2, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(nextResponse.status).toBe(400);
        expect(nextResponse.data.errorCode).toBe(4002);
        expect(nextResponse.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4002);

        responsedel = await ApiHelper.deleteDevice("DICOM", token, deviceId, localUid)
        expect(responsedel.status).toBe(200)
    });

    //US#74509 US#353696
    test("should throw error when the length of aet value is greater than 16 @74509 @353696", async function () {
        //api request
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10001', localUid, locIDfromResp, '10131', 'OPT: Ophthalmic Tomography', 1, 'Aet12345678901234', localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4016);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4016);

    });

    //US#74509 US#353696
    test("should throw error when uid is already an existing value - check case insensitive for uid value @74509 @353696", async function () {
        //api request

        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        let actuallocalUID = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'New device', localUid, locIDfromResp, '10143', 'OPT: Ophthalmic Tomography', 1, localAet, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(200);
        let areEqual = new Array(), expectedJSON, iothubJSON;
        let localUid2 = localUid.toLowerCase();
        let localAet2 = localAet.toLowerCase();
        localSerialNumber = await TestData.generateSerialNumber();
        let nextResponse = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'New device', localUid2, locIDfromResp, '10143', 'OPT: Ophthalmic Tomography', 1, localAet2, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(nextResponse.status).toBe(400);
        expect(nextResponse.data.errorCode).toBe(4002);
        expect(nextResponse.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4002);


        responsedel = await ApiHelper.deleteDevice("DICOM", token, deviceId, localUid)
        expect(responsedel.status).toBe(200)


    });

    //US#74509 US#353696
    test("L1 user should not add a new device when required parameter - modality is missing @74509 @353696", async function () {
        //api request
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10111', localUid, locIDfromResp, '70111', '', 1, localAet, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4013);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4013);


    });

    //US#124751 US#310324 US#353696
    test("L1 user should not add a new device with invalid IP @124751 @310324 @353696 @380235 @381818", async function () {
        //api request
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        var ipadd = ['iol10101UH.customer.i', '1.11...11..11...', '299.299.299.299', '5555..5555', '0000.0000.0000.0000', '111..rr..1111..', '0000.234.45.0000',]
        for (var k = 0; k < ipadd.length; k++) {
            let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', ipadd[k], 'AutDevic10131', localUid, locIDfromResp, '10131', 'OPT: Ophthalmic Tomography', 1, localAet, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
            expect(response.status).toBe(400);
            expect(response.data.errorCode).toBe(4026);
            expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4026);
        }
    });

    //US#74509 US#353696
    test("L1 user should not add a new device when port is not a number @74509 @353696", async function () {
        //api request
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, 'a-1019', 'iol1.customer.internal.com', 'AutDevic10111', localUid, locIDfromResp, '70111', 'OPT: Ophthalmic Tomography', 1, localAet, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4018);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4018);

    });

    //US#74509 US#353696
    test("L1 user should not add a new device when port number is outside the range 0-65535 @74509 @353696", async function () {
        //api request
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        let nextResponse = await ApiHelper.addDevice("DICOM", token, deviceId, '65536', 'iol1.customer.internal.com', 'AutDevic10111', localUid, locIDfromResp, '70111', 'OPT: Ophthalmic Tomography', 1, localAet, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(nextResponse.status).toBe(400);
        expect(nextResponse.data.errorCode).toBe(4001);
        expect(nextResponse.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4001);

       let newlocalUid = await TestData.generateUIDforDevice(deviceId, sastoken);
       let newlocalaet = newlocalUid;
        localSerialNumber = await TestData.generateSerialNumber();
        //api request
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '-1', 'iol1.customer.internal.com', 'AutDevic10111', localUid, locIDfromResp, '70111', 'OPT: Ophthalmic Tomography', 1, localAet, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4018);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4018);

    });

    //US#74509 US#353696
    test("L1 user should not add a new device when aet contains :// or \ or / or space() character @339940 @74509 @353696", async function () {
        let localSerialNumber = await TestData.generateSerialNumber();    
    //api request
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10111', localUid, locIDfromResp, '70111', 'OPT: Ophthalmic Tomography', 1, 'spl123\\12', localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(0);
        expect(response.data.errorMessage).toBe(ErrorMSG.InvalidPayload);
        localSerialNumber = await TestData.generateSerialNumber();
        let responseData = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10111', localUid, locIDfromResp, '70111', 'OPT: Ophthalmic Tomography', 1, 'https:\\spl12312', localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(responseData.status).toBe(400);
        expect(responseData.data.errorCode).toBe(0);
        expect(responseData.data.errorMessage).toBe(ErrorMSG.InvalidPayload);
        
        localSerialNumber = await TestData.generateSerialNumber();
        let responseData2 = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10111', localUid, locIDfromResp, '70111', 'OPT: Ophthalmic Tomography', 1, '//spl12312', localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(responseData2.status).toBe(400);
        expect(responseData2.data.errorCode).toBe(4015);
        expect(responseData2.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4015);
        
        localSerialNumber = await TestData.generateSerialNumber();
        let responseData3 = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10111', localUid, locIDfromResp, '70111', 'OPT: Ophthalmic Tomography', 1, ':\\spl12312', localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(responseData3.status).toBe(400);
        expect(responseData3.data.errorCode).toBe(0);
        expect(responseData3.data.errorMessage).toBe(ErrorMSG.InvalidPayload);

        localSerialNumber = await TestData.generateSerialNumber();
        let responseData4 = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10111', localUid, locIDfromResp, '70111', 'OPT: Ophthalmic Tomography', 1, '?%3f', localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(responseData4.status).toBe(200);
        let deleteresponseData = await ApiHelper.deleteDevice("DICOM", token, deviceId, localUid)
        expect(deleteresponseData.status).toBe(200);


    });

    //US#74509 US#353696 US#396918
    test("L1 user should not add a new device when UID contains :// or \ or / or space() character @339940 @74509 @353696", async function () {
        //api request
        let localAEID = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10111', 'spl123\\12', locIDfromResp, '70111', 'OPT: Ophthalmic Tomography', 1, localAEID, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(0);
        expect(response.data.errorMessage).toBe(ErrorMSG.InvalidPayload);

        localSerialNumber = await TestData.generateSerialNumber();
        let responseData = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10111', 'https:\\spl12312', locIDfromResp, '70111', 'OPT: Ophthalmic Tomography', 1, localAEID, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(responseData.status).toBe(400);
        expect(responseData.data.errorCode).toBe(0);
        expect(responseData.data.errorMessage).toBe(ErrorMSG.InvalidPayload);

        localSerialNumber = await TestData.generateSerialNumber();
        let responseData2 = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10111', '//spl12312', locIDfromResp, '70111', 'OPT: Ophthalmic Tomography', 1, localAEID, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(responseData2.status).toBe(400);
        expect(responseData2.data.errorCode).toBe(4021);
        expect(responseData2.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4021);

        localSerialNumber = await TestData.generateSerialNumber();
        let responseData3 = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10111', "{ \\\\  }", locIDfromResp, '70111', 'OPT: Ophthalmic Tomography', 1, localAEID, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(responseData3.status).toBe(400);
        expect(responseData3.data.errorCode).toBe(0);
        expect(responseData3.data.errorMessage).toBe(ErrorMSG.InvalidPayload);

        localSerialNumber = await TestData.generateSerialNumber();
        let newLocalUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let newLocalAet = newLocalUid;
        let responseData4 = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10111', "?%3f12", locIDfromResp, '70111', 'OPT: Ophthalmic Tomography', 1,newLocalAet, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(responseData4.status).toBe(200);
        let deleteresponseData = await ApiHelper.deleteDevice("DICOM", token, deviceId, '?%3f12')
        expect(deleteresponseData.status).toBe(200);

    });

    //US#308070 US#353696
    test("L1 user should not add a new device when serial number contains more than 14 characters @308070 @353696", async function () {
        //api request
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10111', localUid, locIDfromResp, '70111', 'OPT: Ophthalmic Tomography', 1, localAet, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4009);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4009);


    });

    
    //US402353
    test("L1 user should not add a new device when serial number contains space inbetween the string @402353", async function () {
        //api request
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10111', localUid, locIDfromResp, '70111', 'OPT: Ophthalmic Tomography', 1, localAet, '1   09', '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4054);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4054);


    });

     //US#402354
     test("L1 user should not add a new device when serial number contains special char @402354", async function () {
        //api request
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10111', localUid, locIDfromResp, '70111', 'OPT: Ophthalmic Tomography', 1, localAet, '!@#!@#$@#$#%', '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4054);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4054);


    });

    //US#308070 US#353696
    test("L1 user should not add a new device when manually entered DI contains more than 14 characters @308070 @353696", async function () {
        //api request
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        //let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10111', localUid, locIDfromResp, '70111', 'OPT: Ophthalmic Tomography', 1, 'spl123\\12', localSerialNumber, '04049539104410676767676767 (CALLISTO eye 3.2.1 model I)',);
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10001', localUid, locIDfromResp, '10131', 'OPT: Ophthalmic Tomography', 1, localAet, localSerialNumber, '04049539104410676767676767 (CALLISTO eye 3.2.1 model I)',);
        
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4008);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4008);

    });

    //US#308070 US#353696
    test("L1 user should not add a new device when mandatory parameter serial number is missing @308070 @353696", async function () {
        //api request
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10111', localUid, locIDfromResp, '70111', 'OPT: Ophthalmic Tomography', 1, localAet, ' ', '040495391 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4004);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4004);


    });

    //US#308070 US#353696
    test("L1 user should not add a new device when mandatory parameter device identifier is missing @308070 @353696", async function () {
        //api request
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10111', localUid, locIDfromResp, '70111', 'OPT: Ophthalmic Tomography', 1, localAet, localSerialNumber, ' (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4005);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4005);


    });

    //US#353696
    test("L1 user should not add a new device when required parameter - sgc is empty @353696", async function () {
        //api request
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic1010', localUid, "", '10111', 'US: Ultrasound', 1, localAet, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4034);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4034_1);
    });

    //US#353696
    test("L1 user should not add a new device when required parameter - sgc is less than 36 character @353696", async function () {
        //api request
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        var locIDless36char = await ApiHelper.createlocname(35)
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic1010', localUid, locIDless36char, '10111', 'US: Ultrasound', 1, localAet, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4041);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4041);
    });

    //US#353696
    test("L1 user should not add a new device when required parameter - sgc is > 36 characters @353696", async function () {
        //api request
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        var locIDgrtr36char = await ApiHelper.createlocname(37)
        let localSerialNumber = await TestData.generateSerialNumber();
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic1010', localUid, locIDgrtr36char, '10111', 'US: Ultrasound', 1, localAet, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4042);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4042);
    });

    //US#353696
    test("L1 user should not add a new device when required parameter - sgc is from different customerID @353696", async function () {

        // create location-->
        var locName = "AutoLoc-L1Post-AddDevice-" + await ApiHelper.createlocname(4)
        var locDesc = "This is the location: " + locName
        var status = "active"
        var postresponse = await ApiHelper.postlocationList(token, "5985", locName, locDesc, status)
        expect(postresponse.status).toBe(200);
        var locIDfromResp2 = postresponse.data.result.id;
        //api request
        let localUid = await TestData.generateUIDforDevice(deviceId, sastoken);
        let localAet = localUid;
        let localSerialNumber = await TestData.generateSerialNumber();       
        let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic1010', localUid, locIDfromResp2, '10111', 'US: Ultrasound', 1, localAet, localSerialNumber, '04049539102423 (CALLISTO eye 3.2.1 model I)',);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(4047);
        expect(response.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4047);
        //delete location-->
        var resploc = await ApiHelper.deletelocationByID(token, "5985", locIDfromResp2)
        expect(resploc.status).toBe(200)

    });

    //US#392137
    test("L1 user should not allow to add device when combination of DI and Serial are not unique @392137", async function () {
        let actualData = JSON.parse("[{\"identifier\":\"04049539102423\",\"name\":\"CALLISTO eye 3.2.1 model I\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049539069092\",\"name\":\"CALLISTO eye 3.5.1 model I\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049539103512\",\"name\":\"CALLISTO eye model II\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049539069214\",\"name\":\"CALLISTO eye model III\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049471092080\",\"name\":\"IOLMaster 700\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049471092066\",\"name\":\"IOLMaster 500\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748081118\",\"name\":\"ATLAS 9000\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04250668606731\",\"name\":\"VISUSCREEN 100\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04250668606724\",\"name\":\"VISUSCREEN 500\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049471097139\",\"name\":\"VISUREF 150\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748087080\",\"name\":\"CIRRUS 5000\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748087097\",\"name\":\"CIRRUS 500\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748087141\",\"name\":\"CIRRUS 6000\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"\",\"name\":\"Others\",\"manufacturer\":\"Unknown\",\"type\":null}]");
        for (let i = 0; i < actualData.length - 1; i++) {
            let localUid = await TestData.generateUIDforDevice();
            let localAet = localUid;
            let localSerialNumber = await TestData.generateSerialNumber();

            console.log("round:  " + i + "  localUid----> " + localUid + "  actualData: " + actualData[i].identifier)
            localSerialNumber = await TestData.generateSerialNumber();
            //api request
            let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10101', localUid, locIDfromResp, '10101', 'OPT: Ophthalmic Tomography', 1, localAet, localSerialNumber, actualData[i].identifier + '(' + actualData[i].manufacturer + ')',);
            expect(response.status).toBe(200);
            let localUid2 = await TestData.generateUIDforDevice();
            let localAet2 = localUid2;
            let response2 = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10101', localUid2, locIDfromResp, '10101', 'OPT: Ophthalmic Tomography', 1, localAet2, localSerialNumber, actualData[i].identifier + '(' + actualData[i].manufacturer + ')',);
            expect(response2.status).toBe(400);

            expect(response2.data.errorCode).toBe(4053);
            expect(response2.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4053);

            let responsedel = await ApiHelper.deleteDevice("DICOM", token, deviceId, localUid)
            expect(responsedel.status).toBe(200);
        }
    });
    //US#392137
    test("L1 user should not allow to add device when combination of DI and Serial are not unique for the particular agreement id @392137 ", async function () {
        let actualData = JSON.parse("[{\"identifier\":\"04049539102423\",\"name\":\"CALLISTO eye 3.2.1 model I\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049539069092\",\"name\":\"CALLISTO eye 3.5.1 model I\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049539103512\",\"name\":\"CALLISTO eye model II\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049539069214\",\"name\":\"CALLISTO eye model III\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049471092080\",\"name\":\"IOLMaster 700\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049471092066\",\"name\":\"IOLMaster 500\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748081118\",\"name\":\"ATLAS 9000\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04250668606731\",\"name\":\"VISUSCREEN 100\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04250668606724\",\"name\":\"VISUSCREEN 500\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049471097139\",\"name\":\"VISUREF 150\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748087080\",\"name\":\"CIRRUS 5000\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748087097\",\"name\":\"CIRRUS 500\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748087141\",\"name\":\"CIRRUS 6000\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"\",\"name\":\"Others\",\"manufacturer\":\"Unknown\",\"type\":null}]");
        for (let i = 0; i < actualData.length - 1; i++) {
            let localUid = await TestData.generateUIDforDevice();
            let localAet = localUid;
            let localSerialNumber = await TestData.generateSerialNumber();

            console.log("round:  " + i + "  localUid----> " + localUid + "  actualData: " + actualData[i].identifier)
            //api request
            localSerialNumber = await TestData.generateSerialNumber();
            let response = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10101', localUid, locIDfromResp, '10101', 'OPT: Ophthalmic Tomography', 1, localAet, localSerialNumber, actualData[i].identifier + '(' + actualData[i].manufacturer + ')',);
            expect(response.status).toBe(200);

            let localUid2 = await TestData.generateUIDforDevice(deviceId, sastoken);
            let localAet2 = localUid2;
            let response2 = await ApiHelper.addDevice("DICOM", token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10101', localUid2, locIDfromResp, '10101', 'OPT: Ophthalmic Tomography', 1, localAet2, localSerialNumber, actualData[i].identifier + '(' + actualData[i].manufacturer + ')',);
            expect(response2.status).toBe(400);

            expect(response2.data.errorCode).toBe(4053);
            expect(response2.data.errorMessage).toBe(ErrorMSG.ErrorMsg_4053);

            let responsedel = await ApiHelper.deleteDevice("DICOM", token, deviceId, localUid)
            expect(responsedel.status).toBe(200)
        }
    });
    test.afterAll(async function () {
        await ApiHelper.deleteAll_ActiveDevice(token, deviceId)
        await ApiHelper.deleteAll_InActiveDevice(token, deviceId)

        //Delete All Locations --->
        await ApiHelper.deleteAll_AutomationDeviceLocations(token, customerId);
    });



});