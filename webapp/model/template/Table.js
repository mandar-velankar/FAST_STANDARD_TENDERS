sap.ui.define(["../BaseObject", "./Column"], function (BaseObject, Column) {
  const Table = BaseObject.extend("com.bayer.tender.statenderapp.model.template.Table", {
    constructor: function (data) {
      BaseObject.prototype.constructor.call(this);
      this.columns = [];
      if (data) {
        this.id = data.ID;
        this.title = data.Title;
        for (const col of data.Columns) {
          this.columns.push(new Column(col));
        }
      }
    },
    getColumns: function () {
      return this.columns;
    },
    getJSON: function () {
      return {
        ID: this.id,
        Title: this.title,
        Columns: this.columns.map(col => col.getJSON())
      };
    }
  });
  return Table;
});