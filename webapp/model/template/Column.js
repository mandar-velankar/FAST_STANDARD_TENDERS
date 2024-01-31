sap.ui.define(["../BaseObject", "./Control", "sap/m/ViewSettingsItem"], function (BaseObject, Control, ViewSettingsItem) {
  const Column = BaseObject.extend("com.bayer.tender.statenderapp.model.template.Column", {
    constructor: function (tableId, data) {
      BaseObject.prototype.constructor.call(this);
      if (data) {
        this.id = data.ID;
        this.title = data.Title;
        this.titleLocale = data.TitleLocale;
        this.importance = data.Importance;
        this.isValueHelpKey = data.IsValueHelpKey;
        this.isValueHelpText = data.IsValueHelpText;
        this.control = Control?new Control(tableId, data.Control):new com.bayer.tender.statenderapp.model.template.Control(tableId, data.Control);
      }
    },
    getControl: function () {
      return this.control;
    },
    getTitle: function () {
      return this.title;
    },

    generateViewSettingsItem: function (index, i18nModel) {
      let key = this.getControl().getPropertiesAsObject().text.replace(/{|}/g, '');
      if(key.includes("path")){
        key = key.split(',').find(e=>e.includes('path')).split("'")[1];
      }
      let text = `{i18n>${this.convertToUpperCamelCase(key)}}`;
      return new ViewSettingsItem({
        'key': key, 
        'text': text,
        'selected': index === 0 
      });
    },

    getJSON: function () {
      return {
        ID: this.id,
        Title: this.title,
        TitleLocale: this.titleLocale,
        Control: this.control.getJSON()
      };
    }
  });
  return Column;
});