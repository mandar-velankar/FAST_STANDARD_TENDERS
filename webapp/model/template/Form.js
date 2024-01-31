sap.ui.define(["../BaseObject", "./FormContainer", "./Layout"], function (BaseObject, FormContainer, Layout) {
  const Form = BaseObject.extend("com.bayer.tender.statenderapp.model.template.Form", {
    constructor: function (data) {
      BaseObject.prototype.constructor.call(this);
      this.formContainers = [];
      if (data) {
        this.id = data.ID;
        this.title = data.Title;
        this.titleLocale = data.TitleLocale;
        this.description = data.Description;
        this.formId = data.FormID;
        this.entity = data.Entity;
        this.layout = new Layout(data.Layout);
        for (const formContainer of data.FormContainers) {
          this.formContainers.push(new FormContainer(this.formId, formContainer));
        }
      }
    },

    getEntity: function () {
      return this.entity;
    },
    getFormContainerByName: function (containerTitle) {
      return this.formContainers.find(el => el.title === containerTitle);
    },
    getJSON: function () {
      return {
        ID: this.id,
        Title: this.title,
        TitleLocale: this.titleLocale,
        Description: this.description,
        Entity: this.entity,
        FormContainers: this.formContainers.map(formContainer => formContainer.getJSON()),
        Layout: this.layout.getJSON()
      };
    }
  });
  return Form;
});