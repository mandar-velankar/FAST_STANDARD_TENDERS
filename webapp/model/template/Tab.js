sap.ui.define(["../BaseObject", "./Form"], function (BaseObject, Form) {
  const Tab = BaseObject.extend("com.bayer.tender.statenderapp.model.template.Tab", {
    constructor: function (data) {
      BaseObject.prototype.constructor.call(this);
      this.forms = [];
      if (data) {
        this.id = data.ID;
        this.title = data.Title;
        this.description = data.Description;
        this.icon = data.Icon;
        for (const form of data.Forms) {
          this.forms.push(new Form(form));
        }
      }
    },
    getJSON: function () {
      return {
        ID: this.id,
        Title: this.title,
        Description: this.description,
        Icon: this.icon,
        Forms: this.forms.map(form => form.getJSON())
      };
    }
  });
  return Tab;
});