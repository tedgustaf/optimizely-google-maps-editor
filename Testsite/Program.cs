using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace Testsite;

public class Program
{
    public static void Main(string[] args) => CreateHostBuilder(args).Build().Run();

    public static IHostBuilder CreateHostBuilder(string[] args) =>
        Host.CreateDefaultBuilder(args)
            .ConfigureCmsDefaults()
            .ConfigureAppConfiguration(webBuilder => webBuilder.AddJsonFile("appsettings.user.json", optional: true))
            .ConfigureWebHostDefaults(webBuilder => webBuilder.UseStartup<Startup>());
}
