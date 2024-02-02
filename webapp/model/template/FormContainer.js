sap.ui.define(["../BaseObject", "./FormElement"], function (BaseObject, FormElement) {
  const FormContainer = BaseObject.extend("com.bayer.tender.statenderapp.model.template.FormContainer", {
    constructor: function (formId, data) {
      BaseObject.prototype.constructor.call(this);
      this.formElements = [];
      this.elementByName = {};
      if (data) {
        this.id = data.ID;
        this.title = data.Title;
        this.titleLocale = data.TitleLocale;
        for (const formElement of data.FormElements) {
          const element = new FormElement(formId, formElement)
          this.formElements.push(element);
          this.elementByName[element.label.replace(/\s/g,'')] = element;
        }
        // for(const control of data.Controls){
        //     this.controls.push(new Control(control));
        // }
      }
    },
    getFormElementByName: function (formElemLabel) {
      return this.formElements.find(el => el.label === formElemLabel);
    },
    getJSON: function () {
      return {
        ID: this.id,
        Title: this.title,
        TitleLocale: this.titleLocale,
        FormElements: this.formElements.map(formElement => formElement.getJSON())
      };
    }
  });
  return FormContainer;
});