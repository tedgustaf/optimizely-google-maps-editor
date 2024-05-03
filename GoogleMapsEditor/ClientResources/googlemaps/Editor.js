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

            if (this._marker == null) // Initial load
            {
                this._refreshMarkerLocation();
            }
        },

        /**
         * Checks if the current property value is valid (invoked by Optimizely).
         * @returns
         */
        isValid: function () {

            if (this.required) { // Making use of _ValueRequiredMixin to check if a property value is required
                return this.hasCoordinates();
            }

            return true;
        },

        /**
         * Determines if the property is complex type, i.e. local block with separate properties for longitude and latitude, as opposed to a simple string property.
         * @param {any} value
         * @returns
         */
        _isComplexType: function (value) {

            let valueToCheck = value;

            if (!valueToCheck) {
                valueToCheck = this.value;
            }

            if (valueToCheck) {
                return typeof valueToCheck === "object";
            }

            if (Array.isArray(this.properties)) {
                return this.properties.length > 0;
            }

            if (this.metadata && Array.isArray(this.metadata.properties)) {
                return this.metadata.properties.length > 0;
            }

            return false;
        },

        /**
         * Checks if the current value is valid coordinates.
         * @returns
         */
        _hasCoordinates: function () {

            if (!this.value) {
                return false;
            }

            if (this._isComplexType()) {
                return typeof this.value.latitude !== "undefined" &&
                    typeof this.value.longitude !== "undefined" &&
                    this.value.longitude !== null &&
                    this.value.latitude !== null &&
                    !isNaN(this.value.longitude) &&
                    !isNaN(this.value.latitude) &&
                    this.value.longitude !== 0 &&
                    this.value.latitude !== 0;

            }
            else if (typeof this.value === "string") {
                return this.value.split(',').length == 2; // String value with comma-separated coordinates
            }

            return false;
        },

        /**
         * Clears the coordinates, i.e. the property value (the clear button's click event is wired up through a 'data-dojo-attach-event' attribute in the HTML template).
         */
        _clearCoordinates: function () {

            //this.log("Clearing coordinates...");

            // Clear search box
            this.searchTextbox.set("value", '');

            // Remove the map marker, if any
            if (this._marker) {
                this._marker.setMap(null);
                this._marker = null;
            }

            // Null the widget (i.e. property) value and trigger change event to notify the CMS (and possibly others) that the value has changed
            // this.onFocus(); // Otherwise onChange event won't trigger correctly from the widget
            // this._set("value", null);
            this.set("value", null);
            //this.onChange(null);
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
                this._clearCoordinates();
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
         * @returns True if script was added, false if ignored because script had already been added.
         */
        _addGoogleMapsScript: function () {

            const callbackFunctionName = "googleMapsScriptCallback";

            // Create global editor object if one doesn't already exist, including global event for when Google Maps script has finished loading
            if (!window.googleMapsEditor) {
                window.googleMapsEditor = {};

                window.googleMapsEditor.scriptLoadedEvent = new Event("googleMapsScriptLoaded");
            }

            // Add global callback function for Google Maps to invoke when script has loaded
            if (!window[callbackFunctionName]) {

                window[callbackFunctionName] = function () {
                    this.log("Google Maps loaded", {
                        google: google
                    });

                    document.dispatchEvent(googleMapsEditor.scriptLoadedEvent);

                }.bind(this);
            }

            const googleMapsScriptElementId = "googleMapsEditor-script";

            const scriptTagAlreadyAdded = !!document.getElementById(googleMapsScriptElementId);

            if (!scriptTagAlreadyAdded) {
                const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&loading=async&libraries=places&callback=${callbackFunctionName}`;

                this.log("Loading Google Maps script...", scriptUrl);
                                
                const tag = document.createElement("script");
                tag.id = googleMapsScriptElementId,
                tag.src = scriptUrl;
                tag.defer = true;

                const firstScriptTag = document.getElementsByTagName("script")[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            }
            else if (typeof google === "object" && typeof google.maps === "object") { // Script already loaded, for example when page is refreshed within the CMS UI
                window[callbackFunctionName]();
            }
        },

        /**
         * Initializes the Google Maps DOM element.
         */
        _createGoogleMapsElement: function () {

            const initialCoordinates = new google.maps.LatLng(this.defaultCoordinates.latitude, this.defaultCoordinates.longitude);

            // Render the map, but disable interaction if property is readonly
            const mapOptions = {
                zoom: parseInt(this.defaultZoom),
                disableDefaultUI: true,
                center: initialCoordinates,
                disableDoubleClickZoom: this.readOnly,
                scrollwheel: !this.readOnly,
                draggable: !this.readOnly
            };

            // Load the map
            this._map = new google.maps.Map(this.canvas, mapOptions);

            // Display grayscale map if property is readonly
            if (this.readOnly) {

                const grayStyle = [{
                    featureType: "all",
                    elementType: "all",
                    stylers: [{ saturation: -100 }]
                }];

                const mapType = new google.maps.StyledMapType(grayStyle, { name: "Grayscale" });

                this._map.mapTypes.set('disabled', mapType);

                this._map.setMapTypeId('disabled');
            }

            // Allow user to change coordinates unless property is readonly
            if (!this.readOnly) {

                // Update map marker when map is right-clicked
                google.maps.event.addListener(this._map, "rightclick", function (event) {
                    this._setMapLocation(event.latLng, null, false, false);

                    this._setCoordinatesValue(event.latLng);
                }.bind(this));

                // Add search textbox and when a place is selected, move pin and center map
                const searchBox = new google.maps.places.SearchBox(this.searchTextbox.textbox);

                // Remove Google Maps Searchbox default placeholder, as it won't recognize the placeholder attribute placed on the Textbox dijit
                this.searchTextbox.textbox.setAttribute('placeholder', '');

                google.maps.event.addListener(searchBox, 'places_changed', function () {
                    const places = searchBox.getPlaces();

                    if (places.length == 0) {
                        return;
                    }
                    // Return focus to the textbox to ensure autosave works correctly and to also give a nice editor experience
                    this.searchTextbox.focus();
                    const location = places[0].geometry.location;
                    this._setMapLocation(location, 15, true);
                    this._setCoordinatesValue(location);
                }.bind(this));
            } else {
                // Disable search box and clear button
                this.searchTextbox.set("disabled", true);
            }
        },

        /**
         * Sets the widget value, in either string or object format depending on underlying property type, to the specified location.
         * @param {google.maps.LatLng} location
         * @returns
         */
        _setCoordinatesValue: function (location) {

            if (!this._started) {
                return;
            }

            const longitude = location.lng(),
                latitude = location.lat();

            if (longitude === undefined || latitude === undefined) {
                return;
            }

            // Get the new value in the correct format
            let value;
            if (this._isComplexType()) {
                value = {
                    "latitude": parseFloat(latitude),
                    "longitude": parseFloat(longitude)
                };
            } else {
                value = latitude + "," + longitude;
            }

            // Set the widget (i.e. property) value and trigger change event to notify the CMS (and possibly others) that the value has changed
            this.set("value", value);

            if (this._isComplexType()) {
                this.onChange(value); // Otherwise onChange won't trigger correctly for complex property types
            }
        },

        /**
         * Updates map location.
         * @param {any} location
         * @param {any} zoom Initial zoom level, a value between 1 and 20 (optional).
         * @param {any} center Whether to center on the new map marker location (optional).
         * @param {any} skipMarker Whether to skip adding a pin to the new map location (optional).
         */
        _setMapLocation: function (/* google.maps.LatLng */ location, zoom, center, skipMarker) {

            if (!this._map) {
                return;
            }

            // Set the marker's position and coordinate textboxes, unless marker is ignored (for example when setting to default coordiantes)
            if (!skipMarker) {

                if (!this._marker) { // No marker yet, create one
                    this._marker = new google.maps.Marker({
                        map: this._map
                    });
                }

                this._marker.setPosition(location);
            }

            // Center on the location (optional)
            if (center) {
                this._map.setCenter(location);
            }

            // Set map zoom level (optional)
            if (zoom) {
                this._map.setZoom(zoom);
            }
        },

        /**
         * Sets map location and marker based on current value.
         */
        _refreshMarkerLocation: function () {

            if (!this._map) {
                // Map not initialized;
                return;
            }

            let location;

            // If the value set is empty then clear the coordinates
            if (!this._hasCoordinates()) {

                // Set map location to default coordinates
                location = new google.maps.LatLng(this.defaultCoordinates.latitude, this.defaultCoordinates.longitude);

                this._setMapLocation(location, null, true, true);

                return;
            }

            let latitude, longitude;

            if (this._isComplexType()) {
                latitude = this.value.latitude;
                longitude = this.value.longitude;

            } else {
                const coordinates = this.value.split(",");
                latitude = parseFloat(coordinates[0]);
                longitude = parseFloat(coordinates[1]);
            }

            location = new google.maps.LatLng(latitude, longitude);

            this._setMapLocation(location, null, true, false);
        },

        /**
         * Wires up event to initialize map object once script has loaded.
         */
        _wireupGoogleMapsScriptLoaded: function () {
            const signal = on(document, "googleMapsScriptLoaded", function (e) {

                this._createGoogleMapsElement();

                this._refreshMarkerLocation();

                signal.remove();

            }.bind(this));

            this.own(signal);
        },

        postCreate: function () {

            this.inherited(arguments);

            this._wireupIcons();

            this._wireupGoogleMapsScriptLoaded();

            this._addGoogleMapsScript();
        },
    });  
});