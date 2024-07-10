//todo: dependencies are required for dynamic loading of controls, need to find a better solution
sap.ui.define(["sap/m/Text", 
               "../BaseObject", 
               "./ControlPoperty", 
               "sap/m/Input", 
               "sap/m/MultiInput",
               "sap/m/DatePicker", 
               "./ValueHelp",
               "../../service/StandardSingletonService",
               "sap/ui/model/Filter",
               "../formatter"
], function (Text, BaseObject, ControlProperty, Input, MultiInput, DatePicker, ValueHelp, StandardSingletonService, Filter, formatter) {

  const Control = BaseObject.extend("com.bayer.tender.statenderapp.model.template.Control", {
    constructor: function (parentId,data) {
      BaseObject.prototype.constructor.call(this);
      this.properties = [];
      this.propertyByName = {};
      this.formatter = formatter;
      if (data) {
        this.parentId = parentId;
        this.id = data.ID;
        this.type = data.Type;
        this.properties = data.Properties.map(property => ControlProperty?new ControlProperty(property):new com.bayer.tender.statenderapp.model.template.ControlProperty(property));
        this.controlID = this.properties.find(property => property.name === "id")?.value;
        try{
        data.ValueHelp && (this.valueHelp = ValueHelp?new ValueHelp(data.ValueHelp) : new com.bayer.tender.statenderapp.model.template.ValueHelp(data.ValueHelp));
        }
        catch(error){
          console.error(error);
        }
      }
    },
    getPropertiesAsObject: function () {
      const props = {};
      for (const prop of this.properties) {
        if(prop.getName() === "enabled"){
          props[prop.getName()] = prop.getIsBinding() ? '{= '+prop.getValue()+' && ${ui>/'+this.parentId+'/editMode}}' : prop.getValue();
        }else{
          if (prop.getIsBinding()) {
            const formatterValueIndex = prop.getValue().search(/.formatter\.(\w+)/g);
            props[prop.getName()] = this.updateBindingObject(prop, formatterValueIndex);  
          }else {
            props[prop.getName()] = prop.getValue();
          }
        }
      }
      return props;
    },

    /**
     * Updates a binding object based on the given path and formatter value index.
     * @param {string} path - The path to update, which may contain formatting.
     * @param {number} formatterValueIndex - The index of the formatter value to bind.
     * @returns {Object|string} Returns the updated binding object if formatterValueIndex is greater than -1,
     *                          otherwise returns the original path string.
    */
    updateBindingObject: function (prop, formatterValueIndex) {
      const path = `{${prop.getValue()}}`; //wraps initial value into quotes and brackets to correctly parse to JSON object 
      if (formatterValueIndex > -1) {
          const replacedJSONString = path
              .replace(/(\w+)\s*:/g, '"$1":') // Convert keys without quotes to keys with quotes.
              .replace(/'/g, '"'); // Convert single quotes to double quotes for valid JSON.
          
          const parsedBindingObject = JSON.parse(replacedJSONString); // Parse the JSON string into an object.
          
          // Bind formatter function from this.formatter based on formatterValueIndex.
          parsedBindingObject.formatter = this.formatter[replacedJSONString.match(/.formatter\.(\w+)/)[1]].bind(this.formatter);
          
          return parsedBindingObject;
      } else {
          return path; // Return the original path string if formatterValueIndex is not valid.
      }
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
      if (this.valueHelp && (this.type === "Input" || this.type === "MultiInput")) {
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
        } else {
          this.valueHelp.staticValues.forEach(item => {
            control.addItem(item.generateItem());
          })
        }

        const changeFunction = StandardSingletonService[`onChange${this.valueHelp.title}`];
        if (changeFunction) {
          control.attachChange(changeFunction, StandardSingletonService);
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