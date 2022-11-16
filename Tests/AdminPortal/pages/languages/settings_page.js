var OR_ML = require('../../resources/OR_ML.json');
var LAN;
if (process.env.locale.includes("DE")) {
    LAN = require('../../resources/de.json');
} else if (process.env.locale.includes("FR")) {
    LAN = require('../../resources/fr.json');
} else if (process.env.locale.includes("EN")) {
    LAN = require('../../resources/en.json');
} else if (process.env.locale.includes("ES")) {
    LAN = require('../../resources/es.json');
}

var basePage;
exports.SettingsPage = class SettingsPage {

    constructor(page) {
        this.page = page;
    }

    async compareTitleHeader_LabelText() {
        await this.page.waitForTimeout(3000);
        var actual = await this.page.locator('xpath=' + OR_ML.Settings.Timeframeforupdates).innerText();
        var expected = await LAN.titleTimeframeForUpdates;
        return (actual == expected);
    }

    async compareUserinstruction_Text_LabelText() {
        var actual = await this.page.locator('xpath=' + OR_ML.Settings.userinstruction_Text).innerText();
        var expected = await LAN.userInstruction;
        return (actual == expected);
    }

    async compareUserInformation_LabelText() {
        await this.page.waitForSelector('xpath='+OR_ML.Settings.userInformation_NoteText, { waitFor: 'visible', timeout: 60000 })
        var actual = await this.page.locator('xpath=' + OR_ML.Settings.userInformation_NoteText).innerText();
        var expected = await LAN.userInformation;
        return (actual == expected);
    }

    async compareBandwidthTitle_LabelText() {
        var actual = await this.page.locator('xpath=' + OR_ML.Settings.titleBandwidthSettings).innerText();
        var expected = await LAN.titleBandwidthSettings;
        return (actual == expected);
    }

    async comparelimitUpstreamBandwidthLabel() {
        var actual = await this.page.locator('xpath=' + OR_ML.Settings.limitUpstreamBandwidthLabel).innerText();
        var expected = await LAN.limitUpstreamBandwidthLabel;
        return (actual == expected);
    }

    async comparelimitDownstreamBandwidthLabel() {
        var actual = await this.page.locator('xpath=' + OR_ML.Settings.limitDownstreamBandwidthLabel).innerText();
        var expected = await LAN.limitDownstreamBandwidthLabel;
        return (actual == expected);
    }

    async compareapplySettingstext() {
        var actual = await this.page.locator('xpath=' + OR_ML.Settings.applySettings).innerText();
        var expected = await LAN.applySettings;
        return (actual == expected);
    }

    async checkRemoveampm(timeboundaries) {
        var bound1AM = (timeboundaries[0].toString()).includes("AM")
        var bound1PM = (timeboundaries[0].toString()).includes("PM")
        var bound2AM = (timeboundaries[1].toString()).includes("AM")
        var bound2PM = (timeboundaries[1].toString()).includes("PM")
        return [bound1AM, bound1PM, bound2AM, bound2PM]

    }


};
