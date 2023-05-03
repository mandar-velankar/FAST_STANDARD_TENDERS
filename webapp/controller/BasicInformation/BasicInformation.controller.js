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
		onBeforeShow:function(){
			// get state data
			// this.templateState = this.getOwnerComponent().getModel("template");
			// this.templateStateData = this.templateState.getData();
			
			//this.getView().getBindingContext("template"); // get current tab data

		}
	});
});