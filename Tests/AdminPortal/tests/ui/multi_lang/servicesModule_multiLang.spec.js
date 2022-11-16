const { BasePage } = require('../../../pages/base_page.js');
const { ServicePage } = require('../../../pages/languages/services_page.js');
const { TestData } = require('../../../utils/test_data.js');
const { CustomerListPage } = require('../../../pages/customer_list_page.js');
const { CustomerDetailsPage } = require('../../../pages/customer_details_page.js');
const { LogFileRequestPage } = require("../../../pages/service_logFile_page.js");
const { test, expect } = require('@playwright/test');
var testDevice = process.env.serviceUserHypervDeviceId;
var basePage,ServicesPage_ML,customerListPage,customerDetailsPage,logFileRequestPage;

var customerId, customerName, customerDetailsRecordSet ,conn,deviceId,customerDetailsId;
test.describe('Multi-language check for Services module with L1 user', function(){
    test.beforeAll(async function(){
        // test data preparation     
        conn = await TestData.sqlDBConnection();
        var devicesRecordSet = await TestData.executeSqlQuery(conn,"select top(1) * from [dbo].[Device] where iotdeviceId ='"+testDevice+"' and activationStatus='True' for json auto")
        var deviceRecord = JSON.parse(devicesRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        deviceId = deviceRecord[0].iotDeviceId;
        customerDetailsId = deviceRecord[0].customerDetailsId ;
        conn = await TestData.sqlDBConnection();
        customerDetailsRecordSet = await TestData.executeSqlQuery(conn,"select * from [dbo].[CustomerDetails] where customerdetailsId="+customerDetailsId+" for json auto")
        var customerDetailsRecord = JSON.parse(customerDetailsRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        customerId = customerDetailsRecord[0].customerId;
        customerName = customerDetailsRecord[0].customerName;
        
        console.log("customerName: "+customerName)
        console.log("customerId: "+customerId)
    });

    test.beforeEach(async function({page}){
        basePage = new BasePage(page);
        ServicesPage_ML = new ServicePage(page);
        customerListPage = new CustomerListPage(page);
        customerDetailsPage = new CustomerDetailsPage(page);
        logFileRequestPage = new LogFileRequestPage(page);
    })
    
    // US#177466 US#307707
	test("Check Services screen with Multi Languages @177466 @307707 @326276",async function(){
    // Navigate to Customer list page
        await basePage.navigateToUrl("l1serviceuser");
        await customerListPage.searchCustomer(customerId);
        await customerListPage.selectCustomer(customerId);
        await customerDetailsPage.selectCMInstance(deviceId);

        await customerDetailsPage.selectCMInstanceService(deviceId);

        expect(await ServicesPage_ML.compareLogfilesHeader_LabelText()).toEqual(true)
        expect(await ServicesPage_ML.comparePasswordforvirtualmachine_LabelText()).toEqual(true)
        expect(await ServicesPage_ML.compareRefresh_LabelText()).toEqual(true)

        expect(await ServicesPage_ML.compareCreateLogFile_LabelText()).  toEqual(true)
        expect(await ServicesPage_ML.compareName_LabelText()).toEqual(true)
        expect(await ServicesPage_ML.compareCreationDate_LabelText()).toEqual(true)
        expect(await ServicesPage_ML.compareStatus_LabelText()).toEqual(true)
 
       

    });


     
    // US#177466177466
	test("Check Request LogFiile screen with Multi Languages @177466 @326276",async function(){
        // Navigate to Customer list page
            await basePage.navigateToUrl("l1serviceuser");
            await customerListPage.searchCustomer(customerId);
            await customerListPage.selectCustomer(customerId);
            await customerDetailsPage.selectCMInstance(deviceId);
    
            await customerDetailsPage.selectCMInstanceService(deviceId);
  
            await logFileRequestPage.clickonRequestLogButton();
            expect(await ServicesPage_ML.compareLogfilesHeader_LabelText()).toEqual(true)
            expect(await ServicesPage_ML.compareName_LabelText()).toEqual(true)
            expect(await ServicesPage_ML.compareCreationDate_LabelText()).toEqual(true)
            expect(await ServicesPage_ML.compareStatus_LabelText()).toEqual(true)
            expect(await ServicesPage_ML.comparemodalTitle_LabelText()).toEqual(true)
            expect(await ServicesPage_ML.comparemoduleSelectLabel_LabelText()).toEqual(true)
            expect(await ServicesPage_ML.compareEntriesFromLabel_LabelText()).toEqual(true)
            expect(await ServicesPage_ML.compareEntriesUntilLabel_LabelText()).toEqual(true)
            expect(await ServicesPage_ML.compareLogLevelFromLabel_LabelText()).toEqual(true)
            expect(await ServicesPage_ML.comparenumberOfEntriesLabel_LabelText()).toEqual(true)
            expect(await ServicesPage_ML.comparefileFormatLabel_LabelText()).toEqual(true)
            expect(await ServicesPage_ML.compareCreateLogLabelText()).toEqual(true)
            expect(await ServicesPage_ML.compareExitLogLabelText()).toEqual(true)
            expect(await ServicesPage_ML.compareselectContainerPlaceholder()).toEqual(true)
            expect(await ServicesPage_ML.comparelogfileEntriesPlaceholder()).toEqual(true)
            await ServicesPage_ML.clickExitLogLabelText();

            //Network Diagnosis Section

            expect(await ServicesPage_ML.comparetitleNetworkDiagnosis()).toEqual(true)
            expect(await ServicesPage_ML.comparestartDiagnosisButtonText()).toEqual(true)
            expect(await ServicesPage_ML.comparediagnosisTypeLabel()).toEqual(true)
            expect(await ServicesPage_ML.comparedestinationAddressLabel()).toEqual(true)
            expect(await ServicesPage_ML.comparedestinationAddressPlaceholder()).toEqual(true)
            await ServicesPage_ML.enterDiagnosisAddress("1.11...");
            expect(await ServicesPage_ML.comparedestinationAddressRequirederror()).toEqual(true)
    
        });
    
   
	
});
