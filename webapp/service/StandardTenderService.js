sap.ui.define(["sap/ui/base/Object"], function (Object) {

    return Object.extend("com.bayer.tender.statenderapp.service.StandardTenderService", {
        constructor: function (model) {
            Object.prototype.constructor.call(this);
            this.model = model;
        },
        getTableConfig: async function ({ countryCode, appID, page }) {
            // const keys = await this.model.requestKeyPredicate('/CountryTemplate', {
            //     CountryCode: countryCode,
            //     Application: appID,
            //     Page: page
            // });
            const keys = `(CountryCode='${countryCode}',Application='${appID}',Page='${page}')`;
            const templateBinding = this.model.bindContext(`/CountryTemplate${keys}`, null, {
                $expand: {
                    "Template": {
                        $expand: {
                            "Table": {
                                $expand: {
                                    "Columns": {
                                        $expand: {
                                            "Control": {
                                                $expand: "Properties"
                                            }
                                        }
                                    }
                                }
                            },
                            "Form": {
                                $expand: {
                                    "Layout": {
                                        $expand: "Properties"
                                    },
                                    "FormContainers": {
                                        $expand: {
                                            "FormElements": {
                                                $expand: {
                                                    "Controls": {
                                                        $expand: "Properties"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
            return await templateBinding.requestObject();
        },
        
        
    });
});