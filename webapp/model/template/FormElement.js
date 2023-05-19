sap.ui.define(["../BaseObject", "./Control"], function (BaseObject, Control) {
  const FormElement = BaseObject.extend("com.bayer.tender.statenderapp.model.template.FormElement", {
    constructor: function (data) {
      BaseObject.prototype.constructor.call(this);
      this.controls = [];
      if (data) {
        this.id = data.ID;
        this.label = data.Label;
        for (const control of data.Controls) {
          this.controls.push(new Control(control));
        }
        // for(const control of data.Controls){
        //     this.controls.push(new Control(control));
        // }
      }
    },
    getControls: function () {
      return this.controls;
    },
    getControlById: function (controlId) {
      return this.controls.find(el => el.controlID === controlId);
    },
    getJSON: function () {
      return {
        ID: this.id,
        Label: this.label,
        Controls: this.controls.map(control => control.getJSON())
      };
    }
  });
  return FormElement;
});