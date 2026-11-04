using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Diagnostics;
using System.Drawing;
using System.Windows.Forms;
using System.Collections.Generic;

namespace PothysGoldPresentation
{
    static class Program
    {
        private const string PrimaryMutexName = "Local\\PothysSwarnaMahalGoldPresentationMutex";
        private const string FallbackMutexName = "PothysSwarnaMahalGoldPresentationMutex";
        private static readonly string PortFilePath = Path.Combine(Path.GetTempPath(), "psm_gold_presentation_port.txt");

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            string baseDir = AppDomain.CurrentDomain.BaseDirectory;

            // 1. Verify existence of critical presentation files
            string indexPath = Path.Combine(baseDir, "index.html");
            string slidesDir = Path.Combine(baseDir, "slides");

            if (!File.Exists(indexPath) || !Directory.Exists(slidesDir))
            {
                MessageBox.Show(
                    "The Gold Presentation files could not be found.\n\n" +
                    "Expected directory:\n" + baseDir + "\n\n" +
                    "Missing components:\n" +
                    (!File.Exists(indexPath) ? " • index.html\n" : "") +
                    (!Directory.Exists(slidesDir) ? " • slides/ folder\n" : "") +
                    "\nPlease make sure Launch_Presentation.exe is located inside the presentation folder.",
                    "Pothys Swarna Mahal — Presentation Startup Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return;
            }

            // 2. Prevent duplicate servers / single instance mutex
            Mutex mutex = null;
            bool createdNew = false;

            try
            {
                mutex = new Mutex(true, PrimaryMutexName, out createdNew);
            }
            catch
            {
                try
                {
                    mutex = new Mutex(true, FallbackMutexName, out createdNew);
                }
                catch
                {
                    createdNew = true;
                }
            }

            try
            {
                if (!createdNew)
                {
                    if (File.Exists(PortFilePath))
                    {
                        try
                        {
                            string portStr = File.ReadAllText(PortFilePath).Trim();
                            int existingPort;
                            if (int.TryParse(portStr, out existingPort))
                            {
                                if (IsPortAlive(existingPort))
                                {
                                    string existingUrl = string.Format("http://127.0.0.1:{0}/index.html", existingPort);
                                    OpenBrowser(existingUrl);
                                    return;
                                }
                            }
                        }
                        catch { }
                    }
                }

                // 3. Start portable presentation server
                PresentationServer server = null;
                try
                {
                    server = new PresentationServer(baseDir);
                    server.Start();

                    try
                    {
                        File.WriteAllText(PortFilePath, server.Port.ToString());
                    }
                    catch { }

                    bool ready = server.WaitForReady(5000);
                    if (!ready)
                    {
                        MessageBox.Show(
                            "Local presentation server started but loopback self-test probe timed out on port " + server.Port + ".\n\n" +
                            "The presentation will still attempt to launch in your browser.",
                            "Presentation Notification",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Warning
                        );
                    }

                    string presentationUrl = string.Format("http://127.0.0.1:{0}/index.html", server.Port);
                    OpenBrowser(presentationUrl);

                    using (TrayContext tray = new TrayContext(server, presentationUrl))
                    {
                        Application.Run(tray);
                    }
                }
                catch (Exception ex)
                {
                    MessageBox.Show(
                        "An unexpected error occurred while starting the presentation server:\n\n" + ex.Message + "\n\n" + ex.StackTrace,
                        "Startup Error",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                }
                finally
                {
                    if (server != null)
                    {
                        server.Stop();
                    }
                    try
                    {
                        if (File.Exists(PortFilePath)) File.Delete(PortFilePath);
                    }
                    catch { }
                }
            }
            finally
            {
                if (mutex != null)
                {
                    try
                    {
                        if (createdNew) mutex.ReleaseMutex();
                        mutex.Dispose();
                    }
                    catch { }
                }
            }
        }

        private static bool IsPortAlive(int port)
        {
            try
            {
                using (TcpClient client = new TcpClient())
                {
                    IAsyncResult ar = client.BeginConnect(IPAddress.Loopback, port, null, null);
                    bool success = ar.AsyncWaitHandle.WaitOne(300);
                    return success && client.Connected;
                }
            }
            catch
            {
                return false;
            }
        }

        public static void OpenBrowser(string url)
        {
            try
            {
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
            catch
            {
                try
                {
                    Process.Start("cmd.exe", "/c start \"\" \"" + url + "\"");
                }
                catch (Exception ex)
                {
                    MessageBox.Show(
                        "Could not launch web browser automatically:\n" + ex.Message + "\n\nPlease open:\n" + url,
                        "Browser Launch",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Information
                    );
                }
            }
        }
    }

    public class PresentationServer
    {
        private readonly string _baseDir;
        private TcpListener _listener;
        private Thread _listenThread;
        private Thread _watchdogThread;
        private volatile bool _isRunning;
        private DateTime _serverStartTime;
        private DateTime _lastHeartbeat;
        private volatile bool _hasReceivedHeartbeat;

        public int Port { get; private set; }

        private static readonly Dictionary<string, string> MimeMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { ".html", "text/html; charset=utf-8" },
            { ".htm", "text/html; charset=utf-8" },
            { ".css", "text/css; charset=utf-8" },
            { ".js", "application/javascript; charset=utf-8" },
            { ".json", "application/json; charset=utf-8" },
            { ".jpg", "image/jpeg" },
            { ".jpeg", "image/jpeg" },
            { ".png", "image/png" },
            { ".gif", "image/gif" },
            { ".svg", "image/svg+xml" },
            { ".ico", "image/x-icon" },
            { ".ttf", "font/ttf" },
            { ".woff", "font/woff" },
            { ".woff2", "font/woff2" },
            { ".otf", "font/otf" },
            { ".mp4", "video/mp4" },
            { ".webp", "image/webp" }
        };

        public PresentationServer(string baseDir)
        {
            _baseDir = Path.GetFullPath(baseDir);
            if (!_baseDir.EndsWith(Path.DirectorySeparatorChar.ToString()))
            {
                _baseDir += Path.DirectorySeparatorChar;
            }
        }

        public void Start()
        {
            int[] preferredPorts = new int[] { 8000, 8080, 8085, 8090, 8100, 8200, 8888, 3000, 5000, 5500, 9000 };

            _listener = null;
            foreach (int candidate in preferredPorts)
            {
                try
                {
                    TcpListener tl = new TcpListener(IPAddress.Loopback, candidate);
                    tl.Start();
                    _listener = tl;
                    Port = candidate;
                    break;
                }
                catch { }
            }

            if (_listener == null)
            {
                _listener = new TcpListener(IPAddress.Loopback, 0);
                _listener.Start();
                Port = ((IPEndPoint)_listener.LocalEndpoint).Port;
            }

            _isRunning = true;
            _serverStartTime = DateTime.UtcNow;
            _lastHeartbeat = DateTime.UtcNow;
            _hasReceivedHeartbeat = false;

            _listenThread = new Thread(ListenLoop) { IsBackground = true, Name = "GoldPresentationServerListener" };
            _listenThread.Start();

            _watchdogThread = new Thread(WatchdogLoop) { IsBackground = true, Name = "GoldPresentationServerWatchdog" };
            _watchdogThread.Start();
        }

        public bool WaitForReady(int timeoutMs)
        {
            int elapsed = 0;
            while (elapsed < timeoutMs)
            {
                try
                {
                    using (TcpClient client = new TcpClient())
                    {
                        IAsyncResult ar = client.BeginConnect(IPAddress.Loopback, Port, null, null);
                        if (ar.AsyncWaitHandle.WaitOne(100) && client.Connected)
                        {
                            return true;
                        }
                    }
                }
                catch { }

                Thread.Sleep(80);
                elapsed += 100;
            }
            return false;
        }

        public void Stop()
        {
            _isRunning = false;
            try
            {
                if (_listener != null) _listener.Stop();
            }
            catch { }
        }

        private void ListenLoop()
        {
            while (_isRunning)
            {
                try
                {
                    TcpClient client = _listener.AcceptTcpClient();
                    ThreadPool.QueueUserWorkItem(ProcessClient, client);
                }
                catch
                {
                    if (!_isRunning) break;
                }
            }
        }

        private void ProcessClient(object state)
        {
            TcpClient client = (TcpClient)state;
            try
            {
                client.ReceiveTimeout = 4000;
                client.SendTimeout = 8000;

                using (NetworkStream stream = client.GetStream())
                {
                    byte[] buffer = new byte[8192];
                    int bytesRead = stream.Read(buffer, 0, buffer.Length);
                    if (bytesRead <= 0) return;

                    string requestHeader = Encoding.UTF8.GetString(buffer, 0, bytesRead);
                    string[] lines = requestHeader.Split(new string[] { "\r\n", "\n" }, StringSplitOptions.None);
                    if (lines.Length == 0) return;

                    string[] requestParts = lines[0].Split(' ');
                    if (requestParts.Length < 2) return;

                    string method = requestParts[0].ToUpperInvariant();
                    string rawUrl = requestParts[1];

                    // API: Heartbeat
                    if (rawUrl.StartsWith("/api/heartbeat", StringComparison.OrdinalIgnoreCase))
                    {
                        _lastHeartbeat = DateTime.UtcNow;
                        _hasReceivedHeartbeat = true;

                        byte[] body = Encoding.UTF8.GetBytes("{\"status\":\"ok\"}");
                        SendResponse(stream, "200 OK", "application/json; charset=utf-8", body, method == "HEAD");
                        return;
                    }

                    // API: Shutdown
                    if (rawUrl.StartsWith("/api/shutdown", StringComparison.OrdinalIgnoreCase))
                    {
                        byte[] body = Encoding.UTF8.GetBytes("{\"status\":\"stopping\"}");
                        SendResponse(stream, "200 OK", "application/json; charset=utf-8", body, method == "HEAD");
                        ThreadPool.QueueUserWorkItem((s) => {
                            Thread.Sleep(1500);
                            Application.Exit();
                        });
                        return;
                    }

                    if (method != "GET" && method != "HEAD")
                    {
                        SendSimpleStatus(stream, "405 Method Not Allowed", "Method Not Allowed");
                        return;
                    }

                    string cleanUrl = rawUrl;
                    int qIdx = cleanUrl.IndexOf('?');
                    if (qIdx >= 0) cleanUrl = cleanUrl.Substring(0, qIdx);
                    int hashIdx = cleanUrl.IndexOf('#');
                    if (hashIdx >= 0) cleanUrl = cleanUrl.Substring(0, hashIdx);

                    cleanUrl = Uri.UnescapeDataString(cleanUrl).Replace('+', ' ').TrimStart('/');
                    if (string.IsNullOrEmpty(cleanUrl)) cleanUrl = "index.html";

                    cleanUrl = cleanUrl.Replace('/', Path.DirectorySeparatorChar);
                    string targetFile = Path.GetFullPath(Path.Combine(_baseDir, cleanUrl));

                    if (!targetFile.StartsWith(_baseDir, StringComparison.OrdinalIgnoreCase))
                    {
                        SendSimpleStatus(stream, "403 Forbidden", "Forbidden");
                        return;
                    }

                    if (!File.Exists(targetFile))
                    {
                        SendSimpleStatus(stream, "404 Not Found", "File Not Found: " + cleanUrl);
                        return;
                    }

                    string ext = Path.GetExtension(targetFile);
                    string mime;
                    if (!MimeMap.TryGetValue(ext, out mime))
                    {
                        mime = "application/octet-stream";
                    }

                    FileInfo fi = new FileInfo(targetFile);
                    long fileLength = fi.Length;

                    string cacheControl = (ext.Equals(".html", StringComparison.OrdinalIgnoreCase) ||
                                          ext.Equals(".htm", StringComparison.OrdinalIgnoreCase) ||
                                          ext.Equals(".js", StringComparison.OrdinalIgnoreCase) ||
                                          ext.Equals(".css", StringComparison.OrdinalIgnoreCase))
                        ? "no-cache, no-store, must-revalidate"
                        : "public, max-age=3600";

                    // Check for Range header
                    string rangeHeader = null;
                    foreach (string line in lines)
                    {
                        if (line.StartsWith("Range:", StringComparison.OrdinalIgnoreCase))
                        {
                            rangeHeader = line.Substring(6).Trim();
                            break;
                        }
                    }

                    if (rangeHeader != null && rangeHeader.StartsWith("bytes=", StringComparison.OrdinalIgnoreCase))
                    {
                        string rangeSpec = rangeHeader.Substring(6).Trim();
                        string[] rParts = rangeSpec.Split('-');
                        long startByte = 0;
                        long endByte = fileLength - 1;

                        if (!string.IsNullOrEmpty(rParts[0]))
                        {
                            long.TryParse(rParts[0], out startByte);
                        }
                        if (rParts.Length > 1 && !string.IsNullOrEmpty(rParts[1]))
                        {
                            long.TryParse(rParts[1], out endByte);
                        }
                        if (endByte >= fileLength) endByte = fileLength - 1;
                        long chunkLength = (endByte - startByte) + 1;

                        StringBuilder hSb = new StringBuilder();
                        hSb.Append("HTTP/1.1 206 Partial Content\r\n");
                        hSb.Append("Content-Type: ").Append(mime).Append("\r\n");
                        hSb.Append("Content-Length: ").Append(chunkLength).Append("\r\n");
                        hSb.Append("Content-Range: bytes ").Append(startByte).Append("-").Append(endByte).Append("/").Append(fileLength).Append("\r\n");
                        hSb.Append("Accept-Ranges: bytes\r\n");
                        hSb.Append("Access-Control-Allow-Origin: *\r\n");
                        hSb.Append("Cache-Control: ").Append(cacheControl).Append("\r\n");
                        hSb.Append("Connection: close\r\n\r\n");

                        byte[] hBytes = Encoding.UTF8.GetBytes(hSb.ToString());
                        stream.Write(hBytes, 0, hBytes.Length);

                        if (method != "HEAD")
                        {
                            using (FileStream fs = new FileStream(targetFile, FileMode.Open, FileAccess.Read, FileShare.Read, 65536))
                            {
                                fs.Seek(startByte, SeekOrigin.Begin);
                                long remaining = chunkLength;
                                byte[] fileBuffer = new byte[65536];
                                while (remaining > 0)
                                {
                                    int toRead = (int)Math.Min(remaining, (long)fileBuffer.Length);
                                    int read = fs.Read(fileBuffer, 0, toRead);
                                    if (read <= 0) break;
                                    stream.Write(fileBuffer, 0, read);
                                    remaining -= read;
                                }
                            }
                        }
                        stream.Flush();
                    }
                    else
                    {
                        StringBuilder headerSb = new StringBuilder();
                        headerSb.Append("HTTP/1.1 200 OK\r\n");
                        headerSb.Append("Content-Type: ").Append(mime).Append("\r\n");
                        headerSb.Append("Content-Length: ").Append(fileLength).Append("\r\n");
                        headerSb.Append("Accept-Ranges: bytes\r\n");
                        headerSb.Append("Connection: close\r\n");
                        headerSb.Append("Access-Control-Allow-Origin: *\r\n");
                        headerSb.Append("Cache-Control: ").Append(cacheControl).Append("\r\n");
                        headerSb.Append("\r\n");

                        byte[] headerBytes = Encoding.UTF8.GetBytes(headerSb.ToString());
                        stream.Write(headerBytes, 0, headerBytes.Length);

                        if (method != "HEAD")
                        {
                            using (FileStream fs = new FileStream(targetFile, FileMode.Open, FileAccess.Read, FileShare.Read, 65536))
                            {
                                byte[] fileBuffer = new byte[65536];
                                int read;
                                while ((read = fs.Read(fileBuffer, 0, fileBuffer.Length)) > 0)
                                {
                                    stream.Write(fileBuffer, 0, read);
                                }
                            }
                        }
                        stream.Flush();
                    }
                }
            }
            catch { }
            finally
            {
                try { client.Close(); } catch { }
            }
        }

        private void SendResponse(NetworkStream stream, string status, string contentType, byte[] body, bool headOnly)
        {
            StringBuilder sb = new StringBuilder();
            sb.Append("HTTP/1.1 ").Append(status).Append("\r\n");
            sb.Append("Content-Type: ").Append(contentType).Append("\r\n");
            sb.Append("Content-Length: ").Append(body.Length).Append("\r\n");
            sb.Append("Connection: close\r\n");
            sb.Append("Access-Control-Allow-Origin: *\r\n\r\n");

            byte[] hBytes = Encoding.UTF8.GetBytes(sb.ToString());
            stream.Write(hBytes, 0, hBytes.Length);
            if (!headOnly && body.Length > 0)
            {
                stream.Write(body, 0, body.Length);
            }
            stream.Flush();
        }

        private void SendSimpleStatus(NetworkStream stream, string status, string message)
        {
            byte[] body = Encoding.UTF8.GetBytes("<html><body><h1>" + status + "</h1><p>" + message + "</p></body></html>");
            SendResponse(stream, status, "text/html; charset=utf-8", body, false);
        }

        private void WatchdogLoop()
        {
            while (_isRunning)
            {
                Thread.Sleep(3000);

                if (_hasReceivedHeartbeat)
                {
                    if ((DateTime.UtcNow - _lastHeartbeat).TotalSeconds > 90)
                    {
                        Application.Exit();
                        break;
                    }
                }
                else
                {
                    if ((DateTime.UtcNow - _serverStartTime).TotalSeconds > 120)
                    {
                        Application.Exit();
                        break;
                    }
                }
            }
        }
    }

