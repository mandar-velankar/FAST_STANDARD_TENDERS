sap.ui.define([
  "../BaseObject", 
  "./Table", 
  "./Filter",
  "./StaticValue",
  "sap/m/TableSelectDialog", 
  "sap/m/ColumnListItem",
  "sap/m/Column",
  "sap/m/Token",
  "sap/m/Text", 
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], function (BaseObject, Table, TemplateFilter, TemplateStaticValue, TableSelectDialog, ColumnListItem,Column,Token, Text, Filter, FilterOperator) {
    const ValueHelp = BaseObject.extend("com.bayer.tender.statenderapp.model.template.ValueHelp", {
      constructor: function (data) {
        BaseObject.prototype.constructor.call(this);
        if (data) {
          this.id = data.ID;
          this.title = data.Title;
          this.tableId = data.TableID;
          this.searchable = data.Searchable
          this.selectedFieldID = data.SelectedFieldID;
          this.selectedFieldName = data.SelectedFieldName;
          this.selectedField = data.SelectedField;
          this.table = new com.bayer.tender.statenderapp.model.template.Table(data.Table);
          this.filters = data.Filters.map(filter => new TemplateFilter(filter));
          this.staticValues = data.StaticValues.map(value => new TemplateStaticValue(value));
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
      handleCloseValueHelp: function (oEvent,originalInputField) {
        if(originalInputField instanceof sap.m.MultiInput){
          let aSelectedItems = oEvent.getParameter("selectedItems");
          let originalInputFieldItems = originalInputField.getTokens();

          if (aSelectedItems && aSelectedItems.length > 0) {       
            const selectedTexts = aSelectedItems.map(oItem => oItem.getBindingContext().getObject().Name);
            
            originalInputFieldItems.forEach(function (token) {
              const tokenText = token.getText();
              if (!selectedTexts.includes(tokenText)) {
                originalInputField.removeToken(token);
              }
            });
           
            aSelectedItems.forEach(function (oItem) {
              const itemText = oItem.getBindingContext().getObject().Name;
              const isTokenExists = originalInputFieldItems.some(token => token.getText() === itemText);
              if (!isTokenExists) {
                const oToken = new Token({
                  text: itemText
                });
                originalInputField.addToken(oToken);
              }
            });
          } else {            
            originalInputField.removeAllTokens();
          }
        }
        else{
          const oParam = oEvent.getParameter("selectedItem");
          const selectedItem = oParam.getBindingContext().getObject();
          if (this.selectedField && this.selectedField.length > 0) {
            this.selectedField.forEach(field => {
                const path = originalInputField.getBindingContext().getPath() + "/" + originalInputField.getBinding("value").getPath();
                originalInputField.getModel().setProperty(path, selectedItem[field.Name]); 

                const pathTargetEntityID = originalInputField.getBindingContext().getPath() + "/" + field.ID;
                originalInputField.getModel().setProperty(pathTargetEntityID, selectedItem[field.ID]); 
            })
          }
        }     
      },
      onHandleValueHelpRequest: async function (oEvent) {
        const oSource = oEvent.getSource();
        const columns = this.getTable().getColumns();
        const sEntityPath = `/${this.getTable().getEntity()}`;
        const sTitle = this.getTable().getTitle();
  
        // create value help dialog
        this.valueHelpTableSelectDialog = new TableSelectDialog({
          title: sTitle,
          multiSelect: oSource instanceof sap.m.MultiInput ? true : false,
          contentWidth: '250px',
          items: {
            path: sEntityPath,
            filters: this._setFilters(
              {
                defaultModel: oSource.getModel(),
                defaultEntityPath:oSource?.getBindingContext().getPath(),
                stateModel:oSource.getModel("st")
              }
            ),
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
                    path = properties?.text?.replace(/{|}/g, '');
                    break;
                  case 'Input':
                    path = 'value';
                    break;
                  default:
                    path = '';
                    break;
                }
                if (path === "CustomerID" && !isNaN(Number(sValue))) {
                  return new Filter({
                    path: path,
                    operator: FilterOperator.Contains,
                    value1: sValue,
                    caseSensitive: false	
                  })
                }
                if (path !== "CustomerID" && isNaN(Number(sValue))) {
                  return new Filter({
                    path: path,
                    operator: FilterOperator.Contains,
                    value1: sValue,
                    caseSensitive: false	
                  })
                }
              });
              // Removes undefined item from orFilters array
              orFilters = orFilters.filter(item => item);
              // andFilters.push(new Filter(orFilters, false));
            }
            // if (andFilters.length > 0) {
            if (orFilters.length > 0) {
              this.getBinding("items").filter(orFilters);
            }else {
              this.getBinding("items").filter();
            }
          },
          confirm: (oEvent)=>this.handleCloseValueHelp(oEvent,oSource),
          updateFinished: (oEvent)=>this.handleUpdateFinished(oEvent,oSource),   
          // cancel: handleCloseValueHelp
        });
        columns.forEach(col => {
          let newColumn = new Column();
          this.valueHelpTableSelectDialog.addColumn(newColumn);
        })
        
        this.valueHelpTableSelectDialog.setModel(oSource.getModel());
        this.valueHelpTableSelectDialog.setModel(oSource.getModel("st"), "st");
        this.valueHelpTableSelectDialog.setRememberSelections(true);
        this.valueHelpTableSelectDialog.open();
      },
      
      handleUpdateFinished: function(event, source){
        const selectedItems = source.getTokens();
        const valueHelpDialog = event.getSource();
        selectedItems.forEach(selectedItem => {
          valueHelpDialog.getItems()?.find(item => item.getBindingContext().getObject().Name === selectedItem.getProperty('text'))?.setSelected(true)
        })
      },

      _setFilters: function (modelInfo) {
        return this.filters.map(filter => filter.generateFilter(modelInfo));
      }
    });
    return ValueHelp;
  }); 