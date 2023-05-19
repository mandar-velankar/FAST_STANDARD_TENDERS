sap.ui.define(["../BaseObject", "./Table", "sap/m/TableSelectDialog", "sap/m/ColumnListItem","sap/m/Column","sap/m/Text", "sap/ui/model/Filter"], function (BaseObject, Table, TableSelectDialog, ColumnListItem,Column,Text, Filter) {
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
      handleCloseValueHelp: function (oEvent) {
        const oParam = oEvent.getParameter("selectedItem")
        const selectedItem = oParam.getBindingContext().getObject();
        oEvent.getSource().setValue(selectedItem[this.selectedFieldName]);
      },
      onHandleValueHelpRequest: async function (oEvent) {
        const oSource = oEvent.getSource();
        const columns = this.getTable().getColumns();
        const sEntityPath = `/${this.getTable().getEntity()}`;
        const sTitle = this.getTable().getTitle();
  
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
            // let andFilters = [];
            let sValue = oEvent.getParameter("value");
  

            if (sValue) {
              orFilters = columns.map(col => {
                const control = col.getControl()
                const properties = control.getPropertiesAsObject();
                let path;
                switch (control.type) {
                  case 'Text':
                    path = 'text';
                    break;
                  case 'Input':
                    path = 'value';
                    break;
                  default:
                    path = '';
                    break;
                }
                return new Filter({
                  path: path,
                  operator: FilterOperator.Contains,
                  value1: sValue,
                  caseSensitive: false	
                })
              });
              
              // andFilters.push(new Filter(orFilters, false));
            }
            // if (andFilters.length > 0) {
            if (orFilters.length > 0) {
              this.getBinding("items").filter(orFilters);
            }else {
              this.getBinding("items").filter();
            }
          },
          confirm: (oEvent)=>this.handleCloseValueHelp(oEvent)
          // cancel: handleCloseValueHelp
        });
        columns.forEach(col => {
          let newColumn = new Column({
            header: new Text({
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