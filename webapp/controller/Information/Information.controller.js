sap.ui.define([
	"../BaseController",
	"sap/ui/model/json/JSONModel",
	"../../model/formatter",
	"sap/m/library",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Context"
], function (BaseController, JSONModel, formatter, mobileLibrary, Filter, FilterOperator, Context) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return BaseController.extend("com.bayer.tender.statenderapp.controller.Information.Information", {
		onInit: function () {
			// set message model
			this.oMessageManager = sap.ui.getCore().getMessageManager();
			this.getView().setModel(this.oMessageManager.getMessageModel(), "message");

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
				}
			});
			
			this.setModel(oModel, "ui");

			this.bindFields();
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
		}
	})
});