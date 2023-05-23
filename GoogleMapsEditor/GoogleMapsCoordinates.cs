using EPiServer.Core;
using EPiServer.DataAnnotations;
using System.ComponentModel.DataAnnotations;

namespace GoogleMapsEditor;

/// <summary>
/// Represents latitude and longitude coordinates, used for local block properties.
/// </summary>
/// <remarks>Coordinates are currently not culture-specific.</remarks>
[ContentType(
    GUID = "8b6cd1b0-6001-4d6b-96d1-1515352f3681",
    DisplayName = "Google Maps coordinates",
    Description = "Used for local blocks to store latitude and longitude coordinates.",
    AvailableInEditMode = false)]
public class GoogleMapsCoordinates : BlockData
{
    [Display(Order = 1)]
    public virtual double? Latitude { get; set; }

    [Display(Order = 2)]
    public virtual double? Longitude { get; set; }
}
