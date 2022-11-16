const { TokenGenerators } = require('../../../utils/token_generators.js');
const { Comparisions } = require('../../../utils/comparisions.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
var OR = require('../../../resources/OR.json');
const { ApiHelper } = require('../../../helpers/api-helpers.js');

const apimUpdateHistoryRL = process.env.apimBaseURL + OR.APIUrls.deviceGenericUrl;
var testDevice = process.env.serviceUserHypervDeviceId
var deviceId, token, conn, sastoken, groupId;
const iothub = process.env.subscription + "-conm-" + process.env.env + "-" + process.env.locationshortcut + "-iothub-aih"
const iothubResourceUri = iothub + '.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'
var aduUpdateStatus = process.env.aduUpdateStatus
var updateType = process.env.updateType
var updateVersion = process.env.updateVersion
test.describe("Device updateHistory API for a device with L1 users", function () {
  test.beforeAll(async function () {
    // test data preparation   
    conn = await TestData.sqlDBConnection();
    var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where customerDetailsId in (select customerDetailsId from [dbo].[CustomerDetails]) and activationStatus='True' and iotDeviceId = '" + testDevice + "' for json auto")
    var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    deviceId = deviceRecord[0].iotDeviceId;
    groupId = deviceRecord[0].groupId;
    token = await TokenGenerators.generateAuthToken("l1serviceuser")
    sastoken = await TokenGenerators.generateSasToken(iothubResourceUri, iothubPolicyKey, iothubPolicy, 30)
  });

  //US#177341
  test("Get Custom updateHistory API for a device for L1 users @177341", async function () {

    //api request

    var response = await ApiHelper.getUpdates(token, deviceId)
    var apiData = response.data;
    var dataResults = apiData.result
    var apiDataF = new Array()

    for (var i = 0; i < dataResults.length; i++) {
      if (dataResults[i].updateType == 'custom') {
        var date = new Date(dataResults[i].endDateTime);
        var data = { updateVersion: dataResults[i].updateVersion, endDateTime: date, updateType: dataResults[i].updateType.toLowerCase() }
        apiDataF.push(data);
      }
    }

    expect(response.status).toBe(200);
    expect(apiData.statusCode).toBe(200);
    expect(apiData.success).toBe(true);
    expect(apiData.errorMessage).toBe(null);
    conn = await TestData.sqlDBConnection();
    var devicesRecordSet = await TestData.executeSqlQuery(conn, " SELECT top(10)  DeviceUpdate.endDateTime,  [Version].versionNumber,  [Update].updateType   FROM [DeviceUpdate] JOIN [GroupUpdate]  ON [DeviceUpdate].groupUpdateId = [GroupUpdate].groupUpdateId JOIN [Update] ON [Update].updateId = [GroupUpdate].updateId JOIN [Version] ON [Version].versionId = [Update].targetVersionId  where [DeviceUpdate].deviceId in (select deviceId from [dbo].[Device] where iotdeviceId = '" + deviceId + "') and  [DeviceUpdate].endDateTime is not null and [DeviceUpdate].deviceUpdateStatusId ='2' and [Update].updateType = 'custom' order by DeviceUpdate.endDateTime desc for json PATH")
    var deviceRecord;
    if (devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B'].length > 0) {
      deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    }
    else {
      //added this condition if none of the devices have update history
      deviceRecord = 0;
    }
    var dbDateF = new Array();
    var areEqual = new Array(), apiJSON, dbJSON, dbDateF;
    for (var i = 0; i < deviceRecord.length; i++) {
      var date = new Date(deviceRecord[i].endDateTime);
      var data = { updateVersion: deviceRecord[i].versionNumber, endDateTime: date, updateType: deviceRecord[i].updateType.toLowerCase() }
      dbDateF.push(data);
    }
    if (apiDataF.length <= dbDateF.length) {
      if (dbDateF.length == 0) {
        areEqual.push(true);
      }
      for (var i = 0; i < apiDataF.length; i++) {

        apiJSON = JSON.parse(JSON.stringify(apiDataF[i]))
        dbJSON = JSON.parse(JSON.stringify(dbDateF[i]))
        areEqual.push(Comparisions.compareObjects(apiJSON, dbJSON));

      }
    } else {
      areEqual.push(false);
    }
    expect(areEqual).not.toContain(false);

  });


  //US#457593
  test("Get ADU updateHistory API for a device group for L1 users @457593", async function () {
    var apiJSON
    if (aduUpdateStatus == 'true') {

      //api request
      var response = await ApiHelper.getUpdates(token, deviceId)
      var apiData = response.data;
      var dataResults = apiData.result
      var apiDataF = new Array()


      for (var i = 0; i < dataResults.length; i++) {
        if (dataResults[i].updateType.toLowerCase() == 'adu') {
          var date = new Date(dataResults[i].endDateTime);
          var data = { updateVersion: dataResults[i].updateVersion, updateType: dataResults[i].updateType.toLowerCase() }
          apiDataF.push(data);
        }
      }

      expect(response.status).toBe(200);
      expect(apiData.statusCode).toBe(200);
      expect(apiData.success).toBe(true);
      expect(apiData.errorMessage).toBe(null);


      var expectedData = { updateVersion: updateVersion, updateType: updateType.toLowerCase()}
      expDataJSON = JSON.parse(JSON.stringify(expectedData));

      var areEqual = new Array(), apiJSON, expDataJSON, dbDateF;
      for (var i = 0; i < apiDataF.length; i++) {
        apiJSON = JSON.parse(JSON.stringify(apiDataF[i]));
        areEqual.push(await Comparisions.compareObjects(apiJSON, expDataJSON));
      }

      expect(areEqual.flat()).toContain(true);

    }
    else {
      expect(true).toEqual(true);
      console.log("Bypassed ADU Update tests as value for aduUpdateStatus is set to false")

    }

  });

});