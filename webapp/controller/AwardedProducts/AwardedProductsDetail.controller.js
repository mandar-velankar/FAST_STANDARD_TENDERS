sap.ui.define([
	"../BaseController",
	"sap/ui/model/json/JSONModel",
	"../../model/formatter",
	"sap/m/library"
], function (BaseController, JSONModel, formatter, mobileLibrary) {
	"use strict";

	return BaseController.extend("com.bayer.tender.statenderapp.controller.AwardedProducts.AwardedProductsDetail", {
		onInit: function () {

			this.oOwnerComponent = this.getOwnerComponent();
			this.oRouter = this.oOwnerComponent.getRouter();
			this.oDynamicPage = this.byId("idDynamicPage");

			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
			});

			this.getRouter().getRoute("awardProductsDetail").attachPatternMatched(this._onObjectMatched, this);
			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

			/*this.paState = this.getOwnerComponent().getState(this.getOwnerComponent().PA);
			this.setModel(this.paState.getModel(), "pa");

			this.oObjectPageLayout = this.byId("DetailPage");
			this.paState.setDetailPage(this.oObjectPageLayout);

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			this.getRouter().getRoute("objectDetail").attachPatternMatched(this._onObjectMatched, this);*/

			this.setModel(oViewModel, "detailDetailView");

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
		 _onObjectMatched: function (oEvent) {
			this.countryCode = oEvent.getParameter("arguments").countryCode;
			this.tenderId = oEvent.getParameter("arguments").objectId;
			this.offerId = oEvent.getParameter("arguments").offerId;
			this.productId = oEvent.getParameter("arguments").productId;
			this.layout = oEvent.getParameter("arguments").layout;

			this.getModel("appView").setProperty("/layout", this.layout);

			this.templateState = this.getOwnerComponent().getModel("template");
			this.templateStateData = this.templateState.getData();

			this.getAwardedProductsTemplateConfig();
			
			this.onBeforeShow(this.tenderId, this.offerId);
			this.getModel().metadataLoaded().then(function () {
				
			}.bind(this));

		},

		onBeforeShow:async function(tenderId, offerId){
			// get state data
			this.templateState = this.getOwnerComponent().getModel("template");
			this.templateStateData = this.templateState.getData();
			
			//this.getView().getBindingContext("template"); // get current tab data
			// await this.getOwnerComponent().getModel().metadataLoaded();
			this.tenderId = tenderId;
			this.offerId = offerId;
			//this.selectedTab = iconTabfilter.getKey();
			
			this.defaultModel = this.getOwnerComponent().getModel();

			const uiModel = new JSONModel({
				busy: false,
				delay: 0,
				editMode: false,
				minDate: new Date(),
				AwardedProductForm:{
					editMode: false
				},
				enableDeleteProductButton: false
			});
	
			this.setModel(uiModel, "ui");
			const awardedProductPath = this.getModel().createKey("/AwardedProductsDetailView", {
				OfferID: this.offerId,
				ProductCode: this.productId,
				LotID: "1"
			});
			this._bindView(awardedProductPath);
			
		},

		getAwardedProductsTemplateConfig: async function () {
			await this.templateState.read("DETAIL-AWARDEDRODUCTDETAIL", {
				countryCode: this.countryCode,
				appID: "StandardTenders",
				page: "DETAIL-AWARDEDRODUCTDETAIL",
				keys: {
					TenderID: this.tenderId,
				},
			});
		},
		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} awardedProductPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function (awardedProductPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailDetailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: awardedProductPath
			})

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

		onButtonAwardDetailFormEditPress: function(event){
			this.getModel("ui").setProperty('/AwardedProductForm/editMode', true);
		},

		onButtonAwardProductDetailFormSavePress: function(event){

		},
		
		onButtonAwardProductDetailFormCancelPress: function(event){
			this.getModel("ui").setProperty('/AwardedProductForm/editMode', false);
		},

		handleClose: function() {
			let oNextUIState = "";
			this.oOwnerComponent.getHelper().then(function (oHelper) {
				oNextUIState = oHelper.getNextUIState(1);
				this.oRouter.navTo("objectDetailAwards", {
					layout: oNextUIState.layout,
					objectId: this.tenderId,
					offerId: this.offerId,
					countryCode: this.countryCode
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
		}
    });
});