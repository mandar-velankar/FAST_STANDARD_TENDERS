sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"./model/models",
	"./controller/ListSelector",
	"./controller/ErrorHandler",
	'sap/f/FlexibleColumnLayoutSemanticHelper',
	'sap/f/library',
	"sap/ui/model/json/JSONModel",
	"./service/AccessService"
], function (UIComponent, Device, models, ListSelector, ErrorHandler, FlexibleColumnLayoutSemanticHelper, fioriLibrary, JSONModel, AccessService) {
	"use strict";

	return UIComponent.extend("com.bayer.tender.statenderapp.Component", {

		metadata : {
			manifest : "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * In this method, the device models are set and the router is initialized.
		 * @public
		 * @override
		 */
		init : function () {
			this.oListSelector = new ListSelector();
			this._oErrorHandler = new ErrorHandler(this);

			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			this.accessService = new AccessService(this.getModel("access"));
			this.accessService.getAccess().then(result=>{
				this.setModel(new JSONModel(result.data), "accessControl");
				return result.data;
			});
			// call the base component's init function and create the App view
			UIComponent.prototype.init.apply(this, arguments);

			//set all change groups application wide
			this.setModelChangeGroups(this.getModel());

			// create the views based on the url/hash
			this.getRouter().initialize();
		},

		setModelChangeGroups: function(oModel){
			oModel.setDeferredGroups(oModel.getDeferredGroups().concat([
				"NewTender",
				"NewOffer",
				"AddProduct",
				"Basicinfo", 
				"AwardCriteria", 
				"OfferformInfo", 
				"OfferProducts", 
				"TotalAmountOfferProducts", 
				"ProductFormDetail", 
				"PricingForm",
				"OverviewForm",
				"AwardedProduct",
				"FreeGoodsOther",
				"Approvals",
				"Competitors",
				"Deliveries",
				"TenderMasterView",
				"NotificationMail",
				"AwardedOfferDistributors",
				"ContractDuration",
				"PdfEmail",
				"ComplianceOfficerView",
				"GlobalStrategicMarketingView",
				"SupplyManagementView",
				"MEACHNotificationMail",
				"ProfitabilityCalcParamView",
				"RappelForm",
				"BankGuarantees",
				"PT_TMBDPR"
			]));
			oModel.setChangeGroups({
				"TenderFormView": {
					groupId: "NewTender",  
				},
				"TenderFormView": {
					groupId: "Basicinfo",  
				},
				"OfferProductsTableView":{
					groupId: "AddProduct",
				},
				"PT_TMAWRDCR": {
					groupId: "AwardCriteria",  
				},
				"AwardCriteriaTableView": {
					groupId: "AwardCriteria",
				},
				"OfferFormView": {
					groupId: "NewOffer",  
				},
				"OfferFormView": {
					groupId: "OfferformInfo",  
				},
				"PT_TMTNOFST": {
					groupId: "NewOffer",  
				},
				"OfferProductsTable": {
					groupId: "OfferProducts",  
				},
				"TotalAmountProducts": {
					groupId: "TotalAmountOfferProducts",
				},
				"PriceConditionPriceView": {
					groupId: "PricingForm",  
				},
				"PriceConditionDiscountView": {
					groupId: "PricingForm",  
				},
				"PriceConditionPriceWithFOCView": {
					groupId: "PricingForm",
				},
				"PriceConditionDiscountWithFOCView": {
					groupId: "PricingForm",
				},
				"PriceConditionTaiwanPriceView": {
					groupId: "PricingForm",
				},
				"PriceConditionTaiwanDiscountView": {
					groupId: "PricingForm",
				},
				"PriceConditionNLPriceView": {
					groupId: "PricingForm",
				},
				"PriceConditionNLDiscountView": {
					groupId: "PricingForm",
				},
				"PriceConditionSpecialPriceView": {
					groupId: "PricingForm",
				},
				"PriceConditionWithMaximumPriceView": {
					groupId: "PricingForm",
				},
				"PriceConditionDescuentoComercialView": {
					groupId: "PricingForm",
				},
				"PriceConditionPVLView": {
					groupId: "PricingForm",
				},
				"PriceConditionRentalView": {
					groupId: "PricingForm",
				},
				"PriceConditionDescuentoEspecialView": {
					groupId: "PricingForm",
				},
				"PriceConditionPrecioNetoView": {
					groupId: "PricingForm",
				},
				"FreeGoodsOther": {
					groupId: "PricingForm",  
				},
				"OfferProductsDetailView": {
					groupId: "ProductFormDetail"
				},
				"OfferValidation": {
					groupId: "OverviewForm"
				},
				"AwardedProductFormView": {
					groupId: "AwardedProduct"
				},
				"AwardedProducts": {
					groupId: "AwardedProduct"
				},
				"OfferProductOfferStatus": {
					groupId: "Approvals"
				},
				"CompetitorResultsTableView": {
					groupId: "Competitors"
				},
				"DeliveryTrackingDetailView":{
					groupId: "Deliveries"
				},
				"TenderMasterView": {
					groupId: "TenderMasterView"
				},
				"Outbox":{
					groupId: "NotificationMail"
				},
				"AwardedOfferDistributors": {
					groupId: "AwardedOfferDistributors"
				},
				"ContractInfomation": {
					groupId: "ContractDuration"
				},
				"PdfEmail":{
					groupId: "PdfEmail"
				},
				"ComplianceOfficerView": {
					groupId: "ComplianceOfficerView"
				},
				"GlobalStrategicMarketingView": {
					groupId: "GlobalStrategicMarketingView"
				},
				"SupplyManagementView": {
					groupId: "SupplyManagementView"
				},
				"MEACHOutbox": {
					groupId: "MEACHNotificationMail"
				},
				"ProfitabilityCalcParamView":{
					groupId: "ProfitabilityCalcParamView"
				},
				"PriceConditionRappelView":{
					groupId: "RappelForm"
				},
				"BankGuarantees": {
					groupId: "BankGuarantees"
				},
				"PT_TMBDPR": {
					groupId: "PT_TMBDPR"
				}
			});
		},

		/**
		 * The component is destroyed by UI5 automatically.
		 * In this method, the ListSelector and ErrorHandler are destroyed.
		 * @public
		 * @override
		 */
		destroy : function () {
			this.oListSelector.destroy();
			this._oErrorHandler.destroy();
			// call the base component's destroy function
			UIComponent.prototype.destroy.apply(this, arguments);
		},

		/**
		 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
		 * design mode class should be set, which influences the size appearance of some controls.
		 * @public
		 * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
		 */
		getContentDensityClass : function() {
			if (this._sContentDensityClass === undefined) {
				// check whether FLP has already set the content density class; do nothing in this case
				// eslint-disable-next-line sap-no-proprietary-browser-api
				if (document.body.classList.contains("sapUiSizeCozy") || document.body.classList.contains("sapUiSizeCompact")) {
					this._sContentDensityClass = "";
				} else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		},

		getHelper: function () {
			return this._getFcl().then(function(oFCL) {
				var oSettings = {
					defaultTwoColumnLayoutType: fioriLibrary.LayoutType.TwoColumnsMidExpanded,
					defaultThreeColumnLayoutType: fioriLibrary.LayoutType.ThreeColumnsMidExpanded,
					initialColumnsCount: 2
				};
				return (FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFCL, oSettings));
			});
		},

		_getFcl: function () {
			return new Promise(function(resolve, reject) {
				var oFCL = this.getRootControl().byId('layout');
				if (!oFCL) {
					this.getRootControl().attachAfterInit(function(oEvent) {
						resolve(oEvent.getSource().byId('layout'));
					}, this);
					return;
				}
				resolve(oFCL);

			}.bind(this));
		}

	});
});