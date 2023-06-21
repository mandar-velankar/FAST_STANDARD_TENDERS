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

		getPreApprovedPrice: function (instituteID, countryCode) {

            let sPath = "/AccountPreApprovedPrices";
			let filters = [];

            filters.push(new Filter({
                path: 'COUNTRY_CODE',
                operator: FilterOperator.EQ,
                value1: countryCode
            }));
            filters.push(new Filter({
                path: 'INSTITUTE_ID',
                operator: FilterOperator.EQ,
                value1: instituteID
            }));

			return new Promise((resolve, reject) => {
				this.model.read(sPath, {
					filters: filters,
					success: function (res) {
						resolve(res?.results)
					}
				});
			})
        },

		getOfferProductOfferStatus: function (offerID){
			let sPath = "/OfferProductOfferStatus";
			let filters = [];

            filters.push(new Filter({
                path: 'OfferId',
                operator: FilterOperator.EQ,
                value1: offerID
            }));
            filters.push(new Filter({
                path: 'Active',
                operator: FilterOperator.EQ,
                value1: "1"
            }));

			return new Promise((resolve, reject) => {
				this.model.read(sPath, {
					filters: [
						new Filter("OfferId", "EQ", offerID),
						new Filter("Active", "EQ", "1"),
					],
					urlParameters: {
						"$expand": "ApproverList,ApproverTypes" //added from results on
					},
					sorter: new sap.ui.model.Sorter('ApproverTypeSection'),
					success: function (res) {
						resolve(res?.results)
					}
				});
			})
		},

		loadApprovalsForOffer: async function (offerID, instituteID, countryCode, model) {

			//const preApprovedPrice = await this.getPreApprovedPrice(instituteID, countryCode);

			//if(preApprovedPrice){
				const offerProductOfferStatus = await this.getOfferProductOfferStatus(offerID);
				if(offerProductOfferStatus){

					//sorting by approver type
					//oData.results = that.sortByKeyAsc(oData.results, "ApproverTypeSection");

					offerProductOfferStatus.forEach(function (approver, index) {

						//if(oApprover.ApproverType === "Country Business" || oApprover.ApproverType === "Supply Chain") {
						if (approver.ApproverTypeSection === 1) {
							approver.send = 'Yes';
						} else {
							approver.send = 'No';
						}

						//for waiting & notification sent, it would be forced to "no"
						if (
							approver.ApprovalStatus === 'Waiting' ||
							approver.ApprovalStatus === "Notification Sent" ||
							approver.ApprovalStatus === "Processing" ||
							approver.ApprovalStatus === "Cancelling"
						) {
							approver.send = 'No';
						}

					});

					//model.setProperty("/ApprovalsSelectedOffer", offerProductOfferStatus);
					return offerProductOfferStatus;
				}
			//}
        }        
    });
});