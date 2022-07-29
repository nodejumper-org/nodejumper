import { Component, Inject, OnInit } from '@angular/core';
import { Chain } from "../../model/chain";
import { HighlightService } from "../../service/highlight.service";
import { HttpClient } from "@angular/common/http";
import { ChainService } from "../../service/chain.service";
import { DOCUMENT } from "@angular/common";

@Component({
  selector: 'app-installation-data',
  templateUrl: './installation-scripts.component.html',
  styleUrls: ['./installation-scripts.component.css']
})
export class InstallationScriptsComponent implements OnInit {

  automaticScriptUrl?: string;
  manualScriptContent?: string;
  upgradeScriptContent?: string;
  testnetInstructionsContent?: string;
  chain?: Chain;
  highlighted = false;

  constructor(private highlightService: HighlightService,
              private http: HttpClient,
              public chainService: ChainService,
              @Inject(DOCUMENT) private document: Document) {
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
          .split("printCyan \"4. Building binaries...\" && sleep 1\n")[1]
          .split("printLine")[0]
          .split("\n")
          .filter(line => !line.includes("print"))
          .filter(line => !line.includes("bash"))
          .join('\n')
          .replace(new RegExp('\\$CHAIN_ID', 'g'), chainId)
          .trim()
          .replace("\n\n\n", "\n\n")
          .replace("\n\n\n", "\n\n"); // we need to do this twice

        this.manualScriptContent = "#!/bin/bash\n\n"
          + "NODE_MONIKER=<YOUR_NODE_MONIKER>\n\n"
          + trimmedAutomationScriptContent
          + `\n\nsudo journalctl -u ${binaryName} -f --no-hostname -o cat`;
      });

      const upgradeScriptUrl = `https://raw.githubusercontent.com/nodejumper-org/cosmos-utils/main/${chainNet}/${chainName}/upgrade.sh`
      this.http
        .get(upgradeScriptUrl, {responseType: 'text'})
        .subscribe(
          data => this.upgradeScriptContent = data,
          error => console.log(`Missing upgrade script for ${chainName}`)
        );

      if (this.chain.isTestnet) {
        const testnetInstructionsUrl = `https://raw.githubusercontent.com/nodejumper-org/cosmos-utils/main/testnet/${chainName}/testnet-instructions.sh`
        this.http.get(testnetInstructionsUrl, {responseType: 'text'}).subscribe(data => {
          this.testnetInstructionsContent = data?.trim() || 'TBD';
        });
      }
    }
  }

  ngAfterViewChecked() {
    if (this.chain && !this.chain.isTestnet && this.manualScriptContent && !this.highlighted
      || this.chain && this.chain.isTestnet && this.testnetInstructionsContent && this.manualScriptContent && !this.highlighted) {
      this.highlightService.highlightAll();
      this.highlighted = true;
      const tasksLinkElement = document.getElementById('tasks-link');
      if (tasksLinkElement) {
        tasksLinkElement.innerHTML = `<a href="${this.chain.testnetTasksLink}" target="_blank">${this.chain.testnetTasksLink}</a>`;
      }
    }
  }
}
