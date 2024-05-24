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
			const sTenderKey = this.model.createKey("/TenderFormView", {
				TenderID: tenderID
			});
			let oTender = this.model.getObject(sTenderKey);
			if (!oTender) {
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
			}
			return oTender;
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
						new Filter("ApplicationName", "EQ", 'Standard'),
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
    });
});