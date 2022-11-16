var OR = require("../resources/OR.json");
const { BasePage } = require('../pages/base_page.js');
const { Comparisions } = require('../utils/comparisions.js');
const { test, expect } = require('@playwright/test');

var date = require('date-and-time');
exports.LogFileRequestPage = class LogFileRequestPage {

  constructor(page) {
    this.page = page;
    this.basePage = new BasePage(page);

  }
  async getLogFileTable() {
    return await this.page.locator('xpath=' + OR.locators.customerDetailsPage.serviceRequestPage.logFileTable);
  };

  async clickonRefreshButton() {
    await this.page.waitForTimeout(5000);
    await this.page.locator('id=' + OR.locators.customerDetailsPage.serviceRequestPage.refreshButton).click();
    await this.page.waitForSelector('xpath=' + OR.locators.customerDetailsPage.serviceRequestPage.logFileTable, { waitFor: 'visible', timeout: 60000 });
    await this.page.waitForTimeout(3000);
  };

  async clickonRequestLogButton() {
    await this.page.waitForSelector('xpath=' + OR.locators.customerListPage.loadSpinner, { state: 'hidden', timeout: 60000 });
    await this.page.waitForTimeout(3000);
    await this.basePage.scrollElemFinderIntoView('xpath=' + OR.locators.customerDetailsPage.serviceRequestPage.requestLogButton);  
    await this.page.locator('xpath=' + OR.locators.customerDetailsPage.serviceRequestPage.requestLogButton).click();
    await this.page.waitForTimeout(3000);
  };

  async moduleNameValidationMessage() {
    return await this.page.locator('xpath=' + OR.locators.customerDetailsPage.serviceRequestPage.moduleSelectionErrormessage);
  };

  async aeTitleValidationMessage() {
    return await this.page.locator('id=' + OR.locators.customerDetailsPage.deviceDetailsForm.aeTitleValidationMessage);
  };

  async getModuleNames() {
    var moduleNames = await this.page.$$('xpath=' + OR.locators.customerDetailsPage.serviceRequestPage.allContainers);
    var modules = [];
    var len = moduleNames.length
    for (var i = 0; i < len; i++) {
      var text = (await moduleNames[i].textContent()).trim()
      modules.push(text ? text : "null");
    }
    return modules;

  };

  async compareModulesListed(modules) {
    var actualmodules = modules;    
    var expectedmodules = ["DICOM Forwarder","ZSS 1","ZSS 2","ZVI","Management","Edge Agent","Edge Hub","Streaming"]
    var comp = await Comparisions.compareObjects(actualmodules, expectedmodules)
    // expect(comp).toBe(true);
    return comp;
}

  async selectModuleName(modulesList) {
    await this.page.evaluate('document.querySelector("zui-select#frm-inp-module-select").shadowRoot.querySelector("zui-select-button").click()');
    await this.page.waitForTimeout(5000);
    for (var k = 0; k < modulesList.length; k++) {
      if (modulesList[k].match("All")) {
        await this.page.evaluate(() => document.querySelector('zui-portal').shadowRoot.querySelector('zui-menu').querySelector('zui-select-all').click());
      } else {
        switch (modulesList[k].toLowerCase()) {
          case 'zssmodule': await this.page.evaluate(() => document.querySelector('zui-portal').shadowRoot.querySelector('zui-menu').querySelector('zui-menu-item[value="zssmodule"]').click()); break;
          case 'zvimodule': await this.page.evaluate(() => document.querySelector('zui-portal').shadowRoot.querySelector('zui-menu').querySelector('zui-menu-item[value="zvimodule"]').click()); break;
          case 'dicomforwardermodule': await this.page.evaluate(() => document.querySelector('zui-portal').shadowRoot.querySelector('zui-menu').querySelector('zui-menu-item[value="dicomforwardermodule"]').click()); break;
          case 'managementmodule': await this.page.evaluate(() => document.querySelector('zui-portal').shadowRoot.querySelector('zui-menu').querySelector('zui-menu-item[value="management"]').click()); break;
          case 'edgeagent': await this.page.evaluate(() => document.querySelector('zui-portal').shadowRoot.querySelector('zui-menu').querySelector('zui-menu-item[value="edgeAgent"]').click()); break;
          case 'edgehub': await this.page.evaluate(() => document.querySelector('zui-portal').shadowRoot.querySelector('zui-menu').querySelector('zui-menu-item[value="edgeHub"]').click()); break;
          case 'streamingmodule': await this.page.evaluate(() => document.querySelector('zui-portal').shadowRoot.querySelector('zui-menu').querySelector('zui-menu-item[value="streamingmodule"]').click()); break;
          case 'zrsmodule': await this.page.evaluate(() => document.querySelector('zui-portal').shadowRoot.querySelector('zui-menu').querySelector('zui-menu-item[value="zrsmodule"]').click()); break;

        }
      }
    }
    await this.page.waitForTimeout(3000);
    await this.page.evaluate('document.querySelector("zui-select#frm-inp-module-select").shadowRoot.querySelector("zui-select-button").click()');
    // await this.page.locator('xpath='+OR.locators.customerDetailsPage.serviceRequestPage.OpenModuleNameDropdown).click();
    await this.page.waitForTimeout(3000);
  };
  async selectFileFormat(fileformat) {
    await this.page.evaluate('document.querySelector("zui-select#frm-inp-file-format").shadowRoot.querySelector("zui-select-button").click()');
    await this.page.waitForTimeout(2000);
    await this.page.evaluate("document.querySelector('zui-portal').shadowRoot.querySelector('zui-menu').querySelector('zui-menu-item[value=\"" + fileformat + "\"]').click()");
    await this.page.evaluate('document.querySelector("zui-select#frm-inp-file-format").shadowRoot.querySelector("zui-select-button").click()');
    await this.page.waitForTimeout(2000);
  };
  async selectEntriesfrom(DateFrom) {
    await this.page.evaluate("document.querySelector('zui-textfield-date-picker#frm-inp-date-start').shadowRoot.querySelector('zui-date-picker-input').shadowRoot.querySelector('div').querySelectorAll('zui-date-picker-input-part')[0].value=\'" + DateFrom.split("/")[0] + "\'");
    await this.page.evaluate("document.querySelector('zui-textfield-date-picker#frm-inp-date-start').shadowRoot.querySelector('zui-date-picker-input').shadowRoot.querySelector('div').querySelectorAll('zui-date-picker-input-part')[1].value=\'" + DateFrom.split("/")[1] + "\'");
    await this.page.evaluate("document.querySelector('zui-textfield-date-picker#frm-inp-date-start').shadowRoot.querySelector('zui-date-picker-input').shadowRoot.querySelector('div').querySelectorAll('zui-date-picker-input-part')[2].value=\'" + DateFrom.split("/")[2] + "\'");
    await this.page.waitForTimeout(1000);
  };
  async selectEntriesuntil() {
    let today = new Date();
    let untilDate = date.format(today, 'MM/DD/YYYY');
    await this.page.evaluate("document.querySelector('zui-textfield-date-picker#frm-inp-date-end').shadowRoot.querySelector('zui-date-picker-input').shadowRoot.querySelector('div').querySelectorAll('zui-date-picker-input-part')[0].value=\'" + untilDate.split("/")[0] + "\'");
    await this.page.evaluate("document.querySelector('zui-textfield-date-picker#frm-inp-date-end').shadowRoot.querySelector('zui-date-picker-input').shadowRoot.querySelector('div').querySelectorAll('zui-date-picker-input-part')[1].value=\'" + untilDate.split("/")[1] + "\'");
    await this.page.evaluate("document.querySelector('zui-textfield-date-picker#frm-inp-date-end').shadowRoot.querySelector('zui-date-picker-input').shadowRoot.querySelector('div').querySelectorAll('zui-date-picker-input-part')[2].value=\'" + untilDate.split("/")[2] + "\'");
    await this.page.waitForTimeout(1000);

  };
  async selectLogLevel(logLevel) {
    await this.page.locator('id=' + OR.locators.customerDetailsPage.serviceRequestPage.OpenModuleName2DropDown).click();
    // await this.page.locator('xpath='+"//zui-select[@id='frm-inp-log-level']//zui-select-option[contains(text(),'"+logLevel+"')]")).click();
    switch (logLevel) {
      case 'Verbose': await this.page.evaluate(() => document.querySelector('zui-select#frm-inp-log-level').setAttribute('value', '7')); break;
      case 'Debug': await this.page.evaluate(() => document.querySelector('zui-select#frm-inp-log-level').setAttribute('value', '6')); break;
      case 'Information': await this.page.evaluate(() => document.querySelector('zui-select#frm-inp-log-level').setAttribute('value', '5')); break;
      case 'Warning': await this.page.evaluate(() => document.querySelector('zui-select#frm-inp-log-level').setAttribute('value', '4')); break;
      case 'Error': await this.page.evaluate(() => document.querySelector('zui-select#frm-inp-log-level').setAttribute('value', '3')); break;
      case 'Fatal': await this.page.evaluate(() => document.querySelector('zui-select#frm-inp-log-level').setAttribute('value', '0')); break;
    }
    await this.page.locator('id=' + OR.locators.customerDetailsPage.serviceRequestPage.OpenModuleName2DropDown).click();

  };
  async enterNumberOfEntries(numberOfEntries) {
    var numEntry = await this.page.locator('css=zui-textfield#frm-inp-entries input#raw')
    await numEntry.fill(numberOfEntries);
    await this.page.waitForTimeout(1000);
  };
  async clickonCreateLogfileOrCancelBtn(buttonToClick) {
    if (buttonToClick.includes("Create log file")) {
      this.page.evaluate(() => document.querySelector('zui-dialogbox').shadowRoot.querySelector('footer').querySelector('button#accept-button').click());
    } else if (buttonToClick.includes("Cancel")) {
      await this.page.evaluate(() => document.querySelector('zui-dialogbox').shadowRoot.querySelector('footer').querySelector('button#cancel-button').click());
    }
    var ele = await this.page.waitForSelector('xpath=' + OR.locators.customerDetailsPage.serviceRequestPage.logFileTable, { waitFor: 'visible', timeout: 60000 });
  };

  async selectCMInstanceService() {
    await basePage.scrollElemFinderIntoView('xpath=' + OR.locators.customerDetailsPage.serviceRequestPage.service);
    await this.page.waitForTimeout(2000);
    await this.page.locator('xpath=' + OR.locators.customerDetailsPage.serviceRequestPage.service).click();
    await this.page.waitForSelector('xpath=' + OR.locators.customerDetailsPage.serviceRequestPage.logFileTable, { waitFor: 'visible', timeout: 60000 });
  };

  async selectCMInstanceService(deviceId) {
    await this.basePage.scrollElemFinderIntoView('xpath=' + "//zui-list-accordion[@header-text='" + deviceId + "']//parent::zui-list-accordion/zui-list-accordion-item[@id='btn-service']");
    await this.page.waitForTimeout(2000)
    await this.page.locator('xpath=' + "//zui-list-accordion[@header-text='" + deviceId + "']//parent::zui-list-accordion/zui-list-accordion-item[@id='btn-service']").click();
    await this.page.waitForTimeout(1000)
  }

  async getServiceConsolePassword() {
    await this.page.locator('xpath=' + OR.locators.customerDetailsPage.serviceRequestPage.passwordunhideICON).click();
    return (await this.page.inputValue('id=' + OR.locators.customerDetailsPage.serviceRequestPage.passwordData));
  };

  async getrowDatafromLogFileTables(table) {
    var rows = await this.page.$$('xpath=' + ".//tbody//tr");
    const uiData = [];
    for (var i = 0; i < rows.length; i++) {
      var rowdata = await this.basePage.getRowText(rows[i]);

      var status;
      if (rowdata[2] == "Available for download") {
        status = 1;
      } else {
        status = 0;
      }

      var obj = {
        fileName: rowdata[0],
        modifiedTime: Date.parse(rowdata[1]),
        status: status,
      };

      uiData.push(obj);
    }

    return uiData;
  };

  async getConsoleHeader() {
    await this.page.waitForSelector('id=' + OR.locators.customerDetailsPage.serviceRequestPage.textConsoleHeader);
    return await this.page.locator('id=' + OR.locators.customerDetailsPage.serviceRequestPage.textConsoleHeader);
  }

  async getLogfileHeader() {
    await this.page.waitForSelector('id=' + OR.locators.customerDetailsPage.serviceRequestPage.textLogfileHeader);
    return await this.page.locator('id=' + OR.locators.customerDetailsPage.serviceRequestPage.textLogfileHeader);
  }

  async waitTillLogFilePageLoads(waitTime = 60000) {
    var loadSpinner = await this.page.locator('xpath=' + OR.locators.customerListPage.loadSpinner, { state: 'hidden', timeout: waitTime });
    await this.page.waitForTimeout(2000);
  }


  //Network Diagnosis section

  async getStartDiagButtoninitialState() {
    return await this.page.locator('xpath=' + OR.locators.customerDetailsPage.serviceRequestPage.StartDiagnosisBtn).getAttribute('disabled');
  }

  async getLogFileButtoninitialState() {
    return await this.page.locator('xpath=' + OR.locators.customerDetailsPage.serviceRequestPage.clickonRequestNewLogfileBtn).getAttribute('disabled');
  }

  async selectDiagnosisType(type) {

    await this.page.evaluate("document.querySelector('#select-diagnosisType').shadowRoot.querySelector('zui-select-button').click()");
    await this.page.waitForTimeout(1000);
    await this.page.evaluate("document.querySelector('zui-portal').shadowRoot.querySelector('zui-menu').querySelector('zui-menu-item[value=\"" + type + "\"]').click()");
    await this.page.waitForTimeout(3000);
    var diagval = await this.page.locator('xpath=' + OR.locators.customerDetailsPage.serviceRequestPage.DiagnosisType).getAttribute('value')
    expect(diagval).toBe(type);
  }

  async getDiagnosisType() {

    return await this.page.locator('xpath=' + OR.locators.customerDetailsPage.serviceRequestPage.DiagnosisType).getAttribute('value')

  }
  async enterDiagnosisAddress(address) {
    var diagadd = await this.page.locator('css=zui-textfield[placeholder=\"Enter IP address or hostname\"] input#raw')
    await diagadd.fill(address);
    await diagadd.press('Enter');
    await this.page.waitForTimeout(10000);
  }

  async getDiagnosisAddress() {
    return await this.page.locator('xpath=' + OR.locators.customerDetailsPage.serviceRequestPage.DestinationAdd).getAttribute('value')

  }
  async selectStartDiagnosis() {
    var state = await this.page.locator('xpath=' + OR.locators.customerDetailsPage.serviceRequestPage.StartDiagnosisBtn).getAttribute('disabled');
    expect(state).toBe(null);
    await this.page.locator('xpath=' + OR.locators.customerDetailsPage.serviceRequestPage.StartDiagnosisBtn).click();
    await this.page.waitForTimeout(5000);
  }

  async getnetworkdiagresponse() {
    await this.page.waitForSelector('xpath=' + OR.locators.customerListPage.loadSpinner, { state: 'hidden', timeout: 150000 });
    await this.page.waitForTimeout(15000);
    var resp = await this.page.locator('css=zui-dialogbox.parent-dialog-start-diagnosis div#txt-network-diagnosis-response').innerText();
    return resp;
  }

  async Okbuttonpresent() {
    return await this.page.locator('css=zui-dialogbox.parent-dialog-start-diagnosis button#accept-button').isVisible();
  }
  async closeResponseboxwithOkbutton() {
    await this.page.locator('css=zui-dialogbox.parent-dialog-start-diagnosis button#accept-button').click();
  }

  async closeResponseboxwithCrossbutton() {
    await this.page.evaluate("document.querySelector('zui-dialogbox').shadowRoot.querySelector('zui-icon-bar').shadowRoot.querySelector('zui-interactive-icon#closebutton').click()");
  }


  async isCrossbuttonPresent() {
    console.log(await this.page.evaluate("document.querySelector('zui-dialogbox').shadowRoot.querySelector('zui-icon-bar').shadowRoot.querySelector('zui-interactive-icon#closebutton').getAttribute('id')"));
    return await this.page.evaluate("document.querySelector('zui-dialogbox').shadowRoot.querySelector('zui-icon-bar').shadowRoot.querySelector('zui-interactive-icon#closebutton').getAttribute('id')") == 'closebutton' ? true : false;
  }

  async getErrorMsg() {
    return await this.page.evaluate("document.querySelector('zui-error-message').textContent");

  }

  async cancelbuttonpresent() {
    return await this.page.locator('css=zui-dialogbox.parent-dialog-start-diagnosis button#cancel-button').isVisible();
  }
  async closeResponseboxwithcancel() {
    await this.page.locator('css=zui-dialogbox.parent-dialog-start-diagnosis button#cancel-button').click();
  }


};
