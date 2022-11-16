var OR = require('../resources/OR.json');
const { Comparisions } = require('../utils/comparisions.js');
const { BasePage } = require('./base_page');
exports.CustomerListPage = class CustomerListPage {

    constructor(page) {
        this.page = page;
        this.basePage = new BasePage(page)
    }

    async searchCustomer(customer) {

        var searchElement = await this.page.waitForSelector('id=' + OR.locators.customerListPage.customerSearchInput, { waitFor: 'visible', timeout: 60000 });
        await this.page.evaluate("document.getElementById('" + OR.locators.customerListPage.customerSearchInput + "').value=\"" + customer + "\"");

        try {
            await this.page.locator('id=' + OR.locators.customerListPage.customerSearchButton).click();
        } catch {
            await this.page.locator('id=' + OR.locators.customerListPage.customerSearchButton).click();
        }

        await this.page.waitForTimeout(5000);
    }

    async customerListTable() {
        await this.page.waitForSelector('id=' + OR.locators.customerListPage.customerListTable);
        return await this.page.locator('id=' + OR.locators.customerListPage.customerListTable);
    }
    async selectCustomer(customer) {
        await this.page.waitForTimeout(1000);
        await this.page.locator('xpath=' + "(//table[@id='tbl-customer-list']//td[contains(text(),'" + customer + "')])[1]").click();
        await this.page.waitForTimeout(5000);
    }

    async getselectedCustomerdetails(customer) {
        var columnElements = await this.page.$$('xpath=' + "//table[@id='tbl-customer-list']//tbody//tr[1]//td");
        var columns = [];
        for (var i = 0; i < columnElements.length; i++) {
            var text = (await columnElements[i].textContent()).trim()
            columns.push(text ? text : "–");
        }
        return columns;
    }   

    async totalCustomerRows() {
        return await this.page.locator('xpath=' + OR.locators.customerListPage.customerListTableRows).count();
    }
    async noOfCustomerRowsWithFilter(filterValue) {
        return await this.page.locator('xpath=' + "//table[@id='tbl-customer-list']//tbody//tr/td[contains(text(),'" + filterValue + "')]/parent::tr").count();
    }
    async resetCustomerSearch() {
        await this.page.locator('id=' + OR.locators.customerListPage.customerSearchResetButton).click();
        await this.page.waitForTimeout(2000);
    }
    async getSearchFilterValue() {
        return await this.page.evaluate("document.getElementById('" + OR.locators.customerListPage.customerSearchInput + "').value");
    }
    async customerSearchButton() {
        return await this.page.locator('id=' + OR.locators.customerListPage.customerSearchButton);
    }
    async customerListTableColumns() {
        var columnElements = await this.page.$$('xpath=' + OR.locators.customerListPage.customerListTableHeader);
        var columns = [];
        for (var i = 0; i < columnElements.length; i++) {
            var text = (await columnElements[i].textContent()).trim()
            columns.push(text ? text : "null");
        }
        return columns;
    }
    async noCustomersInfoMessage() {
        return await this.page.locator('xpath=' + OR.locators.customerListPage.noCustomersInfoMessage).textContent();
    }
    async validateCustomerListTableData(table, data) {
        var rows = await (await table.elementHandle()).$$('xpath=' + ".//tbody//tr");
        console.log(rows.length)
        var areEqual = []
        if (rows.length == data.length) {
            for (var i = 0; i < rows.length; i++) {
                if (i % 8 == 0) {
                    var len = rows[i + 8] ? i + 8 : rows.length - 1;
                    // await this.basePage.scrollElemFinderIntoView(rows[len])
                    rows = await (await table.elementHandle()).$$('xpath=' + ".//tbody//tr");

                }
                var rowdata = await this.basePage.getRowText(rows[i]);
                var expectedData = [data[i].sapCustomerId ? data[i].sapCustomerId.toString().trim() : "null", data[i].customerName.toString().trim(), data[i].customerId.toString().trim()]
                areEqual.push(await Comparisions.compareObjects(rowdata, expectedData))
            }

        } else {

            areEqual.push(false);

        }
        return areEqual;
    }
};
