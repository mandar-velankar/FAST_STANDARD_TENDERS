sap.ui.define(["../BaseObject", "./ControlPoperty", "sap/ui/layout/form/ResponsiveGridLayout"], function (BaseObject, ControlProperty, ResponsiveGridLayout) {

  const Layout = BaseObject.extend("com.bayer.tender.statenderapp.model.template.Layout", {
    constructor: function (data) {
      BaseObject.prototype.constructor.call(this);
      this.properties = [];
      if (data) {
        this.id = data.ID;
        this.type = data.Type;
        this.properties = data.Properties.map(property => new ControlProperty(property));
        this.getPropertiesAsObject();
      }
    },
    getPropertiesAsObject: function () {
      const props = {};
      for (const prop of this.properties) {
        props[prop.getName()] = prop.getIsBinding() ? `{data>${prop.getValue()}}` : prop.getValue();
        if (prop.getIsBinding()) {
          this[prop.getName()] = `{data>${prop.getValue()}}`;
        } else {
          try {
            this[prop.getName()] = parseInt(prop.getValue());
            if (isNaN(this[prop.getName()])) {
              this[prop.getName()] = prop.getValue() === 'true';
            }
          } catch (error) {
            this[prop.getName()] = prop.getValue();
          }
        }
      }
      return props;
    },
    getControlPath: function () {
      return `sap/m/${this.type}`;
    },
    generateControl: function () {
      const m = new ResponsiveGridLayout();
      // const t = new Text();
      const p = this.getControlPath();
      const c = sap.ui.require(p);
      const props = this.getPropertiesAsObject();
      // new Text();
      const control = new c(props);
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
  return Layout;
});