sap.ui.define([
	"../BaseController",
	"../../model/formatter",
	"sap/ui/model/json/JSONModel",
	"sap/m/library",
	"sap/m/Token",
	"sap/m/ColumnListItem",
	"sap/ui/model/Filter",
	"sap/m/MessageBox",
	"sap/ui/core/message/Message",
	"sap/ui/core/Fragment",
	"sap/ui/core/library"
], function (BaseController, formatter, JSONModel, mobileLibrary, Token, ColumnListItem, Filter,MessageBox,Message,Fragment,library) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;
	var MessageType = library.MessageType;

	return BaseController.extend("com.bayer.tender.statenderapp.controller.BasicInformation.BasicInformation", {

		formatter: formatter,

		onInit: function () {
			// set message model
			this.oMessageManager = sap.ui.getCore().getMessageManager();
			this.getView().setModel(this.oMessageManager.getMessageModel(), "message");

			// activate automatic message generation for complete view
			this.oMessageManager.registerObject(this.getView(), true);
			const oModel = this.getOwnerComponent().getModel();
			

		},
		onBeforeShow:async function(iconTabfilter,{objectId, offerId, countryCode, productScope}){
			
			this.objectId = objectId;
			this.selectedTab = iconTabfilter.getKey();
			this.countryCode = countryCode;

			if (this.selectedTab !== "Tender" && this.selectedTab !== "Price Request") return;
			 // TODO: this check is needed because onBeforeShow method is also triggered from other tabs. Wouter will implement a solution for this.

			this.defaultModel = this.getOwnerComponent().getModel();
			this.stState = this.getOwnerComponent().getModel("st");
			this.templateState = this.getOwnerComponent().getModel("template");
			this.templateStateData = this.templateState.getData();
			this.productScope = productScope; 
			this.selectedTender = await this.stState.getService().getTender(this.objectId);
			//this.getView().getBindingContext("template"); // get current tab data
			// await this.getOwnerComponent().getModel().metadataLoaded();

			this.oAwardCriteriaTable = this.getView().byId("idAwardCriteria");
			

			const oModel = new JSONModel({
				busy: false,
				delay: 0,
				editMode: false,
				AwardCriteria:{
					editMode: false
				},
				TenderForm:{
					editMode: false	
				}
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
				const newEntryContext = this.getOwnerComponent().getModel().createEntry(`/${entity}`, {
					groupId: "Basicinfo"
				});
				path = newEntryContext.getPath();
			}

			form?.bindElement({
				path: path,
				groupId: "Basicinfo",
				events: {
					change: () => {
						let multiInputCustomField = this.getMultiInputCustomField(this.countryCode, form);
						let cs  =  form?.getElementBinding()?.getBoundContext()?.getProperty(`${multiInputCustomField.customFieldName}`);
						const instituteType = form?.getElementBinding()?.getBoundContext()?.getProperty("InstituteType");
						multiInputCustomField.control?.removeAllTokens();
						if (this.countryCode === "GB") {
							this.setRegionsFieldVisible(form, instituteType);
						}else if (this.countryCode === "NL") {
							this.setInstitutesinGroupFieldVisible(form, cs);
						}

						if(cs){
							const separator = this.countryCode === "NL" ? ";" : ",";
							for(const value of cs.split(separator)){

								multiInputCustomField.control?.addToken(new Token({key: value, text:value}));

							}
						}
					},

					dataReceived: () => {
						let multiInputCustomField = this.getMultiInputCustomField(this.countryCode, form);
						let cs  =  form?.getElementBinding()?.getBoundContext()?.getProperty(`${multiInputCustomField.customFieldName}`);
						const instituteType = form?.getElementBinding()?.getBoundContext()?.getProperty("InstituteType");
						multiInputCustomField.control?.removeAllTokens();
						if (this.countryCode === "GB") {
							this.setRegionsFieldVisible(form, instituteType);
						}else if (this.countryCode === "NL") {
							this.setInstitutesinGroupFieldVisible(form, cs);
						}

						if(cs){
							const separator = this.countryCode === "NL" ? ";" : ",";
							for(const value of cs.split(separator)){

								multiInputCustomField.control?.addToken(new Token({key: value, text:value}));

							}
						}
					}
				}
			});
		},

		/**
		 * This function return the "Custom_String_2" defined as "Regions" field on the tender basic information tab
		 * @param {*} form 
		 * @returns 
		 */
		getRegionCustomString: function (form){
			const formContainers = form.getAggregation("formContainers");
			let regionsField;
			formContainers.forEach(forContainer => {
				if(forContainer.getAggregation("title") === 'Institute & Type'){
					const formElements = forContainer.getAggregation("formElements");
					formElements.forEach(formElement => {
						if(formElement.getAggregation("label") === 'Regions'){
							regionsField = formElement.getAggregation("fields")[0];
						}
					});
				};
			});
			return regionsField;
		},

		getInstituteInBranchCustomString: function (form){
			const formContainers = form.getAggregation("formContainers");
			let instituteInBranch;
			formContainers.forEach(forContainer => {
				if(forContainer.getAggregation("title") === 'Institute & Type' || forContainer.getAggregation("title") === "機構及類型"){
					const formElements = forContainer.getAggregation("formElements");
					formElements.forEach(formElement => {
						if(formElement.getAggregation("label") === 'Institute In Branch' || formElement.getAggregation("label") === "分院研究所"){
							instituteInBranch = formElement.getAggregation("fields")[0];
						}
					});
				};
			});
			return instituteInBranch;
		},

		getInstituteInGroupField: function (form){
			const formContainers = form.getAggregation("formContainers");
			let institutesInGroup;
			formContainers.forEach(forContainer => {
				if(forContainer.getAggregation("title") === 'Institute & Type'){
					const formElements = forContainer.getAggregation("formElements");
					formElements.forEach(formElement => {
						if(formElement.getAggregation("label") === 'Institutes In Group'){
							institutesInGroup = formElement.getAggregation("fields")[0];
						}
					});
				};
			});
			return institutesInGroup;
		},

		getMultiInputCustomField: function (countryCode, form) {
			if (countryCode === "TW") {
				return {
					customFieldName: "Custom_String_3",
					control: this.getInstituteInBranchCustomString(form)
				}
			}
			if (countryCode === "NL") {
				return {
					customFieldName: "Custom_String_3",
					control: this.getInstituteInGroupField(form)
				}
			}
			return {
				customFieldName: "Custom_String_2",
				control: this.getRegionCustomString(form)
			}
		},

		setRegionsFieldVisible: function (form, instituteType) {
			const regionsField = form.getAggregation("formContainers")
			.find(el => el.getAggregation("title") === "Institute & Type").getAggregation("formElements")
			.find(el => el.getAggregation("label") === "Regions");

			if (instituteType === "Region(s)") {
				regionsField.setVisible(true);
			}else {
				regionsField.setVisible(false);
			}
		},

		setInstitutesinGroupFieldVisible: function (form, cs) {
			const path = form?.getElementBinding()?.getBoundContext().getPath();
			const institutesInGroup = form.getAggregation("formContainers")
				.find(el => el.getAggregation("title") === "Institute & Type").getAggregation("formElements")
				.find(el => el.getAggregation("label") === "Institutes In Group");

			institutesInGroup.setVisible(!!cs);
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
			  	templateShareable: true,
				groupId: "AwardCriteria"
			});
		},

		onTenderFormEditBtnPress: async function(event){
			this.cancelPendingChanges(["TenderFormView"], "basicInfoMsg");	
			if (this.countryCode === "TW") {
				const parentInstituteID = await this.getParentInstituteID(this.countryCode, this.selectedTender.InstituteID);
				const path = this.getModel().createKey("/TenderFormView", {
					TenderID: this.objectId
				});
				this.getModel().setProperty(`${path}/ParentInstituteID`, parentInstituteID);
			}
			this.getModel("ui").setProperty('/TenderForm/editMode', true);
		},
		onTenderFormSaveBtnPress: function(event){

			const messages = this.getMessages(["TenderFormView"]);
			const form = this.byId(`idTenderForm`);
			const separator = this.countryCode === 'NL' ? ';' : ',';
			let multiInputCustomField = this.getMultiInputCustomField(this.countryCode, form);
			this.oMessageManager.removeMessages(messages); // This is needed to clear unwanted messages in the MessageManager
			this.defaultModel.setProperty(form?.getBindingContext()?.getPath() + `/${multiInputCustomField.customFieldName}`, multiInputCustomField.control?.getTokens()?.reduce((prev,token,idx)=>
			prev?`${prev}${separator}${token.getText()}`:token.getText(),""));
			this.defaultModel.setProperty(form?.getBindingContext()?.getPath() + "/ExternalID", this.productScope); //for mandatory field check in sta-service
			this.defaultModel.submitChanges({
				error: this._onSubmitChangesFail.bind(this),
				success: this._onSubmitChangesTenderFormSuccess.bind(this),
				groupId: "Basicinfo"
			}); 
		},

		_onSubmitChangesFail: function(error){
			// not implemented
		},

		_onSubmitChangesTenderFormSuccess: function(res){
			const messages = this.getMessages(["TenderFormView"]);
			this.setMessageSection(["TenderFormView"], "basicInfoMsg");
			const hasErrorMessages = messages.length > 0;
			!hasErrorMessages && this.getModel("ui").setProperty('/TenderForm/editMode', false);
			this.getOwnerComponent().getEventBus().publish("OfferProductsTableChannel", "updateOfferProductsTable");
		},

		onTenderFormCancelBtnPress: function(event){
			this.cancelPendingChanges(["TenderFormView"], "basicInfoMsg");	
			this.getModel("ui").setProperty('/TenderForm/editMode', false);

			if (this.countryCode === "TW") {
				const tenderForm = this.byId("idTenderForm");
				const instInBranchField = tenderForm.getAggregation("formContainers")
						.find(el => el.getAggregation("title") === "Institute & Type" || el.getAggregation("title") === "機構及類型").getAggregation("formElements")
						.find(el => el.getAggregation("label") === "Institute In Branch" || el.getAggregation("label") === "分院研究所").getFields()[0];
				const obj = tenderForm.getBindingContext().getObject();
				instInBranchField.removeAllTokens();
				for(const value of obj.Custom_String_3.split(",")){
					instInBranchField.addToken(new Token({key: value, text:value}));
				}
			}
		},
		
		onAwardCriteriaEditBtnPress: function(event){
			this.getModel("ui").setProperty('/AwardCriteria/editMode', true);
		},
		onAwardCriteriaSaveBtnPress: function(event){

			// const messages = this.getMessages("AwardCriteriaTableView");
			// this.oMessageManager.removeMessages(messages);
			
			// Award Criteria	
			const isAwardCriteriaValid = this.validateAwardCriteria(event);
			this.setMessageSection(["AwardCriteriaTableView"], "awardCriteriaMsg");
			if(!isAwardCriteriaValid) return;
			this.setAwardCriteriaPrendingChanges(this.defaultModel,this.oAwardCriteriaTable);

			this.defaultModel.submitChanges({
				success: this._onSubmitChangesAwardCriteriaSuccess.bind(this),
				groupId: "AwardCriteria"
			}); 
		},
		_onSubmitChangesAwardCriteriaSuccess: function(res){
			const hasErrorMessages = this.getMessages(["AwardCriteriaTableView"]).length > 0;
			!hasErrorMessages && this.getModel("ui").setProperty('/AwardCriteria/editMode', false);
		},

		onAwardCriteriaCancelBtnPress: function(event){
			this.cancelPendingChanges(["AwardCriteriaTableView"], "awardCriteriaMsg");
			this.getModel("ui").setProperty('/AwardCriteria/editMode', false);
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
						properties: awardCriteriObj,
						groupId: "AwardCriteria"
					});
				}
                
            });

			// remove unwanted changes from the oModel pending changes list
			oModel.resetChanges(aItemContexts.map(ctx => ctx.getPath()));
		},

		validateAwardCriteria: function (event) {

			let bValid = true;
			const aAwardCriteriaItems = this.getView().byId("idAwardCriteria").getItems();
			const controller = this;

			//sum of all award criterias
			let sumWeight = 0;
			let contextPath = [];
			
			//checks on mandatory fields & calulation of sumWeight
			aAwardCriteriaItems.forEach(function (oAwardCriteria) {
				contextPath.push(oAwardCriteria.getBindingContextPath());
				let weight = oAwardCriteria.getBindingContext().getProperty("Weight");
				sumWeight = sumWeight + Number(weight) * 100;
			});

			if (Number.isNaN(sumWeight) || sumWeight !== 100) {
				const target = this._createTarget(contextPath);
				const messages = this.getMessages(target);

				if(messages.length === 0){
					const msg = new Message({
						message: "Sum of Award Criteria weight must be 100%",
						type: MessageType.Error,
						target: target,
						processor: this.getView().getModel()
					});
					sap.ui.getCore().getMessageManager().addMessages(msg);
				}
				
				this.getModel("ui").setProperty('/editMode', true);
				return false;
			}

			return bValid;
		},
		_createTarget: function (contextPath) {
			return contextPath.map((path) => {
				return `${path}/Weight`;
			})
		},

		getParentInstituteID: async function (countryCode, instituteID) {
			return new Promise((resolve, reject) => {
				this.getModel().read("/InstitutesView", {
					filters: [
						new Filter("CountryCode", "EQ", countryCode),
						new Filter("InstituteID", "EQ", instituteID),
					],
					success: function (res) {
						resolve(res.results[0].ParentInstituteID)
					},
					error: function (err) {
						reject(err)
					}
				});
			});
		},
		// onMessagePopoverPress : function (oEvent) {
		// 	const oSourceControl = oEvent.getSource();
		// 	this._getMessagePopover().then(function(oMessagePopover){
		// 		oMessagePopover.openBy(oSourceControl);
		// 	});
		// },

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
		// }

	});
});