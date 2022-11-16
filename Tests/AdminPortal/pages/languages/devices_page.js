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

// /module.exports = new DevicesPage();
var basePage;
    exports.DevicesPage = class DevicesPage{

        constructor(page){
           this.page = page;
            basePage = new BasePage(page);
           
        }
    async compareDeviceConfiguration_LabelText(){
        await this.page.waitForTimeout(5000);
        var actual = await this.page.locator('xpath=' +OR_ML.Devices.DeviceConfiguration).innerText();
        var expected = await LAN.titleHeader;
        return (actual == expected);
    }
        

    async compareActiveDevices_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.Active_devices).innerText();
        var expected = await LAN.titleActiveDevice;
        return (actual == expected);
    }

    async compareUserInActiveDevices_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.InActive_devices).innerText();
        var expected = await LAN.titleInactiveDevice;
        return (actual == expected);
    }


    async compareUserRefresh_LabelText(){
        var actual = await  this.page.locator('id='+OR_ML.Devices.Refresh).innerText();
        var expected = await LAN.refresh;
        return (actual == expected);
    }

    async compareAddDevice_LabelText(){
        var actual = await  this.page.locator('id='+OR_ML.Devices.Add_device).innerText();
        var expected = await LAN.add;
        return (actual == expected);
    }


// Active Devices Table
    async compareAD_Name_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.AD_Name).innerText();
        var expected = await LAN.name;
        return (actual == expected);
    }

    
    async compareAD_AE_Title_LabelText(){
        await this.page.waitForTimeout(2000);
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.AD_AE_Title).innerText();
        var expected = await LAN.aeTitle;
        return (actual == expected);
    }

    async compareAD_Device_ID_LabelText(){
        await this.page.waitForTimeout(2000);
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.AD_Device_ID).innerText();
        var expected = await LAN.identifierType;
        return (actual == expected);
    }


    
    async compareAD_IPAddress_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.AD_IPAddress).innerText();
        var expected = await LAN.ipAddressSettings;
        return (actual == expected);
    }

    async compareAD_PORT_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.AD_PORT).innerText();
        var expected = await LAN.portSettings;
        return (actual == expected);
    }

    async compareAD_SERIAL_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.AD_SERIAL).innerText();
        var expected = await LAN.serial;
        return (actual == expected);
    }

    async compareAD_LOCATION_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.AD_LOCATION).innerText();
        var expected = await LAN.locationSettings;
        return (actual == expected);
    }

    // Inactive Devices Table

    async compareIAD_Name_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.IAD_Name).innerText();
        var expected = await LAN.name;
        return (actual == expected);
    }

    
    async compareIAD_AE_Title_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.IAD_AE_Title).innerText();
        var expected = await LAN.aeTitle;
        return (actual == expected);
    }

    async compareIAD_Device_ID_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.IAD_Device_ID).innerText();
        var expected = await LAN.identifierType;
        return (actual == expected);
    }


    
    async compareIAD_IPAddress_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.IAD_IPAddress).innerText();
        var expected = await LAN.ipAddressSettings;
        return (actual == expected);
    }

    async compareIAD_PORT_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.IAD_PORT).innerText();
        var expected = await LAN.portSettings;
        return (actual == expected);
    }

    async compare_DeviceLocation_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.deviceLocation).innerText();
        var expected = await LAN.deviceLocationTitle;
        return (actual == expected);
    }

    async compareIAD_SERIAL_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.IAD_SERIAL).innerText();
        var expected = await LAN.serial;
        return (actual == expected);
    }

    async compareIAD_LOCATION_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.IAD_LOCATION).innerText();
        var expected = await LAN.locationSettings;
        return (actual == expected);
    }


    
    async compareInActive_devices_InfoText_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.InActive_devices_InfoText).innerText();
        var expected = (await LAN.infoTitle)+" "+(await LAN.infoBody);
        return (actual == expected);
    }

    // async compareDeviceConfiguration_LabelText(){
    //     var actual = await  this.page.innerHTML('id='+OR_ML.Devices.DeviceConfiguration);
    //     var expected = await LAN.devices.titleHeader;
    //     return (actual == expected);    
