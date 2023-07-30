sap.ui.define([
	"../BaseController",
	"sap/ui/model/json/JSONModel",
	"../../model/formatter",
	"sap/m/library",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Context",
	"sap/ui/core/Fragment",
	"sap/ui/model/Sorter"
], function (BaseController, JSONModel, formatter, mobileLibrary, Filter, FilterOperator, Context, Fragment, Sorter) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return BaseController.extend("com.bayer.tender.statenderapp.controller.DeliveryTracking.DeliveryTrackingDetail", {
		onInit: function () {
            const oViewModel = new JSONModel({
				busy: false,
				delay: 0
			});

			const messagesModel = new JSONModel({
				awardedProduct: [],
				competitorResults: [],
			})
			// set message model
			this.oMessageManager = sap.ui.getCore().getMessageManager();
			this.getView().setModel(this.oMessageManager.getMessageModel(), "message");
			
			this.stState = this.getOwnerComponent().getModel("st");

			// activate automatic message generation for complete view
			this.oMessageManager.registerObject(this.getView(), true);
			this.getRouter().getRoute("deliveryTrackingProductDetail").attachPatternMatched(this._onObjectMatched, this);
            this.setModel(oViewModel, "detailDetailView");
            this.setModel(messagesModel, "messages");

		},
		_onObjectMatched: async function (oEvent) {
			this.countryCode = oEvent.getParameter("arguments").countryCode;
			this.tenderId = oEvent.getParameter("arguments").objectId;
			this.offerId = oEvent.getParameter("arguments").offerId;
			this.layout = oEvent.getParameter("arguments").layout;
			this.productCode = oEvent.getParameter("arguments").productId;
			this.getModel("appView").setProperty("/layout", this.layout);
			// this.getModel("appView").setProperty("/editable", false);
			this.templateState = this.getOwnerComponent().getModel("template");
			this.templateStateData = this.templateState.getData();
            this.onBeforeShow(this.tenderId, this.offerId, this.countryCod);
		},
        onBeforeShow: async function (objectId, offerId, countryCode) {
			const oModel = new JSONModel({
				busy: false,
				delay: 0,
				editMode: false,
				minDate: new Date(),
			});
			
			this.setModel(oModel, "ui");
            this._bindView();
		},

        _bindView: function () {
            const path = this.getModel().createKey("/DeliveryProductTableView", {
                OfferID: this.offerId,
                ProductCode: this.productCode
            });
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailDetailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: path
			})

		},
    });
});