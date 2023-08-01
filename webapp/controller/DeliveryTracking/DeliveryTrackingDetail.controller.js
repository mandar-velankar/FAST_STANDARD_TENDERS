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
			this.oOwnerComponent = this.getOwnerComponent();
			this.oRouter = this.oOwnerComponent.getRouter();

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
            this.onBeforeShow(this.tenderId, this.offerId, this.countryCode);
		},
        onBeforeShow: async function (objectId, offerId, countryCode) {

			this.templateState = this.getOwnerComponent().getModel("template");
			this.templateStateData = this.templateState.getData();
			this.tenderId = objectId;
			this.offerId = offerId;
			this.countryCode = countryCode;
			
			this.defaultModel = this.getOwnerComponent().getModel();
			
			const oModel = new JSONModel({
				busy: false,
				delay: 0,
				editMode: false,
				minDate: new Date(),
				DeliveryTrackingForm:{
					editMode: false,
					selectedItems: []
				},
			});
			
			this.setModel(oModel, "ui");
            this.bindTable();
			this.bindText();
		},

		handleClose: function() {
			let oNextUIState = "";
			this.oOwnerComponent.getHelper().then(function (oHelper) {
				oNextUIState = oHelper.getNextUIState(1);
				this.oRouter.navTo("objectDetailDeliveries", {
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
		},

        bindTable: function () {
            const awarderProductsTable = this.byId("idDeliveryTrackingTable");
			const template = awarderProductsTable.getBindingInfo("items").template

			awarderProductsTable.bindItems({
				path: "/DeliveryTrackingDetailView",
				filters: [
					new Filter("OfferID", "EQ", this.offerId),
					new Filter("ProductCode","EQ",this.productCode)
				],
				template: template
			})

		},

		bindText: function(){
			let path = "";
			const entity = 'DeliveryProductTableView';
			const textField = this.byId("idDeliveryTrackingProductName");

			if (this.offerId) {
				path = this.getOwnerComponent().getModel().createKey(`/${entity}`, {
					OfferID: this.offerId,
					ProductCode: this.productCode
				});
			}

			textField.bindElement({
				path: path,
				groupId: "Deliveries"
			})
			
		},

		onButtonDeliveryTrackingCreatePress: function () {
			const deliveryTrackingTable = this.byId("idDeliveryTrackingTable");
			const context = this.defaultModel.createEntry("/DeliveryTrackingDetailView", {
				properties: {
					OfferID: this.offerId,
					ProductCode: this.productCode
				},
				groupId: "Deliveries"
			});
			const newDelivery = deliveryTrackingTable.getBindingInfo("items").template.clone();
			newDelivery.setBindingContext(context);
			deliveryTrackingTable.insertItem(newDelivery);
		},

		onButtonEditDeliveryPress: function (event) {
			const deliveryTracking = this.byId("idDeliveryTrackingTable").getItems();
			this.getModel('ui').setProperty('/DeliveryTrackingForm/editMode', true);
		},

		onButtonDeliveryCancelPress: function () {
			this.getModel('ui').setProperty('/DeliveryTrackingForm/editMode', false);
		},
    });
});