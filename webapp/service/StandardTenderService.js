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

		getOfferProductValidation: async function (offerID){
			let oOfferProductValidation = this.model.getObject(sOfferProductValidationKey);
			if(!oOfferProductValidation){
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
			}
			return oOfferProductValidation;
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

    });
});