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
			const sOfferProductKey = this.model.createKey("/OfferProductsDetailView", {
				OfferID: offerID,
				ProductCode: productCode,
				Active: 1,
				LotID: 1
			});
			let oOfferProduct = this.model.getObject(sOfferProductKey);
			if (!oOfferProduct) {
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
			}
			return oOfferProduct;
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
		}

    });
});