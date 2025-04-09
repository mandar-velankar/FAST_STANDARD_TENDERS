sap.ui.define([
	"../BaseController",
	"sap/ui/model/json/JSONModel",
	"../../model/formatter",
	"sap/m/library",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"../../service/StandardSingletonService",
	"sap/ui/model/Sorter",
	"sap/ui/core/BusyIndicator",
	"sap/m/MessageBox",
], function (BaseController, JSONModel, formatter, mobileLibrary, Filter, FilterOperator, StandardSingletonService, Sorter, BusyIndicator, MessageBox) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return BaseController.extend("com.bayer.tender.statenderapp.controller.AwardedProducts.AwardedProducts", {
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function () {

			this.oOwnerComponent = this.getOwnerComponent();
			this.oRouter = this.oOwnerComponent.getRouter();

			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
			});
			/*this.paState = this.getOwnerComponent().getState(this.getOwnerComponent().PA);
			this.setModel(this.paState.getModel(), "pa");

			this.oObjectPageLayout = this.byId("DetailPage");
			this.paState.setDetailPage(this.oObjectPageLayout);

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			this.getRouter().getRoute("objectDetail").attachPatternMatched(this._onObjectMatched, this);*/

			this.setModel(oViewModel, "detailView");
			
			this.getRouter().getRoute("objectDetailAwards").attachPatternMatched(this._onObjectMatched, this);
			// this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			this.getOwnerComponent().getEventBus().subscribe("AwardedProductTableUpdateChannel", "AwardedProductTableUpdateEvent", this.handleRefreshAwardedProductTable, this);
		},

		onBeforeShow: async function (iconTabfilter,{objectId, offerId, countryCode, productScope}) {
			this.stState = this.getOwnerComponent().getModel("st");
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
			this.productScope = productScope;
			this.selectedTab = iconTabfilter.getKey();

			const oModel = new JSONModel({
				busy: false,
				delay: 0,
				editMode: false,
				minDate: new Date(),
				enableApprovalButton: false
			});
			
			this.setModel(oModel, "ui");

			this.bindTable();
		},

		_onObjectMatched: async function (oEvent) {
			const selectedTender = this.getModel("st").getProperty("/SelectedTender");
			this.countryCode = oEvent.getParameter("arguments").countryCode;
			this.productScope = oEvent.getParameter("arguments").productScope;
			this.tenderId = oEvent.getParameter("arguments").objectId;
			this.offerId = oEvent.getParameter("arguments").offerId;
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			// this.getModel("appView").setProperty("/editable", false);
			this.templateState = this.getOwnerComponent().getModel("template");
			this.templateStateData = this.templateState.getData();
			this.bindTable();
		},

		bindTable: function () {
			const awarderProductsTable = this.byId("idAwardedProducts");
			const template = awarderProductsTable.getBindingInfo("items").template
			awarderProductsTable.bindItems({
				path: "/AwardedProducts",
				filters: [
					new Filter("OfferID", "EQ", this.offerId)
				],
				sorter: new Sorter({
					path: 'SORTER',
					descending: false
				}),
				template: template,
				events: {
					dataReceived: this.onAwardedProductsDataReceived.bind(this)
				}
			})
		},

		onAwardedProductsDataReceived: function (event) {
			const products = event?.getParameters("data")?.data?.results

			if (products && products.length > 0) {
				const allProductsHaveOutcome = products.every(product => product.Outcome);
				this.getModel("st").setProperty("/AllAwardProductsHaveOutcome", allProductsHaveOutcome);
			}
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		onAwardedProductPress: function(event){
			/*const objContext = oEvent.getParameter("listItem").getBindingContext("pa");
			const selectedObj = objContext?.getObject();

			var deliveryPath = objContext.getPath(),
			delivery = deliveryPath.split("/").slice(-1).pop();*/
			const selectedProductCode = event.getParameter("listItem")?.getBindingContext()?.getObject()?.ProductCode;
			const selectedProductOutcome = event.getParameter("listItem")?.getBindingContext()?.getObject()?.Outcome;

			StandardSingletonService.setOutcome(selectedProductOutcome);

			let oNextUIState = "";

			this.oOwnerComponent.getHelper().then(function (oHelper) {
				oNextUIState = oHelper.getNextUIState(2);
				this.oRouter.navTo("awardProductsDetail", {
					layout: oNextUIState.layout,
					objectId: this.tenderId,
					offerId: this.offerId,
					productId: selectedProductCode,
					productScope: this.productScope,
					countryCode: this.countryCode
				});
			}.bind(this));
		},

		handleRefreshAwardedProductTable: function () {
			this.byId('idAwardedProducts').getBinding('items').refresh();
		},

		onMenuSetAllProductWonLostItemSelected: async function(evt){
			BusyIndicator.show(1);
			try {
				const selectedItem = evt.getParameter("item");

				//Getting saved awarded products 
				const awardedProducts = await this.stState.getService().getAwardedProducts(this.offerId);
				
				//Updating existing awarded product's Outcome
				const promisses = awardedProducts.map(product => {
					const mappedAwardedProduct = {
						...product, 
						Outcome: selectedItem.getText()
					};

					return this.stState.getService().updateAwardedProduct(product.OfferID, product.ProductCode, mappedAwardedProduct);
				});
				//Sending request
				await Promise.all(promisses);

				//Refreshing Master tender and Awarded products table bindings
				this.getOwnerComponent().getEventBus().publish("AwardedProductTableUpdateChannel", "AwardedProductTableUpdateEvent");
				this.getOwnerComponent().getEventBus().publish("MasterTableUpdateChannel", "MasterTableUpdateEvent");
				BusyIndicator.hide();
			} catch (error) {
				MessageBox.error(error?.message || "Something went wrong");
				BusyIndicator.hide();
			}
		},
    });
});