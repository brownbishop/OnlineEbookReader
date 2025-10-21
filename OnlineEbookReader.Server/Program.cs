using Microsoft.EntityFrameworkCore;
using OnlineEbookReader.Server.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddSwaggerGen();
builder.Services.AddOpenApi();

builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
   .AddJwtBearer(options =>
   {
       options.Authority = "OnlineEbookReader.domain";
       options.Audience = "OnlineEbookReader.Audience";
       options.RequireHttpsMetadata = false;
   });

builder.Services.AddAuthorization();

builder.Services.AddControllers();

var app = builder.Build();

app.UseDefaultFiles();
app.MapStaticAssets();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("/index.html");

app.Environment.WebRootPath = "wwwroot";

app.Run();
