const { TokenGenerators } = require('../../../utils/token_generators.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
var OR = require('../../../resources/OR.json');
var conn, deviceId, logFileName, token;

const apiDownloadCmLogsURL = process.env.apimBaseURL + OR.APIUrls.downloadCMLogs;
const apimLogFileRequest = process.env.apimBaseURL + OR.APIUrls.requestLogFile;

var testDevice = process.env.serviceUserHypervDeviceId

test.describe("Download CM Logs API", function () {

    test.beforeAll(async function () {
        conn = await TestData.sqlDBConnection();
        var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where iotdeviceId = '" + testDevice + "' for json auto")
        var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        deviceId = deviceRecord[0].iotDeviceId;
        token = await TokenGenerators.generateAuthToken("l1serviceuser");

        var config = {
            method: "get",
            url: apimLogFileRequest + "/" + deviceId + "/log-files",
            headers: {
                Authorization: "Bearer " + token,
                "Content-Type": "application/json",
            }
        };

        var response = await TokenGenerators.request(config);
        logFileName = response.data[0].fileName;
    });

    // US#30816 T341586
    test("Download Logfile API - L1 provide valid file name and device Id", async function () {

        var config = {
            method: 'get',
            url: apiDownloadCmLogsURL + "/" + deviceId + "/logs?FileName=" + logFileName,
            headers: { "Authorization": "Bearer " + token },
        };

        var response = await TokenGenerators.request(config);
        var apiData = response.data
        expect(response.status).toBe(200);
        expect(response.content).not.toBeNull();

    });

    test("Download Logfile API - L1 user provides invalid file name", async function () {
        var fileName = "test"
        var config = {
            method: 'get',
            url: apiDownloadCmLogsURL + "/" + deviceId + "/logs?FileName=" + fileName,
            headers: { "Authorization": "Bearer " + token },
        };

        var response = await TokenGenerators.request(config);
        expect(response.status).toBe(404);
        expect(response.data).toBe('File not found.')

    });

    test("Download Logfile API - L1 user provides empty file name", async function () {
        var fileName = ""
        var config = {
            method: 'get',
            url: apiDownloadCmLogsURL + "/" + deviceId + "/logs?FileName=" + fileName,
            headers: { "Authorization": "Bearer " + token },
        };

        var response = await TokenGenerators.request(config);
        expect(response.status).toBe(400);
        expect(response.data.errorCode).toBe(1);

    });
    test("Download Logfile API - L1 user provides invalid device Id", async function () {
        let invalidDeviceId = "123"
        var config = {
            method: 'get',
            url: apiDownloadCmLogsURL + "/" + invalidDeviceId + "/logs?FileName=" + logFileName,
            headers: { "Authorization": "Bearer " + token },
        };

        var response = await TokenGenerators.request(config);
        expect(response.status).toBe(400);


    });

    test("Download Logfile API - L1 user provides empty device Id", async function () {
        var deviceId = ""
        var config = {
            method: 'get',
            url: apiDownloadCmLogsURL + "/" + deviceId + "/logs?FileName=" + logFileName,
            headers: { "Authorization": "Bearer " + token },
        };

        var response = await TokenGenerators.request(config);
        expect(response.status).toBe(400);
        expect(response.data).toBe('Invalid device id.');

    });
});