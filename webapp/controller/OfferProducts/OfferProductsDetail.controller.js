sap.ui.define([
	"../BaseController",
	"sap/ui/model/json/JSONModel",
	"../../model/formatter",
	"sap/m/library",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/message/Message",
	"sap/ui/core/library",
	"sap/ui/model/Context",
	"sap/ui/core/Fragment",
	"sap/m/Token",
	"sap/m/ColumnListItem",
	"sap/ui/model/Sorter",
], function (BaseController, JSONModel, formatter, mobileLibrary, Filter, FilterOperator, Message, library, Context, Fragment, Token, ColumnListItem, Sorter) {
	"use strict";

	var MessageType = library.MessageType;

	return BaseController.extend("com.bayer.tender.statenderapp.controller.OfferProducts.OfferProductsDetail", {

		formatter: formatter,
		onInit: function () {

			this.oOwnerComponent = this.getOwnerComponent();
			this.oRouter = this.oOwnerComponent.getRouter();
			this.oDynamicPage = this.byId("idProductForm");

			this.getRouter().getRoute("offerProductDetail").attachPatternMatched(this._onObjectMatched, this);
			this.getOwnerComponent().getEventBus().subscribe("PriceConditionFormChannel", "UpdatePriceConditionForm", this.handleUpdatePriceConditionForm, this);
			// /*this.paState = this.getOwnerComponent().getState(this.getOwnerComponent().PA);
			// this.setModel(this.paState.getModel(), "pa");

			// this.oObjectPageLayout = this.byId("DetailPage");
			// this.paState.setDetailPage(this.oObjectPageLayout);

			// this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			// this.getRouter().getRoute("objectDetail").attachPatternMatched(this._onObjectMatched, this);*/

			// this.setModel(oViewModel, "detailView");

			// this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			// set message model
			this.oMessageManager = sap.ui.getCore().getMessageManager();
			this.getView().setModel(this.oMessageManager.getMessageModel(), "message");
			this.stState = this.getOwnerComponent().getModel("st");
			// activate automatic message generation for complete view
			this.oMessageManager.registerObject(this.getView(), true);
			const oModel = this.getOwnerComponent().getModel();
			const messagesModel = new JSONModel({
				priceCondPrice: [],
				priceCondFoc: [],
				offerProductDetailMsg: [],
				priceCondSpecial: [],
				priceCondWithMaximumPrice: []
			});
			this.setModel(messagesModel, "messages");
			
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		 _onObjectMatched: async function (oEvent) {

			this.sCountryCode = oEvent.getParameter("arguments").countryCode;
			this.sProductScope = oEvent.getParameter("arguments").productScope;
			this.sObjectId = oEvent.getParameter("arguments").objectId;
			this.sOfferId = oEvent.getParameter("arguments").offerId;
			this.productId = oEvent.getParameter("arguments").productId;
			this.layout = oEvent.getParameter("arguments").layout;

			this.getModel("appView").setProperty("/layout", this.layout);
			this.templateState = this.getOwnerComponent().getModel("template");
			this.templateStateData = this.templateState.getData();


			const detaildetailConfig = await this.templateState.read("DETAIL-OFFERPRODUCTDETAIL", {
				countryCode: this.sCountryCode ,
				productScope: this.sProductScope,
				appID: "StandardTenders",
				page: "DETAIL-OFFERPRODUCTDETAIL",
				keys: {
					TenderID: this.sObjectId,
				},
			});

			this.onBeforeShow(this.sObjectId, this.sOfferId, this.sCountryCode, this.productId);
			this.getProductPrice(this.sOfferId, this.productId);

			this.getModel().metadataLoaded().then(function () {
				// var sObjectPath = this.getModel().createKey("PublicSalesOpportunities", {
				// 	ID: this.sObjectId
				// });
				// this._bindView("/" + sObjectPath);
				//this._bindForm("ProductForm");
				this._filterPriceCondition();	
				this.setHasFocPriceConditionClassification();
				this.setHasOfferProductDetailsSaved();
			}.bind(this));
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function () {
			const entity = this.templateStateData.detailDetailOfferProductConfig.countryTemplate.getTemplate().getForm().getEntity();
			let path = this.getOwnerComponent().getModel().createKey(`/${entity}`, {
				TenderID: this.sObjectId,
				OfferID: this.sOfferId,
				Active: '1',
				ProductCode: this.productId,
				LotID: '1'
			});
			

			this.getView().bindElement({
				path: path
			});
		},

		onBeforeShow:async function(sObjectId, sOfferId, countryCode, productCode){
			// get state data
			this.templateState = this.getOwnerComponent().getModel("template");
			this.templateStateData = this.templateState.getData();
			
			//this.getView().getBindingContext("template"); // get current tab data
			// await this.getOwnerComponent().getModel().metadataLoaded();
			this.objectId = sObjectId;
			this.offerId = sOfferId;
			//this.selectedTab = iconTabfilter.getKey();
			
			this.defaultModel = this.getOwnerComponent().getModel();

			const oModel = new JSONModel({
				busy: false,
				delay: 0,
				editMode: false,
				currency: "EUR",
				today: new Date(),
				ProductForm:{
					editMode: false
				},
				PricingForm:{
					editMode: false,
					mainPriceConditionID: null,
					instituteInBranch: true,
					hasOfferProductDetailsSaved: false
				},
				FocForm:{
					hasFocPriceCondition: false,
					editMode: false,
					hasMainPriceCondition: false,
					UOM: ""
				},
				PriceWithFOCForm:{
					editMode: false,
					mainPriceConditionID: null
				}
			});
	
			this.setModel(oModel, "ui");
			this.offerStatus = await this.stState.getOfferStatus(sOfferId);
			const priceConditionType = await this.getSavedPriceConditionType();
			this.getModel("st").setProperty("/SelectedPriceConditionType", priceConditionType);
			this._bindView();
			this._bindForm("ProductForm");
			this._bindTable(sObjectId, sOfferId, countryCode, productCode);
			const selectedTender = await this.stState.getService().getTender(this.sObjectId);
			const parentInstitute = await this.getInstituteView(selectedTender?.InstituteID, countryCode);
			await this.getTaiwanInstituteInBranch(parentInstitute?.InstituteID, parentInstitute?.ParentInstituteID, countryCode);
			// this._bindText("ProductPackNameOfferProductDetail");
			this.loadPriceCondition();
		},		
		getSavedPriceConditionType: async function () {
			const controller = this;
			return new Promise((resolve, reject) => {
				const countryDefaultPriceConditionType = {
					"NL": "NLPrice"
				};

				this.getModel().read("/StandardTenderPriceConditionView", {
					filters: [
						new Filter("OfferID", "EQ", this.offerId),
						new Filter("ProductCode", "EQ", this.productId),
						new Filter("ProductCode", "EQ", this.productId)
					],
					success: function (res) {
						let priceCondition = res?.results.find(el => el.hasPriceCondition == true);
						priceCondition = priceCondition ? priceCondition : res?.results.find(el => countryDefaultPriceConditionType[controller.sCountryCode] ? el.isMain == true && el.ConditionType === countryDefaultPriceConditionType[controller.sCountryCode] : el.isMain == true);
						controller.setMainPriceCondition(priceCondition);
						controller.bindFOCMultiInputTokens(priceCondition)
						resolve(priceCondition?.ConditionType);
					},
					error: function (err) {
						reject(err)
					}
				})
			})
		},
		/**
		 * This method bind a given form to its entity from the ui configuration template.
		 * FYI: the form ID in the View is a concatination of "id" + formName
		 * @param {*} formName FormName - The form name must exactly match the form name configured in the ui template configuration table in the DB
		 */
		_bindForm(formName){
			const entity = this.templateStateData.detailDetailOfferProductConfig.countryTemplate.getTemplate().getForm().getEntity();
			const form = this.byId(`id${formName}`);
			let path = "";
			if (this.sObjectId) {
				path = this.getOwnerComponent().getModel().createKey(`/${entity}`, {
					TenderID: this.sObjectId,
					OfferID: this.sOfferId,
					Active: '1',
					ProductCode: this.productId,
					LotID: '1'
				});
			} else {
				const newEntryContext = this.getOwnerComponent().getModel().createEntry(`/${entity}`, {
					groupId: "ProductFormDetail"
				});
				path = newEntryContext.getPath();
			}

			form.bindElement({
				path: path,
				groupId: "ProductFormDetail",
				events: {
					dataReceived: this.onProductFormDataReceived.bind(this)
				}
			});
		},

		onProductFormDataReceived: function(event){
			const product = event.getParameter('data');
			this.setUOM(product.UnitPerPack);
		},

		_bindTable: async function (tenderId, offerId,  countryCode, productCode) {
			const table = this.byId('idOfferHistoryTable');
			const tender = await this.stState.getService().getTender(tenderId);
			const cols = this.templateStateData.detailDetailOfferProductConfig.countryTemplate.getTemplate().getTable().getColumns();
			const controller = this;
			table && table.bindItems({
				path: `/${this.templateStateData.detailDetailOfferProductConfig.countryTemplate.getTemplate().getTable().getEntity()}`,
				filters: controller.getOfferHistoryFilters(tender, offerId, countryCode, productCode),
				template: new ColumnListItem({
					type: "Active",
					cells: cols.map(col => col.getControl().generateControl())
				}),
				templateShareable: true
			});
		},


		getOfferHistoryFilters: function ({InstituteID}, offerId, countryCode, productCode) {
			const instituteCheckBox = this.byId('currentInstituteCheckId');
			const wonCheckBox = this.byId('wonCheckId');
			const lostCheckBox = this.byId('lostCheckId');

			//default filters
			const oFilters = [
				new Filter("CountryCode", FilterOperator.EQ, countryCode),
			];

			countryCode !== 'PL' && oFilters.push(new Filter("ProductCode", FilterOperator.EQ, productCode));

			if (instituteCheckBox.getSelected()) {
				oFilters.push(new Filter("INSTITUTE_ID", FilterOperator.EQ, InstituteID));
			}

			if (wonCheckBox.getSelected()) {
				oFilters.push(new Filter("OUTCOME", FilterOperator.EQ, 'Won'));
			}

			if (lostCheckBox.getSelected()) {
				oFilters.push(new Filter("OUTCOME", FilterOperator.EQ, 'Lost'));
			}
			
			return oFilters;
		},

		/**
		 * This method bind a text field from the entity
		 * FYI: the textField is a concatination of "id" + textId (id defined in the view for the text field)
		 */
		_bindText(textId){
			let path = "";
			if(textId === 'ProductPackNameOfferProductDetail'){
				const entity = 'OfferProductsTableView';
				const textField = this.byId(`id${textId}`);

				if (this.sObjectId) {
					path = this.getOwnerComponent().getModel().createKey(`/${entity}`, {
						TenderID: this.sObjectId,
						OfferID: this.sOfferId,
						ProductCode: this.productId
					});
				}

				textField.bindElement({
					path: path,
					groupId: "ProductFormDetail"
				})
			}
		},

		_filterPriceCondition: async function () {
			const oSelectedTender = await this.stState.getService().getTender(this.sObjectId);
			const oSelectedOffer = await this.stState.getService().getOffer(this.sOfferId);
			const oPriceCondBinding = this.byId("idSelectedPriceContition").getBinding("items");
			const orFilters = [
				new Filter("CountryCode",FilterOperator.EQ, this.sCountryCode),
				new Filter("Division",FilterOperator.EQ, oSelectedOffer.Division),
				new Filter("Classification",FilterOperator.EQ, oSelectedTender.Classification),
				new Filter("ConditionType",FilterOperator.NE, 'FOC')	
			]

			oSelectedTender.InstituteType === 'Public' && orFilters.push(
				new Filter({
					filters: [
						new Filter("InstituteType",FilterOperator.EQ, oSelectedTender.InstituteType),
						new Filter("InstituteType",FilterOperator.EQ, null)
					],
					and: false
				})
			);

			oPriceCondBinding.filter(orFilters);
		},
	
		_onMetadataLoaded: function () {
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay();
			var oViewModel = this.getModel("detailDetailView");

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			/*oViewModel.setProperty("/delay", 0);

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);*/
		},

		/*******EVENT HANDLERS ********/
		handleLinkPress: function (evt) {
			MessageBox.alert("Tender history will be shown in a pop-up");
		},

		

		handleClose: function() {
			let oNextUIState = "";
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
                // No item should be selected on list after detail page is closed
            this.getOwnerComponent().oListSelector.clearMasterListSelection();
			this.oOwnerComponent.getHelper().then(function (oHelper) {
				oNextUIState = oHelper.getNextUIState(1);
				this.oRouter.navTo("objectDetailOffer", {
					layout: oNextUIState.layout,
					countryCode: this.sCountryCode,
					productScope: this.sProductScope,
					objectId: this.sObjectId,
					offerId: this.sOfferId
				});
			}.bind(this));
		},

		handleFullScreen: function () {
			let bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
			if (!bFullScreen) {
				// store current layout and go full screen
				this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
				this.getModel("appView").setProperty("/layout", "EndColumnFullScreen");
			} else {
				// reset to previous layout
				this.getModel("appView").setProperty("/layout", this.getModel("appView").getProperty("/previousLayout"));
			}
		},

		onOfferDetailFormEditBtnPress: function(event){
			this.getModel("ui").setProperty('/ProductForm/editMode', true);
		},
		onOfferDetailFormSaveBtnPress: function(event){
			// if(!this.validateProduct()) return;
			if (this.getTargets(["OfferProductsDetailView"]).length > 0) {
				const form = this.byId(`idProductForm`);
				switch (this.sCountryCode) {
					case 'PK':
						let pKDistributor = this.getPKDistributor(form);
						this.defaultModel.setProperty(form?.getBindingContext()?.getPath() + "/Custom_String_1", pKDistributor);
						break;
					case 'AU':
						const object = form?.getBindingContext().getObject();
						this.defaultModel.setProperty(form?.getBindingContext()?.getPath() + "/Custom_Integer_1", object?.PACKFACTOR);
					default:
						break;
				}

				this.defaultModel.setProperty(form?.getBindingContext()?.getPath() + "/Line", this.sProductScope); //for mandatory field check in sta-service
				this.defaultModel.submitChanges({
					error: this._onSubmitChangesFail.bind(this),
					success: this._onSubmitChangesSuccessProductForm.bind(this),
					groupId: "ProductFormDetail"
				}); 
			}else {
				this.onOfferDetailFormCancelBtnPress();
			}
		},

		_onSubmitChangesSuccessProductForm: function(res){
			const stTenderRoles = this.getModel("accessControl").getProperty('/standardtenderAccess');
			const UserInfo = this.stState.getProperty('/UserInfo');
			this.refreshPricingForm();
			this.setMessageSection(["OfferProductsDetailView"], "offerProductDetailMsg");
			const hasErrorMessages =  this.getModel("messages").getProperty("/offerProductDetailMsg").length > 0;
			if (!hasErrorMessages) {
				this.getModel("ui").setProperty(`/ProductForm/editMode`, false);
				this.getModel("ui").setProperty(`/PricingForm/hasOfferProductDetailsSaved`, true);
				this.cancelPendingChanges(["OfferProductsDetailView"], "offerProductDetailMsg");
				this.updateEnablementModel(this.offerStatus?.STATUS, {OfferID: this.sOfferId, ProductCode: this.productId}, stTenderRoles, UserInfo, this.sCountryCode);
				this.getOwnerComponent().getEventBus().publish("OfferProductsTableChannel", "updateOfferProductsTable");
				this.getOwnerComponent().getEventBus().publish("MasterTableUpdateChannel", "MasterTableUpdateEvent");
			}
			
		},

		_onSubmitChangesFail: function(error){
			// not implemented
		},

		/**
		 * This function return the "Custom_String_1" defined as "Distributor" field on the offer product detail page
		 * @param {*} form 
		 * @returns 
		 */
		getPKDistributor: function (form){
			const formContainers = form.getAggregation("formContainers");
			let pKDistributorID;
			formContainers.forEach(forContainer => {
					const formElements = forContainer.getAggregation("formElements");
					formElements.forEach(formElement => {
						if(formElement.getAggregation("label") === 'Distributor'){
							pKDistributorID = formElement.getFields()[0]?.getSelectedKey();
						}
					});			
			});
			return pKDistributorID;
		},

		onTaiwanPriceFormSaveBtnPress: function(event){
			const hasErrorMessages =  this.getMessages(["PriceConditionTaiwanPriceView"]).length > 0;
			if(hasErrorMessages) return;
			this.setMessageSection(["PriceConditionTaiwanPriceView"], "priceCondPrice");
			this.defaultModel.submitChanges({
				error: this._onSubmitChangesFail.bind(this),
				success: this._onSubmitChangesTaiwanPriceSuccess.bind(this),
				groupId: "PricingForm"
			}); 
		},

		_onSubmitChangesTaiwanPriceSuccess: function(event){
			const hasErrorMessages =  this.getMessages(["PriceConditionTaiwanPriceView"]).length > 0;
			this.setMessageSection(["PriceConditionTaiwanPriceView"], "priceCondPrice");
			this.invalidateEntityType([
				"PriceConditionTaiwanPriceView"
			]);
			if(!hasErrorMessages){
				this.getModel("ui").setProperty(`/PricingForm/editMode`, false);
				this.cancelPendingChanges(["PriceConditionTaiwanPriceView"], "priceCondPrice");
			} 
			this._refreshOfferProductTable();
			this.refreshPricingForm();
			this.getOwnerComponent().getEventBus().publish("MasterTableUpdateChannel", "MasterTableUpdateEvent");
		},

		onTaiwanPriceFormCancelBtnPress: function(event){
			this.getModel("ui").setProperty('/PricingForm/editMode', false);
			this.cancelPendingChanges(["PriceConditionTaiwanPriceView", "PriceConditionTaiwanDiscountView"], "priceCondPrice");
			
			// reload saved condition type
			this.getSavedPriceConditionType().then((priceConditionType) => {
				this.getModel("st").setProperty("/SelectedPriceConditionType", priceConditionType);
				this.loadPriceCondition();
			});
		},

		onTaiwanDiscountFormSaveBtnPress: function(event){
			const hasErrorMessages =  this.getMessages(["PriceConditionTaiwanDiscountView"]).length > 0;
			if(hasErrorMessages) return;
			this.setMessageSection(["PriceConditionTaiwanDiscountView"], "priceCondPrice");
			this.defaultModel.submitChanges({
				error: this._onSubmitChangesFail.bind(this),
				success: this._onSubmitChangesTaiwanDiscountSuccess.bind(this),
				groupId: "PricingForm"
			}); 
		},

		_onSubmitChangesTaiwanDiscountSuccess: function(event){
			const hasErrorMessages =  this.getMessages(["PriceConditionTaiwanDiscountView"]).length > 0;
			this.setMessageSection(["PriceConditionTaiwanDiscountView"], "priceCondPrice");
			this.invalidateEntityType([
				"PriceConditionTaiwanDiscountView"
			]);
			if(!hasErrorMessages){
				this.getModel("ui").setProperty(`/PricingForm/editMode`, false);
				this.cancelPendingChanges(["PriceConditionTaiwanDiscountView"], "priceCondPrice");
			} 
			this._refreshOfferProductTable();
			this.refreshPricingForm();
			this.getOwnerComponent().getEventBus().publish("MasterTableUpdateChannel", "MasterTableUpdateEvent");
		},

		onTaiwanDiscountFormCancelBtnPress: function(event){
			this.getModel("ui").setProperty('/PricingForm/editMode', false);
			this.cancelPendingChanges(["PriceConditionTaiwanDiscountView", "PriceConditionTaiwanPriceView"], "priceCondPrice");
			
			// reload saved condition type
			this.getSavedPriceConditionType().then((priceConditionType) => {
				this.getModel("st").setProperty("/SelectedPriceConditionType", priceConditionType);
				this.loadPriceCondition();
			});
		},

		onOfferDetailFormCancelBtnPress: function(event){
			this.getModel("ui").setProperty('/ProductForm/editMode', false);
			this.cancelPendingChanges(["OfferProductsDetailView"], "offerProductDetailMsg");
			this.defaultModel.resetChanges();
		},
	
		onPriceWithFOCFormSaveBtnPress: function(event){
			const hasErrorMessages =  this.getMessages(["PriceConditionPriceWithFOCView"]).length > 0;
			if(hasErrorMessages) return;
			this.setMessageSection(["PriceConditionPriceWithFOCView"], "priceCondPrice");
			/** If the input field with live change has type 'com.bayer.tender.statenderapp.model.datatypes.CustomCurrencyType' 
			 * when user only edits the single digit of the existing value, the model submit changes not capturing this value
			 * thus below is the temporary solution until we find a permanent fix
			*/
			const form = this.byId(`idPricingForm`);
			let value = this.byId("idPriceWithFOCOfferPrice")?.getProperty("value");
			this.defaultModel.setProperty(form?.getBindingContext()?.getPath() + "/OfferPrice", Number(value.replace(/[^\d.]/g, '')));
			this.defaultModel.submitChanges({
				error: this._onSubmitChangesFail.bind(this),
				success: this._onSubmitChangesPriceWithFOCSuccess.bind(this),
				groupId: "PricingForm"
			}); 
		},

		_onSubmitChangesPriceWithFOCSuccess: function(res){
			const hasErrorMessages =  this.getMessages(["PriceConditionPriceWithFOCView"]).length > 0;
			this.setMessageSection(["PriceConditionPriceWithFOCView"], "priceCondPrice");
			this.invalidateEntityType([
				"PriceConditionPriceWithFOCView"
			]);
			if(!hasErrorMessages){
				this.getModel("ui").setProperty(`/PricingForm/editMode`, false);
				this.cancelPendingChanges(["PriceConditionPriceWithFOCView"], "priceCondPrice");
			} 
			this._refreshOfferProductTable();
			this.refreshPricingForm();
			this.getOwnerComponent().getEventBus().publish("MasterTableUpdateChannel", "MasterTableUpdateEvent");
		},

		onPriceWithFOCFormCancelBtnPress: function(event){
			this.getModel("ui").setProperty('/PricingForm/editMode', false);
			this.cancelPendingChanges(["PriceConditionPriceWithFOCView"], "priceCondPrice");
			
			// reload saved condition type
			this.getSavedPriceConditionType().then((priceConditionType) => {
				this.getModel("st").setProperty("/SelectedPriceConditionType", priceConditionType);
				this.loadPriceCondition();
			});
		},



		onDiscountWithFOCFormSaveBtnPress: function(event){
			const hasErrorMessages =  this.getMessages(["PriceConditionDiscountWithFOCView"]).length > 0;
			if(hasErrorMessages) return;
			this.setMessageSection(["PriceConditionDiscountWithFOCView"], "priceCondPrice");
			this.defaultModel.submitChanges({
				error: this._onSubmitChangesFail.bind(this),
				success: this._onSubmitChangesDiscountWithFOCSuccess.bind(this),
				groupId: "PricingForm"
			}); 
		},

		_onSubmitChangesDiscountWithFOCSuccess: function(res){
			const hasErrorMessages =  this.getMessages(["PriceConditionDiscountWithFOCView"]).length > 0;
			this.setMessageSection(["PriceConditionDiscountWithFOCView"], "priceCondPrice");
			this.invalidateEntityType([
				"PriceConditionDiscountWithFOCView"
			]);
			if(!hasErrorMessages){
				this.getModel("ui").setProperty(`/PricingForm/editMode`, false);
				this.cancelPendingChanges(["PriceConditionDiscountWithFOCView"], "priceCondPrice");
			} 
			this._refreshOfferProductTable();
			this.refreshPricingForm();
			this.getOwnerComponent().getEventBus().publish("MasterTableUpdateChannel", "MasterTableUpdateEvent");
			
		},

		refreshPricingForm: function(){
			const pricingForm = this.byId("idPricingForm");
			pricingForm.getElementBinding().refresh();
		},


		onDiscountWithFOCFormCancelBtnPress: function(event){
			this.getModel("ui").setProperty('/PricingForm/editMode', false);
			this.cancelPendingChanges(["PriceConditionDiscountWithFOCView"], "priceCondPrice");

			// reload saved condition type
			this.getSavedPriceConditionType().then((priceConditionType) => {
				this.getModel("st").setProperty("/SelectedPriceConditionType", priceConditionType);
				this.loadPriceCondition();
			});
		},

		/**
		 * Handles the check for rebased prices to determine if there are any changes in the price condition. 
		 * In the rebasePrice function we update BasePrice in case MasterData RegisteredPrice and save BasePrice in the PriceCondition are different
		 * Then even though both values are same we recalculate NetPrice that's why PriceCondition always has pending changes.
		 * If no changes are detected, it cancels the pending changes for specified paths.
		 * @async
		 * @function onCheckRebasedPrices
		 * @returns {Promise<void>} Resolves when the function completes its operations.
		*/
		onCheckRebasedPrices: async function () {
			// Retrieve the pending changes from the model
			const pendingChanges = this.getModel().getPendingChanges();

			// Get the target path for the price condition
			const targetPath = this.getTargets(["PriceCondition"])[0];
			const priceConditionPath = targetPath.split('/')[1];

			// Fetch the original price condition from the service
			const originalPriceCondtion = await this.stState.getService().getPriceCondition(targetPath);

			// Get the pending changes for the price condition
			const priceConditionTobeSaved = pendingChanges[priceConditionPath];

			// Compare the properties of the pending changes with the original price condition
			const samePriceCondition = [];
			for (let key in priceConditionTobeSaved) {
				if (typeof priceConditionTobeSaved[key] !== 'object') {
					samePriceCondition.push(priceConditionTobeSaved[key] == originalPriceCondtion[key]);
				}
			}

			// Check if all properties of the price condition are unchanged
			const isSamePriceCondition = samePriceCondition.every(el => el);

			// If no changes are detected, cancel pending changes for specified paths
			if (isSamePriceCondition) {
				this.cancelPendingChanges(
					[
						"idOfferPrice",
						"PriceConditionPriceView",
						"PriceConditionDiscountView",
						"PriceConditionDiscountWithFOCView",
						"PriceConditionPriceWithFOCView",
						"PriceConditionTaiwanPriceView",
						"PriceConditionTaiwanDiscountView",
						"PriceConditionNLPriceView",
						"PriceConditionNLDiscountView",
						"PriceConditionSpecialPriceView",
						"PriceConditionWithMaximumPriceView"
					],
					"priceCondPrice"
				);
			}
		},


		onPricingFormEditBtnPress: function(event){
			const conditonType = this.getModel('st').getProperty("/SelectedPriceConditionType");
			this.rebasePrice(conditonType);
			this.getModel("ui").setProperty('/PricingForm/editMode', true);
			this.getModel("ui").setProperty('/FocForm/editMode', false);
			this.onCheckRebasedPrices();
		},

		/**
		 * Recaltulate the price based on the current base price and the provided condition type.
		 * When master data changes (registered price), the current base price and the (saved) base price will be different.
		 * @param {string} conditionType - The type of condition.
		 */
		rebasePrice: function(conditonType){
			const pricingForm = this.byId("idPricingForm");
			const context = pricingForm.getElementBinding().getBoundContext();
			const boundObject = context.getObject();
			const contextPath = context.getPath();
			if(Number(boundObject.CurrentBasePrice) !== Number(boundObject.BasePrice)){
				context.getModel().setProperty("BasePrice", boundObject.CurrentBasePrice, context);
			}
			this.calculatePricingFormFields({conditonType,context});
		},

		onPricingFormSaveBtnPress: function(event){
			if (this.getTargets(["PriceCondition"]).length > 0) {
				const hasErrorMessages =  this.getMessages([
					"idOfferPrice", 
					"PriceConditionPriceView",
					"PriceConditionDiscountView"
				]).length > 0;
				this.setMessageSection(["idOfferPrice", "PriceConditionPriceView", "PriceConditionDiscountView"], "priceCondPrice");
				/** If the input field with live change has type 'com.bayer.tender.statenderapp.model.datatypes.CustomCurrencyType' 
				 * when user only edits the single digit of the existing value, the model submit changes not capturing this value
				 * thus below is the temporary solution until we find a permanent fix
				*/
				const form = this.byId(`idPricingForm`);
				let value = this.byId("idOfferPrice")?.getProperty("value");
				this.defaultModel.setProperty(form?.getBindingContext()?.getPath() + "/OfferPrice", Number(value.replace(/[^\d.]/g, '')));
				this.defaultModel.submitChanges({
					error: this._onSubmitChangesFail.bind(this),
					success: this._onSubmitChangesSuccess.bind(this),
					groupId: "PricingForm"
				}); 
			}else {
				this.onPricingFormCancelBtnPress();
			}
		},
		
		onPricingFormCancelBtnPress: function(event){
			this.getModel("ui").setProperty('/PricingForm/editMode', false);
			this.cancelPendingChanges(["idOfferPrice", "PriceConditionPriceView","PriceConditionDiscountView"], "priceCondPrice");

			// reload saved condition type
			this.getSavedPriceConditionType().then((priceConditionType) => {
				this.getModel("st").setProperty("/SelectedPriceConditionType", priceConditionType);
				this.loadPriceCondition();
			});
		},

		_onSubmitChangesSuccess: function(res){
			const hasErrorMessages =  this.getMessages(["idOfferPrice", "PriceConditionPriceView","PriceConditionDiscountView"]).length > 0;
			this.setMessageSection(["idOfferPrice", "PriceConditionPriceView","PriceConditionDiscountView"], "priceCondPrice");
			this.invalidateEntityType([
				"PriceConditionPriceView",
				"PriceConditionDiscountView"
			]);
			if(!hasErrorMessages){
				this.getModel("ui").setProperty(`/PricingForm/editMode`, false);
				this.cancelPendingChanges(["idOfferPrice", "PriceConditionPriceView","PriceConditionDiscountView"], "priceCondPrice");
			} 

			this._refreshOfferProductTable();
			this.getOwnerComponent().getEventBus().publish("MasterTableUpdateChannel", "MasterTableUpdateEvent");
		},

		_refreshOfferProductTable: function(){
			this.getOwnerComponent().getModel().read("/OfferProductsTableView", {
				filters: [
						new sap.ui.model.Filter("TenderID", sap.ui.model.FilterOperator.EQ, this.sObjectId),
						new sap.ui.model.Filter("OfferID", sap.ui.model.FilterOperator.EQ, this.sOfferId),
						new sap.ui.model.Filter("ProductCode", sap.ui.model.FilterOperator.EQ, this.productId),
					]
			});

			// refresh offer total
			const path = this.getOwnerComponent().getModel().createKey("/OfferProductsTotalForOffer", {
				OfferID: this.sOfferId
			});
			this.getOwnerComponent().getModel().read(path);

			// this.defaultModel.refresh(true);
		},

		/**
		 * Invalidate all entries of the given entity type in the model data.
		 * Mark entries of the provided entity type in the model cache as invalid. 
		 * Next time a context binding or list binding is done, the entry will be detected as invalid and will be refreshed from the server.
		 *
		 * @param {Array<string>} entityTypes - An array of entity type names.
		 * @returns {void}
		 */
		invalidateEntityType(entityTypes=[]){
			entityTypes.forEach(type => this.defaultModel.invalidateEntityType(`StandardAppService.${type}`));
		},


		// _filterPricingForm: function ({offerID, productID}) {
		// 	const oPricingForm = this.byId("idPricingForm");
		// 	const oPricingFormBinding = oPricingForm.getBinding("formContainers");
		// 	const aFilters = [
		// 		new Filter("OfferID",FilterOperator.EQ, offerID),
		// 		new Filter("ProductCode",FilterOperator.EQ, productID),
		// 	]
		// 	oPricingFormBinding.filter(aFilters);
		// },	

		validateProduct: function () {
			const contextPath = this.byId('idProductForm').getObjectBinding().getPath();
			const product = this.defaultModel.getProperty(contextPath);
			let messages = [];

			if (!product.RequestedVolume) {
				messages.push(new Message({
					message: "Please enter the requested volume",
					type: MessageType.Error,
					target: `${contextPath}/RequestedVolume`,
					processor: this.getView().getModel()
				}));
			}

			if(!product.UnitPerPack){
				messages.push(new Message({
					message: "Please enter the unit per pack",
					type: MessageType.Error,
					target: `${contextPath}/UnitPerPack`,
					processor: this.getView().getModel()
				}));
			}
			
			if(messages.length > 0){
				sap.ui.getCore().getMessageManager().addMessages(messages);
				this.getModel("ui").setProperty('/ProductForm/editMode', true);
				return false;
			}

			return true;
		},
		
		/**
		 * Event handler for pricing form live change.
		 *
		 * @param {object} event - The event object.
		 * @param {string} conditionType - The condition type.
		 */
		onPricingFormLiveChange:function(event, conditonType){
			let value = event.getParameter("newValue");
			if(!value){value = '0';}
			const type = event.getSource().getBinding('value').getType();
			value = value.replace(/(?<=\d),(?=\d{3}(\.|$))/g, '');
			const parsedValue = type.getModelFormat().parse(value);
			const property = event.getSource().getBindingPath("value");
			const context = event.getSource().getBindingContext();
			this.calculatePricingFormFields({
				conditonType,
				value: parsedValue,
				property,
				context
			});
		},

		/**
		 * Calculate pricing form fields based on the condition type.
		 *
		 * @param {object} options - Options for the calculation.
		 * @param {string} options.conditionType - The condition type.
		 * @param {number|string} options.value - The value for the calculation.
		 * @param {string} options.property - The property name for the calculation.
		 * @param {object} options.context - The ui5 context object.
		 */
		calculatePricingFormFields: function({conditonType,value,property,context}){
			switch(conditonType.toLowerCase()){
				case "price":
					this.calculatePriceConditionType({property, value, context});
					break;
				case "discount":
					this.calculateDiscountConditionType({property, value, context});
					break;
				case "pricewithfoc":
					this.calculatePriceWithFOCConditionType({property, value, context});
					break;
				case "discountwithfoc":
					this.calculateDiscountWithFOCConditionType({property, value, context});
					break;
				case "taiwandiscount":
					this.calculateTaiwanDiscountConditionType({property, value, context});
					break;
				case "taiwanprice":
					this.calculateTaiwanPriceConditionType({property, value, context});
					break;
				case "nldiscount":
					this.calculateNetherlandsDiscountConditionType({property, value, context});
					break;
				case "nlprice":
					this.calculateNetherlandsPriceConditionType({property, value, context});
					break;
				case "specialprice":
					this.calculatePolandSpecialPriceConditionType({property, value, context});
					break;
				case "withmaximumprice":
					this.calculatePolandWithMaximumPriceConditionType({property, value, context});
					break;
			}
		},

		/**
		 * Calculate price condition type.
		 *
		 * @param {object} options - Options for the calculation.
		 * @param {string} options.property - The property name (optional).
		 * @param {number|string} options.value - The property value (optional).
		 * @param {object} options.context - The context object
		 * @returns {void} - Changes context properties
		 */
		calculatePriceConditionType: function({property, value, context}){
			const priceObj = context.getObject();
			priceObj.CurrentBasePrice = priceObj.CountryCode?.includes("HM") ? this.formatter.truncToFourDecimalPlaces(priceObj.CurrentBasePrice) : this.formatter.truncToTwoDecimalPlaces(priceObj.CurrentBasePrice);
			let basePrice = priceObj.CurrentBasePrice;
			let offerPrice = property?.toLowerCase().includes("offerprice") ? parseFloat(value) : Number(this.byId("idOfferPrice")?.getValue()?.replace(/[^\d.]/g, ''));
			offerPrice = priceObj.CountryCode?.includes("HM") ? this.formatter.truncToFourDecimalPlaces(offerPrice) : this.formatter.truncToTwoDecimalPlaces(offerPrice);
			let deductions = property?.toLowerCase().includes("deductions") ? value : priceObj.Deductions;
			let discount = (parseFloat(priceObj.CurrentBasePrice) - parseFloat(offerPrice)) / priceObj.CurrentBasePrice;
			discount = (priceObj.CountryCode === 'AU' || priceObj.CountryCode?.includes("HM")) ? this.formatter.truncToFourDecimalPlaces(discount) : this.formatter.truncToTwoDecimalPlaces(discount);
			let netPrice = offerPrice * (1 - deductions);
			netPrice = priceObj.CountryCode?.includes("HM") ? this.formatter.truncToFourDecimalPlaces(netPrice) : this.formatter.truncToTwoDecimalPlaces(netPrice);

			context.getModel().setProperty("Discount", discount, context);
			context.getModel().setProperty("NetPrice", netPrice, context);

			if(priceObj.CountryCode !== 'AU' && priceObj.CountryCode !== 'PL'){
				this.validatePriceWithFOCForm(context, { offerPrice, basePrice });
			}
		},

		/**
		 * Calculate price condition type.
		 *
		 * @param {object} options - Options for the calculation.
		 * @param {string} options.property - The property name (optional).
		 * @param {number|string} options.value - The property value (optional).
		 * @param {object} options.context - The context object
		 * @returns {void} - Changes context properties
		 */
		calculateTaiwanDiscountConditionType: function({property, value, context}){
			const priceObj = context.getObject();
			let instituteInBranch = this.getModel("ui").getProperty("/PricingForm/instituteInBranch");
			let basePrice = property?.toLowerCase().includes("baseprice") ? parseFloat(value).toFixed(2) : parseFloat(priceObj.BasePrice);
			let invoicePrice = property?.toLowerCase().includes("offerprice") ? parseFloat(value).toFixed(2) : (isNaN(parseFloat(priceObj.OfferPrice)) ? 0 : parseFloat(priceObj.OfferPrice));
			let mainCustomerVolume = property?.toLowerCase().includes("anticipatedyearlyvolumemaincustomer") ? parseInt(value) : parseInt(priceObj.AnticipatedYearlyVolumeMainCustomer);
			let branchVolume = property?.toLowerCase().includes("anticipatedyearlyvolumebranch") ? parseInt(value) : parseInt(priceObj.AnticipatedYearlyVolumeBranch);
			let deductions = property?.toLowerCase().includes("deductions") ? value : (isNaN(parseFloat(priceObj.Deductions)) ? 0 : parseFloat(priceObj.Deductions));
			let level2Discount2 = property?.toLowerCase().includes("level2discount2") ? value : (isNaN(parseFloat(priceObj.Level2Discount2)) ? 0 : parseFloat(priceObj.Level2Discount2));
			let annualDiscount = property?.toLowerCase().includes("annualdiscountforbranch") ? parseFloat(value).toFixed(2) : (isNaN(parseFloat(priceObj.AnnualDiscountForBranch)) ? 0 : parseFloat(priceObj.AnnualDiscountForBranch));
			//let negotiationPrice = property?.toLowerCase().includes("negotiationprice") ? parseFloat(value).toFixed(2) : parseFloat(priceObj.NegotiationPrice);
			let netPrice = this.calculateNetOfferTaiwanPrice({invoicePrice,deductions,level2Discount2,instituteInBranch,mainCustomerVolume,branchVolume,priceObj}); 
			let level3Discount1 = instituteInBranch ? annualDiscount / branchVolume : annualDiscount / mainCustomerVolume;
			let price3 = this.formatter.truncToTwoDecimalPlaces(netPrice - level3Discount1);
			let estSaleValue = this.formatter.truncToTwoDecimalPlaces(price3 * mainCustomerVolume);
			let grpEstSaleValue = instituteInBranch && this.formatter.truncToTwoDecimalPlaces(price3 * branchVolume);
			let totalDiscount = (basePrice - price3) / basePrice;
			let priceImpact = (invoicePrice - price3) / invoicePrice;
			let generalDiscountAmount = invoicePrice * deductions;
			let secondDiscountAmount = invoicePrice * level2Discount2;

			
			context.getModel().setProperty("NetPrice", netPrice, context);
			context.getModel().setProperty("Level3Discount1", level3Discount1, context);
			context.getModel().setProperty("Price3", price3, context);
			// context.getModel().setProperty("NegotiationPrice", negotiationPrice, context);
			context.getModel().setProperty("TotalYearlyValueMainCustomer", estSaleValue, context);
			context.getModel().setProperty("TotalYearlyValueBranch", grpEstSaleValue, context);
			context.getModel().setProperty("TotalDiscountNHI", totalDiscount, context);
			context.getModel().setProperty("TotalDiscountInvoice", priceImpact, context);
			context.getModel().setProperty("GeneralDiscount_Amount", generalDiscountAmount, context);
			context.getModel().setProperty("SecondDiscount_Amount", secondDiscountAmount, context);
		},

		calculateTaiwanPriceConditionType: function({property, value, context}){
			const priceObj = context.getObject();
			let instituteInBranch = this.getModel("ui").getProperty("/PricingForm/instituteInBranch");
			let grpEstSaleValue = 0;
			let basePrice = property?.toLowerCase().includes("baseprice") ? parseFloat(value).toFixed(2) : parseFloat(priceObj.BasePrice);
			let invoicePrice = property?.toLowerCase().includes("offerprice") ? parseFloat(value).toFixed(2) : (isNaN(parseFloat(priceObj.OfferPrice)) ? 0 : parseFloat(priceObj.OfferPrice));
			let mainCustomerVolume = property?.toLowerCase().includes("anticipatedyearlyvolumemaincustomer") ? parseInt(value) : parseInt(priceObj.AnticipatedYearlyVolumeMainCustomer);
			let branchVolume = property?.toLowerCase().includes("anticipatedyearlyvolumebranch") ? parseInt(value) : parseInt(priceObj.AnticipatedYearlyVolumeBranch);
			let annualDiscount = property?.toLowerCase().includes("annualdiscountforbranch") ? parseFloat(value).toFixed(2) : (isNaN(parseFloat(priceObj.AnnualDiscountForBranch)) ? 0 : parseFloat(priceObj.AnnualDiscountForBranch));
			let negotiationPrice = property?.toLowerCase().includes("negotiationprice") ? parseFloat(value).toFixed(2) : parseFloat(priceObj.NegotiationPrice);
			let generalDiscountAmount = property?.toLowerCase().includes("generaldiscount_amount") ? parseFloat(value).toFixed(2) : (isNaN(parseFloat(priceObj.GeneralDiscount_Amount)) ? 0 : parseFloat(priceObj.GeneralDiscount_Amount));
			let secondDiscountAmount = property?.toLowerCase().includes("seconddiscount_amount") ? parseFloat(value).toFixed(2) : (isNaN(parseFloat(priceObj.SecondDiscount_Amount)) ? 0 : parseFloat(priceObj.SecondDiscount_Amount));
			let deductions = generalDiscountAmount / invoicePrice;
			let level2Discount2 = secondDiscountAmount / invoicePrice;
			let netPrice = this.calculateNetOfferTaiwanPrice({invoicePrice,deductions,level2Discount2,instituteInBranch,mainCustomerVolume,branchVolume,priceObj}); 
			let level3Discount1 = instituteInBranch ? annualDiscount / branchVolume : annualDiscount / mainCustomerVolume; 
			let price3 = this.formatter.truncToTwoDecimalPlaces(netPrice - level3Discount1);
			let estSaleValue = this.formatter.truncToTwoDecimalPlaces(price3 * mainCustomerVolume);
			if (instituteInBranch) { grpEstSaleValue = this.formatter.truncToTwoDecimalPlaces(price3 * branchVolume); }
			let totalDiscount = (basePrice - price3) / basePrice;
			let priceImpact = (invoicePrice - price3) / invoicePrice;

			
			context.getModel().setProperty("NetPrice", netPrice, context);
			context.getModel().setProperty("Level3Discount1", level3Discount1, context);
			context.getModel().setProperty("Price3", price3, context);
			// context.getModel().setProperty("NegotiationPrice", negotiationPrice, context);
			context.getModel().setProperty("TotalYearlyValueMainCustomer", estSaleValue, context);
			context.getModel().setProperty("TotalYearlyValueBranch", grpEstSaleValue, context);
			context.getModel().setProperty("TotalDiscountNHI", totalDiscount, context);
			context.getModel().setProperty("TotalDiscountInvoice", priceImpact, context);
			context.getModel().setProperty("Deductions", deductions, context);
			context.getModel().setProperty("Level2Discount2", level2Discount2, context);
		},

		onAnticipatedYearlyVolumeLiveChange: function(event, conditonType){
			const value = event.getParameter("newValue");
			if(!value) return;
			const property = event.getSource().getBindingPath("value");
			const context = event.getSource().getBindingContext();
			this.calculatePricingFormFields({
				conditonType,
				value: value,
				property,
				context
			});
		},

		/**
		 * Calculate discount condition type.
		 *
		 * @param {object} options - Options for the calculation.
		 * @param {string} options.property - The property name (optional).
		 * @param {number|string} options.value - The property value (optional).
		 * @param {object} options.context - The context object
		 * @returns {void} - Changes context properties
		 */		
		calculateDiscountConditionType: function({property, value, context}){
			const priceObj = context.getObject();
			priceObj.CurrentBasePrice = priceObj.CountryCode?.includes("HM") ? this.formatter.truncToFourDecimalPlaces(priceObj.CurrentBasePrice) : this.formatter.truncToTwoDecimalPlaces(priceObj.CurrentBasePrice);
			let basePrice = priceObj.CurrentBasePrice;
			let discount = property?.toLowerCase().includes("discount") ? value : priceObj.Discount;
			let deductions = property?.toLowerCase().includes("deductions") ? value : priceObj.Deductions;
			let offerPrice = Number(parseFloat(priceObj.CurrentBasePrice) * (1 - discount));
			offerPrice = priceObj.CountryCode?.includes("HM") ? this.formatter.truncToFourDecimalPlaces(offerPrice) : this.formatter.truncToTwoDecimalPlaces(offerPrice);
			let netPrice = offerPrice * (1 - deductions);
			netPrice = priceObj.CountryCode?.includes("HM") ? this.formatter.truncToFourDecimalPlaces(netPrice) : this.formatter.truncToTwoDecimalPlaces(netPrice);

			context.getModel().setProperty("OfferPrice", offerPrice, context);
			context.getModel().setProperty("NetPrice", netPrice, context);

			if(priceObj.CountryCode !== 'AU' && priceObj.CountryCode !== 'PL'){
				this.validatePriceWithFOCForm(context, { offerPrice, basePrice });
			}
		},	


		/**
		 * Calculate price with FOC condition type.
		 *
		 * @param {object} options - Options for the calculation.
		 * @param {string} options.property - The property name (optional).
		 * @param {number|string} options.value - The property value (optional).
		 * @param {object} options.context - The context object
		 * @returns {void} - Changes context properties
		 */
		calculatePriceWithFOCConditionType: function({property, value, context}){
			const priceObj = context.getObject();
			priceObj.CurrentBasePrice = priceObj.CountryCode?.includes("HM") ? this.formatter.truncToFourDecimalPlaces(priceObj.CurrentBasePrice) : priceObj.Region === 'MEA' ? this.formatter.truncToThreeDecimalPlaces(priceObj.CurrentBasePrice) : this.formatter.truncToTwoDecimalPlaces(priceObj.CurrentBasePrice); // Truncate number to two decimal places without rounding. For correct rounding
			let basePrice = priceObj.CurrentBasePrice;
			let offerPrice = property?.toLowerCase().includes("offerprice") ? parseFloat(value) : Number(this.byId("idPriceWithFOCOfferPrice")?.getValue()?.replace(/[^\d.]/g, ''));
			offerPrice = priceObj.CountryCode?.includes("HM") ? this.formatter.truncToFourDecimalPlaces(offerPrice) : priceObj.Region === 'MEA' ? this.formatter.truncToThreeDecimalPlaces(offerPrice) : this.formatter.truncToTwoDecimalPlaces(offerPrice);
			let netOfferPrice = this.calculateNetOfferPrice({offerPrice, priceObj}); 
			netOfferPrice = priceObj.CountryCode?.includes("HM") ? this.formatter.truncToFourDecimalPlaces(netOfferPrice) : priceObj.Region === 'MEA' ? this.formatter.truncToThreeDecimalPlaces(netOfferPrice) : this.formatter.truncToTwoDecimalPlaces(netOfferPrice);
			let deductions = property?.toLowerCase().includes("deductions") ? value : priceObj.Deductions;
			let discount = (parseFloat(priceObj.CurrentBasePrice) - parseFloat(offerPrice)) / priceObj.CurrentBasePrice;
			discount = (priceObj.CountryCode === 'AU' || priceObj.CountryCode?.includes("HM")) ? this.formatter.truncToFourDecimalPlaces(discount) : priceObj.Region === 'MEA' ? this.formatter.truncToThreeDecimalPlaces(discount) : this.formatter.truncToTwoDecimalPlaces(discount);
			let netPrice = netOfferPrice * (1 - deductions);
			netPrice = priceObj.CountryCode?.includes("HM") ? this.formatter.truncToFourDecimalPlaces(netPrice) : priceObj.Region === 'MEA' ? this.formatter.truncToThreeDecimalPlaces(netPrice) : this.formatter.truncToTwoDecimalPlaces(netPrice);

			context.getModel().setProperty("Discount", discount, context);
			context.getModel().setProperty("NetPrice", netPrice, context);
			context.getModel().setProperty("NetOfferPrice", netOfferPrice, context);
			
			if(priceObj.CountryCode !== 'AU' && priceObj.CountryCode !== 'PL'){
				this.validatePriceWithFOCForm(context, { offerPrice, basePrice });
			}
		},
		
		/**
		 * Calculate discount with FOC condition type.
		 *
		 * @param {object} options - Options for the calculation.
		 * @param {string} options.property - The property name (optional).
		 * @param {number|string} options.value - The property value (optional).
		 * @param {object} options.context - The context object
		 * @returns {void} - Changes context properties
		 */
		calculateDiscountWithFOCConditionType: function({property, value, context}){
			const priceObj = context.getObject();
			priceObj.CurrentBasePrice = priceObj.CountryCode?.includes("HM") ? this.formatter.truncToFourDecimalPlaces(priceObj.CurrentBasePrice) : priceObj.Region === 'MEA' ? this.formatter.truncToThreeDecimalPlaces(priceObj.CurrentBasePrice) : this.formatter.truncToTwoDecimalPlaces(priceObj.CurrentBasePrice); // Truncate number to two decimal places without rounding. For correct rounding
			let basePrice = priceObj.CurrentBasePrice;
			let discount = property?.toLowerCase().includes("discount") ? value : priceObj.Discount;
			let offerPrice = Number(priceObj.CurrentBasePrice * (1 - discount));
			offerPrice = priceObj.CountryCode?.includes("HM") ? this.formatter.truncToFourDecimalPlaces(offerPrice) : priceObj.Region === 'MEA' ? this.formatter.truncToThreeDecimalPlaces(offerPrice) : this.formatter.truncToTwoDecimalPlaces(offerPrice);
			let netOfferPrice = this.calculateNetOfferPrice({offerPrice, priceObj}); 
			netOfferPrice = priceObj.CountryCode?.includes("HM") ? this.formatter.truncToFourDecimalPlaces(netOfferPrice) : priceObj.Region === 'MEA' ? this.formatter.truncToThreeDecimalPlaces(netOfferPrice) : this.formatter.truncToTwoDecimalPlaces(netOfferPrice);
			let deductions = property?.toLowerCase().includes("deductions") ? value : priceObj.Deductions;
			let netPrice = netOfferPrice * (1 - deductions);
			netPrice = priceObj.CountryCode?.includes("HM") ? this.formatter.truncToFourDecimalPlaces(netPrice) : priceObj.Region === 'MEA' ? this.formatter.truncToThreeDecimalPlaces(netPrice) : this.formatter.truncToTwoDecimalPlaces(netPrice);

			context.getModel().setProperty("OfferPrice", offerPrice, context);
			context.getModel().setProperty("NetPrice", netPrice, context);
			context.getModel().setProperty("NetOfferPrice", netOfferPrice, context);

			if(priceObj.CountryCode !== 'AU' && priceObj.CountryCode !== 'PL'){
				this.validatePriceWithFOCForm(context, { offerPrice, basePrice });
			}
			
		},

		/**
		 * Calculate NetOfferPrice based on rules
		 * Case1: No FOC in the pop up
		 * Case2: One or more FOC products which are different from Offer Product
		 * Case3: One or more FOC products in which one is same as Offer Product but Its dropdown is selected as 'Added'
		 * Case4: One or more FOC products in which one is same as Offer Product but Its dropdown is selected as 'Included'
		 * Warning: These functions need to be aligned with the backend implementations. 
		 * see sta-service.js -> PriceConditionPriceWithFOCView
		**/
		calculateNetOfferPrice: function({offerPrice, priceObj}){
			const multiInput = this.byId('idFOCMultiInput');
			
			const offerProduct = priceObj.ProductCode;
			const foc = multiInput.getBinding('tokens')?.getContexts()?.map(ctx => ctx.getObject()) || [];

			const containsOfferProduct = hasObjectWithProductCode(foc, offerProduct); 
			const containsOfferProductAndIsAdded = hasObjectWithProductCodeAndIsAdded(foc, offerProduct); 
			const containsOfferProductAndIsIncluded = hasObjectWithProductCodeAndIsIncluded(foc, offerProduct); 

			//Cases 1 and 2
			if(foc.length === 0 || !containsOfferProduct) return offerPrice;

			let focVolume = 0;

			// Case 3
			if(containsOfferProductAndIsAdded || containsOfferProductAndIsIncluded) {
				const FOC = getFOCWitSameProductCode(foc, offerProduct);
				switch(FOC.FreeGoodsOther_ABS_PCT){
					case "ABS":
						focVolume = Number(FOC.FreeGoodsOther);
						break;
					case "PCT":
						focVolume = Math.round(priceObj.RequestedVolume * FOC.FreeGoodsOther);
						break;
					case "STP":
						focVolume = Math.floor(priceObj.RequestedVolume / FOC.FreeGoodsOther_Step) * FOC.FreeGoodsOther;
						break;
					default:
						break;
				}
			}

			let paidVolume = containsOfferProductAndIsAdded ? priceObj.RequestedVolume : priceObj.RequestedVolume - focVolume;
			let totalVolume = containsOfferProductAndIsAdded ? priceObj.RequestedVolume + focVolume : priceObj.RequestedVolume;
			let netOfferPrice = offerPrice * paidVolume / totalVolume;

			function hasObjectWithProductCode(arr, offerProduct) {
				return arr.some(obj => obj.ProductPackId === offerProduct);
			}

			function hasObjectWithProductCodeAndIsAdded(arr, offerProduct) {
				return arr.some(obj => obj.ProductPackId === offerProduct && obj.ADD_INCLUDE === 'Added');
			}

			function hasObjectWithProductCodeAndIsIncluded(arr, offerProduct) {
				return arr.some(obj => obj.ProductPackId === offerProduct && obj.ADD_INCLUDE === 'Included');
			}

			function getFOCWitSameProductCode(arr, offerProduct) {
				return arr.find(obj => obj.ProductPackId === offerProduct);
			}

			return netOfferPrice;

		},

		/**
		 * Calculate NetOfferPrice based on rules
		 * Case1: No FOC in the pop up
		 * Case2: One or more FOC products which are different from Offer Product
		 * Case3: One or more FOC products in which one is same as Offer Product but Its dropdown is selected as 'Added'
		 * Case4: One or more FOC products in which one is same as Offer Product but Its dropdown is selected as 'Included'
		 * Warning: These functions need to be aligned with the backend implementations. 
		 * see sta-service.js -> PriceConditionPriceWithFOCView
		**/
		calculateNetOfferTaiwanPrice: function({invoicePrice,deductions,level2Discount2,instituteInBranch,mainCustomerVolume,branchVolume, priceObj}){
			const multiInput = this.byId('idFOCMultiInput');
			
			const offerProduct = priceObj.ProductCode;
			const foc = multiInput.getBinding('tokens')?.getContexts()?.map(ctx => ctx.getObject()) || [];

			const containsOfferProduct = hasObjectWithProductCode(foc, offerProduct); 
			const containsOfferProductAndIsAdded = hasObjectWithProductCodeAndIsAdded(foc, offerProduct); 
			const containsOfferProductAndIsIncluded = hasObjectWithProductCodeAndIsIncluded(foc, offerProduct); 

			deductions = (deductions !== undefined && deductions !== null && deductions !== "") ? deductions : priceObj.Deductions;
			level2Discount2 = (level2Discount2 !== undefined && level2Discount2 !== null && level2Discount2 !== "") ? level2Discount2 : priceObj.Level2Discount2;
			branchVolume = instituteInBranch ? ((branchVolume !== undefined && branchVolume !== null && branchVolume !== "") ? branchVolume : priceObj.AnticipatedYearlyVolumeBranch) : mainCustomerVolume;
			invoicePrice = (invoicePrice !== undefined && invoicePrice !== null && invoicePrice !== "") ? invoicePrice : priceObj.OfferPrice;

			let paidVolume = 0;
			let totalVolume = 0;
			let focVolume = 0;
			
			//Cases 1,2 and 3
			if(foc.length === 0 || !containsOfferProduct) return (invoicePrice * (1 - deductions - level2Discount2));

			// Cases 2
			if(containsOfferProductAndIsIncluded || containsOfferProductAndIsAdded) {
				const FOC = getFOCWitSameProductCode(foc, offerProduct);
				switch(FOC.FreeGoodsOther_ABS_PCT){
					case "ABS":
						focVolume = Number(FOC.FreeGoodsOther);
						break;
					case "PCT":
						focVolume = FOC.FreeGoodsOther * branchVolume;
						break;
					case "STP":
						focVolume = (branchVolume / FOC.FreeGoodsOther_Step) * FOC.FreeGoodsOther;
						break;
					default:
						break;
				}
			}

			if(containsOfferProductAndIsAdded){
				paidVolume = branchVolume;
				totalVolume = branchVolume + focVolume;
			}

			if(containsOfferProductAndIsIncluded){
				paidVolume = branchVolume - focVolume;
				totalVolume = branchVolume;
			}

			let revenues = invoicePrice * (1 - deductions - level2Discount2) * paidVolume;

			let netOfferPrice = revenues / totalVolume;

			function hasObjectWithProductCode(arr, offerProduct) {
				return arr.some(obj => obj.ProductPackId === offerProduct);
			}

			function hasObjectWithProductCodeAndIsAdded(arr, offerProduct) {
				return arr.some(obj => obj.ProductPackId === offerProduct && obj.ADD_INCLUDE === 'Added');
			}

			function hasObjectWithProductCodeAndIsIncluded(arr, offerProduct) {
				return arr.some(obj => obj.ProductPackId === offerProduct && obj.ADD_INCLUDE === 'Included');
			}

			function getFOCWitSameProductCode(arr, offerProduct) {
				return arr.find(obj => obj.ProductPackId === offerProduct);
			}

			return netOfferPrice;
		},

		validatePriceWithFOCForm: function(context, { offerPrice, basePrice }){
			const priceObj = context.getObject();

			// Error messages
			const target = `${context.getPath()}/OfferPrice`;
			const allErrorMessages = this.getMessages(["PriceConditionPriceWithFOCView","PriceConditionDiscountView","PriceConditionPriceView","PriceConditionDiscountWithFOCView"]);
			const errorMessage = allErrorMessages.find(msg => msg.getTargets().includes(target)); 

			// Rules
			const isOfferPriceHigher = Number(offerPrice) > Number(basePrice);
			if(isOfferPriceHigher && !errorMessage){
				this.oMessageManager.addMessages(new Message({
					message: "Offer Price should not be greater than Base Price.",
					type: MessageType.Error,
					target: target,
					processor: this.getView().getModel()
				}));
				this.setMessageSection(["PriceConditionPriceWithFOCView","PriceConditionDiscountView","PriceConditionPriceView", "PriceConditionDiscountWithFOCView"], "priceCondPrice");
			}else if(!isOfferPriceHigher && errorMessage){
				this.oMessageManager.removeMessages(errorMessage);
				this.removeMessages(errorMessage, "priceCondPrice");
			}
		},


		/**
		 * Load the price condition fragment based on the selected price condition type.
		 *
		 * @returns {Promise<object>} A promise that resolves with the loaded price condition form.
		 */
		loadPriceCondition: async function(){
			const selectedTender = await this.stState.getService().getTender(this.sObjectId);
			const selectedPriceConditonType = this.getModel('st').getProperty("/SelectedPriceConditionType");
			return this.loadPriceConditionFragment(selectedPriceConditonType, {
				offerID: this.sOfferId, 
				productID:this.productId,
				tenderID: this.sObjectId,
				instituteID: selectedTender?.InstituteID
			});
		},

		/**
		 * Loads the price condition fragment based on the specified condition type and context data.
		 *
		 * @param {string} conditionType - The type of the price condition fragment to load.
		 * @param {object} contextData - The context data to pass to the price condition fragment.
		 * @returns {Promise<object>} A promise that resolves with the loaded price condition form.
		 */
		loadPriceConditionFragment: function(conditionType, contextData){
			if (this.sCountryCode === "TW" && conditionType === 'TaiwanContractPrice') {
				conditionType = "TaiwanPrice";
			}
			const vbox = this.byId("idPriceConditionVbox");
			vbox.destroyItems();
			return Fragment.load({
				id: this.getView().getId(),
				name: `com.bayer.tender.statenderapp.view.offer.fragments.PriceCondition${conditionType}`,
				controller: this
			}).then(function (form) {
				// if (this.sCountryCode === "TW") {
				// 	this.bindCurrentSectionFields(form, contextData);
				// }
				this.onPriceConditionLoadSuccess(conditionType, form, contextData);
				vbox.addItem(form);
				return form;
			}.bind(this));
		},

		bindCurrentSectionFields: function(form, {offerID,productID,tenderID,instituteID}){
			let entityName = "/PriceConditionCurrentSectionTaiwanView";
			const path = this.getModel().createKey(entityName, {
				"ProductCode": productID,
				"INSTITUTE_ID": instituteID	
			});     
	
			form.getAggregation("items")[1].getAggregation("formContainers")[0].getAggregation("formElements").forEach(formElement => {
				const field = formElement.getAggregation("fields")[0];
				field.bindElement({
					path: path,
					groupId: "PricingForm"
				});
			});
		},

		onPriceConditionLoadSuccess: function(conditionType, form, contextData){
			this.bindPricingForm(conditionType, form, contextData);
		},

		bindPricingForm(conditionType, form, {offerID, productID, tenderID}){
			let entityName = `/PriceCondition${conditionType}View`
			const path = this.getModel().createKey(entityName, {
				"OfferID": offerID,
				"TenderID": tenderID,
				"ProductCode": productID,
				"ConditionType": this.sCountryCode === "TW" && conditionType === 'TaiwanPrice' ? "TaiwanContractPrice" : conditionType
			});

			if (this.sCountryCode === "TW") {
				form.getAggregation("items").forEach(item => {
					item.bindElement({
						path: path,
						groupId: "PricingForm",
						events: {
							dataReceived: this.onPricingFormDataReceived.bind(this)
						}
					});
				})
			}else {
				form.bindElement({
					path: path,
					groupId: "PricingForm",
					events: {
						dataReceived: this.onPricingFormDataReceived.bind(this)
					}
				});
			}
		},

		/**
		 * Handles the event when pricing form data is received.
		 *
		 * @param {object} event - The event object containing the pricing form data.
		 * @returns {void}
		 */
		onPricingFormDataReceived: function(event){
			const priceCondition = event.getParameter('data');
			this.setMainPriceCondition(priceCondition);
			this.bindFOCMultiInputTokens(priceCondition);
		},


		bindFOCMultiInputTokens: function(priceCondition){	
			const multiInput = this.byId("idFOCMultiInput");	
			multiInput.removeAllTokens();	
			if(!priceCondition?.hasPriceCondition) return;
			multiInput.bindAggregation("tokens", {
				path: "/FreeGoodsOther",
				groupId: "PricingForm",
				filters: [
					new Filter("PriceCondition_ID",FilterOperator.EQ, priceCondition.PriceConditionID)
				],
				template: new Token({
					key: "{ProductPackId}",
					text: "{ProductPackName}",
					editable: false
				})

			});
		},


		/**
		 * Event handler for changes in the price condition.
		 *
		 * @param {Event} event - The event object representing the change.
		 * @returns {void}
		 */
		onPriceConditionChange: function(event){
			// Cancels any pending changes for specified entity type.
			// this is needed to make sure we delete old/not saved changes when changing the ConditionType
			// Tip: when you add a new condition type make sure to add it here as well
			this.byId("idFOCMultiInput").unbindAggregation("tokens")
			this.cancelPendingChanges(
				[
					"idOfferPrice", 
					"PriceConditionPriceView",
					"PriceConditionDiscountView",
					"PriceConditionDiscountWithFOCView",
					"PriceConditionPriceWithFOCView",
					"PriceConditionTaiwanPriceView",
					"PriceConditionTaiwanDiscountView",
					"PriceConditionNLPriceView",
					"PriceConditionNLDiscountView",
					"PriceConditionSpecialPriceView",
					"PriceConditionWithMaximumPriceView"
				], 
				"priceCondPrice"
			);
			this.loadPriceCondition().then(this.onLoadPriceConditionSuccess.bind(this));
		},

		onLoadPriceConditionSuccess: function(form){
			const priceCondition = form.getElementBinding()?.getBoundContext()?.getObject();
			this.setMainPriceCondition(priceCondition);
			this.bindFOCMultiInputTokens(priceCondition);
		},

		setMainPriceCondition: function(priceCondition){
			this.setHasMainPriceCondition(priceCondition?.hasPriceCondition);
			this.setMainPriceConditionID(priceCondition?.PriceConditionID);
		},

		/**
		 * Sets the value of the "hasMainPriceCondition" property in the "ui" model.
		 *
		 * @param {boolean} [hasPriceCondition=false] - The new value for the "hasMainPriceCondition" property.
		 * Defaults to `false` if not provided.
		 * @returns {boolean}
		 */
		setHasMainPriceCondition: function(hasPriceCondition = false){
			this.getModel("ui").setProperty("/FocForm/hasMainPriceCondition", hasPriceCondition);
			return hasPriceCondition;
		},

		setMainPriceConditionID: function(id){
			this.getModel("ui").setProperty("/PricingForm/mainPriceConditionID", id);
			return id;
		},

		setUOM: function(uom){
			this.getModel("ui").setProperty("/FocForm/UOM", uom);
			return uom;
		},

		getMainPriceConditionID: function(){
			return this.getModel("ui").getProperty("/PricingForm/mainPriceConditionID");
		},

		/**
		 * FocForm event handlers
		 */
		onButtonFocFormEditPress: function(event){
			this.getModel("ui").setProperty('/FocForm/editMode', true);
			this.getModel("ui").setProperty('/PricingForm/editMode', false);
		},	

		
		onButtonFocFormAcceptPress: function(event){
			this.getModel("ui").setProperty('/FocForm/editMode', false);
		},

		_onSubmitChangesFocFormSuccess: function(res){
			// const hasErrorMessages =  this.getMessages(["idOfferPrice", "PriceConditionPriceView","PriceConditionDiscountView"]).length > 0;
			// this.setMessageSection(["idOfferPrice", "PriceConditionPriceView","PriceConditionDiscountView"], "priceCondPrice");
			// this.invalidateEntityType([
			// 	"PriceConditionPriceView",
			// 	"PriceConditionDiscountView"
			// ]);
			// !hasErrorMessages && this.getModel("ui").setProperty(`/FocForm/editMode`, false);
		},

		onMultiInputProductsValueHelpRequest:  function(event){
			const focMultiInput = event.getSource();
			this.getPriceConditionFocDialog().then(this.onPriceConditionFocDialogLoaded.bind(this,focMultiInput));
		},

		/**
		 * Called when the price condition FOC dialog is loaded.
		 * This method is resuing the binding template from the view.
		 * More info see: https://answers.sap.com/questions/11405563/getting-the-item-template-of-a-mtable.html
		 * 
		 * @param {sap.m.MultiInput} multiInput - The multi-input control.
		 * @param {sap.m.Dialog} dialog - The dialog control.
		 * @returns {void}
		 */
		onPriceConditionFocDialogLoaded: function(multiInput, dialog){
			const tokenBindingInfo = multiInput.getBindingInfo("tokens");
			const freeGoodsOtherTable = this.byId("idFreeGoodsOtherTable");
			// const itemsBindingInfo = freeGoodsOtherTable.getBindingInfo("items");
			const itemsBinding = freeGoodsOtherTable.getBinding("items");
			itemsBinding.filter(tokenBindingInfo.filters);

			// Unbind and rebind items
			// freeGoodsOtherTable.unbindItems();
			// freeGoodsOtherTable.bindItems({
			// 	path : itemsBindingInfo.path,
			// 	template : itemsBindingInfo.template,
			// 	filters : tokenBindingInfo.filters,
			// 	groupId: "PricingForm"
			// });
			dialog.open();
		},


		/**
		 * Retrieves the price condition FOC dialog.
		 *
		 * @returns {Promise} A promise that resolves to the FOC dialog.
		 */
		getPriceConditionFocDialog: function(){
			const view = this.getView();
			if (!this.dialogFocProducts) {
				this.dialogFocProducts = Fragment.load({
					id: view.getId(),
					name: "com.bayer.tender.statenderapp.view.offer.fragments.PriceConditionFOC_OtherProducts",
					controller: this
				}).then(function (dialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					view.addDependent(dialog);
					return dialog;
				});
			}
			return this.dialogFocProducts;	
		},

		onButtonApplyFocOtherProductsPress: async function(event){	
			const dialog = await this.getPriceConditionFocDialog();
			const hasErrorMessages =  this.getMessages(["FreeGoodsOther"]).length > 0;
			this.setMessageSection(["FreeGoodsOther"], "priceCondPrice");
			this.defaultModel.submitChanges({
				// error: this._onSubmitChangesFail.bind(this),
				success: this.onSubmitFocChangesSuccess.bind(this),
				groupId: "PricingForm"
			}); 

			if(!hasErrorMessages){
				dialog.close(); 
			}
		},

		onSubmitFocChangesSuccess: function(res){
			// refresh the focMultiInput tokens
			const focMultiInput = this.byId("idFOCMultiInput");
			focMultiInput.getBinding("tokens").refresh();

			// refresh priceWithFOCForm to get the newly calculated values
			const pricingForm = this.byId("idPricingForm");
			pricingForm.getElementBinding().refresh(true);

			const pricingFormBinding = pricingForm.getElementBinding();
            pricingFormBinding.attachDataReceived(this.onPricingFormDataReceivedAfterFOCSet, this);
		},

		onPricingFormDataReceivedAfterFOCSet: async function(evt){
			const countryCode = evt.getParameter("data")?.CountryCode || this.sCountryCode;
            const netPrice = countryCode == 'TW' ? evt.getParameter("data").Price3 : evt.getParameter("data").NetPrice;
			const netOfferPrice = countryCode == 'TW' ? evt.getParameter("data").NetPrice : evt.getParameter("data").NetOfferPrice;
            const path =this.getModel().createKey("/PT_TMBDPR", {
				OfferID: this.sOfferId,
				ProductCode: this.productId,
				Active: 1,
				ActiveTier: 0,
				LotID: 1
            });
            let context = this.getModel().getContext(path);
			if(!context.getObject()){
				await this.getProductPrice(this.sOfferId, this.productId);	
				context = this.getModel().getContext(path);
			}
            this.getModel().setProperty("NetPrice", netPrice, context);
			this.getModel().setProperty("NetofferPrice", netOfferPrice, context);

			this.getModel().submitChanges();

			this._refreshOfferProductTable();
			this.getOwnerComponent().getEventBus().publish("MasterTableUpdateChannel", "MasterTableUpdateEvent");
			// we need to detach the data received event otherwise we will get into a loop
			if (evt.getSource()) {
				evt.getSource().detachDataReceived(this.onPricingFormDataReceivedAfterFOCSet, this);
			}
        },

		getProductPrice: async function (offerId, productCode) {
			const path = this.defaultModel.createKey("/PT_TMBDPR", {
				OfferID: offerId,
				ProductCode: productCode,
				Active: 1,
				ActiveTier: 0,
				LotID: 1
            }); 
			return new Promise((resolve, reject) => {
				this.getModel().read(path, {
					success: function (res) {
						resolve(res)
					},
					error: function (err) {
						reject(err)
					}
				});
			});
		},

		onButtonCancelFocOtherProductsPress: async function(event){
			const multiInput = this.byId("idFOCMultiInput");
			const dialog = await this.getPriceConditionFocDialog();
			if(this.defaultModel.hasPendingChanges()){
				this.defaultModel.resetChanges(null, false, true);
			}
			multiInput.getBinding("tokens").refresh()
			dialog.close(); 
		},

		onButtonAddFocOtherProductsPress: function(event){
			const productPackName = event.getSource().getBindingContext().getProperty("PRODUCTPACKNAME");
			const table = this.byId("idFreeGoodsOtherTable");
			const context = this.defaultModel.createEntry("/FreeGoodsOther", {
				groupId: "PricingForm"
			});
			context.getModel().setProperty("ProductPackName", productPackName, context);
			context.getModel().setProperty("ProductPackId", this.productId, context);
			context.getModel().setProperty("PriceCondition_ID", this.getMainPriceConditionID(), context);
			context.getModel().setProperty("FreeGoodsOther_ABS_PCT", "STP", context);
			context.getModel().setProperty("ADD_INCLUDE", "Included", context);
			const newItem = table.getBindingInfo("items").template.clone();
			newItem.setBindingContext(context)
			table.insertItem(newItem);
		},



		onButtonDeleteOtherProductPress: function(event){
			const selectedItem = event.getSource().getParent();
			const context = selectedItem.getBindingContext();
			if(context.isTransient()){
				this.defaultModel.resetChanges([context.getPath()], undefined, true);
			}else{
				this.defaultModel.remove(context.getPath());
			}
		},

		onProductNameInputValueHelpRequest: function(event){
			const view = this.getView();
			const controller = this;
			const context = event.getSource().getBindingContext();
			// create value help dialog
			if (!this.dialogSelectBrandProducts) {
				this.dialogSelectBrandProducts = sap.ui.core.Fragment.load({
					id: view.getId(),
					name: "com.bayer.tender.statenderapp.view.offer.fragments.PriceConditionFOC_OtherProductsSelectBrandProducts",
					controller: this
				}).then(function (valueHelpDialog) {
					view.addDependent(valueHelpDialog);
					return valueHelpDialog;
				});
			}

			// open value help dialog
			this.dialogSelectBrandProducts.then(function (valueHelpDialog) {
				controller.filterSelectProductBrands(valueHelpDialog);
				valueHelpDialog.setBindingContext(context);
				valueHelpDialog.open();
			});
		},

		filterSelectProductBrands: async function (valueHelpDialog) {
			const binding = valueHelpDialog.getBinding("items");
			const offerFormViewPath = this.defaultModel.createKey("/OfferFormView", {OfferID: this.offerId});
			let offerFormViewObject = this.defaultModel.getProperty(offerFormViewPath);
			if(!offerFormViewObject){
				offerFormViewObject	= await this.getOfferFormView(this.offerId);
			}
			const orFilters = [
				new Filter("COUNTRY_CODE",FilterOperator.EQ, this.sCountryCode),
				new Filter("INSTITUTE_ID",FilterOperator.EQ, offerFormViewObject.InstituteID),
				new Filter("DISTRIBUTOR_ID",FilterOperator.EQ, offerFormViewObject.DistributorID),
				new Filter("CHANNEL",FilterOperator.EQ, 'Direct')	
			]
			offerFormViewObject.Division !== 'All' && orFilters.push(new Filter("DIVISION",FilterOperator.EQ, offerFormViewObject.Division)),
			binding.filter(orFilters);
		},

		getOfferFormView: async function (offerId) {
			const path = this.defaultModel.createKey("/OfferFormView", {OfferID: offerId}); 
			return new Promise((resolve, reject) => {
				this.getModel().read(path, {
					success: function (res) {
						resolve(res)
					},
					error: function (err) {
						reject(err)
					}
				});
			});
		},

		/**
		 * Retrieves the count of Price Condition Classifications based on the specified country code.
		 *
		 * @param {string} countryCode - The country code to filter the Price Condition Classifications.
		 * @returns {Promise<number>} A Promise that resolves to the count of Price Condition Classifications.
		 * @throws {Error} If an error occurs during the retrieval process.
		 */
		getFocPriceConditionClassificationCount: async function (countryCode) {
			const path = "/PriceConditionClassification/$count"; 
			return new Promise((resolve, reject) => {
				this.defaultModel.read(path, {
					filters: [
						new Filter("CountryCode",FilterOperator.EQ, countryCode),
						new Filter("ConditionType",FilterOperator.EQ, 'FOC')	
					],
					success: function (res) {
						resolve(res)
					},
					error: function (err) {
						reject(err)
					}
				});
			});
		},
		
		/**
		 * Sets the "hasFocPriceCondition" property in the UI model based on the count of FOC Price Condition Classifications.
		 * 
		 * @returns {Promise<boolean>} A Promise that resolves to a boolean indicating whether there are FOC Price Condition Classifications.
		 * @throws {Error} If an error occurs during the retrieval process.
		 */
		setHasFocPriceConditionClassification: async function(){
			const focPriceConditionClassificationCount = await this.getFocPriceConditionClassificationCount(this.sCountryCode);
			const hasFocPriceCondition = Number(focPriceConditionClassificationCount) > 0;
			this.getModel("ui").setProperty("/FocForm/hasFocPriceCondition", hasFocPriceCondition);
			return hasFocPriceCondition;
		},

		handleProductBrandsValueHelpSearch: async function(event) {
			const sValue = event.getParameter("value");
			const binding = event.getSource().getBinding("items");
			await this.stState.getService().getOffer(this.sOfferId);
			const andFilters = binding.getFilters("Control").splice(0,5);
			const orFilters = [];
			orFilters.push(new Filter("PRODUCT_NAME", sap.ui.model.FilterOperator.Contains, sValue));
			orFilters.push(new Filter("SKUS", sap.ui.model.FilterOperator.Contains, sValue));
			andFilters.push(new Filter(orFilters, false));
			binding.filter(andFilters);
		},

		handleProductBrandsValueHelpConfirm: function (event) {
			const context = event.getSource().getBindingContext();
			const selectedItem = event.getParameter("selectedItem");
			const productPackId = selectedItem.getBindingContext().getProperty("PRODUCT_ID");
			const productPackName = selectedItem.getBindingContext().getProperty("PRODUCT_NAME");
			context.getModel().setProperty("ProductPackId", productPackId, context);	
			context.getModel().setProperty("ProductPackName", productPackName, context);	
		},

		onHistoryFilterCheck: function (event) {
			const offerHistoryTable = this.byId("idOfferHistoryTable");
			const tenderPath = this.getModel().createKey("/TenderMasterView", {
				TenderID: this.objectId,
				OfferID: this.offerId
			});
			const tender = this.getModel().getObject(tenderPath);
			offerHistoryTable.getBinding("items").aApplicationFilters = [];
			const filters = this.getOfferHistoryFilters(tender, this.offerId, this.sCountryCode, this.productId);
			offerHistoryTable.getBinding("items").filter(filters);
		},

		getInstituteView: function(instituteId, countryCode){
			const path = "/InstitutesView"; 
			return new Promise((resolve, reject) => {
				this.defaultModel.read(path, {
					filters: [
						new Filter("CountryCode",FilterOperator.EQ, countryCode),
						new Filter("InstituteID",FilterOperator.EQ, instituteId)	
					],
					success: function (res) {
						resolve(res.results[0])
					},
					error: function (err) {
						reject(err)
					}
				});
			});
		},
			
		setHasOfferProductDetailsSaved: async function(){
			const selectedOfferProduct = await this.getProductDetails(this.sOfferId, this.productId);
			const isRequestedVolumeSet = !selectedOfferProduct || selectedOfferProduct.RequestedVolume === 0 || selectedOfferProduct.RequestedVolume === null ? false : true;
			this.getModel("ui").setProperty(`/PricingForm/hasOfferProductDetailsSaved`, isRequestedVolumeSet);
			return isRequestedVolumeSet;
		},

		getProductDetails: async function (offerId, productCode) {
			const path = "/PT_TMOFPR"; 
			return new Promise((resolve, reject) => {
				this.defaultModel.read(path, {
					filters: [
						new Filter("OfferID",FilterOperator.EQ, offerId),
						new Filter("ProductCode",FilterOperator.EQ, productCode),
						new Filter("Active",FilterOperator.EQ, 1),
						new Filter("LotID",FilterOperator.EQ, 1)
					],
					success: function (res) {
						resolve(res.results[0])
					},
					error: function (err) {
						reject(err)
					}
				});
			});
		},

		getTaiwanInstituteInBranch: async function(instituteId, parentInstituteId, countryCode){
			return new Promise((resolve, reject) => {
				this.getModel().read("/InstituteInBranchView", {
					filters: [
						new Filter("ParentInstituteID", "EQ", parentInstituteId),
						new Filter("InstituteID", "NE", instituteId)
					],
					success: function (res) {
						resolve(res)
					}
				});
			}).then(data => {
				this.getModel("ui").setProperty("/PricingForm/instituteInBranch", data.results.length > 0);
			})
		},

		onNetherLandsPricingFormCancelBtnPress: function(event){
			this.getModel("ui").setProperty('/PricingForm/editMode', false);
			this.cancelPendingChanges(["idOfferPrice", "PriceConditionNLPriceView", "PriceConditionNLDiscountView"], "priceCondPrice");

			// reload saved condition type
			this.getSavedPriceConditionType().then((priceConditionType) => {
				this.getModel("st").setProperty("/SelectedPriceConditionType", priceConditionType);
				this.loadPriceCondition();
			});
		},

		onNetherlandsPricingFormSaveBtnPress: function(event){
			/** If the input field with live change has type 'com.bayer.tender.statenderapp.model.datatypes.CustomCurrencyType' 
			 * when user only edits the single digit of the existing value, the model submit changes not capturing this value
			 * thus below is the temporary solution until we find a permanent fix
			*/
			const form = this.byId(`idPricingForm`);
			let value = this.byId("idOfferPrice")?.getProperty("value");
			// this.defaultModel.setProperty(form?.getBindingContext()?.getPath() + "/OfferPrice", Number(value.replace(/[^\d.]/g, '')));
			this.defaultModel.submitChanges({
				error: this._onSubmitChangesFail.bind(this),
				success: this._onSubmitChangesNetherlandsPriceSuccess.bind(this),
				groupId: "PricingForm"
			}); 
		},

		_onSubmitChangesNetherlandsPriceSuccess: function(event){
			const hasErrorMessages =  this.getMessages(["PriceConditionNLPriceView", "PriceConditionNLDiscountView"]).length > 0;
			this.setMessageSection(["PriceConditionNLPriceView", "PriceConditionNLDiscountView"], "priceCondPrice");
			this.invalidateEntityType([
				"PriceConditionNLPriceView", 
				"PriceConditionNLDiscountView"
			]);
			if(!hasErrorMessages){
				this.getModel("ui").setProperty(`/PricingForm/editMode`, false);
				this.cancelPendingChanges(["idOfferPrice", "PriceConditionNLPriceView", "PriceConditionNLDiscountView"], "priceCondPrice");
			} 
			this._refreshOfferProductTable();
			this.refreshPricingForm();
			this.getOwnerComponent().getEventBus().publish("MasterTableUpdateChannel", "MasterTableUpdateEvent");
		},

		onPolandPricingFormSaveBtnPress: function (event) {
			/** If the input field with live change has type 'com.bayer.tender.statenderapp.model.datatypes.CustomCurrencyType' 
			 * when user only edits the single digit of the existing value, the model submit changes not capturing this value
			 * thus below is the temporary solution until we find a permanent fix
			*/
			const form = this.byId(`idPricingForm`);
			let value = this.byId("idOfferPrice")?.getProperty("value");
			// this.defaultModel.setProperty(form?.getBindingContext()?.getPath() + "/OfferPrice", Number(value.replace(/[^\d.]/g, '')));
			this.defaultModel.submitChanges({
				error: this._onSubmitChangesFail.bind(this),
				success: this._onSubmitChangesPolandPriceSuccess.bind(this),
				groupId: "PricingForm"
			}); 
		},

		_onSubmitChangesPolandPriceSuccess: function () {
			const hasErrorMessages =  this.getMessages(["PriceConditionSpecialPriceView", "PriceConditionWithMaximumPriceView"]).length > 0;
			this.setMessageSection(["PriceConditionSpecialPriceView", "PriceConditionWithMaximumPriceView"], "priceCondPrice");
			this.invalidateEntityType([
				"PriceConditionSpecialPriceView", 
				"PriceConditionWithMaximumPriceView"
			]);
			if(!hasErrorMessages){
				this.getModel("ui").setProperty(`/PricingForm/editMode`, false);
				this.cancelPendingChanges(["idOfferPrice", "PriceConditionSpecialPriceView", "PriceConditionWithMaximumPriceView"], "priceCondPrice");
				this.getOwnerComponent().getEventBus().publish("OfferFormViewChannel", "updateOfferForm");
			} 
			this._refreshOfferProductTable();
			this.refreshPricingForm();
			this.getOwnerComponent().getEventBus().publish("MasterTableUpdateChannel", "MasterTableUpdateEvent");
		},

		onPolandPricingFormCancelBtnPress: function () {
			this.getModel("ui").setProperty('/PricingForm/editMode', false);
			this.cancelPendingChanges(["idOfferPrice", "PriceConditionSpecialPriceView", "PriceConditionWithMaximumPriceView"], "priceCondPrice");

			// reload saved condition type
			this.getSavedPriceConditionType().then((priceConditionType) => {
				this.getModel("st").setProperty("/SelectedPriceConditionType", priceConditionType);
				this.loadPriceCondition();
			});
		},

		calculateNetherlandsDiscountConditionType: function ({property, value, context}) {
			const priceObj = context.getObject();
			const objPath = context.getPath();
			if(!property) return;
			const pathIndex = property.split('/')[1];
			const nlPrice = priceObj.NLPriceConditionType[pathIndex];
			const contractDuration = this.getModel().getProperty(`${objPath}/NLPriceConditionType/${pathIndex}/ContractDuration`);
			let discount = property?.toLowerCase().includes("discount") ? value : nlPrice.Discount;
			let deductions = property?.toLowerCase().includes("deductions") ? value : priceObj.Deductions;
			let offerPrice = Number((parseFloat(priceObj.masterPriceAIP) * (1 - discount)).toFixed(2));
			let netPrice = offerPrice * (1 - deductions);
			netPrice = this.formatter.truncToTwoDecimalPlaces(netPrice);
			const NLPriceConditionType = priceObj.NLPriceConditionType;
			NLPriceConditionType[pathIndex].OfferPrice = offerPrice;
			NLPriceConditionType[pathIndex].NetPrice = netPrice;
			NLPriceConditionType[pathIndex].ContractDuration = contractDuration;
			context.getModel().setProperty(`NLPriceConditionType`, NLPriceConditionType, context);
		},

		calculateNetherlandsPriceConditionType: function ({property, value, context}) {
			const priceObj = context.getObject();
			const objPath = context.getPath();
			if(!property) return;
			const pathIndex = property.split('/')[1];
			const contractDuration = this.getModel().getProperty(`${objPath}/NLPriceConditionType/${pathIndex}/ContractDuration`);
			let offerPrice = property?.toLowerCase().includes("offerprice") ? parseFloat(value).toFixed(2) : Number(this.byId("idOfferPrice").getValue().replace(/[^\d.]/g, ''));
			let deductions = property?.toLowerCase().includes("deductions") ? value : priceObj.Deductions;
			let discount = (parseFloat(priceObj.masterPriceAIP) - parseFloat(offerPrice)) / priceObj.masterPriceAIP;
			discount = this.formatter.truncToFourDecimalPlaces(discount);
			let netPrice = offerPrice * (1 - deductions);
			netPrice = this.formatter.truncToTwoDecimalPlaces(netPrice);
			const NLPriceConditionType = priceObj.NLPriceConditionType;
			NLPriceConditionType[pathIndex].Discount = discount;
			NLPriceConditionType[pathIndex].NetPrice = netPrice;
			NLPriceConditionType[pathIndex].ContractDuration = contractDuration;
			context.getModel().setProperty(`NLPriceConditionType`, NLPriceConditionType, context);
		},

		calculatePolandSpecialPriceConditionType: function ({property, value, context}) {
			const priceObj = context.getObject();
			const objPath = context.getPath();
			if(!property) return;
			const pathIndex = property.split('/')[1];
			let specialPrice = property?.toLowerCase().includes("specialprice") ? parseFloat(value).toFixed(2) : Number(priceObj.SpecialPrice);
			let cogs = priceObj.COGS;
			let margin = !!parseFloat(specialPrice) ? (specialPrice - cogs) / specialPrice : 0;
			
			context.getModel().setProperty('Margin', margin, context);
		},

		calculatePolandWithMaximumPriceConditionType: function ({property, value, context}) {
			const priceObj = context.getObject();
			const objPath = context.getPath();
			if(!property) return;
			const pathIndex = property.split('/')[1];
			let maximumPrice = property?.toLowerCase().includes("price1") ? parseFloat(value).toFixed(2) : Number(priceObj.Price1);
			let maximumWholesalerMargin = property?.toLowerCase().includes("level2discount1") ? parseFloat(value) : priceObj.Level2Discount1;
			let cogs = priceObj.COGS;
			let specialPrice = parseFloat(maximumPrice / (1 + maximumWholesalerMargin));
			let margin = !!specialPrice ? (specialPrice - cogs) / specialPrice : 0;
			
			context.getModel().setProperty('SpecialPrice', specialPrice, context);
			context.getModel().setProperty('Margin', margin, context);
		},
		handleUpdatePriceConditionForm: function () {
			let oContext = this.byId('idPricingForm').getBindingContext();
			let sPath = oContext.getPath();
			let oModel = this.getModel();
				oModel.read(sPath);
		}
    });
});