using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Windows.Forms;

[assembly: AssemblyTitle("Codex 桥接 WorkBuddy 安装程序")]
[assembly: AssemblyProduct("Codex 桥接 WorkBuddy")]
[assembly: AssemblyVersion("4.0.0.0")]
[assembly: AssemblyFileVersion("4.0.0.0")]

internal static class Setup
{
    [STAThread]
    private static int Main(string[] args)
    {
        if (Array.IndexOf(args, "--self-check") >= 0)
        {
            using (Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("app.zip")) return stream != null && stream.Length > 100 ? 0 : 1;
        }
        Application.EnableVisualStyles(); Application.SetCompatibleTextRenderingDefault(false);
        using (var form = new Form())
        {
            form.Text = "Codex 桥接 WorkBuddy · v4.0.0"; form.ClientSize = new Size(560, 285); form.StartPosition = FormStartPosition.CenterScreen; form.FormBorderStyle = FormBorderStyle.FixedDialog; form.MaximizeBox = false;
            form.Font = new Font("Microsoft YaHei UI", 10); form.BackColor = Color.FromArgb(243,245,240);
            var title = new Label { Text = "安装桌面管理窗口", Left = 28, Top = 24, Width = 510, Height = 35, Font = new Font("Microsoft YaHei UI", 17, FontStyle.Bold) };
            var description = new Label { Text = "安装到当前用户目录，创建启动和停止图标。\n不会修改 CC Switch、读取账号或设置开机自启。\n需要已安装 Node.js 22+ 和 Chrome。", Left = 30, Top = 70, Width = 505, Height = 78 };
            var pathLabel = new Label { Text = "安装位置", Left = 30, Top = 156, Width = 120, Height = 22 };
            var location = new TextBox { Text = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "CodexWorkBuddyBridge", "v4.0.0"), Left = 30, Top = 181, Width = 500, ReadOnly = true };
            var button = new Button { Text = "安装并创建桌面图标", Left = 302, Top = 231, Width = 228, Height = 36 };
            button.Click += delegate
            {
                button.Enabled = false;
                try
                {
                    string target = location.Text;
                    if (Directory.Exists(target)) target += "_" + DateTime.Now.ToString("yyyyMMdd_HHmmss_fff");
                    location.Text = target; Directory.CreateDirectory(target);
                    string prefix = Path.GetFullPath(target).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
                    using (Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("app.zip"))
                    using (var archive = new ZipArchive(stream, ZipArchiveMode.Read))
                    {
                        foreach (var entry in archive.Entries)
                        {
                            string destination = Path.GetFullPath(Path.Combine(target, entry.FullName.Replace('/', Path.DirectorySeparatorChar)));
                            if (!destination.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)) throw new InvalidDataException("安装文件路径无效。");
                            if (entry.FullName.EndsWith("/")) { Directory.CreateDirectory(destination); continue; }
                            Directory.CreateDirectory(Path.GetDirectoryName(destination));
                            using (Stream input = entry.Open()) using (Stream output = new FileStream(destination, FileMode.CreateNew)) input.CopyTo(output);
                        }
                    }
                    var info = new ProcessStartInfo(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), "WindowsPowerShell", "v1.0", "powershell.exe"));
                    info.Arguments = "-NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File \"" + Path.Combine(target, "desktop", "Install-Shortcuts.ps1") + "\"";
                    info.UseShellExecute = false; info.CreateNoWindow = true; info.WindowStyle = ProcessWindowStyle.Hidden;
                    info.RedirectStandardError = true; info.RedirectStandardOutput = true;
                    using (var process = Process.Start(info))
                    {
                        process.StandardOutput.ReadToEnd(); string error = process.StandardError.ReadToEnd(); process.WaitForExit();
                        if (process.ExitCode != 0) throw new InvalidOperationException(error);
                    }
                    MessageBox.Show("安装完成。请双击桌面的“Codex 桥接 WorkBuddy v4”打开。\n\n已安装到：" + target, "安装完成", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    form.Close();
                }
                catch (Exception error) { button.Enabled = true; MessageBox.Show(error.Message + "\n已经解压的文件已保留。", "安装未完成", MessageBoxButtons.OK, MessageBoxIcon.Warning); }
            };
            form.Controls.AddRange(new Control[] { title, description, pathLabel, location, button }); Application.Run(form);
        }
        return 0;
    }
}
