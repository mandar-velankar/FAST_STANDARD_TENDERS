sap.ui.define(["sap/ui/model/odata/v2/ODataModel", "../BaseObject", "./Table", "./Tab", "./Form"], function (ODataModel, BaseObject, Table, Tab, Form) {
  const Template = BaseObject.extend("com.bayer.tender.statenderapp.model.template.Template", {
    constructor: function (data) {
      BaseObject.prototype.constructor.call(this);
      this.tabs = [];
      if (data) {
        this.id = data.ID;
        this.title = data.Title;
        this.service = data.Service;
        this.type = data.Type;
        this.tabByName = {};
        data.Table && (this.table = new Table(data.Table));
        data.Form && (this.form = new Form(data.Form));
        if (data.Tabs) {
          for (const tab of data.Tabs) {
            const tabObj = new Tab(tab);
            this.tabs.push(tabObj);
            this.tabByName[this.convertToPascalCase(tabObj.title)] = tabObj;
          }
        }
      }
    },
    getId: function () {
      return this.id;
    },
    getODataModel: function () {
      return new ODataModel(`/v2/${this.service}`);
    },
    getTable: function () {
      return this.table;
    },
    
    getTab: function (tabName) {
      if(!tabName) tabName = this.tabs[0].title;
      return this.tabs.find(t=>t.title === tabName);
    },
   
    getJSON: function () {
      return {
        ID: this.id,
        Title: this.title,
        Service: this.service,
        Type: this.type,
        Table: this.table.getJSON(),
        Tabs: this.tabs.map(tab => tab.getJSON())
      };
    },

    convertToPascalCase: function(strValue) {
      return strValue.replace(/\s/g, '').replace(/(?:^\w|[A-Z]|\b\w)/g, function(match) {
        return match.toUpperCase();
      });
    }

  });
  return Template;
});