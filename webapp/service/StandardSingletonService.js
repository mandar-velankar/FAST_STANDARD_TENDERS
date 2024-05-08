sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/Token",
], function(Object, Filter, FilterOperator, Token) {
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

		getTenderID: function(){
			return this.tenderID;
		},

		setTenderID: function(tenderID){
			this.tenderID = tenderID;
		},

        onChangeOutcome: function (event, StandardSingletonService) {
            const source = event.getSource();
            const reasonItemBinding = source.getParent().getParent().getAggregation("formElements")
				.find(el => el.getAggregation("label") === "Reason" || el.getAggregation("label") === "得標或失敗原因")
				.getAggregation("fields")[0].getBinding("items");
				
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
			const stModel = originalInputField.getModel('st');
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
					originalInputField.getModel().setProperty(`${path}/Custom_String_3`, "");
					originalInputField.getParent().getParent().getParent().getAggregation("formContainers")
					.find(el => el.getAggregation("title") === "Institute & Type" || el.getAggregation("title") === "機構及類型").getAggregation("formElements")
					.find(el => el.getAggregation("label") === "Institute In Branch" || el.getAggregation("label") === "分院研究所").getFields()[0].removeAllTokens();
					break
				case "NL": 
					const institutesInGroup = originalInputField.getParent().getParent().getParent().getAggregation("formContainers")
					.find(el => el.getAggregation("title") === "Institute & Type").getAggregation("formElements")
					.find(el => el.getAggregation("label") === "Institutes In Group");
					const bBuyingGroupSelected =  selectedItem.ChannelName === "Buying Group";
					!bBuyingGroupSelected && originalInputField.getModel().setProperty(`${path}/Custom_String_3`, '');
					!bBuyingGroupSelected && institutesInGroup.getFields()[0].removeAllTokens();
					institutesInGroup.setVisible(true);
					break
				default:
					break;
			}
		},

		onChangeInstituteName: async function (originalInputField, selectedItem, StandardSingletonService) {
			const countryCode = StandardSingletonService.getCountryCode();
			const ctx = originalInputField.getParent().getParent().getParent().getBindingContext();
			const path = ctx.getPath();
			const defaultModel = originalInputField.getModel();


			switch (countryCode) {
				case "TW":
					const instInBranchField = originalInputField.getParent().getParent().getParent().getAggregation("formContainers")
					.find(el => el.getAggregation("title") === "Institute & Type" || el.getAggregation("title") === "機構及類型").getAggregation("formElements")
					.find(el => el.getAggregation("label") === "Institute In Branch" || el.getAggregation("label") === "分院研究所").getFields()[0];
					let institutesInBranch = await StandardSingletonService.getInstituteBranchs(selectedItem, countryCode, originalInputField);
					originalInputField.getModel().setProperty(`${path}/Custom_String_3`, institutesInBranch);
					instInBranchField.removeAllTokens();
					for(const value of institutesInBranch.split(",")){
						instInBranchField?.addToken(new Token({key: value, text:value}));
					}
					
					break;
				case "NL":
					let institutesInGroup = await StandardSingletonService.getInstitutesInGroup(selectedItem, countryCode, defaultModel);
					const institutesInGroupField = originalInputField.getParent().getParent().getParent().getAggregation("formContainers")
					.find(el => el.getAggregation("title") === "Institute & Type").getAggregation("formElements")
					.find(el => el.getAggregation("label") === "Institutes In Group");
					institutesInGroupField.setVisible(!!institutesInGroup);
					defaultModel.setProperty(`${path}/Custom_String_3`, institutesInGroup);
					institutesInGroupField.getFields()[0].removeAllTokens();
					for(const value of institutesInGroup.split(",")){
						institutesInGroupField.getFields()[0]?.addToken(new Token({key: value, text:value}));
					}
						
					break;
				default:
					break;
			}
		},

		getInstituteBranchs: async function (selectedItem, countryCode, originalInputField) {
			return new Promise((resolve, reject) => {
				originalInputField.getModel().read('/InstituteInBranchView', {
					filters: [
						new Filter("CountryCode", "EQ", countryCode),
						new Filter("ParentInstituteID", "EQ", selectedItem.ParentInstituteID),
						new Filter("InstituteID", "NE", selectedItem.InstituteID)
					],
					success: function (res) {
						resolve(res.results.reduce((acc,curr)=> acc ? `${acc},${curr.InstituteName}` : `${acc}${curr.InstituteName}`, ''))
					},

					error: function (err) {

					}
				});
			});
		},

		getInstitutesInGroup: async function (selectedItem, countryCode, defaultModel) {
			return new Promise((resolve, reject) => {
				defaultModel.read('/InstitutesInGroup', {
					filters: [
						new Filter("CountryCode", "EQ", countryCode),
						new Filter("ParentInstituteID", "EQ", selectedItem?.InstituteID),
						new Filter("InstituteID", "NE", selectedItem?.InstituteID),
					],
					success: function (res) {
						resolve(res.results.reduce((acc,curr)=> acc ? `${acc},${curr.InstituteName}` : `${acc}${curr.InstituteName}`, ''))
					},

					error: function (err) {

					}
				});
			});
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

        getEnablementObject: function (status, isProductDeclined, stTenderRoles) {

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
							editMode: !status || isTenderOfferOverviewVisible
						},
						TenderForm:{
							editMode: !status || isTenderOfferOverviewVisible	
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
						isVisible: isOverviewTabVisible && !stTenderRoles.LimitedPricingTabAccess,
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
						isVisible: checkCopyOfferBtn && !stTenderRoles.LimitedPricingTabAccess,
					},
					DeliveryTrackingTab: {
						isVisible: isDeliveryTruckingVisible && !stTenderRoles.LimitedPricingTabAccess,
					}
				},
				OfferProductDetail: {
					OfferProductInfo:{
						editMode: isTenderOfferOverviewVisible
					},
					OfferPricingInfo:{
						isVisible: !stTenderRoles.LimitedPricingTabAccess,
						editMode: isTenderOfferOverviewVisible && !isProductDeclined 
					},
					OfferProductFOC:{
						isVisible: !stTenderRoles.LimitedPricingTabAccess,
						editMode: isTenderOfferOverviewVisible && !isProductDeclined
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