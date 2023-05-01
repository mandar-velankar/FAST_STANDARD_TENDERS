sap.ui.define(["../BaseObject", "./Template"], function (BaseObject, Template) {
  const CountryTemplate = BaseObject.extend("com.bayer.tender.statenderapp.model.template.CountryTemplate", {
    constructor: function (data) {
      BaseObject.prototype.constructor.call(this);
      if (data) {
        this.countryCode = data.CountryCode;
        this.application = data.Application;
        this.page = data.Page;
        this.template = new Template(data.Template);
      }
    },
    getTemplate: function () {
      return this.template;
    },
    getJSON: function () {
      return {
        CountryCode: this.countryCode,
        Application: this.application,
        Page: this.page,
        Template: this.template.getJSON()
      };
    }
  });
  return CountryTemplate;
});