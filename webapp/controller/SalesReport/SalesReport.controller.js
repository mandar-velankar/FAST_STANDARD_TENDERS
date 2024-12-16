sap.ui.define([
	"../BaseController",
	"sap/ui/core/Component",
	"sap/ui/core/ComponentContainer",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterType",
	"sap/ui/model/Sorter",
	"sap/ui/model/FilterOperator",
	"sap/m/GroupHeaderListItem",
	"sap/ui/Device",
	"sap/ui/core/Fragment",
	"../../model/formatter",
	"sap/m/ColumnListItem",
	"sap/ui/core/Item",
	"sap/m/MessageToast",
	"../../service/StandardSingletonService",
	"sap/ui/core/EventBus",
	"sap/m/library",
], function (BaseController, Component, ComponentContainer, JSONModel, Filter, FilterType, Sorter, FilterOperator, GroupHeaderListItem, Device, Fragment, formatter, ColumnListItem, Item, MessageToast, StandardSingletonService, EventBus, mobileLibrary) {
	"use strict";
	var URLHelper = mobileLibrary.URLHelper;
	return BaseController.extend("com.bayer.tender.statenderapp.controller.SalesReport.SalesReport", {

		formatter: formatter,
		// oCountryCodeFilter: new Filter("COUNTRYCODE", FilterOperator.EQ, "AR"),

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
		 * @public
		 */
		onInit: function () {
			// Control state model
			var oList = this.byId("genericMasterTable")

			this._oList = oList;
			// keeps the filter and search state
			this._oListFilterState = {
				aFilter: [],
				aSearch: []
			};

			this.orFilters = [];
			this.andFilters = [];

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			/*oList.attachEventOnce("updateFinished", function(){
				// Restore original busy indicator delay for the list
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});*/

			// this.getView().addEventDelegate({
			// 	onBeforeFirstShow: function () {
			// 		this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
			// 	}.bind(this)
			// });

			this.getRouter().attachBypassed(this.onBypassed, this);

			// set message model
			this.oMessageManager = sap.ui.getCore().getMessageManager();
			this.getView().setModel(this.oMessageManager.getMessageModel(), "message");

			// activate automatic message generation for complete view
			this.oMessageManager.registerObject(this.getView(), true);

			this.stState = this.getOwnerComponent().getModel("st");
		},
		formatValue: function (Price, Currency, Region, CountryCode) {
			if (Price === null) {
				return ""
			}else{
				const currencyType =  this.getView().getController().customTypes.currency
				return  new currencyType().getModelFormat().format([Price, Currency, Region, CountryCode])
			}
			
		}
	});

});