//     }
        
    async compareInfoMandatory_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.InfoMandatory).innerText();
        actual = actual.trim();
        var expected = await LAN.infoMandatory;
        return (actual == expected);
    }

    // async compareCancel_LabelText(){
    //     var actual = await element(by.xpath(OR_ML.Devices.cancel)).getText();
    //     var expected = await LAN.devices.cancel;
    //     return (actual == expected);
    // }
    
    async compareAETitleError_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.aeTitleError).innerText();
        var expected = await LAN.aeTitleError;
        return (actual == expected);
    }

    async compareAETitleRequired_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.aeTitleRequired).innerText();
        var expected = await LAN.aeTitleRequired;
        return (actual == expected);
    }

    async comparedeviceLocationRequired_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.deviceLocationRequired).innerText();
        var expected = await LAN.locationError;
        return (actual == expected);
    }

    async compareDeviceNameRequired_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.deviceNameRequired).innerText();
        var expected = await LAN.deviceNameRequired;
        return (actual == expected);
    }
    async compareipRequired_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.ipRequired).innerText();
        var expected = await LAN.ipRequired;
        return (actual == expected);
    }
    async comparePortRequired_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.portRequired).innerText();
        var expected = await LAN.portRequired;
        return (actual == expected);
    }
    async comparedeviceIdRequired_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.deviceIdRequired).innerText();
        var expected = await LAN.diError;
        return (actual == expected);
    }

    async compareDeviceNameError_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.deviceNameError).innerText();
        var expected = await LAN.deviceNameError;
        return (actual == expected);
    }

    async compareIPError_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.ipError).innerText();
        var expected = await LAN.ipError;
        return (actual == expected);
    }

    async comparePortError_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.portError).innerText();
        var expected = await LAN.portError;
        return (actual == expected);
    }


    async comparedeviceNamePlaceholder_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.deviceNamePlaceholder).getAttribute("data-placeholder");
        var expected = await LAN.deviceNamePlaceholder;
        return (actual == expected);
    }

    async compareipPlaceholder_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.ipPlaceholder).getAttribute("data-placeholder");
        var expected = await LAN.ipPlaceholder;
        return (actual == expected);
    }

    async compareportPlaceholder_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.portPlaceholder).getAttribute("data-placeholder");
        var expected = await LAN.portPlaceholder;
        return (actual == expected);
    }

    
    async compareDeviceName_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.deviceName).innerText();
        var expected = await LAN.deviceName;
        return (actual.includes(expected));
    }


    async compareAETitleTitle_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.aeTitleTitle).innerText();
        var expected = await LAN.aeTitleTitle+" "+await LAN.aeTitleMuted;
        return (actual.includes(expected));
    }

    // async compareAETitleMuted_LabelText(){
    //     var actual = await  this.page.locator('xpath='+OR_ML.Devices.aeTitleMuted).innerText();
    //     var expected = await LAN.devices.aeTitleMuted;
    //     return (actual == expected);
    // }

    
    async compareIPAddressModel_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.ipAddressModel).innerText();
        var expected = await LAN.ipAddressModel;
        return (actual.includes(expected));
    }

     
    async comparePORT_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.port).innerText();
        var expected = await LAN.port;
        return (actual.includes(expected));
    }


    async compareModality_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.modality).innerText();
        var expected = await LAN.modality;
        return (actual == expected);
    }

    async compareDeviceStatus_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.deviceStatus).innerText();
        var expected = await LAN.deviceStatusBody;
        return (actual == expected);
    }

    async compareDeviceStatusBody_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.deviceStatusBody).innerText();
        var expected = await LAN.deviceStatusBody;
        return (actual == expected);
    }

    async compareACuid_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.acuid).innerText();
        var expected = await LAN.acuid;
        return (actual == expected);
    }

    async compareuid_LabelText(){
        var actual = await  this.page.locator('xpath='+OR_ML.Devices.uid).innerText();
        var expected = await LAN.uid;
        return (actual == expected);
    }

    
    async compareExitLogLabelText() {
        var actual = await this.page.locator("id="+OR.locators.customerDetailsPage.deviceDetailsForm.cancelButton).innerText();
        var expected = await LAN.exit;
        return (actual == expected);
    }



};
