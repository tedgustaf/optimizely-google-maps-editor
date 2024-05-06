using EPiServer.Cms.Shell;
using EPiServer.Cms.UI.AspNetIdentity;
using EPiServer.Framework.Hosting;
using EPiServer.Framework.Web.Resources;
using EPiServer.Scheduler;
using EPiServer.Web.Hosting;
using EPiServer.Web.Routing;
using GoogleMapsEditor;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Diagnostics;
using System.IO;

namespace Testsite;

public class Startup
{
    private readonly IWebHostEnvironment _webHostEnvironment;
    private readonly IConfiguration _configuration;

    public Startup(IWebHostEnvironment webHostEnvironment, IConfiguration configuration)
    {
        _webHostEnvironment = webHostEnvironment;
        _configuration = configuration;
    }

    public void ConfigureServices(IServiceCollection services)
    {
        services
            .AddCmsAspNetIdentity<ApplicationUser>()
            .AddCms()
            .AddAdminUserRegistration()
            .AddEmbeddedLocalization<Startup>()
            .Configure<RazorPagesOptions>(x => x.RootDirectory = "/");

        // Enable the Google Maps Editor add-on if an API key has been specified
        if (_configuration["GoogleMaps:ApiKey"] is string apiKey && !string.IsNullOrWhiteSpace(apiKey))
        {
            services.AddGoogleMapsEditor(apiKey);

            if (_webHostEnvironment.IsDevelopment())
            {
                // Configure site for add-ondevelopment, meaning files for the Google Maps Editor add-on will be loaded directly from its project folder.
                var uiSolutionFolder = Path.Combine(_webHostEnvironment.ContentRootPath, @"..\");

                services.Configure<CompositeFileProviderOptions>(c =>
                {
                    c.BasePathFileProviders.Add(new MappingPhysicalFileProvider($"/EPiServer/GoogleMapsEditor", string.Empty, Path.Combine(uiSolutionFolder, "GoogleMapsEditor")));
                });
            }
        }
        else
        {
            Console.Error.WriteLine("Google Maps API key missing");
        }

        if (_webHostEnvironment.IsDevelopment())
        {
            services.Configure<ClientResourceOptions>(x => x.Debug = Debugger.IsAttached) // CMS UI debug logging when the debugger is attached
                    .Configure<SchedulerOptions>(x => x.Enabled = false) // Disable scheduled jobs
                    .AddRazorPages().AddRazorRuntimeCompilation();
        }

    }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        if (env.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
        }

        app.UseStaticFiles();
        app.UseRouting();
        app.UseAuthentication();
        app.UseAuthorization();

        app.UseEndpoints(endpoints =>
        {
            endpoints.MapContent();
        });
    }
}
