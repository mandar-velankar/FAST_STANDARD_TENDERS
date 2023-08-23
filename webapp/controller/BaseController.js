sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"../model/formatter",
	"../model/datatypes/CustomPercentageType",
	"../model/datatypes/CustomNumberType",
	"../model/datatypes/CustomDecimalType",
	"sap/ui/core/Fragment",
	"sap/m/MessagePopover",
	"sap/m/MessageItem",
	"sap/ui/model/json/JSONModel",
	"../service/StandardSingletonService",
], function (Controller, History, formatter, CustomPercentageType, CustomNumberType, CustomDecimalType, Fragment, MessagePopover, MessageItem, JSONModel, StandardSingletonService) {
	"use strict";

	return Controller.extend("com.bayer.tender.statenderapp.controller.BaseController", {

		formatter: formatter,

		customTypes: {
			percentage: CustomPercentageType,
			number: CustomNumberType,
			decimal: CustomDecimalType
		},

		/**
		 * Convenience method for accessing the router in every controller of the application.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter : function () {
			return this.getOwnerComponent().getRouter();
		},

		fieldsFactory: function (id, context) {
			const control = context.getObject();
			return control.generateControl();
		},

		sorterFactory: function (id, context) {
			const i18nModel = this.getModel("i18n");
			const index = parseInt(context.getPath().split('/').pop());
			const control = context.getObject();
			return control.generateViewSettingsItem(index, i18nModel);
		},

		/**
		 * Convenience method for getting the view model by name in every controller of the application.
		 * @public
		 * @param {string} sName the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel : function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model in every controller of the application.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel : function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Convenience method for getting the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle : function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Event handler for navigating back.
		 * It there is a history entry we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the master route.
		 * @public
		 */
		onNavBack : function() {
			var sPreviousHash = History.getInstance().getPreviousHash();

			if (sPreviousHash !== undefined) {
				// eslint-disable-next-line sap-no-history-manipulation
				history.go(-1);
			} else {
				this.getRouter().navTo("master", {}, true);
			}
		},
		onMessagePopoverPress : function (oEvent, sectionName) {
			const oSourceControl = oEvent.getSource();
			const popover = this.createMessagePopover(sectionName);
			const messagesModel = this.getModel("messages");
			popover.setModel(messagesModel, "messages");
			popover.openBy(oSourceControl)
			// this._getMessagePopover().then(function(oMessagePopover){
			// 	oMessagePopover.openBy(oSourceControl);
			// });
		},
		createMessagePopover: function (sectionName) {
			return new MessagePopover({
				items: {
					path: `messages>/${sectionName}`,
					template: new MessageItem({
						type: "{messages>type}",
						title: "{messages>message}",
						subtitle: "{messages>additionalText}",
						description: "{messages>description}"
					})
				}
			})
		},
		// _getMessagePopover: function () {
		// 	const oView = this.getView();

		// 	// create popover lazily (singleton)
		// 	if (!this._pMessagePopover) {
		// 		this._pMessagePopover = Fragment.load({
		// 			id: oView.getId(),
		// 			name: "com.bayer.tender.statenderapp.view.generic.fragments.MessagePopover"
		// 		}).then(function (oMessagePopover) {
		// 			oView.addDependent(oMessagePopover);
		// 			return oMessagePopover;
		// 		});
		// 	}
		// 	return this._pMessagePopover;
		// },

		cancelPendingChanges: function(entities, msgPropName){
			const targets = this.getTargets(entities);
			const messages = this.getMessages(entities);
			const messageManager = sap.ui.getCore().getMessageManager();
			messageManager.removeMessages(messages);
			this.getModel("messages").setProperty(`/${msgPropName}`, {});
			this.getOwnerComponent().getModel().resetChanges(targets);
		},

		cancelAllPendingChanges: function () {
			const messageManager = sap.ui.getCore().getMessageManager();
			messageManager.removeMessages();
			const msgSectionKeys = Object.keys(this.getModel("messages").getData());
			for (let key in msgSectionKeys) {
				this.getModel("messages").setProperty(`/${msgSectionKeys[key]}`, []);
			}
			this.getOwnerComponent().getModel().resetChanges();
		},
		/**
		 * This method returns the error messages from the MessageManager for a given entity
		 * @param {Boolean} el.persistent - When all errors solved MessageManager will automatically remove messages which persistent field is equal to false 
		 * @returns Array<Object<Message>>
		 */
		getMessages: function (entities) {
			return this.getModel("message").getData().filter(el => {
				let entityIndex = entities.findIndex(entity => el.target.toLowerCase().includes(entity.toLowerCase()));
				if(entityIndex > -1) {
					el.persistent = false;
					return el; 
				}
			});
		},
		
		removeMessages: function(messages, sectionName){
			const messagesArray = Array.isArray(messages) ? messages : [messages];
			const messagesInSection = this.getModel("messages").getProperty(`/${sectionName}`);
			const targetsToRemove = messagesArray.map(msg => {
				const targets = msg.getTargets ? msg.getTargets() : [];
				return targets;
			}).flat();
			const filteredMessages = messagesInSection.filter(msg => {
				const hasTarget = msg.getTargets ? msg.getTargets().some(target => targetsToRemove.includes(target)) : false;
				return !hasTarget;
			});
			this.getModel("messages").setProperty(`/${sectionName}`, filteredMessages);
		},

		/**
		 * This method returns the targets from the MessageMaager message for a given entity
		 * @returns Array<String> - Targets
		 */
		getTargets: function (entities) {
			const pendingChanges = this.getModel().getPendingChanges();
			return Object.keys(pendingChanges).filter(el => {
				const entityIndex = entities.findIndex(entity => el.toLowerCase().includes(entity.toLowerCase()));
				if (entityIndex > -1) return el; 
			}).map(e=>"/" + e);
		},
		setMessageSection: function (entities, sectionName) {
			const messages = this.getMessages(entities);
			this.getModel("messages").setProperty(`/${sectionName}`, messages);
		},

		/**
		 * Updates the visibility of tabs within an iconTabBar based on the given offer status.
		 * The function utilizes an enablement model to determine the visibility of tabs and updates
		 * the 'visible' property of each tab accordingly.
		 *
		 * @param {sap.m.IconTabBar} iconTabBar - The IconTabBar control whose tabs' visibility will be updated.
		 * @param {string} offerStatus - The status that influences the visibility of tabs.
		 */

		updateVisibilityOfTabs: function (iconTabBar, offerStatus) {
			this.updateEnablementModel(offerStatus);
			if (!iconTabBar) return;
			const tabs = iconTabBar.getAggregation("items");
			tabs.forEach(tab => {
				const tabName = tab.getProperty("text");
				const isTabVisible = this.getTabVisibility(tabName);
				tab.setProperty("visible", isTabVisible);
			});
		},

		getTabVisibility: function (tabName) {
			const enablementModel = this.getModel("em");
			let isVisible = "";
			switch (tabName) {
				case "Tender":
					isVisible = enablementModel.getProperty("/Detail/TenderTab/isVisible");
					break;
				case "Offer":
					isVisible = enablementModel.getProperty("/Detail/OfferTab/isVisible");
					break;
				case "Overview":
					isVisible = enablementModel.getProperty("/Detail/OverviewTab/isVisible");
					break;
				case "Awards":
					isVisible = enablementModel.getProperty("/Detail/AwardTab/isVisible");
					break;
				case "Delivery Tracking":
					isVisible = enablementModel.getProperty("/Detail/DeliveryTrackingTab/isVisible");
					break;
				default:
					break;
			}
			return isVisible;
		},

		updateEnablementModel: async function (offerStatus) {
			const obj = StandardSingletonService.getEnablementObject(offerStatus);
			const enablementModel = new JSONModel(obj);
			this.getOwnerComponent().setModel(enablementModel, 'em');
		},
	});

});