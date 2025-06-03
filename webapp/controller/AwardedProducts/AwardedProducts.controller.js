sap.ui.define([
	"../BaseController",
	"sap/ui/model/json/JSONModel",
	"../../model/formatter",
	"sap/m/library",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"../../service/StandardSingletonService",
	"sap/ui/model/Sorter",
	"sap/ui/core/Fragment",
	"sap/ui/core/Item",
	"sap/m/MessageBox",
], function (BaseController, JSONModel, formatter, mobileLibrary, Filter, FilterOperator, StandardSingletonService, Sorter, Fragment, Item, MessageBox) {
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

			const messagesModel = new JSONModel({
				bankGuarantee: [],
			})
			/*this.paState = this.getOwnerComponent().getState(this.getOwnerComponent().PA);
			this.setModel(this.paState.getModel(), "pa");

			this.oObjectPageLayout = this.byId("DetailPage");
			this.paState.setDetailPage(this.oObjectPageLayout);

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			this.getRouter().getRoute("objectDetail").attachPatternMatched(this._onObjectMatched, this);*/

			this.setModel(oViewModel, "detailView");
			this.setModel(messagesModel, "messages");

			// set message manager model
			this.oMessageManager = sap.ui.getCore().getMessageManager();
			this.getView().setModel(this.oMessageManager.getMessageModel(), "message");
			
			this.getRouter().getRoute("objectDetailAwards").attachPatternMatched(this._onObjectMatched, this);
			// this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			this.getOwnerComponent().getEventBus().subscribe("AwardedProductTableUpdateChannel", "AwardedProductTableUpdateEvent", this.handleRefreshAwardedProductTable, this);

			this.stState = this.getOwnerComponent().getModel("st");
		},

		onBeforeShow: async function (iconTabfilter,{objectId, offerId, countryCode, productScope}) {
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
				enableApprovalButton: false,
				bankGuaranteeTypes: {
					Final: false,
					Additional: false,
				}
			});
			
			this.setModel(oModel, "ui");

			this.bindTable();

			this.hasTenderBankGuarantee(this.tenderId);
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
				this.getModel("st").setProperty("/ContractStartDate", products[0]?.ContractStartDate);
				this.getModel("st").setProperty("/ContractEndDate", products[0]?.ContractEndDate);
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
	
		onBankGuaranteeMenuAction: function(evt){
			const selectedItem = evt.getParameter("item");
			const selectedItemText = selectedItem.getText();
			
			this.openCreateBankGuaranteeDialog(selectedItemText);
		},


		openCreateBankGuaranteeDialog: function (type) {
			const that = this;
			const dialog = this.byId(`idCreateBankGuarantee${this.countryCode}Dialog`);
			// create dialog lazily
			if (!dialog) {
				this.bankGuaranteeCreateDialog = Fragment.load({
					id: that.getView().getId(),
					name: `com.bayer.tender.statenderapp.view.awards.fragments.NewBankGuarantee${this.countryCode}`,
					controller: that,
				}).then(function (oDialog) {
					that.getView().addDependent(oDialog);
					oDialog.open();
					oDialog.setModel(that.getModel());
					that._bindBankGuaranteeForm(type);
				})
			} else {
				dialog.open();
			}
		},

		_bindBankGuaranteeForm: async function (type) {
			const bankguarantee = await this.stState.getService().getBankGuarantee(this.tenderId, type);
			const form = this.byId(`idCreateBankGuarantee${this.countryCode}Form`);
			let path = "";

			if (bankguarantee) {
				path = this.getModel().createKey("/BankGuarantees", {
					ID: bankguarantee.ID
				}); 
			}else {
				const entry = this.getModel().createEntry("/BankGuarantees", {
					properties: {
						TenderID: this.tenderId,
						CountryCode: this.countryCode,
						Type: type,
						GuaranteedAmount: 0,
					},
					groupId: "BankGuarantees"
				}); 
				path = entry.getPath();
			}

			form.bindElement({
				path: path,
				groupId: "BankGuarantees"
			})
		},

		onSaveNewBankGuarantee: function () {
			this.getModel().submitChanges({
				error: this._onSubmitChangesFail.bind(this),
				success: this._onSubmitChangesBankGuaranteeFormSuccess.bind(this),
				groupId: "BankGuarantees"
			}); 
		},

		_onSubmitChangesFail: function(error){
			// not implemented
		},

		_onSubmitChangesBankGuaranteeFormSuccess: function (res) {
			const messages = this.getMessages(["bankGuarantee"]);
			const hasErrorMessages =  messages.length > 0;
			
			if (hasErrorMessages) {
				MessageBox.error("Please enter all mandatory fields.");
				return;
			}
		
			const aChangeResponses = res?.__batchResponses?.[0]?.__changeResponses || [];
			let isCreated = false;
			let isUpdated = false;
		
			aChangeResponses.forEach(function (oChange) {
				const statusCode = parseInt(oChange.statusCode, 10);
				if (statusCode === 201) {
					isCreated = true;
				} else if (statusCode === 200 || statusCode === 204) {
					isUpdated = true;
				}
			});
		
			this.onCancelNewBankGuarantee(); // close dialog or reset form
			
			const successMessage = [];

			if (isCreated && !isUpdated) {
				successMessage.push({
					type: 'Success',
					title: 'Bank Guarantee Created',
					description: 'A new bank guarantee has been created for this tender.',
					subtitle: '',
					counter: 1
				})
			} else if (isUpdated && !isCreated) {
				successMessage.push({
					type: 'Success',
					title: 'Bank Guarantee Updated',
					description: 'Bank guarantee for this tender has been updated succesfully.',
					subtitle: '',
					counter: 1
				})
			}

			this.showMessageCompositeView("Success", successMessage, "Success");
			this.hasTenderBankGuarantee(this.tenderId);

		},
		
		onCancelNewBankGuarantee: function () {
			const dialog = this.byId(`idCreateBankGuarantee${this.countryCode}Dialog`);
			if (dialog) {
				dialog.close();
				dialog.destroy();
				this.cancelPendingChanges(["BankGuarantees"], "bankGuarantee");
			}
		},

		onCountyCurrencyReceived: function (event) {
			const select = this.byId("idCurrencynewBankGuaranteeES");
			const currencies = event?.getParameter("data")?.results || [];

			select.destroyItems();

			currencies.unshift({
				CountryCode: "ES",
				Currency: ""
			});

			currencies.forEach(item => {
				select.addItem(new Item({
					key: item.Currency,
					text: item.Currency
				}));
			});
		},

		// Show accept icon if there is bank guarantee for the current type
		hasTenderBankGuarantee: async function(tenderID){
			const tenderBankGuarantees = await this.stState.getService().getBankGuarantee(tenderID) || [];

			tenderBankGuarantees.forEach(bg => {
				this.getModel("ui").setProperty(`/bankGuaranteeTypes/${bg.Type}`, true);
			});
		},

		onContractDateChange: async function () {
			const oStartDate = this.byId("contractStartDate").getDateValue();
			const oEndDate = this.byId("contractEndDate").getDateValue();

			if (!oStartDate || !oEndDate) {
				return;
			}

			try {
				this.getModel().callFunction("/updateFinalContractStartEndDate", {
					method:"POST", 
					urlParameters: {"OfferID": this.offerId, "ContractStartDate": oStartDate.toISOString().split("T")[0], "ContractEndDate": oEndDate.toISOString().split("T")[0]},
					success: this.onUpdateFinalContractStartEndDateSuccess.bind(this),
					error: this.onUpdateFinalContractStartEndDateFail.bind(this)
				});
			} catch (err) {
				console.error(err);
			}
		},

		onUpdateFinalContractStartEndDateSuccess: function(res){
			MessageBox.success(res);
			this.handleRefreshAwardedProductTable();
		},

		onUpdateFinalContractStartEndDateFail: function(res){
			const message = JSON.parse(res?.responseText)?.error?.message?.value || res?.message
            MessageBox.error(message);
		}
    });
})