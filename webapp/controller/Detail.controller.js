sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/core/ComponentContainer",
	"sap/m/library",
	"sap/m/IconTabFilter",
	"sap/ui/core/mvc/XMLView"
], function (BaseController, JSONModel, formatter, ComponentContainer, mobileLibrary, IconTabFilter, XMLView) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return BaseController.extend("com.bayer.tender.statenderapp.controller.Detail", {

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
			this.getRouter().getRoute("offerProductDetail").attachPatternMatched(this._onObjectMatched, this);
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
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
		tabsFactory: function (id, context) {
			const tab = context.getObject();
			const xmlView = tab.getXMLView();
			

			const iconTabfilter = new IconTabFilter({
				text: "{template>title}",
				key: "{template>title}"
			}); 

			xmlView && XMLView.create({
				viewName: `com.bayer.tender.statenderapp.view.${tab.title.toLowerCase()}.views.${xmlView.getName()}`,
				viewId: `id${xmlView.getName()}`,
				type: sap.ui.core.mvc.ViewType.XML
			}).then(view => {
				view.setBindingContext(context,"template");
				view.getController().onBeforeShow && view.getController().onBeforeShow(iconTabfilter,{objectId:this.sObjectId,offerId:this.sOfferId,countryCode:this.sCountryCode});
				iconTabfilter.insertContent(view);
			});
			return iconTabfilter;

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
			this.sObjectId = oEvent.getParameter("arguments").objectId;
			this.sOfferId = oEvent.getParameter("arguments").offerId;
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			// this.getModel("appView").setProperty("/editable", false);

			this.templateState = this.getOwnerComponent().getModel("template");
			this.templateStateData = this.templateState.getData();
			
			await this.templateState.read("DETAIL",{
				countryCode: "BR"||this.sCountryCode,// TODO: this is hardcoded country. We need to remove the hard coded value once we have more country config
				appID: "StandardTenders",
				page: "DETAIL",
				keys: {
					TenderID: this.sObjectId,
					OfferID: this.sOfferId
				}
			});

			// get awarded criteria of the selected tender 
			// this is needed at a later stage to check on existing Award Criteria
			this.getOwnerComponent().getModel().read("/PT_TMAWRDCR", {
				filters: [new sap.ui.model.Filter("TENDERID", sap.ui.model.FilterOperator.EQ, this.sObjectId)]
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
			
			// this.getView().bindElement({
			// 	path: path,
			// 	//`/${this.GenericFormStateData.countryTemplate.getTemplate().getEntity()}`,
			// 	// model: 'data'
			// });

			this.getModel().metadataLoaded().then( function() {
			 	var sObjectPath = this.getModel().createKey("TenderMasterView", {
			 		TenderID :  this.sObjectId,
					OfferID : this.sOfferId
			 	});
			 	this._bindView("/" + sObjectPath);
			}.bind(this));
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function (sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);
			this.getModel("appView").setProperty("/editmode", false);

			this.getView().bindElement({
				path: sObjectPath,
				/*parameters: {
					expand: "Institute,Offer"
				},*/
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function () {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.TenderID,
				sObjectName = oObject.TenderName,
				oViewModel = this.getModel("detailView");

			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

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
			sap.ui.getCore().getMessageManager().removeAllMessages();
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
			// No item should be selected on master after detail page is closed
			this.getOwnerComponent().oListSelector.clearMasterListSelection();
			this.getRouter().navTo("master");
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
		}
	});

});