const { TokenGenerators } = require('../../../utils/token_generators.js');
const { Comparisions } = require('../../../utils/comparisions.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
const { AzureStorageMethods }  = require("../../../utils/azure_storage_methods.js");
var OR = require("../../../resources/OR.json");
const apimLogFileRequest =
  process.env.apimBaseURL + OR.APIUrls.requestLogFile;

var token, deviceId, azureData, conn;
var testDevice = process.env.serviceUserHypervDeviceId

test.describe("Checking devices backup File", function () {
  test.beforeAll(async function () {
    // test data preparation
    conn = await TestData.sqlDBConnection();
    var devicesRecordSet = await TestData.executeSqlQuery(conn,"select top(1) * from [dbo].[Device] where iotdeviceId = '"+testDevice+"' for json auto")
    var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    deviceId = deviceRecord[0].iotDeviceId;
    console.log("deviceId: " + deviceId);
    token = await TokenGenerators.generateAuthToken("l1serviceuser");
    azureData = await AzureStorageMethods.getblobs(process.env.subscription+"conm"+process.env.env+process.env.locationshortcut+"backupsa",
       "iotdevicefilescontainer",process.env.backupStorageAccountKey,"get","");
  
  });

  // US#98457
  test("L1 user should be able to check if backup file created for devices in last 24 hours @98457", async function () {
    
    var current = new Date().getTime();
    var compareDatesBoolean= false;
    const oneDay = 60 * 60 * 24 * 1000;


    for (var i in azureData) {
      var date = azureData[i].modifiedTime;
      compareDatesBoolean = (current - date) < oneDay;
      if (compareDatesBoolean) {
        if ((azureData[i].fileName).includes('devices.txt')) {
          break;
        }
      }
    }
    expect(compareDatesBoolean).toBe(true);

    
  });


  
});
