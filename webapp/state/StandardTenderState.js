sap.ui.define(
    [
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/odata/v2/ODataModel",
        "../model/template/CountryTemplate",
        "../service/StandardTenderService"
    ],
    function (JSONModel, ODataModel, CountryTemplate, StandardTenderService) {
        return JSONModel.extend("com.bayer.tender.statenderapp.state.StandardTenderState", {
            constructor: function (url) {
                JSONModel.prototype.constructor.call(this, {
                    SelectedPriceConditionType: "Price"
                });
                this.url = url;
                const model = new ODataModel({
                    serviceUrl: url,
                    // odataVersion: "2.0",
                    // autoExpandSelect: true,
                    // earlyRequests: true,
                    // operationMode: "Server",
                    // synchronizationMode: "None"
                });
                this.odataModel = model;
                this.standardTenderService = new StandardTenderService(model);
            },
            getService: function () {
                return this.standardTenderService;
            },
            getOdataModel: function(){
                return this.odataModel;
            },
            
            saveAwardCriteria: async function(aContext){
                return this.standardTenderService.saveAwardCriteria(aContext);        
            },

            getTender: function (tenderId) {
                return this.getService().getTender(tenderId);
            },

            getOffer: function (offerId) {
                return this.getService().getOffer(offerId);
            }
            // read: function (type, keys) {
            //     switch (type) {
            //         case 'MASTER':
            //             return this.readMasterConfig(keys);
            //         case 'DETAIL':
            //             return this.readDetailConfig(keys);

            //         default:
            //             break;
            //     }
            // },
            // readMasterConfig: async function (keys) {
            //     this.updateConfig("master", await this.standardTenderService.getTableConfig(keys || {}));
            // },
            // readDetailConfig: async function (keys) {
            //     this.updateConfig("detail", await this.standardTenderService.getViewConfig(keys || {}));
            // },
            // updateConfig: function (type, templateResponse) {
            //     this.oData[`${type}Config`] = {
            //         countryTemplate: new CountryTemplate(templateResponse)
            //     };
            //     this.updateBindings(true);
            // }
        });
    });