sap.ui.define(["sap/ui/base/Object"], function (Object) {

    const TemplateService = Object.extend("com.bayer.tender.statenderapp.service.TemplateService", {
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
                                                        $expand: {
                                                            "Properties": "Properties",
                                                            "ValueHelp": {
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
                            }
                        }
                    }
                }
            });
            return await templateBinding.requestObject();
        },
        getFormConfig: async function ({ countryCode, appID, page }) {
            // const keys = await this.model.requestKeyPredicate('/CountryTemplate', {
            //     CountryCode: countryCode || 'BR',
            //     Application: appID || 'StandardTenders',
            //     Page: page || 'DETAIL'
            // });
            const keys = `(CountryCode='${countryCode}',Application='${appID}',Page='${page}')`;
            const templateBinding = this.model.bindContext(`/CountryTemplate${keys}`, null, {
                $expand: {
                    "Template": {
                        $expand: {
                            "Tabs": {
                                $expand: {
                                    "Forms": {
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
                                    },
                                    "Tables": {
                                        $expand: {
                                            "Columns": {
                                                $expand: {
                                                    "Control": {
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
        getViewConfig: async function ({ countryCode, appID, page }) {
            // const keys = await this.model.requestKeyPredicate('/CountryTemplate', {
            //     CountryCode: countryCode || 'BR',
            //     Application: appID || 'StandardTenders',
            //     Page: page || 'DETAIL'
            // });
            const keys = `(CountryCode='${countryCode}',Application='${appID}',Page='${page}')`;
            const templateBinding = this.model.bindContext(`/CountryTemplate${keys}`, null, {
                $expand: {
                    "Template": {
                        $expand: {
                            "Tabs": {
                                $expand: {
                                    "XMLView": {
                                        $expand: {
                                            "Forms": {
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
                                            },
                                            "Tables": {
                                                $expand: {
                                                    "Columns": {
                                                        $expand: {
                                                            "Control": {
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
                    }
                }
            });
            return await templateBinding.requestObject();
        }
    });
    return TemplateService;
});