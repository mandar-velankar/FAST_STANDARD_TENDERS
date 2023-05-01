sap.ui.define(["../BaseObject", "./FormContainer", "./Layout"], function (BaseObject, FormContainer, Layout) {
  const Form = BaseObject.extend("com.bayer.tender.statenderapp.model.template.Form", {
    constructor: function (data) {
      BaseObject.prototype.constructor.call(this);
      this.formContainers = [];
      if (data) {
        this.id = data.ID;
        this.title = data.Title;
        this.description = data.Description;
        this.layout = new Layout(data.Layout);
        for (const formContainer of data.FormContainers) {
          this.formContainers.push(new FormContainer(formContainer));
        }
      }
    },
    getJSON: function () {
      return {
        ID: this.id,
        Title: this.title,
        Description: this.description,
        FormContainers: this.formContainers.map(formContainer => formContainer.getJSON()),
        Layout: this.layout.getJson()
      };
    }
  });
  return Form;
});