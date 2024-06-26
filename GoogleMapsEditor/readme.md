﻿# Google Maps Editor for Optimizely

Editor for selecting map coordinates using Google Maps in Optimizely.
Released under the MIT license (http://opensource.org/licenses/MIT)

## Prerequisites

1. Valid API key for the Maps JavaScript API and the Places API

> Make sure the API key is unrestricted, or enabled for `localhost` for local development.

### Getting started

1. Add the following to your `ConfigureServices` method in the `Startup` class:
  `services.AddGoogleMapsEditor(googleMapsApiKey)`

  > Note: You may specify additional settings, such as default coordinates and zoom level.

1. Add a `string` property with `[UIHint("GoogleMaps")]` (or use the `GoogleMapsEditorDescriptor.UIHint` constant 
   for the UI hint name), or a local block property of type `GoogleMapsCoordinates`, to a content type.
 
   Properties of type `GoogleMapsCoordinates` are more developer-friendly as they separate latitude and longitude 
   and do not require a `UIHint` attribute, but they currently do not support culture-specific values.

   **Example 1:**
  
   ```
   public virtual GoogleMapsCoordinates MyCoordinates { get; set; }
   ```

   **Example 2:**
  
   ```
   [UIHint(GoogleMapsEditorDescriptor.UIHint)]
   public virtual string MyCoordinates { get; set; }
   ```