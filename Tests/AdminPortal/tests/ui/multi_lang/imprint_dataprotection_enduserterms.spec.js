const{ BasePage } = require('../../../pages/base_page.js');
const { LicensePage } = require('../../../pages/license_page');
const{ HomePage } = require('../../../pages/home_page');
const { TestData } = require('../../../utils/test_data.js');
const { test, expect } = require('@playwright/test');
var basePage, homePage, licensePage,conn,deviceId,customerDetailsId,customerDetailsRecordSet,customerId,customerName;
var testDevice = process.env.serviceUserHypervDeviceId;

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

test.describe('Multi-language check for sidebar with L1 user', function (){
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
        
        console.log("customerName: "+customerName)
        console.log("customerId: "+customerId)
    });
    test.beforeEach(async function({page}){
        basePage = new BasePage(page);
        homePage= new HomePage(page);
        licensePage = new LicensePage(page);
    })

    // US#307707
    test('Check Imprint page with multilanguage @98435 @307707 @326276', async function({page}){  
        
		await basePage.navigateToUrl("l1serviceuser");
		expect(await basePage.verifyloggedInUsername("l1serviceuser")).toEqual(true);
		// await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
		await homePage.clickPublisher(); 
        var actualUrl = await homePage.getNewTabUrl(); 
        var expectedUrl= await LAN.imprintUrl;     
        expect(actualUrl).toEqual(expectedUrl);
        await page.close()
		
	});

    // US#307707
    test('Check dataProtection page with multilanguage @98435 @307707 @326276', async function({page}){  
       
		await basePage.navigateToUrl("l1serviceuser");
		// await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
		await licensePage.clickDataProtectionStatement();
        var actualUrl = await homePage.getNewTabUrl(); 
        var expectedUrl= await LAN.dataProtection;     
        expect(actualUrl.includes(expectedUrl)).toBe(true);
        await page.close()
        		
	});

    // US#307707
    test('Check endUserTerms page with multilanguage @98435 @307707 @326276', async function({page}){  
        
		await basePage.navigateToUrl("l1serviceuser");
		// await homePage.clickSettings(); commenting out as settings button is descoped till integration with HDP
		await licensePage.clickEndUserTerms(); 
        var actualUrl = await homePage.getNewTabUrl(); 
        var expectedUrl= await LAN.endUserTermsUrl;     
        expect(actualUrl.includes(expectedUrl)).toBe(true);
        await page.close()
        		
	});	
});