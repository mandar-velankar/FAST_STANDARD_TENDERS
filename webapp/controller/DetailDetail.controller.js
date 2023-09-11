sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
], function (BaseController, JSONModel, formatter) {
	"use strict";

	return BaseController.extend("com.bayer.tender.statenderapp.controller.DetailDetail", {
		onInit: function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			// var oViewModel = new JSONModel({
			// 	busy: false,
			// 	delay: 0,
			// 	lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
			// });

			this.getRouter().getRoute("offerProductDetail").attachPatternMatched(this._onObjectMatched, this);

			// this.setModel(oViewModel, "detailView");

			// this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
		},

		/**
				 * Binds the view to the object path and expands the aggregated line items.
				 * @function
				 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
				 * @private
				 */
		_onObjectMatched: async function (oEvent) {
			this.sObjectId = oEvent.getParameter("arguments").objectId;
			this.sProductId = oEvent.getParameter("arguments").productId;
			this.sProductScope = oEvent.getParameter("arguments").productScope;
			this.sCountryCode = oEvent.getParameter("arguments").countryCode;
			this.getModel("appView").setProperty("/layout", "ThreeColumnsEndExpanded");
			// this.getModel("appView").setProperty("/editable", false);

			this.templateState = this.getOwnerComponent().getModel("template");
			this.templateStateData = this.templateState.getData();

			const detaildetailConfig = await this.templateState.read("DETAIL-DETAIL", {
				countryCode: this.sCountryCode,
				productScope: this.sProductScope,
				appID: "StandardTenders",
				page: "DETAIL-DETAIL",
				keys: {
					TenderID: this.sObjectId,
				}
			});

			// await this.getModel().metadataLoaded();
			// let path = "";
			// if (sObjectId) {
			// 	path = this.getModel().createKey(`/${this.templateStateData.detailConfig.countryTemplate.getTemplate().getTab(selectedTab)}`, {
			// 		TenderID: sObjectId,
			// 	});
			// } else {
			// 	const newEntryContext = this.getModel().createEntry(`/${this.templateStateData.detailConfig.countryTemplate.getTemplate().getEntity()}`, {});
			// 	path = newEntryContext.getPath();
			// }

			this.getView().bindElement({
				path: `/${detaildetailConfig.countryTemplate.getTemplate().getForm().getEntity()}`
				// model: 'data'
			});

			// this.getModel().metadataLoaded().then(function () {
			// 	var sObjectPath = this.getModel().createKey("TenderMasterView", {
			// 		TenderID: this.sObjectId,
			// 		OfferID: this.sOfferId
			// 	});
			// 	this._bindView("/" + sObjectPath);
			// }.bind(this));
		},

	});
});