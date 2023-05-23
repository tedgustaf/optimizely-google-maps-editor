using EPiServer.Shell.Modules;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Linq;

namespace GoogleMapsEditor;

/// <summary>
/// Provides extension method for adding Google Maps editor support to an Optimizely website.
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Gets or sets the API key to use for Google Maps.
    /// </summary>
    public static string ApiKey { get; set; }

    public static int DefaultZoom { get; set; }

    public static double DefaultLatitude { get; set; }

    public static double DefaultLongitude { get; set; }

    const string ADDON_NAME = "GoogleMapsEditor";

    /// <summary>
    /// Enables the Google Maps Editor.
    /// </summary>
    /// <param name="apiKey">Google Maps API key</param>
    /// <param name="defaultZoom">Default zoom level from 1 (least) to 20 (most).</param>
    /// <param name="defaultLongitude">Default longitude coordinate when no property value is set.</param>
    /// <param name="defaultLatitude">Default latitude coordinate when no property value is set.</param>
    /// <param name="services"></param>
    public static IServiceCollection AddGoogleMapsEditor(this IServiceCollection services, string apiKey, int defaultZoom = 5, double defaultLatitude = 59.33564361359625, double defaultLongitude = 18.03014159202576)
    {
        ApiKey = apiKey;
        DefaultZoom = defaultZoom;
        DefaultLongitude = defaultLongitude;
        DefaultLatitude = defaultLatitude;

        services.Configure<ProtectedModuleOptions>(
                pm =>
                {
                    if (!pm.Items.Any(i => i.Name.Equals(ADDON_NAME, StringComparison.OrdinalIgnoreCase)))
                    {
                        pm.Items.Add(new ModuleDetails
                        {
                            Name = ADDON_NAME
                        });
                    }
                });

        return services;
    }
}
