var OR = require('../resources/OR.json');

exports.BasePage = class BasePage {

    constructor(page) {
        this.page = page;
    }

    async navigateToUrl(userType) {
        var username, password;
        if (userType.toLowerCase() == "regularuser") {
            username = process.env.regularuser
            password = process.env.regularuserpassword
        } else if (userType.toLowerCase() == "l1serviceuser") {
            username = process.env.username
            password = process.env.password
        } else if (userType.toLowerCase() == "cmprovuserl1") {
            username = process.env.cmprovuserl1
            password = process.env.cmprovpasswordl1
        } else if (userType.toLowerCase() == "cmprovuser1") {
            username = process.env.cmprovuser1
            password = process.env.cmprovpassword
        }
        var url = process.env.adminAppBaseURL;
        await this.page.goto(url);

        console.log("Test is executing with user:- " + username);
        var usernameElement = 'id=' + OR.locators.loginPage.usernameInput
        await this.waitTillElementIsVisible(usernameElement)
        await this.page.locator('id=' + OR.locators.loginPage.usernameInput).fill(username);
        await this.page.locator('id=' + OR.locators.loginPage.passwordInput).fill(password);
        await this.page.locator('id=' + OR.locators.loginPage.signInButton).click();
        var userButton = 'id=' + OR.locators.homePage.userButton;
        await this.waitTillElementIsVisible(userButton)
        var loadSpinner = 'xpath=' + OR.locators.customerListPage.loadSpinner
        await this.waitTillElementIsInvisible(loadSpinner)
        await this.page.waitForTimeout(10000);

    }

    async navigateToProvisionUrl(userType) {
        var username, password;
        if (userType.toLowerCase() == "cmprovuser1") {
            username = process.env.cmprovuser1
            password = process.env.cmprovpassword
        } else if (userType.toLowerCase() == "cmprovuserl1") {
            username = process.env.cmprovuserl1
            password = process.env.cmprovpasswordl1
        } else if (userType.toLowerCase() == "regularuser") {
            username = process.env.regularuser
            password = process.env.regularuserpassword
        } else if (userType.toLowerCase() == "l1serviceuser") {
            username = process.env.username
            password = process.env.password
        }
        var url = process.env.adminAppBaseURL + "/provision";
        await this.page.goto(url);

        var usernameElement = 'id=' + OR.locators.loginPage.usernameInput
        await this.waitTillElementIsVisible(usernameElement)
        await this.page.locator('id=' + OR.locators.loginPage.usernameInput).fill(username);
        await this.page.locator('id=' + OR.locators.loginPage.passwordInput).fill(password);
        await this.page.locator('id=' + OR.locators.loginPage.signInButton).click();
        var userButton = 'id=' + OR.locators.homePage.userButton;
        await this.waitTillElementIsVisible(userButton)
        var loadSpinner = 'xpath=' + OR.locators.customerListPage.loadSpinner
        await this.waitTillElementIsInvisible(loadSpinner)

    }

    async navigateToCustomUrl(url) {
        await this.page.goto(url);
        await this.waitTillElementIsVisible('id=' + OR.locators.homePage.userButton);
        await this.page.waitForTimeout(10000);
        // var loadSpinner = 'xpath'+OR.locators.customerListPage.loadSpinner
        // await this.waitTillElementIsInvisible(loadSpinner)

    }

    async navigateToDirectUrl(url) {
        await this.page.goto(url);
        await this.waitTillElementIsVisible('id=' + OR.locators.homePage.defaultPage);
        await this.page.waitForTimeout(10000);


    }

    async getCurrentUrl() {
        return await this.page.url();

    }


    async logout() {
        await this.page.locator('id=' + OR.locators.homePage.userButton).click();
        await this.page.waitForTimeout(3000);
        await this.page.evaluate(() => document.querySelector('#btn-logout').click());
        var usernameElement = 'id=' + OR.locators.loginPage.usernameInput;
        await this.waitTillElementIsVisible(usernameElement)
        await this.page.waitForTimeout(5000);
    }


    async scrollElemFinderIntoView(elemFinder) {
        var element = await this.page.locator(elemFinder);
        await element.scrollIntoViewIfNeeded();
        await this.waitTillElementIsVisible(elemFinder);
    };
    async waitTillElementIsVisible(elementSelector, waitTime = 60000) {
        await this.page.waitForSelector(elementSelector, { waitFor: 'visible', timeout: waitTime })
    }

    async waitTillElementIsInvisible(elementSelector, waitTime = 60000) {
        await this.page.waitForSelector(elementSelector, { state: 'hidden', timeout: waitTime })
    }



    async getColumnVal(column, table) {
        var index = await this.getColumnIndex(column, table)
        var locators = await (await table.elementHandle()).$$('xpath=' + "//tbody//td[" + index + "]")
        var columnValues = [];
        for (var i = 0; i < locators.length; i++) {
            await columnValues.push(await locators[i].innerText())
        }
        return columnValues;
    }
    async getColumnIndex(column, table) {
        var columnElements = await (await table.elementHandle()).$$('xpath=' + "//th");
        for (var i = 0; i < columnElements.length; i++) {
            if (column.toLowerCase() == (await columnElements[i].innerText()).toLowerCase()) {
                return i + 1;
            }
        }
        return 0;
    }

    async getRowText(row) {
        var columnElements = await row.$$('xpath=' + ".//td");
        var columns = [];
        for (var i = 0; i < columnElements.length; i++) {
            var text = await columnElements[i].innerText();
            columns.push(text == '' ? 'null' : text.replace(/\n\n/g, ' ').trim())
        }
        return columns;
    }

    async verifyloggedInUsername(usertype) {
        var expectedUsername;
        if (usertype.toLowerCase() == "regularuser") {
            switch (process.env.regularuser) {
                case process.env.regularuser: expectedUsername = "CM Regularuser1"; break;
            }

        } else if (usertype.toLowerCase() == "l1serviceuser") {
            switch (process.env.username) {
                case process.env.serviceuser: expectedUsername = "CM Techuser1"; break;
                case process.env.cmprovuserl1: expectedUsername = "CM Provuser2"; break;
            }
        }
        var actualUsername = await this.page.locator('id=' + OR.locators.customerDetailsPage.textloginUsername).textContent();
        return (actualUsername == expectedUsername)
    }

    async logoutButton() {
        await this.page.waitForSelector('id=' + OR.locators.loginPage.usernameInput);
        return await this.page.locator('id=' + OR.locators.loginPage.usernameInput);
    }

}