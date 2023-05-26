sap.ui.define([
	"../BaseController",
	"sap/ui/model/json/JSONModel",
	"../../model/formatter",
	"sap/m/library",
	"sap/ui/model/Filter",
	"sap/m/ColumnListItem",
	"sap/m/MessageBox"
], function (BaseController, JSONModel, formatter, mobileLibrary, Filter, ColumnListItem, MessageBox) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return BaseController.extend("com.bayer.tender.statenderapp.controller.OfferProducts.OfferProducts", {

		onInit: function () {
		},
		onBeforeShow:async function(iconTabfilter,sObjectId, sOfferId){
			// get state data
			this.templateState = this.getOwnerComponent().getModel("template");
			this.templateStateData = this.templateState.getData();
			this.oOwnerComponent = this.getOwnerComponent();
			this.oRouter = this.oOwnerComponent.getRouter();

			this.defaultModel = this.getOwnerComponent().getModel();
			
			//this.getView().getBindingContext("template"); // get current tab data
			// await this.getOwnerComponent().getModel().metadataLoaded();
			this.objectId = sObjectId;
			this.offerID = sOfferId;
			this.selectedTab = iconTabfilter.getKey();

			const oModel = new JSONModel({
				busy: false,
				delay: 0,
				editMode: false,
				minDate: new Date()
			});
	
			this.setModel(oModel, "ui");

			this._bindForm("OfferForm");
			this._bindTable("OfferProductsTable");
			this._bindText("TotalAmountOfferProducts");
		},

		/**
		 * This method bind a given form to its entity from the ui configuration template.
		 * FYI: the form ID in the View is a concatination of "id" + formName
		 * @param {*} formName FormName - The form name must exactly match the form name configured in the ui template configuration table in the DB
		 */
		_bindForm(formName){
			const entity = this.templateStateData.detailConfig.countryTemplate.getTemplate().getTab(this.selectedTab).getXMLView().getFormByName(formName).getEntity();
			const form = this.byId(`id${formName}`);
			let path = "";
			if (this.objectId) {
				path = this.getOwnerComponent().getModel().createKey(`/${entity}`, {
					TenderID: this.objectId,
					OfferID: this.offerID
				});
			} else {
				const newEntryContext = this.getOwnerComponent().getModel().createEntry(`/${entity}`, {});
				path = newEntryContext.getPath();
			}
			
			form.bindElement({
				path: path,
			});
		},

		/**
		 * This method binds a given table to its entity from the ui configuration template.
		 * FYI: the table ID in the View is a concatination of "id" + tableName
		 * @param {*} formName FormName - The form name must exactly match the form name configured in the ui template configuration table in the DB
		 */
		_bindTable(tableName){
			const tableConfig =  this.templateStateData.detailConfig.countryTemplate.getTemplate().getTab(this.selectedTab).getXMLView().getTableByName(tableName);
			const entity = tableConfig.getEntity();
			const table = this.byId(`id${tableName}`);
			const cols = tableConfig.getColumns();
			
			table?.bindItems({
				path: `/${entity}`,
			  	filters: [
					new Filter("TenderID", "EQ", this.objectId),
					new Filter("OfferID", "EQ", this.offerID)
				],
				//   model: '',
			  	template: new ColumnListItem({
					type: "Inactive",
					cells: cols.map(col => col.getControl().generateControl())
			  	}),
			  	templateShareable: true
			});
		},

		_bindText(textId){
			let path = "";
			if(textId === 'TotalAmountOfferProducts'){
				const entity = 'OfferProductsTotalForOffer';
				const textField = this.byId(`id${textId}`);

				path = this.getOwnerComponent().getModel().createKey(`/${entity}`, {
					OfferID: this.offerID
				});

				textField.bindElement({
					path: path
				});
			}
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		onOfferProductPress: function(oEvent){
			/*const objContext = oEvent.getParameter("listItem").getBindingContext("pa");
			const selectedObj = objContext?.getObject();

			var deliveryPath = objContext.getPath(),
			delivery = deliveryPath.split("/").slice(-1).pop();*/

			let oNextUIState = "";

			this.oOwnerComponent.getHelper().then(function (oHelper) {
				oNextUIState = oHelper.getNextUIState(2);
				this.oRouter.navTo("offerProductDetail", {
					layout: oNextUIState.layout,
					objectId: "AE-15-100-1001",
					productId: "1"
				});
			}.bind(this));
		},

		onOfferFormEditBtnPress: function(event){
			this.getModel("ui").setProperty('/editMode', true);
		},
		onOfferFormSaveBtnPress: function(event){
			this.getModel("ui").setProperty('/editMode', false);

			if(!this.validateOffer()) return; //error
			this.defaultModel.submitChanges(); //no error - save
		},
		onOfferFormCancelBtnPress: function(event){
			this.getModel("ui").setProperty('/editMode', false);
			this.defaultModel.resetChanges();
		},

		validateOffer: function () {
			const offer = this.defaultModel.getProperty(this.byId('idOfferForm').getObjectBinding().getPath());

			if (offer.InternalBidDueDate <= offer.NewOfferDueDate) {
				MessageBox.error("Internal due date can not be before offer due date");
				this.getModel("ui").setProperty('/editMode', true);
				return false;
			}

			return true;
		},
	});
});