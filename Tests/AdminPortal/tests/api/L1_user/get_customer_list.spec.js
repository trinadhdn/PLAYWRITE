const { TokenGenerators } = require('../../../utils/token_generators.js');
const { Comparisions } = require('../../../utils/comparisions.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js'); 
var OR = require('../../../resources/OR.json');

const apimCustomerListURL = process.env.apimBaseURL + OR.APIUrls.customerListUrl;
var token,customerName,customerId;

test.describe("Customer List API",function(){
  test.beforeAll(async function(){
    token = await TokenGenerators.generateAuthToken("l1serviceuser");
  })
  
  // US#74477
  test("should fetch all the items when no filter key is provided @74477", async function(){
    var conn = await TestData.sqlDBConnection();
    var query= "select distinct c.customerDetailsId, c.customerName,c.customerId,null as country, d.sapCustomerId from CustomerDetails as c left join Device as d ON c.customerDetailsId=d.customerDetailsId for json path, INCLUDE_NULL_VALUES"
    var customerRecordSet = await TestData.executeSqlQuery(conn,query)
    var dbData = JSON.parse(customerRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    var config = {  
      method: 'get',
      url: apimCustomerListURL,
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

  // US#74477
  test("when customerName filter key is provided, L1 user should fetch all the items whose customerName contains the filter key @74477", async function() {
    var conn = await TestData.sqlDBConnection();
    var customerRecordSet = await TestData.executeSqlQuery(conn,"SELECT top(1) * FROM CustomerDetails for json auto")
    var customerRecord = JSON.parse(customerRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    
    customerName = customerRecord[0].customerName;
    
    customerRecordSet = await TestData.executeSqlQuery(conn,"select customerDetailsId,customerName,customerId,null as country FROM CustomerDetails where customerName like '%"+customerName+"%' for json auto,INCLUDE_NULL_VALUES")
    var dbData = JSON.parse(customerRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    var config = {  
      method: 'get',
      url: apimCustomerListURL,
      params: {
        filterKey: customerName
      },
      headers: { "Authorization": "Bearer "+token },
    };
    
    var response = await TokenGenerators.request(config);
    var apiData = response.data
    var areEqual= new Array(), apiJSON,dbJSON;
    expect(response.status).toBe(200);
    if(apiData.length == dbData.length){
      for(var i=0;i < apiData.length; i++){
        
        console.log(JSON.stringify(apiData[i]));
        console.log(JSON.stringify(dbData[i]));
        apiJSON = JSON.parse(JSON.stringify(apiData[i]));
        dbJSON = JSON.parse(JSON.stringify(dbData[i]));
        areEqual.push(Comparisions.compareObjects(apiJSON,dbJSON));
      }
    } else {
      areEqual.push(false);
    }
    expect(areEqual).not.toContain(false);
  });

  // US#74477
  test("when customerId filter key is provided, L1 user should fetch all the items whose customerId contains the filter key @74477", async function() {
    var conn = await TestData.sqlDBConnection();
    var customerRecordSet = await TestData.executeSqlQuery(conn,"SELECT top(1) * FROM CustomerDetails for json auto")
    var customerRecord = JSON.parse(customerRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    
    customerId = customerRecord[0].customerId;
    
    customerRecordSet = await TestData.executeSqlQuery(conn,"select customerDetailsId,customerName,customerId,null as country FROM CustomerDetails where customerId like '%"+customerId+"%' for json auto,INCLUDE_NULL_VALUES")
    var dbData = JSON.parse(customerRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    var config = {  
      method: 'get',
      url: apimCustomerListURL,
      params: {
        filterKey: customerId
      },
      headers: { "Authorization": "Bearer "+token },
    };
    
    var response = await TokenGenerators.request(config);
    var apiData = response.data
    var areEqual= new Array(), apiJSON,dbJSON;
    expect(response.status).toBe(200);
    if(apiData.length == dbData.length){
      for(var i=0;i < apiData.length; i++){
        
        console.log(JSON.stringify(apiData[i]));
        console.log(JSON.stringify(dbData[i]));
        apiJSON = JSON.parse(JSON.stringify(apiData[i]));
        dbJSON = JSON.parse(JSON.stringify(dbData[i]));
        areEqual.push(Comparisions.compareObjects(apiJSON,dbJSON));
      }
    } else {
      areEqual.push(false);
    }
    expect(areEqual).not.toContain(false);
  });
});