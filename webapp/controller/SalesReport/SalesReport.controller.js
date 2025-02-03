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
			const userInfo = await this.stState.getService().getUserInfo(this.userId);
			this.getModel("st").setProperty("/UserInfo", userInfo);
			await this.bindTenderIds();
			this.bindWholesalers(sCountryCode);
			this.bindCountryBrands(sCountryCode);
			this.bindUserTerritories(sCountryCode);
			this.onFilter();
		},

		bindTenderIds: async function () {
			const oSelectTenderIDs = this.byId("idSalesReportTenderID");
			const userInfo = this.getModel("st").getProperty("/UserInfo");
			const controller = this;
			const selectedBrand = this.byId("idSalesReportBrand").getSelectedKey();
			const selectedProduct = this.byId("idSalesReportProduct").getSelectedKey();
			const selectedInstituteType = this.byId("idSalesReportInstituteType").getSelectedKey();
			const selectedInstitute = this.byId("idSalesReportInstitute").getSelectedKey();
			const filters = [];

			 // Role-based filtering logic
			 const isKAM = userInfo.Role === 'KAM';
		 
			if (isKAM) {
				filters.push(new Filter('createdBy', FilterOperator.EQ, this.userId));
			}

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

			// oSelectTenderIDs?.bindItems({
			// 	path: "/SalesReportTenderView",
			// 	filters: filters,
			// 	sorter: new Sorter({
			// 		path: 'TenderID',
			// 		descending: false
			// 	}),
			// 	template: new Item({
			// 		key: "{TenderID}",
			// 		text: "{TenderID}"
			// 	}),
			// 	templateShareable: true,
			// 	events: {
            //         dataReceived: function(event) {
            //             let itemsData = event.getParameter("data").results || [];

			// 			const items = itemsData.reduce((acc, current) => {
			// 				if (!acc.some(item => item.TenderID === current.TenderID)) {
			// 					acc.push(current);
			// 				}
			// 				return acc;
			// 			}, []);

			// 			// Add "All" option to the items array
			// 			items.unshift({
			// 				TenderID: "All",
			// 				CountryCode: this.countryCode
			// 			});

			// 			// Manually set the filtered data back to the list control
            //             oSelectTenderIDs.destroyItems();
            //             items.forEach(item => {
            //                 oSelectTenderIDs.addItem(new Item({
            //                     key: item.TenderID,
            //                     text: item.TenderID
            //                 }));
            //             });

            //             controller.stState.setProperty('/SelectedTenderId', "All");
			// 			controller.onFilter();
            //         }
            //     }
			// });
			  // Pagination logic
			  let allItems = [];
			  let skip = 0;
			  const pageSize = 5000;
			  let hasMoreData = true;
		  
			  while (hasMoreData) {
				  await new Promise((resolve, reject) => {
					  this.getModel().read("/SalesReportTenderView", {
						  filters: filters,
						  urlParameters: {
							  $skip: skip,
							  $top: pageSize,
							  $orderby: "TenderID asc"
						  },
						  success: function (data) {
							  const items = data.results || [];
							  if (items.length === 0) {
								  hasMoreData = false;
							  } else {
								  allItems = [...allItems, ...items];
								  skip += pageSize;
							  }
							  resolve();
						  },
						  error: function (err) {
							  hasMoreData = false;
							  reject(err);
						  }
					  });
				  });
			  }
		  
			  // Deduplicate items by TenderID
			  const uniqueItems = allItems.reduce((acc, current) => {
				  if (!acc.some(item => item.TenderID === current.TenderID)) {
					  acc.push(current);
				  }
				  return acc;
			  }, []);
		  
			  // Add "All" option to the items array
			  uniqueItems.unshift({ TenderID: "All" });
		  
			  // Bind the dropdown with the fetched data
			  oSelectTenderIDs.destroyItems();
			  uniqueItems.forEach(item => {
				  oSelectTenderIDs.addItem(new Item({
					  key: item.TenderID,
					  text: item.TenderID
				  }));
			  });
		  
			  // Set the default selected value
			  this.getModel("st").setProperty('/SelectedTenderId', "All");
			  this.onFilter();
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
                        const salesReportInstituteData = (data.getParameter('data')?.results || [])
							.filter(item => item.Territory && item.Territory.trim() !== "");

						controller.stState.setProperty("/SalesReportInstitutesView", salesReportInstituteData);

						const items = salesReportInstituteData.filter((value, index, self) => 
							self.findIndex(v => v.Territory === value.Territory) === index);

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
            const binding = salesDetailTable.getBinding('rows');
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
			if(tenderID){
				if (tenderID.toLowerCase() === 'no related tender') {
					this.andFilters.push(new Filter({
						path: "OfferID",
						operator: FilterOperator.EQ,
						value1: null
					}));
				} else if (!tenderID.toLowerCase().includes("all")) {
					// Add filter for a specific TenderID if not "All"
					this.andFilters.push(new Filter({
						path: "TenderID",
						operator: FilterOperator.EQ,
						value1: tenderID
					}));
				}
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
			
			//const templateId = await this.stState.getService().getTemplateIDByName("Sales Report");
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
			let filters = [
				new Filter("CountryCode", FilterOperator.EQ, CountryCode)
			];
			if(TenderID){
				if (TenderID.toLowerCase() === 'no related tender') {
					filters.push(new Filter({
						path: "OfferID",
						operator: FilterOperator.EQ,
						value1: null
					}));
				} else if (!TenderID.toLowerCase().includes("all")) {
					// Add filter for a specific TenderID if not "All"
					filters.push(new Filter({
						path: "TenderID",
						operator: FilterOperator.EQ,
						value1: TenderID
					}));
				}
			}
			if (DistributorID && !DistributorID.toLowerCase().includes("all")) {
				filters.push(new Filter({
					path: "DistributorID",
					operator: FilterOperator.EQ,
					value1: DistributorID
				}));
			}
			
			if (BrandID && !BrandID.toLowerCase().includes("all")) {
				filters.push(new Filter({
					path: "BrandId",
					operator: FilterOperator.EQ,
					value1: BrandID
				}));
			}

			if (ProductPackID && !ProductPackID.toLowerCase().includes("all")) {
				filters.push(new Filter({
					path: "ProductPackID",
					operator: FilterOperator.EQ,
					value1: ProductPackID
				}));
			}

			if (KAM_Territory && !KAM_Territory.toLowerCase().includes("all")) {
				filters.push(new Filter({
					path: "KAM_Territory",
					operator: FilterOperator.EQ,
					value1: KAM_Territory
				}));
			}
			if (InstituteType && !InstituteType.toLowerCase().includes("all")) {
				filters.push(new Filter({
					path: "InstituteType",
					operator: FilterOperator.EQ,
					value1: InstituteType
				}));
			}
			if (InstituteID && !InstituteID.toLowerCase().includes("all")) {
				filters.push(new Filter({
					path: "MainInstituteID",
					operator: FilterOperator.EQ,
					value1: InstituteID
				}));
			}
			
			if (selectedDateFrom) {
                if (selectedDateTo) {
                    filters.push(new Filter({
                        path: "DateTo",
                        operator: FilterOperator.GE,
                        value1: selectedDateFrom,
                        caseSensitive: false
                    }));
                }else {
                    filters.push(new Filter({
                        path: "DateFrom",
                        operator: FilterOperator.LE,
                        value1: selectedDateFrom,
                        caseSensitive: false
                    }));
                }
            }

            if (selectedDateTo) {
                filters.push(new Filter({
                    path: "DateFrom",
                    operator: FilterOperator.LE,
                    value1: selectedDateTo,
                    caseSensitive: false
                }));
            }
			
			const excelData = await this.getExcelData(filters); 

			const formattedExcelData = this.formattedSalesReportExtract(excelData, CountryCode);

			this.generateXLSX(formattedExcelData);
		
			// const url = `/v2/sta_tender${path}/content`;
			// URLHelper.redirect(url, true);
		},

		getExcelData: async function (filters) {
			const path = "/SalesReportsView"; 
			return new Promise((resolve, reject) => {
				this.getModel().read(path, {
					filters: filters,
					success: function (res) {
						resolve(res?.results)
					},
					error: function (err) {
						reject(err)
					}
				});
			});
		},

		formatPolandPrices: function (value) {
			if (!value){
				value = 0;
			};

			const formattedValue = this.formatCurrency(Number(value), 'en-US', 2, 2);
			return formattedValue.replace(/,/g, ' ').replace(/\.(?=\d{2}$)/, ',');
		},
	
		formatPolandQuantity: function (value) {
			if (!value){
				value = 0;
			};
			const formattedValue = this.formatNumber(Number(value), 0, 0);
			return formattedValue.replace(/,/g, ' ');
		},

		formatNumber: function(num, minDigits, maxDigits) {
			if (!num){
				num = 0;
			}
	
			return num.toLocaleString('en-US', {
				minimumFractionDigits: minDigits, 
				maximumFractionDigits: maxDigits
			});
		},

		formatCurrency: function (num, locale, minDigits, maxDigits, truncate) {
			if (!num){
				num = 0;
			};
	
			if (truncate) {
				const fixed = (num * 100).toFixed(10); // Fix the precision issue
				num = Number(Math.floor(fixed) / 100); 
			}
	
			return num.toLocaleString(locale, {
				minimumFractionDigits: minDigits, 
				maximumFractionDigits: maxDigits
			});
		},

		formatDate: function(dateString, inputFormat, outputFormat) {
			const date = new Date(dateString); // Parse date string directly
		
			if (isNaN(date)) {
				return "Invalid date"; // Handle invalid date parsing
			}
		
			const pad = (n) => (n < 10 ? "0" + n : n); // Pad single digits with a leading zero
		
			// Replace placeholders in the output format
			return outputFormat
				.replace("YYYY", date.getFullYear())
				.replace("MM", pad(date.getMonth() + 1)) // Months are zero-indexed
				.replace("DD", pad(date.getDate()));
		},

		formattedSalesReportExtract: function (excelData, CountryCode) {
			const countryCodeLocals = {
				'PL': 'en-US'
			};
		
			const locale = countryCodeLocals[CountryCode];
		
			// Use map to create a new array with formatted data
			const formattedData = excelData.map(ed => {
				// Format Quantities
				ed.Quantity = this.formatPolandQuantity(ed.Quantity, CountryCode);
				ed.QuantityML = this.formatPolandQuantity(ed.QuantityML, CountryCode);
				ed.RequestedVolume = this.formatPolandQuantity(ed.RequestedVolume, CountryCode);
				ed.BrandUsedVolume = this.formatPolandQuantity(ed.BrandUsedVolume, CountryCode);
				ed.BrandContractVolume = this.formatPolandQuantity(ed.BrandContractVolume, CountryCode);
		
				// Format Prices
				ed.WholesalerPurchasePrice = this.formatPolandPrices(ed.WholesalerPurchasePrice, locale, CountryCode);
				ed.WholesalerContractPrice = this.formatPolandPrices(ed.WholesalerContractPrice, locale, CountryCode);
				ed.WholesalerPurchasedAmount = this.formatPolandPrices(ed.WholesalerPurchasedAmount, locale, CountryCode);
				ed.TotalSales = this.formatPolandPrices(ed.TotalSales, locale, CountryCode);
		
				// Format Date
				ed.FilePeriod = ed.FilePeriod && this.formatDate(ed.FilePeriod, '', 'DD-MM-YYYY');
		
				// Format Percentage
				ed.ContractBrandUsage = ed.ContractBrandUsage ? `${(Number(ed.ContractBrandUsage) * 100).toFixed(2)}%` : '0%';
		
				return ed;
			});
		
			return formattedData;
		},

		generateXLSX: function (excelData) {

			const headers = [
				"OfferID",
				"Wholesaler Name",
				"Institute",
				"Customer ID",
				"Date",
				"Brand",
				"Product",
				"EAN Number",
				"Quantity [Units]",
				"Quantity [ML]",
				"List Price",
				"Special Price",
				"Wholesaler Purchased Amount",
				"Net Sales",
				"Contract Product Volume",
				"Used Brand Volume",
				"Contract Brand Usage",
			];
		
			// Map the data to match the headers
			const formattedData = excelData.map(item => ({
				"OfferID": item.OfferID || "",
				"Wholesaler Name": item.DistributorName || "",
				"Institute": item.MainInstituteName || "",
				"Customer ID": item.External_InstituteId || "",
				"Date": item.FilePeriod || "",
				"Brand": item.BrandName || "",
				"Product": item.PRODUCTPACKNAME || "",
				"EAN Number": item.EANNumber || "",
				"Quantity [Units]": item.Quantity || 0,
				"Quantity [ML]": item.QuantityML || 0,
				"List Price": item.WholesalerPurchasePrice || 0.0,
				"Special Price": item.WholesalerContractPrice || 0.0,
				"Wholesaler Purchased Amount": item.WholesalerPurchasedAmount || 0.0,
				"Net Sales": item.NetSales || "",
				"Contract Product Volume": item.RequestedVolume || "",
				"Used Brand Volume": item.BrandUsedVolume || "",
				"Contract Brand Usage": item.ContractBrandUsage || "0.00%",
			}));

			// Create a new workbook
			let wb = XLSX.utils.book_new();
		
			// Convert JSON data to a worksheet
			let ws = XLSX.utils.json_to_sheet(formattedData, { header: headers });
		
			// Append worksheet to workbook
			XLSX.utils.book_append_sheet(wb, ws, "Sales Report");

							
			// Trigger file download
			XLSX.writeFile(wb, "Sales_Report.xlsx");
		
			sap.m.MessageToast.show("Excel file downloaded successfully!");
		},

		onOverviewSectionDataReceived: function (oEvent) {
				const oTable = this.byId("idSalesOverviewTable");
				const oBinding = oTable.getBinding("rows");
				const iRowCount = oBinding.getLength();
				oTable.setVisibleRowCount(iRowCount === 0 ? iRowCount + 1 : iRowCount > 10 ? 10 : iRowCount);
		},

		onSaleDetailsDataReceived: function (oEvent) {
			const oTable = this.byId("idSalesDetailTable");
			const oBinding = oTable.getBinding("rows");
			const iRowCount = oBinding.getLength();
			oTable.setVisibleRowCount(iRowCount === 0 ? iRowCount + 1 : iRowCount > 10 ? 10 : iRowCount);
		}
	});

});