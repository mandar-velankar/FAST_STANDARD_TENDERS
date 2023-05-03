sap.ui.define(["../BaseObject", "./Form", "./Table"], function (BaseObject, Form, Table) {
  const XMLView = BaseObject.extend("com.bayer.tender.statenderapp.model.template.XMLView", {
    constructor: function (data) {
      BaseObject.prototype.constructor.call(this);
      this.forms = [];
      this.formByName = {};
      this.tables = [];
      this.tableByName = {};
      if (data) {
        this.id = data.ID;
        this.viewName = data.ViewName;
        this.description = data.Description;
        for (const formData of data.Forms) {
          const form = new Form(formData);
          this.forms.push(form);
          this.formByName[form.description.replace(/\s/g,'')] = form;
        }
        for(const tableData of data.Tables){
          const table = new Table(tableData);
          this.tables.push(table);
          this.tableByName[table.title.replace(/\s/g,'')] = table;
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