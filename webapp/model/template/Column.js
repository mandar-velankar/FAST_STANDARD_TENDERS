sap.ui.define(["../BaseObject", "./Control"], function (BaseObject, Control) {
  const Column = BaseObject.extend("com.bayer.SXTENDER.templates.GenericTableComponent.models.Column", {
    constructor: function (data) {
      BaseObject.prototype.constructor.call(this);
      if (data) {
        this.id = data.ID;
        this.title = data.Title;
        this.control = new Control(data.Control);
      }
    },
    getControl: function () {
      return this.control;
    },
    getTitle: function () {
      return this.title;
    },
    getJSON: function () {
      return {
        ID: this.id,
        Title: this.title,
        Control: this.control.getJSON()
      };
    }
  });
  return Column;
});