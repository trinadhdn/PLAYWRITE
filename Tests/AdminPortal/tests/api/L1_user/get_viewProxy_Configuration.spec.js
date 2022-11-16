const { IotHubMethods } = require('../../../utils/iothub_methods.js');
const { TokenGenerators } = require('../../../utils/token_generators.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
var OR = require('../../../resources/OR.json');
let { ApiHelper } = require('../../../helpers/api-helpers.js')


const apimviewProxyConfigurationURL = process.env.apimBaseURL + OR.APIUrls.viewProxyConfigurationURL;
var sastoken, deviceId, token, conn;
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih";
const iothubResourceUri = iothub + '.azure-devices.net/devices';
const iothubPolicyKey = process.env.iotHubPolicyKey;
const iothubPolicy = 'iothubowner';

test.describe("View Device Configuration Proxy", function () {
  test.beforeAll(async function () {
    sastoken = await TokenGenerators.generateSasToken(iothubResourceUri, iothubPolicyKey, iothubPolicy, 30)
    deviceId = process.env.proxyDeviceId;
    token = await TokenGenerators.generateAuthToken("l1serviceuser");
  });

  // US#308115
  test("Proxy_API-L1User should view device configuration Proxy with valid device ID @308115", async function () {
    var config = {
      method: 'get',
      url: apimviewProxyConfigurationURL + "/" + deviceId + "/proxy",
      headers: { "Authorization": "Bearer " + token }
    };
    var viewProxyResponse = await TokenGenerators.request(config);
    expect(viewProxyResponse.status).toBe(200);
    if (process.env.proxyDeviceId != process.env.regularUserHypervDeviceId) {
      var ConnectivityModuleProxyDetails = {
        "username": "proxyuser",
        "port": 8022,
        "hostname": "10.2.0.4",  
    };
    
    if(process.env.env!="dev"){ConnectivityModuleProxyDetails.hostname="10.0.4.4"}

      expect(ConnectivityModuleProxyDetails.hostname).toEqual(viewProxyResponse.data.hostname);
      expect(ConnectivityModuleProxyDetails.port).toBe(viewProxyResponse.data.port);
      expect(ConnectivityModuleProxyDetails.username).toBe(viewProxyResponse.data.username);
    }
  });

  // US#308115
  test("Proxy_API-L1User should view device configuration Proxy with invalid device ID @308115", async function () {
    var config = {
      method: 'get',
      url: apimviewProxyConfigurationURL + "/" + "12345" + "/proxy",
      headers: { "Authorization": "Bearer " + token }
    };
    var viewProxyResponse = await TokenGenerators.request(config);
    expect(viewProxyResponse.status).toBe(400);
    if (process.env.proxyDeviceId != process.env.regularUserHypervDeviceId) {
      expect(viewProxyResponse.data).toBe('Device Id is not valid.');

    }
  });

  // US#308115
  test("Proxy_API-L1User should view device configuration Proxy with null device ID @308115", async function () {
    var config = {
      method: 'get',
      url: apimviewProxyConfigurationURL + "/" + " " + "/proxy",
      headers: { "Authorization": "Bearer " + token }
    };
    var viewProxyResponse = await TokenGenerators.request(config);
    expect(viewProxyResponse.status).toBe(400);
    expect(viewProxyResponse.data).toBe('EmptyDeviceId');

  });


   //US#381867
   test("API- Validate serviceuser to get empty Proxy Details for non-proxy device @381867", async function ({ page }) {
     
    var newResponse = await ApiHelper.getProxy(token,process.env.serviceUserHypervDeviceId )
    expect(newResponse.status).toBe(200);
    var ConnectivityModuleProxyDetails = {
      "username": null,
      "password": null,
      "port":null,
      "hostname": ''
    };

    expect(ConnectivityModuleProxyDetails.hostname).toEqual(newResponse.data.hostname);
    expect(ConnectivityModuleProxyDetails.port).toBe(newResponse.data.port);
    expect(ConnectivityModuleProxyDetails.username).toBe(newResponse.data.username);
  });


});