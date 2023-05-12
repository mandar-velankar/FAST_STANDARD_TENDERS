//todo: dependencies are required for dynamic loading of controls, need to find a better solution
sap.ui.define(["sap/m/Text", "../BaseObject", "./ControlPoperty", "sap/m/Input"], function (Text, BaseObject, ControlProperty, Input) {

  const Control = BaseObject.extend("com.bayer.tender.statenderapp.model.template.Control", {
    constructor: function (data) {
      BaseObject.prototype.constructor.call(this);
      this.properties = [];
      if (data) {
        this.id = data.ID;
        this.type = data.Type;
        this.properties = data.Properties.map(property => new ControlProperty(property));
      }
    },
    getPropertiesAsObject: function () {
      const props = {};
      for (const prop of this.properties) {
        if(prop.getName() === "enabled"){
          props[prop.getName()] = prop.getIsBinding() ? '{= '+prop.getValue()+' && ${ui>/editMode}}' : prop.getValue();
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
      // const r2 = new (<any>window)["TestClass"]()
      // const control = new (sap.ui.require(this.getControlPath()))(this.getPropertiesAsObject());

      return control;
    },
    getJSON: function () {
      return {
        ID: this.id,
        Type: this.type,
        Properties: this.properties.map(property => property.getJSON())
      };
    }
  });
  return Control;
});