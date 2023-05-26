sap.ui.define([
	"./BaseController",
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
	"../model/formatter",
	"sap/m/ColumnListItem",
	"sap/ui/core/Item",
	"sap/m/MessageToast"
], function (BaseController,  Component, ComponentContainer, JSONModel, Filter, FilterType, Sorter, FilterOperator, GroupHeaderListItem, Device, Fragment, formatter,ColumnListItem, Item, MessageToast) {
	"use strict";

	return BaseController.extend("com.bayer.tender.statenderapp.controller.Master", {

		formatter: formatter,
		// oCountryCodeFilter: new Filter("COUNTRYCODE", FilterOperator.EQ, "AR"),

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
		 * @public
		 */
		onInit : function () {
			// Control state model
			var oList = this.byId("genericMasterTable"),
				oViewModel = this._createViewModel();
				// Put down master list's original value for busy indicator delay,
				// so it can be restored later on. Busy handling on the master list is
				// taken care of by the master list itself.
				//iOriginalBusyDelay = oList.getBusyIndicatorDelay();

			// this._oGroupFunctions = {
			// 	TenderNo : function(oContext) {
			// 		var iNumber = oContext.getProperty('TenderNo'),
			// 			key, text;
			// 		if (iNumber <= 20) {
			// 			key = "LE20";
			// 			text = this.getResourceBundle().getText("masterGroup1Header1");
			// 		} else {
			// 			key = "GT20";
			// 			text = this.getResourceBundle().getText("masterGroup1Header2");
			// 		}
			// 		return {
			// 			key: key,
			// 			text: text
			// 		};
			// 	}.bind(this)
			// };

		
			this._oList = oList;
			// keeps the filter and search state
			this._oListFilterState = {
				aFilter : [],
				aSearch : []
			};

			this.orFilters = [];
			this.andFilters = [];
			
			this.setModel(oViewModel, "masterView");
			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			/*oList.attachEventOnce("updateFinished", function(){
				// Restore original busy indicator delay for the list
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});*/

			this.getView().addEventDelegate({
				onBeforeFirstShow: function () {
					this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
				}.bind(this)
			});

			this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
			this.getRouter().getRoute("object").attachPatternMatched(this._onMasterMatched, this);
			this.getRouter().attachBypassed(this.onBypassed, this);

			// set message model
			this.oMessageManager = sap.ui.getCore().getMessageManager();
			this.getView().setModel(this.oMessageManager.getMessageModel(), "message");

			// activate automatic message generation for complete view
			this.oMessageManager.registerObject(this.getView(), true);

			const oModel = this.getOwnerComponent().getModel();
			oModel.setDeferredGroups(oModel.getDeferredGroups().concat(["Tender"]));
			oModel.setChangeGroups({
				"TenderFormView": {
					groupId: "Tender",  
					changeSetId: "ID",/*optional*/
					single: true, /*optional, can be true or false*/
				}
			});
		},

		onCountriesReceived: async function(oEvent){
			const sCountryCode = oEvent.getParameter("data").results[0].CountryCode; // we default to first country in the list
			// set filter which is needed later on
			if(sCountryCode){
				this.andFilters.push(new Filter({
					path: "CountryCode",
					operator: FilterOperator.Contains,
					value1: sCountryCode,
					caseSensitive: false
				}));
			}

			this._getTemplateConfig(sCountryCode);	
			this._bindBrandItems(sCountryCode);
			this._bindStatusses(sCountryCode);

		},
		_getNextTenderID: async function (sCountryCode) {
			return new Promise((resolve, reject) => {
				this.getModel().read("/CountryTenderNo", {
					filters: [
						new Filter("COUNTRY_CODE", "EQ", sCountryCode)
					],
					success: function (res) {
						let nextTenderNo = res.results[0].NEXT_TENDER_NO;
						resolve(nextTenderNo);
					}
				});
			}).then(data => {
				let year = new Date().getFullYear();
				year = year.toString().substring(4, 2);
				this.getModel("st").setProperty("/NextTenderNo", data);
				return `${sCountryCode}-${year}-${data}`;
			})
		},
		_getTemplateConfig: function(sCountryCode){
			this.getView().getModel('st').setProperty("/SelectedCountry", sCountryCode);
			this.templateState.read("MASTER",{ 
				countryCode: "BR" || sCountryCode, // TODO: this is hardcoded country. We need to remove the hard coded value once we have more country config
				appID:"StandardTenders",
				page:"MASTER"
			}).then(this._onTemplateConfigReceived.bind(this));
		},

		/**
		 * This method is called once the template configuration is loaded
		 */
		_onTemplateConfigReceived: function(){
			const table = this.byId("genericMasterTable");
			this._bindTable(table);
		},

		_bindBrandItems: function(sCountryCode){
			const oSelectBrands = this.byId("idSlctBrand");	
			oSelectBrands?.bindItems({
				path: "/CountryTenderBrands", 
				filters: [
					new Filter("COUNTRYCODE",FilterOperator.EQ, sCountryCode)
				],
				sorter: new Sorter ({
					path: 'BRANDNAME', 
					descending: false
				}),
				template: new sap.ui.core.Item({
					key: "{BRANDID}",
					text: "{BRANDNAME}"
				}),
				templateShareable: true
			});	
		},

		_bindStatusses: function(sCountryCode){
			const oFilterCountry = new Filter("CountryCode",FilterOperator.EQ, sCountryCode);
			const oSelectStatus = this.byId("idSlctStatus");	
			oSelectStatus?.bindItems({
				path: "/CountryStatusses", 
				filters: [
					new Filter("CountryCode",FilterOperator.EQ, sCountryCode)
				],
				sorter: new Sorter ({
					path: 'Status', 
					descending: false
				}),
				template: new Item({
					key: "{Status}",
					text: "{Status}"
				}),
				templateShareable: true
			});
		},

		_bindTable: function(table){
			const oCountrySelectedItem =  this.byId("idSlctCountry").getItems()[0];
			const sCountryCode = oCountrySelectedItem?.getKey();
			const oFilterCountry = new Filter("CountryCode",FilterOperator.EQ, sCountryCode);
			const cols = this.templateStateData.masterConfig.countryTemplate.getTemplate().getTable().getColumns();
			table && table.bindItems({
			  path: `/${this.templateStateData.masterConfig.countryTemplate.getTemplate().getTable().getEntity()}`, 
			  filters: [oFilterCountry],
			//   model: '',
			  template: new ColumnListItem({
				type: "Active",
				cells: cols.map(col => col.getControl().generateControl())
			  }),
			  templateShareable: true
			});
		},
		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * After list data is available, this handler method updates the
		 * master list counter
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished : function (oEvent) {
			// update the master list object counter after new data is loaded
			this._updateListItemCount(oEvent.getParameter("total"));
		},

		// /**
		//  * Event handler for the master search field. Applies current
		//  * filter value and triggers a new search. If the search field's
		//  * 'refresh' button has been pressed, no new search is triggered
		//  * and the list binding is refresh instead.
		//  * @param {sap.ui.base.Event} oEvent the search event
		//  * @public
		//  */
		// onSearch : function (oEvent) {
		// 	if (oEvent.getParameters().refreshButtonPressed) {
		// 		// Search field's 'refresh' button has been pressed.
		// 		// This is visible if you select any master list item.
		// 		// In this case no new search is triggered, we only
		// 		// refresh the list binding.
		// 		this.onRefresh();
		// 		return;
		// 	}

		// 	var sQuery = oEvent.getParameter("query");

		// 	if (sQuery) {
		// 		this._oListFilterState.aSearch = [new Filter("TenderName", FilterOperator.Contains, sQuery)];
		// 	} else {
		// 		this._oListFilterState.aSearch = [];
		// 	}
		// 	this._applyFilterSearch();

		// },

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh : function () {
			//this._oList.getBinding("items").refresh();
		},

		/**
		 * Event handler for the filter, sort and group buttons to open the ViewSettingsDialog.
		 * @param {sap.ui.base.Event} oEvent the button press event
		 * @public
		 */
		onOpenViewSettings : function (oEvent) {
			var sDialogTab = "sort";
			// if (oEvent.getSource() instanceof sap.m.Button) {
			// 	var sButtonId = oEvent.getSource().getId();
			// 	if (sButtonId.match("sort")) {
			// 		sDialogTab = "sort";
			// 	} else if (sButtonId.match("group")) {
			// 		sDialogTab = "group";
			// 	}
			// }
			// load asynchronous XML fragment
			if (!this.byId("viewSettingsDialog")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "com.bayer.tender.statenderapp.view.ViewSettingsDialog",
					controller: this
				}).then(function(oDialog){
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open(sDialogTab);
				}.bind(this));
			} else {
				this.byId("viewSettingsDialog").open(sDialogTab);
			}
		},

		/**
		 * Event handler called when ViewSettingsDialog has been confirmed, i.e.
		 * has been closed with 'OK'. In the case, the currently chosen filters, sorters or groupers
		 * are applied to the master list, which can also mean that they
		 * are removed from the master list, in case they are
		 * removed in the ViewSettingsDialog.
		 * @param {sap.ui.base.Event} oEvent the confirm event
		 * @public
		 */
		onConfirmViewSettingsDialog : function (oEvent) {
			// var aFilterItems = oEvent.getParameters().filterItems,
			// 	aFilters = this.andFilters,
			// 	aCaptions = [];

			// // update filter state:
			// // combine the filter array and the filter string
			// aFilterItems.forEach(function (oItem) {
			// 	switch (oItem.getKey()) {
			// 		case "Filter1" :
			// 			aFilters.push(new Filter("TenderNo", FilterOperator.LE, 100));
			// 			break;
			// 		case "Filter2" :
			// 			aFilters.push(new Filter("TenderNo", FilterOperator.GT, 100));
			// 			break;
			// 		default :
			// 			break;
			// 	}
			// 	aCaptions.push(oItem.getText());
			// });

			this._oListFilterState.aFilter = this.andFilters;
			// this._updateFilterBar(aCaptions.join(", "));
			this._applyFilterSearch();
			this._applySortGroup(oEvent);
		},

		/**
		 * Apply the chosen sorter and grouper to the master list
		 * @param {sap.ui.base.Event} oEvent the confirm event
		 * @private
		 */
		_applySortGroup: function (oEvent) {
			var mParams = oEvent.getParameters(),
				sPath,
				bDescending,
				aSorters = [];
			// apply sorter to binding
			// (grouping comes before sorting)
			if (mParams.groupItem) {
				sPath = mParams.groupItem.getKey();
				bDescending = mParams.groupDescending;
				var vGroup = this._oGroupFunctions[sPath];
				aSorters.push(new Sorter(sPath, bDescending, vGroup));
			}
			sPath = mParams.sortItem.getKey();
			bDescending = mParams.sortDescending;
			aSorters.push(new Sorter(sPath, bDescending));
			this._oList.getBinding("items").sort(aSorters);
		},

		/**
		 * Event handler for the list selection event
		 * @param {sap.ui.base.Event} oEvent the list selectionChange event
		 * @public
		 */
		onSelectionChange : function (oEvent) {
			var oList = oEvent.getSource(),
				data = oEvent.getParameter("listItem").getBindingContext().getObject(),//oEvent.getParameter("data"),
				bSelected = oEvent.getParameter("selected");

			// skip navigation when deselecting an item in multi selection mode
			if (!(oList.getMode() === "MultiSelect" && !bSelected)) {
				// get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
				this._showDetail(data||oList);
			}
		},

		/**
		 * Event handler for the bypassed event, which is fired when no routing pattern matched.
		 * If there was an object selected in the master list, that selection is removed.
		 * @public
		 */
		onBypassed : function () {
			this._oList.removeSelections(true);
		},

		/**
		 * Used to create GroupHeaders with non-capitalized caption.
		 * These headers are inserted into the master list to
		 * group the master list's items.
		 * @param {Object} oGroup group whose text is to be displayed
		 * @public
		 * @returns {sap.m.GroupHeaderListItem} group header with non-capitalized caption.
		 */
		createGroupHeader : function (oGroup) {
			return new GroupHeaderListItem({
				title : oGroup.text,
				upperCase : false
			});
		},

		/**
		 * Event handler for navigating back.
		 * We navigate back in the browser historz
		 * @public
		 */
		onNavBack : function() {
			// eslint-disable-next-line sap-no-history-manipulation
			history.go(-1);
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */


		_createViewModel : function() {
			return new JSONModel({
				isFilterBarVisible: false,
				filterBarLabel: "",
				delay: 0,
				title: this.getResourceBundle().getText("masterTitleCount", [0]),
				noDataText: this.getResourceBundle().getText("masterListNoDataText"),
				sortBy: "TenderName",
				groupBy: "None",
				SelectedCountry: ""
			});
		},

		_onMasterMatched : async function() {
			//Set the layout property of the FCL control to 'OneColumn'
			this.getModel("appView").setProperty("/layout", "OneColumn");
			
			this.templateState = this.getOwnerComponent().getModel("template");
			this.templateStateData = this.templateState.getData();
			// await this.templateState.read("MASTER",{
			// 	countryCode:"BR",
			// 	appID:"StandardTenders",
			// 	page:"MASTER"
			// });
			// this.setModel(this.templateStateData.masterConfig.countryTemplate.getTemplate().getODataModel(), "data");
			// const cols = this.templateStateData.masterConfig.countryTemplate.getTemplate().getTable().getColumns();
			// const table = this.byId("genericMasterTable");
			// table && table.bindItems({
			//   path: `/${this.templateStateData.masterConfig.countryTemplate.getTemplate().getTable().getEntity()}`, 
			// //   model: '',
			//   template: new ColumnListItem({
			// 	type: "Active",
			// 	cells: cols.map(col => col.getControl().generateControl())
			//   }),
			//   templateShareable: true
			// });
		},

		/**
		 * Shows the selected item on the detail page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showDetail : function (oItem) {
			var bReplace = !Device.system.phone;
			// set the layout property of FCL control to show two columns
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			this.getRouter().navTo("object", {
				objectId : oItem.TenderID, //getBindingContext().getProperty("TenderID")
				offerId : oItem.OfferID
			}, bReplace);
		},

		/**
		 * Sets the item count on the master list header
		 * @param {integer} iTotalItems the total number of items in the list
		 * @private
		 */
		_updateListItemCount : function (iTotalItems) {
			var sTitle;
			// only update the counter if the length is final
			if (this._oList.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
				this.getModel("masterView").setProperty("/title", sTitle);
			}
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @private
		 */
		_applyFilterSearch : function () {
			var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
				oViewModel = this.getModel("masterView");
			this._oList.getBinding("items").filter(aFilters, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aFilters.length !== 0) {
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
			} else if (this._oListFilterState.aSearch.length > 0) {
				// only reset the no data text to default when no new search was triggered
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
			}
		},

		/**
		 * Internal helper method that sets the filter bar visibility property and the label's caption to be shown
		 * @param {string} sFilterBarText the selected filter value
		 * @private
		 */
		_updateFilterBar : function (sFilterBarText) {
			var oViewModel = this.getModel("masterView");
			oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
			oViewModel.setProperty("/filterBarLabel", this.getResourceBundle().getText("masterFilterBarText", [sFilterBarText]));
		},

		onOpenCreateTenderDialog : function () {
			const that = this;
			// create dialog lazily
			if (!this.byId("idCreateTenderDialog")) {
				this.tenderCreationDialog = Fragment.load({
					id: that.getView().getId(),
					name: "com.bayer.tender.statenderapp.view.tender.fragments.NewTenderDialog",
                    controller: that,
				}).then(function (oDialog) {
					that.getView().addDependent(oDialog);
                    oDialog.open();
					that._bindCreateTenderForm();
                })
			}else {
				this.byId("idCreateTenderDialog").open();
			}
		},
		_bindCreateTenderForm: async function () {
			const entity = this.templateStateData.masterConfig.countryTemplate.getTemplate().getForm().getEntity();
			const form = this.byId("idNewTenderForm");
			const newEntryContext = this.getOwnerComponent().getModel().createEntry(`/${entity}`, {
				groupId: "Tender"
			});
			const path = newEntryContext.getPath();
			form?.bindElement({
				path: path,
				groupId: "Tender"
			});
			const sElemBindingPath = form.getElementBinding().getPath();
			const sCountryCode = this.byId("idSlctCountry").getSelectedKey();
			const nextTenderID = await this._getNextTenderID(sCountryCode);

			this.getModel().setProperty(`${sElemBindingPath}/TenderID`, nextTenderID);
			this.getModel().setProperty(`${sElemBindingPath}/ContractLength`, 12);
			this.getModel().setProperty(`${sElemBindingPath}/ContractExtenseion`, 0);
		},
		onCloseTenderCreationDialog: function () {
			this.oMessageManager.removeAllMessages();
			this.byId("idCreateTenderDialog").close();
			this.byId("idCreateTenderDialog").destroy();
			this.getModel().resetChanges();
		},

		onCreateNewTender: async function () {
			this.oMessageManager.removeAllMessages();
			const oNewTenderForm = this.byId("idNewTenderForm");
			this.setNewTenderPendingChanges(oNewTenderForm);
			this.getModel().submitChanges({
				success: this._onSubmitChangesSuccess.bind(this),
				error: this._onSubmitChangesFail.bind(this),
				groupId: "Tender"
			});
		},
		_onSubmitChangesFail: function(error){
			// not implemented
		},

		_onSubmitChangesSuccess: function(res){
			const oNewTenderForm = this.byId("idNewTenderForm");
			const oNewTender = oNewTenderForm.getElementBinding().getBoundContext().getObject();
			const hasErrorMessages = this.getView().getModel('message').getData().length > 0;
			if (!hasErrorMessages) {
				MessageToast.show("Tender has been successfully created");
				this.onCloseTenderCreationDialog();
				this._showDetail(oNewTender);
			}
		},
		setNewTenderPendingChanges: function (oForm) {
			const oDefaultModel = oForm.getModel();
			const oStandModel = oForm.getModel("st");
			const oBoundContext = oForm.getElementBinding().getBoundContext();
			const sSelectedCountry = oStandModel.getProperty("/SelectedCountry");

			const newTenderObj = {
				TenderID: oBoundContext.getObject().TenderID,
				Active: 1,
				TenderName: oBoundContext.getObject().TenderName,
				CountryCode: sSelectedCountry,
				InstituteName: oBoundContext.getObject().InstituteName,
				InstituteType: oBoundContext.getObject().InstituteType,
				InstituteID: oBoundContext.getObject().InstituteID,
				TenderNo: oStandModel.getProperty("/NextTenderNo"),
				TenderChannel: oBoundContext.getObject().TenderChannel,
				Classification: oBoundContext.getObject().Classification,
				ContractExtenseion: oBoundContext.getObject().ContractExtenseion,
				ContractLength: oBoundContext.getObject().ContractLength,
				PublicationDate: oBoundContext.getObject().PublicationDate,
				BidDueDate: oBoundContext.getObject().BidDueDate,
				AwardDate: oBoundContext.getObject().AwardDate,
				NextPublicationDye: oBoundContext.getObject().NextPublicationDye
			}
			const oNewBindingCtx = oDefaultModel.createEntry("/TenderFormView", {
				properties: newTenderObj,
				groupId: "Tender"
			});
			oForm?.bindElement({
				path: oNewBindingCtx.getPath(),
				groupId: "Tender"
			});
			oDefaultModel.resetChanges([oBoundContext.getPath()]);
		},
		setFilter: function (oEvent) {

			this.orFilters = [];
			this.andFilters = [];

			const tableConfig = this.templateStateData.masterConfig.countryTemplate.getTemplate().getTable();

			let sSearch = this.byId('idSearch').getValue();

			if (sSearch) {

				if(tableConfig.hasColumn("CountryCode")){
					this.orFilters.push(new Filter({
						path: "CountryCode",
						operator: FilterOperator.Contains,
						value1: sSearch,
						caseSensitive: false
					}));
				}
				
				if(tableConfig.hasColumn("TenderID")){
					this.orFilters.push(new Filter({
						path: "TenderID",
						operator: FilterOperator.Contains,
						value1: sSearch,
						caseSensitive: false
					}));
				}

				if(tableConfig.hasColumn("Classification")){
					this.orFilters.push(new Filter({
						path: "Classification",
						operator: FilterOperator.Contains,
						value1: sSearch,
						caseSensitive: false
					}));
				}

				if(tableConfig.hasColumn("TenderName")){
					this.orFilters.push(new Filter({
						path: "TenderName",
						operator: FilterOperator.Contains,
						value1: sSearch,
						caseSensitive: false
					}));
				}

				if(tableConfig.hasColumn("createdBy")){
					this.orFilters.push(new Filter({
						path: "createdBy",
						operator: FilterOperator.Contains,
						value1: sSearch,
						caseSensitive: false
					}));
				}

				if(tableConfig.hasColumn("DistributorName")){
					this.orFilters.push(new Filter({
						path: "DistributorName",
						operator: FilterOperator.Contains,
						value1: sSearch,
						caseSensitive: false
					}));
				}

				if(tableConfig.hasColumn("InstituteName")){
					this.orFilters.push(new Filter({
						path: "InstituteName",
						operator: FilterOperator.Contains,
						value1: sSearch,
						caseSensitive: false
					}));
				}

				if(tableConfig.hasColumn("OfferID")){
					this.orFilters.push(new Filter({
						path: "OfferID",
						operator: FilterOperator.Contains,
						value1: sSearch,
						caseSensitive: false
					}));
				}

				if(tableConfig.hasColumn("VALUE")){
					// regex checks for numbers (decimals included)
					if(/^[0-9]*[.]?[0-9]+$/.test(sSearch)){
						this.orFilters.push(new Filter({
							path: "VALUE",
							operator: FilterOperator.BT,
							value1: Math.floor(sSearch),
							value2: Math.ceil(sSearch)
						}));
					}
				}

				if(tableConfig.hasColumn("STATUS")){
					this.orFilters.push(new Filter({
						path: "STATUS",
						operator: FilterOperator.Contains,
						value1: sSearch,
						caseSensitive: false
					}));
				}

				if(tableConfig.hasColumn("PublicationDate")){
					const publicationDate = this.formatter.parseDate(sSearch, "yyyy-MM-dd");
					if(publicationDate){
						this.orFilters.push(new Filter({
							path: "PublicationDate",
							operator: FilterOperator.EQ,
							value1: publicationDate,
							caseSensitive: false
						}));
					}
				}

				if(tableConfig.hasColumn("BidDueDate")){
					const bidDueDate = this.formatter.parseDate(sSearch, "yyyy-MM-dd");
					if(bidDueDate){
						this.orFilters.push(new Filter({
							path: "BidDueDate",
							operator: FilterOperator.EQ,
							value1: bidDueDate,
							caseSensitive: false
						}));
					}
				}
				
				this.andFilters.push(new Filter(this.orFilters, false));
			}

			// Dropdown filters
			// Country
			const oCountrySelectedItem =  this.byId("idSlctCountry").getSelectedItem();
			const sCountryCode = oCountrySelectedItem?.getKey();
			if(sCountryCode){
				this.andFilters.push(new Filter({
					path: "CountryCode",
					operator: FilterOperator.Contains,
					value1: sCountryCode,
					caseSensitive: false
				}));
			}
			
			const isCountrySelectChanged = oEvent.getParameter("id").toLowerCase().includes("idslctcountry");
			if(isCountrySelectChanged){
				this._bindBrandItems(sCountryCode);
				this._bindStatusses(sCountryCode);
			}

			// Brands
			// const oFilterBrands = new Filter("COUNTRYCODE",FilterOperator.EQ, sCountryCode);
			const oSelectBrands = this.byId("idSlctBrand");	
			// oSelectBrands.getBinding("items").filter([oFilterBrands]);
			const sBrandId = oSelectBrands.getSelectedItem()?.getKey();
			if(sBrandId && !sBrandId.toLowerCase().includes('all_brands')){
				this.andFilters.push(new Filter({
					path: "BrandID",
					operator: FilterOperator.Contains,
					value1: sBrandId,
					caseSensitive: false
				}));
			}

			// Status 
			// const oFilterStatus = new Filter("CountryCode",FilterOperator.EQ, sCountryCode);
			const oSelectStatus = this.byId("idSlctStatus");	
			// oSelectStatus.getBinding("items").filter([oFilterStatus]);
			const sStatus = oSelectStatus.getSelectedItem()?.getKey();
			if(sStatus && !sStatus.toLowerCase().includes('all')){
				this.andFilters.push(new Filter({
					path: "STATUS",
					operator: FilterOperator.Contains,
					value1: sStatus,
					caseSensitive: false
				}));
			}


			if(this.andFilters.length > 0){
				const oFilters = new Filter(this.andFilters, true);

				//Binding to table with the filters and the sorters
				this._oList.getBinding("items")?.filter(oFilters, FilterType.Application);
			}else{
				this._oList.getBinding('items').aApplicationFilters = [];
				this._oList.getBinding("items")?.filter();
			}
			
			if (this._oList.getBinding("items")?.isSuspended()) {
				this._oList.getBinding("items")?.resume();
			}
			
		}
	});

});