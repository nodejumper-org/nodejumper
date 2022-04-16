import { Injectable } from '@angular/core';
import { CHAINS } from "../data/data";
import { Chain } from "../model/chain";
import { environment } from "../../environments/environment";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class ChainService {

  activeChain?: Chain;

  constructor(private http: HttpClient) {
  }

  getChains(): Chain[] {
    return CHAINS.sort((chain1, chain2) => {
      const chainName1 = chain1.chainName.toLowerCase();
      const chainName2 = chain2.chainName.toLowerCase();
      if (chainName1 > chainName2) { return 1; }
      if (chainName1 < chainName2) { return -1; }
      return 0;
    });
  }

  getChainSummary(apiChainId: string) {
    return this.http.get(`${environment.baseUrl}/api/v1/${apiChainId}/summary`)
  }

  getChainValidators(apiChainId: string) {
    return this.http.get(`${environment.baseUrl}/api/v1/${apiChainId}/validators`)
  }

  getCoingekoSummary(coingekoCoinId: string) {
    return this.http.get(`https://api.coingecko.com/api/v3/coins/${coingekoCoinId}`)
  }

  getCoingekoMarketData(coingekoCoinId: string, timeIntervalDays: number) {
    return this.http.get(`https://api.coingecko.com/api/v3/coins/${coingekoCoinId}/market_chart?vs_currency=usd&days=${timeIntervalDays}&interval=daily`)
  }
}
