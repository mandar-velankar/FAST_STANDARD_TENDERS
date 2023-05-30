sap.ui.define([
	"../BaseController",
	"sap/ui/model/json/JSONModel",
	"../../model/formatter",
	"sap/m/library",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
], function (BaseController, JSONModel, formatter, mobileLibrary, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("com.bayer.tender.statenderapp.controller.OfferProducts.OfferProductsDetail", {
		onInit: function () {

			this.oOwnerComponent = this.getOwnerComponent();
			this.oRouter = this.oOwnerComponent.getRouter();
			this.oDynamicPage = this.byId("idProductForm");

			// // Model used to manipulate control states. The chosen values make sure,
			// // detail page is busy indication immediately so there is no break in
			// // between the busy indication for loading the view's meta data
			// var oViewModel = new JSONModel({
			// 	busy: false,
			// 	delay: 0,
			// 	lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
			// });

			this.getRouter().getRoute("offerProductDetail").attachPatternMatched(this._onObjectMatched, this);
			// this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

			// /*this.paState = this.getOwnerComponent().getState(this.getOwnerComponent().PA);
			// this.setModel(this.paState.getModel(), "pa");

			// this.oObjectPageLayout = this.byId("DetailPage");
			// this.paState.setDetailPage(this.oObjectPageLayout);

			// this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			// this.getRouter().getRoute("objectDetail").attachPatternMatched(this._onObjectMatched, this);*/

			// this.setModel(oViewModel, "detailView");

			// this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
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
			var oViewModel = this.getModel("detailDetailView");

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
				}
			});
	
			this.setModel(oModel, "ui");

			this._bindForm("ProductForm");
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
			if (this.objectId) {
				path = this.getOwnerComponent().getModel().createKey(`/${entity}`, {
					TenderID: this.sObjectId,
					OfferID: this.sOfferId,
					Active: '1',
					ProductCode: this.productId,
					LotID: '1'
				});
			} else {
				const newEntryContext = this.getOwnerComponent().getModel().createEntry(`/${entity}`, {});
				path = newEntryContext.getPath();
			}
			
			form.bindElement({
				path: path,
			});
		},
		_filterPriceCondition: function () {
			const oSelectedTender = this._getTender();
			const oPriceCondBinding = this.byId("idSelectedPriceContition").getBinding("items");
			const orFilters = [
				new Filter("CountryCode",FilterOperator.EQ, this.sCountryCode),
				new Filter("Division",FilterOperator.EQ, oSelectedTender.oOffer.Division),
				new Filter("Classification",FilterOperator.EQ, oSelectedTender.oTender.Classification),
			]
			oPriceCondBinding.filter(orFilters);
		},
		_getTender: function () {
			const sOfferKey = this.getModel().createKey("/OfferFormView", {
				OfferID: this.sOfferId
			});
			const sTenderKey = this.getModel().createKey("/TenderFormView", {
				TenderID: this.sObjectId
			});
			const oOffer = this.getModel().getObject(sOfferKey);
			const oTender = this.getModel().getObject(sTenderKey);
			return {oOffer, oTender};
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
			this.getModel("ui").setProperty('/ProductForm/editMode', false);

			//if(!this.validateOffer()) return; //error
			//this.defaultModel.submitChanges({groupId: "OfferformInfo"}); //no error - save
		},
		onOfferDetailFormCancelBtnPress: function(event){
			this.getModel("ui").setProperty('/ProductForm/editMode', false);
			this.defaultModel.resetChanges();
		},
    });
});