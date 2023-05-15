sap.ui.define([
	"../BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/library",
	"sap/m/ColumnListItem",
	"sap/ui/model/Filter",
	"sap/m/MessageBox"
], function (BaseController, JSONModel, mobileLibrary, ColumnListItem, Filter,MessageBox) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return BaseController.extend("com.bayer.tender.statenderapp.controller.BasicInformation.BasicInformation", {

		onInit: function () {
		},
		onBeforeShow:async function(iconTabfilter,sObjectId){
			// get state data

			this.stState = this.getOwnerComponent().getModel("st");
			this.templateState = this.getOwnerComponent().getModel("template");
			this.templateStateData = this.templateState.getData();
			
			//this.getView().getBindingContext("template"); // get current tab data
			// await this.getOwnerComponent().getModel().metadataLoaded();
			this.objectId = sObjectId;
			this.selectedTab = iconTabfilter.getKey();

			if(this.selectedTab !== "Tender") return;

			const oModel = new JSONModel({
				busy: false,
				delay: 0,
				editMode: false,
			});
	
			this.setModel(oModel, "ui");

			this._bindForm("TenderForm");
			this._bindTable("AwardCriteria");

			// this.getView().setModel(new JSONModel({data: "0.34"}), "test");
		},

		/**
		 * This method binds a given form to its entity from the ui configuration template.
		 * FYI: the form ID in the View is a concatination of "id" + formName
		 * @param {*} formName FormName - The form name must exactly match the form name configured in the ui template configuration table in the DB
		 */
		_bindForm(formName){
			const entity = this.templateStateData.detailConfig.countryTemplate.getTemplate().getTab(this.selectedTab).getXMLView().getFormByName(formName).getEntity();
			const form = this.byId(`id${formName}`);
			let path = "";
			if (this.objectId) {
				path = this.getOwnerComponent().getModel().createKey(`/${entity}`, {
					TenderID: this.objectId,
				});
			} else {
				const newEntryContext = this.getOwnerComponent().getModel().createEntry(`/${entity}`, {});
				path = newEntryContext.getPath();
			}
			
			form?.bindElement({
				path: path,
			});
		},

		/**
		 * This method binds a given table to its entity from the ui configuration template.
		 * FYI: the table ID in the View is a concatination of "id" + tableName
		 * @param {*} formName FormName - The form name must exactly match the form name configured in the ui template configuration table in the DB
		 */
		_bindTable(tableName){
			const tableConfig =  this.templateStateData.detailConfig.countryTemplate.getTemplate().getTab(this.selectedTab).getXMLView().getTableByName(tableName);
			const entity = tableConfig.getEntity();
			const table = this.byId(`id${tableName}`);
			const cols = tableConfig.getColumns();
			
			table?.bindItems({
				path: `/${entity}`,
			  	filters: [
					new Filter("TenderID", "EQ", this.objectId)
				],
				//   model: '',
			  	template: new ColumnListItem({
					type: "Inactive",
					cells: cols.map(col => col.getControl().generateControl())
			  	}),
			  	templateShareable: true
			});
		},

		onTenderFormEditBtnPress: function(event){
			this.getModel("ui").setProperty('/editMode', true);
		},
		onTenderFormSaveBtnPress: function(event){
			this.getModel("ui").setProperty('/editMode', false);

			// Award Criteria	
			const isAwardCriteriaValid = this.validateAwardCriteria();
			if(!isAwardCriteriaValid) return;

			this.getOwnerComponent().getModel().submitChanges(
				{
					success: function(oData) {
						debugger;
					},
					error: function(oError){
						debugger;
					}
				}
			);
		},
		onTenderFormCancelBtnPress: function(event){
			this.getModel("ui").setProperty('/editMode', false);
			this.getOwnerComponent().getModel().resetChanges();
		},


		validateAwardCriteria: function () {

			let bValid = true;
			const aAwardCriteria = this.getView().byId("idAwardCriteria").getItems();

			//sum of all award criterias
			let sumWeight = 0;
			// let awardCriteriaName = [];

			//checks on mandatory fields & calulation of sumWeight
			aAwardCriteria.forEach(function (oAwardCriteria) {

				//get values
				// let sCriteria = oAwardCriteria.getCells()[0].getProperty("value");
				// let iWeight = parseInt(oAwardCriteria.getCells()[1].getProperty("value"));

				let weight = oAwardCriteria.getCells()[1].getBinding("value").getValue();
				sumWeight = sumWeight + weight;

				//Check that award criteria is complete, everything is filled
				// if (oAwardCriteria.getVisible()) {

				// 	//check if everything is filled
				// 	if (sCriteria === "" || iWeight === "") {
				// 		MessageBox.error("Award Criteria information incomplete.");
				// 		bValid = false;
				// 	}

				// 	//make sum of weights, so we can check afterwards they are not above 100%
				// 	sumWeight = sumWeight + iWeight;

				// 	//keep the awardcritiria names so we can check lateron for duplicates
				// 	awardCriteriaName.push(sCriteria);

				// }

			});

			//check that sum of all award criteria = 100
			// if (sumWeight !== 100 && awardCriteriaName.length !== 0) {
			// 	MessageBox.error("Sum of Award Criteria weight must be 100%");
			// 	return false;
			// }

			if (sumWeight > 0 && sumWeight < 1) {
				MessageBox.error("Sum of Award Criteria weight must be 100%");
				return false;
			}

			//check only unique award criteria names are there
			// var uniq = awardCriteriaName
			// 	.map((name) => {
			// 		return {
			// 			count: 1,
			// 			name: name
			// 		}
			// 	})
			// 	.reduce((a, b) => {
			// 		a[b.name] = (a[b.name] || 0) + b.count
			// 		return a
			// 	}, {});

			//if duplicates are found
			// var duplicates = Object.keys(uniq).filter((a) => uniq[a] > 1);
			// if (duplicates.length !== 0) {
			// 	MessageBox.error("Two award criteria cannot have the same name.");
			// 	bValid = false;
			// }

			return bValid;
		},

	});
});