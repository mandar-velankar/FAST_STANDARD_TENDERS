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

		getOfferID: function () {
			return this.OfferID;
		},

		setOfferID: function (OfferID) {
            this.OfferID = OfferID;
        },

		getTenderID: function(){
			return this.tenderID;
		},

		setTenderID: function(tenderID){
			this.tenderID = tenderID;
		},

		setIsMultiDistributorEnabledPerProduct: function(isEnabled){
            this.isMultiDistributorEnabledPerProduct = isEnabled;
        },

		getIsMultiDistributorEnabledPerProduct: function(){
			return this.isMultiDistributorEnabledPerProduct;
		},

		setCountryDistributors: function(countryDistributors){
			this.countryDistributors = countryDistributors;
		},

		getCountryDistributors: function(){
			return this.countryDistributors;
		},

		onChangeOutcome: function (event, StandardSingletonService) {
			const source = event.getSource();
			const formElements = source.getParent().getParent().getAggregation("formElements");
		
			const reasonElement = formElements.find(el => 
				el.getAggregation("label") === "Reason" || el.getAggregation("label") === "得標或失敗原因"
			);
		
			if (reasonElement) {
				const reasonItemBinding = reasonElement.getAggregation("fields")[0].getBinding("items");
		
				reasonItemBinding.aApplicationFilters = [];
				const orFilters = [new Filter("Outcome", FilterOperator.EQ, source.getSelectedKey())];
				reasonItemBinding.filter(orFilters);
			}
			this.setOutcome(source.getSelectedKey());
		},
		

        onChangeSample: function (event) {
            const source = event.getSource();
            const itemBinding = source.getParent().getParent().getAggregation("formElements")?.find(el => el.getAggregation("label") === "Sample Quantity")?.getAggregation("fields")[0];
            if(itemBinding){
                source.getSelectedKey() === 'No' || source.getSelectedKey() == '' ? itemBinding.setProperty("enabled", false) : itemBinding.setProperty("enabled", true);
            }     
        },

		onChangeClassification: function (event, StandardSingletonService) {
			const countryCode = StandardSingletonService.CountryCode;
			if (countryCode !== 'ES') {
				return;
			}
		
			const selectedClassification = event.getValue();
			const formContainers = event.getParent().getParent().getParent().getAggregation("formContainers");
		
			// Find Timeline Section
			const timelineContainer = formContainers.find(container => container.getAggregation("title") === "Timeline");
		
			// Find Institute & Type Section
			const instituteTypeContainer = formContainers.find(container => container.getAggregation("title") === "Institute & Type");
		
			// Get all form elements from the sections
			const timelineElements = timelineContainer.getAggregation("formElements");
			const instituteTypeElements = instituteTypeContainer.getAggregation("formElements");
		
			// Find specific elements (Effective Date, Expiry Date, Tender Types)
			const effectiveDateElement = timelineElements.find(el => el.getAggregation("label") === "Contract Start Date");
			const expiryDateElement = timelineElements.find(el => el.getAggregation("label") === "Contract End Date");
		
			const tenderTypeElement = instituteTypeElements.find(el => el.getAggregation("label") === "Tender Type");
			const tenderType2Element = instituteTypeElements.find(el => el.getAggregation("label") === "Tender Type 2");
		
			if (selectedClassification === 'Commercial Agreement') {
				// Show only EffectiveDate and ExpiryDate in Timeline
				timelineElements.forEach(el => {
					el.setVisible(false);
				});
				effectiveDateElement.setVisible(true);
				expiryDateElement.setVisible(true);
		
				tenderTypeElement.setVisible(false);
				tenderType2Element.setVisible(false);
			} else if (selectedClassification === 'Tender') {
				// Show all fields in Timeline except EffectiveDate/ExpiryDate
				timelineElements.forEach(el => {
					el.setVisible(true);
				});
				effectiveDateElement.setVisible(false);
				expiryDateElement.setVisible(false);
		
				tenderTypeElement.setVisible(true);
				tenderType2Element.setVisible(true);
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
					originalInputField.getModel().setProperty(`${path}/Custom_String_2`, undefined);
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
				case "ES": 
					const regionsMultiSelectField = originalInputField.getParent().getParent().getParent().getAggregation("formContainers")
					.find(el => el.getAggregation("title") === "Institute & Type").getAggregation("formElements")
					.find(el => el.getAggregation("label") === "Regions");

					regionsMultiSelectField.setVisible(selectedItem.ChannelName === "Region(s)");

					// originalInputField.getModel().setProperty(`${path}/State`, undefined);
					regionsMultiSelectField.getFields()[0].removeAllTokens()
					break;
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
					for(const value of institutesInGroup.split(";")){
						institutesInGroupField.getFields()[0]?.addToken(new Token({key: value, text:value}));
					}
						
					break;
				case "ES": 
				const instituteRegion = await StandardSingletonService.getRegionByID(selectedItem, countryCode, defaultModel);
				const regionsMultiSelectField = originalInputField.getParent().getParent().getParent().getAggregation("formContainers")
					.find(el => el.getAggregation("title") === "Institute & Type").getAggregation("formElements")
					.find(el => el.getAggregation("label") === "Regions");
					regionsMultiSelectField.getFields()[0].removeAllTokens();

					for(const value of instituteRegion.split(",")){
						regionsMultiSelectField.getFields()[0]?.addToken(new Token({key: value, text:value}));
					}
					break;
				default:
					break;
			}
		},

		onChangeRegions: async function (originalInputField, selectedItems, StandardSingletonService) {
			const countryCode = StandardSingletonService.getCountryCode();
			const ctx = originalInputField.getParent().getParent().getParent().getBindingContext();
			const path = ctx.getPath();
			const defaultModel = originalInputField.getModel();


			switch (countryCode) {
				case "GB":
					debugger;
					let regions = selectedItems.map(item => item.getBindingContext().getObject().Name).join(',');
					defaultModel.setProperty(`${path}/Custom_String_2`, regions);
					break;
				default:
					break;
			}
		},

		onChangeInstitutesInGroup: async function (originalInputField, selectedItems, StandardSingletonService) {
			const countryCode = StandardSingletonService.getCountryCode();
			const ctx = originalInputField.getParent().getParent().getParent().getBindingContext();
			const path = ctx.getPath();
			const defaultModel = originalInputField.getModel();


			switch (countryCode) {
				case "NL":
					let instInGroup = selectedItems.map(item => item.getBindingContext().getObject().InstituteName).join(';');
					defaultModel.setProperty(`${path}/Custom_String_3`, instInGroup);
					break;
				default:
					break;
			}
		},

		onChangeInstituteInBranch: async function (originalInputField, selectedItems, StandardSingletonService) {
			const countryCode = StandardSingletonService.getCountryCode();
			const ctx = originalInputField.getParent().getParent().getParent().getBindingContext();
			const path = ctx.getPath();
			const defaultModel = originalInputField.getModel();


			switch (countryCode) {
				case "TW":
					let instInBranch = selectedItems.map(item => item.getBindingContext().getObject().InstituteName).join(',');
					defaultModel.setProperty(`${path}/Custom_String_3`, instInBranch);
					break;
				default:
					break;
			}
		},

		onChangeDistributor: async function (originalInputField, selectedItems, StandardSingletonService) {
			if (!(originalInputField instanceof sap.m.MultiInput) || !StandardSingletonService.getIsMultiDistributorEnabledPerProduct()) return;

			const ctx = originalInputField.getBindingContext();
			const path = ctx.getPath();
			const defaultModel = originalInputField.getModel();
			const inputBindingPath = originalInputField.getBinding("value")?.getPath() || "Custom_String_6";
			const distributors = selectedItems.map(item => item.getBindingContext().getObject().DistributorID).join(',');

			defaultModel.setProperty(`${path}/${inputBindingPath}`, distributors);
		},

		getInstituteBranchs: async function (selectedItem, countryCode, originalInputField) {
			return new Promise((resolve, reject) => {
				originalInputField.getModel().read('/InstituteInBranchView', {
					filters: [
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
						resolve(res.results.reduce((acc,curr)=> acc ? `${acc};${curr.InstituteName}` : `${acc}${curr.InstituteName}`, ''))
					},

					error: function (err) {

					}
				});
			});
		},

		getRegionByID: async function (selectedItem, countryCode, defaultModel) {
			return new Promise((resolve, reject) => {
				defaultModel.read('/CountryRegionsTableView', {
					filters: [
						new Filter("CountryCode", "EQ", countryCode),
						new Filter("ID", "EQ", selectedItem?.RegionID),
					],
					success: function (res) {
						resolve(res.results.reduce((acc,curr)=> acc ? `${acc};${curr.Name}` : `${acc}${curr.Name}`, ''))
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

        getEnablementObject: function (status, isProductDeclined, stTenderRoles, UserInfo, CountryCode, savedQuotations, savedAwardedProductsCount, tender) {

			const isQuotationSaved = (savedQuotations?.count > 0 && savedAwardedProductsCount.count > 0);
			const isOverviewTabVisible = !!status;
			const checkCopyOfferBtn = status === "Quotation Submitted" || 
										status === "Results Recorded" || 
										status === "Delivery Ongoing" || 
										status === "Outcome Accepted" || 
										status === "Outcome Partially Accepted" || 
										status === "Outcome Rejected"? true : false;
			const isDeliveryTruckingVisible = status === "Results Recorded" || status === "Delivery Ongoing" ? true : false;

			const isTenderOfferOverviewVisible = status === "Offer Created" || status === "Offer Approved" || status === "Offer Rejected" ? true : false;

			const isEnabledDeleteOfferBtn = status === "Offer Created" ? true : false;

			const isAwardDetailEnabled = (status === "Quotation Submitted" || 
									status === "Results Recorded" || 
									status === "Outcome Accepted" || 
									status === "Outcome Partially Accepted" || 
									status === "Outcome Rejected") ? true : false;
			const checkOverviewDownloadBtn = (status === "Offer Created" || status === "Awaiting Approval") ? false : true;
			const checkOverviewSetAsSubmitBtn = status === "Offer Approved" ? true : checkCopyOfferBtn ? !isQuotationSaved : false;
			const isApprovalButtonEnabled = CountryCode.includes('HM') ? UserInfo.Role !== "Restricted User Role" : true;
			const isSendApprovalBtnEnabled = (status === "Offer Rejected" || status === "Offer Created") ? true : false;
			const isCancelApprovalBtnEnabled = (status === "Awaiting Approval") ? true : false;

			const isSendNotificationEnabledForHematology = status === "Offer Created";

			const isAwardedTabAccessGrantedForPolishUSer =  UserInfo.Role === 'Tender Manager' || UserInfo.Role === 'Sales Manager';
			const isAwardedTabVisible = CountryCode === 'PL' ? isAwardedTabAccessGrantedForPolishUSer && checkCopyOfferBtn : checkCopyOfferBtn && !stTenderRoles.LimitedPricingTabAccess;
			const isAwardedProductDetailPageEditable = CountryCode === 'PL' ? isAwardedTabAccessGrantedForPolishUSer && isAwardDetailEnabled : isAwardDetailEnabled;
			const isPolandTMApproveButtonVisible = CountryCode === 'PL' && status === "Awaiting Approval" && UserInfo.Role === 'Tender Manager';

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
							enableCopyOffer: checkCopyOfferBtn,
							enableSendNotificationHematology: isSendNotificationEnabledForHematology
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
							enableApprovalButton: isApprovalButtonEnabled,
							enableSendApprovalBtn: isSendApprovalBtnEnabled,
							enableCancelApprovalBtn: isCancelApprovalBtnEnabled,
							isPolandTMApproveButtonVisible: isPolandTMApproveButtonVisible
						}
					},
					AwardTab: {
						isVisible: isAwardedTabVisible
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
						editMode: isAwardedProductDetailPageEditable
					},
					CompetitorResult: {
						editMode: isAwardedProductDetailPageEditable
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