sap.ui.define(["../BaseObject", "./Column"], function (BaseObject, Column) {
  const Table = BaseObject.extend("com.bayer.tender.statenderapp.model.template.Table", {
    constructor: function (data) {
      BaseObject.prototype.constructor.call(this);
      this.columns = [];
      if (data) {
        this.id = data.ID;
        this.title = data.Title;
        this.tableId = data.TableID;
        this.entity = data.Entity;
        for (const col of data.Columns) {
          if(Column){
            this.columns.push(new Column(this.tableId,col));
          }
          else{
            this.columns.push(new com.bayer.tender.statenderapp.model.template.Column(this.tableId,col));
          }
        }
      }
    },
    getColumns: function () {
      return this.columns;
    },

    hasColumn: function(path){
      const lowerCasePath = path.toLowerCase();
      return !!this.getColumns().find(cl => cl.control.properties.find(p => p.value.toLowerCase().includes(lowerCasePath)));
    },

    getEntity: function () {
      return this.entity;
    },
    getTitle: function () {
      return this.title;
    },
    getJSON: function () {
      return {
        ID: this.id,
        Title: this.title,
        Entity: this.entity,
        Columns: this.columns.map(col => col.getJSON())
      };
    }
  });
  return Table;
});