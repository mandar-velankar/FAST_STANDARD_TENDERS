sap.ui.define([
	"../BaseController",
	"sap/ui/model/json/JSONModel",
	"../../model/formatter",
	"sap/m/library",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Context",
	"sap/ui/core/Fragment",
	"sap/ui/model/Sorter",
	"sap/ui/core/BusyIndicator"
], function (BaseController, JSONModel, formatter, mobileLibrary, Filter, FilterOperator, Context, Fragment, Sorter, BusyIndicator) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return BaseController.extend("com.bayer.tender.statenderapp.controller.Information.Information", {
		formatter: formatter,
		onInit: function () {
			// set message model
			this.oMessageManager = sap.ui.getCore().getMessageManager();
			this.getView().setModel(this.oMessageManager.getMessageModel(), "message");
			
			this.stState = this.getOwnerComponent().getModel("st");

			// activate automatic message generation for complete view
			this.oMessageManager.registerObject(this.getView(), true);
			this.getRouter().getRoute("objectDetailOverview").attachPatternMatched(this._onObjectMatched, this);

		},
		onBeforeShow: async function (iconTabfilter,{objectId, offerId, countryCode}) {
			// Store parameters
			this.templateState = this.getOwnerComponent().getModel("template");
			this.templateStateData = this.templateState.getData();
			this.oOwnerComponent = this.getOwnerComponent();
			this.oRouter = this.oOwnerComponent.getRouter();
			this.defaultModel = this.getOwnerComponent().getModel();
			
			this.tenderId = objectId;
			this.offerId = offerId;
			this.countryCode = countryCode;
			this.selectedTab = iconTabfilter.getKey();
			this.stState = this.getOwnerComponent().getModel("st");
		
			// Calculate dates
			const today = new Date();
			const maxDate = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate());
		
			// Initialize model
			const oModel = new JSONModel({
				busy: false,
				delay: 0,
				editMode: false,
				minDate: today,
				maxDate: maxDate,
				OverviewForm: { editMode: false },
				enableApprovalButton: false,
				isCHCountrySelected: this.countryCode?.toLowerCase()?.includes('-ch'),
				OverviewPriceConditionTableSpain: {
					pvl: [],
					precioNeto: [],
					descuentoComercial: [],
					descuentoEspecial: [],
					rappel: [],
					foc: [],
					rental: []
				},
				isOfferHavingOnlyTMApproverTypePending: false
			});
		
			this.setModel(oModel, "ui");
		
			//Bind views
			this.bindFields();
		
			// Load all data in parallel
			this._loadInformationData();
		},

		_loadInformationData: async function() {
			try {	
				const [
					focInfo,
					tenderData,
					approvalCheck,
					wordTemplates,
					excelTemplates,
					// Spain-specific (if needed)
					spainConstraints
				] = await Promise.all([
					this.offerId && this.offerId !== "NA" 
						? this.bindProductFOCInformationTable(this.countryCode, this.offerId)
						: Promise.resolve(null),
					
					this.stState.getService().getTender(this.tenderId), 
					this.approvalButtonEnableCheck(),                  
					this.assignWordTemplates(),                  
					this.assignExcelTemplates(),            
					
					// Spain-specific data (conditional)
					this.countryCode === "ES" 
						? this.stState.getContractMngtDateConstraints(this.tenderId, this.offerId, this.countryCode)
						: Promise.resolve(null)
				]);
		
				// Store tender data
				this.selectedTender = tenderData;
		
				// Update approval status
				this.getModel("ui").setProperty("/enableApprovalButton", approvalCheck);
		
				// Spain-specific logic
				if (this.countryCode === "ES" && spainConstraints) {
					this.getModel("st").setProperty("/ContractMngtDateConstraints", spainConstraints);
					this._createPriceConditionTableEntitiesOnQuotationTabForSpain();
				}
		
			} catch (error) {
				console.error("Error loading information:", error);
			}
		},

		onCloseApprovalDialog: function(){
			this.byId("idApprovalsPopup").close();
		},

		assignWordTemplates: async function(){
			return new Promise((resolve, reject) => {
				this.getModel().read("/WordTemplateCountry", {
					filters: [
						new Filter("countryCode", "EQ", this.countryCode)
					],
					success: function (res) {
						let allWordCountryTemplates = res?.results;
						resolve(allWordCountryTemplates);
					}
				});
			}).then(data => {
				this.getModel("ui").setProperty("/WordTemplateCountry", data);
			});
		},

		assignExcelTemplates: async function(){
			return new Promise((resolve, reject) => {
				this.getModel().read("/ExcelTemplateCountry", {
					filters: [
						new Filter("countryCode", "EQ", this.countryCode)
					],
					success: function (res) {
						let allExcelCountryTemplates = res?.results;
						resolve(allExcelCountryTemplates);
					}
				});
			}).then(data => {
				this.getModel("ui").setProperty("/ExcelTemplateCountry", data);
			});
		},

		onDownloadWord:function(event){
			const url = `/v2/sta_tender/WordAttachments(templateId=${event.getSource().getBindingContext("ui").getProperty("templateId")},offerId='${this.offerId}')/content`;
			URLHelper.redirect(url,true);
			this.byId('idDownloadAttachmentButton')?.setText('Download'); // selecting one of the templates will overwrite the text of the main "download" button with the description of the selected template. 
		},

		onDownloadPdf: async function(event){
			const url = `/v2/sta_tender/WordAttachments(templateId=${event.getSource().getBindingContext("ui").getProperty("templateId")},offerId='${this.offerId}')/content`;
			const selectedOffer = await this.stState.getService().getOffer(this.offerId);
			const selectedTender = await this.stState.getService().getTender(this.tenderId);
			this.defaultModel.createEntry("/PdfEmail", {
				properties: {
					URL: url,
					TenderID: this.tenderId,
					OfferID: this.offerId,
					TenderInstitute: String(selectedTender?.InstituteID),
					OfferInstitute: this.countryCode === 'PK' ? String(selectedOffer?.QuotationInstituteID) : String(selectedOffer?.InstituteID),
					UserEmail: "",
					UserName: "",
					Sent: false
				},
				groupId: 'PdfEmail',
			})
			return new Promise((resolve, reject) => {
				this.defaultModel.submitChanges({groupId: 'PdfEmail'});
				// selecting one of the templates will overwrite the text of the main "download" button with the description of the selected template.
				this.byId('idDownloadAttachmentButton')?.setText('Download');
			}); 
		},

		onDownloadExcel:function(event){
			const url = `/v2/sta_tender/ExcelAttachments(templateId=${event.getSource().getBindingContext("ui").getProperty("templateId")},offerId='${this.offerId}')/content`;
			URLHelper.redirect(url,true);
			this.byId('idDownloadAttachmentButton')?.setText('Download'); // selecting one of the templates will overwrite the text of the main "download" button with the description of the selected template. 
		},

		/**
		 * 
		 * @returns This methods includes logic to enable/disable the ApprovalButton
		 */
		approvalButtonEnableCheck: async function () {
			return new Promise((resolve, reject) => {
				this.getModel().read("/ProductPricesCheckView", {
					filters: [
						new Filter("OfferID", "EQ", this.offerId)
					],
					success: function (res) {
						let allProductPricesSet = res?.results[0]?.allProductPricesSet;
						resolve(allProductPricesSet);
					}
				});
			}).then(data => {
				this.getModel("ui").setProperty("/enableApprovalButton", data);
			})
		},

		bindFields: function () {
			if (this.offerId && this.offerId !== "NA") {
				this.bindTable();
				this.bindForm(this.selectedTab);
			}
		},
		_onObjectMatched: async function (oEvent) {
			this.countryCode = oEvent.getParameter("arguments").countryCode;
			this.tenderId = oEvent.getParameter("arguments").objectId;
			this.offerId = oEvent.getParameter("arguments").offerId;
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			// this.getModel("appView").setProperty("/editable", false);
			this.templateState = this.getOwnerComponent().getModel("template");
			this.templateStateData = this.templateState.getData();			
			this.bindFields();
			if(this.offerId && this.offerId !== "NA"){await this.bindProductFOCInformationTable(this.countryCode, this.offerId);}
			await this.approvalButtonEnableCheck();
			this.countryCode === "ES" && this._createPriceConditionTableEntitiesOnQuotationTabForSpain();
			//this.getOwnerComponent().getModel().refresh(true);			
		},
		bindForm: async function (tabName) {
			const overviewForm = this.byId("idOverviewForm");
			const entity = this.templateStateData.detailConfig.countryTemplate.getTemplate().getTab(tabName).getXMLView().getFormByName("OverviewForm").getEntity();
			const path = this.getOwnerComponent().getModel().createKey(`/${entity}`, {
				OFFERID: this.offerId,
				groupId: "OverviewForm"
			});
			const context = new Context(this.getModel(), path);
			overviewForm.setBindingContext(context);
			await this.getOfferValidation(this.offerId);
			overviewForm.setBindingContext(context);
			
		},
		bindTable: function () {
			const prodInfoTable = this.byId("idProductInformationTable");
			const prodInfoTemplate = prodInfoTable.getBindingInfo("items").template;
			prodInfoTable.bindItems({
				path: "/OfferProductValidation",
				filters: [
					new Filter({
						path: "OFFER_ID",
						operator: FilterOperator.EQ,
						value1: this.offerId
					}),
				],
				template: prodInfoTemplate
			})
		},
		
		onOverviewTenderFormEditBtnPress: function(event){
			this.getModel("ui").setProperty('/OverviewForm/editMode', true);
		},
		onOverviewTenderFormSaveBtnPress: function(event){
			if (this.getTargets(["OfferValidation"]).length > 0) {
				this.setMessageSection(["OfferValidation"], "overviewTenderFormMsg");

				this.defaultModel.submitChanges({
					success: this.onOverviewTenderFormSuccess.bind(this),
					groupId: "OverviewForm"
				}); 
			}else {
				this.onOverviewTenderFormCancelBtnPress();
			}
		},
		onOverviewTenderFormSuccess: function(res){
			const hasErrorMessages = this.getMessages(["OfferValidation"]).length > 0;
			if (!hasErrorMessages) {
				this.getModel("ui").setProperty('/OverviewForm/editMode', false);
				this.stState.getService().resetOfferApprovalSent(this.offerId).then((data) => {
					this.getOwnerComponent().getEventBus().publish("MasterTableUpdateChannel", "MasterTableUpdateEvent");
				});
			}
		},

		onOverviewTenderFormCancelBtnPress: function(event){
			this.cancelPendingChanges(["OfferValidation"], "overviewTenderFormMsg");
			this.getModel("ui").setProperty('/OverviewForm/editMode', false);
		},
		getOfferValidation: async function (offerId) {
			return new Promise((resolve, reject) => {
				this.getModel().read("/OfferValidation", {
					filters: [
						new Filter("OFFERID", "EQ", offerId)
					],
					success: function (res) {
						resolve(res)
					}
				});
			});
		},

		calculateTotalAmount: function (offer) {
			const unit = offer.UNIT;
			const currency = offer.CURRENCY || "";
			const region = offer.Region || "";
			let totalAmount = "";
			switch (unit) {
				case "Unit":
					totalAmount = offer.REQUESTED_QUANTITY * offer.NET_PRICE_UNIT_OFFER_CURRENCY;
					break;
				case "Pack":
					totalAmount = offer.REQUESTED_QUANTITY * offer.NET_PRICE_PACK_OFFER_CURRENCY;
					break;
				default:
					break;
			}
			return formatter.formatCurrency(totalAmount, currency, region);
		},

		formatApprovalStatus: function (approvalStatus) {
			try {
				switch(approvalStatus) {
				  case "Approved":
				    return "Success";
				  case "Rejected":
				    return "Error";
				  case "Waiting":
				  	return "Warning";
				  case "Notification Sent":
				  	return "Success";
				  default:
				    return "None";
				}
			} catch (err) {
				return "None";
			}
		},

		formatHierarchy: function(approverTypes){
			if(approverTypes){
				return this.getModel().getProperty(`/${approverTypes[0]}/Hierarchy`);
			}
		},

		formatSendingEnabled: function (ApprovalStatus, ApproverTypeSection) {
			//enable disable
			var bEnabled;
			
			
			//check status & approvertype
			if(
				ApprovalStatus !== 'Waiting'
				&& ApprovalStatus !== 'Processing'
				&& ApprovalStatus !== 'Cancelling'
				&& !(ApproverTypeSection === 1) //not mandatory
			){
				//only Approved, rejected or notification sent, send will be enabled to resend approvals
				bEnabled = true;
			}else{
				bEnabled = false;
			}
			
			return bEnabled;
		},

		onApprovalsPress : async function () {
			this.getView().setBusy(true);
			
			await this._createApprovalsDialog();
			await this._bindApprovalsTable();
			await this._bindApprovalsForm();
			this.countryCode === "PL" && await this.getPolandOffersWithOnlyTMPending();


			this.getView().setBusy(false);
		},

		_createApprovalsDialog: async function(){
			
			let that = this;

			if (!this.byId("idApprovalsPopup")) {
				this.approvalsDialog = await Fragment.load({
					id: that.getView().getId(),
					name: "com.bayer.tender.statenderapp.view.overview.fragments.Approvals",
					controller: that,
				}).then(function (oDialog) {
					oDialog.setResizable(true);
					oDialog.setStretch(true);
					that.getView().addDependent(oDialog);
					oDialog.open();
				});
			}else {
				this.byId("idApprovalsPopup").open();
			}
		},

		_filterApprovalTypes: async function (){
			const oApprovalsTableBinding = this.byId("idMandatoryTable").getBinding("items");
			const orFilters = [
				new Filter("OfferId",FilterOperator.EQ, this.offerId)
			]
			oApprovalsTableBinding.filter(orFilters);
		},

		_enableApprovalCancelButtons: async function(){
			const offerStatus = await this.stState.getOfferStatus(this.offerId);

			//enable / disable buttons
			this.byId("btnCancelApproval").setEnabled(offerStatus.STATUS === "Awaiting Approval" ? true : false);
			this.byId("btnSendApproval").setEnabled(offerStatus.STATUS === 'Offer Created' && offerStatus.STATUS !== "Awaiting Approval" && offerStatus.STATUS !== "Quotation Submitted" && offerStatus.STATUS !== "Results Recorded" && offerStatus.STATUS !== "In FOC Negotiation" && offerStatus.STATUS !== "Appeal in Progress" && offerStatus.STATUS !== "Delivery Ongoing" ? true : false);
		},

		_showApprovalsPricingError: async function(){
			const offerProductValidation = await this.stState.getOfferProductValidation(this.offerId);

			let aProductsNotValid = [];
			let productNames = [];
			if(Array.isArray(offerProductValidation)){
				aProductsNotValid = offerProductValidation.filter(product => product.IN_POLICY !== true);
				productNames = aProductsNotValid.map(product => product.PRODUCTNAME);
			}

			if(!Array.isArray(offerProductValidation) && offerProductValidation.IN_POLICY !== true){
				aProductsNotValid.push(offerProductValidation);
				productNames.push(offerProductValidation.PRODUCTNAME);
			}

			if(aProductsNotValid.length > 0 ){
				sap.m.MessageBox.error(`The following products do not have prices that comply with their pricing policy: \n\n ${productNames.join()}`);
			}
		},

		_bindApprovalsForm: async function () {
			
			const offerValidation = this.getOwnerComponent().getModel().getProperty(`/OfferValidation('${this.offerId}')`);

			if(offerValidation.IN_POLICY === false){
				// await this._showApprovalsPricingError();
			} else {
				await this._filterApprovalTypes();
				await this._enableApprovalCancelButtons();
				this._setApprovalsPopupGrouping();
			} 
		},

		_setApprovalsPopupGrouping: function(){
			//Set grouping Mandatory or Optional
			let mGroupFunctions = {
				MandatoryOptional: function (oContext) {
					var sApproverTypeSection = oContext.getProperty("ApproverTypeSection");
					var key, text;

					//check for approvertypes that indicate they are mandatory approvers
					if (sApproverTypeSection === 1) {
						//Mandatory
						key = "Mandatory";
						text = "Mandatory Approvals";
					} else {
						key = "Optional";
						text = "Optional Approvals";
					} 
					return {
						key: key,
						text: text
					};
				}
			};

			//Actual grouping & apply the selected group settings
			const aGroups = [new Sorter("ApproverTypeSection", false,  mGroupFunctions["MandatoryOptional"])];
			this.byId("idMandatoryTable")?.getBinding("items")?.sort(aGroups);

		},

		_bindApprovalsTable: function () {
			const approversTable = this.byId("idMandatoryTable");
			const approversTemplate = approversTable.getBindingInfo("items").template;
			approversTable.bindItems({
				path: "/OfferProductOfferStatus",
				filters: [
					new Filter({
						path: "OfferId",
						operator: FilterOperator.EQ,
						value1: this.offerId
					}),
				],
				parameters: {
					expand: "ApproverList,ApproverTypes"
				},
				groupId: "Approvals",
				template: approversTemplate
			})
		},

		onSendApprovalRequest: function(event){
			this.setMessageSection(["OfferProductOfferStatus"], "approvalMsg");
			this.setApprovalsPendingChanges(this.defaultModel,this.byId("idMandatoryTable"), true);

			this.defaultModel.submitChanges({
				success: this._onSubmitChangesApprovalsSuccess.bind(this),
				groupId: "Approvals"
			}); 
		},

		onCancelApprovalRequest: function(event){
			this.setMessageSection(["OfferProductOfferStatus"], "approvalMsg");
			this.setApprovalsPendingChanges(this.defaultModel,this.byId("idMandatoryTable"), false);

			this.defaultModel.submitChanges({
				success: this._onSubmitChangesApprovalsSuccess.bind(this),
				groupId: "Approvals"
			});
		},

		_onSubmitChangesApprovalsSuccess: async function(res){
			await this._enableApprovalCancelButtons();
			this.cancelPendingChanges(["OfferProductOfferStatus"], "approvalMsg");
			this.getOwnerComponent().getEventBus().publish("MasterTableUpdateChannel", "MasterTableUpdateEvent");
		},

		/**
		 * This method changes/updates the odata model PendingChanges list which is used when triggering "submitChanges" method
		 * see https://ui5.sap.com/#/api/sap.ui.model.odata.v2.ODataModel%23methods/getObject
		 * 
		 * Context: in the View we have the AwardCriteria table binded to AwardCriteriaTableView which is a CDS view with joins.
		 * Since, at the moment, there are some limitations with custom event handler on view with joins, we are manipulation
		 * the pending changes on the odata model to send out different backend calls. 
		 */
		setApprovalsPendingChanges: function(oModel, oTable, isSend){
				
			// const aItemContexts = oTable.getBinding("items").getContexts();
			const aItems = oTable.getItems().filter(el => el.getBindingContext().getPath().includes('/OfferProductOfferStatus'));

			aItems?.forEach(item => {
				const approvalObj = {
					OfferId: item.getBindingContext().getObject().OfferId,
					ApproverType: item.getBindingContext().getObject().ApproverType,
				}

				const sPath = oModel.createKey("/OfferProductOfferStatus", approvalObj);
				const existingObj = oModel.getProperty(sPath);
					
				if(existingObj){
					if (isSend) {
						if (existingObj.ApproverTypeSection == 1) {
							oModel.setProperty(sPath+"/send", 'Yes');
							oModel.setProperty(sPath+"/ApprovalStatus", "Processing");
						}else {
							oModel.setProperty(sPath+"/send", existingObj.send);
							oModel.setProperty(sPath+"/ApprovalStatus", existingObj.send === "Yes" ? "Processing" : "Not Sent");
						}
					}else {
						if (existingObj.ApproverTypeSection == 1) {
							oModel.setProperty(sPath+"/send", 'No');
							oModel.setProperty(sPath+"/ApprovalStatus", "Cancelling");
						}else {
							oModel.setProperty(sPath+"/send", existingObj.send);
							oModel.setProperty(sPath+"/ApprovalStatus", existingObj.ApprovalStatus === "Processing" ? "Cancelling" : "Not Sent");
						}
					}
				}else {
					oModel.createEntry("/OfferProductOfferStatus", {
						properties: approvalObj,
						groupId: "Approvals"
					});
				}
			});
		},

		onChangeApproverName: function (event) {
			const source = event.getSource();
			const context = source.getBindingContext();
			const selectedItem = source.getSelectedItem().getBindingContext().getObject();
			const path = context.getPath();

			this.getModel().setProperty(`${path}/ApproverEmailID`, selectedItem.ApproverEmailID);
			this.getModel().setProperty(`${path}/ApproverName`, selectedItem.ApproverName);
		},

		_submitOfferValidation: function() {
			return new Promise((resolve) => {
				const startTime = Date.now();
				console.log(`[SubmitOfferValidation] START - ${new Date().toISOString()}`);
				
				if (this.getTargets(["OfferValidation"]).length > 0) {
					this.setMessageSection(["OfferValidation"], "overviewTenderFormMsg");
					
					this.defaultModel.submitChanges({
						groupId: "OverviewForm",
						success: (res) => {
							console.log(`[SubmitOfferValidation] SUCCESS - ${Date.now() - startTime}ms`);
							this.onOverviewTenderFormSuccess(res);
							resolve(true);
						},
						error: (err) => {
							console.error(`[SubmitOfferValidation] ERROR - ${err.message} - ${Date.now() - startTime}ms`);
							resolve(false);
						}
					});
				} else {
					console.warn(`[SubmitOfferValidation] No targets to save`);
					this.onOverviewTenderFormCancelBtnPress();
					resolve(false);
				}
			});
		},

		onSubmitQuotation: async function(){
			const startTime = Date.now();
			console.log(`[SubmitQuotation] START - OfferID: ${this.offerId} - Timestamp: ${new Date().toISOString()}`);
			
			try {
				this.cancelPendingChanges(["OfferValidation"], "OverviewForm");
				this.defaultModel.setProperty(`/OfferValidation('${this.offerId}')/Submitted`, true);
				
				const saveSuccess = await this._submitOfferValidation();
				
				if (saveSuccess) {
					console.log(`[SubmitQuotation] OfferValidation saved - ${Date.now() - startTime}ms`);
					await this.createNewAwardedProducts(startTime);
				} else {
					console.error(`[SubmitQuotation] OfferValidation save failed - ${Date.now() - startTime}ms`);
					sap.m.MessageBox.error("Failed to save quotation. Awarded products not created.");
				}
			} catch (error) {
				console.error(`[SubmitQuotation] ERROR - ${error.message} - ${Date.now() - startTime}ms`);
				sap.m.MessageBox.error("Error submitting quotation: " + error.message);
			}
		},
		
		createNewAwardedProducts: async function(parentStartTime) {
			const startTime = Date.now();
			console.log(`[CreateAwardedProducts] START - OfferID: ${this.offerId} - ${new Date().toISOString()}`);
			
			try {
				const offerProductInfoTable = this.byId("idProductInformationTable");
				
				if (!offerProductInfoTable) {
					console.error(`[CreateAwardedProducts] Table not found`);
					sap.m.MessageBox.error("Product table not found");
					return;
				}
				
				await new Promise((resolve) => {
					const checkBinding = () => {
						const binding = offerProductInfoTable.getBinding("items");
						if (binding && binding.isA("sap.ui.model.odata.v2.ODataListBinding")) {
							const contexts = binding.getContexts();
							if (contexts && contexts.length > 0) {
								console.log(`[CreateAwardedProducts] Table binding ready - ${contexts.length} products`);
								resolve();
							} else {
								console.warn(`[CreateAwardedProducts] Table binding ready but no products found`);
								resolve();
							}
						} else {
							setTimeout(checkBinding, 100);
						}
					};
					checkBinding();
				});
				
				const classification = this.selectedTender?.Classification;
				const itemContexts = offerProductInfoTable.getBinding("items").getContexts();
				
				console.log(`[CreateAwardedProducts] Creating ${itemContexts.length} awarded products`);
				
				if (itemContexts.length === 0) {
					console.warn(`[CreateAwardedProducts] No products to create`);
					return;
				}
				
				itemContexts.forEach((prod, index) => {
					const product = prod.getObject();
					console.log(`[CreateAwardedProducts] Product ${index + 1}/${itemContexts.length}: ${product.PRODUCTNAME}`);
					
					this.defaultModel.createEntry("/AwardedProducts", {
						properties: {
							TenderID: product.TENDER_ID,
							OfferID: product.OFFER_ID,
							CountryCode: product.COUNTRY_CODE,
							LotID: product.LOTID,
							ProductCode: product.PRODUCTID,
							AwardedProduct: product.PRODUCTNAME,
							AwardedCompany: "Bayer",
							UoM: product.UNIT,
							AwardedPrice: this.countryCode === 'TW' || this.countryCode === 'ES' 
								? product.NET_PRICE 
								: product.OFFER_PRICE,
							AwardedQty: product.REQUESTED_QUANTITY,
							ErrorInSubmission: "No",
							Outcome: this.countryCode === 'ES' 
								? classification === 'Commercial Agreement' ? 'Won' : null 
								: null,
						},
						groupId: "AwardedProduct"
					});
				});
				
				await new Promise((resolve, reject) => {
					this.defaultModel.submitChanges({
						groupId: "AwardedProduct",
						success: (res) => {
							console.log(`[CreateAwardedProducts] SUCCESS - ${Date.now() - startTime}ms`);
							this._onSubmitChangesNewAwardedProductsSuccess(res, parentStartTime);
							resolve(res);
						},
						error: (err) => {
							console.error(`[CreateAwardedProducts] ERROR - ${err.message} - ${Date.now() - startTime}ms`);
							reject(err);
						}
					});
				});
			} catch (error) {
				console.error(`[CreateAwardedProducts] EXCEPTION - ${error.message} - ${Date.now() - startTime}ms`);
				sap.m.MessageBox.error("Failed to create awarded products: " + error.message);
			}
		},
		_onSubmitChangesNewAwardedProductsSuccess: async function (res, parentStartTime) {
			const startTime = parentStartTime || Date.now();
			console.log(`[AwardedProductsSuccess] START - ${new Date().toISOString()}`);
			
			const offerStatus = await this.stState.getService().getOfferStatus(this.offerId);
			this.getOwnerComponent().getEventBus().publish("MasterTableUpdateChannel", "MasterTableUpdateEvent");
			this.getOwnerComponent().getEventBus().publish("masterChannel", "statusChanged", {
				offerStatus: offerStatus?.STATUS
			});
			
			console.log(`[AwardedProductsSuccess] COMPLETE - Total time: ${Date.now() - startTime}ms - Status: ${offerStatus?.STATUS}`);
		},

		bindProductFOCInformationTable: async function(countryCode, offerId){
			return new Promise((resolve, reject) => {
				this.getModel().read("/StandardTenderFOCInformation", {
					filters: [
						new Filter("CountryCode", "EQ", countryCode),
						new Filter("OfferID", "EQ", offerId)
					],
					success: function (res) {
						resolve(res)
					}
				});
			}).then(data => {
				this.getModel("ui").setProperty("/StandardTenderFOCInformation", data.results);
			})
		},

		/**
		 * This method creates entities to be used for the binding of the Price Condition 
		 * tables on the Quotation tab for Spain.
		 */
		_createPriceConditionTableEntitiesOnQuotationTabForSpain: function(){ 
			const uiModel = this.getModel("ui");
			const OfferProductValidation = this.stState.getProperty("/OfferProductsValidations");

			const tableData = {
				pvl: [],
				precioNeto: [],
				descuentoComercial: [],
				descuentoEspecial: [],
				rappel: [],
				foc: [],
				rental: []
			};

			// create PriceConditionTableEntities
			OfferProductValidation.forEach(prd => {
				const priceConditions = prd.PriceCondition.results;
				priceConditions.forEach(pc => {
					const data = {
						SORTER: prd.SORTER,
						PRODUCTNAME: prd.PRODUCTNAME,
						PACKSIZE: prd.PACKSIZE,
						REQUESTED_QUANTITY: prd.REQUESTED_QUANTITY,
						REQ_PRICE_UNIT_OFFER_CURRENCY: prd.REQ_PRICE_UNIT_OFFER_CURRENCY,
						CURRENCY: prd.CURRENCY || "",
						IS_LOWEST: prd.IS_LOWEST,
						REQ_PRICE_PACK_OFFER_CURRENCY: prd.REQ_PRICE_PACK_OFFER_CURRENCY,
						GROSS_SALES_OFFER_CURRENCY: prd.GROSS_SALES_OFFER_CURRENCY,
						PAID_VOLUME: prd.PAID_VOLUME,
						UNIT: prd.UNIT,
						PriceCondition: pc
					};
					const conditionType = formatter.replaceString(pc.PriceConditionClassification.ConditionType);
					switch(conditionType){
						case "PVL": tableData.pvl.push(data);
									break;
						case "Precio Neto": tableData.precioNeto.push(data);
									break;
						case "Descuento Comercial": tableData.descuentoComercial.push(data);
									break;
						case "Descuento Especial": tableData.descuentoEspecial.push(data);
									break;
						case "Rappel": tableData.rappel.push(data);
									break;
						case "FOC": tableData.foc.push(data);
									break;
						case "Rental": tableData.rental.push(data);
									break;
						default : console.error(`ConditionType ${conditionType} does not exist`); 
									break;
					}
				});
			});


			// add Tax to each DiscountCondition entity
			tableData.rappel.forEach(rappelCondition => {
				rappelCondition.PriceCondition.DiscountCondition.results = rappelCondition.PriceCondition.DiscountCondition.results.map(dc => ({...dc, Tax: rappelCondition.PriceCondition.Tax}))
			});

			// flatten/unpack foc entities
			tableData.foc = [].concat.apply([], tableData.foc.map(focCondition => focCondition.PriceCondition.FreeGoodsOther.results.map(foc => ({...focCondition, ...foc}))));
			
			this.stState.setProperty("/OverviewPriceConditionTableSpain", tableData);
		},

		/**
		 * Click handler for VolumeTreshhold fragment on the Quotation page
		 * @param {*} oEvent 
		 */
		onVolumeTreshholdPress: function(oEvent){
			const that = this;
            const oView = this.getView();
			const oContext = oEvent.getSource().getParent().getBindingContext('st');

            // create dialog lazily
            if (!this.pDialog) {
                this.pDialog = Fragment.load({
                    id: oView.getId(),
                    name: "com.bayer.tender.statenderapp.view.overview.fragments.VolumeTreshhold_ES_Display",
                    controller: this
                }).then(function (oDialog) {
                    // connect dialog to the root view of this component (models, lifecycle)
                    oView.addDependent(oDialog);
                    oDialog.setModel(that.stState, "st");
                    return oDialog;
                });
            }

            this.pDialog.then(function (oDialog) {
				const oTable = this.byId("idVolumeTresholdDisplay");
				oTable.setBindingContext(oContext, "st");
                oDialog.open();
            }.bind(this));

        },


		onCancelDiscountCondition:function(){
			const dialog = this.byId("idESVolumeThresholdDialog");
            if(dialog) dialog.close();
        },

		getPolandOffersWithOnlyTMPending: async function () {
			const uiModel = this.getModel("ui");
			const offer = await this.stState.getService().getPolandOffersWithOnlyTMPending(this.offerId);
			uiModel.setProperty("/isOfferHavingOnlyTMApproverTypePending", !!offer);
		},

		onApproveTMApprovalType: async function (event) {
			try {
				BusyIndicator.show(1);
				const payload = {
					ApprovalStatus: "Approved"
				}

				await this._updateTMApproverType(payload);
				BusyIndicator.hide();
			} catch (error) {
				BusyIndicator.hide();
				return error;
			}
		},

		onRejectTMApprovalType: async function (event) {
			try {
				BusyIndicator.show(1)
				const payload = {
					ApprovalStatus: "Rejected"
				}

				await this._updateTMApproverType(payload);
				BusyIndicator.hide();
			} catch (error) {
				BusyIndicator.hide();
				return error;
			}
		},

		_updateTMApproverType: async function (payload) {
			const table = this.byId("idMandatoryTable");
			const tableBinding = table.getBinding("items");
			const tenderMangerObject = tableBinding?.getContexts()?.map(el => el?.getObject())?.find(el => el.ApproverType === 'TM');
			const {products} = await this.stState.getService().getOfferProducts(this.offerId);
			payload = {
				...payload,
				SenderComment: tenderMangerObject.SenderComment
			}
			const promises = products.map(pr => this.stState.getService().updateApprovalTypeStatus(payload, {
				OfferId: tenderMangerObject.OfferId,
				productcode: pr.ProductCode,
				ApproverEmailID: tenderMangerObject.ApproverEmailID,
				Active: tenderMangerObject.Active,
				Statustime: tenderMangerObject.Statustime,
				ApproverType: tenderMangerObject.ApproverType,
				LotID: 1
			}));

			await Promise.all(promises);
			await this.getPolandOffersWithOnlyTMPending();
			tableBinding.refresh();
			this.getModel('em').setProperty("/Detail/OverviewTab/Approval/isPolandTMApproveButtonVisible", false);
		}
	})
});