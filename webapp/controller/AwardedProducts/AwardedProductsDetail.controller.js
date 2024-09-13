sap.ui.define([
	"../BaseController",
	"sap/ui/model/json/JSONModel",
	"../../model/formatter",
	"sap/m/library",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/Fragment",
	"sap/m/Token",
	"sap/ui/core/Item",
	"sap/m/MessageBox",
	"sap/ui/model/Sorter",
	"sap/ui/core/BusyIndicator",
], function (BaseController, JSONModel, formatter, mobileLibrary, Filter, FilterOperator, Fragment, Token, Item, MessageBox, Sorter, BusyIndicator) {
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

			const messagesModel = new JSONModel({
				awardedProduct: [],
				competitorResults: [],
				contractInformation: []
			})

			this.getRouter().getRoute("awardProductsDetail").attachPatternMatched(this._onObjectMatched, this);
			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

			/*this.paState = this.getOwnerComponent().getState(this.getOwnerComponent().PA);
			this.setModel(this.paState.getModel(), "pa");

			this.oObjectPageLayout = this.byId("DetailPage");
			this.paState.setDetailPage(this.oObjectPageLayout);

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			this.getRouter().getRoute("objectDetail").attachPatternMatched(this._onObjectMatched, this);*/

			this.setModel(oViewModel, "detailDetailView");
			this.setModel(messagesModel, "messages");

			// set message model
			this.oMessageManager = sap.ui.getCore().getMessageManager();
			this.getView().setModel(this.oMessageManager.getMessageModel(), "message");

			// activate automatic message generation for complete view
			this.oMessageManager.registerObject(this.getView(), true);
			this.stState = this.getOwnerComponent().getModel("st");

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
			this.sProductScope = oEvent.getParameter("arguments").productScope;

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
				CompetitorResultsForm:{
					editMode: false,
					region: "",
					selectedItems: [],
					countryCode: this.countryCode,
					currency: "",
				},
				ContractInformation: {
					editMode: false
				},
				ContractDuration: {
					editMode: false
				},
				enableDeleteProductButton: false,
				brandProducts: [],
				ContractDurationForm: {
					OfferID: this.offerId,
					ProductCode: this.productId,
					InstituteName: "", 
					ContractDuration: "", 
					ContractStartDate: "", 
					ContractEndDate: "",
				}
			});
	
			this.setModel(uiModel, "ui");

			const awardedProductPath = this.getModel().createKey("/AwardedProductFormView", {
				OfferID: this.offerId,
				ProductCode: this.productId,
				LotID: "1"
			});
			const awardedProduct = await this.stState.getService().getAwardedProduct(this.offerId, this.productId)
			this.bindContractDurationSelect(awardedProduct)
			this._bindView(awardedProductPath);
			this.bindForm(awardedProductPath);
			this.bindTable(this.offerId, this.productId);
			this.setInitialWholeSalerMultiInputTokens();
			await this.getAwardedContractDurations()
		},

		getAwardedContractDurations: async function(){
            const result = await this.stState.getService().getAwardedContractDurations(this.offerId, this.productId)
			const multiInput = this.byId("idAwardedInstituteGroupMultiSelect")
			let awardedContractDurationForm = {}; 
			const InstituteGroupTokens = [];
			const tender = await this.stState.getService().getTender(this.tenderId);
			if (result.length > 0) {
					result.map(function (item) {
						const oToken = new Token({
							text: item.InstituteName,
							key: item.InstituteID
						});
						InstituteGroupTokens.push(oToken);
						awardedContractDurationForm = {
							OfferID: item.OfferID,
							ProductCode: item.ProductCode,
							InstituteName: "", 
							ContractDuration: item.ContractDuration, 
							ContractStartDate: item.ContractStartDate, 
							ContractEndDate: item.ContractEndDate,
						}
					});
			}else{
				const instituteInContract =  await this.stState.getService().getInstituteInContract(tender);
				
				const offerValidation = await this.stState.getService().getOfferValidation(this.offerId);
				awardedContractDurationForm.ContractStartDate = offerValidation && offerValidation.Tender_Custom_Date_1;

				instituteInContract.map(function (item) {
					const oToken = new Token({
						text: item.InstituteName,
						key: item.InstituteID
					});
					InstituteGroupTokens.push(oToken);
				})
			}
			this.getModel("ui").setProperty("/ContractDurationForm", awardedContractDurationForm)
			
            multiInput.removeAllTokens();			

			multiInput.setTokens(InstituteGroupTokens);	
			this.bindContractDurationSelectionForm(this.offerId, this.productId)
		},
		
		getCompetitorResults: async function (offerId, productCode) {
			const controller = this;
			return new Promise((resolve, reject) => {
				this.getModel().read("/CompetitorResultsTableView", {
					filters: [
						new Filter("OFFERID",FilterOperator.EQ, offerId),
						new Filter("PRODUCTCODE",FilterOperator.EQ, productCode),
						new Filter("LOTID",FilterOperator.EQ, "1")
					],
					success: function (res) {
						const competitors = res?.results.map(el => controller.mappedCompetitorResultsObject(el))
						resolve(competitors)
					},
					error: function (err) {
						reject(err)
					}
				})
			})
		},
		getAwardedProductsTemplateConfig: async function () {
			await this.templateState.read("DETAIL-AWARDEDRODUCTDETAIL", {
				countryCode: this.countryCode,
				productScope: this.sProductScope,
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

		bindForm: function (awardedProductPath) {
			const awardedProductForm = this.byId("idAwardedProductsDetailForm");

			awardedProductForm.bindElement({
				path: awardedProductPath,
				groupId: "AwardedProduct"
			})
		},

		bindTable: function (offerId, productCode) {
			const competitorResultTable = this.byId("idCompetitorResultTable");
			const template = competitorResultTable.getBindingInfo("items").template
			competitorResultTable.bindItems({
				path: "/CompetitorResultsTableView",
				filters: [
					new Filter("OFFERID",FilterOperator.EQ, offerId),
					new Filter("PRODUCTCODE",FilterOperator.EQ, productCode),
					new Filter("LOTID",FilterOperator.EQ, "1")
				],
				template: template,
				events: {
					dataReceived: this.onDataReceived.bind(this)
				}
			});
			this.unbindCompetitorResultForm();
		},

		onDataReceived: function(event) {
			const competitorResults = this.byId("idCompetitorResultTable").getItems();
			for (let item in competitorResults) {
				this.filterCompetitorResultComboBoxesOnDataReceived(competitorResults[item]);
			}
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
			this.cancelPendingChanges(["OfferValidation"], "OverviewForm");
			this.defaultModel.submitChanges({
				error: this._onSubmitChangesFail.bind(this),
				success: this._onSubmitChangesAwardedProductFormSuccess.bind(this),
				groupId: "AwardedProduct"
			}); 
		},

		_onSubmitChangesFail: function(error){
			// not implemented
		},

		_onSubmitChangesAwardedProductFormSuccess: function (res) {
			const messages = this.getMessages(["AwardedProductFormView"]);
			this.setMessageSection(["AwardedProductFormView"], "awardedProduct");
			const hasErrorMessages =  messages.length > 0;
			if (!hasErrorMessages){
				this.getModel("ui").setProperty(`/AwardedProductForm/editMode`, false);
				this.cancelPendingChanges(["AwardedProductFormView"], "awardedProduct");
			}
			this.getOwnerComponent().getEventBus().publish("AwardedProductTableUpdateChannel", "AwardedProductTableUpdateEvent");
			this.getOwnerComponent().getEventBus().publish("MasterTableUpdateChannel", "MasterTableUpdateEvent");
		},

		onButtonAwardProductDetailFormCancelPress: function(event){
			this.getModel("ui").setProperty('/AwardedProductForm/editMode', false);
			this.cancelPendingChanges(["AwardedProductFormView"], "awardedProduct")
		},

		handleClose: function() {
			let oNextUIState = "";
			this.oOwnerComponent.getHelper().then(function (oHelper) {
				oNextUIState = oHelper.getNextUIState(1);
				this.oRouter.navTo("objectDetailAwards", {
					layout: oNextUIState.layout,
					objectId: this.tenderId,
					productScope: this.sProductScope,
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

		/**
		 * When we use ThreeTable It is not possible to directly use insertRow/insertItem addRow/addItem
		 * To be able to add new row we can use JSONModel 
		 * Push needed data into JSONModel and refresh binding of table
		 */
		onButtonCompetitorResultsCreatePress: async function () {
			const competitorResultsTable = this.byId("idCompetitorResultTable");
			const context = this.defaultModel.createEntry("/CompetitorResultsTableView", {
				properties: {
					OFFERID: this.offerId,
					PRODUCTCODE: this.productId,
					LOTID: 1
				},
				groupId: "Competitors"
			});
			const newCompetitor = competitorResultsTable.getBindingInfo("items").template.clone();
			newCompetitor.setBindingContext(context);
			competitorResultsTable.insertItem(newCompetitor);
			this.filterCompetitorResultComboBoxes(newCompetitor);
			const offerProductValidation = await this.stState.getOfferProductValidation(this.offerId);
			if (Array.isArray(offerProductValidation) && offerProductValidation.length > 0) {
				const firstProduct = offerProductValidation[0];
				this.getModel('ui').setProperty('/CompetitorResultsForm/region', firstProduct.Region);
				this.getModel('ui').setProperty('/CompetitorResultsForm/currency', firstProduct.CURRENCY);
			}
		},

		filterCompetitorResultComboBoxes: function (competitorRow) {
			const masterCompetitorFilters = [
				new Filter({
					path: "CountryCode",
					operator: FilterOperator.EQ,
					value1: this.countryCode
				}),
				new Filter({
					path: "ProductCode",
					operator: FilterOperator.EQ,
					value1: this.productId
				})
			];

			const competitorOutcomeFilters = [
				new Filter({
					path: "CountryCode",
					operator: FilterOperator.EQ,
					value1: this.countryCode
				})
			];
			competitorRow.getCells().forEach(cell => {
				const bindingInfoPath = cell.getBindingInfo("items")?.path;
				if (bindingInfoPath && bindingInfoPath === "/MasterCompetitors") {
					cell.getBinding("items").filter(masterCompetitorFilters);
				}
				else if (bindingInfoPath && bindingInfoPath === "/MasterCompetitorProducts") {
					const awardedCompany = cell.getBindingContext().getObject().AWARDEDCOMPANY;
					masterCompetitorFilters.push(new Filter({
						path: "CompetitorCompany",
						operator: FilterOperator.EQ,
						value1: awardedCompany
					}));
					cell.getBinding("items").filter(masterCompetitorFilters);
				}else if(bindingInfoPath) {
					cell.getBinding("items").filter(competitorOutcomeFilters);
				}
			})		
		},

		filterCompetitorResultComboBoxesOnDataReceived: function (competitorRow) {
			const masterCompetitorFilters = [
				new Filter({
					path: "CountryCode",
					operator: FilterOperator.EQ,
					value1: this.countryCode
				}),
				new Filter({
					path: "ProductCode",
					operator: FilterOperator.EQ,
					value1: this.productId
				})
			];

			const competitorOutcomeFilters = [
				new Filter({
					path: "CountryCode",
					operator: FilterOperator.EQ,
					value1: this.countryCode
				})
			];
			competitorRow.getCells().forEach(cell => {
				const bindingInfoPath = cell.getBindingInfo("items")?.path;
				if (bindingInfoPath && bindingInfoPath === "/MasterCompetitors") {
					cell.getBinding("items").filter(masterCompetitorFilters);
				}
				else if (bindingInfoPath && bindingInfoPath === "/MasterCompetitorProducts") {
					cell.getBinding("items").filter(masterCompetitorFilters);
				}else if(bindingInfoPath) {
					cell.getBinding("items").filter(competitorOutcomeFilters);
				}
			})		
		},

		onButtonEditCompetitorPress: function (event) {
			const competitorResults = this.byId("idCompetitorResultTable").getItems();
			this.getModel('ui').setProperty('/CompetitorResultsForm/editMode', true);
			for (let item in competitorResults) {
				this.filterCompetitorResultComboBoxes(competitorResults[item]);
			}
		},

		bindCompetitorForm: function (path) {
			const competitorForm = this.byId("idCompetitorResultsForm");
			competitorForm.bindElement({
				path: path
			})
		},
		onSelectCompetitor: function (event) {
			const competitorForm = this.byId("idCompetitorResultsForm");
			const competitor = event.getParameter("listItem");
			const path = competitor.getBindingContext().getPath();
			competitorForm.setVisible(true);
			this.bindCompetitorForm(path);
		},

		onButtonCompetitorSavePress: function (event) {
			this.defaultModel.submitChanges({
				groupId: 'Competitors',
				error: this.onSubmitChangesCompetitorFail.bind(this),
				success: this.onSubmitChangesCompetitorsSuccess.bind(this),
			});
		},

		onSubmitChangesCompetitorsSuccess: function (res) {
			const messages = this.getMessages(["CompetitorResultsTableView"]);
			this.setMessageSection(["CompetitorResultsTableView"], "competitorResults");
			if (messages.length == 0) {
				this.unbindCompetitorResultForm();
				this.cancelPendingChanges(['CompetitorResultsTableView'], 'competitorResults');
				this.getModel('ui').setProperty('/CompetitorResultsForm/editMode', false);
				this.byId('idCompetitorResultTable').getBinding('items').refresh();
			}
			this.byId('idCompetitorResultTable').setBusy(false);
		},

		onSubmitChangesCompetitorFail: function (error) {

		},

		onButtonCompetitorCancelPress: function () {
			this.unbindCompetitorResultForm();
			this.cancelPendingChanges(['CompetitorResultsTableView'], 'competitorResults');
			this.getModel('ui').setProperty('/CompetitorResultsForm/editMode', false);
			this.byId('idCompetitorResultTable').getBinding('items').refresh();
		},

		onButtonDeleteCompetitorPress: function  (event) {
			const competitorResultsTable = this.byId("idCompetitorResultTable");
			const selectedCompetitor = event.getSource().getParent();
			const selectedCompetitorCtx = selectedCompetitor.getBindingContext();
			const selectedCompetitorPath = selectedCompetitorCtx.getPath();
			competitorResultsTable.setSelectedItem(selectedCompetitor);
			if (selectedCompetitorCtx.isTransient()) {
				this.defaultModel.resetChanges([selectedCompetitorPath])
				this.setCompetitorBindingContext(competitorResultsTable);
				// competitorResultsTable.removeItem(selectedCompetitor);
				this.unbindCompetitorResultForm();
			}else {
				this.defaultModel.remove(selectedCompetitorPath);
				this.unbindCompetitorResultForm();
			}
		},

		unbindCompetitorResultForm: function () {
			const competitorForm = this.byId("idCompetitorResultsForm");
			competitorForm.unbindElement();
			competitorForm.setVisible(false);
		},

		createNewPendingChanges: function (entity, groupID) {
			if (!entity && !groupID) return;
			const changes = [];
			const targets= this.getTargets([entity]);
			const pendingChanges = this.getModel().getPendingChanges();
			for (let item in pendingChanges) { 
				const itemIndex = targets.findIndex(el => el == `/${item}`);
				if (itemIndex > -1) changes.push(pendingChanges[item]);
			}
			this.defaultModel.resetChanges([...targets]);

			return changes.map(item => {
				return this.defaultModel.createEntry(`/${entity}`, {
					properties: item,
					groupId: groupID
				});
			})
		},

		setCompetitorBindingContext: function (competitorResultsTable) {
			const contexts = this.createNewPendingChanges("CompetitorResultsTableView", "Competitors");
			contexts.forEach(context => {
				const newCompetitor = competitorResultsTable.getBindingInfo("items").template.clone();
				newCompetitor.setBindingContext(context);
				competitorResultsTable.insertItem(newCompetitor);
			})
		},

		onSetCompetitorResultsChanges: async function (event, comboBox) {
			const value = event.getParameter("value");
			let path = event.getSource().getBindingContext().getPath();
			const context = this.defaultModel.getContext(path);

			switch (comboBox) {
				case "AwardedCompany":
					this.defaultModel.setProperty(`${path}/AWARDEDCOMPANY`, value, context);
					this.defaultModel.setProperty(`${path}/AWARDEDPRODUCT`, '', context);
					this.filterAwardedProducts(event.getSource(), value);
					const masterCompetitors = await this.getMasterCompetitors(value);
					this.defaultModel.setProperty(`${path}/Custom_String_1`, masterCompetitors?.ID || null, context) //PlaceHolder field used for MasterCompetitors upsert operation
					this.defaultModel.setProperty(`${path}/Custom_String_2`, this.countryCode, context) //MasterCompetitors field used for MasterCompetitors upsert operation
					break;
				case "AwardedProduct":
					path = `${path}/AWARDEDPRODUCT`;
					this.defaultModel.setProperty(path, value, context);
					break;
				case "Outcome":
					path = `${path}/OUTCOME`;
					this.defaultModel.setProperty(path, value, context);
					this.onChangeOutcome(value);
					break;
				default:
					break;
			}
		},

		filterAwardedProducts: function (companySelect, competitorCompany) {
			const awardedProductsSelect = companySelect.getParent().getCells()[1];
			const filters = [
				new Filter("CountryCode",FilterOperator.EQ, this.countryCode),
				new Filter("ProductCode",FilterOperator.EQ, this.productId),
				new Filter("CompetitorCompany",FilterOperator.EQ, competitorCompany)
			];

			awardedProductsSelect.getBinding('items').filter(filters)
		},

		onChangeOutcome: function (value) {
			const competitorForm = this.byId("idCompetitorResultsForm");
            const reasonItemBinding = competitorForm.getAggregation("formContainers")[0].getAggregation("formElements").find(el => el.getAggregation("label") === "Reason").getAggregation("fields")[0].getBinding("items");
            reasonItemBinding.aApplicationFilters = []
            const filterOutcome = new Filter("Outcome",FilterOperator.EQ, value)			
            reasonItemBinding.filter(filterOutcome);
        },

		getMasterCompetitors: async function (competitorCompany) {
			const path = "/MasterCompetitors"; 
			return new Promise((resolve, reject) => {
				this.defaultModel.read(path, {
					filters: [
						new Filter("CountryCode",FilterOperator.EQ, this.countryCode),
						new Filter("ProductCode",FilterOperator.EQ, this.productId),
						new Filter("CompetitorCompany", FilterOperator.EQ, competitorCompany)
					],
					success: function (res) {
						resolve(res.results[0])
					},
					error: function (err) {
						reject(err)
					}
				});
			});
		},

		onButtonContractInformationFormEditPress: function(event){
			this.getModel("ui").setProperty('/ContractInformation/editMode', true);
		},	

		onButtonContractInformationFormAcceptPress: function(event){
			this.getModel("ui").setProperty('/ContractInformation/editMode', false);
		},

		onMultiInputWholesalersValueHelpRequest:  function(event){
			const wholeSalersMultiInput = event.getSource();
			this.getDistributorAssignementDialog().then(this.onDistributorAssignementDialogLoaded.bind(this,wholeSalersMultiInput));
		},

		getDistributorAssignementDialog: function(){
			const view = this.getView();
			if (!this.dialogDistributorAssignement) {
				this.dialogDistributorAssignement = Fragment.load({
					id: view.getId(),
					name: "com.bayer.tender.statenderapp.view.awards.fragments.ContractInformation_WholesalersProducts",
					controller: this
				}).then(function (dialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					view.addDependent(dialog);
					return dialog;
				});
			}
			return this.dialogDistributorAssignement;	
		},

		/**
		 * Called when the price condition FOC dialog is loaded.
		 * This method is resuing the binding template from the view.
		 * More info see: https://answers.sap.com/questions/11405563/getting-the-item-template-of-a-mtable.html
		 * 
		 * @param {sap.m.MultiInput} multiInput - The multi-input control.
		 * @param {sap.m.Dialog} dialog - The dialog control.
		 * @returns {void}
		 */
		onDistributorAssignementDialogLoaded: function(multiInput, dialog){
			dialog.open();
			this.getNLOfferDistributors();
		},

		getNLOfferDistributors: async function () {
			let wholesalersListMultiInput = this.byId("idContractInformationWholesalersMultiInput");
			let productListMultiInput = this.byId("idContractInformationProductsMultiInput");

			await this.getUniqueDistributors(undefined, wholesalersListMultiInput, 'DistributorID');
			await this.getUniqueDistributors(undefined, productListMultiInput, 'ProductPackID');
		},

		getUniqueDistributors: async function (initialWholesalerMultiInput, multiInput, key) {
			const input = await this.stState.getService().getNLOfferDistributors(this.offerId, this.productId, key);
			const uniqValues = new Map();
			input.forEach(item => {
				uniqValues.set(item[key], item);
			});
			let result = Array.from(uniqValues.values());
			result.length == 0 && key === 'ProductPackID' && this.setSelectedProductToken(this.offerId, this.productId);
			result = result.map(item => {
				return this.setSelectedTokens(initialWholesalerMultiInput, multiInput, item, key);
			});
		},

		setInitialWholeSalerMultiInputTokens: async function () {
			let initialWholesalerMultiInput = this.byId("idWholesarlersMultiInput");
			initialWholesalerMultiInput.removeAllTokens();
			this.getUniqueDistributors(initialWholesalerMultiInput, undefined, 'DistributorID');
		},

		setSelectedTokens: function (initialWholesalerMultiInput, multiInput, item, key) {
			if (key === 'DistributorID') {
				initialWholesalerMultiInput?.addToken(new Token({
					text: item.DistributorName,
					key: item.DistributorID,
					editable: false
				}));
				multiInput?.addToken(new Token({
					text: item.DistributorName,
					key: item.DistributorID
				}));
			}else {
				multiInput?.addToken(new Token({
					text: item.ProductPackName,
					key: item.ProductPackID
				}));
			}
		},

		onButtonCancelWholesalersPress: async function(event){
			
			const dialog = await this.getDistributorAssignementDialog();
			if(this.getModel().hasPendingChanges()){
				this.getModel().resetChanges(null, false, true);
			}
			this.resetMultiInputTokens();
			this.setInitialWholeSalerMultiInputTokens();
			dialog.close(); 
		},

		resetMultiInputTokens: function () {
			let initialWholesalerMultiInput = this.byId("idWholesarlersMultiInput");
			let wholesalersListMultiInput = this.byId("idContractInformationWholesalersMultiInput");
			let productListMultiInput = this.byId("idContractInformationProductsMultiInput");

			initialWholesalerMultiInput.removeAllTokens();
			wholesalersListMultiInput.removeAllTokens();
			productListMultiInput.removeAllTokens();
			productListMultiInput.setSelectedItem(null);
		},

		onProductNameInputValueHelpRequest: function(event){
			const view = this.getView();
			const controller = this;
			// create value help dialog
			if (!this.dialogSelectBrandProducts) {
				this.dialogSelectBrandProducts = sap.ui.core.Fragment.load({
					id: view.getId(),
					name: "com.bayer.tender.statenderapp.view.awards.fragments.ContractInformation_SelectBrandProducts",
					controller: this
				}).then(function (valueHelpDialog) {
					view.addDependent(valueHelpDialog);
					return valueHelpDialog;
				});
			}

			// open value help dialog
			this.dialogSelectBrandProducts.then(function (valueHelpDialog) {
				controller.getProductBrands();
				valueHelpDialog.setRememberSelections(true);
				valueHelpDialog.open();
				controller.bindProductsTable();
			});
		},

		bindWholesalersTable: function () {
			const wholesalersTable = this.byId("idSelectWholesalersDialog");
			const template = wholesalersTable.getBindingInfo("items").template
			wholesalersTable.bindItems({
				path: "/MasterDistributors",
				filters: [
					new Filter("CountryCode",FilterOperator.EQ, 'NL'),
					new Filter("DistributorID",FilterOperator.NE, 100000226)
				],
				template: template,
				events: {
					dataReceived: this.handleProductDistributorsValueHelpUpdateFinished.bind('Distributor', this)
				}
			});
		},

		bindProductsTable: function () {
			const productsTable = this.byId("idSelectProductBrandDialog");
			const template = productsTable.getBindingInfo("items").template
			productsTable.bindItems({
				path: "ui>/brandProducts",
				template: template,
				events: {
					dataReceived: this.handleProductDistributorsValueHelpUpdateFinished.bind('Product', this)
				}
			});
		},

		getProductBrands: async function (productName) {
			const offerFormViewPath = this.defaultModel.createKey("/OfferFormView", {OfferID: this.offerId});
			let offerFormViewObject = this.defaultModel.getProperty(offerFormViewPath);
			if(!offerFormViewObject){
				offerFormViewObject	= await this.getOfferFormView(this.offerId);
			}
			const {products} = await this.stState.getService().getOfferProducts(offerFormViewObject.OfferID);
			const instituteBrandProducts = await this.stState.getService().getInstituteBrandProducts(offerFormViewObject, productName);
			const filteredInstituteBrandProducts = instituteBrandProducts.filter(item => {
				const itemIndex = products.findIndex(pr => pr.ProductCode == item.PRODUCT_ID);
				if (itemIndex > -1) return item;
			});
			this.getModel('ui').setProperty('/brandProducts', filteredInstituteBrandProducts);
		},


		handleProductBrandsValueHelpConfirm: function (event) {
			const contexts = event.getParameter('selectedContexts');
			const productBrandList = this.byId("idContractInformationProductsMultiInput");
			let productBrandTokens = [];

			//push the selected brand products 
			contexts.map(function (oContext) {
				const oToken = new Token({
					text: oContext.getObject().PRODUCT_NAME,
					key: oContext.getObject().PRODUCT_ID
				});
				productBrandTokens.push(oToken);
			});

			//add the array of tokens to the multi input
			productBrandList.setTokens(productBrandTokens);	
		},

		handleProductDistributorsValueHelpUpdateFinished: function(event, key){
			try{
				const distributorMultiInputTokens = this.byId("idContractInformationWholesalersMultiInput").getTokens();
				const productBrandMultiInputTokens = this.byId("idContractInformationProductsMultiInput").getTokens();
				const distributorListDialog = this.byId("idSelectWholesalersDialog");
				const productBrandListDialog = this.byId('idSelectProductBrandDialog');

				if (key === 'Distributor') {
					distributorMultiInputTokens.forEach(selectedItem => {
						distributorListDialog?.getItems()?.find(item => item.getBindingContext().getObject().DistributorID == selectedItem.getProperty('key'))?.setSelected(true)
					})
				}else {
					productBrandMultiInputTokens.forEach(selectedItem => {
						productBrandListDialog?.getItems()?.find(item => item.getBindingContext('ui').getObject().PRODUCT_ID == selectedItem.getProperty('key'))?.setSelected(true)
					})
				}
			}
			catch(error){
			  console.error(error);
			}
	
		  },

		onWholesalersInputValueHelpRequest: function(event){
			const view = this.getView();
			const controller = this;
			// create value help dialog
			if (!this.dialogSelectWholesalers) {
				this.dialogSelectWholesalers = sap.ui.core.Fragment.load({
					id: view.getId(),
					name: "com.bayer.tender.statenderapp.view.awards.fragments.ContractInformation_SelectWholesalers",
					controller: this
				}).then(function (valueHelpDialog) {
					view.addDependent(valueHelpDialog);
					return valueHelpDialog;
				});
			}

			// open value help dialog
			this.dialogSelectWholesalers.then(function (valueHelpDialog) {
				valueHelpDialog.setRememberSelections(true);
				valueHelpDialog.open();
				controller.bindWholesalersTable();
			});
		},

		handleWholesalersValueHelpConfirm: function (event) {
			const contexts = event.getParameter('selectedContexts');
			const wholesalersList = this.byId("idContractInformationWholesalersMultiInput");
			let wholesalersTokens = [];

			//push the selected brand products 
			contexts.map(function (oContext) {
				const oToken = new Token({
					text: oContext.getObject().DistributorName,
					key: oContext.getObject().DistributorID
				});
				wholesalersTokens.push(oToken);
			});

			//add the array of tokens to the multi input
			wholesalersList.setTokens(wholesalersTokens);	
		},

		setSelectedProductToken: async function (offerID, productCode) {
			const brandProductMultiInput = this.byId("idContractInformationProductsMultiInput");
			const selectedProduct = await this.stState.getService().getOfferProduct(offerID, productCode);
			let productBrandTokens = [];
			const oToken = new Token({
				text: selectedProduct.PRODUCTPACKNAME,
				key: selectedProduct.ProductCode
			});
			const item = new Item({
				text: selectedProduct.PRODUCTPACKNAME,
				key: selectedProduct.ProductCode
			});
			productBrandTokens.push(oToken);
			brandProductMultiInput.setTokens(productBrandTokens);
			brandProductMultiInput.setSelectedItem(item);
		},

		handleProductBrandsWholesalersValueHelpSearch: function (event, path) {
			const searchValue = event.getParameter('value');
			const oFilter = [
				new Filter(path, FilterOperator.Contains, searchValue)
			]
			event.getSource().getBinding("items").filter(new Filter(oFilter));
		},

		onButtonApplyWholesalersProductsPress: async function () {
			try {
				BusyIndicator.show(0);
				// const NLOfferDistributors = await this.stState.getService().getNLOfferDistributors(this.offerId);
				const wholesalersListTokens = this.byId("idContractInformationWholesalersMultiInput").getTokens().map(item => item.getProperty('key')).join(';');
				const brandProductMultiInputTokens = this.byId("idContractInformationProductsMultiInput").getTokens().map(item => item.getProperty('key')).join(';');

				const pendingChange = {
					OfferID: this.offerId,
					DistributorName: wholesalersListTokens,
					ProductPackName: brandProductMultiInputTokens,
					AssignedProductCode: this.productId
				};
				this.getModel().createEntry('/NLOfferDistributors', {
					properties: pendingChange,
					groupId: "NLOfferDistributors"
				});
				
				
				this.getModel().submitChanges({
					success: this.onSubmitChangesNLDistributorSuccess.bind(this),
					groupId: "NLOfferDistributors"
				});
			} catch (error) {
				MessageBox.error(response?.error?.message?.value);
				BusyIndicator.hide();
			}
		},

		onSubmitChangesNLDistributorSuccess: async function (event) {
			const errStatus = event?.__batchResponses?.[0]?.response?.statusCode;
			const errMessage = event?.__batchResponses?.[0]?.response?.body;
			let dialog = await this.getDistributorAssignementDialog();
			if (errStatus == 403) {
				MessageBox.error(JSON.parse(errMessage)?.error?.message?.value);
				BusyIndicator.hide();
			}else {
				this.resetMultiInputTokens();
				this.setInitialWholeSalerMultiInputTokens();
				dialog.close();
				MessageBox.success('Wholesalers were saved successfully');
				BusyIndicator.hide();
			}
		},

		onOpenAwardedInstituteGroup: async function(){
			if (!this._AwardedInstituteGroupFragment) {
                this._AwardedInstituteGroupFragment = Fragment.load({
                    id: this.getView().getId(),
                    name: "com.bayer.tender.statenderapp.view.awards.fragments.AwardedInstituteGroup",
                    controller: this,
                }).then(async function(oFragment) {
                    this._AwardedInstituteGroupFragment = oFragment;
					// oFragment.setRememberSelections(true);
                    this._AwardedInstituteGroupFragment.setModel(this.getView().getModel());
                    this.getView().addDependent(oFragment);
                    this._AwardedInstituteGroupFragment.open();
					await this.bindAwardedInstituteGroupTable();
                }.bind(this));
            } else {
				await this.bindAwardedInstituteGroupTable();
                this._AwardedInstituteGroupFragment.open();
            }
		},

		bindAwardedInstituteGroupTable: async function(){
			const list = this.byId("idAwardedInstituteGroupDialog");
            const template = new sap.m.ColumnListItem({
                cells:[
                    new sap.m.Text({text:'{InstituteName}'}),
                ]
            })
			const {Custom_String_3, InstituteID} = await this.stState.getService().getTender(this.tenderId);
			const InstituteNames = Custom_String_3.split(";")
			const orFilters = []
			let andFilters = []
			let oFilters;
			
			if (Custom_String_3) {
				andFilters = [
					new Filter("ParentInstituteID", FilterOperator.EQ, InstituteID ),
					new Filter("InstituteID", FilterOperator.NE, InstituteID),
				]
				for(let instituteName in InstituteNames){
					orFilters.push(new Filter({
						path: "InstituteName",
						operator: FilterOperator.EQ,
						value1: InstituteNames[instituteName]
					}));
				}
				andFilters.push(new Filter(orFilters, false))
			 	oFilters = [new Filter(andFilters, true)];
			}else{
				andFilters = [
					new Filter("CountryCode", FilterOperator.EQ, this.countryCode ),
					new Filter("InstituteID", FilterOperator.EQ, InstituteID),
				]
				oFilters = [new Filter(andFilters, true)];
			}
            list.bindItems({
				path: Custom_String_3 == '' ? "/PT_TMINST" : '/InstitutesInGroup',
				template: template,
				filters: oFilters,
				events:{
					dataReceived: this.handleAwardedInstituteGroupValueHelpUpdateFinished.bind(this)
				}
			});	
		},

		handleAwardedInstituteGroupValueHelpSearch: function(oEvent){
            const searchValue = oEvent.getParameter('value');
			const oFilter = [
				new Filter("InstituteName", FilterOperator.Contains, searchValue)
			]
			oEvent.getSource().getBinding("items").filter(new Filter(oFilter));
		},

		handleAwardedInstituteGroupValueHelpUpdateFinished: function(){
            try{
				const InstituteGroupMultiInputTokens = this.byId("idAwardedInstituteGroupMultiSelect").getTokens();
				const InstituteGroupListDialog = this.byId("idAwardedInstituteGroupDialog");

				InstituteGroupMultiInputTokens.forEach(selectedItem => {
					InstituteGroupListDialog?.getItems()?.find(item => item.getBindingContext().getObject().InstituteID == selectedItem.getProperty('key'))?.setSelected(true)
				})
			}
			catch(error){
			  console.error(error);
			}
		},

		handleAwardedInstituteGroupHelpCancelPress: function () {
			const list = this.byId("idAwardedInstituteGroupDialog");
			list.unbindElement()
		},

		handleAwardedInstituteGroupHelpConfirm: function(oEvent){
			const contexts = oEvent.getParameter('selectedContexts');
			const InstituteGroupList = this.byId("idAwardedInstituteGroupMultiSelect");
			let InstituteGroupTokens = [];

			contexts.map(function (oContext) {
				const oToken = new Token({
					text: oContext.getObject().InstituteName,
					key: oContext.getObject().InstituteID
				});
				InstituteGroupTokens.push(oToken);
			});

			InstituteGroupList.setTokens(InstituteGroupTokens);	
		},

		onDateChange: function() {
			const form = this.byId('idContractDurationForm') 
			const context = form.getBindingContext('ui')
            const startDate = this.byId('idContractStartDate').getDateValue();
            const durationSelect = this.byId("idContractDuration").getSelectedKey();
			const endDate = new Date(startDate);
			endDate.setDate(endDate.getDate() + 1);
			const formettedEndDate = new Date(endDate.setMonth(endDate.getMonth() + parseInt(durationSelect)));
			
			context.getModel().setProperty("ContractEndDate", formettedEndDate, context);
			context.getModel().refresh()
        },

        onSavehandleAwardedContractDuration: function(){
            try {
                this.getModel("appView").setProperty('/busy', true);
                const form = this.byId("idContractDurationForm");
                const contractDurationValue = this.byId("idContractDuration").getSelectedKey();
                const obj = form.getBindingContext("ui").getObject();
                const InstituteGroupIds = this.byId("idAwardedInstituteGroupMultiSelect").getTokens().map(item => item.getProperty('key')).join(',');
                
                obj.InstituteName = InstituteGroupIds;            
                obj.ContractDuration = contractDurationValue;
                obj.ContractStartDate = obj.ContractStartDate && new Date(obj.ContractStartDate);
                obj.ContractEndDate = obj.ContractEndDate && new Date(obj.ContractEndDate);
                obj.OfferID = this.offerId;
                obj.ProductCode = this.productId;
                
                this.getModel().createEntry('/ContractInfomation', {
                    properties: obj,
                    groupId: "ContractDuration"
                });

                this.getModel().submitChanges({
                    success: this.onSubmitChangesAwardedContractDurationSuccess.bind(this),
                    groupId: "ContractDuration"
                });
            } catch (error) {
                MessageBox.error(error.message);
                this.getModel("appView").setProperty('/busy', false);
            }
        },


		onSubmitChangesAwardedContractDurationSuccess: async function (event) {
			const errStatus = event?.__batchResponses?.[0]?.response?.statusCode;
			const errMessage = event?.__batchResponses?.[0]?.response?.body;
			if (errStatus == 403) {
				MessageBox.error(JSON.parse(errMessage)?.error?.message?.value);
				this.getModel("appView").setProperty('/busy', false);
			}else {
				await this.getAwardedContractDurations()
				MessageBox.success('Contract Duration was saved successfully');
				this.getModel("appView").setProperty('/busy', false);
				this.getModel("ui").setProperty('/ContractDuration/editMode', false);
			}
			this.getModel().resetChanges();
		},

		bindContractDurationSelectionForm: function(){
            const form = this.getView().byId('idContractDurationForm');
            
            form.bindElement({
				path: "ui>/ContractDurationForm",
			});

		},

        bindContractDurationSelect: function(awardedProduct){
			const select = this.byId("idContractDuration")
            const template = select.getBindingInfo('items').template.clone()
			select.bindItems({
				path: "/NLPriceConditions",
				template: template,
				filters: [    
					new Filter("PriceCondition_ID" ,FilterOperator.EQ, awardedProduct.priceconditionID),
				],
				sorter: new Sorter({
					path: 'ContractDuration',
					descending: false
				})
		    })
		},
		
		onAwardedContractDurationFormEditBtnPress: function(){
			this.getModel("ui").setProperty('/ContractDuration/editMode', true);
		},

		onAwardedContractDurationFormCancelBtnPress: async function(){
			this.getModel("ui").setProperty('/ContractDuration/editMode', false);
			await this.getAwardedContractDurations()
		}
    });
});