sap.ui.define(["../BaseObject", "./Table", "sap/m/TableSelectDialog", "sap/m/ColumnListItem"], function (BaseObject, Table, TableSelectDialog, ColumnListItem) {
    const ValueHelp = BaseObject.extend("com.bayer.tender.statenderapp.model.template.ValueHelp", {
      constructor: function (data) {
        BaseObject.prototype.constructor.call(this);
        if (data) {
          this.id = data.ID;
          this.title = data.Title;
          this.tableId = data.TableID;
          this.searchable = data.Searchable
          this.selectedFieldName = data.SelectedFieldName
          this.table = new com.bayer.tender.statenderapp.model.template.Table(data.Table);
        }
      },
      getTable: function () {
        return this.table;
      },
      getJSON: function () {
        return {
          ID: this.id,
          Title: this.title,
          Table: this.table
        };
      },
      onHandleValueHelpRequest: async function (oEvent) {
        const oSource = oEvent.getSource();
        const columns = this.getTable().getColumns();
        const sEntityPath = `/${this.getTable().getEntity()}`;
        const sTitle = this.getTable().getTitle();
  
        let handleCloseValueHelp = function (oEvent) {
          const oParam = oEvent.getParameter("selectedItem")
          const selectedItem = oParam.getBindingContext().getObject();
          oSource.setValue(selectedItem[this.selectedFieldName]);
        }
        // create value help dialog
        this.valueHelpTableSelectDialog = new TableSelectDialog({
          title: sTitle,
          multiSelect: false,
          contentWidth: '250px',
          items: {
            path: sEntityPath,
            filters: this._setValueHelpFilters(),
            template: new ColumnListItem({
                type: "Active",
                cells: columns.map(col => col.getControl().generateControl())
              })	
          },
          liveChange: function (oEvent) {
            let orFilters = [];
            let andFilters = [];
            let sValue = oEvent.getParameter("value");
  

            if (sValue) {
              getPropertiesAsObject()
              if (showValue === "InstituteName") {
                orFilters.push(new Filter({
                  path: "InstituteName",
                  operator: FilterOperator.Contains,
                  value1: sValue,
                  caseSensitive: false	
                }))
                orFilters.push(new Filter({
                  path: "InstituteID",
                  operator: FilterOperator.EQ,
                  value1: sValue,
                }))
              }
              if (showValue === "CLASSIFICATION") {
                orFilters.push(new Filter({
                  path: "CLASSIFICATION",
                  operator: FilterOperator.Contains,
                  value1: sValue,
                  caseSensitive: false	
                }))
              }
              if (showValue === "ChannelName") {
                orFilters.push(new Filter({
                  path: "ChannelName",
                  operator: FilterOperator.Contains,
                  value1: sValue,
                  caseSensitive: false	
                }))
              }
              andFilters.push(new Filter(orFilters, false));
            }
            if (andFilters.length > 0) {
              this.getBinding("items").filter(andFilters);
            }else {
              this.getBinding("items").filter();
            }
          },
          confirm: handleCloseValueHelp
          // cancel: handleCloseValueHelp
        });
        columns.forEach(col => {
          let newColumn = new sap.m.Column({
            header: new sap.m.Text({
              text: col.title
            })
          })
          this.valueHelpTableSelectDialog.addColumn(newColumn);
        })
        
        this.valueHelpTableSelectDialog.setModel(oSource.getModel());
        this.valueHelpTableSelectDialog.open();
      },

      _setValueHelpFilters: function (showValue) {
        let filters = [
          new Filter("CountryCode", "EQ", "BR")
        ];
        return filters;
      }
    });
    return ValueHelp;
  });