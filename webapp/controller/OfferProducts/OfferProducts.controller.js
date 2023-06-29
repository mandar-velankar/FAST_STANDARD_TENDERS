sap.ui.define([
	"../BaseController",
	"sap/ui/model/json/JSONModel",
	"../../model/formatter",
	"sap/m/library",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/ColumnListItem",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/m/Token",
	"sap/ui/Device"
], function (BaseController, JSONModel, formatter, mobileLibrary, Filter, FilterOperator, ColumnListItem, Fragment, MessageBox, MessageToast, Token, Device) {
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
			this.stState = this.getOwnerComponent().getModel("st");

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
				},
				OfferProductTable:{
					enableDeleteProductButton: false,
					editMode: false,
					tableSelectionMode: 'SingleSelectMaster',
				}
				
			});
	
			this.setModel(oModel, "ui");

			
			this._bindForm("OfferForm");
			if (this.offerID && this.offerID !== "NA") this._bindTable("OfferProductsTable");
			if (this.offerID && this.offerID !== "NA") this._bindText("TotalAmountOfferProducts");
			await this.getCountryBrands(this.countryCode);
			await this.getCountryBrandProducts(this.countryCode);
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
			if (this.objectId && this.offerID && this.offerID !== "NA") {
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
			let offerProductTableEditMode = this.getModel("ui").getProperty('/OfferProductTable/editMode');
		
			if(!offerProductTableEditMode){
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
			}
			else{
				let bSelected = oEvent?.getParameter("selected");
				let oTable = this.byId("idOfferProductsTable");
				let aSelectedItems = oTable.getSelectedItems();
				(bSelected || aSelectedItems.length > 0)? this.getModel("ui").setProperty('/OfferProductTable/enableDeleteProductButton', true) : this.getModel("ui").setProperty('/OfferProductTable/enableDeleteProductButton', false);
			}
		},

		onOpenAddOfferProductDialog : function () {

			const that = this;
			//clear fields
			this.getModel("ui").setProperty("/OfferProductTable/productCollection", null);

		//if dialog exists destroy it first, so we always set dialog buttons in correct state
		if (that._oDialog) {
			that._oDialog.destroy();
		}

		that._oDialog = new sap.m.Dialog("addProductDialog", {
			title: "Add Product",
			stretch: true,
			horizontalScrolling:false,
			verticalScrolling:false,
			buttons: [new sap.m.Button({
					id: "applyOfferProductDialog",
					text: "Apply",
					enabled: true,
					tap: [that.onApplyOfferProductDialog, that]}),
					new sap.m.Button({
						id: "cancelOfferProductDialog",
						text: "Cancel",
						enabled: true,
						tap: [that.onCloseAddOfferProductDialog, that]})],
			
			//content with all fields that need to be filled
			content: [sap.ui.xmlfragment("com.bayer.tender.statenderapp.view.offer.fragments.SelectBrandProductList", that)]
				// End of content of dialog
		});

		that.getView().addDependent(that._oDialog);
		that._oDialog.open();
		},
		
		onCloseAddOfferProductDialog: function () {

			let that = this;
			that._oDialog.close();
			that._oDialog.destroy();

		},

		//Select Brand: when you click on the F4 for Brands on adding a product to the offer of the tender
		brandNameList_f4: function () { 

			const that = this;

			if (!this._valueHelpSelectBrandDialog) {
				this._valueHelpSelectBrandDialog = new sap.m.SelectDialog(this.createId("idValueHelpSelectBrandDialog"), {
					title: "Brand Name",
					multiSelect: true,
					rememberSelections: false,
					items: {
						path: "ui>/OfferProductTable/countryBrands",
						template: new sap.m.StandardListItem({
							title: "{ui>BRAND_NAME}",
							description: "{ui>BRAND_ID}",
							selected: "{ui>SELECTED}"
						})
					},
					liveChange: function (oEvent) {
						let sValue = oEvent.getParameter("value");
						const oFilter = [
							new Filter("BRAND_NAME", FilterOperator.Contains, sValue),
							new Filter("BRAND_ID", FilterOperator.Contains, sValue)
						]
						oEvent.getSource().getBinding("items").filter(new Filter(oFilter));
					},
					confirm: function (oEvent) {
						that._handleCloseBrandNameList(oEvent);
					},
					cancel: function (oEvent) {
						that._handleCloseBrandNameList(oEvent);
					}
					
				});
			}

			this.getView().addDependent(this._valueHelpSelectBrandDialog);
			this._valueHelpSelectBrandDialog.open();

		},

		_handleCloseBrandNameList: function (oEvent) { 

			let that = this;

			let oListInput = sap.ui.getCore().byId("idListProductsInput");
			oListInput.removeSelections();

			//selected brands
			let aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {

				MessageToast.show("The following brands were selected: " + aContexts.map(function (oContext) {
					return oContext.getObject().BRAND_NAME;
				}).join(", "));

				//get multi input box
				const oBrandList = sap.ui.getCore().byId("idBrandList");
				let aBrandTokens = [];
				let aBrands = [];

				//push the selected brands 
				aContexts.map(function (oContext) {

					const oToken = new Token({
						text: oContext.getObject().BRAND_NAME,
						key: oContext.getObject().BRAND_ID
					});
					aBrandTokens.push(oToken);

					//Brands for filtering
					const oBrand = {
						BRAND_ID: oContext.getObject().BRAND_ID
					}
					aBrands.push(oBrand);

				});

				//add the array of tokens to the multi input
				oBrandList.setTokens(aBrandTokens);

				const aFilteredBrandProducts = this.filterBrandProducts(aBrands);
				this.getModel("ui").setProperty("/OfferProductTable/productCollection", aFilteredBrandProducts);

			} else {

				MessageToast.show("No new item was selected.");

			}
			//oEvent.getSource().getBinding("items").filter([]);
		},

		filterBrandProducts: function(aBrands){
			let aBrandProducts = this.getModel("ui").getProperty("/OfferProductTable/countryBrandProducts");
			const aFilteredBrandProducts = aBrandProducts.filter((elem) => aBrands.find(({ BRAND_ID }) => elem.BRAND_ID === BRAND_ID));
			const uniqueProducts = [];

			aFilteredBrandProducts.forEach(x => uniqueProducts.filter(a => a.PRODUCT_ID === x.PRODUCT_ID).length > 0 ? null : uniqueProducts.push(x));

			return uniqueProducts;
		},

		onSelectionChangeProductListInput: function (oEvent) {

			const oList = oEvent.getSource();
			const oLabel = sap.ui.getCore().byId("idFilterLabelInput");
			const oInfoToolbar = sap.ui.getCore().byId("idInfoToolbarInput");

			// With the 'getSelectedContexts' function you can access the context paths
			// of all list items that have been selected, regardless of any current
			// filter on the aggregation binding.
			const aContexts = oList.getSelectedContexts(true);

			// update UI
			let bSelected = (aContexts && aContexts.length > 0);
			let sText = (bSelected) ? aContexts.length + " selected" : null;
			oInfoToolbar.setVisible(bSelected);
			oLabel.setText(sText);

		},
		
		onOfferProductTableEditBtnPress: async function(event){
			let oAddOfferProductButton = this.byId("AddOfferProductBtnId");
			this.getModel("ui").setProperty('/OfferProductTable/editMode', true);
			this.getModel("ui").setProperty('/OfferProductTable/tableSelectionMode', 'MultiSelect');
			this.byId("idOfferProductsTable").removeSelections();
			const oSelectedOffer = await this.stState.getService().getOffer(this.offerID);
			if(oSelectedOffer.OfferStatus === "Offer Created") oAddOfferProductButton.setEnabled(true);

		},

		onOfferProductTableSaveBtnPress: function(event){
			this.getModel("ui").setProperty('/OfferProductTable/editMode', false);

			// if(!this.validateOffer()) return; //error
			// this.defaultModel.submitChanges({groupId: "OfferformInfo"}); //no error - save
		},
		onOfferProductTableCancelBtnPress: function(event){
			this.getModel("ui").setProperty('/OfferProductTable/editMode', false);
			this.getModel("ui").setProperty('/OfferProductTable/tableSelectionMode', 'SingleSelectMaster');
			this.byId("idOfferProductsTable").removeSelections();
			//this.defaultModel.resetChanges();
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
			const tenderPath = this.getModel().createKey("/TenderFormView", {
				TenderID: this.objectId
			});
			const tender = this.getModel().getObject(tenderPath);
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
			this.getModel().setProperty(`${sElemBindingPath}/OfferDueDate`, tender.BidDueDate);

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
				OfferDueDate: oBoundContext.getObject().OfferDueDate,
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
			this.cancelPendingChanges(["PT_TMTNOFST"]);
			this.setMessageSection([ctxPath], "offerProductsMsg");
			if (!hasErrorMessages) {
				MessageToast.show("Offer has been successfully created");
				this.onCloseOfferCreationDialog();
				this._showDetail(newOfferCtx.getObject());
				this.getModel("ui").setProperty('/OfferStatus', "Offer Created");
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
		
		getCountryBrands: async function (countryCode) {
			return new Promise((resolve, reject) => {
				this.getModel().read("/CountryBrands", {
					filters: [
						new Filter("COUNTRY_CODE", "EQ", countryCode)
					],
					success: function (res) {
						resolve(res)
					}
				});
			}).then(data => {
				this.getModel("ui").setProperty("/OfferProductTable/countryBrands", data.results);
			})
		},

		getCountryBrandProducts: async function (countryCode) {
			return new Promise((resolve, reject) => {
				this.getModel().read("/CountryBrandProducts", {
					filters: [
						new Filter("COUNTRY_CODE", "EQ", countryCode)
					],
					success: function (res) {
						resolve(res)
					}
				});
			}).then(data => {
				this.getModel("ui").setProperty("/OfferProductTable/countryBrandProducts", data.results);
			})
		},
	});
});