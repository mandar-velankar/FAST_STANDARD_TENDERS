sap.ui.define([
	"../BaseController",
	"sap/ui/model/json/JSONModel",
	"../../model/formatter",
	"sap/m/library",
	"sap/ui/model/Filter",
	"sap/m/ColumnListItem",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/Device"
], function (BaseController, JSONModel, formatter, mobileLibrary, Filter, ColumnListItem, Fragment, MessageBox, MessageToast, Device) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return BaseController.extend("com.bayer.tender.statenderapp.controller.OfferProducts.OfferProducts", {

		onInit: function () {

			// set message model
			this.oMessageManager = sap.ui.getCore().getMessageManager();
			this.getView().setModel(this.oMessageManager.getMessageModel(), "message");
			this.getRouter().getRoute("objectDetailOffer").attachPatternMatched(this._onObjectMatched, this);
			// activate automatic message generation for complete view
			this.oMessageManager.registerObject(this.getView(), true);

			const oModel = this.getOwnerComponent().getModel();
			
		},
		onBeforeShow:async function(iconTabfilter,{objectId, offerId, countryCode}){
			// get state data
			this.templateState = this.getOwnerComponent().getModel("template");
			this.templateStateData = this.templateState.getData();
			this.oOwnerComponent = this.getOwnerComponent();
			this.oRouter = this.oOwnerComponent.getRouter();

			this.defaultModel = this.getOwnerComponent().getModel();
			
			//this.getView().getBindingContext("template"); // get current tab data
			// await this.getOwnerComponent().getModel().metadataLoaded();
			this.objectId = objectId;
			this.offerID = offerId;
			this.countryCode = countryCode;
			this.selectedTab = iconTabfilter.getKey();

			const oModel = new JSONModel({
				busy: false,
				delay: 0,
				editMode: false,
				minDate: new Date(),
				OfferForm:{
					editMode: false
				}
			});
	
			this.setModel(oModel, "ui");

			this._bindForm("OfferForm");
			if (this.offerID && this.offerID !== "NA") this._bindTable("OfferProductsTable");
			this._bindText("TotalAmountOfferProducts");
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
			if (this.objectId && this.offerID) {
				path = this.getOwnerComponent().getModel().createKey(`/${entity}`, {
					TenderID: this.objectId,
					OfferID: this.offerID
				});
			} else {
				const newEntryContext = this.getOwnerComponent().getModel().createEntry(`/${entity}`, {
					groupId: "OfferformInfo"
				});
				path = newEntryContext.getPath();
			}
			
			form.bindElement({
				path: path,
				groupId: "OfferformInfo"
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
			  	templateShareable: true,
				  groupId: "OfferProducts"
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
					path: path,
					groupId: "OfferProducts"
				})
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
			const selectedProductCode = oEvent.getParameter("listItem")?.getBindingContext()?.getObject()?.ProductCode;

			this.oOwnerComponent.getHelper().then(function (oHelper) {
				oNextUIState = oHelper.getNextUIState(2);
				this.oRouter.navTo("offerProductDetail", {
					countryCode: this.countryCode,
					layout: oNextUIState.layout,
					objectId: this.objectId,
					offerId: this.offerID,
					productId: selectedProductCode
				});
			}.bind(this));
		},

		onOfferFormEditBtnPress: function(event){
			this.getModel("ui").setProperty('/OfferForm/editMode', true);
		},
		onOfferFormSaveBtnPress: function(event){
			this.getModel("ui").setProperty('/OfferForm/editMode', false);

			if(!this.validateOffer()) return; //error
			this.defaultModel.submitChanges({groupId: "OfferformInfo"}); //no error - save
		},
		onOfferFormCancelBtnPress: function(event){
			this.getModel("ui").setProperty('/OfferForm/editMode', false);
			//this.defaultModel.resetChanges();
		},

		onOpenCreateOfferDialog : function () {
			const that = this;
			// create dialog lazily
			if (!this.byId("idCreateOfferDialog")) {
				this.offerCreationDialog = Fragment.load({
					id: that.getView().getId(),
					name: "com.bayer.tender.statenderapp.view.offer.fragments.NewOfferDialog",
                    controller: that,
				}).then(function (oDialog) {
					that.getView().addDependent(oDialog);
                    oDialog.open();
					that._bindCreateOfferForm();
                })
			}else {
				this.byId("idCreateOfferDialog").open();
			}
		},

		_bindCreateOfferForm: async function () {
			const entity = this.templateStateData.detailConfig.countryTemplate.getTemplate().getForm().getEntity();
			const form = this.byId("idNewOfferForm");
			let path = "";
			if (this.offerID && this.offerID != "NA") {
				path = this.getOwnerComponent().getModel().createKey(`/${entity}`, {
					TenderID: this.objectId,
					OfferID: this.offerID
				});
			} else {
				const newEntryContext = this.getOwnerComponent().getModel().createEntry(`/${entity}`, {
					groupId: "NewOffer"
				});
				path = newEntryContext.getPath();
			}
			form.bindElement({
				path: path,
				groupId: "NewOffer"
			});

			const sElemBindingPath = form.getElementBinding().getPath();
			this.getModel().setProperty(`${sElemBindingPath}/InternalBidDueDate`, null);

			this.getModel("ui").setProperty('/OfferForm/editMode', true);
		},


		_getNextOfferID: async function (sTenderId) {
			return new Promise((resolve, reject) => {
				this.getModel().read("/TenderOffers", {
					filters: [
						new Filter("TENDERID", "EQ", sTenderId)
					],
					success: function (res) {
						let nextOfferId = res?.results[0]?.NEXTOFFERID || 1;
						resolve(nextOfferId);
					}
				});
			}).then(data => {
				this.getModel("ui").setProperty("/TenderOfferNo", data);
				return `${sTenderId}-${data}`;
			})
		},

		onCreateNewOffer: async function () {
			this.oMessageManager.removeAllMessages();
			const oNewOfferForm = this.byId("idNewOfferForm");
			const nextOfferID = await this._getNextOfferID(this.objectId);
			this.setNewOfferPendingChanges(oNewOfferForm,nextOfferID);
			this.getModel().submitChanges({
				success: this._onSubmitChangesSuccess.bind(this),
				error: this._onSubmitChangesFail.bind(this),
				groupId: "NewOffer"
			});
		},

		setNewOfferPendingChanges: async function (oForm,nextOfferID) {
			const oDefaultModel = oForm.getModel();
			const oStandModel = oForm.getModel("ui");
			const oBoundContext = oForm.getElementBinding().getBoundContext();

			const newOfferObj = {
				TenderID: this.objectId,
				Active: 1,
				OfferID: nextOfferID,
				CountryCode: this.countryCode,
				ActiveOffer: 1,
				TenderOfferNo: oStandModel.getProperty("/TenderOfferNo"),
				RevisedOfferNo: 0,
				CreationDate: new Date().toISOString(),
                SubmissionDate: new Date().toISOString(),
                SubmittedOn: new Date().toISOString(),
				Currency: oBoundContext.getObject().Currency,
				DistributorID: oBoundContext.getObject().DistributorID,
				InternalBidDueDate: oBoundContext.getObject().InternalBidDueDate,
				SellingCompany: oBoundContext.getObject().SellingCompany,
				Division: oBoundContext.getObject().Division,
				WholesaleOffer: oBoundContext.getObject().WholesaleOffer || "No"		
			}

			const statusObj = {
					TenderID: this.objectId,
					OfferID: nextOfferID,
					CountryCode: this.countryCode,
					Active: 1,
					STATUS: "Offer Created",
					Date: new Date().toISOString().slice(0,10)
			}

			const offerCtx = oDefaultModel.createEntry("/OfferFormView", {
				properties: newOfferObj,
				groupId: "NewOffer"
			});

			const statusCtx = oDefaultModel.createEntry("/PT_TMTNOFST", {
				properties: statusObj,
				context: offerCtx,
				groupId: "NewOffer"
			});

			oForm?.bindElement({
				path: offerCtx.getPath(),
				groupId: "NewOffer"
			});
			
			oDefaultModel.resetChanges([oBoundContext.getPath()]);
			
		},

		_onSubmitChangesFail: function (error) {
			// not implemented
		},

		_onSubmitChangesSuccess: function (res) {
			const newOfferCtx = this.byId("idNewOfferForm").getElementBinding().getBoundContext();
			const ctxPath = newOfferCtx.getPath().replace("/", "");
			const hasErrorMessages = this.getMessages([ctxPath]).length > 0;
			this.setMessageSection([ctxPath], "offerProductsMsg");
			if (!hasErrorMessages) {
				MessageToast.show("Offer has been successfully created");
				this.onCloseOfferCreationDialog();
				this._showDetail(newOfferCtx.getObject());
				this.getOwnerComponent().getModel().refresh(true);
			}
		},

		/**
		 * Shows the selected item on the detail page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showDetail: function (oItem) {
			var bReplace = !Device.system.phone;
			// set the layout property of FCL control to show two columns
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			this.getRouter().navTo("object", {
				countryCode: oItem.CountryCode,
				objectId: oItem.TenderID,
				offerId: oItem.OfferID
			}, bReplace);
		},

		onCloseOfferCreationDialog: function () {
			// this.oMessageManager.removeAllMessages();
			this.cancelPendingChanges(["OfferFormView"], "offerProductsMsg");
			this.byId("idCreateOfferDialog").close();
			this.byId("idCreateOfferDialog").destroy();
			this.getModel("ui").setProperty('/OfferForm/editMode', false);
			// this.defaultModel.resetChanges();
		},

		validateOffer: function () {
			const offer = this.defaultModel.getProperty(this.byId('idOfferForm').getObjectBinding().getPath());

			if (offer.InternalBidDueDate <= offer.NewOfferDueDate) {
				MessageBox.error("Internal due date can not be before offer due date");
				this.getModel("ui").setProperty('/OfferForm/editMode', true);
				return false;
			}

			return true;
		},
	});
});