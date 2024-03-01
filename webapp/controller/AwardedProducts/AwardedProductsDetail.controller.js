sap.ui.define([
	"../BaseController",
	"sap/ui/model/json/JSONModel",
	"../../model/formatter",
	"sap/m/library",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
], function (BaseController, JSONModel, formatter, mobileLibrary, Filter, FilterOperator) {
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
					selectedItems: []
				},
				enableDeleteProductButton: false
			});
	
			this.setModel(uiModel, "ui");

			const awardedProductPath = this.getModel().createKey("/AwardedProductFormView", {
				OfferID: this.offerId,
				ProductCode: this.productId,
				LotID: "1"
			});
			
			this._bindView(awardedProductPath);
			this.bindForm(awardedProductPath);
			this.bindTable(this.offerId, this.productId);
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
			!hasErrorMessages && this.getModel("ui").setProperty(`/AwardedProductForm/editMode`, false);
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
			this.unbindCompetitorResultForm();
			this.cancelPendingChanges(['CompetitorResultsTableView'], 'competitorResults');
			this.getModel('ui').setProperty('/CompetitorResultsForm/editMode', false);
			this.byId('idCompetitorResultTable').getBinding('items').refresh();
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
    });
});