    public class TrayContext : ApplicationContext
    {
        private readonly PresentationServer _server;
        private readonly string _url;
        private readonly NotifyIcon _trayIcon;

        public TrayContext(PresentationServer server, string url)
        {
            _server = server;
            _url = url;

            ContextMenu menu = new ContextMenu();

            MenuItem titleItem = new MenuItem("✦ Pothys Swarna Mahal — Gold Presentation");
            titleItem.Enabled = false;
            titleItem.DefaultItem = true;
            menu.MenuItems.Add(titleItem);

            menu.MenuItems.Add(new MenuItem("Port: " + server.Port) { Enabled = false });
            menu.MenuItems.Add("-");

            MenuItem openItem = new MenuItem("Open in Browser", (s, e) => Program.OpenBrowser(_url));
            menu.MenuItems.Add(openItem);

            menu.MenuItems.Add("-");

            MenuItem exitItem = new MenuItem("Exit Presentation", (s, e) => Application.Exit());
            menu.MenuItems.Add(exitItem);

            Icon icon = null;
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string iconPath = Path.Combine(baseDir, "app.ico");
            if (File.Exists(iconPath))
            {
                try { icon = new Icon(iconPath); } catch { }
            }
            if (icon == null)
            {
                icon = SystemIcons.Application;
            }

            _trayIcon = new NotifyIcon
            {
                Icon = icon,
                ContextMenu = menu,
                Text = "✦ Gold Training Presentation (Port " + server.Port + ")",
                Visible = true
            };

            _trayIcon.DoubleClick += (s, e) => Program.OpenBrowser(_url);

            _trayIcon.ShowBalloonTip(
                3000,
                "Gold Training Presentation Ready",
                "Serving presentation at http://127.0.0.1:" + server.Port,
                ToolTipIcon.Info
            );
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing && _trayIcon != null)
            {
                _trayIcon.Visible = false;
                _trayIcon.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}

