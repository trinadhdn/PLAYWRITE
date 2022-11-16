const { Comparisions} = require('../../utils/comparisions.js');
const { BasePage } = require('../../pages/base_page.js');
var OR_ML = require('../../resources/OR_ML.json');
var OR = require('../../resources/OR.json');
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

exports.LangCustomerListPage = class LangCustomerListPage{
    
    constructor(page){
        this.page = page;
        this.basePage = new BasePage(page);
       
    }
    async compareSelectCustomerText(){
        var actual = await this.page.locator('id='+OR_ML.customer.selectCustomer_Label).innerText();
        var expected = await LAN.titleSelectCustomer;
        return (actual == expected);
    }
    
    async compareCustomerNameText(){
        var actual = await this.page.locator('xpath='+OR_ML.customer.CUSTOMER_NAME_lable).innerText();
        var expected = await LAN.titleCustomerName.toUpperCase();
        return (actual == expected);
    }
      
    async compareCustomerIDText(){
        var actual = await this.page.locator('xpath='+OR_ML.customer.CUSTOMER_ID_lable).innerText();
        var expected = await LAN.titleSapCustomerId.toUpperCase();
        return (actual == expected);
    }

    async compareAgreementIDText(){
        var actual = await this.page.locator('xpath='+OR_ML.customer.COUNTRY_lable).innerText();
        var expected = await LAN.titleCustomerId.toUpperCase();
        return (actual == expected);
    }
    
    async compareinfoCustomerlistText(){
        var actual = await this.page.locator('id='+OR_ML.customer.searchCustomer_label).getAttribute("placeholder");
        var expected = await LAN.searchPlaceholder;
        return (actual == expected);
    }

    
    async comparesearchLeaveText(){
        var actual = await this.page.locator('xpath='+OR_ML.customer.Leave_lable).innerText();
        var expected = await LAN.leave;
        return (actual == expected);
    }

    async noCustomersInfoMessage(){
        var actual = await this.page.locator("xpath="+OR.locators.customerListPage.noCustomersInfoMessage).innerText();
        var expected = await LAN.infoCustomerlist;
        return (actual.includes(expected));
    }

   }
