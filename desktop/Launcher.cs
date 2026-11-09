using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Forms;

[assembly: AssemblyTitle("Codex 桥接 WorkBuddy")]
[assembly: AssemblyProduct("WorkBuddy 增强桥接")]
[assembly: AssemblyVersion("4.0.0.0")]
[assembly: AssemblyFileVersion("4.0.0.0")]

internal static class Launcher
{
    [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
    private static extern int SetCurrentProcessExplicitAppUserModelID(string appId);

    [STAThread]
    private static int Main(string[] args)
    {
        if (Array.IndexOf(args, "--self-check") >= 0) return 0;
        Application.EnableVisualStyles();
        SetCurrentProcessExplicitAppUserModelID("Jack.CodexWorkBuddyBridge.v4");
        bool stop = Array.IndexOf(args, "--stop") >= 0;
        try
        {
            string root = AppDomain.CurrentDomain.BaseDirectory;
            string script = Path.Combine(root, stop ? "Stop-Bridge.ps1" : "Start-Bridge.ps1");
            if (!File.Exists(script)) throw new InvalidOperationException("启动文件不完整，请从完整的 v4 文件夹打开。");
            var info = new ProcessStartInfo();
            info.FileName = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), "WindowsPowerShell", "v1.0", "powershell.exe");
            info.Arguments = "-NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File \"" + script + "\"";
            info.WorkingDirectory = root;
            info.UseShellExecute = false;
            info.CreateNoWindow = true;
            info.WindowStyle = ProcessWindowStyle.Hidden;
            info.RedirectStandardOutput = true;
            info.RedirectStandardError = true;
            var errors = new StringBuilder();
            using (var process = new Process())
            {
                process.StartInfo = info;
                process.OutputDataReceived += delegate(object sender, DataReceivedEventArgs e) { };
                process.ErrorDataReceived += delegate(object sender, DataReceivedEventArgs e) { if (e.Data != null) { lock (errors) errors.AppendLine(e.Data); } };
                process.Start();
                process.BeginOutputReadLine(); process.BeginErrorReadLine();
                if (!process.WaitForExit(50000)) throw new InvalidOperationException("启动仍未完成，请稍后重新打开；可以在项目的 .runtime 文件夹查看日志。");
                process.WaitForExit();
                if (process.ExitCode != 0)
                {
                    string message = errors.ToString().Trim();
                    if (message.Length > 1800) message = message.Substring(0, 1800);
                    throw new InvalidOperationException(message.Length == 0 ? "操作未完成，请检查 .runtime 中的启动日志。" : message);
                }
            }
            if (stop) MessageBox.Show("已通知桥接停止，账号和记录会保留。下次双击“WorkBuddy 积分管理 v4”可重新启动。", "WorkBuddy 积分管理", MessageBoxButtons.OK, MessageBoxIcon.Information);
            return 0;
        }
        catch (Exception error)
        {
            MessageBox.Show(error.Message, "WorkBuddy 积分管理 · 操作未完成", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return 1;
        }
    }
}
