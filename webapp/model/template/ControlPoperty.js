sap.ui.define(["../BaseObject"], function (BaseObject) {
  const ControlProperty = BaseObject.extend("com.bayer.tender.statenderapp.model.template.ControlProperty", {
    constructor: function (data) {
      BaseObject.prototype.constructor.call(this);
      if (data) {
        this.id = data.ID;
        this.name = data.Name;
        this.value = data.Value;
        this.isBinding = data.IsBinding;
      }
    },
    getName: function () {
      return this.name;
    },
    getValue: function () {
      return this.value;
    },
    getIsBinding: function () {
      return this.isBinding;
    },
    getJSON: function () {
      return {
        ID: this.id,
        Name: this.name,
        Value: this.value,
        IsBinding: this.isBinding
      };
    }
  });
  return ControlProperty;
});