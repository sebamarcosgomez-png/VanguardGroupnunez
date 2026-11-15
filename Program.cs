using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Net.Http.Headers;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseWebRoot("wwwroot");
builder.Services.Configure<FormOptions>(o => o.MultipartBodyLengthLimit = 30L * 1024 * 1024);
var app = builder.Build();
var dataFile = Path.Combine(app.Environment.ContentRootPath, "Data", "site.json");
var backupDir = Path.Combine(app.Environment.ContentRootPath, "Data", "backups");
Directory.CreateDirectory(backupDir);
var fileLock = new SemaphoreSlim(1, 1);
var jsonOptions = new JsonSerializerOptions { WriteIndented = true };

app.Use(async (context, next) => {
    context.Response.Headers[HeaderNames.XContentTypeOptions] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    await next();
});
app.UseStaticFiles(new StaticFileOptions {
    OnPrepareResponse = ctx => {
        if (ctx.File.Name.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
            ctx.Context.Response.Headers.CacheControl = "no-store";
    }
});

bool IsLocalOrigin(HttpContext h) {
    // Restrict state changes to same-origin browser requests; localhost / VS are supported.
    var origin = h.Request.Headers.Origin.ToString();
    if (!string.IsNullOrEmpty(origin)) return Uri.TryCreate(origin, UriKind.Absolute, out var u)
        && string.Equals(u.Host, h.Request.Host.Host, StringComparison.OrdinalIgnoreCase)
        && u.Port == (h.Request.Host.Port ?? (h.Request.IsHttps ? 443 : 80))
        && u.Scheme == h.Request.Scheme;
    return h.Request.Headers["X-Requested-With"] == "PLUS-VG-ADMIN";
}
// Sin contraseña: el administrador solo puede utilizarse desde esta computadora.
bool IsLocalClient(HttpContext h) => h.Connection.RemoteIpAddress is { } ip
    && System.Net.IPAddress.IsLoopback(ip);
IResult? Guard(HttpContext h) => !IsLocalClient(h) ? Results.StatusCode(403)
    : !IsLocalOrigin(h) ? Results.StatusCode(403) : null;
async Task<string> ReadConfigAsync() {
    await fileLock.WaitAsync();
    try { return await File.ReadAllTextAsync(dataFile); }
    finally { fileLock.Release(); }
}

app.MapGet("/api/public/config.js", async (HttpContext h) => {
    // Serving configuration as JavaScript lets existing offline-style visualizations initialize without async races.
    var text = await ReadConfigAsync();
    h.Response.ContentType = "application/javascript; charset=utf-8";
    h.Response.Headers.CacheControl = "no-store";
    // Escape HTML closing and Unicode separators when embedding in JS.
    return Results.Text("window.PLUS_CONFIG = " + text.Replace("</", "<\\/").Replace("\u2028", "\\u2028").Replace("\u2029", "\\u2029") + ";", "application/javascript", Encoding.UTF8);
});
app.MapGet("/api/health", () => Results.Ok(new {status = "ok", app = "PLUS VG", version = "4.0"}));
app.MapGet("/api/admin/config", async (HttpContext h) => Guard(h) is { } err ? err : Results.Text(await ReadConfigAsync(), "application/json", Encoding.UTF8));
app.MapPut("/api/admin/config", async (HttpContext h) => {
    if (Guard(h) is { } err) return err;
    JsonNode? node;
    try { node = await JsonNode.ParseAsync(h.Request.Body); }
    catch { return Results.BadRequest(new {error="JSON inválido"}); }
    if (node is not JsonObject root || root["content"] is not JsonObject || root["scenes"] is not JsonArray || root["finance"] is not JsonObject)
        return Results.BadRequest(new {error="Estructura de configuración inválida"});
    if (root.ToJsonString().Length > 1024 * 1024) return Results.BadRequest(new {error="Configuración demasiado extensa"});
    await fileLock.WaitAsync();
    try {
        var stamp = DateTime.UtcNow.ToString("yyyyMMdd-HHmmss-fff");
        File.Copy(dataFile, Path.Combine(backupDir, $"site-{stamp}.json"), false);
        var path = dataFile + ".tmp";
        await File.WriteAllTextAsync(path, root.ToJsonString(jsonOptions));
        File.Move(path, dataFile, true);
        // Only retain last 15 backups
        foreach (var old in Directory.GetFiles(backupDir, "site-*.json").OrderDescending().Skip(15)) File.Delete(old);
    } finally { fileLock.Release(); }
    return Results.Ok(new {ok = true, message="Cambios guardados"});
});
app.MapPost("/api/admin/upload", async (HttpContext h) => {
    if (Guard(h) is { } err) return err;
    if (!h.Request.HasFormContentType) return Results.BadRequest("Se requiere multipart/form-data");
    var form = await h.Request.ReadFormAsync();
    var f = form.Files.GetFile("file");
    if (f is null || f.Length < 12 || f.Length > 30L*1024*1024) return Results.BadRequest("Archivo vacío o mayor que 30 MB");
    var ext = Path.GetExtension(f.FileName).ToLowerInvariant();
    if (!new[] {".jpg",".jpeg",".png",".webp",".mp4"}.Contains(ext)) return Results.BadRequest("Formato no permitido");
    var uploadDir = Path.Combine(app.Environment.WebRootPath, "uploads");
    Directory.CreateDirectory(uploadDir);
    // Verify file signature, not just filename/content-type.
    var bytes = new byte[Math.Min(16, (int)f.Length)];
    using (var check = f.OpenReadStream()) { await check.ReadExactlyAsync(bytes); }
    bool sig = ext switch {
        ".jpg" or ".jpeg" => bytes[0]==0xff && bytes[1]==0xd8 && bytes[2]==0xff,
        ".png" => bytes.AsSpan(0, 8).SequenceEqual(new byte[]{137,80,78,71,13,10,26,10}),
        ".webp" => Encoding.ASCII.GetString(bytes,0,4)=="RIFF" && Encoding.ASCII.GetString(bytes,8,4)=="WEBP",
        ".mp4" => Encoding.ASCII.GetString(bytes,4,4)=="ftyp",
        _ => false
    };
    if (!sig) return Results.BadRequest("El contenido no coincide con la extensión");
    var name = $"{DateTime.UtcNow:yyyyMMddHHmmss}-{Convert.ToHexString(RandomNumberGenerator.GetBytes(7)).ToLowerInvariant()}{ext}";
    var path = Path.Combine(uploadDir, name);
    await using (var fs = new FileStream(path, FileMode.CreateNew)) await f.CopyToAsync(fs);
    return Results.Ok(new {url = "/uploads/"+name, name=f.FileName});
});

app.MapFallbackToFile("index.html");
app.Run();
