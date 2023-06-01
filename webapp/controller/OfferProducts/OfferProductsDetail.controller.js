sap.ui.define([
	"../BaseController",
	"sap/ui/model/json/JSONModel",
	"../../model/formatter",
	"sap/m/library",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/message/Message",
	"sap/ui/core/library"
], function (BaseController, JSONModel, formatter, mobileLibrary, Filter, FilterOperator, Message, library) {
	"use strict";

	var MessageType = library.MessageType;

	return BaseController.extend("com.bayer.tender.statenderapp.controller.OfferProducts.OfferProductsDetail", {
		onInit: function () {

			this.oOwnerComponent = this.getOwnerComponent();
			this.oRouter = this.oOwnerComponent.getRouter();
			this.oDynamicPage = this.byId("idProductForm");

			this.getRouter().getRoute("offerProductDetail").attachPatternMatched(this._onObjectMatched, this);

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

			// activate automatic message generation for complete view
			this.oMessageManager.registerObject(this.getView(), true);
			const oModel = this.getOwnerComponent().getModel();
			
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
			this.sObjectId = oEvent.getParameter("arguments").objectId;
			this.sOfferId = oEvent.getParameter("arguments").offerId;
			this.productId = oEvent.getParameter("arguments").productId;
			this.layout = oEvent.getParameter("arguments").layout;

			this.getModel("appView").setProperty("/layout", this.layout);
			this.templateState = this.getOwnerComponent().getModel("template");
			this.templateStateData = this.templateState.getData();


			const detaildetailConfig = await this.templateState.read("DETAIL-OFFERPRODUCTDETAIL", {
				countryCode: "BR" || this.sCountryCode ,// TODO: this is hardcoded country. We need to remove the hard coded value once we have more country config
				appID: "StandardTenders",
				page: "DETAIL-OFFERPRODUCTDETAIL",
				keys: {
					TenderID: this.sObjectId,
				},
			});

			this.onBeforeShow(this.sObjectId, this.sOfferId);

			this.getModel().metadataLoaded().then(function () {
				// var sObjectPath = this.getModel().createKey("PublicSalesOpportunities", {
				// 	ID: this.sObjectId
				// });
				// this._bindView("/" + sObjectPath);
				//this._bindForm("ProductForm");
				this._filterPriceCondition();	
			}.bind(this));
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function (sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel(sObjectPath);

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);
		},

		onBeforeShow:async function(sObjectId, sOfferId){
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
				ProductForm:{
					editMode: false
				},
				PricingForm:{
					editMode: false
				}
			});
	
			this.setModel(oModel, "ui");

			this._bindForm("ProductForm");
			this._bindText("ProductPackNameOfferProductDetail");
			this._filterPricingForm({offerID: this.sOfferId, productID:this.productId});
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
			});
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
						OfferID: this.sOfferId
					});
				}

				textField.bindElement({
					path: path,
					groupId: "ProductFormDetail"
				})
			}
		},

		_filterPriceCondition: async function () {
			const oSelectedTender = await this._getTender(this.sObjectId);
			const oSelectedOffer = await this._getOffer(this.sOfferId);
			const oPriceCondBinding = this.byId("idSelectedPriceContition").getBinding("items");
			const orFilters = [
				new Filter("CountryCode",FilterOperator.EQ, this.sCountryCode),
				new Filter("Division",FilterOperator.EQ, oSelectedOffer.Division),
				new Filter("Classification",FilterOperator.EQ, oSelectedTender.Classification)
			]
			oPriceCondBinding.filter(orFilters);
		},
		_getTender: async function (tenderID) {
			const sTenderKey = this.getModel().createKey("/TenderFormView", {
				TenderID: tenderID
			});
			let oTender = this.getModel().getObject(sTenderKey);
			if (!oTender) {
				return new Promise((resolve, reject) => {
					this.getModel().read("/TenderFormView", {
						filters: [
							new Filter("TenderID", "EQ", tenderID)
						],
						success: function (res) {
							resolve(res?.results[0])
						}
					});
				})
			}
			return oTender;
		},
		_getOffer: async function (offerID) {
			const sOfferKey = this.getModel().createKey("/OfferFormView", {
				OfferID: offerID
			});
			let oOffer = this.getModel().getObject(sOfferKey);
			if (!oOffer) {
				return new Promise((resolve, reject) => {
					this.getModel().read("/OfferFormView", {
						filters: [
							new Filter("OfferID", "EQ", offerID)
						],
						success: function (res) {
							resolve(res?.results[0])
						}
					});
				})
			}
			return oOffer;
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
				this.oRouter.navTo("object", {
					layout: oNextUIState.layout,
					countryCode: this.sCountryCode,
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

			// clear all messages
			this.oMessageManager.removeAllMessages();

			if(!this.validateProduct()) return;

			this.defaultModel.submitChanges({
				error: this._onSubmitChangesFail.bind(this),
				success: this._onSubmitChangesSuccess.bind(this, "ProductForm"),
				groupId: "ProductFormDetail"
			}); 

		},

		_onSubmitChangesFail: function(error){
			// not implemented
		},

		onOfferDetailFormCancelBtnPress: function(event){
			this.getModel("ui").setProperty('/ProductForm/editMode', false);
			this.defaultModel.resetChanges();
		},

		onPricingFormEditBtnPress: function(event){
			this.getModel("ui").setProperty('/PricingForm/editMode', true);
		},
		onPricingFormSaveBtnPress: function(event){

			// clear all messages
			this.oMessageManager.removeAllMessages();
			
			this.defaultModel.submitChanges({
				error: this._onSubmitChangesFail.bind(this),
				success: this._onSubmitChangesSuccess("PricingForm").bind(this),
				groupId: "PricingForm"
			}); 
		},

		onPricingFormCancelBtnPress: function(event){
			this.oMessageManager.removeAllMessages();
			this.getModel("ui").setProperty('/PricingForm/editMode', false);
			this.defaultModel.resetChanges();
		},

		_onSubmitChangesSuccess: function(form){
			const hasErrorMessages = this.getView().getModel('message').getData().length > 0;
			!hasErrorMessages && this.getModel("ui").setProperty(`/${form}/editMode`, false);
		},

		_filterPricingForm: function ({offerID, productID}) {
			const oPricingForm = this.byId("idPricingForm");
			const oPricingFormBinding = oPricingForm.getBinding("formContainers");
			const aFilters = [
				new Filter("OfferID",FilterOperator.EQ, offerID),
				new Filter("ProductCode",FilterOperator.EQ, productID),
			]
			oPricingFormBinding.filter(aFilters);
		},

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
    });
});