import { Component, OnInit } from '@angular/core';
import { Chain } from "../../model/chain";
import { HighlightService } from "../../service/highlight.service";
import { HttpClient } from "@angular/common/http";
import { ChainService } from "../../service/chain.service";

@Component({
  selector: 'app-installation-data',
  templateUrl: './installation-scripts.component.html',
  styleUrls: ['./installation-scripts.component.css']
})
export class InstallationScriptsComponent implements OnInit {

  automaticScriptUrl?: string;
  manualScriptContent?: string;
  testnetInstructionsContent?: string;
  chain?: Chain;
  highlighted = false;

  constructor(private highlightService: HighlightService,
              private http: HttpClient,
              public chainService: ChainService) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.chain = this.chainService.activeChain;
    if (this.chain) {

      const chainNet = this.chain.isTestnet ? "testnet" : "mainnet";
      const chainName = this.chain.chainName.toLowerCase();
      const chainId = this.chain.chainId;
      const binaryName = this.chainService.getChainBinaryName(this.chain);

      this.automaticScriptUrl = `https://raw.githubusercontent.com/nodejumper-org/cosmos-utils/main/${chainNet}/${chainName}/${chainId}-install.sh`

      this.http.get(this.automaticScriptUrl, {responseType: 'text'}).subscribe(data => {

        const trimmedAutomationScriptContent = data
          .split("\nsleep 1\n")[1]
          .split("printLine")[0]
          .split("\n")
          .filter(line => !line.includes("print"))
          .filter(line => !line.includes("bash"))
          .join('\n')
          .replace(new RegExp('\\$CHAIN_ID', 'g'), chainId)
          .trim()
          .replace("\n\n\n", "\n\n");

        this.manualScriptContent = "#!/bin/bash\n\n"
          + "NODE_MONIKER=<YOUR_NODE_MONIKER>\n\n"
          + this.installDependenciesString()
          + trimmedAutomationScriptContent
          + `\n\nsudo journalctl -u ${binaryName} -f --no-hostname -o cat`;
      });

      if (this.chain.isTestnet) {
        const testnetInstructionsUrl = `https://raw.githubusercontent.com/nodejumper-org/cosmos-utils/main/testnet/${chainName}/testnet-instructions.sh`
        this.http.get(testnetInstructionsUrl, {responseType: 'text'}).subscribe(data => {
          this.testnetInstructionsContent = data?.trim() || 'TBD';
        });
      }
    }
  }

  installDependenciesString(): string {
    return 'sudo apt update\n' +
      'sudo apt install -y make gcc jq curl git lz4 build-essential\n' +
      '\n' +
      'if [ ! -f "/usr/local/go/bin/go" ]; then\n' +
      '  bash <(curl -s "https://raw.githubusercontent.com/nodejumper-org/cosmos-utils/main/utils/go_install.sh")\n' +
      '  source .bash_profile\n' +
      'fi\n' +
      '\n' +
      'go version # go version goX.XX.X linux/amd64\n\n';
  }

  ngAfterViewChecked() {
    if (this.chain && !this.chain.isTestnet && this.manualScriptContent && !this.highlighted
      || this.chain && this.chain.isTestnet && this.testnetInstructionsContent && this.manualScriptContent && !this.highlighted) {
      this.highlightService.highlightAll();
      this.highlighted = true;
    }
  }
}
