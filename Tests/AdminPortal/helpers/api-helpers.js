var OR = require('../resources/OR.json');
const { TokenGenerators } = require('../utils/token_generators.js');
const { Comparisions } = require('../utils/comparisions.js');
const { TestData } = require('../utils/test_data.js');
const { expect } = require('@playwright/test');
var token, requestBody;
var subscriptionKey = process.env.apimFhirSubscriptionKey;
let isDiSnChanged = false;

exports.ApiHelper = class ApiHelper {

    static async deleteDevice(serviceType, userToken, iotDeviceId, deviceUid) {
        var deleteDeviceUrl = process.env.apimBaseURL + OR.updatedAPIUrls.deleteDeviceUrl;
        deleteDeviceUrl = deleteDeviceUrl.replace('{iotDeviceId}', iotDeviceId);
        deviceUid = encodeURIComponent(deviceUid)
        deleteDeviceUrl = deleteDeviceUrl.replace('{deviceUid}', deviceUid);
        deleteDeviceUrl = deleteDeviceUrl.replace('{serviceType}', serviceType.toUpperCase());
        var config = {
            method: 'delete',
            url: deleteDeviceUrl,
            headers: { "Authorization": "Bearer " + userToken }
        };

        var response = await TokenGenerators.request(config);
        return response;
    }

    static async addDevice(connectedDeviceType, userToken, iotDeviceId, port, ip, name, uid, locationID, acuid, modality, whitelisted, aet, serial, type, manualIdentifier) {
        var deviceType;
        if(type != ''){
            deviceType = await this.getDeviceType(type);
        } else {
            deviceType = {};
        }
        var apimAddConnectedDevicesUrl = process.env.apimBaseURL + OR.updatedAPIUrls.addupdateDeviceUrl;
        apimAddConnectedDevicesUrl = apimAddConnectedDevicesUrl.replace('{iotDeviceId}', iotDeviceId)
        requestBody = {
            "port": port,
            "ip": ip,
            "name": name,
            "uid": uid,
            "acuid": acuid,
            "modality": modality,
            "whitelisted": whitelisted,
            "aet": aet,
            "iotDeviceId": iotDeviceId,
            "sgc": locationID,
            "type": deviceType,
            "serial": serial,
            "serviceType": connectedDeviceType.toUpperCase()
        }
        if (type === '(Others)') {
            requestBody.type.identifier = manualIdentifier;
        }

        if(connectedDeviceType.toUpperCase()=='STREAMING'){
            requestBody.port = "";           
            requestBody.aet = "";
            requestBody.modality = "";
            requestBody.acuid = " ";
            requestBody.uid = "";
            }

        var config = {
            method: 'post',
            url: apimAddConnectedDevicesUrl,
            headers: { "Authorization": "Bearer " + userToken },
            data: requestBody
        };

        var response = await TokenGenerators.request(config);
        return response;
    }

    static async updateDevice(connectedDeviceType, userToken, iotDeviceId, port, ip, name, uid, locationID, acuid, modality, whitelisted, aet, serial, type, manualIdentifier) {
        var deviceType = await this.getDeviceType(type);
        var apimUpdateConnectedDevicesUrl = process.env.apimBaseURL + OR.updatedAPIUrls.addupdateDeviceUrl;
        apimUpdateConnectedDevicesUrl = apimUpdateConnectedDevicesUrl.replace('{iotDeviceId}', iotDeviceId)
        var requestBody = {
            "port": port,
            "ip": ip,
            "name": name,
            "uid": uid,
            "acuid": acuid,
            "modality": modality,
            "whitelisted": whitelisted,
            "aet": aet,
            "iotDeviceId": iotDeviceId,
            "sgc": locationID,
            "type": deviceType,
            "serial": serial,
            "serviceType": connectedDeviceType.toUpperCase()
        }
        if (isDiSnChanged != "Missit") {

            requestBody.isDiSnChanged = isDiSnChanged;
        }
        if (type === '(Others)') {
            requestBody.type.identifier = manualIdentifier;
        }

        if(connectedDeviceType.toUpperCase()=='STREAMING'){
            delete requestBody.port;           
            delete requestBody.aet;
            delete requestBody.uid;
            }

        var config = {
            method: 'put',
            url: apimUpdateConnectedDevicesUrl,
            headers: { "Authorization": "Bearer " + userToken },
            data: requestBody
        };

        var response = await TokenGenerators.request(config);
        return response;
    }

    static async updateisDiSnChangedFlag(isDiSnChange) {
        isDiSnChanged = isDiSnChange;
    }

    static async getDeviceType(type) {
        if (type === '(Others)') {
            return {
                "identifier": "2323",
                "manufacturer": "Unknown",
                "name": "Others",
                "type": ""
            }
        }
        else {
            let strArr = type.split("(");
            var name = (strArr[1].replace(')', '')).trim();
            return {
                "name": name,
                "identifier": strArr[0].trim(),
                "manufacturer": "Carl Zeiss Meditec",
                "type": ""
            }
        }
    }

    static async getDevice(userToken, iotDeviceId) {
        var apiDevicesUrl = process.env.apimBaseURL + OR.updatedAPIUrls.devicesUrl;
        apiDevicesUrl = apiDevicesUrl.replace('{iotDeviceId}', iotDeviceId);
        var config = {
            method: 'get',
            url: apiDevicesUrl,
            headers: { "Authorization": "Bearer " + userToken }
        };
        var response = await TokenGenerators.request(config);
        return response;
    }

    static async getDevices(userToken, iotDeviceId) {
        var apiDevicesUrl = process.env.apimBaseURL + OR.updatedAPIUrls.getDevices;
        apiDevicesUrl = apiDevicesUrl.replace('{iotDeviceId}', iotDeviceId);
        var config = {
            method: 'get',
            url: apiDevicesUrl,
            headers: { "Authorization": "Bearer " + userToken }
        };
        var response = await TokenGenerators.request(config);
        return response;
    }

    static async getActivationKey(userToken, iotDeviceId) {
        var apiActivationKeyUrl = process.env.apimBaseURL + OR.updatedAPIUrls.getActivationKey;
        apiActivationKeyUrl = apiActivationKeyUrl.replace('{iotDeviceId}', iotDeviceId);
        var config = {
            method: 'get',
            url: apiActivationKeyUrl,
            headers: { "Authorization": "Bearer " + userToken }
        };
        var response = await TokenGenerators.request(config);
        return response;
    }

    static async getBandwidth(userToken, iotDeviceId) {
        var apiBandwidthUrl = process.env.apimBaseURL + OR.updatedAPIUrls.bandwidth;
        apiBandwidthUrl = apiBandwidthUrl.replace('{iotDeviceId}', iotDeviceId);
        var config = {
            method: 'get',
            url: apiBandwidthUrl,
            headers: { "Authorization": "Bearer " + userToken }
        };
        var response = await TokenGenerators.request(config);
        return response;
    }
    static async getDeviceTags(userToken, iotDeviceId) {
        var apigetDeviceTagsUrl = process.env.apimBaseURL + OR.APIUrls.getdeviceTags;
        apigetDeviceTagsUrl = apigetDeviceTagsUrl.replace('{iotDeviceId}', iotDeviceId);
        var config = {
            method: 'get',
            url: apigetDeviceTagsUrl,
            headers: { "Authorization": "Bearer " + userToken }
        };
        var response = await TokenGenerators.request(config);        
        return response;
    }
    static async setBandwidthDownloadAndUploadSpeedInMbps(userToken, iotDeviceId, downloadSpeed, uploadSpeed) {
        var apiBandwidthUrl = process.env.apimBaseURL + OR.updatedAPIUrls.bandwidth;
        apiBandwidthUrl = apiBandwidthUrl.replace('{iotDeviceId}', iotDeviceId);
        requestBody = {
            "downloadSpeedInMbps": downloadSpeed,
            "uploadSpeedInMbps": uploadSpeed,
        }
        var config = {
            method: 'put',
            url: apiBandwidthUrl,
            headers: { "Authorization": "Bearer " + userToken },
            data: requestBody
        };
        var response = await TokenGenerators.request(config);
        return response;
    }

    static async regenerateKey(userToken, iotDeviceId) {
        var apiRegenerateKeyUrl = process.env.apimBaseURL + OR.updatedAPIUrls.regenerateKey;
        apiRegenerateKeyUrl = apiRegenerateKeyUrl.replace('{iotDeviceId}', iotDeviceId);
        var config = {
            method: 'post',
            url: apiRegenerateKeyUrl,
            headers: { "Authorization": "Bearer " + userToken },
        };
        var response = await TokenGenerators.request(config);
        return response;
    }

    static async getProxy(userToken, iotDeviceId) {
        var apiProxyUrl = process.env.apimBaseURL + OR.updatedAPIUrls.proxy;
        apiProxyUrl = apiProxyUrl.replace('{iotDeviceId}', iotDeviceId);
        var config = {
            method: 'get',
            url: apiProxyUrl,
            headers: { "Authorization": "Bearer " + userToken }
        };
        var response = await TokenGenerators.request(config);
        return response;
    }

    static async getUpdates(userToken, iotDeviceId) {
        var apiUpdatesUrl = process.env.apimBaseURL + OR.updatedAPIUrls.updates;
        apiUpdatesUrl = apiUpdatesUrl.replace('{iotDeviceId}', iotDeviceId);
        var config = {
            method: 'get',
            url: apiUpdatesUrl,
            headers: { "Authorization": "Bearer " + userToken }
        };
        var response = await TokenGenerators.request(config);
        return response;
    }

    static async getGroups(userToken) {
        var apiGroupsUrl = process.env.apimBaseURL + OR.updatedAPIUrls.groups;
        var config = {
            method: 'get',
            url: apiGroupsUrl,
            headers: { "Authorization": "Bearer " + userToken }
        };
        var response = await TokenGenerators.request(config);
        return response;
    }

    static async selectTimeframeUpdateGroupAssociate(userToken, iotDeviceId, groupId) {
        var apiGroupAssociateUrl = process.env.apimBaseURL + OR.updatedAPIUrls.groupAssociate;
        apiGroupAssociateUrl = apiGroupAssociateUrl.replace('{iotDeviceId}', iotDeviceId);
        requestBody = { "iotDeviceId": iotDeviceId, "groupId": groupId }
        var config = {
            method: 'put',
            url: apiGroupAssociateUrl,
            headers: { "Authorization": "Bearer " + userToken },
            data: requestBody
        };
        var response = await TokenGenerators.request(config);
        return response;
    }

    static async getConnectedDevices(userToken, iotDeviceId) {
        var apiConnectedDevicesUrl = process.env.apimBaseURL + OR.updatedAPIUrls.connectedDevices;
        apiConnectedDevicesUrl = apiConnectedDevicesUrl.replace('{iotDeviceId}', iotDeviceId);
        var config = {
            method: 'get',
            url: apiConnectedDevicesUrl,
            headers: { "Authorization": "Bearer " + userToken }
        };
        var response = await TokenGenerators.request(config);
        return response;
    }

    static async getCmInformation(userToken, iotDeviceId) {
        var apiCmInformationUrl = process.env.apimBaseURL + OR.updatedAPIUrls.cmInformation;
        apiCmInformationUrl = apiCmInformationUrl.replace('{iotDeviceId}', iotDeviceId);
        var config = {
            method: 'get',
            url: apiCmInformationUrl,
            headers: { "Authorization": "Bearer " + userToken }
        };
        var response = await TokenGenerators.request(config);
        return response;
    }

    static async postContainerRestart(userToken, iotDeviceId, module) {
        var apiContainerRestartUrl = process.env.apimBaseURL + OR.updatedAPIUrls.apiContainerRestartUrl;
        apiContainerRestartUrl = apiContainerRestartUrl.replace('{iotDeviceId}', iotDeviceId);
        var config = {
            method: 'post',
            url: apiContainerRestartUrl,
            headers: { "Authorization": "Bearer " + userToken },
            data: { "moduleName": module }
        };
        var response = await TokenGenerators.request(config);
        return response;
    }

    static async postNetworkDiagnosisResp(userToken, iotDeviceId, diagType, destAdd) {
        var apimNetworkDiagURL = process.env.apimBaseURL + OR.updatedAPIUrls.apimNetworkDiag;
        apimNetworkDiagURL = apimNetworkDiagURL.replace('{iotDeviceId}', iotDeviceId);
        var networkdiagnosisconfig = {
            method: 'post',
            url: apimNetworkDiagURL,
            data: {
                diagnosisType: diagType,
                destinationAddress: destAdd
            },
            headers: { "Authorization": "Bearer " + userToken }
        };
        var response = await TokenGenerators.request(networkdiagnosisconfig);
        return response;
    }

    static async deleteAll_ActiveDevice(token, deviceId) {
        var response = await this.getConnectedDevices(token, deviceId)
        var activeDevresult = response.data.activeDevices
        var deviceUid, deviceType;
        var deletedFlag = false
        var apiJSON
        if ((activeDevresult.length) != 0) {
            for (var k = 0; k < (activeDevresult.length); k++) {
                apiJSON = JSON.parse(JSON.stringify(activeDevresult[k]));
                deviceUid = apiJSON.uid;
                deviceType = apiJSON.type;
                var responsedel = await ApiHelper.deleteDevice(deviceType, token, deviceId, deviceUid)
                //expect(responsedel.status).toBe(200)
                deletedFlag = true
            }
        }
        return deletedFlag;
    }

    static async deleteAll_InActiveDevice(token, deviceId) {
        var response = await this.getConnectedDevices(token, deviceId)
        var inactiveDevresult = response.data.inactiveDevices
        var deviceUid, deviceType;
        var deletedFlag = false
        var apiJSON
        if ((inactiveDevresult.length) != 0) {
            for (var k = 0; k < (inactiveDevresult.length); k++) {
                apiJSON = JSON.parse(JSON.stringify(inactiveDevresult[k]));
                deviceUid = apiJSON.uid;
                deviceType = apiJSON.type;
                var responsedel = await ApiHelper.deleteDevice(deviceType, token, deviceId, deviceUid)
                //expect(responsedel.status).toBe(200)
                deletedFlag = true
            }
        }
        return deletedFlag;

    }

    static async getUidofConnectedDevice(token, deviceId, connectedDeviceName, connectedDeviceSerial) {
        var response = await this.getConnectedDevices(token, deviceId)
        var activeDevresult = response.data.activeDevices
        var deviceUid, deviceSerialNumber, deviceName, connectedDeviceUid;

        var apiJSON
        if ((activeDevresult.length) != 0) {
            for (var k = 0; k < (activeDevresult.length); k++) {
                apiJSON = JSON.parse(JSON.stringify(activeDevresult[k]));
                deviceUid = apiJSON.uid;
                deviceSerialNumber = apiJSON.sn;
                deviceName = apiJSON.name;
                if((deviceName == connectedDeviceName) && (deviceSerialNumber == connectedDeviceSerial)){
                    connectedDeviceUid = deviceUid;
                }
            }
        }
        return deviceUid;

    }

    // this method will delete all device locations that contains AutoLoc in its name
    static async deleteAll_AutomationDeviceLocations(userToken, customerId) {
        var response = await this.getlocationList(userToken, customerId);
        var deviceLocationsDevresult = response.data.result
        var locationIdArray = new Array()
        var deletedFlag = false
        var apiJSON
        if ((deviceLocationsDevresult.length) != 0) {
            for (var k = 0; k < (deviceLocationsDevresult.length); k++) {
                apiJSON = JSON.parse(JSON.stringify(deviceLocationsDevresult[k]));
                if ((apiJSON.name).includes("AutoLoc")) {
                    locationIdArray.push(apiJSON.id)
                }
            }

            for (var i = 0; i < locationIdArray.length; i++) {
                var responsedel = await ApiHelper.deletelocationByID(userToken, customerId, locationIdArray[i])
                // expect(responsedel.status).toBe(200)
                deletedFlag = true
            }
        }
        return deletedFlag;

    }

    // Location List---------------->

    static async getlocationList(userToken, customerId) {
        var apilocationListUrl = process.env.apimBaseURL + OR.updatedAPIUrls.locationList;
        apilocationListUrl = apilocationListUrl.replace('{customerId}', customerId);
        var config = {
            method: 'get',
            url: apilocationListUrl,
            headers: { "Authorization": "Bearer " + userToken }
        };
        var response = await TokenGenerators.request(config);
        return response;
    }

    static async postlocationList(userToken, customerId, lname, description, status) {
        var apilocationListUrl = process.env.apimBaseURL + OR.updatedAPIUrls.locationList;
        apilocationListUrl = apilocationListUrl.replace('{customerId}', customerId);
        var config = {
            method: 'post',
            url: apilocationListUrl,
            data: {
                id: "",
                name: lname,
                description: description,
                status: status
            },
            headers: { "Authorization": "Bearer " + userToken }
        };
        var response = await TokenGenerators.request(config);
        return response;
    }

    static async getlocationByID(userToken, customerId, LocID) {
        var apilocationListUrl = process.env.apimBaseURL + OR.updatedAPIUrls.locationByID;
        apilocationListUrl = apilocationListUrl.replace('{customerId}', customerId);
        apilocationListUrl = apilocationListUrl.replace('{locationId}', LocID);
        var config = {
            method: 'get',
            url: apilocationListUrl,
            headers: { "Authorization": "Bearer " + userToken }
        };
        var response = await TokenGenerators.request(config);
        return response;
    }

    static async updatelocationbyID(userToken, customerId, LocID, lname, description, status) {
        var apilocationListUrl = process.env.apimBaseURL + OR.updatedAPIUrls.deleteLocation;
        apilocationListUrl = apilocationListUrl.replace('{customerId}', customerId);
        apilocationListUrl = apilocationListUrl.replace('{locationId}', LocID);
        var config = {
            method: 'put',
            url: apilocationListUrl,
            data: {
                id: LocID,
                name: lname,
                description: description,
                status: status
            },
            headers: { "Authorization": "Bearer " + userToken }
        };
        var response = await TokenGenerators.request(config);
        return response;
    }

    static async deletelocationByID(userToken, customerId, LocID) {
        var apilocationListUrl = process.env.apimBaseURL + OR.updatedAPIUrls.deleteLocation;
        apilocationListUrl = apilocationListUrl.replace('{customerId}', customerId);
        apilocationListUrl = apilocationListUrl.replace('{locationId}', LocID);
        var config = {
            method: 'delete',
            url: apilocationListUrl,
            headers: { "Authorization": "Bearer " + userToken }
        };
        var response = await TokenGenerators.request(config);
        return response;
    }

    static async getLocationNameByID(userToken, customerId, locID) {
        var apilocationListUrl = process.env.apimBaseURL + OR.updatedAPIUrls.locationList;
        apilocationListUrl = apilocationListUrl.replace('{customerId}', customerId);
        var config = {
            method: 'get',
            url: apilocationListUrl,
            headers: { "Authorization": "Bearer " + userToken }
        };
        var response = await TokenGenerators.request(config);
        var DeviceLocations = response.data.result;
        var locationName, apiJSON;

        for (var k = 0; k < (DeviceLocations.length); k++) {
            apiJSON = JSON.parse(JSON.stringify(DeviceLocations[k]));
            if ((apiJSON.id).includes(locID)) {
                locationName = apiJSON.name;
                break;
            }
        }
        return locationName;
    }

    static async getDeviceLocationByID(userToken, LocID, customerId) {
        var apidevicelocationListUrl = process.env.apimBaseURL + OR.updatedAPIUrls.deviceLocationByID;
        apidevicelocationListUrl = apidevicelocationListUrl.replace('{customerId}', customerId);
        apidevicelocationListUrl = apidevicelocationListUrl.replace('{locationId}', LocID);
        var config = {
            method: 'get',
            url: apidevicelocationListUrl,
            headers: { "Authorization": "Bearer " + userToken }
        };
        var response = await TokenGenerators.request(config);
        return response;
    }

    static async validatelocationExists(responseResult, locName, locIDfromResp) {
        var idflag, apiJSON
        var flagarray = new Array(2)
        var datalength = responseResult.length
        for (var i = (datalength - 1); i >= 0; i--) {
            apiJSON = JSON.parse(JSON.stringify(responseResult[i]));
            idflag = ("Location/" + apiJSON.id).includes(locIDfromResp)
            if (idflag == true) {
                flagarray[0] = (apiJSON.name).includes(locName)
                flagarray[1] = idflag
                break;
            } else {
                flagarray[0] = false
                flagarray[1] = false
            }
        }
        return flagarray;
    }

    static async validateUpdatedlocation(responseResult, locIDfromResp, uplocName, uplocdesc) {
        var idflag, apiJSON
        var flagarray = new Array(2)
        var datalength = responseResult.length
        for (var i = (datalength - 1); i >= 0; i--) {
            apiJSON = JSON.parse(JSON.stringify(responseResult[i]));
            idflag = ("Location/" + apiJSON.id).includes(locIDfromResp)
            if (idflag == true) {
                flagarray[0] = (apiJSON.name).includes(uplocName)
                flagarray[1] = (apiJSON.description).includes(uplocdesc)
                break;
            } else {
                flagarray[0] = false
                flagarray[1] = false
            }
        }
        return flagarray;
    }

    static async createDevicewithlocation(connectedDeviceType, token, deviceCount, locIDfromResp, deviceId, sastoken) {
        var numofDevices = deviceCount
        var deviceNamearray = new Array()
        for (var k = 1; k <= numofDevices; k++) {
            let globalUid = await TestData.generateUIDforDevice(deviceId, sastoken);
            let globalAet = globalUid;
            var deviceName = await this.createlocname(8) + "-" + k
            var serial = await TestData.generateSerialNumber();
            console.log(globalUid);

            var adddeviceResp = await this.addDevice(connectedDeviceType, token, deviceId, "1010", "10.10.10.10", deviceName, globalUid, locIDfromResp, globalUid, "OPT: Ophthalmic Tomography", 1, globalAet, serial, "04049539103512 (CALLISTO eye model II)",)
            expect(adddeviceResp.status).toBe(200);
            deviceNamearray.push(deviceName)
        }
        return deviceNamearray;

    }
    static async getDeviceLocationDetails(devicelocationRespResult) {
        var apiJSON
        var devicelocationArray = new Array()
        for (var i = 0; i < devicelocationRespResult.length; i++) {
            apiJSON = JSON.parse(JSON.stringify(devicelocationRespResult[i]));
            devicelocationArray.push(apiJSON.deviceName)
        }
        return devicelocationArray;
    }

    static async createlocname(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    static async createGUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    static async postDeviceEnrollment(userToken, orderIdValue, customerIdValue, customerNameValue, edgeModulesValue, sapIdValue) {
        var apiDeviceEnrollmentUrl = process.env.apimBaseURL + OR.updatedAPIUrls.deviceProvisioning;

        var config = {
            method: 'post',
            url: apiDeviceEnrollmentUrl,
            data: {
                orderId: orderIdValue,
                customerId: customerIdValue,
                customerName: customerNameValue,
                edgeModules: edgeModulesValue,
                sapCustomerId: sapIdValue
            },
            headers: { "Authorization": "Bearer " + userToken }
        };
        var response = await TokenGenerators.request(config);
        return response;
    }


    // Custom Label--------------->

    static async putCustomLabel(userToken, iotDeviceId, customLabel) {
        var apiCustomLabelUrl = process.env.apimBaseURL + OR.updatedAPIUrls.customLabelurl;
        apiCustomLabelUrl = apiCustomLabelUrl.replace('{iotDeviceId}', iotDeviceId);
        var config = {
            method: 'put',
            url: apiCustomLabelUrl,
            data: {
                customLabel: customLabel,
            },
            headers: { "Authorization": "Bearer " + userToken }
        };
        var response = await TokenGenerators.request(config);
        return response;
    }

    static async getCustomlabel(userToken, customerId) {
        var apiCustomLabelUrl = process.env.apimBaseURL + OR.updatedAPIUrls.getDevices;
        apiCustomLabelUrl = apiCustomLabelUrl.replace('{iotDeviceId}', customerId);
        var config = {
            method: 'get',
            url: apiCustomLabelUrl,
            headers: { "Authorization": "Bearer " + userToken }
        };
        var response = await TokenGenerators.request(config);
        return response;
    }

    static async validateCustomlabelfordevice(response, iotDeviceId, custLbl) {
        var idflag = false, apiJSON
        var custLblflag = false
        var responsedata = response.data
        var datalength = responsedata.length
        for (var i = 0; i < datalength; i++) {
            apiJSON = JSON.parse(JSON.stringify(responsedata[i]));
            idflag = (apiJSON.iotDeviceId).includes(iotDeviceId)
            if (idflag == true) {
                custLblflag = (apiJSON.customLabel).includes(custLbl)
                return custLblflag
                break;
            }
        }
        return custLblflag;
    }

    static async createcustomLabel(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._/-';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
    
}