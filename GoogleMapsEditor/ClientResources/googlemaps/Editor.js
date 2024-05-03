define([
    "dojo/on",
    "dojo/_base/declare", // Used to declare the actual widget
    "dijit/_Widget", // Base class for all widgets
    "dijit/_WidgetBase", // Base class for all widgets
    "dijit/_TemplatedMixin", // Widgets will be based on an external template (string literal, external file, or URL request)
    "dijit/_WidgetsInTemplateMixin", // The widget will in itself contain additional widgets
    "dijit/form/TextBox", // Base class for all widgets
    "epi/shell/widget/dialog/LightWeight", // Used to display the help message
    "dojo/i18n!./nls/Labels", // Localization files containing translations
    "dojo/text!./WidgetTemplate.html",
    'xstyle/css!./WidgetTemplate.css' // CSS to load when widget is loaded
],
function (
    on,
    declare,
    _Widget,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    TextBox,
    LightWeight,
    Labels,
    template
) {
    return declare([TextBox, _WidgetsInTemplateMixin], {

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

        value: null, // Without this, the CMS will not assign a value to the widget

        templateString: template,

        // Logs a message to console if in UI debug mode
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

        // Event used to notify the CMS that the property value has changed
        onChange: function (value) {
            this.inherited(arguments);
        },

        // Dojo event fired after all properties of a widget are defined, but before the fragment itself is added to the main HTML document
        postCreate: function () {

            // Call base implementation of postCreate, passing on any parameters
            this.inherited(arguments);

            // Create global editor object if one doesn't already exist, including global event for when Google Maps script has finished loading
            if (!window.googleMapsEditor) {
                window.googleMapsEditor = {};

                window.googleMapsEditor.scriptLoadedEvent = new Event("googleMapsScriptLoaded");
            }

            const that = this; // Use selfie to reduce number of scope binds

            // Display help when help icon is clicked
            on(this.helpIcon, "click", function (e) {
                e.preventDefault();

                if (!that._helpDialog) {

                    that._helpDialog = new LightWeight({
                        style: "width: 540px",
                        closeIconVisible: true,
                        showButtonContainer: false,
                        onButtonClose: function () {
                            that._helpDialog.hide();
                        },
                        _endDrag: function () {
                            // HACK Avoid CMS bug, "Cannot read property 'userSetTransformId' of null" when close icon is clicked
                        },
                        title: that._localized.help.dialogTitle,
                        content: that._localized.help.dialogHtml
                    });
                }

                if (that._helpDialog.open) {
                    that._helpDialog.hide();
                } else {
                    that._helpDialog.show();
                }
            });

            on(this.clearIcon, "click", function (e) {
                this.clearCoordinates();   
            }.bind(this));
        },

        // Dojo event triggered after 'postCreate', for example when JS resizing needs to be done
        startup: function () {

            this.inherited(arguments);

            if (!this.apiKey) {
                console.warn("[GoogleMapsEditor] Google Maps API key not set, ensure custom editor setting 'apiKey' is set through editor descriptor");
            }

            const signal = on(document, "googleMapsScriptLoaded", function (e) {

                console.log("yyy googleMapsScriptLoaded event fired");

                this.initializeMap();

                signal.remove();

            }.bind(this));

            this.own(signal);

            // Callback for Google Maps script, specified through script URL
            if (!window.googleMapsScriptCallback) {

                console.log("yyy Adding Google Maps script callback function");

                //this.log("Adding Google Maps script callback function...");

                window.googleMapsScriptCallback = function () {
                    //this.log("Google Maps loaded", {
                    //    google: google
                    //});

                    console.log("yyy Google Maps loaded");

                    document.dispatchEvent(googleMapsEditor.scriptLoadedEvent);

                }.bind(this);
            }

            // Add Google Maps script unless already loaded
            const googleMapsScriptElementId = "googleMapsEditor-script";

            console.log("yyy try to get element with ID", googleMapsScriptElementId);

            const scriptTagAlreadyAdded = !!document.getElementById(googleMapsScriptElementId);

            if (!scriptTagAlreadyAdded) {
                console.log("yyy script tag not added, adding it");

                const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&loading=async&libraries=places&callback=googleMapsScriptCallback`;

                //this.log("Loading Google Maps script...", scriptUrl);
                const firstScriptTag = document.getElementsByTagName("script")[0];
                const tag = document.createElement("script");
                tag.id = googleMapsScriptElementId,
                tag.src = scriptUrl;
                tag.defer = true;
                
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

                console.log("yyy added maps script");
            }

            //console.log("script tag added, if applicable", {
            //    scriptTagAlreadyAdded: scriptTagAlreadyAdded,
            //    googleMapsEditor: window.googleMapsEditor,
            //    map: this._map
            //});

            //if (scriptTagAlreadyAdded && window.googleMapsEditor && !this._map) { // Already loaded, for example when widget is re-created during on-page editing
            //    console.log("re-initializing map using existing script tag");

            //    this.initializeMap();
            //}
        },

        // Dojo event triggered when widget is removed
        destroy: function () {
            this.inherited(arguments); // Important to ensure inherited widgets are destroyed properly, failure to do this risks memory leaks

            //this.log("Cleaning up map...");

            // Clean up Google Maps (as much as possible, but there is a known issue with Google Maps: https://code.google.com/p/gmaps-api-issues/issues/detail?id=3803)
            if (this._marker) {
                this._marker.setMap(null);
            }

            if (this._map && this._map.parentNode) {
                google.maps.event.clearListeners(this._map, 'rightclick');
                this._map.parentNode.removeChild(this._map);
                this._map = null;
            }
        },

        // Checks if the current property value is valid (invoked by Optimizely)
        isValid: function () {

            if (this.required) { // Making use of _ValueRequiredMixin to check if a property value is required
                return this.hasCoordinates();
            }

            return true;
        },

        // Checks if the current value is valid coordinates
        hasCoordinates: function () {

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

        // Determine if the property is complex type, i.e. local block with separate properties for longitude and latitude, as opposed to a simple string property
        _isComplexType: function (value) {

            console.log("yyy _isComplexType()");

            let valueToCheck = value;

            if (!valueToCheck) {
                valueToCheck = this.value;
            }

            if (valueToCheck) {
                console.log("yyy returning", typeof valueToCheck === "object");
                return typeof valueToCheck === "object";
            }

            if (Array.isArray(this.properties)) {
                console.log("yyy returning", this.properties.length > 0);
                return this.properties.length > 0;
            }

            if (this.metadata && Array.isArray(this.metadata.properties)) {
                console.log("yyy returning", this.metadata.properties.length > 0);
                return this.metadata.properties.length > 0;
            }

            console.log("not complex type");

            return false;
        },

        // Setter for value property (invoked by the CMS on load)
        _setValueAttr: function (value) {

            console.log("yyy setValueAttr", value);

            this.inherited(arguments);

            //this.log(`Value set for property '${this.label}'`, {
            //    this: this,
            //    value: value
            //});

            if (value === null && this.value === null) {

                //this.log("Value has not changed");

                return;
            }

            let isStringProperty = !this._isComplexType();

            console.log("yyy isStringProperty", isStringProperty);

            // Skip if the new property value is identical to the current one, and map was already initialized
            if (this._map && ((value === null && this.value === null) ||
                (isStringProperty && value === this.value) ||
                (!isStringProperty && value && this.value && value["longitude"] === this.value["longitude"] && value["latitude"] === this.value["latitude"]))) {

                //this.log("Value has not changed");

                console.log("yyy value not changed and map was already initialized", {
                    newValue: value,
                    currentValue: this.value,
                    map: this._map
                });

                return;
            }

            // Update the widget (i.e. property) value
            console.log("yyy value before", this.value);
            this._set("value", value);
            console.log("yyy value after", this.value);

            const refreshValue = function () {

                console.log("yyy refreshValue", {
                    hasCoordinates: this.hasCoordinates()
                });

                if (!this._map) {
                    console.log("yyy no map, initializing...");
                    this.initializeMap();
                }

                // If the value set is empty then clear the coordinates
                if (!this.hasCoordinates()) {

                    console.log("yyy does not have coordinates");

                    this.clearCoordinates();

                    // Set map location to default coordinates
                    location = new google.maps.LatLng(this.defaultCoordinates.latitude, this.defaultCoordinates.longitude);

                    this.setMapLocation(location, null, true, true);

                    return;
                }

                console.log("yyy has coordinates");

                let location, latitude, longitude;

                if (this._isComplexType()) {
                    latitude = value.latitude;
                    longitude = value.longitude;

                } else {
                    const coordinates = value.split(",");
                    latitude = parseFloat(coordinates[0]);
                    longitude = parseFloat(coordinates[1]);
                }

                location = new google.maps.LatLng(latitude, longitude);

                this.setMapLocation(location, null, true);
            }.bind(this);

            // Ensure Google Maps is loaded
            console.log("yyy checking if google is loaded", {
                google: window.google,
                hasOwnProperty: window.hasOwnProperty("google")
            });

            if (window.hasOwnProperty("google")) {
                //this.log("Google Maps already loaded", window.google);

                refreshValue();
            }
            else {
                const signal = on(document, "scriptLoaded", function () {
                    console.log("yyy scriptLoaded event fired");

                    refreshValue();

                    signal.remove();
                }.bind(this));

                this.own(signal);
            }
        },

        // Update widget value when a coordinate is changed
        _onCoordinateChanged: function (location) {

            if (!this._started) {
                return;
            }

            //this.log("Coordinates changed", location);

            const longitude = location.lng(),
                  latitude = location.lat();

            if (longitude === undefined || latitude === undefined) {
                return;
            }

            // Get the new value in the correct format
            let value;
            if (this._isComplexType()) {
                value = {
                    "latitude" : parseFloat(latitude),
                    "longitude" : parseFloat(longitude)
                };
            } else {
                value = latitude + "," + longitude;
            }

            // Set the widget (i.e. property) value and trigger change event to notify the CMS (and possibly others) that the value has changed
            this.onFocus(); // Otherwise onChange event won't trigger correctly from the widget
            this._set("value", value);
            this.onChange(value);
        },

        // Clears the coordinates, i.e. the property value (the clear button's click event is wired up through a 'data-dojo-attach-event' attribute in the HTML template)
        clearCoordinates: function () {

            //this.log("Clearing coordinates...");

            // Clear search box
            this.searchTextbox.set("value", '');

            // Remove the map marker, if any
            if (this._marker) {
                this._marker.setMap(null);
                this._marker = null;
            }

            // Null the widget (i.e. property) value and trigger change event to notify the CMS (and possibly others) that the value has changed
            this.onFocus(); // Otherwise onChange event won't trigger correctly from the widget
            this._set("value", null);
            this.onChange(null);
        },

        // Setup the Google Maps canvas
        initializeMap: function () {

            console.log("yyy initializeMap", {
                this: this,
                hasCoordinates: this.hasCoordinates()
            });

            //this.log(`Initializing map for property '${this.name}'...`);

            let mapCoordinates = new google.maps.LatLng(this.defaultCoordinates.latitude, this.defaultCoordinates.longitude);

            // Center on current coordinates (i.e. property value), or a default location if no coordinates are set
            if (this.hasCoordinates()) {

                let latitude, longitude;

                if (this._isComplexType()) {
                    latitude = this.value.latitude;
                    longitude = this.value.longitude;

                } else {
                    const coordinates = this.value.split(",");
                    latitude = parseFloat(coordinates[0]);
                    longitude = parseFloat(coordinates[1]);
                }

                //this.log("Initializing with saved coordinates", this.value);

                mapCoordinates = new google.maps.LatLng(latitude, longitude);
            }
            else {
                //this.log("Initializing with default coordinates", this.defaultCoordinates);
            }

            // Render the map, but disable interaction if property is readonly
            const mapOptions = {
                zoom: parseInt(this.defaultZoom),
                disableDefaultUI: true,
                center: mapCoordinates,
                disableDoubleClickZoom: this.readOnly,
                scrollwheel: !this.readOnly,
                draggable: !this.readOnly
            };

            // Load the map
            console.log("yyy _map before", this._map);

            this._map = new google.maps.Map(this.canvas, mapOptions);

            console.log("yyy _map after", this._map);

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

            // Add a marker to indicate the current coordinates, if any
            console.log("yyy hasCoordinates()", this.hasCoordinates());
            if (this.hasCoordinates()) {
                this._marker = new google.maps.Marker({
                    position: this._map.getCenter(),
                    map: this._map
                });
            }

            // Allow user to change coordinates unless property is readonly
            if (!this.readOnly) {

                console.log("yyy map writable, setting up events for changing places");

                const that = this;

                // Update map marker and coordinate textboxes when map is right-clicked
                google.maps.event.addListener(this._map, "rightclick", function (event) {
                    that.setMapLocation(event.latLng, null, false);
                });

                // Add search textbox and when a place is selected, move pin and center map
                const searchBox = new google.maps.places.SearchBox(this.searchTextbox.textbox);

                // Remove Google Maps Searchbox default placeholder, as it won't recognize the placeholder attribute placed on the Textbox dijit
                console.log("yyy searchTextbox", this.searchTextbox);
                this.searchTextbox.textbox.setAttribute('placeholder', '');

                google.maps.event.addListener(searchBox, 'places_changed', function () {
                    const places = searchBox.getPlaces();

                    if (places.length == 0) {
                        return;
                    }
                    // Return focus to the textbox to ensure autosave works correctly and to also give a nice editor experience
                    that.searchTextbox.focus();
                    that.setMapLocation(places[0].geometry.location, 15, true);
                });
            } else {
                console.log("yyy map is read-only");
                // Disable search box and clear button
                this.searchTextbox.set("disabled", true);
            }
        },

        // Updates map marker location, centers on it (optional), and sets the zoom level (optional)
        setMapLocation: function (/* google.maps.LatLng */ location, zoom, center, skipMarker) {

            console.log("yyy setMapLocation", {
                location: location,
                map: this._map
            });

            if (!this._map) {
                //this.log("Re-initializing map...");
                this.initializeMap();
            }

            //this.log("Updating map location", {
            //    location: location,
            //    zoom: zoom,
            //    center: center,
            //    this: this
            //});

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

            // Trigger event to update the widget (i.e. property) value
            this._onCoordinateChanged(location);
        }
    });
});