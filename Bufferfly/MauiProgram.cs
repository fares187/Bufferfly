using CommunityToolkit.Maui;
using Microsoft.Extensions.Logging;

namespace Bufferfly
{
    public static class MauiProgram
    {
        public static MauiApp CreateMauiApp()
        {
            var builder = MauiApp.CreateBuilder();
            builder
                .UseMauiApp<App>()
                .UseMauiCommunityToolkit()
                .ConfigureFonts(fonts =>
                {
                    fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                    fonts.AddFont("Roboto-Thin.ttf", "Roboto");
                    fonts.AddFont("Roboto-Regular.ttf", "Roboto-Bold");
                });

            builder.Services.AddMauiBlazorWebView();
            builder.Services.AddBlazorWebViewDeveloperTools();
            builder.Services.AddSingleton<MainPage>();

#if DEBUG
    		builder.Services.AddBlazorWebViewDeveloperTools();
    		builder.Logging.AddDebug();
#endif

            return builder.Build();
        }
    }
}
