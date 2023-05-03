sap.ui.define(["../BaseObject", "./Form", "./Table"], function (BaseObject, Form, Table) {
  const XMLView = BaseObject.extend("com.bayer.tender.statenderapp.model.template.XMLView", {
    constructor: function (data) {
      BaseObject.prototype.constructor.call(this);
      this.forms = [];
      this.tables = [];
      if (data) {
        this.id = data.ID;
        this.viewName = data.ViewName;
        this.description = data.Description;
        for (const form of data.Forms) {
          this.forms.push(new Form(form));
        }
        for(const table of data.Tables){
          this.tables.push(new Table(table));
        }
      }
    },

    getName: function(){
      return this.viewName;
    },
    getJSON: function () {
      return {
        ID: this.id,
        ViewName: this.viewName,
        Description: this.description,
        Forms: this.forms.map(form => form.getJSON()),
        Tables: this.tables.map(table => table.getJSON())
      };
    }
  });
  return XMLView;
});