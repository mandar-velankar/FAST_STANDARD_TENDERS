sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(Object, Filter, FilterOperator) {
    "use strict";
    var StandardSingleton = Object.extend("namespace.service.StandardSingleton", {
        constructor: function () {
            Object.prototype.constructor.call(this);
            this.countryCode = "";
            this.outcome = "";
			this.selectedOfferQuotationInstituteID = "";
			this.instituteID
        },
        setCountryCode: function(sCountryCode){
            this.countryCode = sCountryCode;
        },

        getCountryCode: function(){
            return this.countryCode;
        },

        setOutcome: function (outcome) {
            this.outcome = outcome;
        },

        getOutcome: function () {
            return this.outcome;
        },

		setSelectedOfferQuotationInstituteID: function (quotationInstituteID) {
			this.selectedOfferQuotationInstituteID = quotationInstituteID;
		},

		getSelectedOfferQuotationInstituteID: function () {
			return this.selectedOfferQuotationInstituteID;
		},

		getParentInstituteID: function () {
			return this.instituteID;
		},

		setParentInstituteID: function (instituteID) {
            this.instituteID = instituteID;
        },

		getInstituteID: function () {
			return this.instituteID;
		},

		setInstituteID: function (instituteID) {
            this.instituteID = instituteID;
        },

		getBU: function () {
			return this.BU;
		},

		setBU: function (BU) {
            this.BU = BU;
        },

        onChangeOutcome: function (event, StandardSingletonService) {
            const source = event.getSource();
            const reasonItemBinding = source.getParent().getParent().getAggregation("formElements").find(el => el.getAggregation("label") === "Reason").getAggregation("fields")[0].getBinding("items");
            this.setOutcome(source.getSelectedKey());
            reasonItemBinding.aApplicationFilters = []
            const orFilters = [
				new Filter("Outcome",FilterOperator.EQ, source.getSelectedKey())
			]
            reasonItemBinding.filter(orFilters);
        },

        onChangeSample: function (event) {
            const source = event.getSource();
            const itemBinding = source.getParent().getParent().getAggregation("formElements")?.find(el => el.getAggregation("label") === "Sample Quantity")?.getAggregation("fields")[0];
            if(itemBinding){
                source.getSelectedKey() === 'No' || source.getSelectedKey() == '' ? itemBinding.setProperty("enabled", false) : itemBinding.setProperty("enabled", true);
            }     
        },

		onChangeQuotationInstitute: function (originalInputField, selectedItem, StandardSingletonService) {
            const paymentTermsBinding = originalInputField.getParent().getParent().getParent().getAggregation("formContainers")[2].getAggregation("formElements").find(el => el.getAggregation("label") === "Payment Term")?.getAggregation("fields")[0].getBinding("items");
            const parentInstituteID = StandardSingletonService.getParentInstituteID();
            const countryCode = StandardSingletonService.getCountryCode();
            paymentTermsBinding.aApplicationFilters = []
            const orFilters = [
				new Filter("ParentInstituteID",FilterOperator.EQ, parentInstituteID),
				new Filter("InstituteID",FilterOperator.EQ, selectedItem.QuotationInstituteID),
				new Filter("CountryCode",FilterOperator.EQ, countryCode),
			]
            paymentTermsBinding.filter(orFilters);
		},

		getQuotationInstituteID: function () {
			return this.selectedOfferQuotationInstituteID;
		},

		onChangeInstituteType: function (originalInputField, selectedItem, StandardSingletonService) {
			const countryCode = StandardSingletonService.getCountryCode();
			const ctx = originalInputField.getParent().getParent().getParent().getBindingContext();
			const path = ctx.getPath();

			originalInputField.getModel().setProperty(`${path}/InstituteID`, undefined);
			originalInputField.getModel().setProperty(`${path}/InstituteName`, undefined);

			switch (countryCode) {
				case "GB":
					const regionsField = originalInputField.getParent().getParent().getParent().getAggregation("formContainers")
					.find(el => el.getAggregation("title") === "Institute & Type").getAggregation("formElements")
					.find(el => el.getAggregation("label") === "Regions");


					if (selectedItem.ChannelName === "Region(s)") {
						regionsField.setVisible(true);
					}else {
						regionsField.setVisible(false);
					}

					originalInputField.getModel().setProperty(`${path}/State`, undefined);
					regionsField.getFields()[0].removeAllTokens()
					break;
				case "TW": 
					originalInputField.getModel().setProperty(`${path}/External_InstituteId`, undefined);
					originalInputField.getModel().setProperty(`${path}/Address`, undefined);
					break
				default:
					break;
			}
		},

        // onChangeProductIncluded: function (event) {
        //     const source = event.getSource();
        //     const itemBinding = source.getParent().getParent().getAggregation("formElements")?.find(el => el.getAggregation("label") === "Comment")?.getAggregation("fields")[0];
        //     if(itemBinding){
        //         source.getSelectedKey() === '1'? itemBinding.setProperty("enabled", false) : itemBinding.setProperty("enabled", true);
        //     }
        // },


		/**
		 * Generates an enablement object based on the given status.
		 * The enablement object contains properties that control the visibility
		 * and enablement of different tabs, buttons, and elements within an application.
		 *
		 * @param {string} status - The status that determines the enablement configuration.
		 * @returns {Object} An object with properties indicating visibility and enablement settings.
		 */

        getEnablementObject: function (status) {

			const isOverviewTabVisible = !!status;
			const checkCopyOfferBtn = status === "Quotation Submitted" || status === "Results Recorded" || status === "Delivery Ongoing" ? true : false;
			const isDeliveryTruckingVisible = status === "Results Recorded" || status === "Delivery Ongoing" ? true : false;

			const isTenderOfferOverviewVisible = status === "Offer Created" || status === "Offer Approved" || status === "Offer Rejected" ? true : false;

			const isEnabledDeleteOfferBtn = status === "Offer Created" ? true : false;

			const isAwardDetailEnabled = (status === "Quotation Submitted" || status === "Results Recorded") ? true : false;
			const checkOverviewDownloadBtn = (status === "Offer Created" || status === "Awaiting Approval") ? false : true;
			const checkOverviewSetAsSubmitBtn = (status === "Offer Approved") ? true : false;
			const isSendApprovalBtnEnabled = (status === "Offer Rejected" || status === "Offer Created") ? true : false;
			const isCancelApprovalBtnEnabled = (status === "Awaiting Approval") ? true : false;

			return {
				Detail: {
					TenderTab: {
						isVisible: true,
						AwardCriteria:{
							editMode: isTenderOfferOverviewVisible
						},
						TenderForm:{
							editMode: isTenderOfferOverviewVisible	
						},
					},
					OfferTab: {
						isVisible: true,
						OfferForm:{
							editMode: isTenderOfferOverviewVisible,
							enableCreateOffer: true,
							enableDeleteOffer: isEnabledDeleteOfferBtn,
							enableCopyOffer: checkCopyOfferBtn
						},
						OfferProductTable:{
							editMode: isTenderOfferOverviewVisible,
						},
					},
					OverviewTab: {
						isVisible: isOverviewTabVisible,
						enableDownload: checkOverviewDownloadBtn,
						enableSetAsSubmited: checkOverviewSetAsSubmitBtn,
						OverviewForm: {
							editMode: isTenderOfferOverviewVisible,
						},
						Approval: {
							enableSendApprovalBtn: isSendApprovalBtnEnabled,
							enableCancelApprovalBtn: isCancelApprovalBtnEnabled
						}
					},
					AwardTab: {
						isVisible: checkCopyOfferBtn,
					},
					DeliveryTrackingTab: {
						isVisible: isDeliveryTruckingVisible,
					}
				},
				OfferProductDetail: {
					OfferProductInfo:{
						editMode: isTenderOfferOverviewVisible
					},
					OfferPricingInfo:{
						editMode: isTenderOfferOverviewVisible
					},
					OfferProductFOC:{
						editMode: isTenderOfferOverviewVisible
					},
				},
				AwardedProductDetail: {
					AwardDetail: {
						editMode: isAwardDetailEnabled
					},
					CompetitorResult: {
						editMode: isAwardDetailEnabled
					}
				},
				DeliveryTrackingDetail: {
					DeliveryDetail: {
						editMode: isDeliveryTruckingVisible
					}
				},
			}
		},

    });

    
    return new StandardSingleton();
});