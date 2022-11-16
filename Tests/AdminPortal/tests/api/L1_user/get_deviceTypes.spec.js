const { TokenGenerators } = require('../../../utils/token_generators.js');
const { Comparisions } = require('../../../utils/comparisions.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
let OR = require('../../../resources/OR.json');
const apimDeviceTypeURL = process.env.apimBaseURL + OR.APIUrls.getdeviceTypes;
let token,deviceTypeRecordSet;

test.describe("Device Type List API for L1 user", function () {
    test.beforeAll(async function () {
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
    });
    
    //US#315899
    test("L1 user should get all device Type with valid Token @315899", async function ({ page }) {
        let conn = await TestData.sqlDBConnection();
        deviceTypeRecordSet = await TestData.executeSqlQuery(conn, "select deviceIdentifier as identifier,deviceName as name,deviceManufacturer as manufacturer,null as type FROM DeviceTypes for json auto,INCLUDE_NULL_VALUES")
        let dbData = JSON.parse(deviceTypeRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);

        //api request
        let config = {
            method: 'get',
            url: apimDeviceTypeURL,
            headers: { "Authorization": "Bearer " + token },
        };
        let response = await TokenGenerators.request(config);
        let apiData = response.data
        let areEqual = new Array(), apiJSON;
        let dbJSON;
        expect(response.status).toBe(200);

        if (apiData.result.length == dbData.length) {
            for (let i = 0; i < apiData.result.length; i++) {
                apiJSON = JSON.parse(JSON.stringify(apiData.result[i]));
                dbJSON = JSON.parse(JSON.stringify(dbData[i]));
                areEqual.push(await Comparisions.compareUnorderedJSONObjects(apiJSON, dbJSON));
            }
        } else {
            areEqual.push(false);
        }
        expect(areEqual).not.toContain(false);
    });


    //US#353699
    test("L1 user should get all newly added device Type entires @353699", async function ({ page }) {

        let actualData =JSON.parse("[{\"identifier\":\"04049539102423\",\"name\":\"CALLISTO eye 3.2.1 model I\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049539069092\",\"name\":\"CALLISTO eye 3.5.1 model I\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049539103512\",\"name\":\"CALLISTO eye model II\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049539069214\",\"name\":\"CALLISTO eye model III\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049471092080\",\"name\":\"IOLMaster 700\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049471092066\",\"name\":\"IOLMaster 500\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748081118\",\"name\":\"ATLAS 9000\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04250668606731\",\"name\":\"VISUSCREEN 100\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04250668606724\",\"name\":\"VISUSCREEN 500\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04049471097139\",\"name\":\"VISUREF 150\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748087080\",\"name\":\"CIRRUS 5000\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748087097\",\"name\":\"CIRRUS 500\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"04057748087141\",\"name\":\"CIRRUS 6000\",\"manufacturer\":\"Carl Zeiss Meditec AG\",\"type\":null},{\"identifier\":\"\",\"name\":\"Others\",\"manufacturer\":\"Unknown\",\"type\":null}]");

        //api request
        let config = {
            method: 'get',
            url: apimDeviceTypeURL,
            headers: { "Authorization": "Bearer " + token },
        };
        let response = await TokenGenerators.request(config);
        let apiData = response.data
        let areEqual = new Array(), apiJSON;
        expect(response.status).toBe(200);
        let dbJSON;
        if (apiData.result.length == actualData.length) {
            for (let i = 0; i < apiData.result.length; i++) {
                apiJSON = JSON.parse(JSON.stringify(apiData.result[i]));
                dbJSON = JSON.parse(JSON.stringify(actualData[i]));
                areEqual.push(await Comparisions.compareUnorderedJSONObjects(apiJSON, dbJSON));
            }
        } else {
            areEqual.push(false);
        }
        expect(areEqual).not.toContain(false);
    });

    //US#315899
    test("L1 user should NOT get all device Type with Invalid Token @315899", async function ({ page }) {
        //api request
        let config = {
            method: 'get',
            url: apimDeviceTypeURL,
            headers: { "Authorization": "Bearer " + "token" },
        };
        let response = await TokenGenerators.request(config);
        expect(response.status).toBe(401);

    });
});