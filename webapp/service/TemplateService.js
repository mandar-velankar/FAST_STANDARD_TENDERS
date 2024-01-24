sap.ui.define(["sap/ui/base/Object"], function (Object) {

    const TemplateService = Object.extend("com.bayer.tender.statenderapp.service.TemplateService", {
        constructor: function (model) {
            Object.prototype.constructor.call(this);
            this.model = model;
            this.requestCache = {};
        },
        getTableConfig: async function ({ countryCode, appID, page, productScope }) {
            // const keys = await this.model.requestKeyPredicate('/CountryTemplate', {
            //     CountryCode: countryCode,
            //     Application: appID,
            //     Page: page
            // });
            const keys = `(CountryCode='${countryCode}',Application='${appID}',Page='${page}',ProductScope='${productScope}')`;
            if(this.requestCache[`TableConfig-CountryTemplate${keys}`]){
                return Promise.resolve(this.requestCache[`TableConfig-CountryTemplate${keys}`]);
            }
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
                                                                    },
                                                                    "Filters": {},
                                                                    "StaticValues": {},
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
            this.requestCache[`TableConfig-CountryTemplate${keys}`] = await templateBinding.requestObject();
            return this.requestCache[`TableConfig-CountryTemplate${keys}`];
        },
        getFormConfig: async function ({ countryCode, appID, page, productScope }) {
            // const keys = await this.model.requestKeyPredicate('/CountryTemplate', {
            //     CountryCode: countryCode || 'BR',
            //     Application: appID || 'StandardTenders',
            //     Page: page || 'DETAIL'
            // });
            const keys = `(CountryCode='${countryCode}',Application='${appID}',Page='${page}',ProductScope='${productScope}')`;
            
            if(this.requestCache[`FormConfig-CountryTemplate${keys}`]){
                return Promise.resolve(this.requestCache[`FormConfig-CountryTemplate${keys}`]);
            }
            const templateBinding = this.model.bindContext(`/CountryTemplate${keys}`, null, {
                $expand: {
                    "Template": {
                        $expand: {
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
                                                                        },
                                                                        "Filters": {},
                                                                        "StaticValues": {},
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
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
                            }
                        }
                    }
            });
            this.requestCache[`FormConfig-CountryTemplate${keys}`] = await templateBinding.requestObject();
            return this.requestCache[`FormConfig-CountryTemplate${keys}`];
        },
        getViewConfig: async function ({ countryCode, appID, page, productScope }) {
            // const keys = await this.model.requestKeyPredicate('/CountryTemplate', {
            //     CountryCode: countryCode || 'BR',
            //     Application: appID || 'StandardTenders',
            //     Page: page || 'DETAIL'
            // });
            const keys = `(CountryCode='${countryCode}',Application='${appID}',Page='${page}',ProductScope='${productScope}')`;
            if(this.requestCache[`ViewConfig-CountryTemplate${keys}`]){
                return Promise.resolve(this.requestCache[`ViewConfig-CountryTemplate${keys}`]);
            }
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
                                                                                    },
                                                                                    "Filters": {},
                                                                                    "StaticValues": {},
                                                                                }
                                                                            }
                                                                        }
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
                                                                    },
                                                                    "Filters": {},
                                                                    "StaticValues": {},
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
            this.requestCache[`ViewConfig-CountryTemplate${keys}`] = await templateBinding.requestObject();
            return this.requestCache[`ViewConfig-CountryTemplate${keys}`];
        }
    });
    return TemplateService;
});