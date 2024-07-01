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
	"sap/ui/Device",
	"sap/ui/model/Sorter",
	"sap/m/TableSelectDialog", 
	"sap/m/Text", 
	"sap/m/Column",
	"sap/ui/unified/FileUploaderParameter"
], function (
		BaseController, 
		JSONModel, 
		formatter, 
		mobileLibrary, 
		Filter, 
		FilterOperator,
		ColumnListItem, 
		Fragment, 
		MessageBox, 
		MessageToast, 
		Token, 
		Device, 
		Sorter, 
		TableSelectDialog, 
		Text, 
		Column,
		FileUploaderParameter) {
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

			this.getOwnerComponent().getEventBus().subscribe("OfferProductsTableChannel", "updateOfferProductsTable", this.handleUpdateOfferProductTable, this);
		},
		onBeforeShow:async function(iconTabfilter,{objectId, offerId, countryCode, productScope}){
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
			this.productScope = productScope;
			this.selectedTab = iconTabfilter.getKey();
			const {productCount} = await this.stState.getService().getOfferProducts(offerId);
			const selectedOffer = await this.stState.getService().getOffer(offerId);

			const oModel = new JSONModel({
				busy: false,
				delay: 0,
				editMode: false,
				currency: "EUR",
				minDate: new Date(),
				isCopiedOffer: false,
				OfferForm:{
					editMode: false
				},
				OfferProductTable:{
					enableDeleteProductButton: false,
					editMode: false,
					tableSelectionMode: 'SingleSelectMaster',
					count: productCount,
					source: selectedOffer?.Custom_String_1
				}			
			});
	
			this.setModel(oModel, "ui");

			
			this._bindForm("OfferForm", this.objectId, this.offerID);
			this._bindTable("OfferProductsTable", this.objectId, this.offerID);
			if (this.offerID && this.offerID !== "NA") this._bindText("TotalAmountOfferProducts");
			
		},
		_onObjectMatched: async function (oEvent) {
			this.offerID = oEvent.getParameter("arguments").offerId;
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			this.templateState = this.getOwnerComponent().getModel("template");
			this.templateStateData = this.templateState.getData();
		},
		/**
		 * This method bind a given form to its entity from the ui configuration template.
		 * FYI: the form ID in the View is a concatination of "id" + formName
		 * @param {*} formName FormName - The form name must exactly match the form name configured in the ui template configuration table in the DB
		 */
		_bindForm(formName, tenderId, offerId){
			const entity = this.templateStateData.detailConfig.countryTemplate.getTemplate().getTab(this.selectedTab).getXMLView().getFormByName(formName).getEntity();
			const form = this.byId(`id${formName}`);
			let path = "";
			if (tenderId && offerId && offerId !== "NA") {
				path = this.getOwnerComponent().getModel().createKey(`/${entity}`, {
					TenderID: tenderId,
					OfferID: offerId
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

		setPaymentTermFieldVisible: function (form, containerIndex) {
			const paymentTermsField = form.getAggregation("formContainers")[containerIndex]
			.getAggregation("formElements").find(el => el.getAggregation("label") === "Payment Terms");
			paymentTermsField.setVisible(false);
		},

		/**
		 * This method binds a given table to its entity from the ui configuration template.
		 * FYI: the table ID in the View is a concatination of "id" + tableName
		 * @param {*} formName FormName - The form name must exactly match the form name configured in the ui template configuration table in the DB
		 */
		_bindTable(tableName, tenderId, offerId){
			const tableConfig =  this.templateStateData.detailConfig.countryTemplate.getTemplate().getTab(this.selectedTab).getXMLView().getTableByName(tableName);
			const entity = tableConfig.getEntity();
			const table = this.byId(`id${tableName}`);
			const cols = tableConfig.getColumns();

			if (offerId && offerId === "NA") {
				table.unbindItems();
				return;
			}
			table?.bindItems({
				path: `/${entity}`,
			  	filters: [
					new Filter("TenderID", "EQ", tenderId),
					new Filter("OfferID", "EQ", offerId)
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
						productScope: this.productScope,
						layout: oNextUIState.layout,
						objectId: this.objectId,
						offerId: this.offerID,
						productId: selectedProductCode
					});
				}.bind(this));
				this.byId("idOfferProductsTable").removeSelections();
				//this.byId("idOfferProductsTable").getBinding("items").refresh();
			}
			else{
				let bSelected = oEvent?.getParameter("selected");
				let oTable = this.byId("idOfferProductsTable");
				let aSelectedItems = oTable.getSelectedItems();
				(bSelected || aSelectedItems.length > 0)? this.getModel("ui").setProperty('/OfferProductTable/enableDeleteProductButton', true) : this.getModel("ui").setProperty('/OfferProductTable/enableDeleteProductButton', false);
			}
		},
		
		onOfferProductTableEditBtnPress: async function(event){
			let oAddOfferProductButton = this.byId("AddOfferProductBtnId");
			this.getModel("ui").setProperty('/OfferProductTable/editMode', true);
			this.getModel("ui").setProperty('/OfferProductTable/tableSelectionMode', 'MultiSelect');
			this.byId("idOfferProductsTable").removeSelections();
			if (this.offerID && this.offerID !== "NA"){
				const oSelectedOffer = await this.stState.getService().getOffer(this.offerID);
				if(oSelectedOffer.OfferStatus === "Offer Created") oAddOfferProductButton.setEnabled(true);
			}
			else{
				oAddOfferProductButton.setEnabled(false);
			}
			
		},

		onOfferProductTableSaveBtnPress: function(event){
			this.getModel("ui").setProperty('/OfferProductTable/editMode', false);
			this.getModel("ui").setProperty('/OfferProductTable/tableSelectionMode', 'SingleSelectMaster');
			this.defaultModel.submitChanges({
				success: this._onSubmitChangesOfferProductSuccess.bind(this),
				error: this._onSubmitChangesOfferProductFail.bind(this),
				groupId: "AddProduct"
			}); //no error - save
		},

		_onSubmitChangesOfferProductSuccess: function (res) {
			const offerProductsTable = this.byId("idOfferProductsTable");
			const items = offerProductsTable.getItems();
			const today = new Date();
			const messages = [];
			items.forEach((item, index) => {
				const obj = item.getBindingContext().getObject();
				if (obj.RegistrationValidUntil && obj.RegistrationValidUntil < today) {
					messages.push({
						type: 'Warning',
						title: `${obj.ProductPackName} registration is expired`,
						description: `${obj.ProductPackName} registration is expired`,
						subtitle: `${obj.ProductPackName} registration is expired`,
						counter: index+1
					})
				}
			});
			if (messages.length === 0) {
				messages.push({
					type: 'Success',
					title: 'Products added successfully',
					description: 'Products added successfully',
					subtitle: 'Products added successfully',
					counter: 1
				});
				this.byId('notificationButton').setEnabled(true)
			}
			this.showMessageCompositeView("Offer Products Created", messages, "Success");
		},

		_onSubmitChangesOfferProductFail: function (error) {},

		onOfferProductTableCancelBtnPress: function(event){
			this.getModel("ui").setProperty('/OfferProductTable/editMode', false);
			this.getModel("ui").setProperty('/OfferProductTable/enableDeleteProductButton', false);
			this.getModel("ui").setProperty('/OfferProductTable/tableSelectionMode', 'SingleSelectMaster');
			this.byId("idOfferProductsTable").removeSelections();
			this.defaultModel.resetChanges();
		},

		onOfferFormEditBtnPress: function(event){
			this.getModel("ui").setProperty('/OfferForm/editMode', true);
			if(this.isCopiedOffer(this.offerID)){
				this.getModel("ui").setProperty('/isCopiedOffer', true);
			}
		},
		onOfferFormSaveBtnPress: function(event){
			this.getModel("ui").setProperty('/OfferForm/editMode', false);
			this.getModel("ui").setProperty('/isCopiedOffer', false);
			const form = this.byId(`idOfferForm`);
			//if(!this.validateOffer()) return; //error
			this.defaultModel.setProperty(form?.getBindingContext()?.getPath() + "/DistributorComments", this.productScope); //for mandatory field check in sta-service
			this.defaultModel.setProperty(form?.getBindingContext()?.getPath() + "/APPROVALS_SENT", 0); //for mandatory field check in sta-service
			this.defaultModel.submitChanges({groupId: "OfferformInfo"}); //no error - save
			this.countryCode === 'NL' && this.getModel('ui').setProperty('/OfferProductTable/source', form?.getBindingContext()?.getObject().Custom_String_1);
			//this.getModel().refresh();
		},
		onOfferFormCancelBtnPress: function(event){
			this.getModel("ui").setProperty('/OfferForm/editMode', false);
			this.getModel("ui").setProperty('/isCopiedOffer', false);	
			this.defaultModel.resetChanges();
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
			this.getModel().setProperty(`${sElemBindingPath}/InstituteID`, tender.InstituteID);
			this.getModel().setProperty(`${sElemBindingPath}/Division`, this.countryCode === 'NL' ? 'All' : "");
			this.countryCode.toLowerCase().includes('hm') && this.getModel().setProperty(`${sElemBindingPath}/Custom_Date_3`,tender.AwardDate)
			
			const selectedTender = await this.stState.getService().getTender(this.objectId);
			if(selectedTender.Region === 'MEA'){this.setPaymentTermFieldVisible(form,1);}
			if(this.countryCode.toLowerCase().includes('hm')){this.setPaymentTermFieldVisible(form,2);}

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
			let paymentTerm = '';
			const oNewOfferForm = this.byId("idNewOfferForm");
			const nextOfferID = await this._getNextOfferID(this.objectId);
			const selectedTender = await this.stState.getService().getTender(this.objectId);
			if(selectedTender.Region === 'MEA' || this.countryCode.toLowerCase().includes('hm')){
				if(selectedTender.TenderChannel === 'Direct'){
					const institute = await this.stState.getService().getInstitute(selectedTender.ParentInstituteID, this.countryCode);
					paymentTerm = institute.PaymentTerms;
				}
				else{
					const distributor = await this.stState.getService().getDistributor(oNewOfferForm.getElementBinding().getBoundContext().getObject().DistributorID,this.countryCode);
					paymentTerm = distributor.PaymentTerms;
				}
			}
			this.setNewOfferPendingChanges(oNewOfferForm,nextOfferID, selectedTender.Region, paymentTerm);
			this.getModel().submitChanges({
				success: this._onSubmitChangesSuccess.bind(this),
				error: this._onSubmitChangesFail.bind(this),
				groupId: "NewOffer"
			});
		},

		setNewOfferPendingChanges: async function (oForm,nextOfferID, region, paymentTerm) {
			const oDefaultModel = oForm.getModel();
			const oStandModel = oForm.getModel("ui");
			const oBoundContext = oForm.getElementBinding().getBoundContext();

			/* this doesn't work if you want to have dynamic fields from the ui templates, we should always receive and work with all possible fields related to CDS view
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
			*/

			//make an object with all possible fields exposed in CDS view
			const newOfferObj = oBoundContext.getObject();
			const userId = this.getModel("st").getProperty("/UserID");

			//set default values if needed
			newOfferObj.TenderID = this.objectId;
			newOfferObj.Active = 1;
			newOfferObj.OfferID = nextOfferID;
			newOfferObj.CountryCode = this.countryCode;
			newOfferObj.ActiveOffer = 1;
			newOfferObj.TenderOfferNo = oStandModel.getProperty("/TenderOfferNo");
			newOfferObj.RevisedOfferNo = 0;
			newOfferObj.ContinuationOfferNo = 0;
			newOfferObj.CreationDate = new Date().toISOString();
            newOfferObj.SubmissionDate = new Date().toISOString();
            newOfferObj.SubmittedOn = new Date().toISOString();
            newOfferObj.SubmittedBy = userId;
			newOfferObj.Currency = oBoundContext.getObject().Currency;
			newOfferObj.DistributorID = oBoundContext.getObject().DistributorID;
			newOfferObj.InternalBidDueDate = oBoundContext.getObject().InternalBidDueDate;
			newOfferObj.OfferDueDate = oBoundContext.getObject().OfferDueDate;
			newOfferObj.SellingCompany = oBoundContext.getObject().SellingCompany;
			newOfferObj.Division = this.countryCode === 'NL' ? 'All' : oBoundContext.getObject().Division;
			newOfferObj.WholesaleOffer = oBoundContext.getObject().WholesaleOffer || "No";	
			newOfferObj.DistributorComments = this.productScope;
			if(region === 'MEA'){
				newOfferObj.Custom_String_1 = paymentTerm;
			}
			if(this.countryCode.toLowerCase().includes('hm')){
				newOfferObj.Custom_String_4 = paymentTerm
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

				/**
				 * this.getOwnerComponent().getModel().refresh(true) doing refersh with old filters 
				 * This new added code filtering with new offerId and tenderId
				 */
				const tenderId = newOfferCtx.getObject().TenderID;
				const offerId = newOfferCtx.getObject().OfferID;
				this._bindForm("OfferForm", tenderId, offerId);
				this._bindTable("OfferProductsTable", tenderId, offerId);
				//this.getOwnerComponent().getModel().refresh(true);
			}
			if (!hasErrorMessages) this.getModel().refresh();
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
				productScope: this.productScope,
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
			const isCopied = this.isCopiedOffer(offer.OfferID);

			if (!isCopied && offer.InternalBidDueDate <= offer.NewOfferDueDate) {
				MessageBox.error("Internal due date can not be before offer due date");
				this.getModel("ui").setProperty('/OfferForm/editMode', true);
				return false;
			}

			return true;
		}, 

		//Add Offer Product
		onOpenAddOfferProductDialog : async function () {

			this.getView().setBusy(true);
			
			await this.createAddOfferProductDialog();
			const selectedOffer = await this.stState.getService().getOffer(this.offerID);
			const userInfo = await this.getUserInfo(this.getModel("st").getProperty("/UserID"));
			await this.getCountryBrands(this.countryCode, selectedOffer.Division, userInfo);
			await this.getInstituteDistributorBrandProducts(this.countryCode, selectedOffer.InstituteID, selectedOffer.DistributorID, selectedOffer.SellingCompany, selectedOffer.Channel, selectedOffer.Division);

			this.getView().setBusy(false);
		},

		createAddOfferProductDialog : async function(){

			const that = this;
			//clear fields
			this.getModel("ui").setProperty("/OfferProductTable/productCollection", null);
			this.getModel("ui").setProperty("/OfferProductTable/products",null);

			//if dialog exists destroy it first, so we always set dialog buttons in correct state
			if (that.dialog) {
				that.dialog.destroy();
			}

			that.dialog = new sap.m.Dialog("addProductDialog", {
				title: "Add Product",
				stretch: true,
				horizontalScrolling:false,
				verticalScrolling:false,
				buttons: [new sap.m.Button({
						id: "applyOfferProductDialog",
						text: "Save",
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

			that.getView().addDependent(that.dialog);
			that.dialog.open();
		},
		
		onCloseAddOfferProductDialog: function () {

			let that = this;
			that.dialog.close();
			that.dialog.destroy();

		},

		onApplyOfferProductDialog: function() {
			
			const table = this.byId("idOfferProductsTable");
			let dialog = sap.ui.getCore().byId("addProductDialog");
			const products = this.getModel("ui").getProperty("/OfferProductTable/products");
			const userId = this.getModel("st").getProperty("/UserID");
			if(products){
				for(const product of products){

					const duplicateItem = table.getItems().find((item) => {
						return item.getBindingContext().getProperty("ProductPackName") === product.SKU.PRODUCTPACKNAME;
					});
					
					if (duplicateItem) {
						// Product already exists in the table, handle the duplication
						continue;
					}

					const context = this.defaultModel.createEntry("/OfferProductsTableView", {
						groupId: "AddProduct",
						properties: {
										ProductPackName:product.SKU.PRODUCTPACKNAME, 
										SORTER:product.SORTER,
										CountryCode:product.CountryCode, 
										DistributorID:product.DistributorID, 
										ActiveProduct:1, 
										RequestedVolume: 0, 
										OfferID:product.OfferID, 
										Active:1, 
										ProductCode:product.ProductCode, 
										TenderID:product.TenderID,
										SampleQuantity:0,
										NoofLots:0,
										IntervalBetweenShipments:0,
										NoOfTier:0,
										DEFAULT_COMMISSION_RATE:0,
										MinInvoiceAmount:0,
										UoM: 'Pack',
										SubmittedOn: new Date().toISOString(),
										SubmittedBy: userId
									}
					});
					const newItem = table.getBindingInfo("items").template.clone();
					newItem.setBindingContext(context)
					table.insertItem(newItem);
				};

				this.onOfferProductTableSaveBtnPress();
			}
		

			dialog.close();

		},

		onDeleteOfferProductBtnPress: function(event){
			const table = this.byId("idOfferProductsTable");
			const selectedItems = table.getSelectedItems();
			if (!selectedItems) {
				return; // No item is selected, exit the function
			}
			selectedItems.forEach(selectedItem => {
				const context = selectedItem.getBindingContext();
				const model = context.getModel();
				model.remove(context.getPath());
			});
			
			this.getModel("ui").setProperty('/OfferProductTable/editMode', false);
			this.getModel("ui").setProperty('/OfferProductTable/tableSelectionMode', 'SingleSelectMaster');
		},

		//Select Brand: when you click on the F4 for Brands on adding a product to the offer of the tender
		brandNameList_f4: function () { 

			const that = this;

			if (!this.valueHelpSelectBrandDialog) {
				this.valueHelpSelectBrandDialog = new sap.m.SelectDialog(this.createId("idValueHelpSelectBrandDialog"), {
					title: "Brand Name",
					multiSelect: true,
					rememberSelections: false,
					items: {
						path: "ui>/OfferProductTable/countryBrands",
						sorter: new Sorter("BRAND_NAME", false),
						template: new sap.m.StandardListItem({
							title: "{ui>BRAND_NAME}",
							description: "{ui>BRAND_ID}",
							selected: "{ui>SELECTED}"
						})
					},
					liveChange: function (event) {
						let sValue = event.getParameter("value");
						const oFilter = [
							new Filter("BRAND_NAME", FilterOperator.Contains, sValue),
							new Filter("BRAND_ID", FilterOperator.Contains, sValue)
						]
						event.getSource().getBinding("items").filter(new Filter(oFilter));
					},
					confirm: function (event) {
						that.handleCloseBrandNameList(event);
					},
					cancel: function (event) {
						that.handleCloseBrandNameList(event);
					}
					
				});
			}

			this.getView().addDependent(this.valueHelpSelectBrandDialog);
			this.valueHelpSelectBrandDialog.open();

		},

		handleCloseBrandNameList: function (event) { 

			let that = this;

			let listInput = sap.ui.getCore().byId("idListProductsInput");
			listInput.removeSelections();

			//selected brands
			let aContexts = event.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {

				MessageToast.show("The following brands were selected: " + aContexts.map(function (oContext) {
					return oContext.getObject().BRAND_NAME;
				}).join(", "));

				//get multi input box
				const brandList = sap.ui.getCore().byId("idBrandList");
				let brandTokens = [];
				let brands = [];

				//push the selected brands 
				aContexts.map(function (oContext) {

					const oToken = new Token({
						text: oContext.getObject().BRAND_NAME,
						key: oContext.getObject().BRAND_ID
					});
					brandTokens.push(oToken);

					//Brands for filtering
					const oBrand = {
						BRAND_ID: oContext.getObject().BRAND_ID
					}
					brands.push(oBrand);

				});

				//add the array of tokens to the multi input
				brandList.setTokens(brandTokens);

				const aFilteredBrandProducts = this.filterBrandProducts(brands);
				this.getModel("ui").setProperty("/OfferProductTable/productCollection", aFilteredBrandProducts);
				this.setScrollProductsInputContainter();
			} else {

				MessageToast.show("No new item was selected.");

			}
			
		},

		setScrollProductsInputContainter:function(){
			const productsInput = this.getModel('ui').getProperty('/OfferProductTable/productCollection');
			const inputItemsHeight = productsInput.length * 67;
			const dialogContentHeight = sap.ui.getCore().byId('addProductDialog').getContent()[0].getDomRef().offsetHeight;
			let parentHeight = dialogContentHeight - 49 - 65; //todo: add check for message of MercadoInProductsMessage
			sap.ui.getCore().byId("idListProductsInputContainer").removeStyleClass("listInDialogWithMessage");
			sap.ui.getCore().byId("idListProductsOutputContainer").removeStyleClass("listInDialogWithMessage");
			if(inputItemsHeight>=parentHeight){
				sap.ui.getCore().byId("idListProductsInputContainer").addStyleClass("listInDialogWithMessage");
				sap.ui.getCore().byId("idListProductsOutputContainer").addStyleClass("listInDialogWithMessage");
			}
		},

		filterBrandProducts: function(brands){

			let brandProducts = this.getModel("ui").getProperty("/OfferProductTable/instituteDistributorBrandProduct");
			const filteredBrandProducts = brandProducts.filter((elem) => brands.find(({ BRAND_ID }) => elem.BRAND_ID === BRAND_ID));
			const uniqueProducts = [];

			filteredBrandProducts.forEach(x => uniqueProducts.filter(a => a.PRODUCT_ID === x.PRODUCT_ID).length > 0 ? null : uniqueProducts.push(x));

			return uniqueProducts;
		},

		onSearchProductsInput: function(oEvent){

			const searchValue = oEvent.getParameter("newValue");
			const binding = sap.ui.getCore().byId("idListProductsInput").getBinding("items");
			const oFilter = [
				new Filter("PRODUCT_NAME", FilterOperator.Contains, searchValue),
				new Filter("SKUS", FilterOperator.Contains, searchValue)
			]
			binding.filter(new Filter(oFilter));
		},

		onSelectionChangeProductListInput: function (oEvent) {

			const list = oEvent.getSource();
			const label = sap.ui.getCore().byId("idFilterLabelInput");
			const infoToolBar = sap.ui.getCore().byId("idInfoToolbarInput");

			// With the 'getSelectedContexts' function you can access the context paths
			// of all list items that have been selected, regardless of any current
			// filter on the aggregation binding.
			const aContexts = list.getSelectedContexts(true);

			// update UI
			let bSelected = (aContexts && aContexts.length > 0);
			let sText = (bSelected) ? aContexts.length + " selected" : null;
			infoToolBar.setVisible(bSelected);
			label.setText(sText);

		},

		//Add product to output list
		onPressAddProductToOutputList: async function (oEvent) {
			//get input & output list for products
			let that = this;
			const listInput = sap.ui.getCore().byId("idListProductsInput");
			const listOutput = sap.ui.getCore().byId("idListProductsOutput");
			let pathProducts = "/OfferProductTable/products";
			let products = this.getModel("ui").getProperty(pathProducts);
			let bExisting = false;
			const infoToolBar = sap.ui.getCore().byId("idInfoToolbarInput");


			// With the 'getSelectedContexts' function you can access the context paths
			// of all list items that have been selected, regardless of any current
			// filter on the aggregation binding.
			let aContexts = listInput.getSelectedContexts(true);

			//loop over the selected products from input list

			for(const oContext of aContexts){
				//first selected product
				const product = this.getModel("ui").getProperty(oContext.sPath);

				//Are there already products added? if yes we should check if this is not a double
				if (products) {
                    
					let iIndex = products.findIndex(x => x.ProductCode === product.PRODUCT_ID);

					if (iIndex === -1) {
						//not found
						bExisting = false;
					} else {
						bExisting = true;
					}
				} else {
					//no products yet
					products = [];
					bExisting = false;
				}

				//product can only be added once
				if (bExisting) {

					//product already exists
					sap.m.MessageBox.error("Product(" + product.PRODUCT_NAME + ") is already added.");

				} else {

					//make an empty array to add the product
					const addProduct = {};

					//filling the data available
					addProduct.TenderID = this.objectId; 
					addProduct.OfferID = this.offerID;
					addProduct.CountryCode = product.COUNTRY_CODE;
					addProduct.SubmittedOn = "";
					addProduct.SubmittedBy = "";
					addProduct.Active = 1;
					addProduct.ProductCode = product.PRODUCT_ID;
					addProduct.Reference = "";
					addProduct.Channel = "";
					addProduct.AlternateOfferYN = "No";
					addProduct.RequestedVolume = 0;
					addProduct.UnitPerPack = "Unit";
					addProduct.SampleYN = "No";
					addProduct.SampleQuantity = 0;
					addProduct.DocumentsRequired = "No";
					addProduct.FirstShipment = ""
					addProduct.NoofLots = "";
					addProduct.IntervalBetweenShipments = "";
					addProduct.NoOfTier = 0;
					addProduct.DiscOrOffer = "";
					addProduct.PaymentTerms = product.PAYMENT_TERMS;
					addProduct.DistributorID = product.DISTRIBUTOR_ID;
					addProduct.SNo = 0;
					addProduct.ActiveProduct = 1;
					addProduct.Comment = "";
					addProduct.INCOTerms = product.INCO_TERMS;
					addProduct.PricingPolicyCluster = "";
					addProduct.MinInvoiceAmount = "";
					addProduct.DeliveryConditions = "";
					addProduct.SKUS = product.SKUS;
                    addProduct.LotID = 1;
					
					addProduct.SKU = {
						PRODUCTPACKNAME: product.PRODUCT_NAME,
						MoleculeName: product.MoleculeName
					};

					if (products && products.length) {
						addProduct.SORTER = products.length; //added as last in the list
					} else {
						addProduct.SORTER = 0; //first product
					}

					products.push(addProduct);

				}

			};

			//add to binding
			this.getModel("ui").setProperty(pathProducts, products);

			//no selection anymore
			listInput.removeSelections();
			listOutput.removeSelections();
			infoToolBar.setVisible(false);

		},

		//Remove product from output list
		onPressRemoveProductFromOutputList: function (event) {

			const list = sap.ui.getCore().byId("idListProductsOutput");
			const infoToolBar = sap.ui.getCore().byId("idInfoToolbarOutput");
			let pathProducts = "/OfferProductTable/products";
			const products = this.getModel("ui").getProperty(pathProducts);

			const productsToRemove = [];
			let oProductToRemove = {};

			// With the 'getSelectedContexts' function you can access the context paths
			// of all list items that have been selected, regardless of any current
			// filter on the aggregation binding.
			let aContexts = list.getSelectedContexts(true);

			for(const oContext of aContexts){

				//get selected product
				const oProduct = this.getModel("ui").getProperty(oContext.sPath);

				//remove it from the products
				products.splice(products.indexOf(oProduct), 1);

				//if s_operation is PUT, the product is already existing in back-end
				//oProductToRemove = {};
				oProductToRemove.ProductCode = oProduct.ProductCode;
				productsToRemove.push(oProductToRemove);

			};

			//remove from binding model
			this.getModel("ui").setProperty(pathProducts, products);

			//no selection anymore
			//oList.removeSelections();
			infoToolBar.setVisible(false);
		},

		//move product up
		moveUp: function () {
			this.moveSelectedItem("Up");
		},

		//move product down
		moveDown: function () {
			this.moveSelectedItem("Down");
		},

		//move selected item
		moveSelectedItem: function (sDirection) {

			const table = sap.ui.getCore().byId("idListProductsOutput");
			const selectedItem = table.getSelectedItem();
			if (!selectedItem) {
				return; // No item is selected, exit the function
			}

			const selectedIndex = table.indexOfItem(selectedItem);
			const siblingItemIndex = sDirection === "Up" ? selectedIndex - 1 : selectedIndex + 1;
	  
			const siblingItem = table.getItems()[siblingItemIndex];
			if (!siblingItem) {
				return; // No sibling item found, do nothing
			}

			const siblingItemContext = siblingItem.getBindingContext("ui");
			if (!siblingItemContext) {
				return; // Sibling item context not found, do nothing
			}

			const siblingItemRank = siblingItemContext.getProperty("SORTER");
			const selectedItemRank = selectedItem.getBindingContext("ui").getProperty("SORTER");

			table.getModel("ui").setProperty("SORTER", siblingItemRank, selectedItem.getBindingContext("ui"));
			table.getModel("ui").setProperty("SORTER", selectedItemRank, siblingItemContext);

			table.getBinding("items").refresh(true);

			table.getItems()[siblingItemIndex].setSelected(true);
		},
		
		getCountryBrands: async function (countryCode, division, userInfo) {
			const filters = [
				new Filter("COUNTRY_CODE", "EQ", countryCode),
			];
			division !== "All" && filters.push(new Filter("DIVISION", "EQ", division));
			return new Promise((resolve, reject) => {
				this.getModel().read("/CountryBrands", {
					filters,
					success: function (res) {
						resolve(res)
					}
				});
			}).then(data => {
				if(userInfo && userInfo.results[0].BU !== null){
					data.results = data.results.filter(item => item.BU === userInfo.results[0].BU);
				}
				this.getModel("ui").setProperty("/OfferProductTable/countryBrands", data.results);
			})
		},

		getUserInfo: async function(cwid){
			return new Promise((resolve, reject) => {
				this.getModel().read("/Users", {
					filters: [
						new Filter("UserID", "EQ", cwid)
					],
					success: function (res) {
						resolve(res)
					}
				});
			})
		},

		getInstituteDistributorBrandProducts: async function (countryCode, instituteId, distributorId, sellingCompany, channel, division) {
			const filters = [
				new Filter("COUNTRY_CODE", "EQ", countryCode),
				new Filter("INSTITUTE_ID", "EQ", instituteId),
				new Filter("DISTRIBUTOR_ID", "EQ", distributorId),
				new Filter("LEGAL_ENTITY_CODE", "EQ", sellingCompany),
				new Filter("CHANNEL", "EQ", channel),
			]
			division !== "All" && filters.push(new Filter("DIVISION", "EQ", division));
			return new Promise((resolve, reject) => {
				this.getModel().read("/InstituteDistributorBrandProduct", {
					filters,
					success: function (res) {
						resolve(res)
					}
				});
			}).then(data => {
				this.getModel("ui").setProperty("/OfferProductTable/instituteDistributorBrandProduct", data.results);
			})
		},

		onMenuCopyOfferItemSelected: function(evt){
			const selectedItem = evt.getParameter("item");
			const selectedItemText = this.formatter.toUpperCamelCase(selectedItem.getText()).toLowerCase();
			switch(selectedItemText){
				case "revisedoffer": return this.createRevisedOffer(evt);
				case "continuedoffer": return this.createContinuedOffer(evt);
				case "affiliateoffer": return this.onOpenAffiliateOfferPopup(evt);
				case "differentawardprice": return this.createDifferentAwardPriceOffer(evt);
			}
		},

		createRevisedOffer: function(evt){
			const requestHandle = this.defaultModel.callFunction("/copyOffer", {
				method:"POST", 
				urlParameters: {"offerID": this.offerID,"type": "revisedoffer", "productScope": this.productScope},
				success: this.onOfferCopySuccess.bind(this),
				error: this.onOfferCopyFail.bind(this)
			});
		},

		createContinuedOffer: function(evt){
			const requestHandle = this.defaultModel.callFunction("/copyOffer", {
				method:"POST", 
				urlParameters: {"offerID": this.offerID,"type": "continuedoffer", "productScope": this.productScope},
				success: this.onOfferCopySuccess.bind(this),
				error: this.onOfferCopyFail.bind(this)
			});
		},

		createAffiliateOffer: function () {
			const form = this.byId("idAffiliateOfferForm");
			const obj = form.getBindingContext().getObject();
			const requestHandle = this.defaultModel.callFunction("/copyOffer", {
				method:"POST", 
				urlParameters: {"offerID": this.offerID, "type": "affiliateoffer", "QuotationInstituteID": obj.QuotationInstituteID, "productScope": this.productScope},
				success: this.onOfferCopySuccess.bind(this),
				error: this.onOfferCopyFail.bind(this)
			});
		},

		onOpenAffiliateOfferPopup: function () {
			const that = this;
			if (!this.byId("idAffiliatedOfferDialog")) {
				this.offerCreationDialog = Fragment.load({
					id: that.getView().getId(),
					name: "com.bayer.tender.statenderapp.view.offer.fragments.AffiliatedOffer",
                    controller: that,
				}).then(function (oDialog) {
					that.getView().addDependent(oDialog);
                    oDialog.open();
					that.bindQuotationInstitute();
                })
			}else {
				this.byId("idAffiliatedOfferDialog").open();
			}
		},

		createDifferentAwardPriceOffer: function(evt){
			const requestHandle = this.defaultModel.callFunction("/copyOffer", {
				method:"POST", 
				urlParameters: {"offerID": this.offerID,"type": "differentawardprice", "productScope": this.productScope},
				success: this.onOfferCopySuccess.bind(this),
				error: this.onOfferCopyFail.bind(this)
			});
		},

		bindQuotationInstitute: function () {
			const form = this.byId("idAffiliateOfferForm");
			const entry = this.getModel().createEntry("/OfferFormView");
			const path = entry.getPath();
			form.bindElement({
				path: path
			});
		},

		onOpenChildInstituteList: async function (event) {
			const source = event.getSource();
			const tender = await this.stState.getService().getTender(this.objectId);
       	 	// create value help dialog
			this.valueHelpTableSelectDialog = new TableSelectDialog({
				title: "Child Institutes",
				multiSelect: source instanceof sap.m.MultiInput ? true : false,
				contentWidth: '250px',
				items: {
					path: "/ChildInstitutesView",
					filters: [
						new Filter("ParentInstituteID", "EQ", tender?.InstituteID),
						new Filter("CountryCode", "EQ", this.countryCode),
					],
					template: new ColumnListItem({
						type: "Active",
						cells: [
							new Text({text: "{InstituteName}" })
						]
					})	
				},
				confirm: (event)=>this.handleCloseValueHelp(event,source),
			});
			this.valueHelpTableSelectDialog.addColumn(new Column());
			this.valueHelpTableSelectDialog.setModel(source.getModel());
        	this.valueHelpTableSelectDialog.setModel(source.getModel("st"), "st");
			this.valueHelpTableSelectDialog.open();
		},
		handleCloseValueHelp: function (oEvent,originalInputField) {
			const oParam = oEvent.getParameter("selectedItem");
			const selectedItem = oParam.getBindingContext().getObject();

			const path = originalInputField.getBindingContext().getPath();
			originalInputField.getModel().setProperty(`${path}/QuotationInstituteID`, selectedItem.QuotationInstituteID); 
			originalInputField.getModel().setProperty(`${path}/InstituteName`, selectedItem.InstituteName); 
		},

		onCloseAffiliateOfferCreationDialog: function () {
			this.byId("idAffiliatedOfferDialog")?.close();
			this.getModel().resetChanges();
		},

		onOfferCopySuccess: async function(offerID){
			this.navToOffer(offerID);
			this.refreshMasterTable(offerID).then(()=>{
				this.onCloseAffiliateOfferCreationDialog();
				MessageToast.show(offerID + " created");
			});	
		},
		
		refreshMasterTable: async function (offerID) {
			const path = this.getModel().createKey("/TenderMasterView", {
				TenderID: this.objectId,
				OfferID: offerID
			});
			const model = this.getModel();
			return new Promise((resolve, reject) => {
				this.getModel().read(path, {
					success: function (res) {
						model.refresh();
						resolve(res);
					},
					error: function(err){
						reject(err);
					}
				});
			});
		},

		refreshOfferTab: function(tenderID, offerID){
			this._bindForm("OfferForm", tenderID, offerID);
			this._bindTable("OfferProductsTable", tenderID, offerID);
			this._bindText("TotalAmountOfferProducts");	
		},

		navToOffer: function (offerID) {
			this.getRouter().navTo("objectDetailOffer", {
				countryCode: this.countryCode,
				productScope: this.productScope,
				objectId: this.objectId, 
				offerId: offerID,
			});
		},

		onOfferCopyFail: function(error){
			console.error("Copying the offer was not possible. Reason :", error);
			MessageBox.error(JSON.parse(error?.responseText)?.error?.message?.value);
		},

		onSoftDeleteOffer: function () {
			this.defaultModel.callFunction("/softDeleteOffer", {
				method:"POST", 
				urlParameters: {"offerID": this.offerID},
				success: this.onOfferDeleteSuccess.bind(this),
				error: this.onOfferDeleteFail.bind(this)
			})
		},

		onOfferDeleteSuccess: async function (offerID) {
			this.navToMasterView();
			MessageToast.show(offerID + " deleted");
		},

		onOfferDeleteFail: async function (error) {
			console.error("Deletion of offer was not possible. Reason :", error);
			MessageBox.error(JSON.parse(error?.responseText)?.error?.message?.value);
		},

		navToMasterView: function () {
			this.getRouter().navTo("master");
		},


		/**
		 * Checks if a given string contains the characters 'C' or 'R' after a hyphen.
		 *
		 * @param {string} str - The input string to be checked for 'C' or 'R'.
		 * @returns {boolean} Returns true if 'C' or 'R' is found after a hyphen, otherwise returns false.
		 *
		 * @example
		 * const isCopied = isCopiedOffer('GB-23-1001-2-C1');
		 * console.log(isCopied); // Output: true
		 */
		isCopiedOffer: function(str) {
			const match = str.match(/-[^-]*[CR]/);
			return match !== null;
		},

		handleUpdateOfferProductTable: function () {
			this.byId('idOfferProductsTable').getBinding("items").refresh();
		},
		onOpenNotification: function () {
			const that = this;
			
			 Fragment.load({
				id: that.getView().getId(),
				name: "com.bayer.tender.statenderapp.view.offer.fragments.NotificationMail",
				controller: that,
				
			}).then(function (oDialog) {
				oDialog.setModel(that.getModel())
				oDialog.setModel(that.getModel('messages'),'messages')
				oDialog.open();
				that.onGetNotificationContent()
				that.NotificationMailFormBinding()
			})
		},
		onSendNotificationMail: function(evt){
			const Form = this.byId('SendNotificationMailForm')
			const context = Form.getBindingContext()
			let Recipients = this.byId("idTo").getSelectedKeys().join(';')
			this.getModel().setProperty('Recipients', Recipients, context)
			this.getModel().submitChanges({
				success: this.onSendNotificationMailSuccess.bind(this),
				groupId: "NotificationMail"
			})
		},
		onCancelNotificationMail: function () {
				this.cancelPendingChanges(["Outbox"], "notificationMailMsg");
				this.byId("SendNotificationMailDialog").destroy();
		},
		onGetNotificationContent: function () {
			const url = window.location.href
			this.defaultModel.callFunction("/getNotificationMailTemplate", {
				method:"GET", 
				urlParameters: {"offerID": this.offerID, templateId: 'NLNotificationMailTemplate', 'url': url},
				success: this.onGetNotificationContentSuccess.bind(this),
				error: this.onGetNotificationContentError.bind(this)
			});
		},
		onGetNotificationContentSuccess: function (data) {
			this.byId('idEditor').setValue(data);
			this.getModel().resetChanges('/Outbox')
		},
		onGetNotificationContentError: function () {
			MessageBox.error(JSON.parse(error?.responseText)?.error?.message?.value);
		},
		onSendNotificationMailSuccess: function () {
			
			const hasErrorMessages = this.getMessages(["Outbox"]).length > 0;
			this.setMessageSection(["Outbox"], "notificationMailMsg");
			if (!hasErrorMessages) {
				MessageToast.show("Successfully notified");
				this.onCancelNotificationMail();
			}
		},
		NotificationMailFormBinding: function () {
			const Form = this.byId('SendNotificationMailForm')
			let oSender = this.byId("idFrom");
			let userEmail = this.stState.getProperty("/UserEmail")
			oSender.setTokens([
				new Token({text: userEmail, key: userEmail}),
			]);
			let notificationObj = {
				CountryCode: this.countryCode,
				TenderID: this.objectId,
				OfferID: this.offerID,
				Sender: userEmail,
				Recipients: '',
				Subject:`Action Required: Price Details Input for Offer ID ${this.offerID}`,
				MailBody: this.byId('idEditor').getValue(),
				Sent: false			
			}
			
			const NotificationPendingChenges = this.getModel().createEntry("/Outbox", {
				properties: notificationObj,
				groupId: "NotificationMail"
			})
			
			const path = NotificationPendingChenges.getPath()
			Form.bindElement({path, groupId: "NotificationMail"})
		},

		onOpenUploadZagisFileDialog: function () {
			if (!this.byId("idUploadZagisFileDialog")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "com.bayer.tender.statenderapp.view.offer.fragments.ZagisFileUpload",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open();
				}.bind(this));
			} else {
				this.byId("idUploadZagisFileDialog").open();
			}
		},
	  
		onCloseZagisFileUploadDialog: function () {
			this.byId("idUploadZagisFileDialog").close();
		},

		handleZagisFileUploadComplete: function(evt) {
			const response = evt.getParameter("responseRaw") && JSON.parse(evt.getParameter("responseRaw"));
			const statusCode = evt.getParameter("status");

			if (statusCode === 204) {
				this.onCloseZagisFileUploadDialog();
				this.byId("idOfferProductsTable").getBinding('items').refresh();
				MessageBox.success("Zagis File imported successfully");
			}else {
				MessageBox.error(response?.error?.message?.value)
			}
		},

		onHandleUploadZagisFilePress: async function () {
			const oFileUploader = this.byId("idZagisFileUploader");
			const zagisOfferID = await this.createZagisFileEntry(this.offerID);
			oFileUploader.setUploadUrl(`/v2/sta_tender/ZagisUploadFile(OfferID='${zagisOfferID}')/content`);
			oFileUploader.setHttpRequestMethod('PUT');
			//setting X-CSRF-Token if it is not set upload process will fail for deployed application
			if(window.location.host.search('port8080') === -1) {
				oFileUploader.removeAllHeaderParameters()
				const csrfToken = this.getOwnerComponent().getModel().getSecurityToken();
				const headerParam = new FileUploaderParameter();
				headerParam.setName('x-csrf-token');
				headerParam.setValue(csrfToken);
				oFileUploader.addHeaderParameter(headerParam);
			}
			oFileUploader.checkFileReadable().then(function() {
				oFileUploader.upload();
			}, function(error) {
				MessageToast.show("The file cannot be read. It may have changed.");
			}).then(function() {
				oFileUploader.clear();
			});
		},

		createZagisFileEntry: async function (offerID) {
			return new Promise((resolve, reject) => {
				this.getModel().create("/ZagisUploadFile", {
					OfferID: offerID
				}, {
					success: (response) => {
						resolve(response.OfferID);
					}
				});

			})
		},

		OfferProductColumnVisibility: function (title) {
			const tender = this.byId('idOfferProductsTable')?.getBindingContext()?.getObject();
			if (!tender || !title) return true;
			if (tender.CountryCode !== 'NL') return true;
			const cases = {
				'Contract Duration 1': tender.Custom_Integer_1,
				'Contract Duration 2': tender.Custom_Integer_2,
				'Contract Duration 3': tender.Custom_Integer_3,
				'Price 1': tender.Custom_Integer_1,
				'Price 2': tender.Custom_Integer_2,
				'Price 3': tender.Custom_Integer_3,
			}
			if (!cases.hasOwnProperty(title)) return true;


			return !!cases[title];

		}
	});
});