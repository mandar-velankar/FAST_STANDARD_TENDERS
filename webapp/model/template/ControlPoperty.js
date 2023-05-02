sap.ui.define(["../BaseObject"], function (BaseObject) {
  const ControlProperty = BaseObject.extend("com.bayer.tender.statenderapp.model.template.ControlProperty", {
    constructor: function (data) {
      BaseObject.prototype.constructor.call(this);
      if (data) {
        this.id = data.ID;
        this.name = data.Name;
        this.value = this.stringToBoolean(data.Value);
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
    },
    stringToBoolean: function(stringValue) {
        switch(stringValue?.toLowerCase()?.trim()){
            case "true": 
              return true;
            case "false": 
              return false;
            default:
              return stringValue;
        }
    }
  });
  return ControlProperty;
});