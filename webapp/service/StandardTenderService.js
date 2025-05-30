sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (Object, Filter, FilterOperator) {

    return Object.extend("com.bayer.tender.statenderapp.service.StandardTenderService", {
        constructor: function (model) {
            Object.prototype.constructor.call(this);
            this.model = model;
        },
        getTender: async function (tenderID) {

			return new Promise((resolve, reject) => {
				this.model.read("/TenderFormView", {
					filters: [
						new Filter("TenderID", "EQ", tenderID)
					],
					success: function (res) {
						resolve(res?.results[0])
					}
				});
			})
		},
		getOffer: async function (offerID) {
			const sOfferKey = this.model.createKey("/OfferFormView", {
				OfferID: offerID
			});
			let oOffer = this.model.getObject(sOfferKey);
			if (!oOffer) {
				return new Promise((resolve, reject) => {
					this.model.read("/OfferFormView", {
						filters: [
							new Filter("OfferID", "EQ", offerID)
						],
						success: function (res) {
							resolve(res?.results[0])
						}
					});
				})
			}
			return oOffer;
		},
		getOfferProduct: async function (offerID, productCode) {
			return new Promise((resolve, reject) => {
					this.model.read("/OfferProductsDetailView", {
						filters: [
							new Filter("OfferID", "EQ", offerID),
							new Filter("ProductCode", "EQ", productCode),
							new Filter("Active", "EQ", 1),
							new Filter("LotID", "EQ", 1),
						],
						success: function (res) {
							resolve(res?.results[0])
						}
					});
				})
		},
		getOfferProducts: async function (offerID) {
			return new Promise((resolve, reject) => {
					this.model.read("/OfferProductsTableView", {
						filters: [
							new Filter("OfferID", "EQ", offerID),
							new Filter("Active", "EQ", 1),
							new Filter("LotID", "EQ", 1),
						],
						success: function (res) {
							resolve({
								products: res?.results,
								productCount: res?.results.length
							}) 
						}
					});
				})
		},
		getProductSKU: async function (countryCode, productCode) {
			const sOfferProductKey = this.model.createKey("/PT_TMSKUPRDPCK", {
				CountryCode: countryCode,
				ProductPackID: productCode,
				ActiveRecord: "Yes"
			});
			let productSku = this.model.getObject(sOfferProductKey);
			if (!productSku) {
				return new Promise((resolve, reject) => {
					this.model.read("/PT_TMSKUPRDPCK", {
						filters: [
							new Filter("CountryCode", "EQ", countryCode),
							new Filter("ProductPackID", "EQ", productCode),
							new Filter("ActiveRecord", "EQ", "Yes")
						],
						success: function (res) {
							resolve(res?.results[0])
						}
					});
				})
			}
			return productSku;
		},

		getOfferProductValidation: async function (offerID){
			return new Promise((resolve, reject) => {
				this.model.read("/OfferProductValidation", {
					filters: [
						new Filter("OFFER_ID", "EQ", offerID)
					],
					success: function (res) {
						resolve(res?.results)
					}
				});
			})
		},

		getOfferStatus: async function (offerID){
			return new Promise((resolve, reject) => {
				this.model.read("/OfferStatus", {
					filters: [
						new Filter("OFFER_ID", "EQ", offerID)
					],
					success: function (res) {
						resolve(res?.results[0])
					}
				});
			})
		},

		getAppConfig: async function (sCountry){
			return new Promise((resolve, reject) => {
				this.model.read("/AppConfig", {
					filters: [
						new Filter("CountryCode", "EQ", sCountry),
						new Filter("ApplicationName", "EQ", 'StandardTender'),
						new Filter("Environment", "EQ", window.location.host.search('dev') > -1 ? 'DEV' : window.location.host.search('qa') > -1 ? 'QA' : window.location.host.search('sbx') > -1 ? 'SBX' : window.location.host.search('prod') > -1 ? 'PRD' : 'LOCL')
					],
					success: function (res) {
						resolve(res?.results)
					}
				});
			})
		},

		getInstitute: async function (institudeID, countryCode) {
			const sInstituteKey = this.model.createKey("/PT_TMINST", {
				InstituteID: institudeID,
				CountryCode: countryCode
			});
			let oInstitute = this.model.getObject(sInstituteKey);
			if (!oInstitute) {
				return new Promise((resolve, reject) => {
					this.model.read("/PT_TMINST", {
						filters: [
							new Filter("InstituteID", "EQ", institudeID),
							new Filter("CountryCode", "EQ", countryCode)
						],
						success: function (res) {
							resolve(res?.results[0])
						}
					});
				})
			}
			return oInstitute;
		},

		getDistributor: async function (distributorID, countryCode) {
			const sDistributorKey = this.model.createKey("/PT_TMDIST", {
				DistributorID: distributorID,
				CountryCode: countryCode
			});
			let oDistributor = this.model.getObject(sDistributorKey);
			if (!oDistributor) {
				return new Promise((resolve, reject) => {
					this.model.read("/PT_TMDIST", {
						filters: [
							new Filter("DistributorID", "EQ", distributorID),
							new Filter("CountryCode", "EQ", countryCode)
						],
						success: function (res) {
							resolve(res?.results[0])
						}
					});
				})
			}
			return oDistributor;
		},

		getAwardedOfferDistributors: async function (offerID, productCode, key) {
			let filters = []

			if (key === 'DistributorID') {
				filters = [
					new Filter("OfferID",FilterOperator.EQ, offerID),
					new Filter("ProductPackID",FilterOperator.EQ, productCode),
				]
			}else {
				filters = [
					new Filter("OfferID",FilterOperator.EQ, offerID),
					new Filter("AssignedProductCode",FilterOperator.EQ, productCode),
				]
			}
			return new Promise((resolve, reject) => {
				this.model.read("/AwardedOfferDistributors", {
					filters: filters,
					success: function (res) {
						resolve(res?.results) 
					}
				});
			})
		},

		getInstituteBrandProducts: async function (offer) {
			const filters = [
				new Filter("COUNTRY_CODE",FilterOperator.EQ, offer.CountryCode),
				new Filter("INSTITUTE_ID",FilterOperator.EQ, offer.InstituteID),
				new Filter("DISTRIBUTOR_ID",FilterOperator.EQ, offer.DistributorID),
				new Filter("CHANNEL",FilterOperator.EQ, offer.Channel)	
			]
			offer.Division !== 'All' && filters.push(new Filter("DIVISION",FilterOperator.EQ, offer.Division));
			return new Promise((resolve, reject) => {
				this.model.read("/InstituteDistributorBrandProduct", {
					filters: filters,
					success: function (res) {
						resolve(res?.results) 
					}
				});
			})
		},

		getAwardedContractDurations: async function (offerID, ProductCode) {
			const filters = [
				new Filter("OfferID",FilterOperator.EQ, offerID),
				new Filter("ProductCode",FilterOperator.EQ, ProductCode)
			]
			return new Promise((resolve, reject) => {
				this.model.read("/ContractInfomation", {
					filters: filters,
					success: function (res) {
						resolve(res?.results) 
					}
				});
			})
		},
		getAwardedProduct: async function (offerID, ProductCode) {
				const filters = [
					new Filter("OfferID",FilterOperator.EQ, offerID),
					new Filter("ProductCode",FilterOperator.EQ, ProductCode),
					new Filter("LotID",FilterOperator.EQ, 1)
				]
			return new Promise((resolve, reject) => {
				this.model.read('/AwardedProductFormView', {
					filters: filters,
					success: function (res) {
						resolve(res?.results[0]) 
					}
				});
			})
		},
		getInstituteInContract: function ({Custom_String_3,InstituteID,CountryCode}) {
			const InstituteNames = Custom_String_3.split(";")
			const orFilters = []
			let andFilters = []
			let oFilters;
			if (Custom_String_3) {
				andFilters = [
					new Filter("ParentInstituteID", FilterOperator.EQ, InstituteID ),
					new Filter("InstituteID", FilterOperator.NE, InstituteID),
				]
				for(let instituteName in InstituteNames){
					orFilters.push(new Filter({
						path: "InstituteName",
						operator: FilterOperator.EQ,
						value1: InstituteNames[instituteName]
					}));
				}
				andFilters.push(new Filter(orFilters, false))
			 	oFilters = [new Filter(andFilters, true)];
			}else{
				andFilters = [
					new Filter("CountryCode", FilterOperator.EQ, CountryCode ),
					new Filter("InstituteID", FilterOperator.EQ, InstituteID),
				]
				oFilters = [new Filter(andFilters, true)];
			}
			const path = Custom_String_3 == '' ? "/PT_TMINST" : '/InstitutesInGroup';
			return new Promise((resolve, reject) => {
				this.model.read(path, {
					filters: oFilters,
					success: function (res) {
						resolve(res?.results)
					}
				});
			})
		},
		getBrandsInOffer: async function (brandID, countryCode) {
			return new Promise((resolve, reject) => {
					this.model.read("/BrandsInTender", {
						filters: [
							new Filter("BRANDID", "EQ", brandID),
							new Filter("COUNTRYCODE", "EQ", countryCode),
						],
						success: function (res) {
							resolve(res?.results.map(el => el.OFFERID))
						}
					});
				})
		},

		getComplianceOfficerData: async function (OfferID) {
			return new Promise((resolve, reject) => {
					this.model.read("/ComplianceOfficerView", {
						filters: [
							new Filter("OfferID", "EQ", OfferID)
						],
						success: function (res) {
							resolve(res?.results[0]);
						}
					});
				})
		},

		getOfferValidation: async function (OfferID) {
			const offerValidationPath = this.model.createKey("/OfferValidation", {
				OFFERID: OfferID
			});
			let offerValidation = this.model.getObject(offerValidationPath);
			if (!offerValidation) {
				return new Promise((resolve, reject) => {
						this.model.read("/OfferValidation", {
							filters: [
								new Filter("OFFERID", "EQ", OfferID)
							],
							success: function (res) {
								resolve(res?.results[0]);
							}
						});
				});
			}
			return offerValidation;
		},

		resetOfferApprovalSent: async function (OfferID) {
			const path = this.model.createKey("/PT_TMOFRS", {
				OfferID: OfferID
			});
			return new Promise((resolve, reject) => {
				this.model.update(path, {
					APPROVALS_SENT: 0
				},
				{
					success: function (res) {
						resolve(res); // Resolve the promise on success
					},
				});
			});
		},
		
		getUserInfo: async function(cwid){
			return new Promise((resolve, reject) => {
				this.model.read("/Users", {
					filters: [
						new Filter("UserID", "EQ", cwid)
					],
					success: function (res) {
						resolve(res?.results[0])
					}
				});
			})
		},

		getPriceCondition: function (path) {
			return new Promise((resolve, reject) => {
				this.model.read(path,
				{
					success: function (res) {
						resolve(res); // Resolve the promise on success
					},
				});
			});
		},
		getTemplateIDByName: function (name) {
			return new Promise((resolve, reject) => {
				this.model.read("/ExcelTemplate",
				{
					filters: [
						new Filter ("name", FilterOperator.EQ, name)
					],
					success: function (res) {
						resolve(res?.results?.[0]?.templateId); // Resolve the promise on success
					},
				});
			});
        },

		getTemplateContent: async function (templateName) {
			const templateId = await this.getTemplateIDByName(templateName);
			return await fetch(`${this.model.sServiceUrl}/ExcelTemplate(${templateId})/$value`, {
				method: "GET",
				headers: {
					"Accept": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
				},
				credentials: "include" // Important if using authentication
			})
			.then(response => response.blob())
			.then(blob => blob.arrayBuffer())
			.catch(error => console.error("Error:", error));
		},
		
		getQuotationInfo: function (offerID) {
			return new Promise((resolve, reject) => {
				this.model.read("/PT_TMQUTO",
				{
					filters: [
						new Filter ("OfferID", FilterOperator.EQ, offerID)
					],
					success: function (res) {
						resolve(res?.results?.[0]);
					},
				});
			});
        },
		getStandardTenderPriceConditionView: function (tenderID,offerID,productID) {
			return new Promise((resolve, reject) => {
				this.model.read("/StandardTenderPriceConditionView",
				{
					filters: [
						new Filter ("TenderID", FilterOperator.EQ, tenderID),
						new Filter ("OfferID", FilterOperator.EQ, offerID),
						new Filter ("ProductCode", FilterOperator.EQ, productID)
					],
					success: function (res) {
						resolve(res?.results);
					},
				});
			});
		},

		getBankGuarantee: async function (tenderID, type) {
			return new Promise((resolve, reject) => {
				this.model.read("/BankGuarantees", {
					filters: [
						new Filter("TenderID", "EQ", tenderID),
						new Filter("Type", "EQ", type)
					],
					success: function (res) {
						resolve(res?.results[0])
					}
				});
			})
		},
    });
});