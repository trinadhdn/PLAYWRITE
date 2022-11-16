const { IotHubMethods } = require('../../../utils/iothub_methods.js');
const { TokenGenerators } = require('../../../utils/token_generators.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
var OR = require('../../../resources/OR.json');
var { ApiHelper } = require('../../../helpers/api-helpers.js')

const apimCMinstanceSummaryUrl = process.env.apimBaseURL + OR.APIUrls.cmInstanceSummary;
const apimAddConnectedDevicesUrl = process.env.apimBaseURL + OR.APIUrls.addConnectedDevicesUrl;

const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih"
const iothubResourceUri = iothub + '.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'
var sastoken, deviceId, token,conn,customerDetailsId,customerDetailsRecordSet,customerId;
let locIDfromResp;

var testDevice = process.env.serviceUserHypervDeviceId

test.describe("GET CM instance summmary", function () {
    test.beforeAll(async function () {
        // test data preparation     
        sastoken = await TokenGenerators.generateSasToken(iothubResourceUri, iothubPolicyKey, iothubPolicy, 30)

        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        conn = await TestData.sqlDBConnection();
        var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where iotdeviceId = '" + testDevice + "' for json auto")
        var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        deviceId = deviceRecord[0].iotDeviceId;
        customerDetailsId = deviceRecord[0].customerDetailsId;
        customerDetailsRecordSet = await TestData.executeSqlQuery(conn, "select * from [dbo].[CustomerDetails] where customerdetailsId=" + customerDetailsId + " for json auto")
        var customerDetailsRecord = JSON.parse(customerDetailsRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        customerId = customerDetailsRecord[0].customerId;
        // create location-->
        var locName = "AutoLoc-" + await ApiHelper.createlocname(4)
        var locDesc = "This is the location: " + locName
        var status = "active"
        var postresponse = await ApiHelper.postlocationList(token, customerId, locName, locDesc, status)
        expect(postresponse.status).toBe(200);
        locIDfromResp = postresponse.data.result.id;
    })

    //US#342968
    test("Verify the cm instance summary details @342968", async function () {

        var getCMInstanceconfig = {
            method: "get",
            url: apimCMinstanceSummaryUrl,
            headers: { "Ocp-Apim-Subscription-Key": process.env.reportApiSubscriptionKey }

        };

        var response = await TokenGenerators.request(getCMInstanceconfig);
        var iothubResponse = await IotHubMethods.getDevicesOnStatus(iothub, sastoken);

        expect(response.status).toBe(200);
        expect(response.data.CmInstanceCount).toBe(iothubResponse.data.length);
        expect(response.data.DisconnectedDevicesCount).toBe(iothubResponse.data.filter(x => x.connectionState == 'Disconnected').length);
        expect(response.data.ConnectedDevicesCount).toBe(iothubResponse.data.filter(x => x.connectionState == 'Connected').length);

    })

    //US#342968
    test("Verify the cm instance summary details when new devcie with identifier is added @342968", async function () {

        var getCMInstanceconfig = {
            method: "get",
            url: apimCMinstanceSummaryUrl,
            headers: { "Ocp-Apim-Subscription-Key": process.env.reportApiSubscriptionKey }
        };

        var summaryResponse = await TokenGenerators.request(getCMInstanceconfig);

        var callisto321Cnt = summaryResponse.data["CALLISTO eye 3.2.1 model I"] ? summaryResponse.data["CALLISTO eye 3.2.1 model I"] : 0;
        var callisto351Cnt = summaryResponse.data["CALLISTO eye 3.5.1 model I"] ? summaryResponse.data["CALLISTO eye 3.5.1 model I"] : 0;
        var iol700Cnt = summaryResponse.data["IOLMaster 700"] ? summaryResponse.data["IOLMaster 700"] : 0;
        var iol500Cnt = summaryResponse.data["IOLMaster 500"] ? summaryResponse.data["IOLMaster 500"] : 0;
        var callisto3Cnt = summaryResponse.data["CALLISTO eye model III"] ? summaryResponse.data["CALLISTO eye model III"] : 0;
        var callisto2Cnt = summaryResponse.data["CALLISTO eye model II"] ? summaryResponse.data["CALLISTO eye model II"] : 0;
        const devicesCnt = [callisto321Cnt, iol700Cnt, iol500Cnt, callisto351Cnt, callisto3Cnt, callisto2Cnt]
        console.log(devicesCnt);
        const newDeviceNames = ["CALLISTO eye 3.2.1 model I:04049539102423",
            "IOLMaster 700:04049471092080",
            "IOLMaster 500:04049471092066",
            "CALLISTO eye 3.5.1 model I:04049539069092",
            "CALLISTO eye model III:04049539069214",
            "CALLISTO eye model II:04049539103512"];
        let lstLength = newDeviceNames.length;
        for (let i = 0; i < lstLength; i++) {

            var globalUid = "Aut" + parseInt((Math.random() * 100000), 10);
            var globalAet = globalUid;

            var strSplit = newDeviceNames[i].split(":");
            var deviceName = strSplit[0].toString();
            var devId = strSplit[1].toString();
            var Dtype  = devId + ' (Carl Zeiss Meditec AG)'
            let localSerialNumber = await TestData.generateSerialNumber();
            let deviceResponse = await ApiHelper.addDevice("DICOM",token, deviceId, '1019', 'iol1.customer.internal.com', 'AutDevic10101', globalUid, locIDfromResp, '10101', 'OPT: Ophthalmic Tomography', 1, globalAet, localSerialNumber, Dtype,);
            expect(deviceResponse.status).toBe(200);
            console.log(deviceResponse.data);
            setTimeout(() => { console.log("waiting"); }, 2000);
            var response = await TokenGenerators.request(getCMInstanceconfig);
            expect(response.status).toBe(200);
            expect(response.data[deviceName]).toBe(devicesCnt[i] + 1);
        }
    })
})
