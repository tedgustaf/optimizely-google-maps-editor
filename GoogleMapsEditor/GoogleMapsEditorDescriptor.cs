using EPiServer.Shell.ObjectEditing;
using EPiServer.Shell.ObjectEditing.EditorDescriptors;
using System;
using System.Collections.Generic;

namespace GoogleMapsEditor;

[EditorDescriptorRegistration(TargetType = typeof(string), UIHint = UIHint, EditorDescriptorBehavior = EditorDescriptorBehavior.Default)]
[EditorDescriptorRegistration(TargetType = typeof(GoogleMapsCoordinates), EditorDescriptorBehavior = EditorDescriptorBehavior.Default)]
public class GoogleMapsEditorDescriptor : EditorDescriptor
{
    public const string UIHint = "GoogleMaps";

    public virtual string ApiKey { get; set; } = ServiceCollectionExtensions.ApiKey;

    public virtual int DefaultZoom { get; set; } = ServiceCollectionExtensions.DefaultZoom;

    public virtual double DefaultLatitude { get; set; } = ServiceCollectionExtensions.DefaultLatitude;

    public virtual double DefaultLongitude { get; set; } = ServiceCollectionExtensions.DefaultLongitude;

    public override void ModifyMetadata(ExtendedMetadata metadata, IEnumerable<Attribute> attributes)
    {
        ClientEditingClass = "googlemapseditor/Editor";

        // API key for the Google Maps JavaScript API
        metadata.EditorConfiguration.Add("apiKey", ApiKey);

        // Default zoom level from 1 (least) to 20 (most)
        // https://developers.google.com/maps/documentation/javascript/tutorial#zoom-levels
        metadata.EditorConfiguration.Add("defaultZoom", DefaultZoom);

        // Default coordinates when no property value is set
        metadata.EditorConfiguration.Add("defaultCoordinates", new { latitude = DefaultLatitude, longitude = DefaultLongitude });

        base.ModifyMetadata(metadata, attributes);
    }
}
