//todo: dependencies are required for dynamic loading of controls, need to find a better solution
sap.ui.define(["sap/m/Text", 
               "../BaseObject", 
               "./ControlPoperty", 
               "sap/m/Input", 
               "sap/m/DatePicker", 
               "./ValueHelp",
               "../../service/StandardSingletonService",
               "sap/ui/model/Filter"
], function (Text, BaseObject, ControlProperty, Input, DatePicker, ValueHelp, StandardSingletonService, Filter) {

  const Control = BaseObject.extend("com.bayer.tender.statenderapp.model.template.Control", {
    constructor: function (parentId,data) {
      BaseObject.prototype.constructor.call(this);
      this.properties = [];
      this.propertyByName = {};
      if (data) {
        this.parentId = parentId;
        this.id = data.ID;
        this.type = data.Type;
        this.properties = data.Properties.map(property => new ControlProperty(property));
        this.controlID = this.properties.find(property => property.name === "id")?.value;
        data.ValueHelp && (this.valueHelp = new com.bayer.tender.statenderapp.model.template.ValueHelp(data.ValueHelp));
      }
    },
    getPropertiesAsObject: function () {
      const props = {};
      for (const prop of this.properties) {
        if(prop.getName() === "enabled"){
          props[prop.getName()] = prop.getIsBinding() ? '{= '+prop.getValue()+' && ${ui>/'+this.parentId+'/editMode}}' : prop.getValue();
        }else{
          props[prop.getName()] = prop.getIsBinding() ? `{${prop.getValue()}}` : prop.getValue();
        }
        

      }
      return props;
    },
    getControlPath: function () {
      return `sap/m/${this.type}`;
    },
    generateControl: function () {
      // const m = new Input();
      // const t = new Text();
      const controlPath = this.getControlPath();
      const ui5Control = sap.ui.require(controlPath);
      const props = this.getPropertiesAsObject();
      // new Text();
      const control = new ui5Control(props);
      if (this.valueHelp && this.type === "Input") {
        control.attachValueHelpRequest(this.valueHelp.onHandleValueHelpRequest, this.valueHelp);
      } 
      
      if (this.valueHelp && this.type === "Select"){
        if(this.valueHelp.table && this.valueHelp.table.entity){
          let oItemTemplate = this.generateItemTemplate(this.valueHelp.table);
          let filters = [];

          if(this.valueHelp.filters.length > 0){
            filters = this.valueHelp.filters.map(filter => {
              let value = StandardSingletonService[`get${filter.path}`]();
              return new Filter(filter.path, filter.operator, value);
            });
          }

          control.bindItems({ 
              path: `/${this.valueHelp.table.entity}`,
              template: oItemTemplate,
              filters: filters,
              templateShareable: true
          });
          const changeFunction = StandardSingletonService[`onChange${this.valueHelp.title}`];
          if (changeFunction) {
            control.attachChange(changeFunction, StandardSingletonService);
          }
        } else {
          this.valueHelp.staticValues.forEach(item => {
            control.addItem(item.generateItem());
          })
        }

        if(this.properties.find(prop => prop.name === 'selectedKey')){
          control.setSelectedKey(`{${this.properties.find(prop => prop.name === 'selectedKey').value}}`)
        }
      }
      // const r2 = new (<any>window)["TestClass"]()
      // const control = new (sap.ui.require(this.getControlPath()))(this.getPropertiesAsObject());

      return control;
    },
    
    generateItemTemplate: function (table) {
      let key = table?.columns?.find(column => column.isValueHelpKey)?.control?.properties?.find(prop => prop.name === 'key')?.value;
      let text = table?.columns?.find(column => column.isValueHelpText)?.control?.properties?.find(prop => prop.name === 'text')?.value;
      return new sap.ui.core.Item({'key': `{${key}}`, 'text': `{${text}}`});
    },

    getValueHelp: function () {
      return this.valueHelp;
    },
    getJSON: function () {
      return {
        ID: this.id,
        Type: this.type,
        Properties: this.properties.map(property => property.getJSON()),
        ValueHelp: this.valueHelp
      };
    }
  });
  return Control;
});