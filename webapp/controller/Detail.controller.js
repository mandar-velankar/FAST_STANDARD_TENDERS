sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/core/ComponentContainer",
	"sap/m/library",
	"sap/m/IconTabFilter",
	"sap/m/IconTabBar",
	"sap/ui/core/mvc/View",
	"sap/ui/core/mvc/ViewType",
	"sap/ui/core/routing/HashChanger",
	"sap/ui/model/Context",
	"sap/ui/core/EventBus"
], function (BaseController, JSONModel, formatter, ComponentContainer, mobileLibrary, IconTabFilter,IconTabBar, View,ViewType, HashChanger,Context, EventBus) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return BaseController.extend("com.bayer.tender.statenderapp.controller.Detail", {
		views:{},
		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
			});
			const messagesModel = new JSONModel({
				basicInfoMsg: [],
				offerProductsMsg: [],
				awardCriteriaMsg: [],
				overviewTenderFormMsg: [],
				approvalMsg: []
			})
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			this.getRouter().getRoute("objectDetailOffer").attachPatternMatched(this._onObjectMatched, this);
			this.getRouter().getRoute("objectDetailOverview").attachPatternMatched(this._onObjectMatched, this);
			this.getRouter().getRoute("objectDetailAwards").attachPatternMatched(this._onObjectMatched, this);
			this.getRouter().getRoute("objectDetailDeliveries").attachPatternMatched(this._onObjectMatched, this);
			this.getRouter().getRoute("offerProductDetail").attachPatternMatched(this._onObjectMatched, this);
			this.getRouter().getRoute("awardProductsDetail").attachPatternMatched(this._onObjectMatched, this);
			this.getRouter().getRoute("deliveryTrackingProductDetail").attachPatternMatched(this._onObjectMatched, this);
			this.setModel(oViewModel, "detailView");
			this.setModel(messagesModel, "messages");

			this.getOwnerComponent().getEventBus().subscribe("masterChannel", "statusChanged", this.handleStatusChange, this);
			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
		},

		handleStatusChange: function(channel, event, data) {
			this.updateVisibilityOfTabs(this.iconTabBar, data.offerStatus);
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */


		/**
		 * Updates the item count within the line item table's header
		 * @param {object} oEvent an event containing the total number of items in the list
		 * @private
		 */
		onListUpdateFinished: function (oEvent) {
			var sTitle,
				iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("detailView");

			// only update the counter if the length is final
			if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
				}
				oViewModel.setProperty("/lineItemListTitle", sTitle);
			}
		},
		createIconTab: function(){
			this.templateState = this.getOwnerComponent().getModel("template");
			this.templateStateData = this.templateState.getData();
			
			const iconTabBar = new IconTabBar({
				items:this.templateStateData.detailConfig.countryTemplate.template.tabs.map((tab,idx)=>this.tabsFactory(tab,idx)),
				select:(event)=>this.onTabSelect(event),
				selectedKey:"{st>/selectedTab}"
			});
			this.iconTabBar = iconTabBar;
			this.byId("detailPage").setContent(iconTabBar)
		},
		tabsFactory: function (tab,idx){
			const xmlView = tab.getXMLView();
			const viewFolder = tab.title.toLowerCase().split(" ").join("");
			const viewName = `com.bayer.tender.statenderapp.view.${viewFolder}.views.${xmlView.getName()}`;
			const viewData = {
				objectId:this.sObjectId,
				offerId:this.sOfferId,
				countryCode:this.sCountryCode,
				productScope: this.sProductScope
			};
			const isVisible = this.getTabVisibility(tab.title);

			const iconTabFilter = new IconTabFilter({
				text: tab.title,
				key: tab.title,
				visible: isVisible
			}); 

			const viewConfig = {
				viewName, 
				tab: iconTabFilter, 
				context:new Context(this.getModel("template"), `/detailConfig/countryTemplate/template/tabs/${idx}`),
				data: viewData 
			};

			if(!this.views[viewName]){	
				xmlView && this.getOwnerComponent().runAsOwner(()=>{
					View.create({
						viewName: viewName,
						viewId: `id${xmlView.getName()}`,
						type: sap.ui.core.mvc.ViewType.XML
					}).then(view => {
						this.views[viewName] = view;
						this.getView().addDependent(this.views[viewName]);
						this.updateTabView(viewConfig);
					});
				});
			}else{			
				this.updateTabView(viewConfig)	
			}
			return iconTabFilter;

		},
		updateTabView:function({viewName,tab,context,data}){
			this.views[viewName].setBindingContext(context,"template");
			this.views[viewName].getController().onBeforeShow && this.views[viewName].getController().onBeforeShow(tab,data);	
			tab.insertContent(this.views[viewName]);
			const tabName = tab.getProperty("text");
			const isVisible = this.getTabVisibility(tabName);
			tab.setProperty("visible", isVisible);
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
		_onObjectMatched: async function (oEvent) {
			this.sCountryCode = oEvent.getParameter("arguments").countryCode;
			this.sProductScope = oEvent.getParameter("arguments").productScope;
			this.sObjectId = oEvent.getParameter("arguments").objectId;
			this.sOfferId = oEvent.getParameter("arguments").offerId;
			this.layout = oEvent.getParameter("arguments").layout || "TwoColumnsMidExpanded";
			this.getModel("appView").setProperty("/layout", this.layout);
			// this.getModel("appView").setProperty("/editable", false);
			this.templateState = this.getOwnerComponent().getModel("template");
			this.templateStateData = this.templateState.getData();
			this.stState = this.getOwnerComponent().getModel("st");
			this.getModel('st').setProperty("/SelectedCountry", this.sCountryCode);

			this.setSelectedTabKey();

			this.getModel().metadataLoaded().then( async function() {
				const OfferStatus = await this.stState.getOfferStatus(this.sOfferId);
				!this.selectedOfferHasBinding() && this._bindView();
				this.updateVisibilityOfTabs(this.iconTabBar, OfferStatus?.STATUS);
			}.bind(this));
		},

		selectedOfferHasBinding: function(){
			const selectedOffer = this.getView().getBindingContext()?.getObject();
			if (selectedOffer && !selectedOffer.OfferID) selectedOffer.OfferID = "NA";
			return selectedOffer?.OfferID === this.sOfferId;
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: async function () {

			let sObjectPath = "";

			this.gettemplateConfig();

			// get awarded criteria of the selected tender 
			// this is needed at a later stage to check on existing Award Criteria
			this.getOwnerComponent().getModel().read("/PT_TMAWRDCR", {
				filters: [new sap.ui.model.Filter("TENDERID", sap.ui.model.FilterOperator.EQ, this.sObjectId)]
			});

			if(this.sOfferId && this.sOfferId !== "NA") {
				sObjectPath = this.getModel().createKey("TenderMasterView", {
					TenderID :  this.sObjectId,
					OfferID : this.sOfferId
				});
			}else {
				sObjectPath = this.getModel().createKey("TenderFormView", {
					TenderID :  this.sObjectId
				});
			}

			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);
			this.getModel("appView").setProperty("/editmode", false);

			this.getView().bindElement({
				path: "/" + sObjectPath,
				/*parameters: {
					expand: "Institute,Offer"
				},*/
				// events: {
				// 	change: this._onBindingChange.bind(this),
				// 	dataRequested: function () {
				// 		oViewModel.setProperty("/busy", true);
				// 	},
				// 	dataReceived: function () {
				// 		oViewModel.setProperty("/busy", false);
				// 	}
				// }
			});
		},
		gettemplateConfig: async function () {
			await this.templateState.read("DETAIL",{
				countryCode: this.sCountryCode,
				productScope: this.sProductScope,
				appID: "StandardTenders",
				page: "DETAIL",
				keys: {
					TenderID: this.sObjectId,
					OfferID: this.sOfferId
				}
			});
			this.createIconTab();
		},
		// _onBindingChange: function () {
		// 	var oView = this.getView(),
		// 		oElementBinding = oView.getElementBinding();

		// 	// No data for the binding
		// 	if (!oElementBinding.getBoundContext()) {
		// 		this.getRouter().getTargets().display("detailObjectNotFound");
		// 		// if object could not be found, the selection in the master list
		// 		// does not make sense anymore.
		// 		this.getOwnerComponent().oListSelector.clearMasterListSelection();
		// 		return;
		// 	}

		// 	var sPath = oElementBinding.getPath(),
		// 		oResourceBundle = this.getResourceBundle(),
		// 		oObject = oView.getModel().getObject(sPath),
		// 		sObjectId = oObject.TenderID,
		// 		sObjectName = oObject.TenderName,
		// 		oViewModel = this.getModel("detailView");

		// 	this.getOwnerComponent().oListSelector.selectAListItem(sPath);

		// 	oViewModel.setProperty("/shareSendEmailSubject",
		// 		oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
		// 	oViewModel.setProperty("/shareSendEmailMessage",
		// 		oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		// },

		_onMetadataLoaded: function () {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay();
			var oViewModel = this.getModel("detailView");
			var oLineItemTable = this.byId("lineItemsList");
			//iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			/*oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);

			oLineItemTable.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for line item table
				oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
			});

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);*/
		},

		onEdit: function () {
			const editmode = this.getModel("appView").getProperty("/editmode");
			this.getModel("appView").setProperty("/editmode", !editmode);
		},
		/**
		 * Set the full screen mode to false and navigate to master page
		 */
		onCloseDetailPress: function () {
			this.cancelAllPendingChanges();
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
			// No item should be selected on master after detail page is closed
			this.getOwnerComponent().oListSelector.clearMasterListSelection();
			this.getView().unbindElement();
			this.getRouter().navTo("master");
			this.getModel('st').setProperty("/selectedTab", "");
		},

		/**
		 * Toggle between full and non full screen mode.
		 */
		toggleFullScreen: function () {
			var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
			if (!bFullScreen) {
				// store current layout and go full screen
				this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
				this.getModel("appView").setProperty("/layout", "MidColumnFullScreen");
			} else {
				// reset to previous layout
				this.getModel("appView").setProperty("/layout", this.getModel("appView").getProperty("/previousLayout"));
			}
		},
		onTabSelect: function (event) {
			let hash = this.getRouter().getHashChanger().getHash();
			const offerId = this.sOfferId || this.getModel("st").getProperty("/SelectedTender/OfferID") || "NA";
			const selectedTabKey = event.getParameter("key").toLowerCase();
			this.changeHash({selectedTabKey, hash, offerId});
		},
		changeHash: function ({selectedTabKey, hash, offerId}) {
			hash = hash.split("/").splice(0, 4).join("/");
			switch (selectedTabKey) {
				case "tender":
					hash = hash + "/" + offerId;
					this.getRouter().getHashChanger().replaceHash(hash);
					break;
				case "offer":
					hash = hash + "/" + offerId + "/Offer";
					this.getRouter().getHashChanger().replaceHash(hash);
					break;
				case "overview":
					hash = hash + "/" + offerId + "/Overview";
					this.getRouter().getHashChanger().replaceHash(hash);
					break;
				case "awards":
					hash = hash + "/" + offerId + "/Awards";
					this.getRouter().getHashChanger().replaceHash(hash);
					break;
				case "delivery tracking":
					hash = hash + "/" + offerId + "/Deliveries";
					this.getRouter().getHashChanger().replaceHash(hash);
					break;
				default:
					break;
			}
		},

		/**
		 * This function is need to show correct selected tab after browser refresh button clicked
		 */
		setSelectedTabKey: function () {
			// Get the selectedTabKey from the URL hash
			const selectedTabKey = this.getRouter().getHashChanger().getHash().split("/").splice(5,1).join("");

			// Check and set selected Tab when open detail page
			if (selectedTabKey == "Deliveries") {
				this.getModel('st').setProperty("/selectedTab", "Delivery Tracking");
			}
			if (selectedTabKey == "Offer" || selectedTabKey == "Overview" || selectedTabKey == "Awards") {
				this.getModel('st').setProperty("/selectedTab", selectedTabKey);
			}

			// Check and set selected Tab when open detail detail page
			switch (selectedTabKey) {
				case "OfferProductDetail":
					this.getModel('st').setProperty("/selectedTab", "Offer");
					break;
				case "AwardedProduct":
					this.getModel('st').setProperty("/selectedTab", "Awards");
					break;
				case "Delivery":
					this.getModel('st').setProperty("/selectedTab", "Delivery Tracking");
					break;
				default:
					break;
			}
		}
	});

});