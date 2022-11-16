const { TokenGenerators } = require('../../../utils/token_generators.js');
const { default: test, expect } = require('@playwright/test');
var OR = require('../../../resources/OR.json');
const excludePackage = require("../../../resources/foss-package-to-exclude.json")
const { LicensesUtil } = require('../../../utils/licenses_util');

const apimOSSLicensesURL = process.env.apimBaseURL + OR.APIUrls.cmPackageLicense;
var token;

test.describe("OSS Licenses statement API for L1 user", function () {
  test.beforeAll(async function () {
    token = await TokenGenerators.generateAuthToken("l1serviceuser")
  })

  // US#98432
  test("should fetch the OSS Licenses statement with L1 user @98432", async function () {
    var config = {
      method: 'get',
      url: apimOSSLicensesURL,
      headers: { "Authorization": "Bearer " + token },
    };

    var response = await TokenGenerators.request(config);
    expect(response.status).toBe(200);
    expect(response.data.length).not.toBe(0);
  });

  // US#316750
  test("should verify all the licenses in license blob match with BlackDuck @316750", async () => {
    const bdpackages = await LicensesUtil.getBlackDuckResult();
    const fossLicenseContent = await LicensesUtil.getLicense();

    expect(LicensesUtil.getTotalPackages(fossLicenseContent, bdpackages.items)).toBe(bdpackages.totalCount);

    for (let item of bdpackages.items) {
      if (!excludePackage[item.componentName]) {
        let indexOf = fossLicenseContent.indexOf(`${item.componentName} ${item.componentVersionName}`);
        expect(indexOf).not.toBe(-1);

        let pkgDescription = LicensesUtil.getPackageDescription(fossLicenseContent, indexOf);
        let licenseExists = pkgDescription.includes(LicensesUtil.getLicenseString(item.licenses));
        expect(licenseExists).toBe(true);

        expect(LicensesUtil.isCopyrightTextPresent(fossLicenseContent, indexOf)).toBe(true);
      }
    }
  });
});