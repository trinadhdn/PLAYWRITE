const { BasePage } = require('../../../pages/base_page.js');
const { StatusListPage } = require('../../../pages/languages/defaultAndStatus_list_page');
const { CustomerListPage } = require('../../../pages/customer_list_page.js');
const { CustomerDetailsPage } = require('../../../pages/customer_details_page.js');
const { IotHubMethods } = require('../../../utils/iothub_methods.js');
const { TokenGenerators } = require('../../../utils/token_generators.js')
const { CustomerDetailsStatusPage } = require("../../../pages/customer_details_status_page.js");
const { test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
var customerId, basePage,sastoken,customerName, customerDetailsRecordSet ,customerDetailsPage,conn,deviceId;
var customerDetailsStatusPage,customerDetailsId,StatusPage_ML,customerListPage;
var testDevice = process.env.serviceUserHypervDeviceId;
const iothub = process.env.subscription+"-conm-"+process.env.env+"-"+process.env.locationshortcut+"-iothub-aih"
const iothubResourceUri = iothub+'.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'
var LAN;
if (process.env.locale.includes("DE")) {
    LAN = require('../../../resources/de.json');
} else if (process.env.locale.includes("FR")) {
    LAN = require('../../../resources/fr.json');
}else if (process.env.locale.includes("EN")) {
    LAN = require('../../../resources/en.json');
}else if (process.env.locale.includes("ES")) {
  LAN = require('../../../resources/es.json');
}

test.describe('Multi-language check for Status with L1 user', function (){
    test.beforeAll(async function(){
        // test data preparation     
        conn = await TestData.sqlDBConnection();
        var devicesRecordSet = await TestData.executeSqlQuery(conn, "select top(1) * from [dbo].[Device] where iotdeviceId ='"+testDevice+"' and activationStatus='True' for json auto")
        var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        deviceId = deviceRecord[0].iotDeviceId;
        customerDetailsId = deviceRecord[0].customerDetailsId ;
        conn = await TestData.sqlDBConnection();
        customerDetailsRecordSet = await TestData.executeSqlQuery(conn,"select * from [dbo].[CustomerDetails] where customerdetailsId="+customerDetailsId+" for json auto")
        var customerDetailsRecord = JSON.parse(customerDetailsRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        customerId = customerDetailsRecord[0].customerId;
        customerName = customerDetailsRecord[0].customerName;
        sastoken = await TokenGenerators.generateSasToken(iothubResourceUri, iothubPolicyKey, iothubPolicy, 30)
        
        console.log("customerName: "+customerName)
        console.log("customerId: "+customerId)
    });

    
  test.beforeEach(async function({page}){
    basePage = new BasePage(page);
    customerListPage = new CustomerListPage(page);
    customerDetailsPage = new CustomerDetailsPage(page);
    StatusPage_ML = new StatusListPage(page);
    customerDetailsStatusPage = new CustomerDetailsStatusPage(page);
})
    
    // US#307710 US#307707
    test('Check Device Status and container status with Multi Languages @307710 @307707 @326276', async function ({page}){
    // Navigate to Customer list page
        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(customerId);
        await customerListPage.selectCustomer(customerId);
       
        await customerDetailsPage.selectCMInstance(deviceId);

        await customerDetailsPage.selectCMInstanceStatus(deviceId);

        var iothubResponse = await IotHubMethods.getModuleTwin(iothub, deviceId, '$edgeAgent', sastoken);
        var conn = await LAN.moduleConnectedStatus;
        var disconn = await LAN.moduleDisconnectedStatus;
        var deviceStatus = iothubResponse.data[0].properties.reported.lastDesiredStatus.code == 200 ? conn : disconn
        expect(await StatusPage_ML.getCMDeviceStatus()).toEqual(deviceStatus);

    var systemModulesJson = iothubResponse.data[0].properties.reported.systemModules
    var desiredCustomModulesJson = iothubResponse.data[0].properties.desired.modules
    var customModulesJson = iothubResponse.data[0].properties.reported.modules
    var customModules = [...new Set([...Object.keys(desiredCustomModulesJson), ...Object.keys(customModulesJson)])]
    var errorStatus = await LAN.containerErrorStatus;
    var runningStatus = await LAN.containerRunningStatus;
    var expectedModuleStatus = new Map();
    expectedModuleStatus.set('edgeAgent', systemModulesJson.edgeAgent.runtimeStatus == "unknown" ? errorStatus : systemModulesJson.edgeAgent.runtimeStatus)
    expectedModuleStatus.set('edgeHub', systemModulesJson.edgeHub.runtimeStatus == "unknown" ? errorStatus : systemModulesJson.edgeHub.runtimeStatus)
    for (let i = 0; i < customModules.length; i++) {
      var status;
      if (customModulesJson[customModules[i]]) {
        status = customModulesJson[customModules[i]].runtimeStatus == "unknown" ? errorStatus : customModulesJson[customModules[i]].runtimeStatus
      } else {
        status = errorStatus
      }
      expectedModuleStatus.set(customModules[i], status)
    }
    for (let [key, value] of expectedModuleStatus) {
      
      var [actualContainerStatus, actualContainerStatusIcon] = await customerDetailsStatusPage.getContainerStatus(key);
      if (value == "failed") {
        value = errorStatus;
      }else if (value == "running"){
        value = runningStatus
      }
      
      expect(actualContainerStatus).toEqual(value)
      expect(actualContainerStatusIcon).toEqual(true)
    }    

    });
    
   
	
});
