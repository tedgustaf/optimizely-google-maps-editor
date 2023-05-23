# Google Maps Editor for Optimizely

Editor for specifying coordinates in Optimizely CMS.

## Summary
Solution consists of one project for the add-on (`GoogleMapsEditor` folder) and a second website project for testing the editor (`Testsite` folder).

The website project was set up using the **Optimizely CMS empty** Visual Studio template.

# Get started
1. Clone project
1. Create an empty database and update `appsettings.json` for the `Testsite` project (or run `create-db.bat` in the solution folder if you're using `LocalDB`) 
1. Add a Google Maps API key to `appsettings.json` for the `Testsite` project
1. Start `Testsite` project and browse to https://localhost:44300/ which will prompt you to create an admin user
1. Access the Optimizely UI through: https://localhost:44300/episerver/cms using the credentials of the admin user
1. Create a new page of type `SamplePageType`
1. Configure a site in Optimizely
1. Testi the Google Maps editor

> Note: The add-on does not include any template rendering, for example to show a map to site visitors. It only focuses on the CMS editing experience.

# Create NuGet package
1. Increment `<FileVersion>` number as required in `GoogleMapsEditor.csproj`
1. Append preview version identifier, if any, to the `<PackageVersion>` element in `GoogleMapsEditor.csproj`
1. Build project in `Release` mode
1. The NuGet package is stored in `bin\Release`