sap.ui.define([
	"../BaseController",
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
	"../../model/formatter",
	"sap/m/ColumnListItem",
	"sap/ui/core/Item",
	"sap/m/MessageToast",
	"../../service/StandardSingletonService",
	"sap/ui/core/EventBus",
	"sap/m/library",
    "../../model/datatypes/CustomDateType"
], function (BaseController, Component, ComponentContainer, JSONModel, Filter, FilterType, Sorter, FilterOperator, GroupHeaderListItem, Device, Fragment, formatter, ColumnListItem, Item, MessageToast, StandardSingletonService, EventBus, mobileLibrary, CustomDateType) {
	"use strict";
	var URLHelper = mobileLibrary.URLHelper;
	return BaseController.extend("com.bayer.tender.statenderapp.controller.SalesReport.SalesReport", {

		formatter: formatter,
		// oCountryCodeFilter: new Filter("COUNTRYCODE", FilterOperator.EQ, "AR"),

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
		 * @public
		 */
		onInit: function () {
			// Control state model
			var oList = this.byId("genericMasterTable")

			this._oList = oList;
			// keeps the filter and search state
			this._oListFilterState = {
				aFilter: [],
				aSearch: []
			};

			this.orFilters = [];
			this.andFilters = [];

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			/*oList.attachEventOnce("updateFinished", function(){
				// Restore original busy indicator delay for the list
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});*/

			// this.getView().addEventDelegate({
			// 	onBeforeFirstShow: function () {
			// 		this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
			// 	}.bind(this)
			// });

			this.getRouter().attachBypassed(this.onBypassed, this);

			// set message model
			this.oMessageManager = sap.ui.getCore().getMessageManager();
			this.getView().setModel(this.oMessageManager.getMessageModel(), "message");

			// activate automatic message generation for complete view
			this.oMessageManager.registerObject(this.getView(), true);

			this.stState = this.getOwnerComponent().getModel("st");
		},

		onCountriesReceived: async function (oEvent) {
			const sCountryCode = this.getModel("st").getProperty("/SelectedCountry") || oEvent?.getParameter("data")?.results[0]?.CountryCode || oEvent.getParameter("selectedItem")?.getBindingContext()?.getProperty("CountryCode"); // we default to first country in the list
			const userFullName = oEvent?.getParameter("data")?.results[0]?.UserName || oEvent.getParameter("selectedItem")?.getBindingContext()?.getProperty("UserName")
			const userID = oEvent?.getParameter("data")?.results[0]?.CWID || oEvent.getParameter("selectedItem")?.getBindingContext()?.getProperty("CWID")
			const userEmail = oEvent?.getParameter("data")?.results[0]?.UserEmail || oEvent.getParameter("selectedItem")?.getBindingContext()?.getProperty("UserEmail")
			this.getModel("st").setProperty("/UserFullName", userFullName);
			this.getModel("st").setProperty("/UserID", userID);
			this.getModel("st").setProperty("/UserEmail", userEmail);
			this.getView().getModel('st').setProperty("/SelectedCountry", sCountryCode);
			this.countryCode = sCountryCode;
			this.userId = userID;
			this.bindTenderIds();
			this.bindWholesalers(sCountryCode);
			this.bindCountryBrands(sCountryCode);
			this.bindUserTerritories(sCountryCode);
			this.onFilter();
			const userInfo = await this.stState.getService().getUserInfo(userID);
			this.getModel("st").setProperty("/UserInfo", userInfo);
		},

		bindTenderIds: function () {
			const oSelectTenderIDs = this.byId("idSalesReportTenderID");
			const controller = this;
			const selectedBrand = this.byId("idSalesReportBrand").getSelectedKey();
			const selectedProduct = this.byId("idSalesReportProduct").getSelectedKey();
			const selectedInstituteType = this.byId("idSalesReportInstituteType").getSelectedKey();
			const selectedInstitute = this.byId("idSalesReportInstitute").getSelectedKey();

			// Build filters dynamically based on selections
			const filters = [new Filter('createdBy', FilterOperator.EQ, this.userId)];

			if (selectedBrand && !selectedBrand.toLowerCase().includes("all")) {
				filters.push(new Filter("BrandId", FilterOperator.EQ, selectedBrand));
			}
			if (selectedProduct && !selectedProduct.toLowerCase().includes("all")) {
				filters.push(new Filter("ProductPackID", FilterOperator.EQ, selectedProduct));
			}
			if (selectedInstituteType && !selectedInstituteType.toLowerCase().includes("all")) {
				filters.push(new Filter("InstituteType", FilterOperator.EQ, selectedInstituteType));
			}
			if (selectedInstitute && !selectedInstitute.toLowerCase().includes("all")) {
				filters.push(new Filter("InstituteID", FilterOperator.EQ, selectedInstitute));
			}

			oSelectTenderIDs?.bindItems({
				path: "/SalesReportTenderView",
				filters: filters,
				sorter: new Sorter({
					path: 'TenderID',
					descending: false
				}),
				template: new Item({
					key: "{TenderID}",
					text: "{TenderID}"
				}),
				templateShareable: true,
				events: {
                    dataReceived: function(event) {
                        let items = event.getParameter("data").results || [];

						// Add "All" option to the items array
						items.unshift({
							TenderID: "All",
							CountryCode: this.countryCode
						});

						// Manually set the filtered data back to the list control
                        oSelectTenderIDs.destroyItems();
                        items.forEach(item => {
                            oSelectTenderIDs.addItem(new Item({
                                key: item.TenderID,
                                text: item.TenderID
                            }));
                        });

                        controller.stState.setProperty('/SelectedTenderId', "All");
						controller.onFilter();
                    }
                }
			});
		},

		bindWholesalers: function (countryCode) {
			const wholesalerList = this.byId('idSalesReportWholesaler');
            const controller = this;
            wholesalerList.bindItems({
                path: '/PT_TMDIST',
                filters: [
                    new Filter('CountryCode', FilterOperator.EQ,countryCode),
                    new Filter('ClaimEligible', FilterOperator.EQ, 'Yes'),
                    new Filter('DistributorName', FilterOperator.NE, 'Defined at results Level'),
                    new Filter('ActiveRecord', FilterOperator.EQ, 'Yes')
                ],
                template: new Item({
                    key: "{DistributorID}",
                    text: "{DistributorName}"
                }),
                events: {
                    dataReceived: function(event) {
                        let data = event.getParameter("data").results || [];

                        // Optionally, set the first item as selected
                        const firstDistributorID = data[0]?.DistributorID;
                        controller.stState.setProperty('/SelectedWholesaler', firstDistributorID);
                    }
                }
            });
        },

		bindCountryBrands: function (countryCode) {
            const brandsList = this.byId('idSalesReportBrand');
            const controller = this;
            brandsList.bindItems({
                path: "/CountryTenderBrands",
                filters: [
                    new Filter("COUNTRYCODE", FilterOperator.EQ, countryCode)
                ],
                sorter: new Sorter({
                    path: 'BRANDNAME',
                    descending: false
                }),
                template: new Item({
                    key: "{BRANDID}",
                    text: "{BRANDNAME}"
                }),
                templateShareable: true,
                events: {
                    dataReceived: function(data) { 
                        const brandId = data.getParameter('data')?.results?.[0]?.BRANDID;
                        controller.stState.setProperty('/SelectedBrandID', brandId);
						controller.bindCountryBrandProducts(brandId, countryCode);
                        controller.onFilter();
                    }
                }
            });
        },

		bindCountryBrandProducts: function(event){
			const brandProductList = this.byId('idSalesReportProduct');
			const brandId = this.stState.getProperty('/SelectedBrandID');
            const controller = this;
			const filters = [
				new Filter("COUNTRY_CODE", FilterOperator.EQ, this.countryCode)
			];
			if (brandId !== 'All_Brands') {
				filters.push(new Filter("BRAND_ID", FilterOperator.EQ, brandId));
			}
            brandProductList.bindItems({
                path: "/CountryBrandProducts",
                filters: filters,
                sorter: new Sorter({
                    path: 'PRODUCT_NAME',
                    descending: false
                }),
                template: new Item({
                    key: "{PRODUCT_ID}",
                    text: "{PRODUCT_NAME}"
                }),
                templateShareable: true,
                events: {
                    dataReceived: function(data) { 
                        const items = data.getParameter('data')?.results || [];

						// Add "All" option to the items array
						items.unshift({
							PRODUCT_ID: "All_Products",
							PRODUCT_NAME: "All",
							COUNTRY_CODE: this.countryCode
						});

						// Manually set the filtered data back to the list control
                        brandProductList.destroyItems();
                        items.forEach(item => {
                            brandProductList.addItem(new Item({
                                key: item.PRODUCT_ID,
                                text: item.PRODUCT_NAME
                            }));
                        });

						// Default selection to "All"
						controller.stState.setProperty('/SelectedProductId', "All_Products");
						controller.bindTenderIds();
						controller.onFilter();
                    }
                }
            });
		},

		bindUserTerritories: function(countryCode){
			const territoryList = this.byId('idSalesReportKAMTerritory');
            const controller = this;
			const filters = [
				new Filter("CountryCode", FilterOperator.EQ, countryCode)
			];
            territoryList.bindItems({
                path: "/SalesReportInstitutesView",
                filters: filters,
				sorter: new Sorter({
                    path: 'Territory',
                    descending: false
                }),
                template: new Item({
                    key: "{Territory}",
                    text: "{Territory}"
                }),
                templateShareable: true,
                events: {
                    dataReceived: function(data) { 
                        const items = (data.getParameter('data')?.results || [])
                    .filter(item => item.Territory && item.Territory.trim() !== "");

						// Add "All" option to the items array
						items.unshift({
							Territory: "All",
							CountryCode: this.countryCode
						});

						// Manually set the filtered data back to the list control
                        territoryList.destroyItems();
                        items.forEach(item => {
                            territoryList.addItem(new Item({
                                key: item.Territory,
                                text: item.Territory
                            }));
                        });

						// Default selection to "All"
						controller.stState.setProperty('/SelectedTerritory', "All");
						controller.stState.setProperty("/SalesReportInstitutesView", items);

						controller.bindInstituteType(items);
                		controller.bindInstitute(items);

						controller.onFilter();
                    }
                }
            });
		},

		bindInstituteType: function (items) {
			const instituteTypeList = this.byId('idSalesReportInstituteType');
		
			// Extract unique Institute Types
			const instituteTypes = items
				.filter(item => item.InstituteType && item.InstituteType.trim() !== "")
				.map(item => item.InstituteType)
				.filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
		
			// Add "All" option for Institute Type
			const instituteTypeOptions = [{ InstituteType: "All" }];
			instituteTypes.forEach(type => {
				instituteTypeOptions.push({ InstituteType: type });
			});
		
			// Update the Institute Type dropdown
			instituteTypeList.destroyItems();
			instituteTypeOptions.forEach(option => {
				instituteTypeList.addItem(new Item({
					key: option.InstituteType,
					text: option.InstituteType
				}));
			});
		
			// Default selection for Institute Type
			this.stState.setProperty('/SelectedInstituteType', "All");
		},
		
		bindInstitute: function (items) {
			const instituteList = this.byId('idSalesReportInstitute');
		
			// Extract unique Institutes
			const institutes = items
				.filter(item => item.InstituteName && item.InstituteName.trim() !== "")
				.map(item => ({ InstituteID: item.InstituteID, InstituteName: item.InstituteName }))
				.filter((value, index, self) =>
					self.findIndex(v => v.InstituteID === value.InstituteID) === index);
		
			// Add "All" option for Institutes
			const instituteOptions = [{ InstituteID: "All", InstituteName: "All" }];
			institutes.forEach(inst => {
				instituteOptions.push(inst);
			});
		
			// Update the Institute dropdown
			instituteList.destroyItems();
			instituteOptions.forEach(option => {
				instituteList.addItem(new Item({
					key: option.InstituteID,
					text: option.InstituteName
				}));
			});
		
			// Default selection for Institute
			this.stState.setProperty('/SelectedInstitute', "All");
		
		},

		onTerritoryChange: function(event) {
			const selectedTerritory = event.getSource().getSelectedKey();
			const controller = this;
			const allData = this.stState.getProperty("/SalesReportInstitutesView");
		
			// Filter Institute Types and Institutes based on Territory
			const filteredData = allData.filter(item => 
				selectedTerritory === "All" || item.Territory === selectedTerritory
			);
		
			this.bindInstituteType(filteredData);
    		this.bindInstitute(filteredData);
			controller.onFilter();
		},
		
		onInstituteTypeChange: function(event) {
			const selectedInstituteType = event.getSource().getSelectedKey();
			const selectedTerritory = this.byId("idSalesReportKAMTerritory").getSelectedKey();
			const controller = this;
			const allData = this.stState.getProperty("/SalesReportInstitutesView");
		
			// Filter Institutes based on Territory and Institute Type
			const filteredData = allData.filter(item => 
				(selectedTerritory === "All" || item.Territory === selectedTerritory) &&
				(selectedInstituteType === "All" || item.InstituteType === selectedInstituteType)
			);
		
			this.bindInstitute(filteredData);
			this.bindTenderIds();
			
			controller.onFilter();
		},

		onFilter: function () {
            this.setFilter();
        },

        setFilter: async function (event) {
            this.orFilters = [];
			this.andFilters = [];
            const salesDetailTable = this.byId('idSalesDetailTable');
            const binding = salesDetailTable.getBinding('items');
			const salesOverviewTable = this.byId('idSalesOverviewTable');
			const overviewBinding = salesOverviewTable.getBinding('rows');
            const stState = this.stState;
            const dateFrom = this.byId("idSalesReportFromDate").getDateValue();
            const dateTo = this.byId("idSalesReportToDate").getDateValue();
            const selectedDateFrom = new CustomDateType().getModelFormat().format(dateFrom);
            const selectedDateTo = new CustomDateType().getModelFormat().format(dateTo);

            // Dropdown filters
			// Country Filter
			const countrySelectedItem = this.byId("idSalesReportCountry")?.getSelectedItem();
			const countryCode = countrySelectedItem?.getKey() || stState.getProperty('/SelectedCountry');
			if (countryCode) {
				this.andFilters.push(new Filter({
					path: "CountryCode",
					operator: FilterOperator.EQ,
					value1: countryCode
				}));
			}
		
			// Tender ID Filter
			const tenderSelectedItem = this.byId("idSalesReportTenderID")?.getSelectedItem();
			const tenderID = tenderSelectedItem?.getKey();
			if (tenderID && !tenderID.toLowerCase().includes("all")) {
				this.andFilters.push(new Filter({
					path: "TenderID",
					operator: FilterOperator.EQ,
					value1: tenderID
				}));
			}
		
			// Wholesaler Filter
			const wholesalerSelectedItem = this.byId("idSalesReportWholesaler")?.getSelectedItem();
			const wholesalerID = wholesalerSelectedItem?.getKey();
			if (wholesalerID && !wholesalerID.toLowerCase().includes("all")) {
				this.andFilters.push(new Filter({
					path: "DistributorID",
					operator: FilterOperator.EQ,
					value1: wholesalerID
				}));
			}
		
			// Brand Filter
			const brandSelectedItem = this.byId("idSalesReportBrand")?.getSelectedItem();
			const brandID = brandSelectedItem?.getKey() || stState.getProperty('/SelectedBrandID');
			if (brandID && !brandID.toLowerCase().includes("all")) {
				this.andFilters.push(new Filter({
					path: "BrandId",
					operator: FilterOperator.EQ,
					value1: brandID
				}));
			}
		
			// Product Filter
			const productSelectedItem = this.byId("idSalesReportProduct")?.getSelectedItem();
			const productID = productSelectedItem?.getKey();
			if (productID && !productID.toLowerCase().includes("all")) {
				this.andFilters.push(new Filter({
					path: "ProductPackID",
					operator: FilterOperator.EQ,
					value1: productID
				}));
			}
		
			// KAM Territory Filter
			const territorySelectedItem = this.byId("idSalesReportKAMTerritory")?.getSelectedItem();
			const territory = territorySelectedItem?.getKey() || stState.getProperty('/SelectedTerritory');
			if (territory && !territory.toLowerCase().includes("all")) {
				this.andFilters.push(new Filter({
					path: "KAM_Territory",
					operator: FilterOperator.EQ,
					value1: territory
				}));
			}
		
			// Institute Type Filter
			const instituteTypeSelectedItem = this.byId("idSalesReportInstituteType")?.getSelectedItem();
			const instituteType = instituteTypeSelectedItem?.getKey() || stState.getProperty('/SelectedInstituteType');
			if (instituteType && !instituteType.toLowerCase().includes("all")) {
				this.andFilters.push(new Filter({
					path: "InstituteType",
					operator: FilterOperator.EQ,
					value1: instituteType
				}));
			}
		
			// Institute Filter
			const instituteSelectedItem = this.byId("idSalesReportInstitute")?.getSelectedItem();
			const instituteID = instituteSelectedItem?.getKey();
			if (instituteID && !instituteID.toLowerCase().includes("all")) {
				this.andFilters.push(new Filter({
					path: "MainInstituteID",
					operator: FilterOperator.EQ,
					value1: instituteID
				}));
			}

            if (selectedDateFrom) {
                if (selectedDateTo) {
                    this.andFilters.push(new Filter({
                        path: "DateTo",
                        operator: FilterOperator.GE,
                        value1: selectedDateFrom,
                        caseSensitive: false
                    }));
                }else {
                    this.andFilters.push(new Filter({
                        path: "DateFrom",
                        operator: FilterOperator.LE,
                        value1: selectedDateFrom,
                        caseSensitive: false
                    }));
                }
            }

            if (selectedDateTo) {
                this.andFilters.push(new Filter({
                    path: "DateFrom",
                    operator: FilterOperator.LE,
                    value1: selectedDateTo,
                    caseSensitive: false
                }));
            }

			if (this.andFilters.length > 0) {
				//BrandID filter always should be in the of filter list
				this.andFilters.sort((a, b) => a?.sPath < b?.sPath ? 1 : (a.sPath === b.sPath ? 0 : -1));
				const oFilters = new Filter(this.andFilters, true);
				//Binding to table with the filters and the sorters
				binding?.filter(oFilters);
				overviewBinding?.filter(oFilters)
			} else {
				binding?.filter();
				overviewBinding?.filter()
			}
        },

		formatValue: function (Price, Currency, Region, CountryCode) {
			if (Price === null) {
				return ""
			}else{
				const currencyType =  this.getView().getController().customTypes.currency
				return  new currencyType().getModelFormat().format([Price, Currency, Region, CountryCode])
			}
			
		},

		onDownloadSalesReportExtract: async function () {
			const templateId = await this.stState.getService().getTemplateIDByName("Sales Report");
			const CountryCode = this.stState.getProperty("/SelectedCountry");
			const TenderID = this.stState.getProperty("/SelectedTenderId");
			const DistributorID = this.stState.getProperty("/SelectedWholesaler");
			const BrandID = this.stState.getProperty("/SelectedBrandID");
			const ProductPackID = this.stState.getProperty("/SelectedProductId");
			const KAM_Territory = this.stState.getProperty("/SelectedTerritory");
			const InstituteType = this.stState.getProperty("/SelectedInstituteType");
			const InstituteID = this.stState.getProperty("/SelectedInstitute");
			const DateFrom = this.byId("idSalesReportFromDate").getDateValue();
			const DateTo = this.byId("idSalesReportToDate").getDateValue();
			const selectedDateFrom = new CustomDateType().getModelFormat().format(DateFrom);
            const selectedDateTo = new CustomDateType().getModelFormat().format(DateTo);

			const path = this.getModel().createKey("/ExtractPolandSalesReport", {
				templateId: templateId,
				TenderID: TenderID,
				CountryCode: CountryCode,
				DistributorID: DistributorID,
				BrandID: BrandID,
				ProductPackID: ProductPackID,
				KAM_Territory: KAM_Territory,
				InstituteType: InstituteType,
				InstituteID: InstituteID,
				DateFrom: selectedDateFrom,
				DateTo: selectedDateTo
			});

			const url = `/v2/sta_tender${path}/content`;
			URLHelper.redirect(url, true);
		},
		onOverviewSectionViewReceived: function (oEvent) {
			var oTable = this.byId("idSalesOverviewTable");
			var oBinding = oTable.getBinding("rows");
			var aRows = oBinding.getContexts();
			
			var iRowCount = aRows.length;
		
			oTable.setVisibleRowCount(iRowCount);
		}
				
	});

});