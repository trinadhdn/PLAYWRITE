const{ BasePage } = require('../../../pages/base_page.js');
const { TokenGenerators } = require('../../../utils/token_generators.js')
const { test, expect } = require('@playwright/test');
const { IotHubMethods } = require('../../../utils/iothub_methods.js');
const { CustomerListPage } = require('../../../pages/customer_list_page.js');
const { CustomerDetailsPage } = require('../../../pages/customer_details_page.js');
const { TestData } = require('../../../utils/test_data.js');
const { ApiHelper } = require('../../../helpers/api-helpers.js')

const iothub = process.env.subscription+"-conm-"+process.env.env+"-"+process.env.locationshortcut+"-iothub-aih"
const iothubResourceUri = iothub+'.azure-devices.net/devices'
const iothubPolicyKey = process.env.iotHubPolicyKey
const iothubPolicy = 'iothubowner'
var sastoken,customerDetailsId,customerDetailsRecordSet,deviceId,customer, customerId, conn, token, universalLocation, universalLocIDfromResp, response;
var basePage,customerListPage,customerDetailsPage
var testDevice = process.env.serviceUserHypervDeviceId;
test.describe('Connected Devices List for L1 user', function(){
    test.beforeAll(async function(){
        // test data preparation     
        sastoken = await TokenGenerators.generateSasToken(iothubResourceUri,iothubPolicyKey,iothubPolicy,30)
        
        conn = await TestData.sqlDBConnection();
        var devicesRecordSet = await TestData.executeSqlQuery(conn,"select top(1) * from [dbo].[Device] where iotdeviceId = '"+testDevice+"' for json auto")
        var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        deviceId = deviceRecord[0].iotDeviceId;
        customerDetailsId = deviceRecord[0].customerDetailsId ;
        conn = await TestData.sqlDBConnection();
        customerDetailsRecordSet = await TestData.executeSqlQuery(conn,"select * from [dbo].[CustomerDetails] where customerdetailsId="+customerDetailsId+" for json auto")
        var customerDetailsRecord = JSON.parse(customerDetailsRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        customerId = customerDetailsRecord[0].customerId;
        customer = customerDetailsRecord[0].customerName;
        console.log("customerId: "+customer)
        console.log("deviceId: "+deviceId)
        
    });
    test.beforeEach(async function({page}){
        basePage = new BasePage(page);
        customerListPage = new CustomerListPage(page);
        customerDetailsPage = new CustomerDetailsPage(page);
        universalLocation = "AutoLoc-" + await ApiHelper.createlocname(4) + "L1connectedDevices"
        var locDesc = "This is the location: " + universalLocation
        var status = "active"
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        await ApiHelper.deleteAll_ActiveDevice(token, deviceId);
        await ApiHelper.deleteAll_InActiveDevice(token, deviceId);
        await ApiHelper.deleteAll_AutomationDeviceLocations(token, customerId);
        var postresponse = await ApiHelper.postlocationList(token, customerId, universalLocation, locDesc, status)
        expect(postresponse.status).toBe(200);
        universalLocIDfromResp = postresponse.data.result.id;
    })
    //US#74499 US#314283 US#385645
	test('L1 user should be able to view the list of connected devices both active and inactive under Devices sub tab of the CM instance in Customer details page @74499 @314283 @385645', async function({page}){    
        test.slow(); 
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
            response = await ApiHelper.addDevice("DICOM", token, deviceId, "1011", "110.110.110.110", "IOL0", "IOL0",universalLocIDfromResp, "IOL0", "OPT: Ophthalmic Tomography", 1, "IOL0", await TestData.generateSerialNumber(), "04049539102423 (CALLISTO eye 3.2.1 model I)", null);
			expect(response.status).toBe(200);
			response = await ApiHelper.addDevice("DICOM", token, deviceId, "1011", "110.110.110.110", "IOL1", "IOL1",universalLocIDfromResp, "IOL1", "OPT: Ophthalmic Tomography", 0, "IOL1", await TestData.generateSerialNumber()+'1', "04049539102423 (CALLISTO eye 3.2.1 model I)", null);
			expect(response.status).toBe(200);
			response = await ApiHelper.addDevice("DICOM", token, deviceId, "1011", "110.110.110.110", "IOL2", "IOL2",universalLocIDfromResp, "IOL2", "OPT: Ophthalmic Tomography", 1, "IOL2", await TestData.generateSerialNumber()+'2', "04049539102423 (CALLISTO eye 3.2.1 model I)", null);
			expect(response.status).toBe(200);
			response = await ApiHelper.addDevice("DICOM", token, deviceId, "1011", "110.110.110.110", "IOL3", "IOL3",universalLocIDfromResp, "IOL3", "OPT: Ophthalmic Tomography", 0, "IOL3", await TestData.generateSerialNumber()+'3', "04049539102423 (CALLISTO eye 3.2.1 model I)", null);
			expect(response.status).toBe(200);
			response = await ApiHelper.addDevice("DICOM", token, deviceId, "1011", "110.110.110.110", "IOL4", "IOL4",universalLocIDfromResp, "IOL4", "OPT: Ophthalmic Tomography", 1, "IOL4", await TestData.generateSerialNumber()+'4', "04049539102423 (CALLISTO eye 3.2.1 model I)", null);
			expect(response.status).toBe(200);
			response = await ApiHelper.addDevice("DICOM", token, deviceId, "1011", "110.110.110.110", "IOL5", "IOL5",universalLocIDfromResp, "IOL5", "OPT: Ophthalmic Tomography", 0, "IOL5", await TestData.generateSerialNumber()+'5', "04049539102423 (CALLISTO eye 3.2.1 model I)", null);
			expect(response.status).toBe(200);
			response = await ApiHelper.addDevice("DICOM", token, deviceId, "1011", "110.110.110.110", "IOL6", "IOL6",universalLocIDfromResp, "IOL6", "OPT: Ophthalmic Tomography", 1, "IOL6", await TestData.generateSerialNumber()+'6', "04049539102423 (CALLISTO eye 3.2.1 model I)", null);
			expect(response.status).toBe(200);
			response = await ApiHelper.addDevice("DICOM", token, deviceId, "1011", "110.110.110.110", "IOL7", "IOL7",universalLocIDfromResp, "IOL7", "OPT: Ophthalmic Tomography", 0, "IOL7", await TestData.generateSerialNumber()+'7', "04049539102423 (CALLISTO eye 3.2.1 model I)", null);
			expect(response.status).toBe(200);
			
            
        await page.waitForTimeout(22000);
        var iothubResponse = await IotHubMethods.getModuleTwin(iothub,deviceId,'dicomforwardermodule',sastoken);        
		var iotHubConnectedDevices = iothubResponse.data[0].properties.desired.connectedDevices
        var connectedDevicesArray = Object.values(iotHubConnectedDevices)
        var sortedIothubConnectedDevices = connectedDevicesArray.sort((a,b)=>{return a.name < b.name ? -1: 1})
        var expectedOutcome = {"activeDevices":[],"inActiveDevices":[]};

        sortedIothubConnectedDevices.forEach(element => { 
            if(element.whitelisted==1){
                expectedOutcome.activeDevices.push(element);
            } else{
                expectedOutcome.inActiveDevices.push(element);
            }
            
        });

        var locationId, locationName;
        token = await TokenGenerators.generateAuthToken("l1serviceuser");

        for(var i = 0; i<expectedOutcome.activeDevices.length; i++){
            locationId = expectedOutcome.activeDevices[i].sgc;
            locationName = await ApiHelper.getLocationNameByID(token, customerId, locationId);
            expectedOutcome.activeDevices[i].sgc=locationName;
        }

        for(var i = 0; i<expectedOutcome.inActiveDevices.length; i++){
            locationId = expectedOutcome.inActiveDevices[i].sgc;
            locationName = await ApiHelper.getLocationNameByID(token, customerId, locationId);
            expectedOutcome.inActiveDevices[i].sgc=locationName;
        }

        await basePage.navigateToUrl("l1serviceuser");
		await customerListPage.searchCustomer(customer);
		await customerListPage.selectCustomer(customer);
        
        await customerDetailsPage.selectCMInstance(deviceId);        
        await customerDetailsPage.selectCMInstanceDevices(deviceId);
        expect(await customerDetailsPage.getDeviceId()).toEqual(deviceId);

        var activeDevicesTable = await customerDetailsPage.getActiveDevicesTable();
        expect(await customerDetailsPage.validateDevicesTableData(activeDevicesTable, expectedOutcome.activeDevices)).not.toContain(false)

        var inactiveDevicesTable = await customerDetailsPage.getInactiveDevicesTable();
        expect(await customerDetailsPage.validateDevicesTableData(inactiveDevicesTable, expectedOutcome.inActiveDevices)).not.toContain(false)

	});
    //US#74499 US#385645
    test('L1 user should be able to see informational messages where there is no data for active and inactive devices @74499 @385645', async function({page}){
        test.slow();
       
        
        console.log("customerId: "+customer)
        console.log("deviceId: "+deviceId)
        
        await basePage.navigateToUrl("l1serviceuser");
		await customerListPage.searchCustomer(customer);
		await customerListPage.selectCustomer(customer);
       
        await customerDetailsPage.selectCMInstance(deviceId);        
        await customerDetailsPage.selectCMInstanceDevices(deviceId);
        expect(await customerDetailsPage.getDeviceId()).toEqual(deviceId);
        expect(await customerDetailsPage.getPageHeaderInDevicesTab()).toEqual("Device configuration");
        expect(await customerDetailsPage.getActiveDevicesHeaderInDevicesTab()).toEqual("Active devices");
        expect(await customerDetailsPage.getInactiveDevicesHeaderInDevicesTab()).toEqual("Inactive devices");
        expect(await customerDetailsPage.getActiveDevicesTableColumnsInDevicesTab()).toEqual(['NAME','DEVICE IDENTIFIER','DEVICE SERIAL','AE TITLE','DEVICE LOCATION','IP ADDRESS/HOSTNAME','PORT',''])
        expect(await customerDetailsPage.getInactiveDevicesTableColumnsInDevicesTab()).toEqual(['NAME','DEVICE IDENTIFIER','DEVICE SERIAL','AE TITLE','DEVICE LOCATION','IP ADDRESS/HOSTNAME','PORT',''])

        expect(await customerDetailsPage.getInactiveDevicesDisclaimerText()).toEqual('INFO: The devices listed below are inactive and they do not transfer any data to the Connectivity Module.')
        expect(await customerDetailsPage.isEmptyActiveDevicesMessagePresent()).toEqual(true)
        expect(await customerDetailsPage.isEmptyInactiveDevicesMessagePresent()).toEqual(true)

    })

    test.afterEach(async function({page}){
        
        token = await TokenGenerators.generateAuthToken("l1serviceuser");
        await ApiHelper.deleteAll_ActiveDevice(token, deviceId);
        await ApiHelper.deleteAll_InActiveDevice(token, deviceId);
        await ApiHelper.deleteAll_AutomationDeviceLocations(token, customerId);
    })

   
});
