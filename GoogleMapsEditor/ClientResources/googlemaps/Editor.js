define([
    "dojo/on",
    "dojo/_base/declare", // Used to declare the actual widget

    "dijit/_TemplatedMixin", // Widgets will be based on an external template (string literal, external file, or URL request)
    "dijit/_WidgetsInTemplateMixin", // The widget will in itself contain additional widgets
    "dijit/form/_FormValueWidget",

    "epi/shell/widget/dialog/LightWeight", // Used to display the help message

    "dojo/i18n!./nls/Labels", // Localization files containing translations
    "dojo/text!./WidgetTemplate.html",
    'xstyle/css!./WidgetTemplate.css' // CSS to load when widget is loaded
],
function (
    on,
    declare,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    _FormValueWidget,
    LightWeight,
    Labels,
    template
) {
    return declare([_FormValueWidget, _TemplatedMixin, _WidgetsInTemplateMixin], {

        // Property settings (set by editor descriptor and passed through constructor)
        apiKey: null, // API key valid for Google Maps JavaScript API and Places API
        defaultZoom: null, // Default zoom level, value between 1 and 20
        defaultCoordinates: null, // Coordinates to center the map on when property value is not set

        // The Google Maps object of this widget instance
        _map: null,

        // The map marker of this widget instance
        _marker: null,

        // Localizations able to be accessed from the template
        _localized: Labels,

        // Help dialog displayed when clicking the question mark icon
        _helpDialog: null,

        templateString: template,

        _setValueAttr: function (/*anything*/ newValue, /*Boolean?*/ priorityChange) {
            this.inherited(arguments);

            this.textbox.value = newValue;
        },

        _wireupIcons: function () {
            // Display help when help icon is clicked
            on(this.helpIcon, "click", function (e) {
                e.preventDefault();

                if (!this._helpDialog) {

                    this._helpDialog = new LightWeight({
                        style: "width: 540px",
                        closeIconVisible: true,
                        showButtonContainer: false,
                        onButtonClose: function () {
                            this._helpDialog.hide();
                        }.bind(this),
                        _endDrag: function () {
                            // HACK Avoid CMS bug, "Cannot read property 'userSetTransformId' of null" when close icon is clicked
                        }.bind(this),
                        title: this._localized.help.dialogTitle,
                        content: this._localized.help.dialogHtml
                    });
                }

                if (this._helpDialog.open) {
                    this._helpDialog.hide();
                } else {
                    this._helpDialog.show();
                }
            }.bind(this));

            // Clear coordinates when icon is clicked
            on(this.clearIcon, "click", function (e) {
                this.clearCoordinates();
            }.bind(this));
        },

        /**
         * Logs a message to console locally.
         * @param {any} message
         * @param {any} data
         * @returns
         */
        log: function (message, data) {
            if (!window.location.hostname === "localhost" && !window.location.hostname.endsWith(".local")) {
                return;
            }

            const messageWithPrefix = `[GoogleMapsEditor] ${message}`;

            if (data) {
                console.log(messageWithPrefix, data);
            }
            else {
                console.log(messageWithPrefix);
            }
        },

        /**
         * Add Google Maps script unless already loaded.
         */
        _addGoogleMapsScript: function () {

            const callbackFunctionName = "googleMapsScriptCallback";

            // Create global editor object if one doesn't already exist, including global event for when Google Maps script has finished loading
            if (!window.googleMapsEditor) {
                window.googleMapsEditor = {};

                window.googleMapsEditor.scriptLoadedEvent = new Event("googleMapsScriptLoaded");
            }

            // Wire up event to initialize map object once script has loaded
            const signal = on(document, "googleMapsScriptLoaded", function (e) {

                console.log("yyy googleMapsScriptLoaded event fired");

                // this.initializeMap();

                signal.remove();

            }.bind(this));

            this.own(signal);

            // Add global callback function for Google Maps to invoke when script has loaded
            if (!window[callbackFunctionName]) {

                console.log("yyy Adding Google Maps script callback function");

                //this.log("Adding Google Maps script callback function...");

                window[callbackFunctionName] = function () {
                    //this.log("Google Maps loaded", {
                    //    google: google
                    //});

                    console.log("yyy Google Maps loaded");

                    document.dispatchEvent(googleMapsEditor.scriptLoadedEvent);

                }.bind(this);
            }

            const googleMapsScriptElementId = "googleMapsEditor-script";

            console.log("yyy try to get element with ID", googleMapsScriptElementId);

            const scriptTagAlreadyAdded = !!document.getElementById(googleMapsScriptElementId);

            if (!scriptTagAlreadyAdded) {
                console.log("yyy script tag not added, adding it");

                const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&loading=async&libraries=places&callback=${callbackFunctionName}`;

                this.log("Loading Google Maps script...", scriptUrl);
                                
                const tag = document.createElement("script");
                tag.id = googleMapsScriptElementId,
                tag.src = scriptUrl;
                tag.defer = true;

                const firstScriptTag = document.getElementsByTagName("script")[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

                console.log("yyy added maps script");
            }
        },

        postCreate: function () {

            this.inherited(arguments);

            this._wireupIcons();

            this._addGoogleMapsScript();
        },
    });  
});