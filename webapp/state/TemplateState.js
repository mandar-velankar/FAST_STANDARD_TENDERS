sap.ui.define(["sap/ui/model/json/JSONModel", "sap/ui/model/odata/v4/ODataModel", "../model/template/CountryTemplate", "../service/TemplateService"],
    function (JSONModel, ODataModel, CountryTemplate, TemplateService) {
        const GenericFormState = JSONModel.extend("com.bayer.tender.statenderapp.state.TemplateState", {
            constructor: function (url) {
                JSONModel.prototype.constructor.call(this, {});
                this.url = url;
                const model = new ODataModel({
                    serviceUrl: url,
                    odataVersion: "4.0",
                    autoExpandSelect: true,
                    earlyRequests: true,
                    operationMode: "Server",
                    synchronizationMode: "None"
                });
                this.templateService = new TemplateService(model);
            },
            read: function (type, keys) {
                switch (type) {
                    case 'MASTER':
                        return this.readMasterConfig(keys);
                    case 'DETAIL':
                        return this.readDetailConfig(keys);

                    default:
                        break;
                }
            }, 
            readMasterConfig: async function (keys) {
                this.updateConfig("master",await this.templateService.getTableConfig(keys || {}));
            },
            readDetailConfig: async function (keys) {
                this.updateConfig("detail",await this.templateService.getViewConfig(keys || {}));
            },
            updateConfig:function(type,templateResponse){
                this.oData[`${type}Config`] = {
                    countryTemplate: new CountryTemplate(templateResponse)
                };
                this.updateBindings(true);
            }
        });
        return GenericFormState;
    });