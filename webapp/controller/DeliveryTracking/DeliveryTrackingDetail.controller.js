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
				deliveryTrackingDetail: [],
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
			this.sProductScope = oEvent.getParameter("arguments").productScope;
			this.getModel("appView").setProperty("/layout", this.layout);
			// this.getModel("appView").setProperty("/editable", false);
			this.templateState = this.getOwnerComponent().getModel("template");
			this.templateStateData = this.templateState.getData();
			this.getDeliveryTrackingTemplateConfig();
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
			this.bindInstItutesField()
		},

		getDeliveryTrackingTemplateConfig: async function () {
			await this.templateState.read("DETAIL-DELIVERYTRACKINGDETAIL", {
				countryCode: this.countryCode,
				productScope: this.sProductScope,
				appID: "StandardTenders",
				page: "DETAIL-DELIVERYTRACKINGDETAIL",
				keys: {
					TenderID: this.tenderId,
				},
			});
		},

		handleClose: function() {
			let oNextUIState = "";
			this.oOwnerComponent.getHelper().then(function (oHelper) {
				oNextUIState = oHelper.getNextUIState(1);
				this.oRouter.navTo("objectDetailDeliveries", {
					layout: oNextUIState.layout,
					objectId: this.tenderId,
					offerId: this.offerId,
					countryCode: this.countryCode,
					productScope: this.sProductScope
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
			this.unbindDeliveryTrackingForm();
		},


		bindInstItutesField: async function () {
			const tender = await this.stState.getService().getTender(this.tenderId);

			const instSelect = this.byId('idChildInstitutesSelect');
			const template = instSelect.getBindingInfo("items").template.clone();
			instSelect.bindItems({
				path: "/ChildInstitutesView",
				filters: [
					new Filter("CountryCode", "EQ", tender.CountryCode),
					new Filter("ParentInstituteID","EQ", tender.InstituteID)
				],
				templateShareable:true,
				template: template,
			});
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

		onButtonDeliveryTrackingCreatePress: async function () {
			const deliveryTrackingTable = this.byId("idDeliveryTrackingTable");
			const tender = await this.stState.getService().getTender(this.tenderId);
			const sku = await this.stState.getService().getProductSKU(this.countryCode, this.productCode);

			const context = this.defaultModel.createEntry("/DeliveryTrackingDetailView", {
				properties: {
					TenderID: this.tenderId,
					OfferID: this.offerId,
					ProductCode: this.productCode,
					CountryCode: this.countryCode,
					InstituteID: tender.InstituteID,
					SKUCode: sku?.SKUCode
				},
				groupId: "Deliveries"
			});
			const newDelivery = deliveryTrackingTable.getBindingInfo("items").template.clone();
			newDelivery.setBindingContext(context);
			deliveryTrackingTable.insertItem(newDelivery);
			this.onFilterDeliveryTrackingInstituteField(newDelivery);
		},

		onFilterDeliveryTrackingInstituteField: function (newDelivery) {
			const countryCode = this.stState.getProperty("/SelectedCountry");
			const parentInstituteID = this.stState.getProperty("/SelectedInstituteID");

			const filters = [
				new Filter("CountryCode", "EQ", countryCode),
				new Filter("ParentInstituteID","EQ", parentInstituteID)
			];

			newDelivery.getCells().forEach(cell => {
				const bindingInfoPath = cell.getBindingInfo("items")?.path.includes("ChildInstitutesView");
				if (bindingInfoPath) {
					cell.getBinding("items").filter(filters);
				}
			})	
		},
	
		onButtonEditDeliveryPress: function (event) {
			const deliveryTracking = this.byId("idDeliveryTrackingTable").getItems();
			this.getModel('ui').setProperty('/DeliveryTrackingForm/editMode', true);
		},

		onButtonDeliveryCancelPress: function () {
			this.unbindDeliveryTrackingForm();
			this.byId("idDeliveryTrackingTable").removeSelections(true)
			this.getModel('ui').setProperty('/DeliveryTrackingForm/editMode', false);
			this.cancelPendingChanges(['DeliveryTrackingDetailView'], 'deliveryTrackingDetail');
		},

		onButtonDeleteDeliveryPress: function  (event) {
			const deliveryTrackingTable = this.byId("idDeliveryTrackingTable");
			const selecteddelivery = event.getSource().getParent();
			const selecteddeliveryCtx = selecteddelivery.getBindingContext();
			const selecteddeliveryPath = selecteddeliveryCtx.getPath();
			deliveryTrackingTable.setSelectedItem(selecteddelivery);
			if (selecteddeliveryCtx.isTransient()) {
				this.defaultModel.resetChanges([selecteddeliveryPath]);
				this.unbindDeliveryTrackingForm();
			}else {
				this.defaultModel.remove(selecteddeliveryPath);
				this.unbindDeliveryTrackingForm();
			}
		},

		bindDeliveryTrackingForm: function (path) {
			const competitorForm = this.byId("idDeliveryTrackingForm");
			competitorForm.bindElement({
				path: path
			})
		},
		
		onSelectDelivery: function (event) {
			const deliveryTrackingForm = this.byId("idDeliveryTrackingForm");
			const delivery = event.getParameter("listItem");
			const path = delivery.getBindingContext().getPath();
			deliveryTrackingForm.setVisible(true);
			this.bindDeliveryTrackingForm(path);
		},

		unbindDeliveryTrackingForm: function () {
			const deliveryTrackingForm = this.byId("idDeliveryTrackingForm");
			deliveryTrackingForm.unbindElement();
			deliveryTrackingForm.setVisible(false);
		},

		onButtonDeliverySavePress: function (event) {
			this.defaultModel.submitChanges({
				groupId: 'Deliveries',
				error: this.onSubmitChangesDeliveryFail.bind(this),
				success: this.onSubmitChangesDeliverySuccess.bind(this),
			});
		},

		onSubmitChangesDeliverySuccess: function (res) {
			const hasErrorMessages =  this.getMessages(["DeliveryTrackingDetailView"]).length > 0;
			this.setMessageSection(["DeliveryTrackingDetailView"], "deliveryTrackingDetail");

			if(!hasErrorMessages){
				this.getModel("ui").setProperty(`/DeliveryTrackingForm/editMode`, false);
				this.cancelPendingChanges(['DeliveryTrackingDetailView'], 'deliveryTrackingDetail');
				this.unbindDeliveryTrackingForm();
			} 
			this.defaultModel.refresh();
		},

		onSubmitChangesDeliveryFail: function (error) {

		}
    });
});