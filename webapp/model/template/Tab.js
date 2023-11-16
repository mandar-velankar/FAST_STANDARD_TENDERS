sap.ui.define(["../BaseObject", "./XMLView"], function (BaseObject, XMLView) {
  const Tab = BaseObject.extend("com.bayer.tender.statenderapp.model.template.Tab", {
    constructor: function (data) {
      BaseObject.prototype.constructor.call(this);
      if (data) {
        this.id = data.ID;
        this.title = data.Title;
        this.description = data.Description;
        this.icon = data.Icon;
        this.xmlView = data?.XMLView && new XMLView(data.XMLView);
      }
    },

    getXMLView: function(){
      return this.xmlView;
    },
    
    getJSON: function () {
      return {
        ID: this.id,
        Title: this.title,
        Description: this.description,
        Icon: this.icon,
        XMLView: this.xmlView.getJSON()
      };
    }
  });
  return Tab;
});