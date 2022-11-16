const { TokenGenerators } = require('../../../utils/token_generators.js');
const { Comparisions } = require('../../../utils/comparisions.js');
const { default: test, expect } = require('@playwright/test');
const { TestData } = require('../../../utils/test_data.js');
var OR = require('../../../resources/OR.json');
let { ApiHelper } = require('../../../helpers/api-helpers.js');

const apimGroupListURL = process.env.apimBaseURL + OR.APIUrls.groupListURL;
var token;

test.describe("Group List API", function () {
  test.beforeAll(async function () {
    token = await TokenGenerators.generateAuthToken("l1serviceuser");
  })

  // US#177337
  test("GroupList API for L1 user should fetch all the available timeframe groups for updates @177337", async function () {
    var conn = await TestData.sqlDBConnection();
    var groupRecordSet = await TestData.executeSqlQuery(conn, "select groupId,groupName,groupCode,startTime,endTime,daysOfWeek from [dbo].[Group] for json auto");
    var dbData = JSON.parse(groupRecordSet['recordset'][0]['JSON_F52E2B61-18A1-11d1-B105-00805F49916B']);
    let response = await ApiHelper.getGroups(token);
    var apiData = response.data
    var areEqual = new Array(), apiJSON, dbJSON;
    expect(response.status).toBe(200);
    console.log(JSON.stringify(apiData[0]));
    console.log(JSON.stringify(dbData[0]));
    if (apiData.length <= dbData.length) {
      for (var i = 0; i < apiData.length; i++) {

        apiJSON = JSON.parse(JSON.stringify(apiData[i]));
        dbJSON = JSON.parse(JSON.stringify(dbData[i]));
        areEqual.push(Comparisions.compareObjects(apiJSON, dbJSON));
      }
    } else {
      areEqual.push(false);
    }
    expect(areEqual).not.toContain(false);

  });
});