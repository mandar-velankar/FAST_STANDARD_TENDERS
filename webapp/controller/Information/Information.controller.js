sap.ui.define([
	"../BaseController",
	"sap/ui/model/json/JSONModel",
	"../../model/formatter",
	"sap/m/library",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Context",
	"sap/ui/core/Fragment"
], function (BaseController, JSONModel, formatter, mobileLibrary, Filter, FilterOperator, Context, Fragment) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return BaseController.extend("com.bayer.tender.statenderapp.controller.Information.Information", {
		onInit: function () {
			// set message model
			this.oMessageManager = sap.ui.getCore().getMessageManager();
			this.getView().setModel(this.oMessageManager.getMessageModel(), "message");
			
			this.stState = this.getOwnerComponent().getModel("st");

			// activate automatic message generation for complete view
			this.oMessageManager.registerObject(this.getView(), true);
			this.getRouter().getRoute("objectDetailOverview").attachPatternMatched(this._onObjectMatched, this);

		},
		onBeforeShow: async function (iconTabfilter,{objectId, offerId, countryCode}) {
			this.templateState = this.getOwnerComponent().getModel("template");
			this.templateStateData = this.templateState.getData();
			this.oOwnerComponent = this.getOwnerComponent();
			this.oRouter = this.oOwnerComponent.getRouter();

			this.defaultModel = this.getOwnerComponent().getModel();
			
			//this.getView().getBindingContext("template"); // get current tab data
			// await this.getOwnerComponent().getModel().metadataLoaded();
			this.tenderId = objectId;
			this.offerId = offerId;
			this.countryCode = countryCode;
			this.selectedTab = iconTabfilter.getKey();

			const oModel = new JSONModel({
				busy: false,
				delay: 0,
				editMode: false,
				minDate: new Date(),
				OverviewForm:{
					editMode: false
				},
				enableApprovalButton: false
			});
			
			this.setModel(oModel, "ui");

			this.bindFields();
			
			await this.approvalButtonEnableCheck();
			
		},

		onCloseApprovalDialog: function(){
			this.oDialog.close();
		},

		/**
		 * 
		 * @returns This methods includes logic to enable/disable the ApprovalButton
		 */
		approvalButtonEnableCheck: async function () {
			return new Promise((resolve, reject) => {
				this.getModel().read("/ProductPricesCheckView", {
					filters: [
						new Filter("OfferID", "EQ", this.offerId)
					],
					success: function (res) {
						let allProductPricesSet = res?.results[0]?.allProductPricesSet;
						resolve(allProductPricesSet);
					}
				});
			}).then(data => {
				this.getModel("ui").setProperty("/enableApprovalButton", data);
			})
		},

		bindFields: async function () {
			if (this.offerId && this.offerId !== "NA") {
				await this.getOfferValidation(this.offerId);
				this.bindTable();
				this.bindForm(this.selectedTab);
			}
		},
		_onObjectMatched: async function (oEvent) {
			const selectedTender = this.getModel("st").getProperty("/SelectedTender");
			this.countryCode = oEvent.getParameter("arguments").countryCode;
			this.tenderId = oEvent.getParameter("arguments").objectId;
			this.offerId = selectedTender?.OfferID || oEvent.getParameter("arguments").offerId;
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			// this.getModel("appView").setProperty("/editable", false);
			this.templateState = this.getOwnerComponent().getModel("template");
			this.templateStateData = this.templateState.getData();			
			this.bindFields();
			await this.approvalButtonEnableCheck();
			this.getOwnerComponent().getModel().refresh(true);			
		},
		bindForm: function (tabName) {
			const overviewForm = this.byId("idOverviewForm");
			const entity = this.templateStateData.detailConfig.countryTemplate.getTemplate().getTab(tabName).getXMLView().getFormByName("OverviewForm").getEntity();
			const path = this.getOwnerComponent().getModel().createKey(`/${entity}`, {
				OFFERID: this.offerId,
				groupId: "OverviewForm"
			});
			const context = new Context(this.getModel(), path);
			overviewForm.setBindingContext(context);
			
		},
		bindTable: function () {
			const prodInfoTable = this.byId("idProductInformationTable");
			const prodInfoTemplate = prodInfoTable.getBindingInfo("items").template;
			prodInfoTable.bindItems({
				path: "/OfferProductValidation",
				filters: [
					new Filter({
						path: "OFFER_ID",
						operator: FilterOperator.EQ,
						value1: this.offerId
					}),
				],
				template: prodInfoTemplate
			})
		},
		
		onOverviewTenderFormEditBtnPress: function(event){
			this.getModel("ui").setProperty('/OverviewForm/editMode', true);
		},
		onOverviewTenderFormSaveBtnPress: function(event){
			
			this.setMessageSection(["OfferValidation"], "overviewTenderFormMsg");

			this.defaultModel.submitChanges({
				success: this.onOverviewTenderFormSuccess.bind(this),
				groupId: "OverviewForm"
			}); 
		},
		onOverviewTenderFormSuccess: function(res){
			const hasErrorMessages = this.getMessages(["OfferValidation"]).length > 0;
			!hasErrorMessages && this.getModel("ui").setProperty('/OverviewForm/editMode', false);
		},

		onOverviewTenderFormCancelBtnPress: function(event){
			this.cancelPendingChanges(["OfferValidation"], "overviewTenderFormMsg");
			this.getModel("ui").setProperty('/OverviewForm/editMode', false);
		},
		getOfferValidation: async function (offerId) {
			return new Promise((resolve, reject) => {
				this.getModel().read("/OfferValidation", {
					filters: [
						new Filter("OFFERID", "EQ", offerId)
					],
					success: function (res) {
						resolve(res)
					}
				});
			});
		},

		calculateTotalAmount: function (offer) {
			const unit = offer.UNIT;
			const currency = offer.CURRENCY || "";
			let totalAmount = "";
			switch (unit) {
				case "Unit":
					totalAmount = parseInt(offer.REQUESTED_QUANTITY) * offer.REQ_PRICE_UNIT_OFFER_CURRENCY;
					break;
				case "Pack":
					totalAmount = parseInt(offer.REQUESTED_QUANTITY) * offer.REQ_PRICE_PACK_OFFER_CURRENCY;
					break;
				default:
					break;
			}
			return `${totalAmount.toFixed(2)} ${currency}`;
		},
		formatRequestedQty: function (quantity, unit) {
			return parseInt(quantity) + " " + unit;
		},

		onApprovalsPress : function () {
			this._bindApprovalsForm();
		},

		_bindApprovalsForm: async function () {
			
			const form = this.byId("idNewOfferForm");
			const offerValidation = this.getOwnerComponent().getModel().getProperty(`/OfferValidation('${this.offerId}')`);
			const offerProductValidation = await this.stState.getOfferProductValidation(this.offerId);
			const tender = this.getOwnerComponent().getModel().getProperty(`/TenderFormView('${this.tenderId}')`);

			if(offerValidation.IN_POLICY === false){
				let aProductsNotValid = [];
				let productNames = [];
				if(Array.isArray(offerProductValidation)){
					aProductsNotValid = offerProductValidation.filter(product => product.IN_POLICY !== true);
					productNames = aProductsNotValid.map(product => product.PRODUCTNAME);
				}

				if(!Array.isArray(offerProductValidation) && offerProductValidation.IN_POLICY !== true){
					aProductsNotValid.push(offerProductValidation);
					productNames.push(offerProductValidation.PRODUCTNAME);
				}

				if(aProductsNotValid.length > 0 ){
					sap.m.MessageBox.error(`The following products do not have prices that comply with their pricing policy: \n\n ${productNames.join()}`);
				}
			} else {

				const offerStatus = await this.stState.getOfferStatus(this.offerId);

				//Cancel of appproval is only possible when offer status = "Awaiting Approval"
				let bCancelEnabled = false;
				let bSendApprovalEnabled = false;

				if (offerStatus.STATUS === "Awaiting Approval") {
					bCancelEnabled = true;
				}

				if (offerStatus.STATUS !== "Quotation Submitted" && offerStatus.STATUS !== "Results Recorded" && offerStatus.STATUS !== "In FOC Negotiation" && offerStatus.STATUS !== "Appeal in Progress" && offerStatus.STATUS !== "Delivery Ongoing" ) {
					bSendApprovalEnabled = true;
				}

				const approvalsForOffer=  await this.stState.loadApprovalsForOffer(this.offerId, tender.InstituteID, tender.CountryCode, this.getModel());
				this.getModel().setProperty("/ApprovalsSelectedOffer", approvalsForOffer);

				const that = this;
				// create dialog lazily
				if (!this.byId("idApprovalsPopup")) {
					this.approvalsDialog = Fragment.load({
						id: that.getView().getId(),
						name: "com.bayer.tender.statenderapp.view.overview.fragments.Approvals",
						controller: that,
					}).then(function (oDialog) {
						that.getView().addDependent(oDialog);
						oDialog.open();
					})
				}else {
					this.byId("idApprovalsPopup").open();
				}

				//enable / disable buttons
				this.byId("btnCancelApproval").setEnabled(bCancelEnabled);
				this.byId("btnSendApproval").setEnabled(bSendApprovalEnabled);


				//Set grouping Mandatory or Optional
				var mGroupFunctions = {
					MandatoryOptional: function (oContext) {
						var sApproverTypeSection = oContext.getProperty("ApproverTypeSection");
						var key, text;

						//check for approvertypes that indicate they are mandatory approvers
						if (sApproverTypeSection === 1) {
							//Mandatory
							key = "Mandatory";
							text = "Mandatory Approvals";
						} else {
							key = "Optional";
							text = "Optional Approvals";
						} 
						return {
							key: key,
							text: text
						};
					}
				};

				//Get table of approvals
				var oTable = sap.ui.getCore().byId("idMandatoryTable"),
					oBinding = oTable.getBinding("items"),
					sPath,
					bDescending,
					vGroup,
					aGroups = [];

				//Actual grouping
				sPath = "MandatoryOptional";
				bDescending = false;
				vGroup = mGroupFunctions[sPath];
				aGroups.push(new Sorter(sPath, bDescending, vGroup));
				// apply the selected group settings
				oBinding.sort(aGroups);

			} 
		},
	})
});