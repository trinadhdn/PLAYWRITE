const { TokenGenerators } = require('../../../utils/token_generators.js');
const { Comparisions } = require('../../../utils/comparisions.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
var OR = require('../../../resources/OR.json');
const apimConnectivityModuleListURL = process.env.apimBaseURL + OR.APIUrls.connectivityModuleListUrl;
var token,customerDetailsId,custId,conn,customerDetailsRecordSet;

test.describe("Connectivity Module List API",function(){
    test.beforeAll(async function(){
        conn = await TestData.sqlDBConnection();
        customerDetailsRecordSet = await TestData.executeSqlQuery(conn,"select top(1) * from [dbo].[CustomerDetails] for json auto")
        var customerDetailsRecord = JSON.parse(customerDetailsRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        custId = customerDetailsRecord[0].customerId;
        customerDetailsId = customerDetailsRecord[0].customerDetailsId;
        token = await TokenGenerators.generateAuthToken("l1serviceuser");  
    });
    //US#74461
    test("L1 user should fetch all the connectivity module instances for the provided customerId @74461 @177412", async function(){
        conn = await TestData.sqlDBConnection();
        var recordSet = await TestData.executeSqlQuery(conn,"SELECT deviceId,iotDeviceId,activationStatus,groupId from [dbo].[Device] where customerDetailsId ='"+customerDetailsId+"' ORDER By deviceId ASC for json auto");
        var dbData = JSON.parse(recordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
        var config = {  
            method: 'get',
            url: apimConnectivityModuleListURL+"/"+custId+"/devices",
          
            headers: { "Authorization": "Bearer "+token },
        };

        var response = await TokenGenerators.request(config);
        var apiData = response.data
        var areEqual= new Array(), apiJSON,dbJSON;
        
        expect(response.status).toBe(200);
        
        if(apiData.length <= dbData.length){
            for(var i=0;i < apiData.length; i++){               
                apiJSON = JSON.parse(JSON.stringify(apiData[i]));
                dbJSON = JSON.parse(JSON.stringify(dbData[i]));
                areEqual.push(Comparisions.compareObjects(apiJSON,dbJSON));
            }
        } else {
            areEqual.push(false);
        }
        expect(areEqual).not.toContain(false);

    });
    //US#74461
    test("L1 user should throw an error when a Customer Id with special characters is passed as parameter @74461 @177412", async function(){
        var config = {  
            method: 'get',
            url: apimConnectivityModuleListURL+"/"+"Hello&123"+"/devices",
      
            headers: { "Authorization": "Bearer "+token },
        };

        var response = await TokenGenerators.request(config);
        var apiData = response.data
        expect(response.status).toBe(400);
        expect(apiData).toBe("Customer Id is invalid.")
    });
    //US#74461
    test("L1 user should throw an error when a Customer Id is NOT passed as parameter @74461 @177412", async function(){
        var config = {  
            method: 'get',
            url: apimConnectivityModuleListURL+"/devices",
            headers: { "Authorization": "Bearer "+token },
        };

        var response = await TokenGenerators.request(config);
        var apiData = response.data
        expect(response.status).toBe(404);
    });
    //US#74461 -- #Issue-->Need to Fix throwing 403
    test("L1 user should throw an error when empty Customer Id is passed as parameter @74461 @177412", async function(){
        var config = {  
            method: 'get',
            url: apimConnectivityModuleListURL+"/"+" "+"/devices",
           headers: { "Authorization": "Bearer "+token },
        };

        var response = await TokenGenerators.request(config);
        var apiData = response.data
        expect(response.status).toBe(400);
        expect(apiData).toBe("Customer Id should be not empty.")
    });
  
});