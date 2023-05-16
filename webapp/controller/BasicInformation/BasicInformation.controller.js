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
			
			this.objectId = sObjectId;
			this.selectedTab = iconTabfilter.getKey();

			if(this.selectedTab !== "Tender") return; // TODO: this check is needed because onBeforeShow method is also triggered from other tabs. Wouter will implement a solution for this.

			this.defaultModel = this.getOwnerComponent().getModel();
			this.stState = this.getOwnerComponent().getModel("st");
			this.templateState = this.getOwnerComponent().getModel("template");
			this.templateStateData = this.templateState.getData();
			
			//this.getView().getBindingContext("template"); // get current tab data
			// await this.getOwnerComponent().getModel().metadataLoaded();

			this.oAwardCriteriaTable = this.getView().byId("idAwardCriteria");
			

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
			this.setAwardCriteriaPrendingChanges(this.defaultModel,this.oAwardCriteriaTable);

			this.defaultModel.submitChanges(); 
		},
		onTenderFormCancelBtnPress: function(event){
			this.getModel("ui").setProperty('/editMode', false);
			this.defaultModel.resetChanges();
		},


		/**
		 * This method changes/updates the odata model PendingChanges list which is used when triggering "submitChanges" method
		 * see https://ui5.sap.com/#/api/sap.ui.model.odata.v2.ODataModel%23methods/getObject
		 * 
		 * Context: in the View we have the AwardCriteria table binded to AwardCriteriaTableView which is a CDS view with joins.
		 * Since, at the moment, there are some limitations with custom event handler on view with joins, we are manipulation
		 * the pending changes on the odata model to send out different backend calls. 
		 */
		setAwardCriteriaPrendingChanges: function(oModel, oTable){
				
			const aItemContexts = oTable.getBinding("items").getContexts();
			aItemContexts?.forEach(ctx => {
				const awardCriteriObj = {
					TENDERID: ctx.getObject().TenderID,
					Active: 1,
					AwardCriteria: ctx.getObject().Criteria,
					COUNTRYCODE: ctx.getObject().CountryCode,
                	Weight: ctx.getObject().Weight
				}
				const sPath = oModel.createKey("/PT_TMAWRDCR", awardCriteriObj);
				const existingObj = oModel.getProperty(sPath);
				
				if(existingObj){
					oModel.setProperty(sPath+"/Weight", ctx.getObject().Weight)
				}else {
					oModel.createEntry("/PT_TMAWRDCR", {
						properties: awardCriteriObj
					});
				}
                
            });

			// remove unwanted changes from the oModel pending changes list
			oModel.resetChanges(aItemContexts.map(ctx => ctx.getPath()));
		},

		validateAwardCriteria: function () {

			let bValid = true;
			const aAwardCriteriaItems = this.getView().byId("idAwardCriteria").getItems();

			//sum of all award criterias
			let sumWeight = 0;
			
			//checks on mandatory fields & calulation of sumWeight
			aAwardCriteriaItems.forEach(function (oAwardCriteria) {
				let weight = oAwardCriteria.getCells()[1].getBinding("value").getValue();
				sumWeight = sumWeight + parseFloat(weight);
			});

			if (sumWeight > 0 && sumWeight !== 1) {
				MessageBox.error("Sum of Award Criteria weight must be 100%");
				this.getModel("ui").setProperty('/editMode', true);
				return false;
			}

			return bValid;
		},

	});
});