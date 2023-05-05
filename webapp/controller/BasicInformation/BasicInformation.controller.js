sap.ui.define([
	"../BaseController",
	"sap/ui/model/json/JSONModel",
	"../../model/formatter",
	"sap/m/library"
], function (BaseController, JSONModel, formatter, mobileLibrary) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return BaseController.extend("com.bayer.tender.statenderapp.controller.BasicInformation.BasicInformation", {

		onInit: function () {
		},
		onBeforeShow:async function(iconTabfilter,sObjectId){
			// get state data
			this.templateState = this.getOwnerComponent().getModel("template");
			this.templateStateData = this.templateState.getData();
			
			//this.getView().getBindingContext("template"); // get current tab data
			await this.getOwnerComponent().getModel().metadataLoaded();
			const selectedTab = iconTabfilter.getKey();
			const entity = this.templateStateData.detailConfig.countryTemplate.getTemplate().getTab(selectedTab).getXMLView().getFormByName("TenderForm").getEntity();
			const tenderForm = this.byId("idTenderForm");
			let path = "";
			if (sObjectId) {
				path = this.getOwnerComponent().getModel().createKey(`/${entity}`, {
					TenderID: sObjectId,
				});
			} else {
				const newEntryContext = this.getOwnerComponent().getModel().createEntry(`/${entity}`, {});
				path = newEntryContext.getPath();
			}
			
			tenderForm.bindElement({
				path: path,
			});

		}
	});
});