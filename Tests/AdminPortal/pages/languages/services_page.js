var OR_ML = require('../../resources/OR_ML.json');
const { BasePage } = require('../../pages/base_page.js');
var LAN;
if (process.env.locale.includes("DE")) {
    LAN = require('../../resources/de.json');

} else if (process.env.locale.includes("FR")) {
    LAN = require('../../resources/fr.json');
}else if (process.env.locale.includes("EN")) {
    LAN = require('../../resources/en.json');
}else if (process.env.locale.includes("ES")) {
    LAN = require('../../resources/es.json');
  }


    exports.ServicePage = class ServicePage{

        constructor(page){
           this.page = page;
           this.basePage = new BasePage(page);
        }


        async compareLogfilesHeader_LabelText() {
        await this.page.waitForTimeout(2000)
        await this.basePage.scrollElemFinderIntoView('xpath='+OR_ML.Service.LogfilesHeader);           
        var actual = await this.page.locator('xpath='+OR_ML.Service.LogfilesHeader).innerText();
        var expected = await LAN.titleLogFile;
        return (actual == expected);
    }



    async comparePasswordforvirtualmachine_LabelText() {
        var actual = await this.page.locator('xpath=' +OR_ML.Service.Passwordforvirtualmachine).innerText();
        var expected = await LAN.titleConsolePwd;
        return (actual == expected);
    }

    async compareRefresh_LabelText() {
        var actual = await this.page.locator('xpath=' +OR_ML.Service.Refresh).innerText();
        var expected = await LAN.refresh;
        return (actual == expected);
    }


    async compareCreateLogFile_LabelText() {
        var actual = await this.page.locator('xpath=' +OR_ML.Service.CreateLogFile).innerText();
        var expected = await LAN.addLog;
        return (actual == expected);
    }

    async compareName_LabelText() {
        var actual = await this.page.locator('xpath=' +OR_ML.Service.Name).innerText();
        var expected = await LAN.fileNameTitle;
        return (actual == expected);
    }

    async compareCreationDate_LabelText() {
        var actual = await this.page.locator('xpath=' +OR_ML.Service.CreationDate).innerText();
        var expected = await LAN.lastModifiedTitle;
        return (actual == expected);
    }

    async compareStatus_LabelText() {
        var actual = await this.page.locator('xpath=' +OR_ML.Service.Status).innerText();
        var expected = await LAN.statusTitle;
        return (actual.includes(expected));
    }


    async comparemodalTitle_LabelText() {
        var actual = await this.page.locator("css=zui-dialogbox header div#headertextcontainer").innerText();      
        var expected = await LAN.modalTitle;
                
        return (actual == expected);
    }

    async comparemoduleSelectLabel_LabelText() {
        var actual = await this.page.locator('xpath=' +OR_ML.Service.moduleSelectLabel).innerText();
        var expected = await LAN.moduleSelectLabel;
        expected = expected + ' *'
        return (actual.includes(expected));
    }
    async compareEntriesFromLabel_LabelText() {
        var actual = await this.page.locator('xpath=' +OR_ML.Service.entriesFromLabel).innerText();
        var expected = await LAN.entriesFromLabel;
        return (actual == expected);
    }

    async compareEntriesUntilLabel_LabelText() {
        var actual = await this.page.locator('xpath=' +OR_ML.Service.entriesUntilLabel).innerText();
        var expected = await LAN.entriesUntilLabel;
        return (actual == expected);
    }
    async compareLogLevelFromLabel_LabelText() {
        var actual = await this.page.locator('xpath=' +OR_ML.Service.logLevelFromLabel).innerText();
        var expected = await LAN.logLevelFromLabel;
        return (actual == expected);
    }
    async comparenumberOfEntriesLabel_LabelText() {
        var actual = await this.page.locator('xpath=' +OR_ML.Service.numberOfEntriesLabel).innerText();
        var expected = await LAN.numberOfEntriesLabel;
        return (actual == expected);
    }
    async comparefileFormatLabel_LabelText() {
        var actual = await this.page.locator('xpath=' +OR_ML.Service.fileFormatLabel).innerText();
        var expected = await LAN.fileFormatLabel;
        return (actual == expected);

    }

    async compareCreateLogLabelText() {
        var actual = await this.page.locator("css=zui-dialogbox footer button#accept-button").innerText();
        var expected = await LAN.submit;
        return (actual == expected);
    }

    
    async compareExitLogLabelText() {
        var actual = await this.page.locator("css=zui-dialogbox footer button#cancel-button").innerText();
        var expected = await LAN.cancel;
        return (actual == expected);
    }

    async clickExitLogLabelText() {
        await this.page.waitForTimeout(1000);
        await this.page.locator("css=zui-dialogbox footer button#cancel-button").click();
        await this.page.waitForTimeout(2000);
        }

    //Network Diagnosis

    async comparetitleNetworkDiagnosis() {
        await this.page.waitForTimeout(1000);
        var actual = await this.page.locator('xpath=' +OR_ML.Service.titleNetworkDiagnosis).innerText();
        var expected = await LAN.titleNetworkDiagnosis;
        return (actual == expected);
    }

    async comparestartDiagnosisButtonText() {
        var actual = await this.page.locator('xpath=' +OR_ML.Service.startDiagnosisButtonText).innerText();
        var expected = await LAN.startDiagnosisButtonText;
        return (actual == expected);
    }

    async comparediagnosisTypeLabel() {
        var actual = await this.page.locator('xpath=' +OR_ML.Service.diagnosisTypeLabel).innerText();
        var expected = await LAN.diagnosisTypeLabel;
        return (actual == expected);
    }

    async comparedestinationAddressLabel() {
        var actual = await await this.page.locator('xpath=' +OR_ML.Service.destinationAddressLabel).innerText();
        var expected = await LAN.destinationAddressLabel;
        return (actual == expected);
    }

    async comparedestinationAddressPlaceholder() {
        var actual = await this.page.locator('xpath=' +OR_ML.Service.destinationAddressPlaceholder).getAttribute('placeholder');
        var expected = await LAN.destinationAddressPlaceholder;
        return (actual == expected);
    }

    async compareselectContainerPlaceholder() {
        var actual = await this.page.locator("css=zui-select#frm-inp-module-select zui-select-button").innerText();
        var expected = await LAN.selectContainerPlaceholder;
        return (actual == expected);
    }

    async comparelogfileEntriesPlaceholder() {
        var actual = await this.page.locator("css=zui-textfield#frm-inp-entries input#raw").getAttribute('placeholder');
        var expected = await LAN.logfileEntriesPlaceholder;
        return (actual == expected);
    }

    async comparedestinationAddressRequirederror() {
        var actual = await this.page.locator('xpath=//zui-error-message[not(@id)]').innerText(); 
        var expected = await LAN.destinationAddressReuired;
        return (actual == expected);
        
    }

    async enterDiagnosisAddress(address){ 
        var diagadd= await this.page.locator('css=zui-textfield input#raw')
        await diagadd.fill(address);
        await diagadd.press('Enter');
        await this.page.waitForTimeout(10000);
       }


};
