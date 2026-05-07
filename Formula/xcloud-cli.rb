class XcloudCli < Formula
  desc "Agent-ready CLI for xCloud Public and Enterprise APIs"
  homepage "https://github.com/xCloudDev/xCloud-cli"
  license "MIT"
  head "https://github.com/xCloudDev/xCloud-cli.git", branch: "main"

  depends_on "node"

  def install
    libexec.install Dir["*"]
    bin.write_node_script libexec/"bin/xcloud.js", "xcloud"
  end

  test do
    assert_match "xcloud - agent-ready CLI", shell_output("#{bin}/xcloud --help")
    output = shell_output("#{bin}/xcloud --output json api post /servers/test/reboot 2>&1", 3)
    assert_match "ConfirmationRequired", output
  end
end
