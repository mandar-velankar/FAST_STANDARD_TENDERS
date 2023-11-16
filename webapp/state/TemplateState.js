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
                    case 'DETAIL-OFFERPRODUCTDETAIL':
                        return this.readDetailDetailOfferProductConfig(keys);
                    case 'DETAIL-AWARDEDRODUCTDETAIL':
                        return this.readDetailDetailAwardedProductConfig(keys);
                    case 'DETAIL-DELIVERYTRACKINGDETAIL':
                        return this.readDetailDetailDeliveryTrackingConfig(keys);
                    default:
                        break;
                }
            }, 
            readMasterConfig: async function (keys) {
                return this.updateConfig("master",await this.templateService.getTableConfig(keys || {}));
            },
            readDetailConfig: async function (keys) {
                return this.updateConfig("detail",await this.templateService.getViewConfig(keys || {}));
            },
            readDetailDetailOfferProductConfig: async function (keys) {
                return this.updateConfig("detailDetailOfferProduct",await this.templateService.getFormConfig(keys || {}));
            },
            readDetailDetailDeliveryTrackingConfig: async function (keys) {
                return this.updateConfig("detailDetailDeliveryTracking",await this.templateService.getFormConfig(keys || {}));
            },
            readDetailDetailAwardedProductConfig: async function (keys) {
                return this.updateConfig("detailDetailAwardedProduct",await this.templateService.getViewConfig(keys || {}));
            },
            updateConfig:function(type,templateResponse){
                this.oData[`${type}Config`] = {
                    countryTemplate: new CountryTemplate(templateResponse)
                };
                this.updateBindings(true);
                return this.oData[`${type}Config`];
            }
        });
        return GenericFormState;
    });